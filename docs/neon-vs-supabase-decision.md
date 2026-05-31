# ADR: harbour stays on Neon (not Supabase)

> status: **accepted** · 2026-05-30 · scope: harbour-apps (all CF-Workers apps)
> revisit if: we want Supabase Auth/Realtime/Storage *inside* harbour, or
> single-vendor consolidation becomes a hard mandate (see "Revisit triggers").

## Decision

Keep harbour-apps on **Neon Postgres** (via the `@neondatabase/serverless`
HTTP driver). Do **not** migrate harbour to Supabase. Use Supabase on projects
that actually use its platform features; don't unify databases for its own sake.

## Context

The harbour estate is on Cloudflare Workers (OpenNext). It uses Neon for the
shared system of record (users, entitlements, packs, Stripe webhook events +
idempotency, knots, depth-chart tables). The question arose because we use
Cloudflare + Supabase on *other* winded.vertigo projects, so unifying on
Supabase felt like it would streamline the stack.

## Rationale

**Supabase's value is the bundled platform — and harbour uses none of it.**
Supabase = Postgres + Auth (RLS/social) + Storage + Realtime + edge functions +
auto REST/GraphQL. You adopt it for those. harbour already covers each concern
another way:

| Concern  | Supabase would provide | harbour uses today |
|----------|------------------------|--------------------|
| Auth     | Supabase Auth + RLS    | **Auth.js / next-auth** (20 apps, shared `packages/auth`) |
| Storage  | Supabase Storage       | **Cloudflare R2** (`creaseworks-evidence`, 10 apps) |
| Realtime | Supabase Realtime      | **Durable Objects / PartyKit** (raft-house) |
| Postgres | Supabase (Supavisor pooler) | **Neon** (HTTP serverless driver) |

So migrating would adopt Supabase as **bare Postgres** while leaving its four
differentiators unused — and in the "just Postgres on Workers" case, Neon is the
*better* fit. `packages/auth/db.ts` documents why: CF Workers reuse isolates, a
connection `Pool` doesn't fit that model, so it uses Neon's **stateless HTTP
`neon()` driver** per request. That's a considered Workers-native choice.

**Migration cost is high, benefit is low.** A move means: swap the HTTP driver
everywhere, re-wire the shared Auth.js adapter, re-validate the per-request
connection model, carry 56+ raw-SQL migrations + the Neon-as-KV idempotency
pattern, across 10+ apps + shared packages, then redeploy the whole CF fleet —
to gain mostly vendor consolidation while *losing* Neon's Workers ergonomics
(HTTP driver, scale-to-zero, branching).

## When to use which (rule of thumb)

- **Neon** — pure serverless Postgres on Workers/edge; you bring your own
  auth/storage/realtime; variable/bursty traffic (scale-to-zero, instant
  branching for CI). ← harbour exactly.
- **Supabase** — you'll actually use the integrated platform (Supabase Auth/RLS,
  Storage, Realtime), especially greenfield, and want one dashboard for all of
  it. ← likely the other winded.vertigo projects.

**Choose by whether you need the BaaS platform — not by "one vendor."**
The SQL migrations are portable (raw SQL, any Postgres); the lock-in is the
*driver* chosen for Workers, which is exactly the thing currently optimal.

## Revisit triggers

- We decide to use **Supabase Auth / Realtime / Storage inside harbour** (then
  Supabase Postgres earns its place alongside them).
- **Single-vendor consolidation becomes a hard mandate.** In that case prefer the
  low-risk path: **Cloudflare Hyperdrive** (free on Workers plans; pools standard
  Postgres drivers over *either* backend) proven on a **new** feature/app first —
  not a big-bang migration of live revenue apps.
</content>
