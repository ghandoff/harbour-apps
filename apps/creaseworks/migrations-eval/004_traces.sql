-- creaseworks eval — schema v4: anonymous player roster + behavioural traces
--
-- Identity model (nested scopes, all anonymous — no child PII):
--   group   — a family or class code (pseudonym); owns a roster
--   player  — an anonymous avatar (e.g. "teal-otter"); the within-child key
--   device  — a localStorage token (a play-station, NOT a child)
--   session — one sitting
--
-- The roster API creates a group row on first use (idempotent) with the
-- kind set by the setup UI; codes are still meant to be collective-issued
-- in practice. Avatars carry NO names. events.player_id is nullable so the
-- anonymous fallback (no roster / skipped picker) still records cleanly.
--
-- Apply (remote):
--   npx wrangler d1 execute wv-creaseworks-eval --remote \
--     --config wrangler.eval.jsonc --file migrations-eval/004_traces.sql

CREATE TABLE IF NOT EXISTS groups (
  code       TEXT PRIMARY KEY,
  kind       TEXT NOT NULL CHECK (kind IN ('family', 'class')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS players (
  id         TEXT PRIMARY KEY,
  group_code TEXT NOT NULL,
  avatar     TEXT NOT NULL, -- e.g. "teal-otter" — anonymous, never a name
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS events (
  id           TEXT PRIMARY KEY,
  group_code   TEXT,
  player_id    TEXT,        -- nullable: anonymous fallback when no player selected
  device_token TEXT,
  session_id   TEXT,
  event_type   TEXT NOT NULL, -- session_start | stage_enter | activity_open
  stage        TEXT,          -- look | make | show | wow
  activity     TEXT,          -- look sub-mode (e.g. colour-catcher) or playdate slug
  seq          INTEGER,       -- order within a session (reconstructs the path)
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_players_group ON players (group_code);
CREATE INDEX IF NOT EXISTS idx_events_player ON events (player_id);
CREATE INDEX IF NOT EXISTS idx_events_group ON events (group_code);
CREATE INDEX IF NOT EXISTS idx_events_session ON events (session_id);
CREATE INDEX IF NOT EXISTS idx_events_created ON events (created_at);
