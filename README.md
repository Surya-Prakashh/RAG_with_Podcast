# 🚀 The Lenny Growth Assistant

**The Lenny Growth Assistant** is an agentic, full-stack conversational web application that ingests transcripts from *Lenny's Podcast*, answers product management and growth questions strictly grounded in guest insights with citations, synthesizes content into **Ship30for30** atomic essays, toggles dynamically between Cloud LLMs (via **OpenRouter API**) and Local LLMs (via **Ollama**), and renders interactive code/markdown artifacts side-by-side in a modern ChatGPT-like workspace.

---

## 🔑 How to Switch to OpenRouter & Set API Key

*:

### Method 1: Directly in the Web UI (Recommended — Zero Restarts!)
1. Open the application in your browser at **`http://localhost:5173`**.
2. Click the **Settings Gear ⚙️** icon in the top right of the navigation bar.
3. In the Settings Drawer:
   - Click **OpenRouter (Cloud)** under *Active LLM Engine Provider*.
   - Enter your OpenRouter API key (`sk-or-v1-...`) in the **OpenRouter API Key** field.
   - Choose your preferred cloud model (e.g. `anthropic/claude-3.5-sonnet` or `openai/gpt-4o-mini`).
   - Click **Save Configuration**.
4. The system will save your settings dynamically to `settings.json` and switch engines instantly without requiring a server restart!

```
+-------------------------------------------------------------+
| ⚙️ Engine & System Settings                                  |
+-------------------------------------------------------------+
| Active LLM Engine Provider:                                 |
| [ Ollama (Local) ]  [ 🟣 OpenRouter (Cloud) <- CLICK HERE ] |
|                                                             |
| 🔑 OpenRouter Cloud Configuration:                          |
| OpenRouter API Key: [ sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxx  ] |
| Cloud Model:        [ anthropic/claude-3.5-sonnet   v ]     |
|                                                             |
|                      [ 💾 Save Configuration ]              |
+-------------------------------------------------------------+
```

---

### Method 2: Via `settings.json` Configuration File
Edit `settings.json` located in the root project directory:

```json
{
  "active_provider": "openrouter",
  "openrouter": {
    "api_key": "sk-or-v1-YOUR_ACTUAL_OPENROUTER_KEY_HERE",
    "default_model": "anthropic/claude-3.5-sonnet",
    "available_models": [
      "anthropic/claude-3.5-sonnet",
      "openai/gpt-4o-mini",
      "meta-llama/llama-3.3-70b-instruct"
    ]
  },
  "ollama": {
    "base_url": "http://localhost:11434",
    "default_model": "llama3:latest"
  },
  "database": {
    "url": "sqlite+aiosqlite:///./lenny_db.sqlite"
  }
}
```

---

### Method 3: Via `.env` File
Create or edit `.env` in the root project directory:

```env
ACTIVE_PROVIDER=openrouter
OPENROUTER_API_KEY=sk-or-v1-YOUR_ACTUAL_OPENROUTER_KEY_HERE
OPENROUTER_DEFAULT_MODEL=anthropic/claude-3.5-sonnet
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3:latest
```

---

## 🌟 Key Features

- **Strict Transcript Q&A via ChromaDB**: Answers product & growth questions using a persistent **ChromaDB** vector database indexing **27,413 transcript chunks** across **390+ Lenny's Podcast episodes** with guest & episode citations.
- **Ship30for30 Essay Skill**: Synthesizes deep podcast insights into a structured ~1250-word atomic essay (strong hook, bold skimmability, bulleted pillars, clear takeaways).
- **Interactive Side-by-Side Artifact Viewer**: Renders generated HTML/CSS code or Markdown documents live in a side-by-side split screen workspace with sandboxed execution.
- **Dual LLM Provider Toggle**: Switch seamlessly between Cloud models (via OpenRouter API key) and Local models (via Ollama).
- **Mem0 Long-Term User Memory**: Automatically extracts, persists, and injects user profile facts, role, domain, and preferences across ALL chat sessions (`backend/user_memories.json`).
- **Impeccable.style Premium UI**: Dark obsidian glassmorphism design system inspired by Impeccable.style, featuring glowing borders, luminous gradients, micro-animations, and responsive split workspace layouts.
- **AI Safety & Topic Guardrails**: Real-time prompt injection defense, out-of-domain topic grounding, and RAG vector similarity threshold filtering to prevent hallucinations.
- **FastAPI + Database Persistence**: Manages session history, conversations, metadata, and embeddings persistently in PostgreSQL (Supabase / Railway) or local SQLite.

---

## 🛠️ Step-by-Step Commands to Run & Deploy Locally

### Step 1: Install Dependencies

#### Backend Dependencies (Python 3.11+):
```bash
# Navigate to backend directory
cd backend

# Install Python requirements
pip install -r requirements.txt
```

#### Frontend Dependencies (Node.js 18+):
```bash
# Navigate to frontend directory
cd frontend

# Install npm packages
npm install
```

---

### Step 2: Ingest Podcast Transcripts into Vector Store

Before starting the server, run the transcript ingestion script to populate the vector database with embeddings from Lenny's Podcast:

```bash
# Run from root project directory
python backend/scripts/ingest_transcripts.py
```
*Output:* `[SUCCESS] Ingestion Complete! 15 total transcript chunks indexed in database vector store.`

---

### Step 3: Run Servers

#### Terminal 1 — Start FastAPI Backend Server (Port 8000):
```bash
# If running from root directory:
python -m uvicorn backend.app.main:app --reload --port 8000

# Or if inside backend/ directory:
uvicorn app.main:app --reload --port 8000
```
> **Note on `[WinError 10013]` / Port 8000 in use**: If you see `[WinError 10013]` when starting uvicorn, **the backend server is already running on port 8000**! You can test it at `http://localhost:8000/api/health`. If you want to kill and restart it, run: `npx kill-port 8000`.

- API Health Check: `http://localhost:8000/api/health`
- Interactive OpenAPI Docs: `http://localhost:8000/docs`

#### Terminal 2 — Start React + Vite Frontend Server (Port 5173):
```bash
cd frontend
npm run dev
```
- Open application in browser: **`http://localhost:5173`**

---

## 🤖 Model Settings & Engine Routing Details

### 1. Provider Resolution Order
When a chat message is sent, the engine determines the active provider in the following order:
1. **Request Header / Payload Override**: User selection in UI skill pills.
2. **`settings.json` Configuration**: Value of `"active_provider"` (`"openrouter"` or `"ollama"`).
3. **Environment Variable**: `ACTIVE_PROVIDER` from `.env`.

### 2. Available Models & Switching

| Provider | Supported Models | Base URL / Endpoint |
| :--- | :--- | :--- |
| **OpenRouter (Cloud)** | `anthropic/claude-3.5-sonnet`, `openai/gpt-4o-mini`, `meta-llama/llama-3.3-70b-instruct` | `https://openrouter.ai/api/v1` |
| **Ollama (Local)** | `llama3:latest`, `qwen2.5:7b`, `mistral:latest` | `http://localhost:11434` |

- **Local Ollama Daemon Detection**: The backend automatically polls `http://localhost:11434/api/tags` to list installed local models and displays an **online/offline status dot** in the top navigation bar.

---

## 📋 Where to See System & Application Logs

You can inspect system activity, API requests, vector search queries, and LLM streaming logs in **4 convenient locations**:

### 1. Directly in the Web UI (Interactive Log Drawer)
- Open **`http://localhost:5173`** in your browser.
- Click the **Terminal Icon 💻** in the top navigation bar.
- An interactive modal will open displaying the last 200 real-time backend and agent logs, with buttons to **Refresh**, **Copy**, or **Download** log files.

### 2. In the Backend Log File (Persistent Disk Storage)
- **Path**: `backend/logs/app.log` (Relative to project root: `d:\Pinhead\backend\logs\app.log`)
- Rotates automatically at 5MB with 3 backup history files.

### 3. In the Terminal Console (STDOUT)
- When running `uvicorn app.main:app --reload --port 8000`, formatted timestamped logs print directly to standard output.

### 4. Via REST API Endpoint
- Send a GET request to **`http://localhost:8000/api/logs?lines=150`** to retrieve system logs in JSON format.

---

## 📂 Repository Layout

```
.
├── PRD.md                       # Product Requirements Document
├── design.md                    # Detailed UI/UX Design System Specification
├── architecture.md              # Technical Architecture & DB ER Diagram
├── README.md                    # Quickstart & Configuration Guide
├── settings.json                # Runtime configuration (API keys, models, DB URL)
├── .env.example                 # Environment variables template
├── agent_transcripts/           # AI Coding Agent build logs (01_backend & 02_frontend)
├── backend/                     # FastAPI Backend Application
│   ├── app/
│   │   ├── main.py              # FastAPI entrypoint & SSE stream router
│   │   ├── config.py            # Dynamic settings manager
│   │   ├── db/                  # Async SQLAlchemy models & session factory
│   │   ├── llm/                 # LLM Providers (OpenRouter API & Ollama)
│   │   ├── rag/                 # Transcript Ingestor, Splitter & Vector Retriever
│   │   ├── agents/              # Router Agent & Skill Prompts (Q&A, Ship30for30, Artifact)
│   │   └── schemas/             # Pydantic data models
│   ├── scripts/
│   │   └── ingest_transcripts.py # Transcript vector indexing script
│   └── requirements.txt
└── frontend/                    # React + Vite Workspace
    ├── src/
    │   ├── components/          # Navbar, Sidebar, ChatWindow, ArtifactViewer, SettingsModal
    │   ├── context/             # React ChatContext State Manager
    │   ├── styles/              # Dark Glassmorphism Design System CSS
    │   ├── App.jsx
    │   └── main.jsx
    └── package.json
```
