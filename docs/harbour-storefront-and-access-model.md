# Harbour storefront & access model — design spec

> status: design (2026-05-31). Carries forward the port-CRM conversation's access-model
> decisions, grounded in the current codebase + LMS pricing research. Foundation PR: **#156**
> (rebased access-code system — migrations 057/058 + redeem endpoint + admin UI). Everything
> here builds on #156 landing + deploying.

## Foundation (built, in PR #156 — not yet on main/deployed)
- `057_access_codes.sql`: `access_codes`, `access_code_redemptions`, `access_code_packs`.
- `058_prme_2026_packs.sql`: `PRME2026` code — 200 uses, expires 31 Jan 2027, unlocks 7 apps
  (vertigo.vault [vault-explorer pack], regenerative-practices library, lines-become-loops,
  read-the-room, values-companion, co-rubric-companion, cuts-catalogue). Excludes creaseworks,
  advanced versions, depth-chart.
- `POST /api/access-codes/redeem` (self-serve) · `GET/POST/DELETE /api/admin/access-codes` ·
  `/admin/access-codes` UI · `lib/queries/access-codes.ts`.
- **Already on main** (the storefront's other half): `050_harbour_commerce` (`packs_catalogue.app`,
  `purchases.app`), `052_seed_app_packs`, `038_user_entitlements`, `organisations`/`org_memberships`.

**Go-live sequence (per CLAUDE.md migration rule):** merge #156 → deploy creaseworks → THEN run
057/058 against Neon (057 before 058; split statements, strip comments). ⚠️ Reconcile first whether
the other conversation already applied 057/058 + seeded PRME2026 directly to Neon — if so, only the
code merge+deploy is needed.

## The three tiers

### Tier 1 — Individual educator (self-serve; public sales launch)
- Hits an app's free-sample limit → buys a visitor pack → self-serve Stripe checkout → instant entitlement.
- Pricing: ~$6–10/app, ~$35 for a 6-bundle. (Below student-pay tools like Top Hat at ~$25–40/student/term — fine.)
- Regenerative-practices library stays free/open.
- Needs: the central storefront (below) + per-app free-sample gating (separate work item).

### Tier 2 — Departmental license (~$1,000/yr, ~50 seats)
**Decision: reuse the access-code system — a department license IS a scoped, redemption-capped code.**
- A `access_codes` row: `max_redemptions = 50`, pack bundle = the dept's apps, `expires_at = +1yr`,
  label e.g. "MIT Sloan Sustainability 2026". Redemption binds the code to a user → 50 redemptions =
  50 seats, hard-stopped at the 51st.
- **Why not a seat-capped org entitlement (the alternative):** that needs new schema (seat tracking +
  claim flow + domain matching). The access code already exists, gives a hard seat bound, and the
  redemption cap *is* the token bound. Ship the code-based version now; org-entitlement seat-caps are a
  v2 upgrade if departments want a self-service seat dashboard.
- **Payment is sales-led (invoice), not self-serve:** invoice paid → admin issues the 50-use code from
  `/admin/access-codes` → department distributes to faculty.
- **Only new build:** a thin "issue department license" preset in the admin UI (pre-fill 50 uses /
  1-yr expiry / institution label / pack bundle). Everything else is reuse.
- **$1,000 ÷ 50 = $20/seat/yr** — sensible (between Turnitin's ~$3 and Top Hat's ~$25–40).

### Tier 3 — Institutional license (higher tier; needs benchmarking)
- **Price per FACULTY seat, not per enrollment.** depth-chart is faculty-facing (faculty review/evaluate
  curriculum) — the audience is the faculty count (dozens–low hundreds), not total students (thousands).
  This collapses the token-economy fear: the worst case isn't "thousands of token-burners," it's the
  faculty headcount. (CONFIRM depth-chart's audience is faculty-only before finalizing.)
- **Hard token bound = seat cap × per-user daily quota.** The depth-chart per-user quota (the AI cost
  gate already shipped, currently dormant) is the second guardrail — activate it for institutional
  cohorts. Two composed limits, no third mechanism needed.
- **Pricing anchor:** Turnitin (the closest analog — a point tool, per-student) runs ~$2.59–3.19/student/yr
  (+AI upgrade); historically $3–7. Full LMS (Canvas/Blackboard, $50k–200k/yr negotiated) is too broad a
  comp — winded.vertigo is a narrower toolset; price below. → Institutional in the low-to-mid 5 figures,
  priced per faculty seat (~Turnitin range) with the token cap, not per total enrollment.

## Central storefront — architecture
**Lives in the harbour hub (`apps/harbour`), not creaseworks.** Harbour is already the Pool-A SSO
center with `/account`; this finally decouples commerce from creaseworks (a build-order accident).
- `/harbour/shop` — catalogue of all apps / packs / bundles (discovery + bundle purchase).
- `/harbour/api/checkout` — creates a Stripe Checkout session for a pack/bundle.
- `/harbour/api/stripe/webhook` — on payment, grants cross-app entitlements into the **same**
  `entitlements` / `packs_catalogue` tables creaseworks uses (so every app's existing entitlement
  checks just work).
- **Two entry points, both:** the central `/harbour/shop` for discovery, **and** a per-app "buy" CTA on
  each app's free-sample-limit wall that deep-links into checkout — the conversion moment.

## Free-sample gating (separate work item — 7+ CF Worker deploys)
Each app needs app-level gating logic (e.g. "first 3 activities free in vertigo.vault") in its CF Worker,
keyed on entitlement presence. Parallelizable; scope as its own effort. Not a storefront dependency, but
required for Tier-1 self-serve conversion to make sense.

## Suggested build sequence
0. **Land #156** (merge → deploy creaseworks → migrate 057/058) — prerequisite for all entitlement grants.
1. **Departmental tier** — the "issue department license" admin preset on top of #156. Cheapest path to
   institutional sales; unblocks revenue soonest.
2. **Central storefront** — `/harbour/shop` + harbour-level Stripe checkout + webhook (Tier 1 self-serve).
3. **Visitor-pack pricing** — price the individual packs/bundle.
4. **Free-sample gating** per app (parallel CF deploys).
5. **Institutional tier** — confirm faculty-seat model + finalize pricing from the benchmarks above.

## Open items to confirm
- Is depth-chart strictly faculty-facing? (drives the per-faculty-seat pricing unit.)
- Are 057/058 + PRME2026 already applied to Neon (other conversation), or pending?
- Exact per-app individual prices + the institutional per-seat number.

## Sources (pricing)
- LMS institutional pricing: vendr.com/marketplace/canvas · raccoongang.com/blog/canvas-lms-pricing
- Turnitin per-student: edusageai.com (2026) · themarkup.org (2025 CA system: $2.59–3.19/student)
</content>
