-- Migration 057: Campaign access codes
--
-- Adds a code-based entitlement pathway alongside the existing email-targeted
-- invite system (022_invites.sql). Use cases:
--   - PRME 2026: hand participants a code at a workshop rather than collecting emails
--   - Conference codes: one code on a slide, limited to N redemptions
--   - Batch unique codes: per-person single-use codes for accountability
--
-- Relationship to invites:
--   invites  → email-targeted, auto-applied on sign-in
--   access_codes → code-targeted, self-service redemption via /api/access-codes/redeem

-- ── access_codes ─────────────────────────────────────────────────────────────
-- One row per code (or per batch of unique codes sharing a campaign label).
-- Distribution models determined by field values:
--   single campaign code   → one row, max_uses = cohort size, expires_at = event end
--   batch unique codes     → N rows (same campaign), max_uses = 1 each
--   unlimited/time-only    → max_uses NULL, expires_at set

CREATE TABLE IF NOT EXISTS access_codes (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code         TEXT NOT NULL UNIQUE,       -- human: "PRME2026" or slug: "PRME-X7K2"
  campaign     TEXT NOT NULL,              -- grouping label, e.g. "prme-2026"
  description  TEXT,                      -- admin note, e.g. "PRME Jan workshop 50 seats"
  created_by   UUID REFERENCES users(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at   TIMESTAMPTZ,               -- NULL = never expires
  max_uses     INTEGER,                   -- NULL = unlimited; 1 = single-use
  use_count    INTEGER NOT NULL DEFAULT 0,
  revoked_at   TIMESTAMPTZ                -- soft delete
);

-- Lookup by code (case-insensitive via UPPER index)
CREATE UNIQUE INDEX IF NOT EXISTS idx_access_codes_upper
  ON access_codes(upper(code))
  WHERE revoked_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_access_codes_campaign
  ON access_codes(campaign)
  WHERE revoked_at IS NULL;

-- ── access_code_redemptions ───────────────────────────────────────────────────
-- One row per user per code. Prevents double-redemption.
-- UNIQUE(code_id, user_id) is the idempotency guarantee — even if the client
-- retries, a second redemption attempt ON CONFLICT DO NOTHING is safe.

CREATE TABLE IF NOT EXISTS access_code_redemptions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code_id     UUID NOT NULL REFERENCES access_codes(id),
  user_id     UUID NOT NULL REFERENCES users(id),
  redeemed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(code_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_acr_code    ON access_code_redemptions(code_id);
CREATE INDEX IF NOT EXISTS idx_acr_user    ON access_code_redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_acr_date    ON access_code_redemptions(redeemed_at DESC);

-- ── access_code_packs ─────────────────────────────────────────────────────────
-- Which packs a code grants access to. Mirrors invite_packs (migration 038).
-- When a user redeems a code, they get user-level entitlements for each pack here.

CREATE TABLE IF NOT EXISTS access_code_packs (
  code_id       UUID NOT NULL REFERENCES access_codes(id) ON DELETE CASCADE,
  pack_cache_id UUID NOT NULL REFERENCES packs_cache(id),
  PRIMARY KEY (code_id, pack_cache_id)
);

COMMENT ON TABLE access_codes IS
  'Redeemable campaign codes — code-based entitlement grants (complement to email-targeted invites)';

COMMENT ON TABLE access_code_redemptions IS
  'Audit log of who redeemed which code and when. UNIQUE(code_id, user_id) prevents double-redemption.';

COMMENT ON TABLE access_code_packs IS
  'Which packs each access code grants. Mirrors invite_packs for the code pathway.';
