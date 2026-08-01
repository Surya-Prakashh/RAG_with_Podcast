# Product Requirements Document (PRD)

## Product Name: The Lenny Growth Assistant
**Version:** 1.0.0  
**Target Role:** AI-Powered Growth & Product Management Assistant  
**Stack:** React + Vite (Frontend), FastAPI (Backend), PostgreSQL + `pgvector` (Database & Vector Store), OpenRouter API / Local Ollama (LLM Engines).

---

## 🎯 Executive Summary & Vision

**The Lenny Growth Assistant** is an agentic, full-stack conversational web application designed to ingest and synthesize knowledge from *Lenny's Podcast* transcripts (https://github.com/ChatPRD/lennys-podcast-transcripts). The application empowers Product Managers, Growth Leads, and Founders to ask complex Q&A questions strictly grounded in world-class advice from Lenny's guests, generate structured high-converting content in the **Ship30for30** atomic essay style, and generate/preview interactive HTML/CSS code or Markdown artifacts side-by-side in a modern ChatGPT-like workspace.

---

## 🚀 Key User Personas & Problems Addressed

1. **Product Managers & Growth Engineers**:
   - *Need*: Quick, accurate answers grounded in real-world podcast insights (e.g., Shreyas Doshi on frameworks, Brian Balfour on growth loops, Elena Verna on PLG) without manually reading hundreds of transcript hours.
   - *Solution*: RAG Q&A Agent with exact guest/episode citations and direct transcript excerpts.

2. **Growth Content Creators & Writers**:
   - *Need*: Synthesizing deep product insights into digestible, high-engagement content for social media or newsletters.
   - *Solution*: "Ship30for30" Content Generation Skill that transforms transcript knowledge into ~1250-word atomic essays with high skimmability, bold callouts, and bulleted takeaways.

3. **Software Builders & Evaluators**:
   - *Need*: Generate frontend UI components or structured specs and preview them immediately within the application.
   - *Solution*: Side-by-Side Artifact Viewer with live HTML/CSS sandbox rendering and Markdown viewer.

---

## 🛠️ Core Functional Requirements

### 1. API & Session Management (FastAPI)
- **Session Lifecycle**: User can create, rename, list, and delete chat sessions ("New Chat" pattern). Each session maintains isolated context history.
- **Persistence**: All conversations, message roles (user, assistant, system), used skills, and generated artifacts are stored in PostgreSQL (Supabase/Railway compatible).
- **Streaming**: Responses must stream in real-time using Server-Sent Events (SSE).

### 2. Flexible Dual LLM Provider Engine
- **Cloud LLM**: OpenRouter API (`https://openrouter.ai/api/v1`) providing access to models like `anthropic/claude-3.5-sonnet`, `openai/gpt-4o-mini`, and `meta-llama/llama-3.3-70b-instruct`.
- **Local LLM (Mandatory for Demo)**: Local Ollama instance (`http://localhost:11434`) running models such as `llama3`, `mistral`, or `qwen2.5`.
- **Dynamic Switch & Configuration**: `settings.json` file and dynamic settings drawer UI to switch providers and update API keys/model names on the fly without server restart.

### 3. Knowledge Base & Vector RAG Pipeline
- Ingestion script to download and parse transcripts from `https://github.com/ChatPRD/lennys-podcast-transcripts`.
- Text chunking (semantic headers / speaker turns) with metadata (guest name, episode title, timestamp).
- Embedding generation using `sentence-transformers/all-MiniLM-L6-v2` stored in PostgreSQL with `pgvector` extension.
- Strict Q&A Agent grounding: Answers strictly based on retrieved transcripts with mandatory citations.

### 4. Specialized Agent Skills
- **Skill 1: Lenny Podcast Q&A**: Fact-based Q&A with episode citations.
- **Skill 2: Ship30for30 Essay Synthesizer**: Formats outputs as a ~1250-word atomic essay (Hook, 3-5 core pillars, skimmable bold text, actionable takeaways).
- **Skill 3: Artifact Generator**: Outputs interactive HTML/CSS UI components, SVG diagrams, or markdown outlines enclosed in `<artifact type="..." title="...">` tags.

### 5. Frontend UI/UX & Side-by-Side Artifact Viewer
- Dark glassmorphic modern layout (ChatGPT/Claude style).
- Collapsible sidebar with chat history and new chat creation.
- Dual-panel workspace: Chat interface on the left, interactive Artifact Preview panel on the right.
- Live HTML sandbox using standard iframe preview with sandbox security controls.

---

## ⚡ Non-Functional Requirements

- **Performance**: Response streaming start time under 1.5 seconds for cloud models and under 3 seconds for local Ollama.
- **Robustness**: Graceful fallbacks when Ollama is offline or OpenRouter API key is invalid/missing.
- **Code Quality**: Modular separation of concerns (FastAPI routers, LLM provider classes, RAG retriever, React modular components).
