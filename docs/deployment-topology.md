# deployment topology — harbour apps

> last updated: 2026-04-19. the **live production routing** for every `/harbour/*` path is defined in the sibling repo `ghandoff/windedvertigo` at `site/next.config.ts` (the `rewrites()` function). edits there are what determine whether an app is served from Vercel or Cloudflare Workers. this doc explains the split, why it exists, and how to deploy each kind.

## tl;dr

the 19 harbour apps are served from **two different runtimes** depending on maturity and traffic:

| runtime | who lives there | why |
|---|---|---|
| **Vercel** (full Next.js function runtime) | **creaseworks**, **vertigo.vault** | already fully developed, real traffic, production tables, active paying users |
| **Cloudflare Workers** (via OpenNext) | **every other harbour app** — paper.trail, deep.deck, depth.chart, raft.house, tidal.pool, mirror.log, and all 11 threshold-concept apps | underdeveloped, low traffic, cost-sensitive. cloudflare's per-request pricing + free tier keeps the long tail cheap. |

`pushing to main → Vercel auto-deploys only` the Vercel-routed apps. **cloudflare deploys do not happen from git push.** they must be triggered manually per app (or via the batch script below).

## why this split exists

we got a $223/month overage on Vercel in early 2026 from the harbour-apps monorepo creating too many build × project combinations. every push rebuilt every connected project. the spending cap in CLAUDE.md ($10 on-demand, $30 max) exists because of that incident.

to keep costs under the cap as we add more harbour apps, we migrated the long tail (everything except creaseworks + vault) off Vercel. those apps are either:

- **underdeveloped** (the 11 threshold-concept apps are still prototypes), or
- **low traffic** (paper.trail, deep.deck, depth.chart, etc. see occasional use)

cloudflare workers are free up to 100k requests/day and bill per request — roughly two orders of magnitude cheaper than paying for always-warm Vercel functions for apps that get a few hundred daily hits.

**what stayed on Vercel and why**: creaseworks has real customers, neon postgres, cron jobs, stripe; vertigo.vault is its sister app with shared auth cookies on `.windedvertigo.com`. the ops cost of porting these to workers + maintaining the auth contract isn't worth it. they will stay on Vercel.

## how the live routing works

every request to `windedvertigo.com/harbour/<app>/*` is proxied by the `windedvertigo-site` Vercel project. its `next.config.ts` has `rewrites()` entries that forward the path to the correct backend:

```ts
// windedvertigo/site/next.config.ts — rewrites()
{ source: "/harbour/creaseworks/:path*",
  destination: "https://creaseworks-ghandoffs-projects.vercel.app/harbour/creaseworks/:path*" }, // Vercel

{ source: "/harbour/paper-trail/:path*",
  destination: "https://wv-harbour-paper-trail.windedvertigo.workers.dev/harbour/paper-trail/:path*" }, // CF worker
```

when you add a new harbour app you must add (or update) the matching rewrite in that sibling repo and redeploy `windedvertigo-site`. **this monorepo's commits don't touch those rewrites — a push here alone won't route traffic to your new app.**

## where each app is routed today

### Vercel-routed (push = auto-deploy)
- creaseworks → `creaseworks-ghandoffs-projects.vercel.app`
- vertigo-vault → `vertigo-vault-ghandoffs-projects.vercel.app`

### Cloudflare-Worker-routed (manual deploy required)
launch pier:
- paper-trail → `wv-harbour-paper-trail.windedvertigo.workers.dev`
- deep-deck → `wv-harbour-deep-deck.windedvertigo.workers.dev`
- depth-chart → `wv-harbour-depth-chart.windedvertigo.workers.dev`
- raft-house → `wv-harbour-raft-house.windedvertigo.workers.dev`
- tidal-pool → `wv-harbour-tidal-pool.windedvertigo.workers.dev`
- mirror-log → `wv-harbour-mirror-log.windedvertigo.workers.dev`

repairs pier (threshold concepts):
- orbit-lab, proof-garden, bias-lens, scale-shift, pattern-weave, market-mind, rhythm-lab, code-weave, time-prism, liminal-pass, emerge-box → `wv-harbour-<app>.windedvertigo.workers.dev`

### Vercel-but-not-routed-through-windedvertigo.com
- harbour (the hub landing page) → `reservoir-tau.vercel.app` — deployed from monorepo root via `scripts/deploy-harbour.sh`
- values-auction → its own Vercel project with Root Directory `apps/values-auction` (Vite SPA). proxied through windedvertigo.com via a rewrite in the sibling `ghandoff/windedvertigo` repo. deploy with `./scripts/deploy-values-auction.sh` after running `cd apps/values-auction && vercel link` once.

## how to deploy

### Vercel apps (creaseworks, vertigo-vault, harbour hub)

auto-deploys on push to `main`. for manual deploys (disconnected projects or quick prod fixes), use the monorepo-root scripts:

```bash
./scripts/deploy-harbour.sh          # harbour hub to production
./scripts/deploy-harbour.sh --preview # preview build
# similar scripts exist under scripts/deploy-<app>.sh for other apps
```

these scripts swap `.vercel/project.json` temporarily so Vercel resolves the correct workspace packages from the monorepo root.

### Cloudflare Worker apps (everything else)

each CF-routed app lives in `apps/<name>/` with:
- `wrangler.jsonc` — worker config
- `open-next.config.ts` — OpenNext adapter config
- `@opennextjs/cloudflare` + `wrangler` in devDependencies

**deploy one app:**

```bash
cd apps/<name>
npx opennextjs-cloudflare build   # compiles .open-next/worker.js
npx opennextjs-cloudflare deploy  # uploads via wrangler
```

**important**: `deploy` alone does NOT rebuild. if your source changed, always run `build` first (or delete `.open-next/` to be safe). OpenNext's caching will silently ship stale code otherwise.

**deploy all 17 CF apps in one go** — the batch script used when shared packages (`packages/tokens`, `packages/auth`) change and every CF app needs rebuilding:

```bash
for app in deep-deck depth-chart raft-house tidal-pool mirror-log paper-trail \
           orbit-lab proof-garden bias-lens scale-shift pattern-weave market-mind \
           rhythm-lab code-weave time-prism liminal-pass emerge-box; do
  (cd apps/$app && \
    npx opennextjs-cloudflare build && \
    npx opennextjs-cloudflare deploy) || echo "FAILED: $app"
done
```

expect ~45-60s per app, ~15 min total for the full sweep.

### when to redeploy which

| change | Vercel apps | CF apps |
|---|---|---|
| app-specific code (`apps/<app>/**`) | auto on push | `cd apps/<app> && npx opennextjs-cloudflare deploy` |
| shared packages (`packages/auth/**`, `packages/tokens/**`) | **all Vercel apps auto-redeploy on push** (can be expensive — every connected project builds) | **every CF app must be redeployed manually** — the batch loop above |
| `windedvertigo-site` rewrites | doesn't apply | doesn't apply — edit the sibling `ghandoff/windedvertigo` repo and redeploy that project |

## migrating a new app to cloudflare

the automated path is `scripts/migrate-to-cloudflare.sh`:

```bash
./scripts/migrate-to-cloudflare.sh <app-name>              # scaffold + build
./scripts/migrate-to-cloudflare.sh <app-name> --deploy     # scaffold + build + deploy
./scripts/migrate-to-cloudflare.sh <app-name> --preview    # scaffold + build + local preview
```

it will:
1. create `wrangler.jsonc` if missing
2. create `open-next.config.ts` if missing
3. install `@opennextjs/cloudflare` + `wrangler`
4. run the OpenNext build
5. optionally deploy or preview

after the first successful deploy, add the rewrite in `windedvertigo/site/next.config.ts` so `windedvertigo.com/harbour/<app>/*` reaches the worker:

```ts
{ source: "/harbour/<app>",
  destination: "https://wv-harbour-<app>.windedvertigo.workers.dev/harbour/<app>" },
{ source: "/harbour/<app>/",
  destination: "https://wv-harbour-<app>.windedvertigo.workers.dev/harbour/<app>" },
{ source: "/harbour/<app>/:path*",
  destination: "https://wv-harbour-<app>.windedvertigo.workers.dev/harbour/<app>/:path*" },
```

then redeploy the site project.

## common gotchas

- **OpenNext caches `.open-next/` aggressively.** if you deploy and the old content still shows up, `rm -rf .open-next` and rebuild. `deploy` without `build` will happily re-upload stale artifacts.
- **shared-package changes need a full CF-app sweep**. a single push to main will redeploy the Vercel apps automatically but will leave every CF app stale until you run the batch loop above.
- **the harbour hub is NOT CF-routed** — it's on Vercel (`reservoir-tau.vercel.app`), deployed via `scripts/deploy-harbour.sh`. don't confuse it with the CF harbour apps.
- **raft-house's Vercel builds have been erroring for 12h+** — this is pre-existing (partykit build issue documented in `docs/infrastructure-and-costs.md`). the Vercel project is effectively dormant; its live home is the Cloudflare worker.
- **wrangler auth**: `npx wrangler whoami` — must show the `ghandoffs` cloudflare account. the account id is pinned in every `wrangler.jsonc` (`097c92553b268f8360b74f625f6d980a`).
- **build failures**: the OpenNext build depends on `next build` working first. if `next build` fails locally (e.g., missing env vars for static generation), the CF deploy will fail too. fix the Next build first.
