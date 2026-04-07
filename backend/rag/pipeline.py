"""
rag/pipeline.py
Production-ready RAG pipeline using Gemini API + ChromaDB
"""

import time
import logging
from typing import List, Dict, Any, Optional
import warnings
import os

# Suppress the "import google.generativeai as genai" deprecation warning
with warnings.catch_warnings():
    warnings.simplefilter("ignore")
    import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY", ""))

from rag.vector_store import retrieve

logger = logging.getLogger(__name__)

# ── System prompt ───────────────────────────────────────────────
SYSTEM_PROMPT = """You are an expert AI assistant analyzing consumer product reviews.

STRICT RULES:
1. Answer ONLY based on the provided context. Do NOT guess or hallucinate.
2. If the context does not contain the answer, respond with: "Not enough data in the dataset to answer this question."
3. Keep answers clear, concise, and data-driven.
4. When citing sentiment, reference specific review excerpts from the context.
5. Assume all reviews are about consumer electronics (phones) unless stated otherwise.
"""

# ── Gemini API call (with retry for rate limits) ─────────────────
def generate_answer(system_prompt: str, user_prompt: str, max_retries: int = 3) -> str:
    model = genai.GenerativeModel(
        model_name="gemini-2.5-flash",
        system_instruction=system_prompt,
        generation_config=genai.types.GenerationConfig(
            max_output_tokens=150, # Safety step: limit output tokens
            temperature=0.0
        )
    )

    for attempt in range(max_retries):
        try:
            response = model.generate_content(user_prompt)
            return response.text
        except Exception as e:
            error_msg = str(e).lower()
            # Retry on rate limit / quota errors
            if ("429" in error_msg or "quota" in error_msg or "resource" in error_msg) and attempt < max_retries - 1:
                wait_time = 2 ** (attempt + 1)  # 2s, 4s, 8s
                logger.warning(f"Gemini rate limit hit. Retrying in {wait_time}s... (attempt {attempt + 1}/{max_retries})")
                time.sleep(wait_time)
                continue
            logger.error(f"Gemini API error: {e}")
            return f"Error generating response: {str(e)}"


# ── Main RAG function ───────────────────────────────────────────
async def rag_query(
    query: str,
    conversation_history: List[Dict[str, str]] = None,
    product_filter: Optional[str] = None,
    n_retrieve: int = 3, # Safety step: reduced from 8 to limit input tokens
) -> Dict[str, Any]:

    start_ms = int(time.time() * 1000)

    # ── Retrieve relevant chunks ─────────────────────────────────
    chunks = retrieve(
        query=query,
        n_results=n_retrieve,
        where={"product": product_filter} if product_filter else None,
    )

    # ── Strict RAG: no chunks = no answer ────────────────────────
    if not chunks:
        return {
            "answer": "Not enough data available in the dataset to answer this question.",
            "docs_retrieved": 0,
            "response_ms": int(time.time() * 1000) - start_ms
        }

    # ── Build context from retrieved chunks ──────────────────────
    context = "\n".join([f"- {c['text']}" for c in chunks])

    # ── Construct prompt ─────────────────────────────────────────
    user_prompt = f"""Answer the following question using ONLY the context below.
Do NOT guess or make up information. If the answer is not in the context, say "Not enough data".

Context:
{context}

Question: {query}

Answer:"""

    # ── Generate answer using Gemini ─────────────────────────────
    answer = generate_answer(SYSTEM_PROMPT, user_prompt)

    return {
        "answer": answer,
        "docs_retrieved": len(chunks),
        "response_ms": int(time.time() * 1000) - start_ms
    }