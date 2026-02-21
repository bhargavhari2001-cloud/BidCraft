import { generateEmbedding } from "@/lib/voyageai";
import { getSupabaseServerClient } from "@/lib/supabase";

export interface SemanticSearchResult {
  id: string;
  title: string;
  category: string;
  content: string;
  tags: string[];
  similarity: number;
}

export async function semanticSearch(
  query: string,
  options?: {
    matchCount?: number;
    matchThreshold?: number;
    category?: string | null;
  }
): Promise<SemanticSearchResult[]> {
  const {
    matchCount = 5,
    matchThreshold = 0.3,
    category = null,
  } = options || {};

  const queryEmbedding = await generateEmbedding(query, "query");

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.rpc("match_knowledge_base", {
    query_embedding: JSON.stringify(queryEmbedding),
    match_threshold: matchThreshold,
    match_count: matchCount,
    filter_category: category,
  });

  if (error) {
    throw new Error(`Semantic search failed: ${error.message}`);
  }

  return (data || []) as SemanticSearchResult[];
}
