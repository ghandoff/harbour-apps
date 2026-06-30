-- B2 · open-ended materials ("bring back whatever you find").
-- Kid-submitted materials that aren't on the list, awaiting collective review.
-- Source of truth in EVAL_DB: the collective moderates via the dashboard
-- (which reads EVAL_DB); the mini submits cross-host, same as events/roster.
--
-- Lifecycle: pending → accepted (form_primary assigned by the collective)
--            → icons_proposed (B4, Payton) → live (B4, family picks icon),
--            or declined. The icon columns are added now so B4 needs no
--            further migration.
CREATE TABLE IF NOT EXISTS submitted_materials (
  id                  TEXT PRIMARY KEY,
  group_code          TEXT NOT NULL,                   -- the family/class code (= discoverer credit)
  submitted_by        TEXT,                            -- child avatar (optional)
  title               TEXT NOT NULL,
  description         TEXT,
  form_primary        TEXT,                            -- one of the material form categories, set on accept
  status              TEXT NOT NULL DEFAULT 'pending', -- pending|accepted|declined|icons_proposed|live
  icon_candidate_urls TEXT,                            -- json array (B4 — Payton's 3 options)
  chosen_icon_url     TEXT,                            -- B4 — the family's pick
  accepted_by         TEXT,                            -- collective reviewer name
  accepted_at         TEXT,
  created_at          TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_submaterials_status ON submitted_materials(status, created_at);
CREATE INDEX IF NOT EXISTS idx_submaterials_group ON submitted_materials(group_code);
