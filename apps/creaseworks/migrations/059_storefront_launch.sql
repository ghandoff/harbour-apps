-- 059_storefront_launch.sql
-- Curate the harbour central storefront's launch catalogue (visible + priced).
--
-- Context: the /harbour/shop storefront (PR #158) reads packs_catalogue
-- (visible=true AND price_cents>0). Prices were reviewed against LMS comps
-- (Turnitin ~$3/student; Top Hat ~$25-40/student/term) and kept sensible for
-- a per-pack individual-educator tier. createHarbourCheckout uses stripe_price_id
-- when present, else an inline price_data from price_cents — so packs without a
-- price-id still sell (mode-agnostic). All current price IDs are TEST-mode.
--
-- Idempotent: re-running is safe.

-- ── Already-launched, already-correct (no-op asserts; documents the set) ──
-- creaseworks (6 packs $4.99-$49.99) + vertigo-vault "vault explorer" ($9.99)
-- are already visible + priced + test price-id. Leave as-is.

-- ── Surface two more real, priced app packs for the storefront ──
-- deep.deck "full deck" ($7.99) and raft.house "host pro" ($9.99) are priced
-- but were hidden. Make them sellable (inline price_data — no price-id needed).
UPDATE packs_catalogue
   SET visible = TRUE
 WHERE app IN ('deep-deck', 'raft-house')
   AND price_cents IS NOT NULL
   AND price_cents > 0;

-- ── Explicitly HELD (left hidden) — with reasons ──
-- depth-chart "assessment pro" ($9.99): AI token cost. Do NOT sell individually
--   until the per-user daily quota (the depth-chart cost gate, currently dormant)
--   is active — otherwise one purchase = unbounded token spend.
-- harbour "harbour bundle" ($34.99): a product_type='bundle' that is NOT yet
--   wired to unlock its member apps (entitlements are checked per-app; no bundle
--   expansion logic exists). Needs bundle-unlock code before it can be sold.
-- vertigo-vault "vault practitioner" ($19.99): videos still in production
--   ("coming soon") — intentionally hidden upstream.
-- PRME 2026 packs (co-rubric-companion, cuts-catalogue, lines-become-loops,
--   read-the-room, regenerative-practices-catalogue, values-companion): FREE via
--   the PRME2026 access code — never for sale.
</content>
