-- 005: Swap ivfflat for HNSW on knowledge_base.embedding
-- ivfflat's recall degrades as the table grows past its trained `lists` size,
-- and lists=10 was tuned for a table that no longer exists at this row count.
-- HNSW gives better recall/latency at this scale and doesn't need retraining
-- as rows are added. Run in the Supabase SQL editor.

drop index if exists idx_kb_embedding;

create index if not exists idx_kb_embedding_hnsw
  on knowledge_base using hnsw (embedding vector_cosine_ops)
  with (m = 16, ef_construction = 64);
