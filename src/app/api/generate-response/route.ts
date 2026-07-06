import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { generateEmbedding, rerankDocuments } from "@/lib/voyageai";
import { extractJson } from "@/lib/extractJson";
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
      debug = false,
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

        // Merge: category results first, fill gaps from broad search.
        // Cast a wider net (up to 10) than we'll ultimately use (5) so the
        // reranker below has real candidates to discriminate between —
        // reranking 5 embedding-search results down to 5 buys nothing.
        const seen = new Set(categoryResults.map((r) => r.title));
        const candidates = [...categoryResults];
        for (const r of broadResults) {
          if (!seen.has(r.title) && candidates.length < 10) {
            seen.add(r.title);
            candidates.push(r);
          }
        }

        // ── Step 2b: Rerank candidates with a cross-encoder ──────────────────
        // Embedding similarity ranks by topic overlap; rerank-2-lite reads
        // query and document together and is much better at telling apart
        // near-duplicate sections (e.g. the same section template repeated
        // across many seeded proposals) than cosine distance alone.
        const reranked = await rerankDocuments(
          questionText,
          candidates.map((c) => c.content),
          5
        );

        kbSources = reranked
          ? reranked.map((r) => candidates[r.index])
          : candidates.slice(0, 5);
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
      model: "claude-sonnet-5",
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

    // claude-sonnet-5 may emit a leading "thinking" block before the text
    // block, so find the first text block rather than assuming index 0.
    const responseText =
      message.content.find((block) => block.type === "text")?.text ?? "";

    let parsed: { response: string; tone?: string; confidence?: number; reasoning?: string };
    try {
      parsed = extractJson(responseText);
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
      // Only included when explicitly requested (e.g. by the eval harness),
      // which needs the actual retrieved text to score faithfulness against.
      // Gated to non-production so this endpoint — which has no auth — can
      // never be used to exfiltrate raw KB content from a live deployment.
      ...(debug && process.env.NODE_ENV !== "production"
        ? { contextUsed: kbSources.map((kb) => kb.content) }
        : {}),
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
