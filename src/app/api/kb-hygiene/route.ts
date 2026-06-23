import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";
import { checkRateLimit, getClientIP, rateLimitError } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

/**
 * GET /api/kb-hygiene
 * Library-health report: near-duplicate entries (pgvector cosine
 * similarity over existing embeddings) and stale entries (90+ days
 * without an update). Requires migration 003_kb_hygiene.sql.
 */
export async function GET(request: NextRequest) {
  // Rate limit: 5 hygiene checks per minute per IP (expensive cross-join query)
  const ip = getClientIP(request);
  const rl = checkRateLimit(ip, 5);
  if (!rl.allowed) return rateLimitError(rl.resetAt);

  try {
    const supabase = getSupabaseServerClient();

    const [dupes, stale] = await Promise.all([
      supabase.rpc("kb_find_duplicates", { similarity_threshold: 0.92 }),
      supabase.rpc("kb_find_stale", { stale_days: 90 }),
    ]);

    if (dupes.error || stale.error) {
      const message = dupes.error?.message || stale.error?.message || "";
      const migrationMissing = /function .* does not exist/i.test(message);
      return NextResponse.json(
        {
          error: migrationMissing
            ? "Hygiene functions not found. Run supabase/migrations/003_kb_hygiene.sql in the Supabase SQL editor."
            : `Hygiene query failed: ${message}`,
        },
        { status: migrationMissing ? 501 : 500 }
      );
    }

    return NextResponse.json({
      duplicates: dupes.data || [],
      stale: stale.data || [],
      checkedAt: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
