from abc import ABC, abstractmethod
from typing import AsyncGenerator, List, Dict, Any

class BaseLLMProvider(ABC):
    @abstractmethod
    async def stream_chat(
        self,
        messages: List[Dict[str, str]],
        system_prompt: str = "",
        model_name: str = ""
    ) -> AsyncGenerator[str, None]:
        """Streams response tokens from the LLM provider."""
        pass

    @abstractmethod
    async def complete_chat(
        self,
        messages: List[Dict[str, str]],
        system_prompt: str = "",
        model_name: str = ""
    ) -> str:
        """Returns the full complete text response from the LLM provider."""
        pass
