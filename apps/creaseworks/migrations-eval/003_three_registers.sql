-- creaseworks eval — schema v3: three registers
--
-- register changes from (felt, frame) to (kid, grownup, collective).
-- SQLite can't alter a CHECK constraint in place, so recreate the table.
-- Safe: all test rows were cleared, so evaluations is empty. one_reads and
-- one_read_votes are untouched.
--
-- Apply (remote):
--   npx wrangler d1 execute wv-creaseworks-eval --remote \
--     --config wrangler.eval.jsonc --file migrations-eval/003_three_registers.sql

DROP TABLE IF EXISTS evaluations;

CREATE TABLE evaluations (
  id             TEXT PRIMARY KEY,
  playdate_slug  TEXT NOT NULL,
  evaluator_name TEXT,
  register       TEXT NOT NULL CHECK (register IN ('kid', 'grownup', 'collective')),
  answers_json   TEXT NOT NULL,
  created_at     TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_evaluations_playdate ON evaluations (playdate_slug);
CREATE INDEX IF NOT EXISTS idx_evaluations_register ON evaluations (register);
