// routes/queries.js
const express = require("express");
const authMiddleware = require("../middleware/auth");
const Query = require("../models/Query");

const router = express.Router();

// GET /queries  -> all queries for current user (latest first)
router.get("/", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;

    const queries = await Query.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50); // limit for safety

    return res.json({ queries });
  } catch (err) {
    console.error("Error in GET /queries:", err.message);
    return res.status(500).json({
      message: "Failed to fetch queries",
      error: err.message,
    });
  }
});

module.exports = router;
