"""
rag/vector_store.py
Local ChromaDB (no docker) version
"""

import chromadb
from chromadb.config import Settings as ChromaSettings
from sentence_transformers import SentenceTransformer
from typing import List, Dict, Any, Optional
import hashlib
import logging

logger = logging.getLogger(__name__)

# ── Embedding Model ───────────────────────────────────────────────
_embedder: Optional[SentenceTransformer] = None

def get_embedder() -> SentenceTransformer:
    global _embedder
    if _embedder is None:
        logger.info("Loading embedding model...")
        _embedder = SentenceTransformer("all-MiniLM-L6-v2")
    return _embedder


# ── Local ChromaDB ───────────────────────────────────────────────
_chroma_client = None

def get_chroma():
    global _chroma_client
    if _chroma_client is None:
        _chroma_client = chromadb.PersistentClient(
            path="./chroma_db",
            settings=ChromaSettings(anonymized_telemetry=False)
        )
    return _chroma_client


# ── Collection ───────────────────────────────────────────────
def get_collection(name: str = None):
    client = get_chroma()
    col_name = name or "reviews"

    return client.get_or_create_collection(
        name=col_name,
        metadata={"hnsw:space": "cosine"},
    )


# ── Ingest Documents ──────────────────────────────────────────────
def ingest_documents(documents: List[Dict[str, Any]]) -> List[str]:
    if not documents:
        return []

    embedder = get_embedder()
    collection = get_collection()

    unique_documents = []
    seen_ids = set()
    ids = []
    
    for d in documents:
        doc_id = hashlib.md5(f"{d['metadata']}-{d['text']}".encode()).hexdigest()
        if doc_id not in seen_ids:
            seen_ids.add(doc_id)
            ids.append(doc_id)
            unique_documents.append(d)

    texts = [d["text"] for d in unique_documents]
    metadatas = [d["metadata"] for d in unique_documents]

    embeddings = embedder.encode(texts, batch_size=32).tolist()

    collection.upsert(
        ids=ids,
        embeddings=embeddings,
        documents=texts,
        metadatas=metadatas,
    )

    logger.info(f"Ingested {len(unique_documents)} unique documents into ChromaDB (out of {len(documents)} provided)")
    return ids


# ── Retrieve ──────────────────────────────────────────────
def retrieve(
    query: str,
    n_results: int = 8,
    where: Optional[Dict] = None,
) -> List[Dict[str, Any]]:

    embedder = get_embedder()
    collection = get_collection()

    query_embedding = embedder.encode([query]).tolist()

    results = collection.query(
        query_embeddings=query_embedding,
        n_results=n_results,
        where=where,
        include=["documents", "metadatas", "distances"],
    )

    chunks = []
    for i, doc in enumerate(results["documents"][0]):
        distance = results["distances"][0][i]
        similarity = round(1 - distance, 4)

        chunks.append({
            "text": doc,
            "metadata": results["metadatas"][0][i],
            "similarity": similarity,
            "id": results["ids"][0][i],
        })

    chunks.sort(key=lambda x: x["similarity"], reverse=True)
    return chunks


# ── Delete ──────────────────────────────────────────────
def delete_product_chunks(product_id: str):
    collection = get_collection()
    collection.delete(where={"product_id": product_id})