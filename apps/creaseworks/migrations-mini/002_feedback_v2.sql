-- feedback v2 — shaped for the shared 🐛 FeedbackWidget payload.
-- code becomes nullable (code-less bug reports are still valuable);
-- adds feedback_type / severity / route / ua. one test row existed —
-- drop-and-recreate is fine at pilot scale.
-- apply: npx wrangler d1 execute wv-creaseworks-mini --remote --file migrations-mini/002_feedback_v2.sql

DROP TABLE IF EXISTS feedback;

CREATE TABLE feedback (
  id TEXT PRIMARY KEY,
  code TEXT,
  stage TEXT,
  feedback_type TEXT,
  severity INTEGER,
  route TEXT,
  ua TEXT,
  body TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_feedback_code ON feedback(code);
CREATE INDEX IF NOT EXISTS idx_feedback_created ON feedback(created_at);
