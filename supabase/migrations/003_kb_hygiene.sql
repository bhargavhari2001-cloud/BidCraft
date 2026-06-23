-- 003: Knowledge-base hygiene — duplicate + stale content detection
-- Mirrors Loopio's "library maintenance" capability using the embeddings
-- we already store. Run in the Supabase SQL editor.

-- Find near-duplicate KB entries via pgvector cosine similarity.
create or replace function kb_find_duplicates(
  similarity_threshold float default 0.92
)
returns table (
  id_a uuid,
  title_a text,
  id_b uuid,
  title_b text,
  similarity float
)
language sql stable
as $$
  select
    a.id as id_a,
    a.title as title_a,
    b.id as id_b,
    b.title as title_b,
    1 - (a.embedding <=> b.embedding) as similarity
  from knowledge_base a
  join knowledge_base b
    on a.id < b.id
  where a.embedding is not null
    and b.embedding is not null
    and 1 - (a.embedding <=> b.embedding) >= similarity_threshold
  order by similarity desc
  limit 50;
$$;

-- Find stale entries (not updated in N days).
create or replace function kb_find_stale(
  stale_days int default 90
)
returns table (
  id uuid,
  title text,
  category text,
  updated_at timestamptz,
  days_stale int
)
language sql stable
as $$
  select
    id, title, category, updated_at,
    extract(day from now() - updated_at)::int as days_stale
  from knowledge_base
  where updated_at < now() - (stale_days || ' days')::interval
  order by updated_at asc
  limit 100;
$$;
