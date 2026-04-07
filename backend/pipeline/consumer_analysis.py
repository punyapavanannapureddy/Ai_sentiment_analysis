# pipeline/consumer_analysis.py

import pandas as pd
from transformers import pipeline
from bertopic import BERTopic

# -------------------------------
# LOAD DATA
# -------------------------------
df = pd.read_csv("outputs/sentiment_topic_results.csv")
topic_info_df = pd.read_csv("outputs/topic_info.csv")

# -------------------------------
# LOAD MODELS
# -------------------------------
print("Loading models...")

sentiment_model = pipeline(
    "sentiment-analysis",
    model="cardiffnlp/twitter-roberta-base-sentiment-latest"
)

topic_model = BERTopic.load("outputs/topic_model")

print("Models loaded successfully!")

# -------------------------------
# CLEAN TEXT
# -------------------------------
def clean_text(text: str) -> str:
    return text.lower().strip()

# -------------------------------
# SENTIMENT
# -------------------------------
def predict_sentiment_single(text: str):
    result = sentiment_model(text)[0]

    return {
        "sentiment": result["label"].capitalize(),   # FIXED
        "confidence": float(result["score"])
    }

# -------------------------------
# TOPIC
# -------------------------------
def predict_topic(text: str):
    topics, _ = topic_model.transform([text])
    t_id = topics[0]

    if t_id == -1:
        return t_id, "General/Other"

    words = topic_model.get_topic(t_id)

    if not words:  # SAFE CHECK
        return t_id, f"Topic {t_id}"

    label = " & ".join([w.title() for w, _ in words[:2]])

    return t_id, label