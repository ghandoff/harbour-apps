-- creaseworks eval — schema v1
--
-- One row per submitted evaluation: a person, a playdate, a register
-- (felt or frame), and their answers as a JSON blob keyed by rubric
-- item id. The blob keeps the schema loose so the rubric can evolve
-- without a migration every time an item is added. The dashboard parses
-- the blob; D1 (SQLite) has json_extract if we ever want SQL-side reads.
--
-- Apply (remote):
--   npx wrangler d1 execute wv-creaseworks-eval --remote \
--     --config wrangler.eval.jsonc --file migrations-eval/001_eval_schema.sql

CREATE TABLE IF NOT EXISTS evaluations (
  id             TEXT PRIMARY KEY,
  playdate_slug  TEXT NOT NULL,
  evaluator_name TEXT,
  register       TEXT NOT NULL CHECK (register IN ('felt', 'frame')),
  answers_json   TEXT NOT NULL,
  created_at     TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_evaluations_playdate ON evaluations (playdate_slug);
CREATE INDEX IF NOT EXISTS idx_evaluations_register ON evaluations (register);
