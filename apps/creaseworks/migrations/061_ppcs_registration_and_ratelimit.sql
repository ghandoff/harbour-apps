-- Migration 061: PPCS registration + redeem rate-limit
--
-- Supports the public PPCS2026 redemption flow (see docs/ppcs-2026-access-gate.md):
--   1. institutional_registrations — the optional, consented registration captured
--      after a successful redemption. Tags the redeemer's institutional email +
--      domain so it can link to institutional licenses (verified_domains → org)
--      now or in future, and doubles as the impact-report metric + sales lead list.
--   2. redeem_attempts — a short-TTL log used to rate-limit redemption attempts
--      (the code is public, so this stops abuse / DB hammering, not brute force).
--      Mirrors the 054 short-TTL pattern; purge with DELETE WHERE expires_at < NOW().
--
-- Idempotent.

-- ── institutional_registrations ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS institutional_registrations (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES users(id),
  institutional_email TEXT NOT NULL,
  email_domain        TEXT NOT NULL,                 -- lower-cased domain of the email
  institution         TEXT,                          -- optional free-text institution name
  campaign            TEXT NOT NULL DEFAULT 'ppcs-2026',
  consent_at          TIMESTAMPTZ,                   -- NULL = registered without marketing consent
  org_id              UUID REFERENCES organisations(id),  -- set if the domain matched a verified org
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, campaign)        -- one registration per user per campaign (upsertable)
);

CREATE INDEX IF NOT EXISTS idx_inst_reg_domain   ON institutional_registrations(email_domain);
CREATE INDEX IF NOT EXISTS idx_inst_reg_campaign ON institutional_registrations(campaign);
CREATE INDEX IF NOT EXISTS idx_inst_reg_consent  ON institutional_registrations(consent_at) WHERE consent_at IS NOT NULL;

COMMENT ON TABLE institutional_registrations IS
  'Optional consented registrations from access-code redeemers — institutional email/domain '
  'tagging for updates, feedback, and institutional-license linking (verified_domains → org).';

-- ── redeem_attempts (rate-limit) ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS redeem_attempts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject      TEXT NOT NULL,                        -- the rate-limit key (user id; ip as fallback)
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at   TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '1 hour'
);

CREATE INDEX IF NOT EXISTS idx_redeem_attempts_subject
  ON redeem_attempts (subject, attempted_at DESC);
CREATE INDEX IF NOT EXISTS idx_redeem_attempts_expires
  ON redeem_attempts (expires_at);

COMMENT ON TABLE redeem_attempts IS
  'Short-TTL log of access-code redemption attempts, for per-subject rate limiting. '
  'Purge with DELETE WHERE expires_at < NOW().';
