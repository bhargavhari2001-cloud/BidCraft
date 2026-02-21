import { NextRequest, NextResponse } from "next/server";
import { generateEmbedding } from "@/lib/voyageai";

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Text is required and must be a string" },
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
