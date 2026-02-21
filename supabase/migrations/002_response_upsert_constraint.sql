-- Add unique constraint for upsert support on generated_responses
-- Run this in the Supabase SQL Editor after 001_initial_schema.sql

ALTER TABLE generated_responses
  ADD CONSTRAINT uq_response_project_question
  UNIQUE (project_id, question_id);
