import os
import json
from pathlib import Path
from typing import Dict, Any, Optional
from pydantic_settings import BaseSettings
from app.logger import logger

SETTINGS_FILE = Path(__file__).resolve().parent.parent.parent / "settings.json"

class Settings(BaseSettings):
    active_provider: str = "ollama"
    openrouter_api_key: str = ""
    openrouter_default_model: str = "anthropic/claude-3.5-sonnet"
    ollama_base_url: str = "http://localhost:11434"
    ollama_default_model: str = "llama3:latest"
    database_url: str = "sqlite+aiosqlite:///./lenny_db.sqlite"

    class Config:
        env_file = ".env"
        extra = "ignore"

def get_settings_data() -> Dict[str, Any]:
    """Reads settings from settings.json if it exists, otherwise falls back to defaults."""
    if SETTINGS_FILE.exists():
        try:
            with open(SETTINGS_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                return data
        except Exception as e:
            logger.error(f"Error reading settings.json: {e}")
    
    return {
        "active_provider": os.getenv("ACTIVE_PROVIDER", "ollama"),
        "openrouter": {
            "api_key": os.getenv("OPENROUTER_API_KEY", ""),
            "default_model": os.getenv("OPENROUTER_DEFAULT_MODEL", "anthropic/claude-3.5-sonnet"),
            "available_models": [
                "anthropic/claude-3.5-sonnet",
                "openai/gpt-4o-mini",
                "meta-llama/llama-3.3-70b-instruct"
            ]
        },
        "ollama": {
            "base_url": os.getenv("OLLAMA_BASE_URL", "http://localhost:11434"),
            "default_model": os.getenv("OLLAMA_MODEL", "llama3:latest")
        },
        "database": {
            "url": os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./lenny_db.sqlite")
        }
    }

def save_settings_data(data: Dict[str, Any]) -> None:
    """Saves updated settings data to settings.json."""
    try:
        with open(SETTINGS_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
        logger.info(f"Updated runtime settings: provider={data.get('active_provider')}")
    except Exception as e:
        logger.error(f"Failed to save settings.json: {e}")

settings = Settings()
