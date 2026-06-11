-- Migration 060: PPCS 2026 community access code
--
-- Creates the single shared, public code PPCS2026 that grants free, full access
-- to the seven PPCS companion apps' "access packs" (seeded in migration 058 +
-- the existing vault-explorer pack). Citable in the PPCS 2026 impact report.
--
-- Distribution model: one campaign code, unlimited uses (max_uses NULL),
-- time-bounded to 2026-12-31. Redeeming grants user-level entitlements that
-- expire with the code (see validateAndRedeem → grantUserEntitlement).
--
-- SAFE TO RUN EARLY: granting these entitlements changes nothing user-visible
-- until each companion app enforces the gate AND HARBOUR_GATE_ENFORCED="true"
-- (see docs/ppcs-2026-access-gate.md). Until then every app serves full content
-- to everyone; the entitlement is simply recorded.
--
-- Idempotent: re-running is safe.

-- ── the code ─────────────────────────────────────────────────────────────────
INSERT INTO access_codes (code, campaign, description, expires_at, max_uses)
VALUES (
  'PPCS2026',
  'ppcs-2026',
  'PPCS 2026 community — free, full access to the 7 PPCS companion apps (impact report code)',
  '2026-12-31 23:59:59+00',
  NULL  -- unlimited uses; bounded by expiry + per-user idempotency
)
ON CONFLICT (code) DO NOTHING;

-- ── link the 7 packs it grants ───────────────────────────────────────────────
-- 6 PPCS "access packs" from migration 058 (e1a00001-... series) + the existing
-- vault-explorer pack. ON CONFLICT keeps re-runs safe.
INSERT INTO access_code_packs (code_id, pack_cache_id)
SELECT ac.id, p.pack_cache_id
  FROM access_codes ac
  CROSS JOIN (VALUES
    ('4ff057b0-c911-467d-9cf1-090f416a9231'::uuid),  -- vault-explorer (vertigo-vault)
    ('e1a00001-0000-4000-8000-000000000002'::uuid),  -- regenerative-practices-catalogue
    ('e1a00001-0000-4000-8000-000000000003'::uuid),  -- lines-become-loops
    ('e1a00001-0000-4000-8000-000000000004'::uuid),  -- read-the-room
    ('e1a00001-0000-4000-8000-000000000005'::uuid),  -- values-companion
    ('e1a00001-0000-4000-8000-000000000006'::uuid),  -- co-rubric-companion
    ('e1a00001-0000-4000-8000-000000000007'::uuid)   -- cuts-catalogue
  ) AS p(pack_cache_id)
 WHERE ac.code = 'PPCS2026'
ON CONFLICT (code_id, pack_cache_id) DO NOTHING;
