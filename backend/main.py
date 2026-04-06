import logging
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from rag.pipeline import rag_query
from init_db import load_data

from pipeline.consumer_analysis import (
    clean_text,
    predict_sentiment_single,
    predict_topic,
    df,
    topic_info_df
)

# ── Logging ──────────────────────────────────────────────────────
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ── App ──────────────────────────────────────────────────────────
app = FastAPI(title="AI-Powered Consumer Sentiment Forecaster")

# ── CORS ─────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://localhost:8000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Auto-initialize DB on startup ────────────────────────────────
@app.on_event("startup")
async def startup_event():
    import asyncio
    logger.info("🚀 Starting up — initializing ChromaDB in background...")
    # Run in background so the port binds immediately
    asyncio.create_task(asyncio.to_thread(load_data))
    logger.info("✅ Startup initiated (Background tasks running).")


# -------------------------------
# REQUEST MODELS
# -------------------------------
class PredictRequest(BaseModel):
    text: str

class ChatRequest(BaseModel):
    query: str


# -------------------------------
# ROOT
# -------------------------------
@app.get("/")
async def root():
    return {
        "service": "AI-Powered Consumer Sentiment Forecaster",
        "status": "running"
    }


# -------------------------------
# PREDICT
# -------------------------------
@app.post("/predict")
async def predict(request: PredictRequest):
    try:
        if not request.text.strip():
            raise HTTPException(status_code=400, detail="Text cannot be empty")

        cleaned = clean_text(request.text)

        sent = predict_sentiment_single(cleaned)
        _, topic = predict_topic(cleaned)

        return {
            "sentiment": sent["sentiment"],
            "confidence": sent["confidence"],
            "topic": topic
        }

    except Exception as e:
        logger.error(f"/predict error: {e}")
        return {"error": str(e)}


# -------------------------------
# TREND INSIGHTS
# -------------------------------
@app.get("/trend-insights")
async def trend_insights():
    try:
        total = len(df)
        counts = df['sentiment_label'].value_counts()

        valid_topics = topic_info_df[topic_info_df['topic_id'] != -1] \
            .sort_values('document_count', ascending=False)

        top_topics = [
            {"topic": r['topic_label'], "count": int(r['document_count'])}
            for _, r in valid_topics.head(10).iterrows()
        ]

        return {
            "top_topics": top_topics,
            "sentiment_distribution": {
                "positive": round(counts.get('Positive', 0)/total*100, 1),
                "neutral": round(counts.get('Neutral', 0)/total*100, 1),
                "negative": round(counts.get('Negative', 0)/total*100, 1)
            }
        }

    except Exception as e:
        logger.error(f"/trend-insights error: {e}")
        return {"error": str(e)}


# -------------------------------
# DATASET SUMMARY
# -------------------------------
@app.get("/dataset-summary")
async def dataset_summary():
    try:
        total = len(df)
        counts = df['sentiment_label'].value_counts()

        num_topics = len(topic_info_df[topic_info_df['topic_id'] != -1])

        return {
            "dataset_size": total,
            "number_of_topics": num_topics,
            "sentiment_distribution": {
                "positive": round(counts.get('Positive', 0)/total*100, 1),
                "neutral": round(counts.get('Neutral', 0)/total*100, 1),
                "negative": round(counts.get('Negative', 0)/total*100, 1)
            }
        }

    except Exception as e:
        logger.error(f"/dataset-summary error: {e}")
        return {"error": str(e)}


# -------------------------------
# RAG CHAT
# -------------------------------
@app.post("/chat")
async def chat(request: ChatRequest):
    try:
        result = await rag_query(
            query=request.query,
            conversation_history=[],
            product_filter=None,
            n_retrieve=3 # Safety step: lower retrieval size
        )

        return {
            "answer": result["answer"],
            "docs_retrieved": result["docs_retrieved"]
        }

    except Exception as e:
        logger.error(f"/chat error: {e}")
        raise HTTPException(status_code=500, detail=f"RAG pipeline error: {str(e)}")