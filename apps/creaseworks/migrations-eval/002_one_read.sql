-- creaseworks eval — schema v2: the AI "one read"
--
-- one_reads: a single cached Claude read per playdate. "One voice, not
-- the answer" — generated on demand, shown AFTER the room has scored.
-- one_read_votes: whether an evaluator found the read matched what they
-- felt ("if it does not match what the room found, mark it wrong").
--
-- Apply (remote):
--   npx wrangler d1 execute wv-creaseworks-eval --remote \
--     --config wrangler.eval.jsonc --file migrations-eval/002_one_read.sql

CREATE TABLE IF NOT EXISTS one_reads (
  playdate_slug TEXT PRIMARY KEY,
  text          TEXT NOT NULL,
  model         TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS one_read_votes (
  id             TEXT PRIMARY KEY,
  playdate_slug  TEXT NOT NULL,
  evaluator_name TEXT,
  agree          INTEGER NOT NULL CHECK (agree IN (0, 1)),
  created_at     TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_one_read_votes_playdate ON one_read_votes (playdate_slug);
