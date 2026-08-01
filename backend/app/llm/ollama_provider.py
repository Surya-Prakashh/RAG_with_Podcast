import json
from typing import AsyncGenerator, List, Dict, Any
import httpx
from app.llm.provider_base import BaseLLMProvider
from app.logger import logger

class OllamaProvider(BaseLLMProvider):
    def __init__(self, base_url: str = "http://localhost:11434", default_model: str = "llama3:latest"):
        self.base_url = base_url.rstrip("/")
        self.default_model = default_model

    async def stream_chat(
        self,
        messages: List[Dict[str, str]],
        system_prompt: str = "",
        model_name: str = ""
    ) -> AsyncGenerator[str, None]:
        model = model_name or self.default_model
        logger.info(f"Ollama streaming request started using model '{model}' at {self.base_url}")

        payload_messages = []
        if system_prompt:
            payload_messages.append({"role": "system", "content": system_prompt})
        payload_messages.extend(messages)

        payload = {
            "model": model,
            "messages": payload_messages,
            "stream": True,
            "options": {
                "temperature": 0.7
            }
        }

        async with httpx.AsyncClient(timeout=120.0) as client:
            try:
                async with client.stream("POST", f"{self.base_url}/api/chat", json=payload) as response:
                    if response.status_code != 200:
                        error_body = await response.aread()
                        err_msg = f"Ollama Error ({response.status_code}): {error_body.decode('utf-8', errors='ignore')}"
                        logger.error(err_msg)
                        yield f"[{err_msg}]"
                        return

                    async for line in response.aiter_lines():
                        if line:
                            try:
                                chunk_data = json.loads(line)
                                msg = chunk_data.get("message", {})
                                content = msg.get("content")
                                if content:
                                    yield content
                                if chunk_data.get("done"):
                                    logger.info("Ollama stream finished successfully.")
                                    break
                            except json.JSONDecodeError:
                                continue
            except httpx.ConnectError:
                err_msg = f"Ollama Connection Failed: Ollama daemon is not running at {self.base_url}."
                logger.error(err_msg)
                yield f"[Ollama Connection Failed: Ollama daemon is not running at {self.base_url}. Please start Ollama or pull model '{model}'.]"
            except Exception as e:
                logger.error(f"Ollama Provider Exception: {e}")
                yield f"[Ollama Provider Error: {str(e)}]"

    async def complete_chat(
        self,
        messages: List[Dict[str, str]],
        system_prompt: str = "",
        model_name: str = ""
    ) -> str:
        tokens = []
        async for chunk in self.stream_chat(messages, system_prompt, model_name):
            tokens.append(chunk)
        return "".join(tokens)
