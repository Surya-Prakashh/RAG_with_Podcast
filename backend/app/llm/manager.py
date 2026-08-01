from typing import Tuple, Dict, Any, List
import httpx
from app.config import get_settings_data
from app.llm.provider_base import BaseLLMProvider
from app.llm.openrouter_provider import OpenRouterProvider
from app.llm.ollama_provider import OllamaProvider

def get_llm_provider(provider_override: str = None, model_override: str = None) -> Tuple[BaseLLMProvider, str]:
    """
    Returns (provider_instance, target_model_name).
    Loads configuration dynamically from settings.json / env.
    """
    settings_data = get_settings_data()
    active_provider = (provider_override or settings_data.get("active_provider") or "ollama").lower()

    if active_provider == "openrouter":
        openrouter_cfg = settings_data.get("openrouter", {})
        api_key = openrouter_cfg.get("api_key", "")
        default_model = openrouter_cfg.get("default_model", "anthropic/claude-3.5-sonnet")
        target_model = model_override or default_model
        return OpenRouterProvider(api_key=api_key, default_model=default_model), target_model
    else:
        ollama_cfg = settings_data.get("ollama", {})
        base_url = ollama_cfg.get("base_url", "http://localhost:11434")
        default_model = ollama_cfg.get("default_model", "llama3:latest")
        target_model = model_override or default_model
        return OllamaProvider(base_url=base_url, default_model=default_model), target_model

async def fetch_available_models() -> Dict[str, Any]:
    """Fetches available cloud and local models for UI model selection dropdown."""
    settings_data = get_settings_data()
    openrouter_models = settings_data.get("openrouter", {}).get("available_models", [
        "anthropic/claude-3.5-sonnet",
        "openai/gpt-4o-mini",
        "meta-llama/llama-3.3-70b-instruct"
    ])
    
    ollama_base_url = settings_data.get("ollama", {}).get("base_url", "http://localhost:11434")
    ollama_models = []
    ollama_online = False

    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            resp = await client.get(f"{ollama_base_url.rstrip('/')}/api/tags")
            if resp.status_code == 200:
                ollama_online = True
                models_data = resp.json().get("models", [])
                ollama_models = [m.get("name") for m in models_data]
    except Exception:
        ollama_online = False

    if not ollama_models:
        ollama_models = [settings_data.get("ollama", {}).get("default_model", "llama3:latest")]

    return {
        "active_provider": settings_data.get("active_provider", "ollama"),
        "openrouter": {
            "configured": bool(settings_data.get("openrouter", {}).get("api_key")),
            "default_model": settings_data.get("openrouter", {}).get("default_model"),
            "available_models": openrouter_models
        },
        "ollama": {
            "online": ollama_online,
            "base_url": ollama_base_url,
            "default_model": settings_data.get("ollama", {}).get("default_model"),
            "available_models": ollama_models
        }
    }
