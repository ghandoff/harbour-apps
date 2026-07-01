-- 002_moderation.sql — human-in-the-loop photo moderation.
--
-- `moderated_at` distinguishes a REVIEWED-but-rejected photo (approved=0,
-- moderated_at set → leaves the queue, stays hidden) from a pending one
-- (approved=0, moderated_at NULL → in the queue). Approve sets both.
--
-- `moderation_log` is append-only: one row per decision, capturing who
-- decided, why, and quick tags. This is the labelled corpus that later
-- trains an AI pre-screen ("what we look for / what to look out for").

ALTER TABLE evidence ADD COLUMN moderated_at TEXT;

CREATE TABLE IF NOT EXISTS moderation_log (
  id TEXT PRIMARY KEY,
  evidence_id TEXT NOT NULL,
  decision TEXT NOT NULL,          -- 'approve' | 'reject'
  reviewer TEXT,                   -- tapped name (jamie/garrett/maria/payton/lamis)
  reason TEXT,                     -- free-text rationale
  tags TEXT,                       -- JSON array of quick tags
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_moderation_evidence ON moderation_log(evidence_id);
CREATE INDEX IF NOT EXISTS idx_evidence_pending ON evidence(approved, moderated_at);
