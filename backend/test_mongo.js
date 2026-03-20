const mongoose = require("mongoose");

const uri = "mongodb+srv://smilyraju8464:Raju%404004@documentdb.lhnkmk8.mongodb.net/doc-intel-hub?retryWrites=true&w=majority&appName=DocumentDB";

console.log("Attempting to connect to:", uri);

mongoose.connect(uri)
  .then(() => {
    console.log("✅ Success! Connected.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Connection failed:", err.message);
    if (err.cause) console.error("Cause:", err.cause);
    process.exit(1);
  });
