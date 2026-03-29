"""
rag/vector_store.py
ChromaDB integration — embed, store, and retrieve product review chunks
"""

import chromadb
from chromadb.config import Settings as ChromaSettings
from sentence_transformers import SentenceTransformer
from typing import List, Dict, Any, Optional
import hashlib
import logging

from config import settings

logger = logging.getLogger(__name__)

# ── Embedding Model ───────────────────────────────────────────────
# all-MiniLM-L6-v2: fast, 384-dim, great for semantic search
_embedder: Optional[SentenceTransformer] = None

def get_embedder() -> SentenceTransformer:
    global _embedder
    if _embedder is None:
        logger.info("Loading embedding model...")
        _embedder = SentenceTransformer("all-MiniLM-L6-v2")
    return _embedder


# ── ChromaDB Client ───────────────────────────────────────────────
_chroma_client: Optional[chromadb.AsyncHttpClient] = None

async def get_chroma() -> chromadb.AsyncHttpClient:
    global _chroma_client
    if _chroma_client is None:
        _chroma_client = await chromadb.AsyncHttpClient(
            host=settings.CHROMA_HOST,
            port=settings.CHROMA_PORT,
            settings=ChromaSettings(anonymized_telemetry=False),
        )
    return _chroma_client


# ── Collection helper ─────────────────────────────────────────────
async def get_collection(name: str = None):
    client = await get_chroma()
    col_name = name or settings.CHROMA_COLLECTION
    return await client.get_or_create_collection(
        name=col_name,
        metadata={"hnsw:space": "cosine"},   # cosine similarity
    )


# ── Ingest documents ──────────────────────────────────────────────
async def ingest_documents(documents: List[Dict[str, Any]]) -> List[str]:
    """
    Embed and store documents in ChromaDB.

    Each document should have:
        text     : str   — the chunk text to embed
        metadata : dict  — product_id, source, review_id, etc.

    Returns list of generated document IDs.
    """
    if not documents:
        return []

    embedder  = get_embedder()
    collection = await get_collection()

    texts     = [d["text"]     for d in documents]
    metadatas = [d["metadata"] for d in documents]

    # generate stable IDs from content hash
    ids = [
        hashlib.md5(f"{d['metadata'].get('source','')}-{d['text'][:80]}".encode()).hexdigest()
        for d in documents
    ]

    # embed in batch
    embeddings = embedder.encode(texts, batch_size=32, show_progress_bar=False).tolist()

    await collection.upsert(
        ids=ids,
        embeddings=embeddings,
        documents=texts,
        metadatas=metadatas,
    )

    logger.info(f"Ingested {len(documents)} documents into ChromaDB")
    return ids


# ── Retrieve relevant chunks ──────────────────────────────────────
async def retrieve(
    query: str,
    n_results: int = 8,
    where: Optional[Dict] = None,           # metadata filter e.g. {"product_id": "..."}
) -> List[Dict[str, Any]]:
    """
    Semantic search: returns top-k most relevant chunks for a query.

    Returns list of:
        {
            "text": str,
            "metadata": dict,
            "similarity": float,   # 0–1, higher = more relevant
            "id": str
        }
    """
    embedder   = get_embedder()
    collection = await get_collection()

    query_embedding = embedder.encode([query]).tolist()

    results = await collection.query(
        query_embeddings=query_embedding,
        n_results=n_results,
        where=where,
        include=["documents", "metadatas", "distances"],
    )

    chunks = []
    for i, doc in enumerate(results["documents"][0]):
        distance   = results["distances"][0][i]
        similarity = round(1 - distance, 4)          # cosine: distance → similarity
        chunks.append({
            "text":       doc,
            "metadata":   results["metadatas"][0][i],
            "similarity": similarity,
            "id":         results["ids"][0][i],
        })

    # sort by similarity descending
    chunks.sort(key=lambda x: x["similarity"], reverse=True)
    return chunks


# ── Delete by product ─────────────────────────────────────────────
async def delete_product_chunks(product_id: str) -> None:
    collection = await get_collection()
    await collection.delete(where={"product_id": product_id})
    logger.info(f"Deleted ChromaDB chunks for product {product_id}")
