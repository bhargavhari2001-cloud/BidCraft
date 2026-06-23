-- ============================================================
-- 004: Row-Level Security (RLS) policies
-- Run in the Supabase SQL editor.
-- ============================================================
-- WHY: The anon key is publicly exposed in NEXT_PUBLIC_SUPABASE_ANON_KEY.
-- Without RLS anyone can read/write all tables via the Supabase client SDK.
-- RLS restricts what the anon key can do; the service-role key (server-only)
-- bypasses RLS and retains full access.
-- ============================================================

-- ── knowledge_base ───────────────────────────────────────────
-- Public reads are fine (it's your company's own reference data).
-- Writes must go through the API layer (service-role key only).

ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "kb_public_read" ON knowledge_base;
CREATE POLICY "kb_public_read"
  ON knowledge_base
  FOR SELECT
  USING (true);

-- No explicit INSERT/UPDATE/DELETE policy for anon → anon key cannot write.
-- The service-role key bypasses RLS, so server-side seeding/edits still work.

-- ── rfp_projects ─────────────────────────────────────────────
-- Projects are saved locally (localStorage) in the MVP; Supabase is only used
-- via the service-role key on the server side. Restrict anon to read-only.

ALTER TABLE rfp_projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "projects_public_read" ON rfp_projects;
CREATE POLICY "projects_public_read"
  ON rfp_projects
  FOR SELECT
  USING (true);

-- ── generated_responses ──────────────────────────────────────
-- Responses are written from the browser via the anon key (responseService.ts).
-- Allow full anon access for now; add per-user policies when auth is introduced.
-- TODO: Replace with user-scoped policy once Supabase Auth is integrated.

ALTER TABLE generated_responses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "responses_anon_all" ON generated_responses;
CREATE POLICY "responses_anon_all"
  ON generated_responses
  FOR ALL
  USING (true)
  WITH CHECK (true);
