import { NextRequest, NextResponse } from "next/server";
import { semanticSearch } from "@/lib/semanticSearch";

export async function POST(request: NextRequest) {
  try {
    const { query, category, matchCount } = await request.json();

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { error: "Query is required and must be a string" },
        { status: 400 }
      );
    }

    const results = await semanticSearch(query, {
      matchCount: matchCount || 5,
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
