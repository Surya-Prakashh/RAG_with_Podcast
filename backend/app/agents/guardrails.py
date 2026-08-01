import re
from typing import Tuple, Optional, List, Dict, Any
from app.logger import logger

# 1. Prompt Injection & Jailbreak Patterns
PROMPT_INJECTION_PATTERNS = [
    r"ignore\s+(all\s+)?(previous|above|system)\s+(instructions|prompts|rules)",
    r"bypass\s+(safety|security|guardrails|filters)",
    r"reveal\s+(your\s+)?system\s+prompt",
    r"you\s+are\s+now\s+in\s+dan\s+mode",
    r"do\s+anything\s+now",
    r"jailbreak"
]

# 2. Out-of-Domain Topic Filters (Explicitly non-PM / non-growth harmful / toxic topics)
HARMFUL_TOPICS_PATTERNS = [
    r"\b(how\s+to\s+make\s+a\s+bomb|illegal\s+drugs|hack\s+a\s+bank|malware\s+creation)\b"
]

# Relevant Product & Growth Keywords for Soft Domain Check
IN_DOMAIN_KEYWORDS = [
    "pm", "product", "growth", "retention", "monetization", "plg", "lno",
    "feature", "roadmap", "metric", "kpi", "user", "customer", "b2b", "saas",
    "market", "fit", "pmf", "onboarding", "funnel", "loop", "strategy", "shreyas",
    "balfour", "cagan", "verna", "lenny", "podcast", "interview", "hiring",
    "leadership", "design", "ux", "code", "landing page", "component", "essay",
    "ship30for30", "framework", "pricing", "churn", "activation", "acquisition"
]

def validate_input_prompt(user_message: str) -> Tuple[bool, bool, Optional[str]]:
    """
    Evaluates user input prompt through AI Guardrails.
    Returns: (is_safe: bool, is_in_domain: bool, refusal_reason: Optional[str])
    """
    msg_lower = user_message.lower().strip()

    # Check 1: Prompt Injection Defense
    for pattern in PROMPT_INJECTION_PATTERNS:
        if re.search(pattern, msg_lower):
            logger.warning(f"Guardrail Alert: Prompt injection pattern detected in message: '{user_message[:60]}...'")
            return (
                False,
                True,
                "🛡️ **Guardrail Refusal**: Prompt injection or system prompt reveal requests are disabled for security reasons. Please ask a Product Management or Growth question."
            )

    # Check 2: Harmful Content Filter
    for pattern in HARMFUL_TOPICS_PATTERNS:
        if re.search(pattern, msg_lower):
            logger.warning(f"Guardrail Alert: Harmful content topic detected: '{user_message[:60]}...'")
            return (
                False,
                False,
                "🛡️ **Guardrail Refusal**: Requests for unsafe or prohibited content are not permitted."
            )

    # Check 3: Domain Relevance Check
    # If message is short greeting/chat or contains domain keywords, pass
    words = set(re.findall(r"\b\w+\b", msg_lower))
    is_greeting = len(words) <= 3 and any(w in ["hi", "hello", "hey", "help", "who", "what"] for w in words)
    has_domain_keyword = any(k in msg_lower for k in IN_DOMAIN_KEYWORDS)

    if not is_greeting and not has_domain_keyword and len(words) > 5:
        # Check if query is completely off-topic (e.g. medical advice, cooking recipe, celebrity gossip)
        if any(w in msg_lower for w in ["recipe", "doctor", "symptom", "horoscope", "astrology", "lottery"]):
            logger.info(f"Guardrail Notice: Out-of-domain query detected: '{user_message[:60]}...'")
            return (
                True,
                False,
                "👋 **Lenny Growth Assistant Focus**: I am specialized strictly in **Product Management, Growth, Retention, Metrics, and Leadership** backed by *Lenny's Podcast*. How can I help you with your product or growth strategy today?"
            )

    return (True, True, None)

def verify_grounding_relevance(chunks: List[Dict[str, Any]], min_score_threshold: float = 0.20) -> Tuple[bool, List[Dict[str, Any]]]:
    """
    Filters retrieved RAG chunks to ensure they meet the minimum similarity relevance threshold.
    Prevents hallucination from irrelevant vector matches.
    """
    valid_chunks = [c for c in chunks if c.get("score", 0.0) >= min_score_threshold]
    if len(valid_chunks) < len(chunks):
        logger.info(f"Guardrail RAG Filter: Kept {len(valid_chunks)} / {len(chunks)} chunks above threshold {min_score_threshold}")
    return (len(valid_chunks) > 0, valid_chunks)
