
# 📄 DocIntel – Intelligent Document Search & RAG System

DocIntel is a full-stack AI application that lets users:

✅ Upload documents (PDF, TXT)  
✅ Index and chunk text using LangChain  
✅ Search across personal documents using RAG (Retrieval-Augmented Generation)  
✅ Get answers from a Large Language Model (OpenRouter)  
✅ View supporting document sources  
✅ Maintain searchable query history  
✅ Preview / Download / Delete uploaded files  

---

## 🧱 Tech Overview

It is built with:

- **Frontend:** React (Vite + Tailwind)  
- **Backend:** Node.js + Express  
- **Database:** MongoDB Atlas  
- **LLM:** OpenRouter API  
- **Hosting:** Render (Backend), Vercel (Frontend)  

---

## 🚀 Live Deployment

| Service    | URL                                          |
|-----------|----------------------------------------------|
| Frontend  | https://document-db.vercel.app              |
| Backend   | https://your-backend-url.onrender.com       |
| Health    | `GET /health` → `{ "status": "ok" }`        |


---

## 🏗️ Features

### 🗂️ Document Upload & Management

- Upload **PDF** or **TXT**
- Stored on server using **Multer**
- Document metadata saved in **MongoDB**
- **Preview / Download / Delete** options

### 🔍 AI Document Search

- Ask questions about your own documents
- Uses **vector search + RAG**
- Context is built from top chunks
- Answer generated using **OpenRouter LLM**
- UI shows:
  - AI answer
  - Supporting sources & excerpts

### 🧠 Query History

- Every **question + answer** is saved
- View previous queries
- Copy / delete / feedback options (like/dislike)
- Filter & search

### 🖥️ Dashboard Overview

Visual stats:

- Total documents  
- Processed documents  
- Total queries  
- Recent uploads  

---

## 🛠️ Tech Stack

### Frontend

- React (Vite)  
- Axios  
- TailwindCSS  
- MUI Icons  

### Backend

- Node.js / Express  
- MongoDB + Mongoose  
- Multer (file upload)  
- LangChain  
- OpenRouter API (LLM)  

---

## 📦 Folder Structure

```bash
project/
├── backend/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── uploads/     <-- file storage
│   └── server.js
└── frontend/
    ├── src/
    ├── components/
    ├── pages/
    └── api.js
````

---

## 🔧 Installation & Setup

### 1️⃣ Clone the repo

```bash
git clone https://github.com/your-username/document-db.git
cd document-db
```

---

### 2️⃣ Backend Setup

```bash
cd backend
npm install
```

Create `.env` in `/backend`:

```env
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_jwt_secret
OPENROUTER_API_KEY=your_key_here
CLIENT_URL=https://document-db.vercel.app
```

Run locally:

```bash
npm start
```

---

### 3️⃣ Frontend Setup

```bash
cd frontend
npm install
```

Create `.env` in `/frontend`:

```env
VITE_API_URL=https://your-backend-url.onrender.com
```

Run locally:

```bash
npm run dev
```

---

## 🚀 Deployment

### Backend → Render

1. Create a **Web Service** from your GitHub repo.

2. Set **Root directory** to `backend` (if Render asks).

3. Set environment variables in Render dashboard:

   * `MONGO_URI`
   * `JWT_SECRET`
   * `OPENROUTER_API_KEY`
   * `CLIENT_URL` (e.g. your Vercel URL)

4. Build command:

   ```bash
   npm install
   ```

5. Start command:

   ```bash
   node server.js
   ```

6. Make sure this line exists in `server.js` to serve uploads:

   ```js
   app.use("/uploads", express.static(path.join(__dirname, "uploads")));
   ```

---

### Frontend → Vercel

1. Import the project from GitHub.

2. Set **Root directory** to `frontend`.

3. Add env variable:

   ```env
   VITE_API_URL=https://your-backend-url.onrender.com
   ```

4. Deploy.

---

## 📁 Upload & File Serving

Uploads live in:

```text
backend/uploads
```

They can be viewed like:

```text
https://your-backend-url.onrender.com/uploads/<storedFilename>
```

---

## 🔐 Authentication

* JWT stored in `localStorage`
* All protected routes use:

```http
Authorization: Bearer <token>
```

---

## 🧠 RAG + LLM Pipeline (How It Works)

1. User asks a question.

2. Backend fetches relevant document chunks using **vector embeddings**.

3. Combines them into a **context block**.

4. Sends to OpenRouter model with a system prompt like:

   > "You are an assistant. Only answer using the provided context..."

5. LLM returns the answer.

6. Response is saved in **MongoDB** (along with references & metadata).

---

## 📜 Example Answer

**Question:**

> What does the resume say about experience?

**Answer:**

> It mentions experience as a Frontend Intern at Pit Solutions from Dec 2022 to May 2023.

**Sources:**

* `ResumeSoftware.pdf`
* `Ch_Raju_Software_Resume.pdf`

---

## 🤖 Models Supported (Free)

Works with OpenRouter models such as:

* `amazon/nova-2-lite-v1:free`
* `meta-llama/llama-3.1-8b-instruct:free`
* `gpt-mini:free`

---

## ❌ Common Issues & Fixes

### Files not opening from Vercel?

**Wrong:**

```text
https://document-db.vercel.app/uploads/file.pdf
```

**Correct:**

```text
https://your-backend-url.onrender.com/uploads/file.pdf
```

---

## 🧪 Health Check

```http
GET /health
```

Response:

```json
{ "status": "ok" }
```

---

## 🧹 Cleanup

* You can delete orphaned metadata (documents in DB whose files are missing on server).
* Consider moving file storage to S3 or similar for production.

---

## 📅 Roadmap

* Full-text search across documents
* Support for DOCX
* Auto-embedding immediately after upload
* Sharing documents between users

---

## 🤝 Contributing

Pull requests are welcome!
Open an issue to discuss improvements or feature requests.

---

## 🪪 License

**MIT License** – Free to use & modify.

---

## 🙌 Author

Built with ❤️ and AI.
Maintained by **Your Name**.

````
git add README.md
git commit -m "Add project README"
git push
````
