"""
main.py
FastAPI application — all routes for ProductPulse RAG backend
"""

from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from uuid import UUID
import logging

from config import settings
from database.connection import get_db
from database.models import Product, Review, SentimentScore, SocialMention, RAGQueryLog
from rag.pipeline import rag_query, rag_query_stream
from rag.vector_store import ingest_documents, delete_product_chunks
from services.sentiment import analyze_sentiment
from services.ingestion import ingest_product_reviews

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ── App ───────────────────────────────────────────────────────────
app = FastAPI(
    title="ProductPulse RAG API",
    description="AI-powered product intelligence with RAG pipeline",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ════════════════════════════════════════════════════════════════
# PYDANTIC SCHEMAS
# ════════════════════════════════════════════════════════════════

class ChatMessage(BaseModel):
    role: str                    # "user" | "assistant"
    content: str

class RAGQueryRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=2000)
    conversation_history: List[ChatMessage] = []
    product_id: Optional[str] = None
    n_retrieve: int = Field(default=8, ge=1, le=20)
    stream: bool = False

class RAGQueryResponse(BaseModel):
    answer: str
    sources_hit: List[str]
    docs_retrieved: int
    tokens_used: int
    response_ms: int
    retrieved_chunks: List[Dict[str, Any]]

class ProductCreate(BaseModel):
    name: str
    brand: str
    category: str
    price: Optional[float] = None
    description: Optional[str] = None
    asin: Optional[str] = None

class ReviewCreate(BaseModel):
    product_id: str
    source: str
    body: str
    rating: Optional[float] = None
    author: Optional[str] = None
    title: Optional[str] = None

class IngestRequest(BaseModel):
    product_id: str
    source: str                  # "amazon" | "reddit" | "bestbuy" | "twitter"
    limit: int = Field(default=100, le=1000)


# ════════════════════════════════════════════════════════════════
# HEALTH
# ════════════════════════════════════════════════════════════════

@app.get("/health")
async def health():
    return {"status": "ok", "version": "1.0.0"}


# ════════════════════════════════════════════════════════════════
# RAG QUERY  ←  THE CORE ENDPOINT
# ════════════════════════════════════════════════════════════════

@app.post("/api/rag/query", response_model=RAGQueryResponse)
async def query_rag(req: RAGQueryRequest):
    """
    Main RAG pipeline endpoint.
    Retrieves relevant product review chunks from ChromaDB,
    augments the prompt, and generates an answer via Claude.
    """
    history = [{"role": m.role, "content": m.content} for m in req.conversation_history]

    result = await rag_query(
        query=req.query,
        conversation_history=history,
        product_filter=req.product_id,
        n_retrieve=req.n_retrieve,
    )
    return result


@app.post("/api/rag/query/stream")
async def query_rag_stream(req: RAGQueryRequest):
    """
    Streaming RAG endpoint — returns Server-Sent Events.
    Connect with: EventSource('/api/rag/query/stream')
    """
    history = [{"role": m.role, "content": m.content} for m in req.conversation_history]

    return StreamingResponse(
        rag_query_stream(
            query=req.query,
            conversation_history=history,
            product_filter=req.product_id,
            n_retrieve=req.n_retrieve,
        ),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


# ════════════════════════════════════════════════════════════════
# PRODUCTS
# ════════════════════════════════════════════════════════════════

@app.get("/api/products")
async def list_products(
    category: Optional[str] = Query(None),
    brand: Optional[str]    = Query(None),
    limit: int              = Query(50, le=200),
    db: AsyncSession        = Depends(get_db),
):
    q = select(Product).order_by(desc(Product.created_at)).limit(limit)
    if category:
        q = q.where(Product.category == category)
    if brand:
        q = q.where(Product.brand == brand)

    result = await db.execute(q)
    products = result.scalars().all()
    return {"products": [_product_to_dict(p) for p in products], "total": len(products)}


@app.get("/api/products/{product_id}")
async def get_product(product_id: UUID, db: AsyncSession = Depends(get_db)):
    p = await db.get(Product, product_id)
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")
    return _product_to_dict(p)


@app.post("/api/products", status_code=201)
async def create_product(data: ProductCreate, db: AsyncSession = Depends(get_db)):
    product = Product(**data.model_dump())
    db.add(product)
    await db.flush()
    return _product_to_dict(product)


@app.delete("/api/products/{product_id}", status_code=204)
async def delete_product(product_id: UUID, db: AsyncSession = Depends(get_db)):
    p = await db.get(Product, product_id)
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")
    await delete_product_chunks(str(product_id))   # remove from ChromaDB too
    await db.delete(p)


# ════════════════════════════════════════════════════════════════
# REVIEWS
# ════════════════════════════════════════════════════════════════

@app.get("/api/products/{product_id}/reviews")
async def get_reviews(
    product_id: UUID,
    source: Optional[str]   = Query(None),
    sentiment: Optional[str] = Query(None),
    limit: int               = Query(50, le=500),
    db: AsyncSession         = Depends(get_db),
):
    q = (select(Review)
         .where(Review.product_id == product_id)
         .order_by(desc(Review.review_date))
         .limit(limit))
    if source:
        q = q.where(Review.source == source)
    if sentiment:
        q = q.where(Review.sentiment_label == sentiment)

    result = await db.execute(q)
    reviews = result.scalars().all()
    return {"reviews": [_review_to_dict(r) for r in reviews]}


@app.post("/api/reviews", status_code=201)
async def add_review(data: ReviewCreate, db: AsyncSession = Depends(get_db)):
    """
    Add a single review, run sentiment analysis, and ingest into ChromaDB.
    """
    # analyze sentiment
    sentiment = await analyze_sentiment(data.body)

    review = Review(
        **data.model_dump(),
        sentiment_score=sentiment["score"],
        sentiment_label=sentiment["label"],
        key_phrases=sentiment["key_phrases"],
    )
    db.add(review)
    await db.flush()

    # ingest into vector store
    ids = await ingest_documents([{
        "text": f"{data.title or ''} {data.body}".strip(),
        "metadata": {
            "product_id": data.product_id,
            "source": data.source,
            "review_id": str(review.id),
            "sentiment": sentiment["label"],
            "rating": data.rating,
        }
    }])
    review.embedding_id = ids[0] if ids else None

    return _review_to_dict(review)


# ════════════════════════════════════════════════════════════════
# SENTIMENT
# ════════════════════════════════════════════════════════════════

@app.get("/api/products/{product_id}/sentiment")
async def get_sentiment(
    product_id: UUID,
    period: str       = Query("daily"),
    limit: int        = Query(30, le=365),
    db: AsyncSession  = Depends(get_db),
):
    """Return time-series sentiment scores for charts."""
    q = (select(SentimentScore)
         .where(SentimentScore.product_id == product_id)
         .where(SentimentScore.period == period)
         .order_by(desc(SentimentScore.recorded_at))
         .limit(limit))

    result = await db.execute(q)
    scores = result.scalars().all()
    return {"sentiment_history": [_sentiment_to_dict(s) for s in scores]}


@app.get("/api/sentiment/overview")
async def sentiment_overview(db: AsyncSession = Depends(get_db)):
    """Aggregated sentiment across all products — for the dashboard KPIs."""
    result = await db.execute(
        select(
            Product.id, Product.name, Product.brand, Product.category,
            func.avg(SentimentScore.score).label("avg_score"),
            func.count(Review.id).label("review_count"),
        )
        .join(SentimentScore, SentimentScore.product_id == Product.id, isouter=True)
        .join(Review, Review.product_id == Product.id, isouter=True)
        .group_by(Product.id, Product.name, Product.brand, Product.category)
        .order_by(desc("avg_score"))
    )
    rows = result.all()
    return {"products": [
        {"id": str(r.id), "name": r.name, "brand": r.brand,
         "category": r.category, "sentiment_score": round(r.avg_score or 0, 1),
         "review_count": r.review_count}
        for r in rows
    ]}


# ════════════════════════════════════════════════════════════════
# INGEST  (trigger review crawl)
# ════════════════════════════════════════════════════════════════

@app.post("/api/ingest")
async def trigger_ingest(req: IngestRequest):
    """
    Trigger review ingestion for a product from a given source.
    Runs as a background task.
    """
    from fastapi.background import BackgroundTasks
    # In production, push to a Celery/ARQ queue instead
    await ingest_product_reviews(
        product_id=req.product_id,
        source=req.source,
        limit=req.limit,
    )
    return {"status": "ingestion_started", "product_id": req.product_id, "source": req.source}


# ════════════════════════════════════════════════════════════════
# ANALYTICS
# ════════════════════════════════════════════════════════════════

@app.get("/api/analytics/rag-stats")
async def rag_stats(db: AsyncSession = Depends(get_db)):
    """RAG query statistics for the sidebar context panel."""
    result = await db.execute(
        select(
            func.count(RAGQueryLog.id).label("total_queries"),
            func.avg(RAGQueryLog.response_ms).label("avg_response_ms"),
            func.avg(RAGQueryLog.retrieved_docs).label("avg_docs_retrieved"),
            func.sum(RAGQueryLog.tokens_used).label("total_tokens"),
        )
    )
    row = result.one()
    return {
        "total_queries": row.total_queries or 0,
        "avg_response_ms": round(row.avg_response_ms or 0),
        "avg_docs_retrieved": round(row.avg_docs_retrieved or 0, 1),
        "total_tokens": row.total_tokens or 0,
    }


# ════════════════════════════════════════════════════════════════
# SERIALIZERS
# ════════════════════════════════════════════════════════════════

def _product_to_dict(p: Product) -> dict:
    return {
        "id": str(p.id), "name": p.name, "brand": p.brand,
        "category": p.category, "price": p.price,
        "description": p.description, "asin": p.asin,
        "tags": p.tags, "created_at": str(p.created_at),
    }

def _review_to_dict(r: Review) -> dict:
    return {
        "id": str(r.id), "product_id": str(r.product_id),
        "source": r.source, "author": r.author,
        "title": r.title, "body": r.body,
        "rating": r.rating, "sentiment_score": r.sentiment_score,
        "sentiment_label": r.sentiment_label, "key_phrases": r.key_phrases,
        "review_date": str(r.review_date) if r.review_date else None,
    }

def _sentiment_to_dict(s: SentimentScore) -> dict:
    return {
        "score": s.score, "label": s.label,
        "positive_pct": s.positive_pct, "neutral_pct": s.neutral_pct,
        "negative_pct": s.negative_pct, "review_count": s.review_count,
        "recorded_at": str(s.recorded_at),
    }
