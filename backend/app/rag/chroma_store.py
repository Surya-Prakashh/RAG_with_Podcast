import os
from pathlib import Path
from typing import List, Dict, Any
import chromadb
from chromadb.config import Settings
from app.rag.embeddings import get_text_embedding
from app.logger import logger

CHROMA_DB_DIR = Path(__file__).resolve().parent.parent.parent / "chroma_db"
COLLECTION_NAME = "lenny_transcripts"

_chroma_client = None

def get_chroma_client():
    global _chroma_client
    if _chroma_client is None:
        os.makedirs(CHROMA_DB_DIR, exist_ok=True)
        logger.info(f"Initializing persistent ChromaDB client at: {CHROMA_DB_DIR}")
        _chroma_client = chromadb.PersistentClient(
            path=str(CHROMA_DB_DIR),
            settings=Settings(anonymized_telemetry=False)
        )
    return _chroma_client

def get_chroma_collection():
    client = get_chroma_client()
    return client.get_or_create_collection(
        name=COLLECTION_NAME,
        metadata={"hnsw:space": "cosine"}
    )

def add_chunks_to_chroma(chunks: List[Dict[str, Any]]):
    if not chunks:
        return

    collection = get_chroma_collection()
    
    ids = []
    documents = []
    metadatas = []
    embeddings = []

    for c in chunks:
        ids.append(c["id"])
        documents.append(c["content"])
        metadatas.append({
            "episode_title": c["episode_title"],
            "guest_name": c["guest_name"],
            "chunk_index": c["chunk_index"]
        })
        embeddings.append(get_text_embedding(c["content"]))

    batch_size = 500
    logger.info(f"Inserting {len(ids)} vector chunks into ChromaDB batch-by-batch...")
    for i in range(0, len(ids), batch_size):
        collection.add(
            ids=ids[i:i+batch_size],
            documents=documents[i:i+batch_size],
            metadatas=metadatas[i:i+batch_size],
            embeddings=embeddings[i:i+batch_size]
        )

def query_chroma(query_text: str, top_k: int = 4) -> List[Dict[str, Any]]:
    collection = get_chroma_collection()
    count = collection.count()
    if count == 0:
        logger.warning("ChromaDB vector store is empty! No chunks returned.")
        return []

    logger.info(f"Searching ChromaDB ({count} indexed chunks) for query: '{query_text[:50]}...'")
    query_embedding = get_text_embedding(query_text)
    
    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=min(top_k, count)
    )

    retrieved = []
    if results and results.get("ids") and results["ids"][0]:
        ids = results["ids"][0]
        documents = results["documents"][0]
        metadatas = results["metadatas"][0]
        distances = results["distances"][0] if results.get("distances") else [0.0]*len(ids)

        for i in range(len(ids)):
            dist = distances[i]
            similarity = max(0.0, 1.0 - float(dist)) if dist is not None else 1.0

            retrieved.append({
                "id": ids[i],
                "episode_title": metadatas[i].get("episode_title", "Lenny's Podcast"),
                "guest_name": metadatas[i].get("guest_name", "Guest"),
                "chunk_index": metadatas[i].get("chunk_index", 0),
                "content": documents[i],
                "score": similarity
            })

    logger.info(f"ChromaDB returned {len(retrieved)} relevant context passages.")
    return retrieved
