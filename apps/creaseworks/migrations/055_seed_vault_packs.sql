-- migration: 055_seed_vault_packs
-- description: defensive seed for vault-explorer + vault-practitioner.
--
-- WHY: apps/vertigo-vault/app/api/checkout/route.ts:41 looks up packs_cache
-- by slug 'vault-explorer'. If that row doesn't exist in production Neon,
-- the very first checkout attempt 404s "pack not found" and the user is
-- stuck. Migration 050 references these slugs but assumes the rows already
-- exist (UPDATE only). Migration 052 seeds depth-chart / deep-deck /
-- raft-house / harbour-bundle but skips vault. This migration plugs that
-- gap with idempotent INSERTs ahead of Thursday's harbour launch.
--
-- Pricing lives in apps/vertigo-vault/app/api/checkout/route.ts PACK_PRICES
-- ($9.99 Explorer, $19.99 Practitioner). The price_cents columns here
-- exist purely so the catalogue rows are well-formed for any future code
-- that reads them; the checkout route doesn't read them today.
--
-- Practitioner visible=FALSE because the videos aren't produced yet —
-- the UI is being switched to "coming soon" in the same PR, and the
-- checkout route's whitelist is being narrowed to vault-explorer only.
-- The catalogue row exists so future activation is a single UPDATE.

-- vault-explorer (sellable from launch)
INSERT INTO packs_cache (id, notion_id, title, description, status, slug)
VALUES (
  'a4c10001-0000-0000-0000-000000000001',
  'vault-explorer-seed',
  'Vault Explorer Pack',
  'Step-by-step guides and materials checklist for every activity in the vault.',
  'live',
  'vault-explorer'
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO packs_catalogue (pack_cache_id, app, product_type, price_cents, currency, visible)
SELECT id, 'vertigo-vault', 'pack', 999, 'USD', TRUE
FROM packs_cache WHERE slug = 'vault-explorer'
ON CONFLICT (pack_cache_id) DO NOTHING;

-- vault-practitioner (coming soon — visible=FALSE).
-- NOTE: when applied to production on 2026-05-19 the row already existed
-- with visible=TRUE (from an earlier Notion-pack sync). The ON CONFLICT
-- skipped the INSERT, so we ran a one-off
--   UPDATE packs_catalogue SET visible = FALSE
--   WHERE pack_cache_id = (SELECT id FROM packs_cache WHERE slug = 'vault-practitioner');
-- A fresh DB applying this migration in order will land on visible=FALSE
-- directly.
INSERT INTO packs_cache (id, notion_id, title, description, status, slug)
VALUES (
  'a4c10002-0000-0000-0000-000000000001',
  'vault-practitioner-seed',
  'Vault Practitioner Pack',
  'Everything in Explorer plus play catalyst prompts and video walkthroughs (coming soon).',
  'live',
  'vault-practitioner'
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO packs_catalogue (pack_cache_id, app, product_type, price_cents, currency, visible)
SELECT id, 'vertigo-vault', 'pack', 1999, 'USD', FALSE
FROM packs_cache WHERE slug = 'vault-practitioner'
ON CONFLICT (pack_cache_id) DO NOTHING;
