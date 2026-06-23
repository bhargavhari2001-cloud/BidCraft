import { NextRequest, NextResponse } from "next/server";
import { generateEmbedding } from "@/lib/voyageai";
import { checkRateLimit, getClientIP, rateLimitError } from "@/lib/rateLimit";

const MAX_TEXT_LENGTH = 8_000;

export async function POST(request: NextRequest) {
  // Rate limit: 30 embeddings per minute per IP
  const ip = getClientIP(request);
  const rl = checkRateLimit(ip, 30);
  if (!rl.allowed) return rateLimitError(rl.resetAt);

  try {
    const { text } = await request.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Text is required and must be a string" },
        { status: 400 }
      );
    }
    if (text.length > MAX_TEXT_LENGTH) {
      return NextResponse.json(
        { error: `Text must be under ${MAX_TEXT_LENGTH} characters` },
        { status: 400 }
      );
    }

    const embedding = await generateEmbedding(text, "document");
    return NextResponse.json({ success: true, embedding });
  } catch (error: unknown) {
    console.error("Embedding generation error:", error);
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json(
      { error: "Failed to generate embedding", details: message },
      { status: 500 }
    );
  }
}
