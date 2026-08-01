# Technical Architecture & System Specification (`architecture.md`)

## System Architecture Overview

"The Lenny Growth Assistant" is built using a decoupled client-server architecture:
- **Frontend**: React 18 + Vite SPA with scoped CSS design system and server-sent event (SSE) streaming listener.
- **Vector Store & Database Layer**: Persistent **ChromaDB** vector database indexing 27,400+ transcript chunks from 390+ *Lenny's Podcast* episodes, alongside PostgreSQL / SQLite session persistence.
- **AI Infrastructure**: Flexible provider architecture supporting **OpenRouter API** (Cloud) and **Ollama** (Local LLM via `http://localhost:11434`).

---

## 🗄️ Database Schema & Entities

```mermaid
erDiagram
    SESSIONS ||--o{ MESSAGES : contains
    SESSIONS ||--o{ ARTIFACTS : owns
    MESSAGES ||--o{ ARTIFACTS : generates

    SESSIONS {
        uuid id PK
        string title
        string model_provider
        string model_name
        timestamp created_at
        timestamp updated_at
    }

    MESSAGES {
        uuid id PK
        uuid session_id FK
        string role
        text content
        string skill_used
        jsonb metadata
        timestamp created_at
    }

    ARTIFACTS {
        uuid id PK
        uuid message_id FK
        uuid session_id FK
        string type
        string title
        text content
        timestamp created_at
    }

    TRANSCRIPT_CHUNKS {
        uuid id PK
        string episode_title
        string guest_name
        int chunk_index
        text content
        vector_384 embedding
    }
```

---

## 🔌 FastAPI REST & SSE API Endpoints

### 1. Chat & Session Management
- `POST /api/sessions`: Create a new session.
- `GET /api/sessions`: List all chat sessions sorted by updated timestamp.
- `GET /api/sessions/{session_id}`: Fetch session details and all historical messages.
- `DELETE /api/sessions/{session_id}`: Delete a session and associated messages/artifacts.
- `POST /api/chat/stream`: SSE Streaming Endpoint. Accepts `{ session_id, message, mode, provider, model }`. Streams back SSE chunks (`event: message`, `event: artifact`, `event: done`).

### 2. Artifact Management
- `GET /api/artifacts/{artifact_id}`: Retrieve a specific artifact.
- `GET /api/sessions/{session_id}/artifacts`: List all artifacts generated within a chat session.

### 3. Dynamic System Settings
- `GET /api/settings`: Read current runtime configuration from `settings.json`.
- `PUT /api/settings`: Update runtime settings (OpenRouter API key, Ollama URL/models, active provider).
- `GET /api/models`: Inspect available Cloud models (via OpenRouter) and detect active local Ollama models (`http://localhost:11434/api/tags`).

### 4. Knowledge Ingestion & RAG
- `POST /api/ingest`: Trigger transcript ingestion & embedding generation script.

---

## 🛡️ AI Guardrails Subsystem (`backend/app/agents/guardrails.py`)

1. **Prompt Injection & Jailbreak Defense**: Evaluates incoming queries against regex patterns for system prompt overrides, DAN jailbreaks, or filter bypasses. Intercepts malicious inputs before sending to the LLM.
2. **Domain & Topic Grounding**: Soft-checks user prompts for relevance to Product Management, Growth, Metrics, Leadership, and Tech strategy. Gently redirects off-topic queries.
3. **RAG Grounding Relevance Filter**: Filters retrieved vector chunks to ensure they meet a minimum similarity score threshold (`min_score_threshold = 0.15`), preventing hallucinations when no relevant transcript context exists.

---

## 🤖 Agentic Routing & Skills Logic

```
                          +-------------------------+
                          | User Input Request Payload|
                          +------------+------------+
                                       |
                                       v
                          +-------------------------+
                          |  AI Guardrail Evaluator |
                          +------------+------------+
                                       |
                                       v
                          +-------------------------+
                          |   Agent Intent Router   |
                          +------------+------------+
                                       |
           +---------------------------+---------------------------+
           |                           |                           |
           v                           v                           v
+---------------------+     +---------------------+     +---------------------+
|   Lenny Q&A Skill   |     |  Ship30for30 Skill  |     |   Artifact Skill    |
| - Embed Query       |     | - RAG Podcast Context|    | - Generate HTML/CSS |
| - Cosine Vector Search|   | - Atomic Essay Format|    |   or Markdown       |
| - Extract Passages  |     | - Hook, 3-5 Pillars |    | - Tag <artifact>    |
| - Grounded Citation |     | - ~1250 words       |     | - Side-by-side view |
+----------+----------+     +----------+----------+     +----------+----------+
           |                           |                           |
           +---------------------------+---------------------------+
                                       |
                                       v
                          +-------------------------+
                          | Unified LLM Streamer    |
                          | (OpenRouter / Ollama)   |
                          +-------------------------+
```

---

## ⚙️ Configuration Specification (`settings.json`)

```json
{
  "active_provider": "ollama",
  "openrouter": {
    "api_key": "",
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
    "url": "postgresql+asyncpg://postgres:postgres@localhost:5432/lenny_db"
  }
}
```
