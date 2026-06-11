-- creaseworks mini pilot — D1 schema (isolated from prod Neon entirely)
-- apply: npx wrangler d1 execute wv-creaseworks-mini --remote --file migrations-mini/001_pilot_schema.sql

CREATE TABLE IF NOT EXISTS sessions (
  code TEXT PRIMARY KEY,
  family_label TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS evidence (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL REFERENCES sessions(code),
  activity_slug TEXT,
  r2_key TEXT,
  body TEXT,
  approved INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS feedback (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL REFERENCES sessions(code),
  stage TEXT,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_evidence_approved ON evidence(approved, created_at);
CREATE INDEX IF NOT EXISTS idx_evidence_code ON evidence(code);
CREATE INDEX IF NOT EXISTS idx_feedback_code ON feedback(code);

-- pilot family codes — hand these out one per family/session.
-- friendly two-word codes: easy to say aloud, hard to typo.
INSERT OR IGNORE INTO sessions (code, family_label) VALUES
  ('sunny-fox', NULL), ('blue-pebble', NULL), ('happy-otter', NULL),
  ('green-acorn', NULL), ('silly-goose', NULL), ('tiny-comet', NULL),
  ('warm-biscuit', NULL), ('brave-snail', NULL), ('fuzzy-rocket', NULL),
  ('quiet-thunder', NULL), ('purple-walrus', NULL), ('dizzy-pancake', NULL),
  ('gentle-dragon', NULL), ('curly-cloud', NULL), ('spotty-lemon', NULL),
  ('wobbly-star', NULL), ('minty-yeti', NULL), ('jolly-radish', NULL),
  ('breezy-mango', NULL), ('lucky-noodle', NULL), ('cozy-orbit', NULL),
  ('peppy-fern', NULL), ('sandy-igloo', NULL), ('merry-quokka', NULL);
