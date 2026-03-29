"""
database/models.py
PostgreSQL schema using SQLAlchemy ORM
"""

from datetime import datetime
from sqlalchemy import (
    Column, String, Float, Integer, Boolean,
    DateTime, Text, ForeignKey, Index, JSON
)
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import relationship, DeclarativeBase
from sqlalchemy.sql import func
import uuid


class Base(DeclarativeBase):
    pass


# ── Products ──────────────────────────────────────────────────────
class Product(Base):
    __tablename__ = "products"

    id           = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name         = Column(String(255), nullable=False, index=True)
    brand        = Column(String(100), nullable=False, index=True)
    category     = Column(String(100), nullable=False, index=True)
    price        = Column(Float)
    description  = Column(Text)
    image_url    = Column(String(500))
    asin         = Column(String(20), unique=True)          # Amazon product ID
    sku          = Column(String(50))
    tags         = Column(ARRAY(String))
    metadata     = Column(JSON, default={})
    created_at   = Column(DateTime(timezone=True), server_default=func.now())
    updated_at   = Column(DateTime(timezone=True), onupdate=func.now())

    # relationships
    reviews      = relationship("Review", back_populates="product", cascade="all, delete")
    sentiments   = relationship("SentimentScore", back_populates="product", cascade="all, delete")

    __table_args__ = (
        Index("ix_products_brand_category", "brand", "category"),
    )


# ── Reviews ───────────────────────────────────────────────────────
class Review(Base):
    __tablename__ = "reviews"

    id              = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    product_id      = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False)
    source          = Column(String(50), nullable=False)   # amazon, reddit, bestbuy, twitter
    external_id     = Column(String(200))                  # original review ID from source
    author          = Column(String(150))
    title           = Column(String(500))
    body            = Column(Text, nullable=False)
    rating          = Column(Float)                        # 1.0 – 5.0
    helpful_votes   = Column(Integer, default=0)
    verified        = Column(Boolean, default=False)
    sentiment_score = Column(Float)                        # -1.0 to +1.0
    sentiment_label = Column(String(30))                   # Positive / Neutral / Negative
    key_phrases     = Column(ARRAY(String))
    embedding_id    = Column(String(100))                  # ChromaDB doc ID
    review_date     = Column(DateTime(timezone=True))
    ingested_at     = Column(DateTime(timezone=True), server_default=func.now())

    product = relationship("Product", back_populates="reviews")

    __table_args__ = (
        Index("ix_reviews_product_source", "product_id", "source"),
        Index("ix_reviews_sentiment", "sentiment_label"),
        Index("ix_reviews_date", "review_date"),
    )


# ── Sentiment Scores (aggregated, time-series) ────────────────────
class SentimentScore(Base):
    __tablename__ = "sentiment_scores"

    id           = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    product_id   = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False)
    score        = Column(Float, nullable=False)           # 0 – 100
    label        = Column(String(30))
    positive_pct = Column(Float)
    neutral_pct  = Column(Float)
    negative_pct = Column(Float)
    review_count = Column(Integer)
    source       = Column(String(50), default="all")       # amazon / reddit / all
    period       = Column(String(20), default="daily")     # hourly / daily / weekly
    recorded_at  = Column(DateTime(timezone=True), server_default=func.now())

    product = relationship("Product", back_populates="sentiments")

    __table_args__ = (
        Index("ix_sentiment_product_date", "product_id", "recorded_at"),
    )


# ── RAG Query Log ─────────────────────────────────────────────────
class RAGQueryLog(Base):
    __tablename__ = "rag_query_logs"

    id              = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    query           = Column(Text, nullable=False)
    retrieved_docs  = Column(Integer)
    sources_hit     = Column(ARRAY(String))
    tokens_used     = Column(Integer)
    response_ms     = Column(Integer)                      # latency in ms
    claude_model    = Column(String(50))
    created_at      = Column(DateTime(timezone=True), server_default=func.now())


# ── Social Mentions ───────────────────────────────────────────────
class SocialMention(Base):
    __tablename__ = "social_mentions"

    id              = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    product_id      = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=True)
    platform        = Column(String(50), nullable=False)   # twitter, reddit, instagram
    external_id     = Column(String(200))
    author_handle   = Column(String(150))
    content         = Column(Text, nullable=False)
    sentiment_score = Column(Float)
    sentiment_label = Column(String(30))
    likes           = Column(Integer, default=0)
    shares          = Column(Integer, default=0)
    embedding_id    = Column(String(100))
    posted_at       = Column(DateTime(timezone=True))
    ingested_at     = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        Index("ix_mentions_platform_date", "platform", "posted_at"),
    )
