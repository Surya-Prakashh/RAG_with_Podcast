import re
from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.models import ArtifactModel

ARTIFACT_REGEX = re.compile(
    r'<artifact\s+type=["\'](?P<type>html|markdown|javascript|svg|css|code)["\']\s+title=["\'](?P<title>[^"\']+)["\']\s*>(?P<content>.*?)</artifact>',
    re.DOTALL | re.IGNORECASE
)

def extract_artifacts_from_text(text: str) -> List[Dict[str, str]]:
    """Extracts all <artifact> tags from a string."""
    matches = ARTIFACT_REGEX.finditer(text)
    artifacts = []
    for m in matches:
        artifacts.append({
            "type": m.group("type").lower(),
            "title": m.group("title").strip(),
            "content": m.group("content").strip()
        })
    return artifacts

async def save_artifacts_for_message(
    db: AsyncSession,
    session_id: str,
    message_id: str,
    full_text: str
) -> List[ArtifactModel]:
    """Parses text for <artifact> tags, creates ArtifactModel records, and persists to DB."""
    extracted = extract_artifacts_from_text(full_text)
    saved_records = []

    for art in extracted:
        record = ArtifactModel(
            session_id=session_id,
            message_id=message_id,
            type=art["type"],
            title=art["title"],
            content=art["content"]
        )
        db.add(record)
        saved_records.append(record)

    if saved_records:
        await db.commit()

    return saved_records
