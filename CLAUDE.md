# harbour-apps — claude code conventions

> auto-loaded by Claude Code in this directory.
> services audit: `docs/infrastructure-and-costs.md` · deployment topology:
> `docs/deployment-topology.md` · version mgmt: `docs/version-management.md` ·
> brand: `docs/brand-guidelines.md`
> **companion: `.claude/evergreen.md`** — team-wide facts (brand voice, IP,
> accessibility, external API limits) that don't drift with Claude updates.
> **glossary: `docs/glossary.md`** — every technical term, explained for the
> Collective (see communication rule below).
>
> **Keep this file to durable conventions.** Dated incident post-mortems and the
> full pre-2026-06-19 version live in `docs/decisions/` (complete snapshot:
> `docs/decisions/CLAUDE-full-snapshot-2026-06-19.md`). Add new war-stories
> there — over-stuffed always-loaded rules anchor newer Claude versions.

## working with the Collective — how to explain things

Several members (Garrett, Maria, Payton, Lamyse, Jamie) are growing into the
technical side and are **not** command-line-fluent. They want to learn the
vocabulary as we go. For any of them:

- **dual-language, always.** Say it plainly first, then name the jargon in
  brackets — "the top folder of the project (the *repo root*)", "upload your
  saved changes to GitHub (*push*)". Never use a technical term cold.
- **never drop a bare command.** Say *where* to run it (which folder, how to
  confirm) and *how* (copy, click the terminal, cmd+v, return).
- **log new jargon to `docs/glossary.md`** the first time it comes up.
- **do the mechanical steps for them** whenever you can; only hand over a step
  that genuinely must run on their machine, and say why.

## monorepo structure

npm workspaces + Turborepo; all dev commands run from monorepo root. Holds the
apps hosted at `windedvertigo.com/harbour/*`.

```
apps/harbour/          → Next.js 16, TS, Notion API (hub — tile grid + credibility)
apps/creaseworks/      → Next.js 16, TS, Auth.js, Neon, Stripe (main product)
apps/depth-chart/      → Next.js 16, TS, Anthropic SDK (assessment generator)
apps/vertigo-vault/    → Next.js 16, TS, Notion API
apps/deep-deck/        → Next.js 16, TS (disconnected from Vercel Git)
apps/conference-experience/ → static HTML (CLI-deployed)
packages/tokens/       → design tokens (single source of truth)
```

Sibling repos (same org + local dir): `ghandoff/windedvertigo` (the
windedvertigo.com static site), `ghandoff/pocket-prompts`, `ghandoff/nordic-sqr-rct`.

Root convenience: `npm run dev:creaseworks|dev:vault|dev:deep-deck|dev:depth-chart`,
`npm run test` (vitest), `npm run test:a11y` (axe-core), `npm run lint` (eslint).

## infrastructure & cost discipline

Rules born from a $223 Vercel overage (full context: `docs/infrastructure-and-costs.md`).

- **Never add a Vercel project without updating the cost analysis** — each adds a
  build per push across the whole monorepo.
- **Include `[skip ci]`** in commits that don't need builds (docs, content syncs, config-only).
- **Batch pushes during sprints** — each push triggers ~5-6 builds.
- **Spending cap is $10 on-demand (max $30/mo). Do NOT raise without approval.**
- **Every app has `turbo-ignore` in `vercel.json` — never remove it.**
- **Cron jobs count as invocations** (creaseworks has 3). Don't add more without checking budget.
- Disconnected projects deploy manually (deep-deck, nordic-sqr-rct); don't reconnect without discussing cost.

**SaaS cost checklist** — before adopting/upgrading any service: (1) metering
unit? (2) overage = hard cap or billing? (3) does the monorepo multiply it?
(4) spending cap — set day one. (5) can I disable when idle? Free tiers have hard
walls; paid tiers replace them with a credit card, so rebuild the walls via
spending caps. Record answers in `docs/infrastructure-and-costs.md`.

## anthropic API & token economics

- **pocket.prompts uses `claude-opus-4-6`** for intent detection — never
  downgrade to sonnet. **depth-chart uses sonnet** for parsing + task generation.
- **Always include token economics** when recommending Claude-API features —
  pull current per-1M input/output prices from the Anthropic pricing page rather
  than hardcoded numbers (they drift).
- **Use prompt caching** for repeated system prompts (~90% input-cost cut).

## writing & brand conventions

- **All copy lowercase** except professional identities, corporate names,
  acronyms (API, AI, CMS, PRME, URL).
- **British spelling** (colour, organise, programme — except computer programs).
- **Oxford comma** always.
- **Dates** day/month/year (03 january 2025). **Times** 12-hour with punctuation (5:30 p.m.).
- **Brand name** always `winded.vertigo` (lowercase + period); code uses `wv` prefix.
- **kebab-case** filenames everywhere.

## coding style

- **Lowercase variable names**, concise functions, no premature abstraction.
- **pocket.prompts is JavaScript only** (no TS); all other Next.js apps use TS.
- **CSS: never hardcode hex** — use tokens from `packages/tokens/`. Palette:
  `--wv-cadet` #273248, `--wv-redwood` #b15043, `--wv-sienna` #cb7858,
  `--wv-champagne` #ffebd2.
- **`next lint` is broken in Next 16** — all apps use `"lint": "eslint"` (ESLint 9 flat config).
- **Next 15+ async params**: `params`/`searchParams` are Promises — `await` in
  server components, `use()` in client.
- **Never use `@aws-sdk/*` in CF-deployed apps** — it reads `~/.aws/config` from
  disk, which Workers lack (`fs.readFile not implemented` at runtime; builds fine,
  dies in prod). Use **`aws4fetch`** (signs SigV4 with web crypto + fetch).
  Reference: `apps/creaseworks/src/lib/r2.ts`. (Related: `wrangler secret list`
  shows names only — a secret can exist with an empty value; verify by exercising
  the code path.)
- **CF-deployed apps must use `middleware.ts`, never `proxy.ts`** — Next 16's
  `proxy.ts` compiles to a Node function OpenNext-CF rejects; `middleware.ts`
  compiles to Edge, which it accepts. Vercel apps can use either.

## git workflow

- **Rebase before push; `--force-with-lease` after rebase, never `--force`.**
  Never amend published commits.
- **Pull before starting** — Garrett works from multiple machines.
- Branch naming `feat/`, `fix/`, `chore/`; commits `type(scope): summary`.
- **DB migration sequence**: feature branch → code → deploy preview → test →
  merge → THEN migrate. Never migrate prod before code is deployed.
- **Notion sync bot pushes daily (6 AM UTC)** — can cause rejected pushes;
  `git pull --rebase origin main` and retry.
- **Session protocol** (multi-conversation hygiene): pull-rebase at start,
  commit+push at end (`/end-of-day-sync`), avoid branches >~3 days
  (`/branch-cleanup`). Parallel work → `git worktree add`.

## deployment & architecture

> Full topology (Vercel vs CF split, who lives where, how to deploy each) in
> `docs/deployment-topology.md`. **Read it before any shared-package change** —
> `packages/auth` or `packages/tokens` edits require manually redeploying every
> CF-routed harbour app; a git push alone won't ship them.

- **Two runtimes.** creaseworks, harbour, depth-chart, vertigo-vault, and the
  long tail of harbour apps deploy to **Cloudflare Workers** via OpenNext.
  **nordic-sqr-rct stays on Vercel** (Workflow DevKit + Vercel Blob deps). The
  split keeps low-traffic apps off Vercel per-function billing.
- **CF deploy is manual per app**: `cd apps/<app> && npx opennextjs-cloudflare
  build && node ../../packages/security/scripts/write-assets-headers.mjs
  <basePath> && <deploy>`. The middle step is required for correct
  `_next/static/*` caching.
- **Pick `<deploy>` by whether the app has a custom `worker.ts`:** apps whose
  `wrangler.jsonc` sets `main: worker.ts` (the `@windedvertigo/security` wrapper
  that injects CSP + re-exports DO classes — harbour, depth-chart, vertigo-vault,
  raft-house, threshold-concept apps) **MUST use `npx wrangler deploy`**. Only
  plain apps without a custom `worker.ts` can use the `npx opennextjs-cloudflare
  deploy` shortcut — it bypasses `worker.ts` and silently drops security headers
  + DO exports. (Symptoms + the raft-house/harbour-auth incidents: `docs/decisions/`.)
- **Security headers**: OpenNext-on-CF ignores Next `headers()`. Use
  `@windedvertigo/security` via `worker.ts`; re-export DO classes verbatim. Full
  pattern: `docs/security/cf-headers-wrapper.md`.
- **Routing lives in the sibling `ghandoff/windedvertigo` repo** (`site/next.config.ts`
  rewrites pick Vercel vs CF per app). New harbour apps add a rewrite there and
  redeploy that project. (depth-chart + harbour auth subtrees bypass the site
  proxy via direct CF routes — detail in `docs/decisions/`.)
- **harbour-nav data changes** only need a rebuild + nav-cdn deploy, not a sweep
  of consumers (React fetches `/harbour-apps.json` at runtime). A full sweep is
  still required for `packages/auth` code changes. Source layout + workflow:
  `docs/decisions/`.
- **Shared auth cookies**: creaseworks + vertigo-vault share session cookies on
  `.windedvertigo.com` — change `AUTH_SECRET` in both together or sessions break.
- **next-auth pinned at 5.0.0-beta.30** — don't downgrade to v4, don't blindly bump beta.
- **vertigo-vault local builds fail** at static generation (needs `NOTION_TOKEN`,
  a CF Worker secret) — expected; compilation itself succeeds.
- **smoke test**: `cd apps/creaseworks && node scripts/smoke-test.mjs <url>` validates 29 routes.
- **Next basePath gotcha**: basePath is auto-prepended by `redirect()`,
  `<Link href>`, and `router.push()` — never hardcode it (it doubles → silent
  404). Pass only app-relative paths.

## database

- **Use `POSTGRES_URL` (pooled)** for app code; `POSTGRES_URL_NON_POOLING` only for migrations.
- **Neon limit 100 concurrent** (PgBouncer in the pooled URL prevents exhaustion).
- **Neon serverless driver: one statement per HTTP call** — split multi-statement SQL; strip comments first.
- **Notion is editorial CMS; Neon Postgres is system of record** (users, orgs,
  entitlements, access). Content flows Notion → Postgres cache → app.

## notion integration

- **CMS**: Notion → `scripts/fetch-notion.js` → JSON in `apps/site/data/` → runtime fetch.
- **Portfolio assets use `notion.search()`**, not `databases.query()`.
- **Rate limit 3 req/sec** — monitor as projects sync.
- **Site content**: database `09a046a5` → `site-content-{page}.json`; status field
  controls sync (empty/`live` = visible, `draft`/`archived` = hidden).

## accessibility

`prefers-reduced-motion` global reset; `:focus-visible` 3px #3B82F6 outline, 2px
offset; 16px base, line-height 1.6, letter-spacing 0.02em, max-width 70ch;
`prefers-contrast: more` → pure black; skip-to-content links; ARIA landmarks; all
inputs labelled + errors via `aria-describedby`; contrast to WCAG AAA
(accent-on-dark `--color-accent-on-dark` #e09878 at AA). Audit: `npm run test:a11y`.

## security

- **Never commit `.env`** — use the Vercel / Worker secret UIs.
- **Address high-severity Dependabot alerts within 1 week**; `npm audit` monthly.
- **Rotate keys** if exposed. **Stripe test keys (`sk_test_*`) never go to prod.**

## IP & licensing

- **PRME content is CC BY 4.0** — depth.chart `/harbour/skills` stays free +
  public; revenue is in the tooling layers. **Always attribute PRME + LEGO
  Foundation** on framework-content pages.
- **Tools and software are winded.vertigo IP**, separate from the open-licensed "Works."

## dependency management

Full cadence: `docs/version-management.md`. Live working notes (wrangler 3→4
follow-up, latest Dependabot triage pass): `docs/decisions/`.

- **P0 security CVEs** same day. **P1 frameworks** (Next, React, Auth.js) monthly.
  **P2 SDKs** (Anthropic, Stripe, Notion) quarterly.
- **@notionhq/client**: hold at ^2.3.0 (v5 is a rewrite). **Exception: harbour on
  ^5.20.0** (CF Workers — v2 uses `node:https`; v5 uses fetch). Other apps stay on v2.
- **Renovate** opens grouped PRs weekly (Mon), automerges patches after CI.
- **npm `overrides` do NOT apply in this repo** — nested non-workspace
  sub-projects (`apps/values-auction/relay`, `.../workers/hub`) carry their own
  lockfiles. Fix the *parent* dependency instead of reaching for `overrides`.
- **Dependabot triage**: check installed-vs-affected-range, not just severity —
  most "high" alerts here are ghosts (manifests for removed apps) or
  false-positives (installed version already outside the advisory range). Dismiss
  ghosts `not_used`, false-positives `inaccurate`.

## services in use

Vercel (Pro $20/mo + capped overage), Neon (Postgres; also short-TTL KV-style
cache), Stripe, Cloudflare R2 (`creaseworks-evidence` bucket), Notion (CMS),
Anthropic, Resend, Slack, Google OAuth, GitHub Actions. **No Upstash/Vercel KV**
in this monorepo. Full env-var inventory: `docs/infrastructure-and-costs.md`.
