-- creaseworks eval — schema v5: distinguish child vs adult roster members.
--
-- Adults (parents/teachers) now get avatars too, so multiple grown-ups
-- across sessions are identifiable. kind defaults to 'child' so every
-- existing player row stays a child. The "who's playing?" picker uses
-- children (the within-child key); a "who's the grown-up?" selector uses
-- adults (facilitation attribution on observations + traces).
--
-- Apply (remote):
--   npx wrangler d1 execute wv-creaseworks-eval --remote \
--     --config wrangler.eval.jsonc --file migrations-eval/005_player_kind.sql

ALTER TABLE players ADD COLUMN kind TEXT NOT NULL DEFAULT 'child';
