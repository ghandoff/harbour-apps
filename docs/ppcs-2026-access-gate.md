# PPCS 2026 access gate — design & rollout

Single shared code **PPCS2026** grants the PRME/PPCS community free, full, ad-free
access to the seven PPCS companion apps in the harbour, citable in the PPCS 2026
impact report. Built now; **enforcement stays OFF until the report ships and the
code is distributed** (a kill-switch), so nothing is limited in the meantime.
Non-community visitors keep seeing **sampler** versions of each activity (freemium).

## What already exists (reuse, don't rebuild)

- **Access-code + entitlement system** (`apps/creaseworks`, migrations 057/058):
  `access_codes` / `access_code_redemptions` / `access_code_packs`; `POST
  /api/access-codes/redeem` → `validateAndRedeem()` → case-insensitive, trimmed,
  idempotent (`UNIQUE(code_id,user_id)`), checks expiry/limit/revoked, grants
  `grantUserEntitlement(userId, packId, code.expires_at)` per pack. Entitlements
  auto-expire with the code. Redemptions are the **telemetry** (who/what/when +
  `CampaignStats.activation_rate`).
- **The 7 PPCS packs are already seeded** (migration 058, price 0, `visible=false`
  "access packs"): `regenerative-practices-catalogue`, `lines-become-loops`,
  `read-the-room`, `values-companion`, `co-rubric-companion`, `cuts-catalogue`,
  plus the existing `vault-explorer` pack.
- **The freemium tier pattern** is fully built in **vertigo-vault**
  (`lib/queries/vault.ts` `resolveVaultTier` + `lib/security/column-selectors.ts`):
  `teaser` (free sampler = the "prme" rows) → `entitled` (full) via the
  `vault-explorer` entitlement, with row- AND column-level filtering. **This is the
  template** every other companion app should follow.

Corrections to the original brief: auth is **Auth.js + Neon** (not Upstash/Redis);
codes live in the **DB** (not an env var) — already rotatable/revocable/expirable
via the admin UI without a code change; the code is **public**, so constant-time
compare / hiding it from the client is moot.

## Enforcement gap (the real work)

Of the 7 apps, only **vertigo-vault** gates today. The other six are wide open
(no middleware, no entitlement check): `lines-become-loops`, `read-the-room`,
`cuts-catalogue`, `co-rubric-companion` (dir `apps/rubric-co-builder-companion`,
worker `wv-harbour-rcb-companion`, basePath `/harbour/co-rubric-companion`),
`values-companion` (likely the windedvertigo-repo `values-auction` — **confirm**),
and `regenerative-practices-catalogue` (**app not located — confirm it exists /
where**). Each needs vault's tier pattern + a defined **sampler boundary**.

## Architecture

1. **Kill-switch (global, default OFF).** Env `HARBOUR_GATE_ENFORCED` (default
   `"false"`). While off, every app serves **full** content to everyone — zero
   behaviour change. Flip to `"true"` (per-app Worker secret, or one shared value)
   when the report ships → non-entitled users drop to the sampler.
2. **Shared gate helper** (new `packages/access-gate` or extend `packages/stripe`):
   `resolveTier({ app, orgId, userId, isInternal })` → `"full" | "sampler"`.
   Returns `"full"` when `HARBOUR_GATE_ENFORCED!=="true"` OR the user is internal
   (collective) OR holds the app's PPCS pack entitlement; else `"sampler"`. One
   Neon round-trip (mirrors `resolveVaultTier`). vault keeps its richer 4-tier
   resolver; the others use this binary one.
3. **Per-app sampler.** Each app declares what its free sampler is (the analogue of
   vault's "prme" rows) and renders sampler vs full accordingly. **This is the
   per-app product decision** and the main remaining input.
4. **Redemption UI (public).** A `/redeem` page + a "have an access code?" entry on
   the harbour hub (`apps/harbour`, the public home) and on each app's "go full"
   prompt. Sign-in-then-redeem (entitlements are user-keyed, persist cross-device;
   the 30-second gate signs them in). Posts to the redeem endpoint; on success the
   app re-resolves to full. (Move the access-code queries to a shared package, or
   add a thin redeem route to the hub — the current route lives in creaseworks,
   which is "coming soon"/hidden, the wrong public host.)
4a. **Optional registration on success (ask, don't force).** After a successful
   redemption, a *skippable* "stay in the loop" card: pre-fill their sign-in email,
   let them edit to their **institutional email**, optional **institution** name
   (→ existing `users.institution` column, migration 051), and an **explicit,
   unticked consent checkbox** ("email me PPCS updates, new packs, and the
   occasional feedback request"). On submit-with-consent: enroll via the existing
   `addToAudience()` (`apps/harbour/lib/resend-audience.ts`) into a dedicated
   **`ppcs-2026`** audience (segmentable for targeted updates + report counts), and
   record `consent_at` + institution on the redemption/user. Redemption already
   succeeded — skipping costs nothing. No pre-ticked boxes, opt-in only (non-
   extractive + GDPR/CAN-SPAM). This also yields the report metric "N educators
   across M institutions."
5. **Rate-limit** the redeem route (Neon, `migration 054`-style short-TTL table) —
   the code is public so brute-force isn't the threat, but stop abuse/DB hammering.

## Rollout phases

- **Phase 0 — foundation (safe, citable, no access change):** PPCS2026 code
  (migration 060), `HARBOUR_GATE_ENFORCED` flag plumbing (default off), shared
  `resolveTier` helper, public `/redeem` UI in the hub, redeem rate-limit, docs +
  the citable URL. Ship this; the code works and grants entitlements (inert until
  Phase 1 gates land + the flag flips).
- **Phase 1..N — per-app gating (one per app, behind the flag):** define each
  sampler boundary, render sampler vs full via `resolveTier`, add the "go full"
  prompt + redeem entry. vertigo-vault is already done (reference). Each app is its
  own CF Worker deploy.
- **Launch:** report ships → distribute PPCS2026 → set `HARBOUR_GATE_ENFORCED=true`
  on the app Workers. Community redeems once → full access through 2026-12-31.

## Security / scope notes
- Single public code: shareable by design (it's printed in a report). Bounded by
  **expiry 2026-12-31**, **scope = the 7 zero-priced packs only** (no paid apps),
  and **revoke/rotate** ready. Acceptable for the stated public use.
- Sign-in required to redeem (no anonymous cookie path — chosen).
- Internal/collective users always get full (bypass the gate) — for QA via the
  view-as bar.

## Citable in the report
- **URL:** `https://windedvertigo.com/harbour` → "have an access code?" → enter
  **PPCS2026** (after sign-in).
- **One-liner:** "PPCS 2026 participants enter the code **PPCS2026** at
  windedvertigo.com/harbour to unlock free, full access to all seven PPCS companion
  apps through 31 December 2026."

## Open inputs needed before per-app gating
1. The **sampler boundary** for each of the 6 apps (what's free vs full).
2. Confirm **values-companion** = `values-auction` (windedvertigo repo)?
3. Confirm **regenerative-practices-catalogue** app — where is it / does it exist?
