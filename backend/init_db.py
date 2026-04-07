"""
init_db.py
Automatic database initializer — called at FastAPI startup.
Reads cleaned CSV, converts to documents, and ingests into ChromaDB.
"""

import os
import logging
import pandas as pd
from rag.vector_store import ingest_documents, get_collection

logger = logging.getLogger(__name__)

CSV_PATH = os.path.join(os.path.dirname(__file__), "data", "cleaned_reviews.csv")


def load_data():
    """
    Load cleaned reviews from CSV and ingest into ChromaDB.
    Skips ingestion if the collection already has data (idempotent).
    """

    # ── Skip if already populated ────────────────────────────────
    collection = get_collection()
    existing_count = collection.count()
    if existing_count > 0:
        logger.info(f"ChromaDB already has {existing_count} documents — skipping ingestion.")
        print(f"✅ DB already initialized ({existing_count} docs). Skipping.")
        return

    # ── Check CSV exists ─────────────────────────────────────────
    if not os.path.exists(CSV_PATH):
        logger.warning(f"CSV not found at {CSV_PATH} — skipping DB init.")
        print(f"⚠️  CSV not found at {CSV_PATH}. Skipping DB init.")
        return

    # ── Read and convert ─────────────────────────────────────────
    df = pd.read_csv(CSV_PATH)

    docs = []
    for _, row in df.iterrows():
        if pd.isna(row.get("review")):
            continue

        docs.append({
            "text": row["review"],
            "metadata": {
                "product": "phone",
                "rating": row.get("ratingScore", None)
            }
        })

    # Limit for performance — Render free tier is slow, 1000 is safer for boot
    docs = docs[:1000]

    if not docs:
        logger.warning("No valid documents found in CSV.")
        print("⚠️  No valid documents found. Skipping.")
        return

    # ── Ingest ───────────────────────────────────────────────────
    ingest_documents(docs)
    logger.info(f"DB initialized with {len(docs)} documents.")
    print(f"✅ DB initialized — {len(docs)} reviews ingested into ChromaDB")
