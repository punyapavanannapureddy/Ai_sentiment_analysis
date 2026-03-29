"""
rag/pipeline.py
Core RAG pipeline: Retrieve → Augment → Generate
"""

import time
import logging
from typing import List, Dict, Any, Optional, AsyncGenerator

import anthropic

from config import settings
from rag.vector_store import retrieve
from database.connection import db_session
from database.models import RAGQueryLog

logger = logging.getLogger(__name__)

# ── Anthropic client ──────────────────────────────────────────────
claude = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)

# ── System prompt ─────────────────────────────────────────────────
SYSTEM_PROMPT = """You are ProductPulse AI, an expert product intelligence analyst.
You are powered by a RAG system with access to millions of verified product reviews,
social media mentions, and tech news articles.

RULES:
- Answer only based on the retrieved context provided
- Always cite which source the information comes from
- If context is insufficient, say so clearly
- Include specific numbers, ratings, and sentiment scores
- Format: Start with retrieved doc count, give analysis, end with sentiment signal
- Use ** for bold emphasis on key findings
- Keep responses under 200 words unless asked for detail

SOURCES AVAILABLE:
- Amazon Reviews (verified purchases)
- Reddit Communities (r/gadgets, r/tech, etc.)
- Best Buy Reviews
- Twitter/X Social Mentions
- Tech News Articles (TechCrunch, The Verge, etc.)
"""


# ── Main RAG pipeline ─────────────────────────────────────────────
async def rag_query(
    query: str,
    conversation_history: List[Dict[str, str]] = None,
    product_filter: Optional[str] = None,         # filter by product_id
    n_retrieve: int = 8,
    stream: bool = False,
) -> Dict[str, Any]:
    """
    Full RAG pipeline:
      1. Embed query → retrieve top-k chunks from ChromaDB
      2. Build augmented prompt with retrieved context
      3. Call Claude API → generate answer
      4. Log query metadata to PostgreSQL

    Returns:
        {
            "answer": str,
            "retrieved_chunks": list,
            "sources_hit": list[str],
            "docs_retrieved": int,
            "tokens_used": int,
            "response_ms": int,
        }
    """
    start_ms = int(time.time() * 1000)

    # ── Step 1: RETRIEVE ─────────────────────────────────────────
    where_filter = {"product_id": product_filter} if product_filter else None

    chunks = await retrieve(
        query=query,
        n_results=n_retrieve,
        where=where_filter,
    )

    logger.info(f"Retrieved {len(chunks)} chunks for query: {query[:60]}...")

    # ── Step 2: AUGMENT ──────────────────────────────────────────
    context_block = _build_context(chunks)
    augmented_user_msg = f"""RETRIEVED CONTEXT:
{context_block}

---
USER QUESTION: {query}

Answer based on the context above. Start your response with:
"📡 Retrieved {len(chunks)} chunks from {_unique_sources(chunks)}"
"""

    # build message history
    messages = []
    if conversation_history:
        messages.extend(conversation_history[:-1])   # all but last user msg
    messages.append({"role": "user", "content": augmented_user_msg})

    # ── Step 3: GENERATE ─────────────────────────────────────────
    response = await claude.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=1000,
        system=SYSTEM_PROMPT,
        messages=messages,
    )

    answer      = response.content[0].text
    tokens_used = response.usage.input_tokens + response.usage.output_tokens
    response_ms = int(time.time() * 1000) - start_ms
    sources_hit = _unique_sources(chunks)

    # ── Step 4: LOG ───────────────────────────────────────────────
    async with db_session() as db:
        log = RAGQueryLog(
            query=query,
            retrieved_docs=len(chunks),
            sources_hit=sources_hit,
            tokens_used=tokens_used,
            response_ms=response_ms,
            claude_model="claude-sonnet-4-20250514",
        )
        db.add(log)

    return {
        "answer":            answer,
        "retrieved_chunks":  chunks,
        "sources_hit":       sources_hit,
        "docs_retrieved":    len(chunks),
        "tokens_used":       tokens_used,
        "response_ms":       response_ms,
    }


# ── Streaming variant ─────────────────────────────────────────────
async def rag_query_stream(
    query: str,
    conversation_history: List[Dict[str, str]] = None,
    product_filter: Optional[str] = None,
    n_retrieve: int = 8,
) -> AsyncGenerator[str, None]:
    """
    Streaming version — yields text chunks as they arrive from Claude.
    Use with FastAPI StreamingResponse / SSE.
    """
    where_filter = {"product_id": product_filter} if product_filter else None
    chunks = await retrieve(query=query, n_results=n_retrieve, where=where_filter)

    context_block = _build_context(chunks)
    augmented_msg = f"""RETRIEVED CONTEXT:\n{context_block}\n\n---\nUSER QUESTION: {query}\n\nStart with: "📡 Retrieved {len(chunks)} chunks from {_unique_sources(chunks)}" """

    messages = []
    if conversation_history:
        messages.extend(conversation_history[:-1])
    messages.append({"role": "user", "content": augmented_msg})

    # yield metadata first
    import json
    yield f"data: {json.dumps({'type':'meta','chunks':len(chunks),'sources':_unique_sources(chunks)})}\n\n"

    async with claude.messages.stream(
        model="claude-sonnet-4-20250514",
        max_tokens=1000,
        system=SYSTEM_PROMPT,
        messages=messages,
    ) as stream:
        async for text in stream.text_stream:
            yield f"data: {json.dumps({'type':'token','text':text})}\n\n"

    yield "data: [DONE]\n\n"


# ── Helpers ───────────────────────────────────────────────────────
def _build_context(chunks: List[Dict]) -> str:
    """Format retrieved chunks into a readable context block."""
    if not chunks:
        return "No relevant documents found in the knowledge base."

    lines = []
    for i, chunk in enumerate(chunks, 1):
        meta = chunk["metadata"]
        src  = meta.get("source", "unknown")
        prod = meta.get("product_name", "")
        sim  = chunk["similarity"]
        lines.append(
            f"[Doc {i} | Source: {src} | Product: {prod} | Relevance: {sim:.2f}]\n"
            f"{chunk['text']}\n"
        )
    return "\n".join(lines)


def _unique_sources(chunks: List[Dict]) -> List[str]:
    seen = set()
    sources = []
    for c in chunks:
        src = c["metadata"].get("source", "unknown")
        if src not in seen:
            seen.add(src)
            sources.append(src)
    return sources
