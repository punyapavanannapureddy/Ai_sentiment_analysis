"""
services/sentiment.py
Sentiment analysis for reviews using Claude API
"""

import anthropic
import json
import logging
from typing import Dict, Any

from config import settings

logger = logging.getLogger(__name__)
claude = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)


async def analyze_sentiment(text: str) -> Dict[str, Any]:
    """
    Analyze sentiment of a review using Claude.
    Returns score (-1 to +1), label, and key phrases.
    """
    try:
        response = await claude.messages.create(
            model="claude-haiku-4-5-20251001",     # fast + cheap for batch analysis
            max_tokens=200,
            system="""You are a sentiment analysis engine. 
Respond ONLY with valid JSON — no markdown, no explanation.
Schema: {"score": float (-1.0 to 1.0), "label": "Very Positive|Positive|Neutral|Negative|Very Negative", "key_phrases": [max 3 short strings]}""",
            messages=[{"role": "user", "content": f"Analyze this product review:\n\n{text[:1000]}"}],
        )

        raw = response.content[0].text.strip()
        result = json.loads(raw)

        return {
            "score":       float(result.get("score", 0.0)),
            "label":       result.get("label", "Neutral"),
            "key_phrases": result.get("key_phrases", []),
        }

    except Exception as e:
        logger.warning(f"Sentiment analysis failed: {e}")
        return {"score": 0.0, "label": "Neutral", "key_phrases": []}


async def batch_analyze(texts: list[str], batch_size: int = 10) -> list[Dict]:
    """Analyze sentiment for multiple texts efficiently."""
    results = []
    for i in range(0, len(texts), batch_size):
        batch = texts[i:i + batch_size]
        for text in batch:
            result = await analyze_sentiment(text)
            results.append(result)
    return results
