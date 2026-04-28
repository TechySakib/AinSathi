# ⚖️ আইনসাথী AinSathi - AI Legal Assistant

> **Justice Made Intelligent**
> 
> A secure, professional, and visually immersive AI-powered legal assistant platform specifically tailored for the Bangladesh legal framework.

<div align="center">

[![Next.js](https://img.shields.io/badge/Frontend-Next.js%2014-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/AI-Python%203.10+-3776ab?style=for-the-badge&logo=python)](https://python.org/)
[![Supabase](https://img.shields.io/badge/Database-Supabase-3ecf8e?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

[Features](#-key-features) • [Getting Started](#-getting-started) • [Architecture](#-architecture) • [Documentation](#-documentation)

</div>

---

## ✨ Key Features

### 🎨 **3D Interactive Homepage**
- Stunning "Temple of Justice" immersive experience built with **Three.js**
- Responsive 3D rendering across all devices
- Smooth navigation and intuitive user interface

### 🧠 **RAG-Powered Legal AI**
- Bilingual intelligent chatbot (English & Bengali)
- Complex query handling specific to Bangladesh legal framework
- Context-aware responses with legal citations
- Hybrid integration with custom-trained AI models

### 🔐 **Enterprise-Grade Security**
- Secure authentication powered by **Supabase**
- User management and reliable data persistence
- Privacy-first "Incognito Mode" with ephemeral chat sessions
- PostgreSQL database with vector embeddings support

### 💎 **Premium Design System**
- Deep blue and gold color palette establishing legal authority
- Cohesive design using CSS Modules
- High-end dynamic web design with smooth transitions
- Accessible and responsive across all screen sizes

### 📚 **Knowledge Base Management**
- FAISS/BM25 hybrid retrieval system
- Legal sections dataset (CSV-based)
- Automated RAG index building
- Customizable legal knowledge base

---

## 🛠️ Technology Stack

<table>
<tr>
<td>

### Frontend
- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Three.js** - 3D graphics
- **React Query** - Data fetching
- **CSS Modules** - Styling

</td>
<td>

### Backend
- **FastAPI** - Python web framework
- **Uvicorn** - ASGI server
- **FAISS** - Vector similarity search
- **Qwen Model** - Custom AI model
- **BM25** - Full-text search

</td>
<td>

### Database & Auth
- **Supabase** - PostgreSQL + Auth
- **Supabase Realtime** - Live updates
- **JWT** - Secure tokens
- **Vector DB** - Embeddings storage

</td>
</tr>
</table>

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed on your system:

```bash
✓ Node.js v18 or newer
✓ Python 3.10, 3.11, or 3.12
✓ npm (comes with Node.js)
✓ Git
```

**Verify your installations:**
```bash
node --v25.9.0((v18+)    
Next.js --v16.2.3
python --3.12.10(3.8+)
```

### Quick Start (5 minutes)

#### **Step 1: Clone the Repository**

```bash
git clone (https://github.com/TechySakib/AinSathi)
cd ainsathi
```

#### **Step 2: Install Frontend Dependencies**

```bash
npm install

# If you encounter peer dependency issues, use:
npm install --legacy-peer-deps
```

#### **Step 3: Setup Environment Variables**

Create a `.env.local` file in the project root:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# AI Model Server
LOCAL_MODEL_URL=http://localhost:8001

# Optional: Add any AI API keys if needed
# OPENAI_API_KEY=...
```

> **Note:** Get your Supabase credentials from [supabase.com](https://supabase.com/) → Create a new project

#### **Step 4: Setup Python Backend**

```bash
cd model_server

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate

# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# If FAISS installation fails on Windows:
pip install faiss-cpu --no-cache-dir
```

#### **Step 5: Add the Trained Model**

Place your model files in: `model_server/models/ainsathi_qwen_merged/`

**Required files:**
```
ainsathi_qwen_merged/
├── chat_template.jinja
├── config.json
├── generation_config.json
├── model.safetensors
├── tokenizer.json
└── tokenizer_config.json
```

> If model folder is missing, the backend will not start.

#### **Step 6: Verify & Build RAG Index**

```bash
# Verify legal dataset
python -c "import pandas as pd; df=pd.read_csv('data/legal_sections.csv'); print(f'Rows: {df.shape[0]}')"

# Build RAG index (one-time setup)
python build_index.py

# Expected: "Index built successfully."
```

#### **Step 7: Start the Backend** (Terminal 1)

```bash
# From model_server directory (with venv activated)

# Windows:
$env:MODEL_PORT="8001"
python main.py

# macOS/Linux:
MODEL_PORT=8001 python main.py
```

**Expected output:**
```
Uvicorn running on http://0.0.0.0:8001
```

#### **Step 8: Test Backend Health** (Terminal 2)

```bash
# Test health check
python -c "import requests; print(requests.get('http://localhost:8001/health').text)"

# Expected:
# {"status":"ok","model_loaded":true,"rag_enabled":true}
```

#### **Step 9: Start the Frontend** (Terminal 3)

```bash
# From project root
npm run dev
```

**Expected output:**
```
> next dev

  ▲ Next.js 14.0.0
  - Local:        http://localhost:3000
```

#### **Step 10: Launch the Application**

Open your browser and navigate to: **http://localhost:3000**

Try asking:
```
চুরি কী?
(What is theft?)
```

Expected: Bangla answer with legal citations and sources.

---

## 📁 Project Structure

```
ainsathi/
├── 📄 app/                          # Next.js app directory
│   ├── page.tsx                     # Home page (3D Temple)
│   ├── layout.tsx                   # Root layout
│   └── api/
│       ├── chat/route.ts            # Chat endpoint
│       └── auth/                    # Auth endpoints
├── 📦 components/                   # Reusable React components
│   ├── ChatInterface.tsx
│   ├── TempleOfJustice.tsx          # 3D scene
│   └── ...
├── 🎨 lib/                          # Utilities & helpers
├── 📁 public/                       # Static assets
├── 📋 package.json                  # NPM dependencies
├── ⚙️ .env.local                    # Environment variables
│
├── 🐍 model_server/                 # Python FastAPI Backend
│   ├── main.py                      # FastAPI server
│   ├── retrieval.py                 # RAG logic
│   ├── build_index.py               # Index builder
│   ├── requirements.txt              # Python dependencies
│   │
│   ├── 📊 data/
│   │   └── legal_sections.csv       # Legal knowledge base
│   │
│   ├── 📦 models/
│   │   └── ainsathi_qwen_merged/    # Trained AI model (add manually)
│   │
│   ├── 🏪 rag_store/                # Generated RAG index
│   │   ├── faiss.index
│   │   ├── chunks.jsonl
│   │   └── metadata.json
│   │
│   └── venv/                        # Virtual environment (generated)
│
├── 📖 README.md                     # This file
└── 📝 schema.sql                    # Supabase database schema
```

---

## 🔄 Daily Development Workflow

### **Terminal 1: Start Backend**

```bash
cd model_server
venv\Scripts\activate          # Windows
# or: source venv/bin/activate # macOS/Linux

$env:MODEL_PORT="8001"         # Windows
# or: export MODEL_PORT=8001   # macOS/Linux

python main.py
```

### **Terminal 2: Start Frontend**

```bash
cd ainsathi
npm run dev
```

### **Terminal 3: Optional - Monitor Logs**

```bash
# Test a query
python -c "import requests; print(requests.get('http://localhost:8001/debug-retrieve', params={'q':'চুরি কী'}).text)"
```

---

## 🧪 Testing the System

### **Health Check**
```bash
curl http://localhost:8001/health
```

### **Test Retrieval**
```bash
curl "http://localhost:8001/debug-retrieve?q=চুরি%20কী"
```

### **Test Chat**
```bash
curl -X POST http://localhost:8001/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"চুরি কী?","history":[]}'
```

### **Sample Test Questions**

Use these to verify the system is working:

| Question | Language | Type |
|----------|----------|------|
| চুরি কী? | Bengali | Theft definition |
| চুরির শাস্তি কী? | Bengali | Punishment |
| ধর্ষণ কী? | Bengali | Rape definition |
| What is rape under the Penal Code? | English | Statute search |
| বাংলাদেশের প্রধানমন্ত্রী কে? | Bengali | Out-of-scope (should decline) |

**Expected for out-of-scope questions:**
```
"Insufficient evidence in provided context."
```

---

## 🔧 Configuration & Customization

### **Adjusting Model Response Timeout**

If responses are slow (CPU-based inference), increase the timeout in `app/api/chat/route.ts`:

```typescript
signal: AbortSignal.timeout(300_000)  // 5 minutes
```

### **Updating Legal Knowledge Base**

1. Update `model_server/data/legal_sections.csv` with new legal sections
2. Rebuild the RAG index:
   ```bash
   python build_index.py
   ```
3. Restart the backend

### **Gitignore Recommendations**

```gitignore
# Python
model_server/venv/
__pycache__/
*.pyc
*.pyo

# Generated RAG index (regenerate with build_index.py)
model_server/rag_store/

# Large model files (add manually)
model_server/models/

# Environment
.env
.env.local
.env.*.local

# Node
node_modules/
.next/
dist/
build/

# IDE
.vscode/
.idea/
*.swp
*.swo
```

---

## 🐛 Troubleshooting

### **Problem: "Could not connect to AI model server"**

```bash
# Check if backend is running
curl http://localhost:8001/health

# Make sure port 8001 is not blocked:
# Windows: netstat -ano | findstr :8001
# macOS: lsof -i :8001
# Linux: netstat -tlnp | grep :8001
```

### **Problem: "rag_store not found"**

```bash
cd model_server
python build_index.py
```

### **Problem: "Model folder not found"**

Ensure this directory exists:
```
model_server/models/ainsathi_qwen_merged/
```

Add the trained model files manually.

### **Problem: "/debug-retrieve returns 404"**

Update your `model_server/main.py` to include:
```python
@app.get("/debug-retrieve")
def debug_retrieve(q: str):
    # Implementation
```

### **Problem: "Citations not showing in frontend"**

Ensure `app/api/chat/route.ts` properly stores citations:
```typescript
citations: data.citations ?? []
```

Also test in a **new chat** as old messages may not have citations.

### **Problem: "Very slow responses"**

The model is running on CPU, which is normal. For GPU acceleration:
- Install CUDA-compatible PyTorch
- Update model loading in `main.py` to use GPU
- Adjust `requirements.txt` accordingly

---

## 📚 Database Setup

The project uses **Supabase PostgreSQL** for:

- User authentication and management
- Chat history persistence
- Vector embeddings for RAG
- Session management

### **Initialize Database Schema**

Push `schema.sql` to your Supabase project:

1. Log in to [supabase.com](https://supabase.com/)
2. Select your project
3. Navigate to **SQL Editor**
4. Paste contents of `schema.sql`
5. Execute the query

---

## 🚢 Deployment

### **Frontend (Vercel - Recommended)**

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### **Backend (Render, Heroku, or Custom VPS)**

1. Prepare environment variables
2. Install dependencies: `pip install -r requirements.txt`
3. Run: `MODEL_PORT=8001 python main.py`
4. Set up a reverse proxy (nginx/Apache) if needed

> **Note:** Ensure model files are included in deployment and GPU is available for production.

---

## 📖 API Documentation

### **Chat Endpoint**

```
POST http://localhost:8001/chat
Content-Type: application/json

{
  "message": "চুরি কী?",
  "history": []
}

Response:
{
  "response": "চুরি হল...",
  "citations": [
    {
      "section": "378",
      "act_title": "Penal Code",
      "text": "..."
    }
  ]
}
```

### **Health Endpoint**

```
GET http://localhost:8001/health

Response:
{
  "status": "ok",
  "model_loaded": true,
  "rag_enabled": true
}
```

---

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

1. **Fork the repository**
2. **Create a feature branch:** `git checkout -b feature/amazing-feature`
3. **Commit changes:** `git commit -m 'Add amazing feature'`
4. **Push to branch:** `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### **Development Standards**

- Write clean, well-documented code
- Follow existing code style
- Test thoroughly before submitting
- Update documentation as needed

---

## 📋 Important Notes

### **For Collaborators:**

- `legal_sections.csv` is the knowledge base — keep it updated
- `rag_store/` is generated from CSV — regenerate when data changes
- `models/ainsathi_qwen_merged/` must be added separately (large file)
- Always start **backend before frontend** for chat functionality
- If backend is offline, frontend cannot process queries

### **Files Not in Repository:**

These are usually git-ignored due to size or regeneration:

```
model_server/venv/              # Install locally with pip
model_server/rag_store/         # Rebuild with build_index.py
model_server/models/            # Add trained model manually
node_modules/                   # Install with npm
.env.local                      # Create locally
```

---

## 📜 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## 🙋 Support & Questions

- **Issues:** [GitHub Issues](https://github.com/your-repo/issues)
- **Discussions:** [GitHub Discussions](https://github.com/your-repo/discussions)
- **Email:** nazmus.sakib1@northsouth.edu

---

## 🎯 Roadmap

- [ ] Multi-language support expansion
- [ ] Mobile app (React Native)
- [ ] Advanced legal document analysis
- [ ] Integration with Bangladesh court databases
- [ ] Voice-based queries (Bengali ASR)
- [ ] Real-time legal updates notification
- [ ] Offline mode with cached knowledge base
- [ ] Advanced analytics and user insights

---

<div align="center">

### Made with ⚖️ for justice and clarity

**AinSathi** — Empowering citizens through accessible legal knowledge

[⬆ Back to top](#-আইনসাথী-ainsathi---ai-legal-assistant)

</div>
