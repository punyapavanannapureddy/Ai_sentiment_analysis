"""
data.py
Standalone script to ingest cleaned reviews into ChromaDB.
Uses relative path — safe for deployment.
"""

import os
import pandas as pd
from rag.vector_store import ingest_documents

# ── Resolve CSV path relative to this file ──────────────────────
CSV_PATH = os.path.join(os.path.dirname(__file__), "data", "cleaned_reviews.csv")

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

# Limit (important for performance)
docs = docs[:5000]

ingest_documents(docs)

print(f"✅ Inserted {len(docs)} reviews into ChromaDB")