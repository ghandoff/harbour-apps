# harbour-apps — claude code conventions

> auto-loaded by Claude Code when working in this directory.
> full services audit: `docs/infrastructure-and-costs.md`
> version management: `docs/version-management.md`
> brand guidelines: `docs/brand-guidelines.md`
>
> **companion file: `.claude/evergreen.md`** — team-wide facts (brand voice, IP, accessibility, external API limits) that don't drift with Claude updates. read that for writing/brand rules; this file for current-state technical operations.

## monorepo structure

npm workspaces + Turborepo. all dev commands run from monorepo root.
this repo holds the apps hosted at `windedvertigo.com/harbour/*`.

```
apps/harbour/          → Next.js 16, TS, Notion API (harbour hub — tile grid + credibility)
apps/creaseworks/      → Next.js 16, TS, Auth.js, Neon, Stripe (main product)
apps/depth-chart/      → Next.js 16, TS, Anthropic SDK (assessment generator)
apps/vertigo-vault/    → Next.js 16, TS, Notion API
apps/deep-deck/        → Next.js 16, TS (disconnected from Vercel Git)
apps/conference-experience/ → static HTML (CLI-deployed, never git-connected)
packages/tokens/       → CSS custom properties + TS exports (single source of truth for design)
```

sibling repos (same GitHub org, same local directory):
- `ghandoff/windedvertigo` — static site (windedvertigo.com)
- `ghandoff/pocket-prompts` — voice pipeline backend + mobile app
- `ghandoff/nordic-sqr-rct` — Nordic SQR-RCT review platform

convenience commands from root: `npm run dev:creaseworks`, `npm run dev:vault`, `npm run dev:deep-deck`, `npm run dev:depth-chart`, `npm run test` (vitest), `npm run test:a11y` (axe-core accessibility audit), `npm run lint` (eslint).

---

## infrastructure & costs

these rules exist because we got a $223 Vercel bill from uncontrolled build multiplication. see `docs/infrastructure-and-costs.md` for full context.

- **never add a new Vercel project without updating the cost analysis**. each new project adds a build per push across the entire monorepo.
- **always include `[skip ci]` in commits that don't need Vercel builds** — docs, content syncs, config-only changes. Vercel respects this flag.
- **batch pushes during active sprints**. each `git push` triggers ~5-6 builds. pushing 3x instead of 15x saves ~60 wasted build attempts.
- **disconnected projects deploy manually**: deep-deck, nordic-sqr-rct. do not reconnect without discussing cost implications.
  - **harbour** (migrated to CF Workers 2026-04-25, project `wv-harbour-harbour`): deploy from monorepo root — `cd apps/harbour && npx opennextjs-cloudflare build && npx opennextjs-cloudflare deploy`. has R2 binding `TILE_IMAGES` → `creaseworks-evidence` bucket for tile images.
  - **deep-deck, nordic-sqr-rct**: `cd apps/<project> && vercel --prod` (no workspace packages, app-level deploy still works).
- **spending cap is $10 on-demand** (max $30/month). do NOT raise without explicit approval.
- **every app has `turbo-ignore` in `vercel.json`**. never remove it — it's what prevents unchanged apps from building on every push.
- **cron jobs count as serverless invocations**. creaseworks has 3 (sync-notion daily, send-digests weekly, send-nudges daily). don't add more without checking budget.

### SaaS cost awareness

when evaluating or upgrading any service, always ask:
1. what is the metering unit? (builds, invocations, tokens, GB, requests)
2. what happens when I exceed the included amount? (hard cap vs. overage billing)
3. does our monorepo multiply the cost? (builds, webhooks, cron jobs)
4. is there a spending cap? (set it on day one)
5. can I disconnect/disable when not actively using it?

**free tiers have hard walls that protect you. paid tiers replace walls with a credit card. always rebuild the walls manually via spending caps.**

document answers in `docs/infrastructure-and-costs.md` before committing to a new service.

---

## anthropic API & token economics

- **pocket.prompts must use `claude-opus-4-6`** for intent detection. never downgrade to sonnet.
- **always include token economics** when recommending or planning features that use the Claude API:
  - opus: input $15/1M tokens, output $75/1M tokens
  - sonnet: input $3/1M tokens, output $15/1M tokens
  - haiku: input $0.80/1M tokens, output $4/1M tokens
- **use prompt caching** for repeated system prompts — reduces input costs ~90%.
- **pocket.prompts per-request cost**: ~$0.02-0.03 (opus intent detection). monthly at 50 req/day ≈ $30-45.
- **depth-chart uses sonnet** for document parsing and task generation.

---

## writing & brand conventions

- **all copy must be lowercase** — except professional identities, corporate names, and acronyms (API, AI, CMS, PRME, URL).
- **british english spelling**: "colour", "organisation", "programme" (except computer programs). use "s" not "z" (organise, recognise).
- **oxford comma**: always (apples, oranges, and bananas).
- **date format**: day/month/year (03 january 2025). never month/day/year.
- **time format**: 12-hour with punctuation (5:30 p.m.).
- **brand name**: always "winded.vertigo" with lowercase and period. never "Winded Vertigo" or "WindedVertigo". code uses "wv" prefix.
- **file naming**: kebab-case everywhere.

---

## coding style

- **lowercase variable names**, concise functions, no unnecessary abstraction. three similar lines > a premature abstraction.
- **pocket.prompts is JavaScript only** — no TypeScript. all other Next.js apps use TypeScript.
- **CSS: never hardcode hex values** — use CSS custom properties from `packages/tokens/`. brand palette: `--wv-cadet` (#273248), `--wv-redwood` (#b15043), `--wv-sienna` (#cb7858), `--wv-champagne` (#ffebd2).
- **`next lint` is broken in Next.js 16** — all apps use `"lint": "eslint"` directly. ESLint 9 flat config (`eslint.config.mjs`) with `defineConfig()` + `globalIgnores()`.
- **Next.js 15+ async params**: `params` and `searchParams` are Promises. server components use `await params`, client components use React 19's `use(params)`.

---

## git workflow

- **always rebase before push**. never amend published commits.
- **use `--force-with-lease`** after rebase, never `--force`.
- **pull before starting work** — Garrett works from multiple machines (laptop + desktop).
- **branch naming**: `feat/feature-name`, `fix/bug-name`, `chore/task-name`.
- **commit style**: `type(scope): concise summary` — feat, fix, docs, chore, style, refactor.
- **database migrations sequence**: feature branch → code changes → deploy to Vercel preview → test → merge to main → THEN run migration. never migrate production before code is deployed.
- **notion sync bot pushes daily** (6 AM UTC) — can cause rejected pushes mid-session. run `git pull --rebase origin main` before retrying.

---

## deployment & architecture

> full deployment topology (Vercel vs Cloudflare split, who lives where, how to deploy each runtime, and why the split exists) is in `docs/deployment-topology.md`. **always read that before making a shared-package change** — changes to `packages/auth` or `packages/tokens` require redeploying every CF-routed harbour app manually (17 apps). a git push alone won't ship them.

- **two deployment runtimes**: creaseworks + vertigo.vault deploy to **Vercel**. the harbour hub and every other harbour app (paper-trail, deep-deck, depth-chart, raft-house, tidal-pool, mirror-log, and the 11 threshold-concept apps) deploys to **Cloudflare Workers** via OpenNext. harbour itself migrated 2026-04-25. the split exists to keep the long tail of low-traffic apps off Vercel's per-function billing after the Feb 2026 $223 overage.
- **CF deploy is manual per app**: `cd apps/<app> && npx opennextjs-cloudflare build && npx opennextjs-cloudflare deploy`. `deploy` alone reuses cached artifacts — always build first when source changed. a batch loop for sweeping all CF apps lives in `docs/deployment-topology.md`.
- **routing lives in a sibling repo**: `windedvertigo.com/harbour/*` is proxied by `ghandoff/windedvertigo` (the `site` project). its `next.config.ts` has the rewrites that pick Vercel vs Cloudflare per app. new harbour apps must add a rewrite there and redeploy that project.
- **depth-chart bypasses the site router**: `wv-harbour-depth-chart` has direct CF Workers Routes for `windedvertigo.com/harbour/depth-chart/*`, which override the site's broader `windedvertigo.com/*` route. all secrets are wired (AUTH_SECRET synced from vault for SSO, GOOGLE_CLIENT_ID/SECRET from port, POSTGRES_URL, NOTION_TOKEN, RESEND_API_KEY, EMAIL_FROM, INITIAL_ADMIN_EMAIL, SLACK_FEEDBACK_*, AUTH_URL=`https://windedvertigo.com/harbour/depth-chart`, AUTH_TRUST_HOST=true, WORKERS_AUTH_PAGES_BASEPATH=`/harbour/depth-chart`, ANTHROPIC_API_KEY/BASE_URL via AI Gateway, PORT_EXTRACT_TOKEN). other harbour apps still go through the site router proxy.
- **port hosts `/api/extract-text`** (Vercel, bearer-auth via PORT_EXTRACT_TOKEN). depth-chart's `/api/parse` calls it via fetch for PDF/DOCX extraction because pdf-parse + mammoth use Node Buffer/DOM APIs that don't run on CF Workers.
- **static site proxies to other apps** via Next.js rewrites in the sibling `ghandoff/windedvertigo` repo's `site/next.config.ts`. if a proxied app's URL changes, update the rewrites there.
- **shared auth cookies**: creaseworks and vertigo-vault share session cookies on `.windedvertigo.com`. changes to `AUTH_SECRET` in one break sessions in the other. always change both together.
- **next-auth pinned at 5.0.0-beta.30** — waiting for v5 stable. do NOT downgrade to v4. do NOT blindly bump beta.
- **vertigo-vault local builds fail** — pre-rendering requires `NOTION_TOKEN` (only in Vercel). compilation succeeds; failure is at static generation. this is expected.
- **smoke test**: `cd apps/creaseworks && node scripts/smoke-test.mjs https://windedvertigo.com/harbour/creaseworks` validates 29 routes.
- **Next.js basePath gotcha**: `redirect()` auto-prepends basePath. never hardcode basePath in redirect targets or it doubles. use `redirect("/")` not `redirect("/harbour/creaseworks")`.
- **security headers (HSTS + CSP)** defined in both `next.config.ts` (runtime) and `vercel.json` (edge CDN). keep them in sync.
- **scaling interactive demos**: currently inline in site repo. at 5+ demos, migrate to Vercel rewrite proxy pattern (each demo as its own project).

---

## database

- **always use `POSTGRES_URL` (pooled)** for application code. `POSTGRES_URL_NON_POOLING` only for migrations.
- **Neon connection limit**: 100 concurrent. connection pooling via PgBouncer (built into pooled URL) prevents exhaustion.
- **Neon serverless driver**: one SQL statement per HTTP call. multi-statement SQL files must be split. comments must be stripped first (semicolons inside comments cause false splits).
- **Notion is editorial CMS; Neon Postgres is system of record** for users, organisations, entitlements, access control. content flows one direction: Notion → Postgres cache → app.

---

## notion integration

- **CMS workflow**: Notion → `scripts/fetch-notion.js` → JSON files in `apps/site/data/` → browser fetch at runtime.
- **portfolio assets use `notion.search()`**, not `databases.query()` (doesn't work with multi-databases).
- **Notion API rate limit is 3 req/sec** — monitor as more projects sync. pocket.prompts at 50 concurrent users would hit ~0.8 req/sec average. Postgres migration (pocket.prompts phase 10) should happen before public launch.
- **Notion REST API returns `url` under its actual name**, not `userDefined:url` (that's MCP-only convention).
- **site content CMS**: database `09a046a5` → `site-content-{page}.json` per page. status field controls sync (empty or `live` = visible, `draft`/`archived` = hidden).

---

## accessibility

- **`prefers-reduced-motion`**: global reset kills all animation.
- **`:focus-visible`**: 3px blue (#3B82F6) outline, 2px offset, on all interactive elements.
- **typography**: 16px base, line-height 1.6, letter-spacing 0.02em, max-width 70ch.
- **`prefers-contrast: more`**: bumps text to pure black.
- **skip-to-content links** in creaseworks layout and static site pages.
- **ARIA landmarks**: `aria-label="main navigation"` on all navs.
- **form accessibility**: all inputs need `aria-label` or `<label>`, errors via `aria-describedby`.
- **contrast**: all combos tested to WCAG AAA (7:1). accent-on-dark uses `--color-accent-on-dark` (#e09878, 5.5:1 AA).
- **automated audit**: `npm run test:a11y` runs axe-core.

---

## security

- **never commit `.env` files**. use Vercel's environment variable UI for production secrets.
- **address high-severity Dependabot alerts within 1 week**. run `npm audit` monthly.
- **rotate keys** if ever exposed in logs or commits.
- **Stripe test mode keys** (`sk_test_*`) are safe for development but never deploy to production.

---

## IP & licensing

- **PRME framework content is CC BY 4.0**: depth.chart `/harbour/skills` page must always be free and publicly accessible. revenue comes from tooling layers (assessment generator, exports).
- **always include attribution** to PRME and LEGO Foundation on pages displaying framework content.
- **tools and software are winded.vertigo IP** — separate from the open-licensed "Works."

---

## dependency management

see `docs/version-management.md` for full update cadence.

- **P0 (security CVEs)**: immediate, same day.
- **P1 (frameworks — Next.js, React, Auth.js)**: monthly evaluation.
- **P2 (SDKs — Anthropic, Stripe, Notion)**: quarterly.
- **@notionhq/client**: hold at ^2.3.0 — v5.x is a major rewrite. **exception: harbour is on ^5.20.0** (forced by CF Workers — v2 uses `node:https.request` which Workers don't polyfill; v5 uses fetch). the upgrade required swapping `notion.databases.query()` → `notion.dataSources.query()` via a `queryDataSource()` adapter. other apps stay on v2.
- **Renovate**: opens grouped PRs weekly (Monday), automerges patches after CI.

---

## services in use

Vercel (Pro, $20/mo + capped overage), Neon (Postgres), Stripe (pay-per-tx), Cloudflare R2 (object storage — canonical bucket `creaseworks-evidence` in the garrett CF account `097c92553b268f8360b74f625f6d980a`; public URL `https://pub-60282cf378c248cf9317acfb691f6c99.r2.dev`; the bucket was migrated from the anotheroption CF account on 2026-04-25), Notion (CMS), Anthropic (Claude API), Resend (email), Upstash KV (Redis via Vercel KV), Slack, Google OAuth, GitHub Actions. full audit and env var inventory in `docs/infrastructure-and-costs.md`.

**R2 image patterns** (added 2026-04-25): vault computes `cover_url` from `cover_r2_key` at query time. harbour caches tile images via admin endpoint `POST /harbour/api/admin/sync-tiles` (Bearer `CRON_SECRET`).
