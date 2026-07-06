const VOYAGE_API_URL = "https://api.voyageai.com/v1/embeddings";
const VOYAGE_RERANK_URL = "https://api.voyageai.com/v1/rerank";
const MODEL = "voyage-3-lite";
const RERANK_MODEL = "rerank-2-lite";

/**
 * Thrown when Voyage returns 429. Kept distinct from a generic Error so
 * callers can show a clean "try again shortly" message instead of leaking
 * Voyage's raw response body (which includes their billing upsell copy)
 * straight into an API response.
 */
export class VoyageRateLimitError extends Error {
  constructor() {
    super("Voyage AI rate limit exceeded");
    this.name = "VoyageRateLimitError";
  }
}

async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  baseDelayMs = 600,
  shouldRetry: (err: unknown) => boolean = () => true
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      // A 429 on a 3 RPM budget won't clear in the ~600-2400ms backoff window
      // below — retrying just delays the inevitable failure. Fail fast instead.
      if (!shouldRetry(err)) throw err;
      if (attempt < maxAttempts - 1) {
        // Exponential backoff: 600ms, 1200ms, 2400ms
        await new Promise((r) => setTimeout(r, baseDelayMs * 2 ** attempt));
      }
    }
  }
  throw lastError;
}

export async function generateEmbeddings(
  texts: string[],
  inputType: "document" | "query" = "document"
): Promise<number[][]> {
  const apiKey = process.env.VOYAGE_API_KEY;
  if (!apiKey) throw new Error("VOYAGE_API_KEY environment variable is not set");

  return withRetry(
    async () => {
      const response = await fetch(VOYAGE_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ model: MODEL, input: texts, input_type: inputType }),
      });

      if (!response.ok) {
        if (response.status === 429) throw new VoyageRateLimitError();
        const errorText = await response.text();
        throw new Error(`Voyage AI error (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      return data.data.map((item: { embedding: number[] }) => item.embedding);
    },
    3,
    600,
    (err) => !(err instanceof VoyageRateLimitError)
  );
}

export async function generateEmbedding(
  text: string,
  inputType: "document" | "query" = "document"
): Promise<number[]> {
  const [embedding] = await generateEmbeddings([text], inputType);
  return embedding;
}

export interface RerankedDocument {
  index: number;
  relevanceScore: number;
}

/**
 * Cross-encoder reranking via Voyage rerank-2-lite. Returns the input
 * `documents` indices ordered by relevance to `query`, most relevant first.
 * Falls back to the original order (by returning null) if the call fails —
 * callers should treat reranking as a precision boost, not a hard dependency.
 */
export async function rerankDocuments(
  query: string,
  documents: string[],
  topK?: number
): Promise<RerankedDocument[] | null> {
  const apiKey = process.env.VOYAGE_API_KEY;
  // A single candidate can't be reordered — skip the (rate-limited) API call
  // entirely and let the caller fall back to original order.
  if (!apiKey || documents.length <= 1) return null;

  try {
    return await withRetry(
      async () => {
        const response = await fetch(VOYAGE_RERANK_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: RERANK_MODEL,
            query,
            documents,
            top_k: topK ?? documents.length,
          }),
        });

        if (!response.ok) {
          if (response.status === 429) throw new VoyageRateLimitError();
          const errorText = await response.text();
          throw new Error(`Voyage rerank error (${response.status}): ${errorText}`);
        }

        const data = await response.json();
        return data.data.map(
          (item: { index: number; relevance_score: number }) => ({
            index: item.index,
            relevanceScore: item.relevance_score,
          })
        );
      },
      2,
      500,
      (err) => !(err instanceof VoyageRateLimitError)
    );
  } catch (err) {
    console.warn("Voyage rerank failed, falling back to original order:", err);
    return null;
  }
}
