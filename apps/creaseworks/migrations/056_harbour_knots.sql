-- migration: 056_harbour_knots
-- description: the harbour engagement currency ("knots") ledger.
--
-- Knots are EARNED through contribution (completing a profile, referrals,
-- testimonials) — never through consuming/playing — and recognised with
-- unlocked sailing-knot tying instructions at rank thresholds. This is a
-- harbour-scoped currency, deliberately separate from creaseworks'
-- reflection_credits (a different in-app mechanic).
--
-- Financial guardrails: every row is a signed delta (+earn / -spend);
-- earns carry an expires_at (set ~12 months out by the app) so liability
-- doesn't accrue forever; rank is computed from lifetime EARNED (positive
-- deltas) so future spending never demotes a member.

CREATE TABLE IF NOT EXISTS harbour_knots (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  delta       INTEGER NOT NULL,            -- + earned, - spent
  reason      TEXT NOT NULL,               -- profile_completed | referral_joined | testimonial_shared | redeem | ...
  meta        JSONB,                       -- optional context (referred email, pack slug, …)
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at  TIMESTAMPTZ                  -- NULL = never; earns expire ~12mo out
);

CREATE INDEX IF NOT EXISTS idx_harbour_knots_user ON harbour_knots(user_id);
CREATE INDEX IF NOT EXISTS idx_harbour_knots_created ON harbour_knots(created_at DESC);

-- One-time earns (e.g. the profile-completion welcome) are guarded by a
-- partial unique index so awardKnots can ON CONFLICT DO NOTHING and stay
-- idempotent no matter how many times the profile is saved.
CREATE UNIQUE INDEX IF NOT EXISTS idx_harbour_knots_once
  ON harbour_knots(user_id, reason)
  WHERE reason IN ('profile_completed');
