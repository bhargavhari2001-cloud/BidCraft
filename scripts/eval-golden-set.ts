/**
 * RAGAS-style faithfulness + answer-relevancy eval for BidCraft's RAG pipeline.
 *
 * Run: npx tsx scripts/eval-golden-set.ts
 *
 * Prerequisites:
 *   - The app is running (default http://localhost:3001) — this hits the
 *     real /api/generate-response route, not the pipeline in isolation.
 *   - ANTHROPIC_API_KEY set in .env.local (used as the judge model)
 *
 * The golden set (scripts/eval/golden-qa-set.json) is 75 Q&A pairs sampled
 * directly from the seeded knowledge_base (5 per engagement category), so
 * this measures regressions in the pipeline, not held-out generalization —
 * the golden answers are drawn from the same corpus the KB was seeded from.
 *
 * Env vars:
 *   BASE_URL                  App base URL (default http://localhost:3001)
 *   EVAL_SAMPLE_SIZE           How many golden questions to run (default 75, all)
 *   EVAL_DELAY_MS              Delay between questions (default 42000ms —
 *                              generate-response makes 2 Voyage calls per
 *                              question; free tier is 3 RPM, so >=40s keeps
 *                              us under the limit long-run)
 *   FAITHFULNESS_THRESHOLD     Fail below this mean (default 0.6)
 *   RELEVANCY_THRESHOLD        Fail below this mean (default 0.6)
 */

import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import Anthropic from "@anthropic-ai/sdk";

function loadEnvLocal() {
  try {
    const envPath = resolve(process.cwd(), ".env.local");
    const content = readFileSync(envPath, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const value = trimmed.slice(eqIdx + 1).trim();
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    console.warn("Could not read .env.local — using existing env vars");
  }
}
loadEnvLocal();

const BASE_URL = process.env.BASE_URL || "http://localhost:3001";
const DELAY_MS = Number(process.env.EVAL_DELAY_MS) || 42_000;
const FAITHFULNESS_THRESHOLD = Number(process.env.FAITHFULNESS_THRESHOLD) || 0.6;
const RELEVANCY_THRESHOLD = Number(process.env.RELEVANCY_THRESHOLD) || 0.6;

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface GoldenItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  vertical: string;
  proposal_id: string;
}

interface JudgeResult {
  faithfulness: number;
  relevancy: number;
  notes: string;
}

// Evenly-spaced sample so a smaller EVAL_SAMPLE_SIZE still spans every
// category, rather than exhausting the first few categories in the file.
function sampleEvenly<T>(items: T[], count: number): T[] {
  if (count >= items.length) return items;
  const step = items.length / count;
  return Array.from({ length: count }, (_, i) => items[Math.floor(i * step)]);
}

async function generateResponse(item: GoldenItem) {
  const res = await fetch(`${BASE_URL}/api/generate-response`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      questionText: item.question,
      questionCategory: item.category,
      tone: "professional",
      length: "standard",
      debug: true,
    }),
  });
  if (!res.ok) throw new Error(`generate-response ${res.status}: ${await res.text()}`);
  return res.json() as Promise<{ draft: string; contextUsed: string[]; sourcesUsed: unknown[] }>;
}

// Single Claude call scoring both RAGAS metrics to keep judge cost down:
//  - faithfulness: fraction of atomic claims in the draft supported by the
//    retrieved context (catches hallucination introduced by the pipeline).
//  - relevancy: 0-1, how directly the draft addresses the golden question
//    (independent of whether it's factually grounded).
async function judge(question: string, draft: string, context: string[]): Promise<JudgeResult> {
  const prompt = `You are evaluating a RAG pipeline's output using the RAGAS methodology.

QUESTION:
${question}

RETRIEVED CONTEXT (what the pipeline had available to ground its answer):
${context.map((c, i) => `[${i + 1}] ${c}`).join("\n\n")}

GENERATED ANSWER:
${draft}

Score two things:
1. FAITHFULNESS: Break the generated answer into atomic factual claims. For each claim, decide if it is directly supported by the retrieved context (not just plausible-sounding, but actually stated or clearly implied there). faithfulness = supported_claims / total_claims.
2. RELEVANCY: On a 0.0-1.0 scale, how directly does the generated answer address the question asked (regardless of whether it's factually grounded)?

Respond ONLY with JSON: {"faithfulness": 0.0-1.0, "relevancy": 0.0-1.0, "notes": "<20 words explaining the faithfulness score"}`;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 1024,
    // Disable extended thinking: this is a straightforward scoring task, and
    // leaving thinking on risks the (unbounded, by default) thinking block
    // consuming the whole token budget and leaving nothing for the JSON output.
    thinking: { type: "disabled" },
    messages: [{ role: "user", content: prompt }],
  });

  const text = message.content.find((b) => b.type === "text")?.text ?? "";
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error(`Judge returned no JSON: ${text}`);
  return JSON.parse(match[0]);
}

async function main() {
  const goldenSetPath = resolve(process.cwd(), "scripts/eval/golden-qa-set.json");
  const fullSet: GoldenItem[] = JSON.parse(readFileSync(goldenSetPath, "utf-8"));
  const sampleSize = Number(process.env.EVAL_SAMPLE_SIZE) || fullSet.length;
  const items = sampleEvenly(fullSet, sampleSize);

  console.log(`RAG eval: ${items.length}/${fullSet.length} golden questions against ${BASE_URL}`);
  console.log(`Pacing: ${DELAY_MS}ms between questions (Voyage free-tier rate limit)\n`);

  const results: (JudgeResult & { question: string; category: string })[] = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    try {
      const { draft, contextUsed } = await generateResponse(item);
      const scored = await judge(item.question, draft, contextUsed || []);
      results.push({ ...scored, question: item.question, category: item.category });
      console.log(
        `[${i + 1}/${items.length}] faithfulness=${scored.faithfulness.toFixed(2)} relevancy=${scored.relevancy.toFixed(2)}  ${item.category}`
      );
    } catch (err) {
      console.warn(`[${i + 1}/${items.length}] FAILED: ${(err as Error).message}`);
      results.push({ faithfulness: 0, relevancy: 0, notes: "eval error", question: item.question, category: item.category });
    }
    if (i < items.length - 1) await sleep(DELAY_MS);
  }

  const mean = (key: "faithfulness" | "relevancy") =>
    results.reduce((sum, r) => sum + r[key], 0) / results.length;

  const meanFaithfulness = mean("faithfulness");
  const meanRelevancy = mean("relevancy");

  const report = {
    ranAt: new Date().toISOString(),
    sampleSize: items.length,
    meanFaithfulness,
    meanRelevancy,
    thresholds: { faithfulness: FAITHFULNESS_THRESHOLD, relevancy: RELEVANCY_THRESHOLD },
    results,
  };
  writeFileSync(resolve(process.cwd(), "scripts/eval/last-run-report.json"), JSON.stringify(report, null, 2));

  console.log(`\n${"=".repeat(50)}`);
  console.log(`Mean faithfulness: ${meanFaithfulness.toFixed(3)}  (threshold ${FAITHFULNESS_THRESHOLD})`);
  console.log(`Mean relevancy:    ${meanRelevancy.toFixed(3)}  (threshold ${RELEVANCY_THRESHOLD})`);
  console.log(`Full report: scripts/eval/last-run-report.json`);

  if (meanFaithfulness < FAITHFULNESS_THRESHOLD || meanRelevancy < RELEVANCY_THRESHOLD) {
    console.error("\nFAILED: score(s) below threshold");
    process.exit(1);
  }
  console.log("\nPASSED");
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
