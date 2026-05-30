# harbour analytics & superuser views — recommendation

> status: recommendation (2026-05-30). reconciles two asks: (1) let the
> harbourmaster *see what each user experiences* (knots, packs, tiers), and
> (2) build a harbour-wide analytics dashboard (visitors, time, purchases,
> per-app traffic) that also drills into individual apps.
>
> tl;dr — **two separate builds in two homes:**
> - **superuser "preview-as" persona toggle** → lives in `harbour-apps` (this repo), on `/harbour/account`. small, ship here.
> - **harbour analytics dashboard** → lives in **`windedvertigo/port`** (the internal team hub), not the customer-facing harbour account. bigger; deserves its own (Opus) build conversation — handoff prompt at the bottom.

---

## what's already in the stack (this shaped the recommendation)

| finding | implication |
|---|---|
| `windedvertigo/port` is the **internal team dashboard** — Next 16 + Neon + next-auth on CF Workers, with a `(dashboard)` route group + sidebar, existing `api/analytics` (Notion campaign stats) and many `api/admin/*` tools. team-gated. | the analytics dashboard **belongs in port**, not the harbour. same stack, already internal, already reads Neon. |
| **creaseworks already has an admin analytics dashboard**: `/api/analytics/runs` returns per-user analytics and, for `session.isAdmin`, **platform metrics — user growth, pack adoption, credit economy, conversion funnel** — rendered by `src/app/analytics/analytics-dashboard.tsx` (StatCards + a hand-rolled FunnelChart). queries in `lib/queries/analytics.ts` (`getAnalytics`, `getAdminAnalytics`). | the **pattern is already proven in-house**. port reuses the shape (isAdmin gate → StatCards + funnel); we generalise it from one app to all apps. |
| **Neon Postgres is the system-of-record** (users, entitlements, Stripe webhook events, knots ledger). | every *business* metric (signups, purchases, conversion, knots, MRR) is a SQL query away. no new pipeline needed for those. |
| **~10 harbour apps ship `@vercel/analytics`** in their layouts (bias-lens, code-weave, emerge-box, liminal-pass, harbour, paper-trail, market-mind, orbit-lab, mirror-log, rhythm-lab) — but they're on **CF Workers** now. | that web-analytics is almost certainly **siloed / not reporting** post-CF-migration. *web* analytics (visitors/time/traffic) needs a CF-native source regardless. flag + replace. |
| `nordic-sqr-rct` isn't populated locally (0 components) — couldn't verify its "view-as" implementation. | recommend the well-established preview/impersonation pattern instead of porting nordic's. |

---

## recommendation 1 — superuser view: a "preview-as" persona toggle (not always-show)

**don't just show knots/packs on the harbourmaster account.** that conflates two
different realities: staff have full access and *no* knots ledger or rank, so a
knots panel on a staff account would render empty/meaningless and misrepresent
the customer experience. what you actually want is to *see each experience
faithfully* — which is a **toggle**, exactly as you described.

### tier A — persona preview (recommended, ship first; cheap + safe)
an ephemeral, **read-only** "viewing as" mode, gated by `isStaffEmail`, that
re-renders `/harbour/account` (and optionally the hub) as a chosen **persona**
with representative sample data — *not* a real user's data:

- personas: **visitor** (signed-in, no profile) · **profiled member** (profile, 0 knots) · **crew** (knots + a rank + sample packs) · **harbourmaster** (the real staff view).
- mechanism: a `?preview=<persona>` search param (or a short-lived `harbour_preview` cookie) read in the `/account` server component; when set **and** the viewer is staff, branch the render to a fixture instead of live queries. a persistent banner — "previewing as <persona> · exit" — makes it unmistakable.
- no security surface: it never reads another person's PII, never escalates, never writes. it's a *mockup with real components*.
- effort: small. ~1 new fixture module + a banner + a branch in `/account`. fits this repo/conversation.

### tier B — real-user impersonation (defer until you need to debug a specific account)
"view as anotheroption@gmail.com" against their real data. powerful for support,
but carries the full impersonation burden (best practices from Clerk/next-auth):
separate **httpOnly actor token** distinct from the session, **persistent banner**,
**no impersonating other staff/admins**, **default read-only** with explicit write
scopes, and an **audit log** of who-viewed-whom-when. recommend only when there's a
concrete support need; tier A covers "what does the experience look like."

> **verdict:** build tier A in `harbour-apps` now. it directly answers "toggle
> views to see what each user experiences" and doubles as the verification tool
> for the profile/knots/recommendations work.

---

## recommendation 2 — analytics dashboard: build it in port, layered

### where: `windedvertigo/port` (decisive)
1. port is *already* the internal, team-gated dashboard app — same stack as harbour.
2. it already reads the **same Neon** that holds harbour's business data.
3. analytics is an **internal** concern; the customer-facing `/harbour/account` is the wrong place (category error — that page is the member's dashboard, not ops).
4. it already has `(dashboard)` + sidebar + `api/analytics` + `api/admin` to extend.
5. **zero new infra/cost** (CLAUDE.md cost discipline) — no new Vercel project, no PostHog bill.

### architecture: one event stream with an `app` dimension → rollup *and* drill-down
the core design choice for "across multiple apps AND per individual app" is **a
single store where every event is tagged with an `app` slug** — *not* per-app
silos. (PostHog's own docs note you can't share dashboards/insights across
separate projects — the multi-silo path fights you. one dataset + a dimension
gives you both the harbour-wide rollup and per-app views from the same data, with
just a `WHERE app = ?` / `GROUP BY app`.)

**three layers:**

- **L1 · web analytics (visitors, time-on-page, traffic per app)** — the missing
  piece post-CF-migration. recommended source: **Cloudflare Workers Analytics
  Engine** — each app's `worker.ts` (already wrapping responses via
  `@windedvertigo/security`) writes a data point per request: `blob1=app`,
  `blob2=path`, `blob3=referrer`, `double1=duration`; query it from port via the
  **Analytics Engine SQL API** (`/accounts/<id>/analytics_engine/sql`). cookieless,
  privacy-first (on-brand), free at our volume. alternative: **Cloudflare Web
  Analytics** (zero-code, even simpler, but less queryable/joinable). a third
  option — a tiny `/api/track` beacon into a Neon `events` table — keeps
  everything in one store but adds write load; prefer Analytics Engine unless we
  want events joined to user rows in SQL.
- **L2 · business analytics (signups, purchases, conversion, knots, MRR)** — pure
  **SQL over Neon** (system-of-record). generalise creaseworks'
  `getAdminAnalytics()` from one app to all: add an `app` dimension to the
  aggregates (entitlements/packs already carry `app`).
- **L3 · presentation in port** — a new `(dashboard)/harbour` section: a
  harbour-wide overview (totals + trend) **plus an app filter** that re-scopes
  every panel to one app. reuse creaseworks' StatCard + FunnelChart components
  (hand-rolled; port has no charting lib beyond `@base-ui/react`, same as
  creaseworks — consistent).

### metrics to land (maps to your list)
- visitors / uniques / sessions → L1 (Analytics Engine, `GROUP BY app`).
- time spent → L1 (`double1=duration`, avg per app).
- purchases / revenue / conversion funnel → L2 (Stripe + entitlements in Neon).
- traffic per app → L1 with the `app` dimension; the app filter in L3.
- engagement → L2 (knots ledger: earns by app/reason).

---

## recommendation 3 — yes, spin up a separate (Opus) conversation for the port build

it's a **different repo** (`windedvertigo/port`) with its own conventions, and a
**substantial** feature (Analytics Engine wiring across apps + SQL aggregates +
new dashboard UI). it deserves its own context budget. the superuser toggle
(tier A) stays here in `harbour-apps`. handoff prompt below.

### ready-to-paste Opus handoff prompt

```
You are building a "harbour analytics" dashboard inside windedvertigo/port —
the winded.vertigo internal team ops hub. GOAL: a harbour-wide overview AND
per-app / per-pack drill-down (visitors, time-on-page, purchases, revenue,
conversion, traffic per app, engagement) from ONE data model. Internal/team-only.

FIRST, read: port's CLAUDE.md; ../../harbour-apps/CLAUDE.md (cost discipline +
deployment topology); ../../harbour-apps/docs/harbour-analytics-and-superuser-views.md
(the recommendation that scoped this); ../../harbour-apps/docs/deployment-topology.md.

PORT STACK FACTS: Next.js 16, Neon (@neondatabase/serverless, pooled POSTGRES_URL),
next-auth v5, OpenNext on Cloudflare Workers (deploy: `npm run deploy:cf`). UI lives
in the app/(dashboard) route group, already auth-gated by (dashboard)/layout.tsx and
navigated by app/components/sidebar.tsx (NavSection/NavItem). Charting: only
@base-ui/react is present — creaseworks hand-rolls StatCard + FunnelChart; match that
or justify adding Recharts. There's already an app/api/analytics/campaigns route
(reads Notion) — your new harbour analytics reads Cloudflare + Neon, not Notion.

ARCHITECTURE — one event stream tagged with an `app` dimension, so the SAME data
yields both the harbour-wide rollup and per-app views (a WHERE/GROUP BY app). Do NOT
build per-app silos. Three layers:

== L1 · WEB ANALYTICS (visitors, time, traffic per app) — Cloudflare Workers Analytics Engine ==
Each harbour app is an OpenNext CF Worker whose worker.ts wraps OpenNext's handler with
wrapWithSecurityHeaders() from @windedvertigo/security. Emit ONE data point per request
from that shared wrapper (single code touchpoint for all ~30 apps), passing the app slug in.
  - writeDataPoint shape:
      env.HARBOUR_ANALYTICS.writeDataPoint({
        blobs:   [appSlug, path, referrer, country],   // dimensions; consistent order; NO PII
        doubles: [durationMs],                          // numeric (or [1] as a hit counter)
        indexes: [appSlug],                             // EXACTLY ONE index (multiple = data dropped)
      });
    Do NOT await it. Keep blobs free of user ids/emails (cookieless, privacy-first — brand requirement).
  - Binding per app wrangler.jsonc:
      "analytics_engine_datasets": [{ "binding": "HARBOUR_ANALYTICS", "dataset": "harbour_web" }]
  - Access binding via getCloudflareContext() — PRECEDENT in this repo:
    harbour-apps/apps/harbour/app/api/admin/sync-tiles/route.ts (ctx.env.TILE_IMAGES).
    In route handlers use `await getCloudflareContext({ async: true })`. The AE binding is
    NOT available in local dev — the write MUST no-op gracefully when the binding is absent.
  - COST OF L1: editing the shared @windedvertigo/security wrapper + adding the binding to each
    wrangler.jsonc means REDEPLOYING ALL CF-routed harbour apps (~30 — see deployment-topology.md).
    List exactly which apps you touched. This is the expensive part — sequence it last (see PHASING).
  - Query from port via the AE SQL API:
      POST https://api.cloudflare.com/client/v4/accounts/097c92553b268f8360b74f625f6d980a/analytics_engine/sql
      Header: Authorization: Bearer <token with "Account Analytics: Read"> (store as a port secret, e.g. CF_ANALYTICS_TOKEN)
      Columns: blob1..blob20, double1..double20, index1, _sample_interval, timestamp.
      Counts MUST account for sampling: SELECT SUM(_sample_interval) ... (not COUNT()).
      Averages: SUM(_sample_interval * double1) / SUM(_sample_interval).
      Per-app: GROUP BY blob1. Time: WHERE timestamp > NOW() - INTERVAL '30' DAY.

== L2 · BUSINESS ANALYTICS (signups, purchases, revenue, conversion, engagement) — SQL over the shared Neon ==
System-of-record tables (in harbour-apps/apps/creaseworks/migrations/):
  - users                      → signups / growth
  - entitlements (038)         → active grants (who can access what), by pack_cache_id
  - packs_catalogue, packs_cache + 050_harbour_commerce → packs_catalogue.app + product_type
                                  ('pack'|'bundle'|'subscription'); purchases.app → CROSS-APP
                                  purchase + revenue reporting by app (052 seeds the packs)
  - reflection_credits, credit_redemptions (028) → credit economy
  - harbour_knots (056)        → engagement ledger (earns by reason/app)
  - stripe_webhook_events (054)→ payment events
  - dc_usage_events (051)      → depth-chart product usage incl. 'task_generated' (also the cost-gate counter)
Every aggregate takes an OPTIONAL app filter. Generalise creaseworks' getAdminAnalytics()
(harbour-apps/apps/creaseworks/src/app/analytics/analytics-dashboard.tsx +
lib/queries/analytics.ts) from one app to all, adding the `app` dimension. Neon serverless =
one SQL statement per HTTP call.

== L3 · UI — app/(dashboard)/harbour + a sidebar entry ==
Harbour-wide overview (totals + 30-day trend) PLUS an app-filter control that re-scopes every
panel to one app. Iterate the canonical catalogue:
harbour-apps/packages/auth/harbour-apps-data.ts (HARBOUR_APPS — ~30 apps across piers
'launch'/'repairs', many comingSoon). Reuse the StatCard + FunnelChart components from creaseworks.

METRICS → SOURCE: visitors/uniques/sessions (L1) · time-on-page (L1 duration) ·
purchases/revenue/conversion funnel (L2 purchases+entitlements+stripe) · traffic per app
(L1 GROUP BY blob1 + the app filter) · engagement (L2 knots + dc_usage_events).

CONSTRAINTS: CLAUDE.md cost discipline — NO new Vercel project, NO third-party analytics SaaS;
Analytics Engine + Neon only. Team-gated by the existing (dashboard) auth. Do NOT deploy
production without Garrett's explicit go-ahead.

PHASING (each shippable): (1) L2 first — pure Neon reads, NO app redeploys, immediate value:
the (dashboard)/harbour page with signups/purchases/revenue/knots + app filter. (2) Then L1 —
the shared-wrapper writeDataPoint + per-app binding + the all-apps redeploy sweep + the port AE
SQL client, adding visitors/time/traffic panels.

DELIVERABLES: Neon aggregate queries (app-filterable) + port api/analytics/harbour/* routes;
the (dashboard)/harbour UI + sidebar entry; the @windedvertigo/security wrapper AE write + each
app's wrangler.jsonc binding + the list of workers to redeploy; a port AE SQL client (lib) +
the CF_ANALYTICS_TOKEN secret/scope note; a short README documenting the dataset schema (what
each blob/double means).

CONFIRM WITH GARRETT BEFORE BUILDING: dataset name(s) (one 'harbour_web' vs per-pier);
whether to emit per-app PRODUCT events (e.g. 'ran a session') beyond pageviews; charting lib
(hand-roll vs add Recharts); retention/sampling expectations.
```

---

## sources
- PostHog multi-project limits (can't share dashboards/insights across projects): https://posthog.com/questions/multi-project · https://posthog.com/tutorials/multiple-environments
- Cloudflare Workers Analytics Engine + SQL API (write from Workers, query by dimension): https://developers.cloudflare.com/analytics/analytics-engine/ · https://developers.cloudflare.com/analytics/analytics-engine/sql-api/ · https://developers.cloudflare.com/workers/examples/analytics-engine/
- Cloudflare privacy-first web analytics (cookieless): https://blog.cloudflare.com/privacy-first-web-analytics/ · https://www.cloudflare.com/web-analytics/
- Counterscale (self-hosted analytics on CF Workers, reference design): https://counterscale.dev/ · https://github.com/benvinegar/counterscale
- user impersonation best practices (httpOnly actor token, banner, no escalation, read-only, audit): https://clerk.com/docs/guides/users/impersonation · https://github.com/nextauthjs/next-auth/discussions/2947
