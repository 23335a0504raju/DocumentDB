require("dotenv").config();
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const documentRoutes = require("./routes/documents");
const path = require("path");
const ragRoutes = require("./routes/rag");
const queryRoutes = require("./routes/queries");

dotenv.config();

const app = express();
app.use(
  cors({
    origin: ['http://localhost:3000', 'https://document-db.vercel.app'],
    credentials: true,
  })
);

app.use(express.json());

// Test route
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Backend is running" });
});

// Auth routes
app.use("/auth", authRoutes);
app.use("/", userRoutes); 
app.use("/documents", documentRoutes); 
app.use("/rag", ragRoutes);
app.use("/queries", queryRoutes);

// DB connect + start server same as before...
async function startServer() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB Atlas");

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`🚀 Server is listening on port ${PORT}`);
    });
  } catch (err) {
    console.error("❌ Error connecting to MongoDB Atlas:", err.message);
    process.exit(1);
  }
}
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
startServer();
