// routes/documents.js
// const { processDocument } = require("../services/ragService");

const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const authMiddleware = require("../middleware/auth");
const Document = require("../models/Document");

const router = express.Router();

// Ensure uploads folder exists
const uploadFolder = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadFolder)) {
  fs.mkdirSync(uploadFolder);
}

// Configure Multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadFolder);
  },
  filename: function (req, file, cb) {
    // e.g. 1699999999999-originalname.pdf
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  },
});

// Accept only pdf or text
function fileFilter(req, file, cb) {
  const allowedMimeTypes = ["application/pdf", "text/plain"];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only PDF and text files are allowed"), false);
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
});

// POST /documents/upload
router.post(
  "/upload",
  authMiddleware,
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

        const doc = await Document.create({
        userId: req.user.userId,
        originalName: req.file.originalname,
        storedFilename: req.file.filename,
        mimeType: req.file.mimetype,
        size: req.file.size,
        status: "ready", // 👈 directly mark ready for now
        });

        res.status(201).json({
        message: "File uploaded successfully.",
        document: doc,
        });
    } catch (err) {
      console.error("Error in /documents/upload:", err.message);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// GET /documents/my
router.get("/my", authMiddleware, async (req, res) => {
  try {
    const docs = await Document.find({ userId: req.user.userId })
      .sort({ createdAt: -1 });

    res.json({ documents: docs });
  } catch (err) {
    console.error("Error in /documents/my:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});
// routes/documents.js
router.delete('/:id', authMiddleware, async (req, res) => {
  const userId = req.user.userId;
  const { id } = req.params;

  const doc = await Document.findOne({ _id: id, userId });
  if (!doc) return res.status(404).json({ message: 'Document not found' });

  // delete file from disk...
  // fs.unlinkSync(pathToFile);

  await doc.deleteOne();
  res.json({ message: 'Document deleted' });
});


module.exports = router;
