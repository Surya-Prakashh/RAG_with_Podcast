import os
import json
import re
from pathlib import Path
from typing import List, Dict, Any
from app.logger import logger

MEMORIES_FILE = Path(__file__).resolve().parent.parent.parent / "user_memories.json"

class UserMemoryEngine:
    """
    Mem0-style Long-Term User Memory Engine.
    Extracts, persists, and injects user facts, preferences, and background across ALL chat sessions.
    """
    def __init__(self):
        self._memories: List[Dict[str, Any]] = self._load_memories()

    def _load_memories(self) -> List[Dict[str, Any]]:
        if MEMORIES_FILE.exists():
            try:
                with open(MEMORIES_FILE, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception as e:
                logger.error(f"Error loading user_memories.json: {e}")
        return []

    def _save_memories(self):
        try:
            with open(MEMORIES_FILE, "w", encoding="utf-8") as f:
                json.dump(self._memories, f, indent=2)
        except Exception as e:
            logger.error(f"Error saving user_memories.json: {e}")

    def extract_and_store_facts(self, user_message: str):
        """
        Extracts user facts & preferences using pattern heuristics and stores unique memories.
        """
        msg = user_message.strip()
        msg_lower = msg.lower()

        patterns = [
            (r"\bi\s+am\s+a\s+([^.,!\n]+)", "Role"),
            (r"\bi\s+work\s+(as|at|on)\s+([^.,!\n]+)", "Work"),
            (r"\bmy\s+product\s+is\s+([^.,!\n]+)", "Product"),
            (r"\bi\s+prefer\s+([^.,!\n]+)", "Preference"),
            (r"\bwe\s+are\s+building\s+a\s+([^.,!\n]+)", "Company/Project"),
            (r"\bmy\s+stack\s+is\s+([^.,!\n]+)", "Tech Stack")
        ]

        extracted_any = False
        for pat, category in patterns:
            match = re.search(pat, msg_lower)
            if match:
                fact_value = match.group(0).strip()
                # Check duplicate
                if not any(m["fact"].lower() == fact_value.lower() for m in self._memories):
                    memory_item = {
                        "id": f"mem-{len(self._memories) + 1}",
                        "category": category,
                        "fact": fact_value.capitalize(),
                        "timestamp": os.popen("date /t").read().strip() if os.name == "nt" else "2026-08-02"
                    }
                    self._memories.append(memory_item)
                    extracted_any = True
                    logger.info(f"Mem0 Extracted Memory [{category}]: {fact_value}")

        if extracted_any:
            self._save_memories()

    def get_all_memories(self) -> List[Dict[str, Any]]:
        return self._memories

    def clear_memories(self):
        self._memories = []
        self._save_memories()
        logger.info("Cleared all Mem0 long-term user memories.")

    def format_memory_prompt_context(self) -> str:
        if not self._memories:
            return ""

        facts_list = "\n".join([f"- [{m['category']}] {m['fact']}" for m in self._memories])
        return f"\n\n--- MEM0 USER PROFILE & LONG-TERM MEMORY ---\nThe assistant remembers the following facts about the user across past sessions:\n{facts_list}\nTailor answers to align with the user's role, tech stack, and background."

user_memory_engine = UserMemoryEngine()
