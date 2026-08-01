from typing import List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from app.rag.chroma_store import query_chroma

async def retrieve_relevant_transcript_chunks(
    db: AsyncSession,
    query: str,
    top_k: int = 4
) -> List[Dict[str, Any]]:
    """
    Retrieves top-K relevant podcast transcript chunks using ChromaDB vector database.
    """
    try:
        results = query_chroma(query_text=query, top_k=top_k)
        if results:
            return results
    except Exception as e:
        print(f"Error querying ChromaDB vector store: {e}")

    return []
