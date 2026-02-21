-- ============================================================
-- BidCraft RAG Pipeline — Supabase Schema
-- Run this in the Supabase SQL Editor
-- ============================================================

-- Enable pgvector extension (must be enabled first)
create extension if not exists vector;

-- ──────────────────────────────────────────────
-- Knowledge Base
-- ──────────────────────────────────────────────
create table if not exists knowledge_base (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null default 'General',
  content text not null,
  tags text[] default '{}',
  source_rfp text,
  embedding vector(512),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Vector similarity index (ivfflat, cosine distance)
create index if not exists idx_kb_embedding
  on knowledge_base using ivfflat (embedding vector_cosine_ops)
  with (lists = 10);

create index if not exists idx_kb_category
  on knowledge_base(category);

-- ──────────────────────────────────────────────
-- RFP Projects
-- ──────────────────────────────────────────────
create table if not exists rfp_projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  file_name text,
  rfp_title text,
  issuing_organization text,
  submission_deadline text,
  questions jsonb default '[]',
  status text default 'parsing'
    check (status in ('parsing', 'review', 'responding', 'complete')),
  question_count integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ──────────────────────────────────────────────
-- Generated Responses
-- ──────────────────────────────────────────────
create table if not exists generated_responses (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references rfp_projects(id) on delete cascade,
  question_id text not null,
  draft text,
  tone text default 'professional',
  status text default 'pending'
    check (status in ('pending', 'generating', 'generated', 'edited')),
  edited_content text,
  rating text check (rating is null or rating in ('up', 'down')),
  confidence integer default 0,
  sources_used jsonb default '[]',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_responses_project
  on generated_responses(project_id);

-- ──────────────────────────────────────────────
-- Semantic search RPC function
-- ──────────────────────────────────────────────
create or replace function match_knowledge_base(
  query_embedding vector(512),
  match_threshold float default 0.3,
  match_count int default 5,
  filter_category text default null
)
returns table (
  id uuid,
  title text,
  category text,
  content text,
  tags text[],
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    kb.id,
    kb.title,
    kb.category,
    kb.content,
    kb.tags,
    1 - (kb.embedding <=> query_embedding) as similarity
  from knowledge_base kb
  where
    kb.embedding is not null
    and 1 - (kb.embedding <=> query_embedding) > match_threshold
    and (filter_category is null or kb.category = filter_category)
  order by kb.embedding <=> query_embedding
  limit match_count;
end;
$$;
