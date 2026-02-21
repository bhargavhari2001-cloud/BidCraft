import { KnowledgeBaseEntry } from "@/types";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase";
import * as localStorage from "@/lib/storage";

/**
 * Knowledge Base Service
 *
 * Abstraction layer that uses Supabase as primary storage
 * with localStorage as fallback. Embedding generation is
 * handled via the /api/embeddings route on save.
 */

// ── Read ──

export async function getKnowledgeBaseEntries(): Promise<KnowledgeBaseEntry[]> {
  if (!isSupabaseConfigured()) {
    return localStorage.getKnowledgeBase();
  }

  try {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase
      .from("knowledge_base")
      .select("id, title, category, content, tags, created_at, updated_at")
      .order("updated_at", { ascending: false });

    if (error) throw error;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return ((data || []) as any[]).map((row: any) => ({
      id: row.id,
      title: row.title,
      category: row.category,
      content: row.content,
      tags: row.tags || [],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  } catch (err) {
    console.warn("Supabase KB fetch failed, falling back to localStorage:", err);
    return localStorage.getKnowledgeBase();
  }
}

// ── Save (upsert) ──

export async function saveKnowledgeBaseEntry(
  entry: KnowledgeBaseEntry
): Promise<void> {
  // Always save to localStorage as backup
  localStorage.saveKnowledgeBaseEntry(entry);

  if (!isSupabaseConfigured()) return;

  // Generate embedding
  let embedding: number[] | null = null;
  try {
    const res = await fetch("/api/embeddings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: `${entry.title}\n${entry.content}` }),
    });
    if (res.ok) {
      const data = await res.json();
      embedding = data.embedding;
    }
  } catch (err) {
    console.warn("Embedding generation failed:", err);
  }

  try {
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.from("knowledge_base").upsert({
      id: entry.id,
      title: entry.title,
      category: entry.category,
      content: entry.content,
      tags: entry.tags,
      embedding: embedding ? JSON.stringify(embedding) : null,
      updated_at: new Date().toISOString(),
    });
    if (error) throw error;
  } catch (err) {
    console.warn("Supabase KB save failed:", err);
  }
}

// ── Delete ──

export async function deleteKnowledgeBaseEntry(id: string): Promise<void> {
  localStorage.deleteKnowledgeBaseEntry(id);

  if (!isSupabaseConfigured()) return;

  try {
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase
      .from("knowledge_base")
      .delete()
      .eq("id", id);
    if (error) throw error;
  } catch (err) {
    console.warn("Supabase KB delete failed:", err);
  }
}

// ── Semantic Search (via API route) ──

export interface SemanticSearchResult {
  id: string;
  title: string;
  category: string;
  content: string;
  tags: string[];
  similarity: number;
}

export async function searchKnowledgeBaseSemantic(
  query: string,
  category?: string,
  matchCount?: number
): Promise<SemanticSearchResult[]> {
  try {
    const res = await fetch("/api/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query,
        category: category || null,
        matchCount: matchCount || 5,
      }),
    });

    if (!res.ok) {
      throw new Error(`Search API returned ${res.status}`);
    }

    const data = await res.json();
    return data.results || [];
  } catch (err) {
    console.warn("Semantic search failed:", err);
    return [];
  }
}
