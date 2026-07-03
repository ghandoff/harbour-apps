-- P1.5 · material-submission dials.
--
-- When the collective reviews a kid-submitted material, an AI pre-screen drafts
-- its "dials" — loud/quiet + the Layer-B verbs it affords — alongside the form
-- category. A human confirms/edits before accept; the confirmed values persist
-- so a promoted material carries the same dials the built-in materials do.
--
-- Additive only: three nullable columns on submitted_materials. Existing rows,
-- pending review, family collections, and the icon flow are all untouched.
-- Apply to EVAL_DB (wv-creaseworks-eval's D1). SQLite runs each ALTER in turn.

ALTER TABLE submitted_materials ADD COLUMN loud_quiet TEXT;   -- 'loud' | 'quiet', confirmed on accept
ALTER TABLE submitted_materials ADD COLUMN affords TEXT;      -- JSON string[] of Layer-B verbs, confirmed on accept
ALTER TABLE submitted_materials ADD COLUMN ai_dials TEXT;     -- cached AI draft: JSON {form_primary, loud_quiet, affords, reason}
