import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { semanticSearch } from "@/lib/semanticSearch";
import {
  buildSystemPrompt,
  buildUserMessage,
  ResponseTone,
  ResponseLength,
} from "@/lib/prompts";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
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

    if (!questionText) {
      return NextResponse.json(
        { error: "Question text is required" },
        { status: 400 }
      );
    }

    // Retrieve relevant KB entries via semantic search
    let kbSources: { title: string; content: string; similarity?: number }[] = [];
    try {
      const searchResults = await semanticSearch(questionText, {
        matchCount: 5,
        matchThreshold: 0.25,
        category:
          questionCategory && questionCategory !== "General"
            ? questionCategory
            : null,
      });
      kbSources = searchResults.map((r) => ({
        title: r.title,
        content: r.content,
        similarity: r.similarity,
      }));
    } catch (err) {
      console.warn("Semantic search failed, proceeding without KB context:", err);
    }

    // If category-filtered search returned too few results, try without category filter
    if (kbSources.length < 2 && questionCategory !== "General") {
      try {
        const fallbackResults = await semanticSearch(questionText, {
          matchCount: 5,
          matchThreshold: 0.25,
          category: null,
        });
        const existingIds = new Set(kbSources.map((s) => s.title));
        for (const r of fallbackResults) {
          if (!existingIds.has(r.title)) {
            kbSources.push({
              title: r.title,
              content: r.content,
              similarity: r.similarity,
            });
          }
          if (kbSources.length >= 5) break;
        }
      } catch {
        // ignore fallback failure
      }
    }

    const systemPrompt = buildSystemPrompt({
      questionText,
      questionCategory: questionCategory || "General",
      companyProfile: companyProfile || null,
      companyName: companyName || companyProfile?.name || undefined,
      kbSources,
      tone: tone as ResponseTone,
      length: length as ResponseLength,
    });

    const userMessage = buildUserMessage(
      questionText,
      questionCategory || "General"
    );

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      system: systemPrompt,
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
