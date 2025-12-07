// test-hf.js
const { HfInference } = require("@huggingface/inference");
const path = require("path");
const dotenv = require("dotenv");

// Load .env from current folder
dotenv.config({ path: path.join(__dirname, ".env") });

async function run() {
  try {
    const apiKey =
      process.env.HUGGINGFACEHUB_API_KEY || process.env.HF_API_KEY;

    console.log("Using HF key starting with:", apiKey?.slice(0, 8), "...");

    const hf = new HfInference(apiKey);

    const result = await hf.featureExtraction({
      model: "sentence-transformers/all-MiniLM-L6-v2",
      inputs: "Hello from DocIntel",
    });

    // result can be nested, just print some info
    if (Array.isArray(result)) {
      console.log("HF featureExtraction result type:", typeof result);
      console.log("Result outer length:", result.length);
    } else {
      console.log("HF featureExtraction result object:", typeof result);
    }
  } catch (err) {
    console.error("HF test error:", err);
  }
}

run();
