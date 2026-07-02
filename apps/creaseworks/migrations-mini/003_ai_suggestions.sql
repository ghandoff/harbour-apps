-- 003_ai_suggestions.sql — AI pre-screen for moderation.
--
-- `ai_suggestions` caches one draft call per photo (generated once, not
-- re-billed per queue load). `moderation_log.ai_suggestion` records what the
-- AI had suggested at the moment a human decided — so we can measure where
-- humans override the AI (the sharpest signal for tuning the rubric).

CREATE TABLE IF NOT EXISTS ai_suggestions (
  evidence_id TEXT PRIMARY KEY,
  suggestion TEXT,                 -- 'approve' | 'reject'
  reason TEXT,
  tags TEXT,                       -- JSON array
  model TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

ALTER TABLE moderation_log ADD COLUMN ai_suggestion TEXT;  -- 'approve' | 'reject' | NULL
