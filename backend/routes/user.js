// routes/user.js
const express = require("express");
const authMiddleware = require("../middleware/auth");
const User = require("../models/User");

const router = express.Router();

// GET /me - return current user's info from DB
router.get("/me", authMiddleware, async (req, res) => {
  try {
    // req.user.userId was set in authMiddleware based on JWT
    const user = await User.findById(req.user.userId).select("-passwordHash");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "Current user data",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    console.error("Error in /me:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
