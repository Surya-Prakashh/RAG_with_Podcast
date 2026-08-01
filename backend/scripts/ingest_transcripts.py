import asyncio
import os
import sys

# Ensure backend root is in python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.db.database import AsyncSessionLocal, init_db
from app.rag.ingestor import ingest_transcripts_into_db

async def main():
    print("Initializing Database...")
    await init_db()
    print("Ingesting Lenny's Podcast Transcripts & Computing Vector Embeddings...")
    async with AsyncSessionLocal() as session:
        count = await ingest_transcripts_into_db(session)
        print(f"[SUCCESS] Ingestion Complete! {count} total transcript chunks indexed in database vector store.")

if __name__ == "__main__":
    asyncio.run(main())
