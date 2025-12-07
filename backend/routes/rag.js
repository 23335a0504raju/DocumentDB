// routes/rag.js
const express = require("express");
const authMiddleware = require("../middleware/auth");
const { queryUserDocuments } = require("../services/ragService");
const Query = require("../models/Query");

const router = express.Router();

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// POST /rag/query
// Only returns top matching chunks (no LLM)
router.post("/query", authMiddleware, async (req, res) => {
  try {
    const { question } = req.body;

    if (!question || !question.trim()) {
      return res.status(400).json({ message: "Question is required" });
    }

    const userId = req.user.userId;

    // 🔍 Get top chunks from all user's docs
    const results = await queryUserDocuments(userId, question, 5);

    const sources = results.map((doc, i) => ({
      text: doc.pageContent,
      documentId: doc.metadata?.documentId,
      documentName: doc.metadata?.originalName,
      sourceNumber: i + 1,
    }));

    return res.json({
      question,
      sources,
    });
  } catch (err) {
    console.error("Error in /rag/query:", err);
    return res.status(500).json({
      message: "RAG query failed",
      error: err.message || "Unknown error",
    });
  }
});

// POST /rag/answer
// Full RAG: retrieve docs + call OpenRouter + save query in DB
router.post("/answer", authMiddleware, async (req, res) => {
  try {
    const { question, documentId } = req.body;

    if (!question || !question.trim()) {
      return res.status(400).json({ message: "Question is required" });
    }

    if (!OPENROUTER_API_KEY) {
      return res.status(500).json({
        message: "OPENROUTER_API_KEY is not set in environment variables",
      });
    }

    const userId = req.user.userId;

    // 1) Retrieve top chunks with LangChain, optionally filtered by documentId
    const results = await queryUserDocuments(
      userId,
      question,
      5,
      documentId || null
    );

    if (!results.length) {
      return res.status(400).json({
        message: "No relevant documents found for this user.",
      });
    }


    // 2) Build context text for the LLM
    const contextText = results
      .map((doc, i) => {
        const sourceName = doc.metadata?.originalName || `Document ${i + 1}`;
        return `Source ${i + 1} (${sourceName}):\n${doc.pageContent}`;
      })
      .join("\n\n----------------\n\n");

    const prompt = `
You are an AI assistant that answers questions ONLY using the provided document context.
If the answer is not clearly in the context, say "I couldn't find that in the documents."

Question:
${question}

Context:
${contextText}

Instructions:
- Answer in clear, concise sentences.
- Do NOT guess beyond the context.
- If possible, mention which source numbers you used.
`;

    // 3) Call OpenRouter Chat API
    const modelId = "amazon/nova-2-lite-v1:free"; // or any other free model you enabled

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        // OpenRouter recommends these:
        "HTTP-Referer": "http://localhost:3000", // change if deployed
        "X-Title": "DocIntel RAG App",
      },
      body: JSON.stringify({
        model: modelId,
        messages: [
          {
            role: "system",
            content:
              "You are a helpful assistant for question answering over user-uploaded documents.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenRouter error:", response.status, errorText);
      return res.status(500).json({
        message: "OpenRouter request failed",
        error: `Status ${response.status}: ${errorText}`,
      });
    }

    const data = await response.json();
    const answer =
      data.choices?.[0]?.message?.content ||
      "I couldn't generate an answer from the documents.";

    // 4) Prepare sources for UI
    const sources = results.map((doc, i) => ({
      text: doc.pageContent,
      documentId: doc.metadata?.documentId,
      documentName: doc.metadata?.originalName,
      sourceNumber: i + 1,
    }));

    // 5) Save query + answer + sources into MongoDB
    try {
      await Query.create({
        userId,
        question,
        answer,
        sources: sources.map((s) => ({
          documentId: s.documentId || null,
          documentName: s.documentName || "Unknown document",
          textSnippet: (s.text || "").slice(0, 300),
          sourceNumber: s.sourceNumber,
        })),
      });
    } catch (saveErr) {
      console.error("Failed to save query history:", saveErr.message);
      // don't block the response to user if history saving fails
    }

    return res.json({
      question,
      answer,
      sources,
    });
  } catch (err) {
    console.error("Error in /rag/answer:", err);
    return res.status(500).json({
      message: "RAG answer generation failed",
      error: err.message || "Unknown error",
    });
  }
});

module.exports = router;
