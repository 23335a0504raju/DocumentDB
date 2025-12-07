// services/ragService.js
const path = require("path");
const fs = require("fs");

const { PDFLoader } = require("langchain/document_loaders/fs/pdf");
const { RecursiveCharacterTextSplitter } = require("langchain/text_splitter");
const { MemoryVectorStore } = require("langchain/vectorstores/memory");
const { Embeddings } = require("langchain/embeddings/base");
const { HfInference } = require("@huggingface/inference");

const DocumentModel = require("../models/Document");



// 🔑 Custom embeddings class using HuggingFace, with batched calls
// 🔑 Custom embeddings class using HuggingFace, with batched calls
class HFCustomEmbeddings extends Embeddings {
  constructor(fields = {}) {
    super();

    // Always resolve the API key here, from either fields or env
    this.apiKey =
      fields.apiKey ||
      process.env.HUGGINGFACEHUB_API_KEY ||
      process.env.HF_API_KEY;

    if (!this.apiKey) {
      console.error("❌ HFCustomEmbeddings: No API key found in env!");
    } else {
      console.log(
        "HFCustomEmbeddings using API key prefix:",
        this.apiKey.slice(0, 8),
        "..."
      );
    }

    this.model = fields.model || "sentence-transformers/all-MiniLM-L6-v2";
    this.client = new HfInference(this.apiKey);
  }

  // For multiple texts (documents) - batch in ONE request
  async embedDocuments(texts) {
    try {
      const res = await this.client.featureExtraction({
        model: this.model,
        inputs: texts, // array of strings
      });

      // res should be an array of vectors: [ [..], [..], ... ]
      return res.map((vec) => {
        const v = Array.isArray(vec[0]) ? vec[0] : vec;
        return v.map(Number);
      });
    } catch (error) {
      console.error("❌ HF embedDocuments error:", error);
      throw error;
    }
  }

  // For a single query string
  async embedQuery(text) {
    try {
      const res = await this.client.featureExtraction({
        model: this.model,
        inputs: text,
      });
      const vec = Array.isArray(res[0]) ? res[0] : res;
      return vec.map(Number);
    } catch (error) {
      console.error("❌ HF embedQuery error:", error);
      throw error;
    }
  }
}



// ✅ Use our custom HF embeddings (free)
const embeddings = new HFCustomEmbeddings({
  model: "sentence-transformers/all-MiniLM-L6-v2",
  // no apiKey here; constructor reads from env
});

// Extract text from file depending on mimeType
async function extractTextFromFile(filePath, mimeType) {
  if (mimeType === "application/pdf") {
    // Use LangChain's PDFLoader
    const loader = new PDFLoader(filePath);
    const docs = await loader.load();
    return docs.map((d) => d.pageContent).join("\n\n");
  }

  if (mimeType === "text/plain") {
    const buffer = fs.readFileSync(filePath);
    return buffer.toString("utf8");
  }

  throw new Error(`Unsupported mimeType for text extraction: ${mimeType}`);
}

// Main function: process one document (currently not used in upload, but kept for later)
async function processDocument(doc) {
  try {
    console.log("🧠 [LangChain] Starting processing for document:", doc._id.toString());

    // 1) Locate file on disk
    const uploadsDir = path.join(__dirname, "..", "uploads");
    const filePath = path.join(uploadsDir, doc.storedFilename);

    if (!fs.existsSync(filePath)) {
      throw new Error("File not found on disk: " + filePath);
    }

    // 2) Extract text
    const fullText = await extractTextFromFile(filePath, doc.mimeType);
    if (!fullText || !fullText.trim()) {
      throw new Error("No text extracted from document");
    }

    // 3) Chunk text with LangChain splitter
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 500,
      chunkOverlap: 100,
    });

    const docs = await splitter.createDocuments([fullText]);
    console.log(`📚 [LangChain] Created ${docs.length} chunks for document ${doc._id}`);

    // 4) Create in-memory vector store with LangChain
    const vectorStore = await MemoryVectorStore.fromDocuments(docs, embeddings);
    console.log("✅ [LangChain] Vector store created in memory for document", doc._id.toString());

    await DocumentModel.findByIdAndUpdate(doc._id, {
      status: "ready",
    });
  } catch (err) {
    console.error("❌ [LangChain] Error in processDocument:", err.message);
    await DocumentModel.findByIdAndUpdate(doc._id, {
      status: "error",
    });
  }
}

// Build a vector store for all READY documents of a user
async function buildVectorStoreForUser(userId) {
  console.log("🔎 [LangChain] Building vector store for user:", userId.toString());

  // 1) Get all ready docs for this user
  const docsMeta = await DocumentModel.find({
    userId,
    status: "ready",
  });

  if (!docsMeta.length) {
    throw new Error("No ready documents for this user.");
  }

  const allDocs = [];
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 500,
    chunkOverlap: 100,
  });

  // 2) For each doc: load text, chunk, attach metadata, collect
  for (const meta of docsMeta) {
    const uploadsDir = path.join(__dirname, "..", "uploads");
    const filePath = path.join(uploadsDir, meta.storedFilename);

    if (!fs.existsSync(filePath)) {
      console.warn("⚠️ File missing on disk, skipping:", filePath);
      continue;
    }

    const fullText = await extractTextFromFile(filePath, meta.mimeType);
    if (!fullText || !fullText.trim()) {
      console.warn("⚠️ No text extracted for doc, skipping:", meta._id.toString());
      continue;
    }

    const chunks = await splitter.createDocuments([fullText]);

    // Attach metadata so we can return doc name later
    for (const c of chunks) {
      c.metadata = {
        documentId: meta._id.toString(),
        originalName: meta.originalName,
      };
    }

    allDocs.push(...chunks);
  }

  if (!allDocs.length) {
    throw new Error("No chunks available to build vector store.");
  }

  console.log("🧱 [LangChain] Total chunks for user:", allDocs.length);

  // 3) Create vector store from all chunks using our custom embeddings
  const vectorStore = await MemoryVectorStore.fromDocuments(allDocs, embeddings);
  return vectorStore;
}

// Run a similarity search over all user docs
async function queryUserDocuments(userId, question, k = 5,documentId = null) {
  const vectorStore = await buildVectorStoreForUser(userId);
  const results = await vectorStore.similaritySearch(question, k);
  return results;
}

module.exports = {
  processDocument,
  buildVectorStoreForUser,
  queryUserDocuments,
};
