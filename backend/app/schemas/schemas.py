from datetime import datetime
from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field

# --- Session Schemas ---
class SessionCreate(BaseModel):
    title: Optional[str] = "New Conversation"
    model_provider: Optional[str] = "ollama"
    model_name: Optional[str] = "llama3:latest"

class SessionResponse(BaseModel):
    id: str
    title: str
    model_provider: str
    model_name: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# --- Artifact Schemas ---
class ArtifactResponse(BaseModel):
    id: str
    message_id: Optional[str] = None
    session_id: str
    type: str  # "html", "markdown", "javascript", "svg"
    title: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True

# --- Message Schemas ---
class MessageResponse(BaseModel):
    id: str
    session_id: str
    role: str
    content: str
    skill_used: Optional[str] = None
    metadata_json: Optional[str] = None
    created_at: datetime
    artifacts: List[ArtifactResponse] = []

    class Config:
        from_attributes = True

class SessionDetailResponse(SessionResponse):
    messages: List[MessageResponse] = []

# --- Chat Request & Stream Schemas ---
class ChatStreamRequest(BaseModel):
    session_id: str
    message: str
    provider: Optional[str] = None  # "ollama" or "openrouter"
    model: Optional[str] = None
    skill: Optional[str] = None  # "auto", "qa", "ship30for30", "artifact"

# --- Settings Schemas ---
class OpenRouterSettings(BaseModel):
    api_key: str = ""
    default_model: str = "anthropic/claude-3.5-sonnet"
    available_models: List[str] = [
        "anthropic/claude-3.5-sonnet",
        "openai/gpt-4o-mini",
        "meta-llama/llama-3.3-70b-instruct"
    ]

class OllamaSettings(BaseModel):
    base_url: str = "http://localhost:11434"
    default_model: str = "llama3:latest"

class DatabaseSettings(BaseModel):
    url: str = "sqlite+aiosqlite:///./lenny_db.sqlite"

class SettingsResponse(BaseModel):
    active_provider: str = "ollama"
    openrouter: OpenRouterSettings
    ollama: OllamaSettings
    database: DatabaseSettings

class SettingsUpdate(BaseModel):
    active_provider: Optional[str] = None
    openrouter_api_key: Optional[str] = None
    openrouter_default_model: Optional[str] = None
    ollama_base_url: Optional[str] = None
    ollama_default_model: Optional[str] = None

class HealthResponse(BaseModel):
    status: str
    database: str
    ollama_status: str
    openrouter_configured: bool
    version: str = "1.0.0"
