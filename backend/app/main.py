import json
import asyncio
from typing import AsyncGenerator
from fastapi import FastAPI, Depends, HTTPException, status, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from sse_starlette.sse import EventSourceResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete

from app.config import get_settings_data, save_settings_data
from app.db.database import get_db, init_db, AsyncSessionLocal
from app.db.models import SessionModel, MessageModel, ArtifactModel, TranscriptChunkModel
from app.schemas.schemas import (
    SessionCreate, SessionResponse, SessionDetailResponse,
    MessageResponse, ArtifactResponse, ChatStreamRequest,
    SettingsResponse, SettingsUpdate, HealthResponse
)
from app.llm.manager import get_llm_provider, fetch_available_models
from app.rag.retriever import retrieve_relevant_transcript_chunks
from app.rag.ingestor import ingest_transcripts_into_db
from app.agents.router import classify_intent
from app.agents.prompts import (
    LENNY_QA_SYSTEM_PROMPT,
    SHIP30FOR30_SYSTEM_PROMPT,
    ARTIFACT_GENERATOR_SYSTEM_PROMPT
)
from app.agents.artifact_parser import save_artifacts_for_message, extract_artifacts_from_text
from app.agents.guardrails import validate_input_prompt, verify_grounding_relevance
from app.agents.user_memory import user_memory_engine
from app.logger import logger, read_latest_logs

app = FastAPI(
    title="The Lenny Growth Assistant API",
    description="FastAPI Backend for Lenny Growth Assistant conversational web app.",
    version="1.0.0"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def on_startup():
    logger.info("Initializing Database and API startup lifecycle...")
    await init_db()
    # Auto-seed transcript embeddings if database table is empty
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(TranscriptChunkModel))
        if not result.scalars().first():
            logger.info("Auto-seeding core Lenny Podcast transcripts into database and ChromaDB...")
            await ingest_transcripts_into_db(db)

# --- Mem0 User Memory Endpoints ---
@app.get("/api/memories")
async def get_user_memories():
    return {"memories": user_memory_engine.get_all_memories()}

@app.delete("/api/memories")
async def clear_user_memories():
    user_memory_engine.clear_memories()
    return {"message": "Memories cleared"}

# --- Log Viewer Endpoint ---
@app.get("/api/logs")
async def get_system_logs(lines: int = 150):
    """Retrieves system logs for inspection in the UI or via API."""
    return {"logs": read_latest_logs(lines=lines)}

# --- Health Check ---
@app.get("/api/health", response_model=HealthResponse)
async def health_check(db: AsyncSession = Depends(get_db)):
    models_info = await fetch_available_models()
    settings_data = get_settings_data()
    openrouter_key = bool(settings_data.get("openrouter", {}).get("api_key"))

    logger.info("Health check ping requested.")
    return HealthResponse(
        status="ok",
        database="connected",
        ollama_status="online" if models_info["ollama"]["online"] else "offline",
        openrouter_configured=openrouter_key
    )

# --- Settings & Models Endpoints ---
@app.get("/api/settings", response_model=SettingsResponse)
async def read_settings():
    return get_settings_data()

@app.put("/api/settings", response_model=SettingsResponse)
async def update_settings(payload: SettingsUpdate):
    data = get_settings_data()
    if payload.active_provider:
        data["active_provider"] = payload.active_provider
    if payload.openrouter_api_key is not None:
        data.setdefault("openrouter", {})["api_key"] = payload.openrouter_api_key
    if payload.openrouter_default_model:
        data.setdefault("openrouter", {})["default_model"] = payload.openrouter_default_model
    if payload.ollama_base_url:
        data.setdefault("ollama", {})["base_url"] = payload.ollama_base_url
    if payload.ollama_default_model:
        data.setdefault("ollama", {})["default_model"] = payload.ollama_default_model

    save_settings_data(data)
    return data

@app.get("/api/models")
async def get_models():
    return await fetch_available_models()

# --- Session Management Endpoints ---
@app.post("/api/sessions", response_model=SessionResponse, status_code=status.HTTP_201_CREATED)
async def create_session(payload: SessionCreate = None, db: AsyncSession = Depends(get_db)):
    title = payload.title if payload and payload.title else "New Conversation"
    provider = payload.model_provider if payload and payload.model_provider else "ollama"
    model_name = payload.model_name if payload and payload.model_name else "llama3:latest"

    session = SessionModel(
        title=title,
        model_provider=provider,
        model_name=model_name
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return session

@app.get("/api/sessions", response_model=list[SessionResponse])
async def list_sessions(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(SessionModel).order_by(SessionModel.updated_at.desc()))
    return result.scalars().all()

@app.get("/api/sessions/{session_id}", response_model=SessionDetailResponse)
async def get_session(session_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(SessionModel).where(SessionModel.id == session_id))
    session = result.scalars().first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Fetch messages and artifacts
    msg_result = await db.execute(
        select(MessageModel)
        .where(MessageModel.session_id == session_id)
        .order_by(MessageModel.created_at.asc())
    )
    messages = msg_result.scalars().all()
    
    session_dict = {
        "id": session.id,
        "title": session.title,
        "model_provider": session.model_provider,
        "model_name": session.model_name,
        "created_at": session.created_at,
        "updated_at": session.updated_at,
    }
    msg_list = []
    for msg in messages:
        art_result = await db.execute(select(ArtifactModel).where(ArtifactModel.message_id == msg.id))
        arts = art_result.scalars().all()
        msg_dict = {
            "id": msg.id,
            "session_id": msg.session_id,
            "role": msg.role,
            "content": msg.content,
            "skill_used": msg.skill_used,
            "metadata_json": msg.metadata_json,
            "created_at": msg.created_at,
            "artifacts": [
                {
                    "id": a.id,
                    "message_id": a.message_id,
                    "session_id": a.session_id,
                    "type": a.type,
                    "title": a.title,
                    "content": a.content,
                    "created_at": a.created_at
                }
                for a in arts
            ]
        }
        msg_list.append(msg_dict)
    
    session_dict["messages"] = msg_list
    return session_dict

@app.delete("/api/sessions/{session_id}")
async def delete_session(session_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(SessionModel).where(SessionModel.id == session_id))
    session = result.scalars().first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    await db.delete(session)
    await db.commit()
    return {"message": "Session deleted successfully"}

# --- Artifact Endpoints ---
@app.get("/api/artifacts/{artifact_id}", response_model=ArtifactResponse)
async def get_artifact(artifact_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ArtifactModel).where(ArtifactModel.id == artifact_id))
    art = result.scalars().first()
    if not art:
        raise HTTPException(status_code=404, detail="Artifact not found")
    return art

@app.get("/api/sessions/{session_id}/artifacts", response_model=list[ArtifactResponse])
async def list_session_artifacts(session_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ArtifactModel).where(ArtifactModel.session_id == session_id))
    return result.scalars().all()

# --- Ingestion Endpoint ---
@app.post("/api/ingest")
async def trigger_ingestion(db: AsyncSession = Depends(get_db)):
    total = await ingest_transcripts_into_db(db)
    return {"status": "success", "chunks_ingested": total}

# --- Streaming Chat SSE Handler ---
@app.post("/api/chat/stream")
async def chat_stream(request: ChatStreamRequest, db: AsyncSession = Depends(get_db)):
    # 1. Fetch Session
    result = await db.execute(select(SessionModel).where(SessionModel.id == request.session_id))
    session = result.scalars().first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Update session model/provider if overridden
    if request.provider:
        session.model_provider = request.provider
    if request.model:
        session.model_name = request.model
    await db.commit()

    # 2. Save User Message
    user_message = MessageModel(
        session_id=request.session_id,
        role="user",
        content=request.message
    )
    db.add(user_message)
    await db.commit()
    await db.refresh(user_message)

    # --- AI Guardrail Evaluation ---
    is_safe, is_in_domain, refusal_reason = validate_input_prompt(request.message)
    if not is_safe or (not is_in_domain and refusal_reason):
        logger.info(f"Guardrail intercepted message for session {request.session_id}")
        async def guardrail_sse_generator():
            yield {
                "event": "meta",
                "data": json.dumps({
                    "session_id": request.session_id,
                    "skill": "guardrail",
                    "provider": session.model_provider,
                    "model": session.model_name,
                    "citations": []
                })
            }
            yield {
                "event": "token",
                "data": json.dumps({"token": refusal_reason})
            }
            assistant_msg = MessageModel(
                session_id=request.session_id,
                role="assistant",
                content=refusal_reason,
                skill_used="guardrail",
                metadata_json=json.dumps({"citations": []})
            )
            db.add(assistant_msg)
            await db.commit()
            yield {
                "event": "done",
                "data": json.dumps({"message_id": assistant_msg.id, "status": "completed"})
            }
        return EventSourceResponse(guardrail_sse_generator())

    # 3. Instantiate LLM Provider
    llm_provider, target_model = get_llm_provider(
        provider_override=request.provider,
        model_override=request.model
    )

    # 4. Classify Intent & Select Skill
    detected_skill = await classify_intent(
        user_message=request.message,
        llm_provider=llm_provider,
        skill_override=request.skill
    )

    # 5. Fetch & Filter RAG Context
    rag_chunks = []
    formatted_context = ""
    if detected_skill in ["qa", "ship30for30"]:
        raw_chunks = await retrieve_relevant_transcript_chunks(db, query=request.message, top_k=4)
        has_relevant, rag_chunks = verify_grounding_relevance(raw_chunks, min_score_threshold=0.15)
        if rag_chunks:
            formatted_context = "\n\n".join([
                f"--- Episode: {c['episode_title']} (Guest: {c['guest_name']}) ---\n{c['content']}"
                for c in rag_chunks
            ])

    # --- Mem0 User Memory Fact Extraction ---
    user_memory_engine.extract_and_store_facts(request.message)

    # 6. Select System Prompt
    if detected_skill == "ship30for30":
        system_prompt = SHIP30FOR30_SYSTEM_PROMPT.format(context=formatted_context or "General product growth principles.")
    elif detected_skill == "artifact":
        system_prompt = ARTIFACT_GENERATOR_SYSTEM_PROMPT
    elif detected_skill == "qa":
        system_prompt = LENNY_QA_SYSTEM_PROMPT.format(context=formatted_context or "General podcast transcripts.")
    else:
        system_prompt = "You are The Lenny Growth Assistant, a helpful AI advisor."

    # Append Mem0 Long-Term User Memory Profile
    system_prompt += user_memory_engine.format_memory_prompt_context()

    # Fetch prior message history for conversation context (up to last 10 messages)
    history_result = await db.execute(
        select(MessageModel)
        .where(MessageModel.session_id == request.session_id)
        .order_by(MessageModel.created_at.asc())
    )
    history_msgs = history_result.scalars().all()
    formatted_history = []
    for m in history_msgs[-10:]:
        formatted_history.append({"role": m.role, "content": m.content})

    async def sse_event_generator():
        # Yield metadata event first
        meta_event = {
            "event": "meta",
            "data": json.dumps({
                "session_id": request.session_id,
                "skill": detected_skill,
                "provider": session.model_provider,
                "model": target_model,
                "citations": [
                    {"guest": c["guest_name"], "episode": c["episode_title"], "score": round(c["score"], 3)}
                    for c in rag_chunks
                ]
            })
        }
        yield meta_event

        full_assistant_response = []
        try:
            async for token in llm_provider.stream_chat(
                messages=formatted_history,
                system_prompt=system_prompt,
                model_name=target_model
            ):
                full_assistant_response.append(token)
                yield {
                    "event": "token",
                    "data": json.dumps({"token": token})
                }
        except Exception as e:
            err_msg = f"\n[Stream Execution Error: {str(e)}]"
            full_assistant_response.append(err_msg)
            yield {"event": "token", "data": json.dumps({"token": err_msg})}

        complete_response_text = "".join(full_assistant_response)

        # Save Assistant Message to DB
        metadata_json = json.dumps({
            "citations": [
                {"guest": c["guest_name"], "episode": c["episode_title"]}
                for c in rag_chunks
            ]
        })
        assistant_message = MessageModel(
            session_id=request.session_id,
            role="assistant",
            content=complete_response_text,
            skill_used=detected_skill,
            metadata_json=metadata_json
        )
        db.add(assistant_message)
        await db.commit()
        await db.refresh(assistant_message)

        # Update session title if default
        if session.title in ["New Conversation", "New Chat"] and len(history_msgs) <= 2:
            snippet = request.message[:35] + ("..." if len(request.message) > 35 else "")
            session.title = snippet
            await db.commit()

        # Parse & Save Artifacts if present
        saved_artifacts = await save_artifacts_for_message(
            db=db,
            session_id=request.session_id,
            message_id=assistant_message.id,
            full_text=complete_response_text
        )

        for art in saved_artifacts:
            yield {
                "event": "artifact",
                "data": json.dumps({
                    "id": art.id,
                    "type": art.type,
                    "title": art.title,
                    "content": art.content
                })
            }

        yield {
            "event": "done",
            "data": json.dumps({"message_id": assistant_message.id, "status": "completed"})
        }

    return EventSourceResponse(sse_event_generator())
