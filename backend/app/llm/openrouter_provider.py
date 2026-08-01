import json
from typing import AsyncGenerator, List, Dict, Any
import httpx
from app.llm.provider_base import BaseLLMProvider
from app.logger import logger

OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"

class OpenRouterProvider(BaseLLMProvider):
    def __init__(self, api_key: str, default_model: str = "anthropic/claude-3.5-sonnet"):
        self.api_key = api_key
        self.default_model = default_model

    async def stream_chat(
        self,
        messages: List[Dict[str, str]],
        system_prompt: str = "",
        model_name: str = ""
    ) -> AsyncGenerator[str, None]:
        clean_key = self.api_key.replace("Bearer ", "").strip()
        if not clean_key:
            logger.warning("OpenRouter API key is missing during stream_chat call!")
            yield "[Error: OpenRouter API key is missing. Please configure your API key in Settings.]"
            return

        model = model_name or self.default_model
        logger.info(f"OpenRouter streaming request started using model: {model}")

        payload_messages = []
        if system_prompt:
            payload_messages.append({"role": "system", "content": system_prompt})
        payload_messages.extend(messages)

        headers = {
            "Authorization": f"Bearer {clean_key}",
            "HTTP-Referer": "https://github.com/LennyGrowthAssistant",
            "X-Title": "Lenny Growth Assistant",
            "Content-Type": "application/json"
        }

        payload = {
            "model": model,
            "messages": payload_messages,
            "stream": True,
            "temperature": 0.7
        }

        async with httpx.AsyncClient(timeout=60.0) as client:
            try:
                async with client.stream("POST", f"{OPENROUTER_BASE_URL}/chat/completions", headers=headers, json=payload) as response:
                    if response.status_code != 200:
                        error_body = await response.aread()
                        err_msg = f"OpenRouter API Error ({response.status_code}): {error_body.decode('utf-8', errors='ignore')}"
                        logger.error(err_msg)
                        yield f"[{err_msg}]"
                        return

                    async for line in response.aiter_lines():
                        if line.startswith("data: "):
                            data_str = line[6:].strip()
                            if data_str == "[DONE]":
                                logger.info("OpenRouter stream finished successfully.")
                                break
                            try:
                                chunk_data = json.loads(data_str)
                                choices = chunk_data.get("choices", [])
                                if choices:
                                    delta = choices[0].get("delta", {})
                                    content = delta.get("content")
                                    if content:
                                        yield content
                            except json.JSONDecodeError:
                                continue
            except Exception as e:
                logger.error(f"OpenRouter connection exception: {e}")
                yield f"[Connection Error to OpenRouter: {str(e)}]"

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
