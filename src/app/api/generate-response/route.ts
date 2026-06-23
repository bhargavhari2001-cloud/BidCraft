import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { generateEmbedding } from "@/lib/voyageai";
import { semanticSearch } from "@/lib/semanticSearch";
import {
  buildSystemPrompt,
  buildUserMessage,
  buildKBSection,
  ResponseTone,
  ResponseLength,
} from "@/lib/prompts";
import { checkRateLimit, getClientIP, rateLimitError } from "@/lib/rateLimit";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const MAX_QUESTION_LENGTH = 2_000;
const MAX_PROFILE_BYTES = 10_000;

export async function POST(request: NextRequest) {
  // Rate limit: 20 AI calls per minute per IP
  const ip = getClientIP(request);
  const rl = checkRateLimit(ip, 20);
  if (!rl.allowed) return rateLimitError(rl.resetAt);

  try {
    const body = await request.json();
    const {
      questionText,
      questionCategory,
      companyProfile,
      companyName,
      tone = "professional" as ResponseTone,
      length = "standard" as ResponseLength,
    } = body;

    if (!questionText || typeof questionText !== "string") {
      return NextResponse.json({ error: "Question text is required" }, { status: 400 });
    }
    if (questionText.length > MAX_QUESTION_LENGTH) {
      return NextResponse.json(
        { error: `Question text must be under ${MAX_QUESTION_LENGTH} characters` },
        { status: 400 }
      );
    }
    if (companyProfile && JSON.stringify(companyProfile).length > MAX_PROFILE_BYTES) {
      return NextResponse.json({ error: "Company profile payload too large" }, { status: 400 });
    }

    const category =
      questionCategory && questionCategory !== "General" ? questionCategory : null;

    // ── Step 1: Generate embedding ONCE ──────────────────────────────────────
    // Previously the code called Voyage AI twice (primary + fallback). Now we
    // generate the vector once and reuse it for both DB queries in parallel.
    let queryEmbedding: number[] | null = null;
    try {
      queryEmbedding = await generateEmbedding(questionText, "query");
    } catch (err) {
      console.warn("Embedding generation failed, proceeding without KB context:", err);
    }

    // ── Step 2: Run category + broad searches in PARALLEL ─────────────────────
    let kbSources: { title: string; content: string; similarity?: number }[] = [];
    if (queryEmbedding) {
      try {
        const [categoryResults, broadResults] = await Promise.all([
          semanticSearch(questionText, {
            matchCount: 5,
            matchThreshold: 0.25,
            category,
            precomputedEmbedding: queryEmbedding,
          }),
          // Only run the broad search when we have a category to broaden from
          category
            ? semanticSearch(questionText, {
                matchCount: 5,
                matchThreshold: 0.25,
                category: null,
                precomputedEmbedding: queryEmbedding,
              })
            : Promise.resolve([]),
        ]);

        // Merge: category results first, fill gaps from broad search
        const seen = new Set(categoryResults.map((r) => r.title));
        kbSources = [...categoryResults];
        for (const r of broadResults) {
          if (!seen.has(r.title) && kbSources.length < 5) {
            kbSources.push({ title: r.title, content: r.content, similarity: r.similarity });
          }
        }
      } catch (err) {
        console.warn("Semantic search failed, proceeding without KB context:", err);
      }
    }

    // ── Step 3: Build prompts ─────────────────────────────────────────────────
    // System prompt contains only STATIC content (instructions + company profile).
    // This is identical for every question in a session → high cache hit rate.
    const systemPrompt = buildSystemPrompt({
      questionText,
      questionCategory: questionCategory || "General",
      companyProfile: companyProfile || null,
      companyName: companyName || companyProfile?.name || undefined,
      tone: tone as ResponseTone,
      length: length as ResponseLength,
    });

    // Dynamic KB context goes in the user message so it doesn't bust the cache.
    const kbSection = buildKBSection(kbSources);
    const userQuestion = buildUserMessage(questionText, questionCategory || "General");
    const userMessage =
      kbSources.length > 0 ? `${kbSection}\n\n${userQuestion}` : userQuestion;

    // ── Step 4: Call Claude with prompt caching enabled ───────────────────────
    // cache_control: ephemeral caches the system prompt for 5 minutes.
    // On cache hit: ~60–80% latency reduction, ~90% cost reduction on cached tokens.
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      system: [
        {
          type: "text",
          text: systemPrompt,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [{ role: "user", content: userMessage }],
    });

    const responseText =
      message.content[0].type === "text" ? message.content[0].text : "";

    let parsed;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch {
      return NextResponse.json(
        { error: "Failed to parse AI response", raw: responseText },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      draft: parsed.response,
      tone: parsed.tone || tone,
      confidence: parsed.confidence || 50,
      reasoning: parsed.reasoning || null,
      sourcesUsed: kbSources.map((kb) => ({
        title: kb.title,
        similarity: kb.similarity ? Math.round(kb.similarity * 100) : null,
      })),
      wordCount: (parsed.response || "").split(/\s+/).filter(Boolean).length,
    });
  } catch (error: unknown) {
    console.error("Response generation error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json(
      { error: "Failed to generate response", details: errorMessage },
      { status: 500 }
    );
  }
}
