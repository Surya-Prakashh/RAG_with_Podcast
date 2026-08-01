import re
from typing import Dict, Any
from app.agents.prompts import INTENT_ROUTER_SYSTEM_PROMPT
from app.llm.provider_base import BaseLLMProvider
from app.logger import logger

async def classify_intent(
    user_message: str,
    llm_provider: BaseLLMProvider,
    skill_override: str = None
) -> str:
    """
    Classifies user message intent into 'qa', 'ship30for30', 'artifact', or 'chat'.
    """
    if skill_override and skill_override in ["qa", "ship30for30", "artifact", "chat"]:
        logger.info(f"Skill manually overridden by user: {skill_override}")
        return skill_override

    msg_lower = user_message.lower()

    # Fast heuristic checks for explicit keywords
    if any(k in msg_lower for k in ["ship30for30", "ship 30", "atomic essay", "1250 word", "essay"]):
        logger.info("Heuristic classifier detected intent: 'ship30for30'")
        return "ship30for30"
    if any(k in msg_lower for k in ["artifact", "html", "css", "landing page", "component", "svg", "dashboard", "ui mockup"]):
        logger.info("Heuristic classifier detected intent: 'artifact'")
        return "artifact"

    # LLM Router Classification
    try:
        completion = await llm_provider.complete_chat(
            messages=[{"role": "user", "content": user_message}],
            system_prompt=INTENT_ROUTER_SYSTEM_PROMPT
        )
        cleaned = completion.strip().lower()
        for valid_key in ["ship30for30", "artifact", "qa", "chat"]:
            if valid_key in cleaned:
                logger.info(f"Agent Router LLM classified intent: '{valid_key}'")
                return valid_key
    except Exception as e:
        logger.error(f"Router LLM classification error: {e}")

    logger.info("Defaulting intent classification to 'qa'")
    return "qa"
