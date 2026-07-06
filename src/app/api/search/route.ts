import { NextRequest, NextResponse } from "next/server";
import { semanticSearch } from "@/lib/semanticSearch";
import { rerankDocuments, VoyageRateLimitError } from "@/lib/voyageai";
import { checkRateLimit, getClientIP, rateLimitError } from "@/lib/rateLimit";

const MAX_QUERY_LENGTH = 500;

export async function POST(request: NextRequest) {
  // Rate limit: 30 searches per minute per IP
  const ip = getClientIP(request);
  const rl = checkRateLimit(ip, 30);
  if (!rl.allowed) return rateLimitError(rl.resetAt);

  try {
    const { query, category, matchCount, rerank } = await request.json();

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { error: "Query is required and must be a string" },
        { status: 400 }
      );
    }
    if (query.length > MAX_QUERY_LENGTH) {
      return NextResponse.json(
        { error: `Query must be under ${MAX_QUERY_LENGTH} characters` },
        { status: 400 }
      );
    }

    const finalCount = Math.min(matchCount || 5, 20);

    // Reranking is opt-in: it costs an extra Voyage call, so callers that
    // just want fast plain vector search (e.g. autocomplete-style UI) aren't
    // slowed down by default.
    const results = await semanticSearch(query, {
      matchCount: rerank ? Math.min(finalCount * 2, 20) : finalCount,
      category: category === "All" ? null : category || null,
    });

    if (!rerank || results.length === 0) {
      return NextResponse.json({ success: true, results: results.slice(0, finalCount) });
    }

    const reranked = await rerankDocuments(
      query,
      results.map((r) => r.content),
      finalCount
    );

    const finalResults = reranked
      ? reranked.map((r) => results[r.index])
      : results.slice(0, finalCount);

    return NextResponse.json({ success: true, results: finalResults });
  } catch (error: unknown) {
    console.error("Semantic search error:", error);

    // Voyage's raw error body includes their billing/upsell copy — never
    // forward it to the client. Surface a clean, actionable message instead.
    if (error instanceof VoyageRateLimitError) {
      return NextResponse.json(
        { error: "Search is temporarily rate-limited upstream. Please try again shortly." },
        { status: 503, headers: { "Retry-After": "20" } }
      );
    }

    return NextResponse.json({ error: "Search failed. Please try again." }, { status: 500 });
  }
}
