-- Migration 058: PRME 2026 access packs
--
-- Creates packs_cache + packs_catalogue entries for the seven harbour apps
-- included in the PRME 2026 engagement ($145k contract, delivery 2026):
--
--   1. vertigo-vault      → use existing vault-explorer pack (4ff057b0-...)
--   2. regenerative-practices-catalogue
--   3. lines-become-loops
--   4. read-the-room
--   5. values-companion
--   6. co-rubric-companion
--   7. cuts-catalogue
--
-- Explicitly NOT included (separate/advanced tiers):
--   - creaseworks (full creative playdates platform)
--   - Advanced values auction and co-rubric versions (developed separately)
--   - Upcoming depth-chart versions
--   - Other packages currently in development
--
-- These are "access packs" — price_cents = 0, visible = false.
-- They never appear in any storefront; they only exist to be granted
-- via the PRME 2026 access code.
--
-- Deterministic UUIDs in the e1a00001-... namespace:
--   e1a0 = Entitlement Layer Access, 0 = PRME 2026 series

INSERT INTO packs_cache (id, notion_id, title, status)
VALUES
  ('e1a00001-0000-4000-8000-000000000002', 'prme-2026-regenerative-practices-library',
   'PRME 2026 — Regenerative Practices Library', 'active'),
  ('e1a00001-0000-4000-8000-000000000003', 'prme-2026-lines-become-loops',
   'PRME 2026 — Lines Become Loops', 'active'),
  ('e1a00001-0000-4000-8000-000000000004', 'prme-2026-read-the-room',
   'PRME 2026 — Read the Room', 'active'),
  ('e1a00001-0000-4000-8000-000000000005', 'prme-2026-values-companion',
   'PRME 2026 — Values Companion', 'active'),
  ('e1a00001-0000-4000-8000-000000000006', 'prme-2026-co-rubric-companion',
   'PRME 2026 — Co-Rubric Companion', 'active'),
  ('e1a00001-0000-4000-8000-000000000007', 'prme-2026-cuts-catalogue',
   'PRME 2026 — Cuts Catalogue', 'active')
ON CONFLICT (id) DO NOTHING;

-- packs_catalogue entries: price 0, hidden, correct app slug per harbour app
INSERT INTO packs_catalogue (pack_cache_id, app, product_type, price_cents, currency, visible)
VALUES
  ('e1a00001-0000-4000-8000-000000000002', 'regenerative-practices-catalogue', 'pack', 0, 'USD', false),
  ('e1a00001-0000-4000-8000-000000000003', 'lines-become-loops',               'pack', 0, 'USD', false),
  ('e1a00001-0000-4000-8000-000000000004', 'read-the-room',                    'pack', 0, 'USD', false),
  ('e1a00001-0000-4000-8000-000000000005', 'values-companion',                 'pack', 0, 'USD', false),
  ('e1a00001-0000-4000-8000-000000000006', 'co-rubric-companion',              'pack', 0, 'USD', false),
  ('e1a00001-0000-4000-8000-000000000007', 'cuts-catalogue',                   'pack', 0, 'USD', false)
ON CONFLICT (pack_cache_id) DO NOTHING;

-- Reference: vault-explorer (the "22 initial activities" pack for vertigo-vault)
-- is already in packs_catalogue with pack_cache_id = 4ff057b0-c911-467d-9cf1-090f416a9231
-- Use this when creating the PRME 2026 access code.

COMMENT ON TABLE packs_cache IS
  'Notion-synced pack metadata. PRME 2026 packs (e1a00001-... series) are '
  'manually seeded — no Notion page backing; notion_id is synthetic.';
