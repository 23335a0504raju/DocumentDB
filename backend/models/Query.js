// models/Query.js
const mongoose = require("mongoose");

const querySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    question: {
      type: String,
      required: true,
    },
    answer: {
      type: String,
      required: true,
    },
    sources: [
      {
        documentId: String,
        documentName: String,
        textSnippet: String,
        sourceNumber: Number,
      },
    ],
  },
  {
    timestamps: true, // createdAt, updatedAt
  }
);

module.exports = mongoose.model("Query", querySchema);
