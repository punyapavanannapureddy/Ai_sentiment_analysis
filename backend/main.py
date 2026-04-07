from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

from pipeline.consumer_analysis import (
    clean_text,
    predict_sentiment_single,
    predict_topic,
    df,
    topic_info_df
)

# ✅ FIRST create app
app = FastAPI(title="AI-Powered Consumer Sentiment Forecaster")

# ✅ THEN add middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------
# REQUEST MODEL
# -------------------------------
class PredictRequest(BaseModel):
    text: str

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
        return {"error": str(e)}