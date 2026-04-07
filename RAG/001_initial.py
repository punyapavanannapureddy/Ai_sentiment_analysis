"""initial schema

Revision ID: 001_initial
Create Date: 2026-03-27
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = '001_initial'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── products ────────────────────────────────────────────────
    op.create_table(
        'products',
        sa.Column('id',          postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('name',        sa.String(255), nullable=False),
        sa.Column('brand',       sa.String(100), nullable=False),
        sa.Column('category',    sa.String(100), nullable=False),
        sa.Column('price',       sa.Float),
        sa.Column('description', sa.Text),
        sa.Column('image_url',   sa.String(500)),
        sa.Column('asin',        sa.String(20), unique=True),
        sa.Column('sku',         sa.String(50)),
        sa.Column('tags',        postgresql.ARRAY(sa.String)),
        sa.Column('metadata',    postgresql.JSON, server_default='{}'),
        sa.Column('created_at',  sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at',  sa.DateTime(timezone=True)),
    )
    op.create_index('ix_products_brand', 'products', ['brand'])
    op.create_index('ix_products_category', 'products', ['category'])
    op.create_index('ix_products_name', 'products', ['name'])

    # ── reviews ─────────────────────────────────────────────────
    op.create_table(
        'reviews',
        sa.Column('id',              postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('product_id',      postgresql.UUID(as_uuid=True), sa.ForeignKey('products.id', ondelete='CASCADE'), nullable=False),
        sa.Column('source',          sa.String(50), nullable=False),
        sa.Column('external_id',     sa.String(200)),
        sa.Column('author',          sa.String(150)),
        sa.Column('title',           sa.String(500)),
        sa.Column('body',            sa.Text, nullable=False),
        sa.Column('rating',          sa.Float),
        sa.Column('helpful_votes',   sa.Integer, server_default='0'),
        sa.Column('verified',        sa.Boolean, server_default='false'),
        sa.Column('sentiment_score', sa.Float),
        sa.Column('sentiment_label', sa.String(30)),
        sa.Column('key_phrases',     postgresql.ARRAY(sa.String)),
        sa.Column('embedding_id',    sa.String(100)),
        sa.Column('review_date',     sa.DateTime(timezone=True)),
        sa.Column('ingested_at',     sa.DateTime(timezone=True), server_default=sa.text('now()')),
    )
    op.create_index('ix_reviews_product_source', 'reviews', ['product_id', 'source'])
    op.create_index('ix_reviews_sentiment', 'reviews', ['sentiment_label'])
    op.create_index('ix_reviews_date', 'reviews', ['review_date'])

    # ── sentiment_scores ─────────────────────────────────────────
    op.create_table(
        'sentiment_scores',
        sa.Column('id',           postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('product_id',   postgresql.UUID(as_uuid=True), sa.ForeignKey('products.id', ondelete='CASCADE'), nullable=False),
        sa.Column('score',        sa.Float, nullable=False),
        sa.Column('label',        sa.String(30)),
        sa.Column('positive_pct', sa.Float),
        sa.Column('neutral_pct',  sa.Float),
        sa.Column('negative_pct', sa.Float),
        sa.Column('review_count', sa.Integer),
        sa.Column('source',       sa.String(50), server_default="'all'"),
        sa.Column('period',       sa.String(20), server_default="'daily'"),
        sa.Column('recorded_at',  sa.DateTime(timezone=True), server_default=sa.text('now()')),
    )
    op.create_index('ix_sentiment_product_date', 'sentiment_scores', ['product_id', 'recorded_at'])

    # ── rag_query_logs ───────────────────────────────────────────
    op.create_table(
        'rag_query_logs',
        sa.Column('id',             postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('query',          sa.Text, nullable=False),
        sa.Column('retrieved_docs', sa.Integer),
        sa.Column('sources_hit',    postgresql.ARRAY(sa.String)),
        sa.Column('tokens_used',    sa.Integer),
        sa.Column('response_ms',    sa.Integer),
        sa.Column('claude_model',   sa.String(50)),
        sa.Column('created_at',     sa.DateTime(timezone=True), server_default=sa.text('now()')),
    )

    # ── social_mentions ──────────────────────────────────────────
    op.create_table(
        'social_mentions',
        sa.Column('id',              postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('product_id',      postgresql.UUID(as_uuid=True), sa.ForeignKey('products.id', ondelete='SET NULL'), nullable=True),
        sa.Column('platform',        sa.String(50), nullable=False),
        sa.Column('external_id',     sa.String(200)),
        sa.Column('author_handle',   sa.String(150)),
        sa.Column('content',         sa.Text, nullable=False),
        sa.Column('sentiment_score', sa.Float),
        sa.Column('sentiment_label', sa.String(30)),
        sa.Column('likes',           sa.Integer, server_default='0'),
        sa.Column('shares',          sa.Integer, server_default='0'),
        sa.Column('embedding_id',    sa.String(100)),
        sa.Column('posted_at',       sa.DateTime(timezone=True)),
        sa.Column('ingested_at',     sa.DateTime(timezone=True), server_default=sa.text('now()')),
    )
    op.create_index('ix_mentions_platform_date', 'social_mentions', ['platform', 'posted_at'])


def downgrade() -> None:
    op.drop_table('social_mentions')
    op.drop_table('rag_query_logs')
    op.drop_table('sentiment_scores')
    op.drop_table('reviews')
    op.drop_table('products')
