/**
 * api-client.js
 * Drop this into your ProductPulse frontend to connect to the real RAG backend.
 * Replace the hardcoded JS data arrays with these live API calls.
 */

const API_BASE = "http://localhost:8000/api";   // change for production

// ── Generic fetch helper ──────────────────────────────────────────
async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `API error ${res.status}`);
  }
  return res.json();
}


// ════════════════════════════════════════════════════════════════
// PRODUCTS
// ════════════════════════════════════════════════════════════════

export async function fetchProducts({ category, brand, limit = 50 } = {}) {
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  if (brand)    params.set("brand", brand);
  params.set("limit", limit);
  return apiFetch(`/products?${params}`);
  // Returns: { products: [...], total: number }
}

export async function fetchProduct(productId) {
  return apiFetch(`/products/${productId}`);
}

export async function createProduct(data) {
  return apiFetch("/products", {
    method: "POST",
    body: JSON.stringify(data),
  });
}


// ════════════════════════════════════════════════════════════════
// REVIEWS
// ════════════════════════════════════════════════════════════════

export async function fetchReviews(productId, { source, sentiment, limit = 50 } = {}) {
  const params = new URLSearchParams({ limit });
  if (source)    params.set("source", source);
  if (sentiment) params.set("sentiment", sentiment);
  return apiFetch(`/products/${productId}/reviews?${params}`);
  // Returns: { reviews: [...] }
}

export async function addReview(data) {
  return apiFetch("/reviews", {
    method: "POST",
    body: JSON.stringify(data),
  });
}


// ════════════════════════════════════════════════════════════════
// SENTIMENT
// ════════════════════════════════════════════════════════════════

export async function fetchSentimentHistory(productId, { period = "daily", limit = 30 } = {}) {
  return apiFetch(`/products/${productId}/sentiment?period=${period}&limit=${limit}`);
  // Returns: { sentiment_history: [{ score, label, recorded_at, ... }] }
}

export async function fetchSentimentOverview() {
  return apiFetch("/sentiment/overview");
  // Returns: { products: [{ id, name, brand, sentiment_score, review_count }] }
}


// ════════════════════════════════════════════════════════════════
// RAG QUERY  ←  THE MAIN AI ENDPOINT
// ════════════════════════════════════════════════════════════════

/**
 * Send a question through the full RAG pipeline.
 *
 * @param {string} query - User's question
 * @param {Array}  conversationHistory - [{role, content}, ...]
 * @param {string} productId - Optional: filter retrieval to one product
 * @returns RAGQueryResponse
 */
export async function ragQuery(query, conversationHistory = [], productId = null) {
  return apiFetch("/rag/query", {
    method: "POST",
    body: JSON.stringify({
      query,
      conversation_history: conversationHistory,
      product_id: productId,
      n_retrieve: 8,
    }),
  });
  /*
  Returns:
  {
    answer:            string,
    retrieved_chunks:  [{ text, metadata, similarity, id }],
    sources_hit:       string[],
    docs_retrieved:    number,
    tokens_used:       number,
    response_ms:       number,
  }
  */
}


/**
 * Streaming RAG query using Server-Sent Events.
 * Calls onToken for each streamed text chunk.
 * Calls onMeta with { chunks, sources } metadata first.
 * Calls onDone when stream ends.
 */
export async function ragQueryStream(query, conversationHistory = [], { onToken, onMeta, onDone, onError } = {}) {
  const res = await fetch(`${API_BASE}/rag/query/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query,
      conversation_history: conversationHistory,
      n_retrieve: 8,
      stream: true,
    }),
  });

  if (!res.ok) {
    onError?.(`Stream error ${res.status}`);
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const lines = decoder.decode(value).split("\n");
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const data = line.slice(6).trim();
      if (data === "[DONE]") { onDone?.(); return; }

      try {
        const parsed = JSON.parse(data);
        if (parsed.type === "meta")  onMeta?.(parsed);
        if (parsed.type === "token") onToken?.(parsed.text);
      } catch {}
    }
  }
}


// ════════════════════════════════════════════════════════════════
// ANALYTICS
// ════════════════════════════════════════════════════════════════

export async function fetchRAGStats() {
  return apiFetch("/analytics/rag-stats");
  // Returns: { total_queries, avg_response_ms, avg_docs_retrieved, total_tokens }
}


// ════════════════════════════════════════════════════════════════
// USAGE EXAMPLE — replace the hardcoded `send()` function
// ════════════════════════════════════════════════════════════════
/*

// In your ProductPulse HTML, replace the `callClaude()` function with:

async function callClaude(query) {
  showTyping();

  try {
    // Option A: Standard (wait for full response)
    const result = await ragQuery(query, history);
    removeTyping();
    appendAI(result.answer, result.sources_hit);

    // Update RAG sidebar with real data
    document.getElementById('d-ret').textContent = result.docs_retrieved;
    document.getElementById('s-hit').textContent  = result.sources_hit.length;
    document.getElementById('tok-used').textContent = result.tokens_used.toLocaleString();

    // Show retrieved chunks
    renderRetrievedChunks(result.retrieved_chunks);

    history.push({ role: "assistant", content: result.answer });

  } catch (err) {
    removeTyping();
    appendAI(`⚠️ Error: ${err.message}`, []);
  }
}


// Option B: Streaming (tokens appear as they're generated)
async function callClaudeStream(query) {
  showTyping();
  let fullText = "";
  let msgEl = null;

  await ragQueryStream(query, history, {
    onMeta: ({ chunks, sources }) => {
      removeTyping();
      msgEl = appendAIStreaming(`📡 Retrieved ${chunks} chunks from ${sources.join(", ")}...\n\n`);
    },
    onToken: (token) => {
      fullText += token;
      if (msgEl) updateStreamingMsg(msgEl, fullText);
    },
    onDone: () => {
      history.push({ role: "assistant", content: fullText });
    },
    onError: (err) => {
      removeTyping();
      appendAI(`⚠️ Stream error: ${err}`, []);
    },
  });
}

*/
