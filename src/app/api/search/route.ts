import { NextRequest, NextResponse } from "next/server";
import { semanticSearch } from "@/lib/semanticSearch";
import { checkRateLimit, getClientIP, rateLimitError } from "@/lib/rateLimit";

const MAX_QUERY_LENGTH = 500;

export async function POST(request: NextRequest) {
  // Rate limit: 30 searches per minute per IP
  const ip = getClientIP(request);
  const rl = checkRateLimit(ip, 30);
  if (!rl.allowed) return rateLimitError(rl.resetAt);

  try {
    const { query, category, matchCount } = await request.json();

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

    const results = await semanticSearch(query, {
      matchCount: Math.min(matchCount || 5, 20),
      category: category === "All" ? null : category || null,
    });

    return NextResponse.json({ success: true, results });
  } catch (error: unknown) {
    console.error("Semantic search error:", error);
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json(
      { error: "Search failed", details: message },
      { status: 500 }
    );
  }
}
