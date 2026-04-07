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
def predict_sentiment_single(text: str):
    """
    Refactored to use Gemini API for sentiment mapping.
    This saves ~500MB of RAM on Render by removing the local RoBERTa model.
    """
    import google.generativeai as genai
    import os
    
    prompt = f"""Analyze the sentiment of the following consumer review.
    Return ONLY one word: Positive, Neutral, or Negative.
    
    Review: "{text}"
    Sentiment:"""
    
    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content(prompt)
        sentiment = response.text.strip().capitalize()
        
        # Validation
        if sentiment not in ["Positive", "Neutral", "Negative"]:
            sentiment = "Neutral" # Fallback
            
        return {
            "sentiment": sentiment,
            "confidence": 0.95 # Simulated confidence for Gemini
        }
    except Exception as e:
        print(f"Gemini sentiment error: {e}")
        return {"sentiment": "Neutral", "confidence": 0.0}

def get_topic_model():
    import os
    global topic_model
    if 'topic_model' not in globals() or globals().get('topic_model') is None:
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
# Logic handled in predict_sentiment_single above.

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