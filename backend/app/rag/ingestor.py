import os
import glob
import json
import uuid
import httpx
from pathlib import Path
from typing import List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import delete
from app.db.models import TranscriptChunkModel
from app.rag.embeddings import get_text_embedding
from app.rag.chroma_store import add_chunks_to_chroma, get_chroma_collection

DATASET_DIR = Path(__file__).resolve().parent.parent.parent.parent / "data" / "lennys-podcast-transcripts"

def chunk_text(text: str, max_chars: int = 1200) -> List[str]:
    """Splits text into chunks of approximately max_chars length."""
    paragraphs = text.split("\n\n")
    chunks = []
    current_chunk = []
    current_len = 0

    for p in paragraphs:
        p_str = p.strip()
        if not p_str:
            continue
        if current_len + len(p_str) > max_chars and current_chunk:
            chunks.append("\n\n".join(current_chunk))
            current_chunk = [p_str]
            current_len = len(p_str)
        else:
            current_chunk.append(p_str)
            current_len += len(p_str)

    if current_chunk:
        chunks.append("\n\n".join(current_chunk))
    return chunks

def parse_guest_and_title(file_path: Path) -> tuple[str, str]:
    """Extracts guest name and episode title from file path or markdown content."""
    parts = file_path.parts
    guest_slug = "Unknown Guest"
    if "episodes" in parts:
        ep_idx = parts.index("episodes")
        if ep_idx + 1 < len(parts):
            guest_slug = parts[ep_idx + 1]
    elif file_path.stem not in ["README", "CLAUDE"]:
        guest_slug = file_path.stem

    guest_name = guest_slug.replace("-", " ").title()
    episode_title = f"Lenny's Podcast: {guest_name}"
    return guest_name, episode_title

async def ingest_transcripts_into_db(db: AsyncSession) -> int:
    """
    Ingests ALL Lenny's podcast transcript markdown files into ChromaDB and database.
    Scans data/lennys-podcast-transcripts directory for all markdown episodes.
    """
    # Reset existing DB table and ChromaDB collection
    await db.execute(delete(TranscriptChunkModel))
    await db.commit()

    collection = get_chroma_collection()
    if collection.count() > 0:
        try:
            # Clear ChromaDB collection
            collection.delete(ids=collection.get()["ids"])
        except Exception:
            pass

    md_files = []
    if DATASET_DIR.exists():
        md_files = list(DATASET_DIR.glob("**/*.md"))

    # Exclude non-transcript files like README.md, CLAUDE.md
    md_files = [f for f in md_files if f.name.lower() not in ["readme.md", "claude.md"]]

    print(f"Found {len(md_files)} full transcript files in dataset repository ({DATASET_DIR})...")

    all_chunks_for_chroma = []
    total_chunks = 0

    for file_path in md_files:
        try:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()

            if not content.strip():
                continue

            guest_name, ep_title = parse_guest_and_title(file_path)
            text_chunks = chunk_text(content)

            for idx, chunk in enumerate(text_chunks):
                chunk_id = str(uuid.uuid4())
                embedding = get_text_embedding(chunk)

                # Add to DB model
                chunk_model = TranscriptChunkModel(
                    id=chunk_id,
                    episode_title=ep_title,
                    guest_name=guest_name,
                    chunk_index=idx,
                    content=chunk,
                    embedding_json=json.dumps(embedding)
                )
                db.add(chunk_model)

                # Accumulate for ChromaDB batch insertion
                all_chunks_for_chroma.append({
                    "id": chunk_id,
                    "episode_title": ep_title,
                    "guest_name": guest_name,
                    "chunk_index": idx,
                    "content": chunk
                })

                total_chunks += 1

                # Commit in batches of 500
                if total_chunks % 500 == 0:
                    await db.commit()
                    print(f"Processed {total_chunks} chunks into vector index...")

        except Exception as e:
            print(f"Warning reading file {file_path}: {e}")
            continue

    await db.commit()

    # Ingest into ChromaDB persistent vector database
    print(f"Inserting {len(all_chunks_for_chroma)} total vector chunks into ChromaDB persistent database...")
    add_chunks_to_chroma(all_chunks_for_chroma)
    print(f"[SUCCESS] ChromaDB Vector Ingestion Complete! Total indexed chunks: {total_chunks}")

    return total_chunks
