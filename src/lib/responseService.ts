import { GeneratedResponse } from "@/types";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase";

/**
 * Save a generated response to Supabase (best-effort, non-blocking).
 * localStorage persistence is still handled by the responses page via storage.ts.
 */
export async function saveResponseToSupabase(
  projectId: string,
  response: GeneratedResponse
): Promise<void> {
  if (!isSupabaseConfigured()) return;

  try {
    const supabase = getSupabaseBrowserClient();
    await supabase.from("generated_responses").upsert(
      {
        project_id: projectId,
        question_id: response.questionId,
        draft: response.draft,
        tone: response.tone,
        status: response.status,
        edited_content: response.editedContent || null,
        rating: response.rating || null,
        confidence: response.confidence,
        sources_used: response.sourcesUsed || [],
        updated_at: new Date().toISOString(),
      },
      { onConflict: "project_id,question_id", ignoreDuplicates: false }
    );
  } catch (err) {
    console.warn("Failed to save response to Supabase:", err);
  }
}

/**
 * Save multiple responses to Supabase in a batch.
 */
export async function saveResponsesToSupabase(
  projectId: string,
  responses: GeneratedResponse[]
): Promise<void> {
  if (!isSupabaseConfigured() || responses.length === 0) return;

  try {
    const supabase = getSupabaseBrowserClient();
    const rows = responses.map((r) => ({
      project_id: projectId,
      question_id: r.questionId,
      draft: r.draft,
      tone: r.tone,
      status: r.status,
      edited_content: r.editedContent || null,
      rating: r.rating || null,
      confidence: r.confidence,
      sources_used: r.sourcesUsed || [],
      updated_at: new Date().toISOString(),
    }));

    await supabase.from("generated_responses").upsert(rows, {
      onConflict: "project_id,question_id",
      ignoreDuplicates: false,
    });
  } catch (err) {
    console.warn("Failed to batch save responses to Supabase:", err);
  }
}
