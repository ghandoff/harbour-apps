# harbour-apps — claude code conventions

> auto-loaded by Claude Code when working in this directory.
> full services audit: `docs/infrastructure-and-costs.md`
> version management: `docs/version-management.md`
> brand guidelines: `docs/brand-guidelines.md`
>
> **companion file: `.claude/evergreen.md`** — team-wide facts (brand voice, IP, accessibility, external API limits) that don't drift with Claude updates. read that for writing/brand rules; this file for current-state technical operations.
> **plain-language glossary: `docs/glossary.md`** — every technical term, explained for the Collective. see the communication rule below.

## working with the Collective — how to explain things

Several Collective members (Garrett, Maria, Payton, Lamyse, Jamie) are growing
into the technical side and are **not** command-line-fluent developers. They have
asked to learn the vocabulary *as we go*, without having to interrupt a task to
ask what a word means. Honour this in every reply, for any of them:

- **dual-language, always.** say it plainly first, then name the jargon in
  brackets so he picks it up — e.g. "the top folder of the project (the *repo
  root*)", "upload your saved changes to GitHub (*push*)". never use a technical
  term cold.
- **never drop a bare command.** when something must be run in the terminal, say
  *where* to run it (which folder, how to confirm he's in the right place) and
  *how* (copy, click the terminal, cmd+v, return) — not just the command text.
- **log new jargon to `docs/glossary.md`** when it first comes up, so he can read
  it asynchronously instead of asking mid-task. if you use a term that isn't in
  the glossary yet, add it.
- **do the mechanical steps for him whenever you can.** only hand him a step when
  it genuinely must run on his machine (e.g. blocked by the web sandbox's
  firewall) — and when you do, say *why* it can't be done from your side.
- keep operational replies focused; put the deeper teaching in the glossary, not
  inline walls of explanation.

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
  - **harbour** (migrated to CF Workers 2026-04-25, project `wv-harbour-harbour`): `cd apps/harbour && npx opennextjs-cloudflare build && node ../../packages/security/scripts/write-assets-headers.mjs /harbour && npx wrangler deploy`. **use `wrangler deploy`, NOT `opennextjs-cloudflare deploy`** — harbour's `wrangler.jsonc` has `main: worker.ts` (custom wrapper that injects the security-headers CSP and re-exports the DO classes); `opennextjs-cloudflare deploy` uploads `.open-next/worker.js` directly and bypasses `worker.ts`, shipping harbour without its CSP and DO exports (same trap as raft-house, see CF deploy notes below). has R2 binding `TILE_IMAGES` → `creaseworks-evidence` bucket for tile images.
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
- **never use `@aws-sdk/*` in CF-deployed apps** — the AWS SDK's config-resolution chain reads `~/.aws/config` from disk (the *filesystem*), which CF Workers don't have: every call throws `[unenv] fs.readFile is not implemented yet!` at runtime (builds fine, dies in production). use **`aws4fetch`** instead — it signs requests (*SigV4*) with web crypto and plain `fetch`. reference implementation: `apps/creaseworks/src/lib/r2.ts` (rewritten in #173 after this silently broke photo uploads for weeks). related gotcha from the same incident: `wrangler secret list` shows secret *names* only — a secret can exist with an **empty value** and look identical. verify secrets by exercising the code path, not by listing them.
- **Next.js 16 proxy.ts vs middleware.ts — OpenNext CF caveat**: Next.js 16 introduced `proxy.ts` (exports `proxy` + `config`) as a replacement for `middleware.ts`. **However**, `proxy.ts` compiles to a Node.js function which OpenNext CF rejects ("Node.js middleware is not currently supported"). `middleware.ts` compiles to Edge runtime which OpenNext CF accepts. **Rule for all CF-deployed apps in this repo**: always use `middleware.ts`, never `proxy.ts`. Vercel-deployed apps can use either. The full-featured `proxy-handler.ts` (Postgres rate limiting, CSRF) cannot run at Edge layer regardless — those features belong in `worker.ts` at the CF Worker level, not in middleware.

---

## git workflow

- **always rebase before push**. never amend published commits.
- **use `--force-with-lease`** after rebase, never `--force`.
- **pull before starting work** — Garrett works from multiple machines (laptop + desktop).
- **branch naming**: `feat/feature-name`, `fix/bug-name`, `chore/task-name`.
- **commit style**: `type(scope): concise summary` — feat, fix, docs, chore, style, refactor.
- **database migrations sequence**: feature branch → code changes → deploy to Vercel preview → test → merge to main → THEN run migration. never migrate production before code is deployed.
- **notion sync bot pushes daily** (6 AM UTC) — can cause rejected pushes mid-session. run `git pull --rebase origin main` before retrying.

### session protocol (cross-conversation hygiene)

Garrett runs multiple Claude Code conversations against this repo and its
sibling `windedvertigo`. Without discipline, sessions step on each other:
session A modifies file X, session B doesn't know, session B's deploy ships
the pre-A version of X. We hit this hard with the harbour-nav widget bundle
(see "harbour-nav widget cross-repo flow" below).

Three habits, low effort, high payoff:

1. **Start every session with `git pull --rebase origin main`** before touching
   anything in either repo. Stops you from working on a stale base. If you
   notice a long-lived `feat/*` branch belongs to active work elsewhere, ask
   before continuing on `main`.

2. **End every session by committing + pushing** — even if the work is
   incremental. Open a PR (or admin-merge for solo work) before closing the
   conversation. Never leave changes uncommitted in a working directory that
   another conversation can't see. The `/end-of-day-sync` skill covers this.

3. **Avoid long-lived branches.** `feat/*` branches older than ~3 days are
   debt. If a branch is unfinished, get it to a mergeable shippable state
   and merge — even partially — then continue on a fresh short-lived branch.
   The `/branch-cleanup` skill audits the remote for stale branches.

For parallel work on the same repo from different conversations, use
`git worktree add ../<repo>-<task> <branch>` so each conversation gets its
own physical working directory. The Claude Code harness's `EnterWorktree`
tool can do this for you on request.

---

## deployment & architecture

> full deployment topology (Vercel vs Cloudflare split, who lives where, how to deploy each runtime, and why the split exists) is in `docs/deployment-topology.md`. **always read that before making a shared-package change** — changes to `packages/auth` or `packages/tokens` require redeploying every CF-routed harbour app manually (17 apps). a git push alone won't ship them.

- **two deployment runtimes**: **vertigo-vault is on Cloudflare Workers** (as `wv-vault`, confirmed 2026-05-26 — its `wrangler.jsonc` declares the worker name + `worker.ts` + `open-next.config.ts` are present). creaseworks, harbour, depth-chart, vertigo-vault, and all other harbour apps (paper-trail, deep-deck, raft-house, tidal-pool, mirror-log, and the 11 threshold-concept apps) deploy to **Cloudflare Workers** via OpenNext. harbour migrated 2026-04-25; creaseworks was already on CF Workers (confirmed 2026-05-18); vertigo-vault confirmed CF-resident 2026-05-26. the split exists to keep the long tail of low-traffic apps off Vercel's per-function billing after the Feb 2026 $223 overage. **nordic-sqr-rct remains on Vercel** (pinned by Workflow DevKit + Vercel Blob deps).
- **CF deploy is manual per app**: `cd apps/<app> && npx opennextjs-cloudflare build && node ../../packages/security/scripts/write-assets-headers.mjs <basePath> && <deploy>`. The middle step writes `.open-next/assets/_headers` so CF's Static Assets binding serves content-hashed `_next/static/*` with `Cache-Control: public, max-age=31536000, immutable` — without it the default is `max-age=0, must-revalidate` and every chunk re-validates on every page load. `deploy` alone reuses cached artifacts — always build + write-headers first when source changed. a batch loop for sweeping all CF apps lives in `docs/deployment-topology.md`. **`<deploy>` step — pick by whether the app has a custom `worker.ts`**: apps whose `wrangler.jsonc` sets `main: worker.ts` (the `@windedvertigo/security` wrapper that injects CSP + re-exports DO classes — i.e. harbour, depth-chart, vertigo-vault, raft-house, and the threshold-concept apps) **MUST use `npx wrangler deploy`**. Only plain apps without a custom `worker.ts` can use the `npx opennextjs-cloudflare deploy` shortcut — it uploads `.open-next/worker.js` directly and bypasses `worker.ts`, silently dropping the security headers and DO exports. See the raft-house exception below for the full symptom.
- **raft-house deploy exception — use `npx wrangler deploy` not `opennextjs-cloudflare deploy`**: `opennextjs-cloudflare deploy` uploads `.open-next/worker.js` directly, bypassing wrangler's bundle step and losing everything in `worker.ts` (the @windedvertigo/security CSP wrapper, the RaftRoom DO export, the routePartykitRequest routing). raft-house's correct deploy sequence is `npx opennextjs-cloudflare build && npx wrangler deploy`. The `opennextjs-cloudflare deploy` shortcut works for apps without a custom `worker.ts`; raft-house (and any other app with a custom wrapper) needs the wrangler path. Symptom of using the wrong command: wrangler only shows `env.WORKER_SELF_REFERENCE` + `env.ASSETS` in the binding list — `env.RaftRoom` is missing. Wrangler also emits a "no such Durable Object class exported" warning that is a false-positive from the local workerd validator — the DO works at runtime when bundled correctly via `wrangler deploy`.
- **routing lives in a sibling repo**: `windedvertigo.com/harbour/*` is proxied by `ghandoff/windedvertigo` (the `site` project). its `next.config.ts` has the rewrites that pick Vercel vs Cloudflare per app. new harbour apps must add a rewrite there and redeploy that project.
- **depth-chart bypasses the site router**: `wv-harbour-depth-chart` has direct CF Workers Routes for `windedvertigo.com/harbour/depth-chart/*`, which override the site's broader `windedvertigo.com/*` route. all secrets are wired (AUTH_SECRET synced from vault for SSO, GOOGLE_CLIENT_ID/SECRET from port, POSTGRES_URL, NOTION_TOKEN, RESEND_API_KEY, EMAIL_FROM, INITIAL_ADMIN_EMAIL, SLACK_FEEDBACK_*, AUTH_URL=`https://windedvertigo.com/harbour/depth-chart/api/auth`, AUTH_TRUST_HOST=true, WORKERS_AUTH_PAGES_BASEPATH=`/harbour/depth-chart`, ANTHROPIC_API_KEY/BASE_URL via AI Gateway, PORT_EXTRACT_TOKEN). other harbour apps still go through the site router proxy.
- **harbour hub joined Pool A SSO 2026-04-26**: `apps/harbour/lib/auth.ts` wires `createHarbourAuth({ appName: "" })`. Same `.windedvertigo.com` cookie scope as creaseworks/vault/depth-chart. Magic-link signin at `/harbour/login`. 7 secrets on the Worker: AUTH_SECRET, POSTGRES_URL, RESEND_API_KEY, EMAIL_FROM, WORKERS_AUTH_PAGES_BASEPATH=`/harbour`, AUTH_TRUST_HOST=true, AUTH_URL=`https://windedvertigo.com/harbour/api/auth`. Pool A is now 4 apps.
- **harbour auth canonical host = APEX, not www (fixed 2026-05-29)**: the route handler normalises every auth request onto one canonical origin (it has to, so magic-link emails + OAuth redirect_uris land on a single host). harbour's worker `AUTH_URL` secret carried `www.windedvertigo.com`, which forced apex visitors (the default — users land at `windedvertigo.com`) onto `www`. Magic-link emails and the shared Google client's `redirect_uri` were emitted for `www`, but the OAuth client's URIs are registered on the apex (matching creaseworks/vault/depth-chart) → sign-in failed with a generic "something went wrong". Fix: `apps/harbour/app/api/auth/[...nextauth]/route.ts` passes `createAuthRouteHandler("", authConfig, { authUrl: "https://windedvertigo.com/harbour/api/auth" })`, pinning the apex regardless of the secret. **Recommended follow-up: also update the worker's `AUTH_URL` secret to the apex value so code + secret agree** (`wrangler secret put AUTH_URL` → `https://windedvertigo.com/harbour/api/auth`). Redeploy harbour after merging (CF deploy is manual).
- **harbour hub auth routes bypass the site proxy (2026-04-28)**: `wrangler.jsonc` for `wv-harbour-harbour` has direct CF Workers Routes for `windedvertigo.com/harbour/api/auth` and `windedvertigo.com/harbour/api/auth/*` (both bare and www). Root cause: Next.js `beforeFiles` rewrites in the site proxy follow upstream 302s server-side — Auth.js's redirect-to-Google gets consumed by the proxy, returning Google HTML at status 200 instead of 302 to the browser. Fix: bypass the proxy for the auth subtree so the 302 reaches the browser. All other `/harbour/*` traffic still goes through the site proxy. `workers_dev: true` is required in `wrangler.jsonc` to keep `.windedvertigo.workers.dev` accessible for the site proxy's rewrites to the harbour Worker on non-auth paths.
- **CF Workers + OpenNext security headers**: OpenNext-on-CF does NOT honour Next.js `next.config.ts` `headers()`. Use the `@windedvertigo/security` package (`packages/security/`) — `apps/<app>/worker.ts` imports OpenNext's default + DO classes, wraps the default with `wrapWithSecurityHeaders(handler, { csp: HARBOUR_DEFAULT_CSP })`, and sets `wrangler.jsonc` `main` to `worker.ts` (not `.open-next/worker.js`). Re-export the DO classes verbatim or wrangler drops them and deploy fails. Full pattern + rollout to depth-chart and 14 threshold-concept apps in `docs/security/cf-headers-wrapper.md`.
- **OpenNext static-asset rewrite gotcha**: a Next.js rewrite whose destination is a directory (`/path/`) doesn't resolve via OpenNext-on-CF — the static handler 307s to the trailing-slash form, which the rewriter treats as the rewrite's final response (surfaces as 404). For static-HTML tools served from `public/`, use a `permanent: false` redirect pointing at `/path/index.html` instead of a rewrite. See `windedvertigo/site/next.config.ts` `redirects()` block (the-mashup, writers-room, three-intelligence-workbook all use this pattern).
- **port hosts `/api/extract-text`** (Vercel, bearer-auth via PORT_EXTRACT_TOKEN). depth-chart's `/api/parse` calls it via fetch for PDF/DOCX extraction because pdf-parse + mammoth use Node Buffer/DOM APIs that don't run on CF Workers.
- **static site proxies to other apps** via Next.js rewrites in the sibling `ghandoff/windedvertigo` repo's `site/next.config.ts`. if a proxied app's URL changes, update the rewrites there.
- **harbour-nav — runtime-fetched data (2026-05-27)**: `wv-harbour-nav-cdn` Worker serves two paths on `windedvertigo.com` (apex + www): `/harbour-nav-widget.js` (vanilla IIFE for static HTML consumers) and `/harbour-apps.json` (the live `HARBOUR_APPS` array). The React `HarbourNav` uses its bundled `HARBOUR_APPS` for SSR + initial paint, then `fetch()`es `/harbour-apps.json` on mount and swaps state — so a HARBOUR_APPS data change only needs a cdn-worker deploy, not a sweep of every React consumer. The vanilla bundle wraps the same component so it benefits from the same runtime refresh. **The 19-app sweep is no longer required for HARBOUR_APPS data changes**; it's still required for `packages/auth` code changes that alter `HarbourNav` itself, types, or shared package exports. Source layout: `packages/auth/harbour-apps-data.ts` is the React-free data file (single source of truth); `harbour-nav.tsx` imports it as `BUNDLED_HARBOUR_APPS`; `build-vanilla.mjs` emits both the IIFE bundle and `harbour-apps.json` into `apps/harbour-nav-cdn/public/`. Workflow: edit data → `npm run rebuild-nav` from repo root → `cd apps/harbour-nav-cdn && npx wrangler deploy`. CF routes beat wv-site's `/*` catchall (confirmed via throwaway-worker precedence test). wv-site ships neither artifact.
- **shared auth cookies**: creaseworks and vertigo-vault share session cookies on `.windedvertigo.com`. changes to `AUTH_SECRET` in one break sessions in the other. always change both together.
- **next-auth pinned at 5.0.0-beta.30** — waiting for v5 stable. do NOT downgrade to v4. do NOT blindly bump beta.
- **vertigo-vault local builds fail** — pre-rendering requires `NOTION_TOKEN`, which is set as a CF Worker secret on `wv-vault` (not in local `.env.local` by default — keeps token blast radius small). compilation succeeds; failure is at static generation. this is expected.
- **smoke test**: `cd apps/creaseworks && node scripts/smoke-test.mjs https://windedvertigo.com/harbour/creaseworks` validates 29 routes.
- **Next.js basePath gotcha**: basePath is auto-prepended by `redirect()`, `<Link href>`, AND `router.push()` — never hardcode basePath in any of them or it doubles. use `redirect("/")` / `<Link href="/profile">` / `router.push("/")`, never `redirect("/harbour/creaseworks")` or `<Link href="/harbour/profile">` (the latter resolves to `/harbour/harbour/profile`, a silent 404). pass only the literal app-relative path; the framework adds the `/harbour/<app>` prefix. (bit the harbour `/account` profile links — fixed in #143.)
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
- **npm `overrides` do NOT apply in this repo** (verified 2026-05-30): adding an `overrides` block to root `package.json` is silently ignored — even a from-scratch `npm install --package-lock-only` leaves the lockfile's `overrides` field empty and target versions unmoved (likely the nested non-workspace sub-projects — `apps/values-auction/relay`, `apps/values-auction/workers/hub` — which carry their own `package-lock.json`). **Don't reach for `overrides` to force a transitive security bump** — it won't work. Fix the *parent* dependency instead (bump the package that pulls the vulnerable transitive in).
- **Dependabot triage — check installed-vs-affected-range, not just severity.** Most "high" alerts here are stale ghosts (manifests for removed apps like `apps/nordic-sqr-rct`) or false-positives (the installed version is already outside the advisory's affected range — e.g. `next@16.2.6` vs an advisory capped at `<15.5.16`). Dismiss ghosts as `not_used`, false-positives as `inaccurate`; only real, lockfile-present, production-reachable vulns warrant a code change. (Full triage: the 2026-05-30 pass took 25 open → 5.)
- **open follow-up — `wrangler` 3→4 (partly done)**: `apps/launch-smoke` + `apps/lines-become-loops` were bumped in #150 — the **root** lockfile now resolves `wrangler@4.95.0` / `miniflare@4` / `undici@7.24.8` / `ws@8.20.1` (all patched). **Still outstanding: the two nested non-workspace sub-projects** `apps/values-auction/relay` + `apps/values-auction/workers/hub`, which carry their own `package-lock.json` (not covered by #150 and the reason root `overrides` don't propagate) and still pin `wrangler@^3` → `miniflare@3` → `undici@5.29.0` + `ws@8.18.0`. `wrangler` is a **devDependency** in both (their `dependencies` are empty `{}`), so this is dev-scope CF deploy tooling — **not production-reachable**; the GitHub "critical/high" labels are intrinsic CVSS, not our exposure. Fix mirrors #150, per sub-project: `npm pkg set devDependencies.wrangler="^4" && npm install --package-lock-only`, then verify with `npx wrangler deploy --dry-run --x-autoconfig false` (wrangler 4's experimental autoconfig trips on the npm workspace otherwise). Commit both `package.json` + regenerated `package-lock.json` together. `postcss` (#67) is bundled inside Next and resolves on a future Next release; `qs`/`tmp` are transitive with no parent fix yet. NB: lockfile regen can't be done from the web sandbox (npm install is firewalled on `googlechromelabs.github.io`) — runs on a local machine.

---

## services in use

Vercel (Pro, $20/mo + capped overage), Neon (Postgres — also used as KV-style store for short-TTL caches like Stripe webhook idempotency, see `apps/creaseworks/migrations/054_stripe_webhook_events.sql`), Stripe (pay-per-tx), Cloudflare R2 (object storage — canonical bucket `creaseworks-evidence` in the garrett CF account `097c92553b268f8360b74f625f6d980a`; public URL `https://pub-60282cf378c248cf9317acfb691f6c99.r2.dev`; the bucket was migrated from the anotheroption CF account on 2026-04-25), Notion (CMS), Anthropic (Claude API), Resend (email), Slack, Google OAuth, GitHub Actions. **No Upstash/Vercel KV in this monorepo** (verified 2026-04-26 by Track C audit — earlier mentions were stale). full audit and env var inventory in `docs/infrastructure-and-costs.md`.

**R2 image patterns** (added 2026-04-25): vault computes `cover_url` from `cover_r2_key` at query time. harbour caches tile images via admin endpoint `POST /harbour/api/admin/sync-tiles` (Bearer `CRON_SECRET`).
