-- 004_trace_events.sql — mini-local behavioural trace (the "stealth assessment").
--
-- Additive: no existing table changes. Keyed to family_code ONLY — there is NO
-- child-identity field anywhere here or in any payload (enforced in the client
-- + the write route, not just policy). No event is required for play to proceed,
-- and nothing in the UI renders a judgment derived from these rows.
--
-- Field names match the planned full-platform vocabulary so this stays
-- forward-compatible with the (out-of-scope) P2 platform.
--
-- event_type ∈ { material_picked, wants_to_do, job_assigned, scaffold_tap,
--   phase_time, provocation_flip, ending_choice, guess_event }

CREATE TABLE IF NOT EXISTS trace_events (
  id            TEXT PRIMARY KEY,
  family_code   TEXT NOT NULL,
  session_id    TEXT,
  playdate_slug TEXT,
  event_type    TEXT NOT NULL,
  payload_json  TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_trace_family ON trace_events(family_code, created_at);
CREATE INDEX IF NOT EXISTS idx_trace_type   ON trace_events(event_type);
