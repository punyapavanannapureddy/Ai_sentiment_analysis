# pipeline/consumer_analysis.py

import pandas as pd
import pandas as pd
# Heavy ML imports moved inside functions for rapid startup on Render

# -------------------------------
# LOAD DATA
# -------------------------------
df = pd.read_csv("outputs/sentiment_topic_results.csv")
topic_info_df = pd.read_csv("outputs/topic_info.csv")

# -------------------------------
_sentiment_model = None

def get_sentiment_model():
    global _sentiment_model
    if _sentiment_model is None:
        print("Loading sentiment model...")
        from transformers import pipeline
        _sentiment_model = pipeline(
            "sentiment-analysis",
            model="cardiffnlp/twitter-roberta-base-sentiment-latest"
        )
    return _sentiment_model

def get_topic_model():
    global topic_model
    if 'topic_model' not in globals() or topic_model is None:
        try:
            if os.path.exists("outputs/topic_model"):
                from bertopic import BERTopic
                globals()['topic_model'] = BERTopic.load("outputs/topic_model")
                print("Topic model loaded successfully!")
            else:
                globals()['topic_model'] = None
                print("Warning: outputs/topic_model not found. Topic prediction will be disabled.")
        except Exception as e:
            globals()['topic_model'] = None
            print(f"Warning: Failed to load topic_model: {e}")
    return globals()['topic_model']

# -------------------------------
# CLEAN TEXT
# -------------------------------
def clean_text(text: str) -> str:
    return text.lower().strip()

# -------------------------------
# SENTIMENT
# -------------------------------
def predict_sentiment_single(text: str):
    model = get_sentiment_model()
    result = model(text)[0]

    return {
        "sentiment": result["label"].capitalize(),   # FIXED
        "confidence": float(result["score"])
    }

# -------------------------------
# TOPIC
# -------------------------------
def predict_topic(text: str):
    model = get_topic_model()
    if model is None:
        return -1, "Topic Prediction Unavailable"

    topics, _ = model.transform([text])
    t_id = topics[0]

    if t_id == -1:
        return t_id, "General/Other"

    words = model.get_topic(t_id)

    if not words:  # SAFE CHECK
        return t_id, f"Topic {t_id}"

    label = " & ".join([w.title() for w, _ in words[:2]])

    return t_id, label