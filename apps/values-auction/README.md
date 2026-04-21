# values auction

a live, facilitator-driven classroom game for the winded.vertigo / PRME network.
three views (participant, facilitator, wall) of the same session state. scarcity
is real. losses stick.

## requirements

- node 20+
- npm 10+
- a modern evergreen browser (chrome, firefox, safari, edge)

## install

from this app directory:

```bash
npm install
```

from the monorepo root, the workspace install also works:

```bash
npm install --workspace @harbour/values-auction
```

## dev — single machine, multi-tab (default)

```bash
npm run dev
```

three urls:

- facilitator → `http://localhost:5173/#/facilitate?code=DEMO`
- participant → `http://localhost:5173/#/join?code=DEMO` (open 2+ tabs)
- wall        → `http://localhost:5173/#/wall?code=DEMO`

transport is the browser `BroadcastChannel` api, scoped per session code.

## dev — cross-device on lan

terminal 1 (ws hub):

```bash
npm run dev:server
```

terminal 2 (vite):

```bash
VITE_TRANSPORT=socket npm run dev
```

override the server url with `VITE_WS_URL=ws://<lan-host>:8787` if needed.

## test

```bash
npm test          # vitest unit suite
npm run e2e       # playwright smoke across the three views
```

## build

```bash
npm run build
npm run preview
```

## deploy (disconnected vercel)

matches the pattern used by harbour, deep-deck, paper-trail, tidal-pool,
mirror-log, and the other 17 harbour apps — one script per app under
`scripts/`, deployed manually via the vercel cli. disconnected from git
so monorepo pushes don't multiply builds across apps.

**first deploy — one-time project creation:**

```bash
# from monorepo root
cd apps/values-auction
vercel login            # skip if already logged in
vercel link             # pick winded.vertigo team → new project → name "values-auction"
```

vercel writes `apps/values-auction/.vercel/project.json`. open that file,
copy the `projectId` value (starts `prj_...`), and paste it into
`scripts/deploy-values-auction.sh` where it says `REPLACE_ME`.

**every deploy after that:**

```bash
# from monorepo root
./scripts/deploy-values-auction.sh             # production
./scripts/deploy-values-auction.sh --preview   # preview url
```

vercel builds the vite static output locally and uploads it. output is
`dist/` (configured in `vercel.json`). the first production deploy prints
the production url (something like `values-auction-xxxx.vercel.app`).

## serving under `windedvertigo.com/harbour/values-auction/`

the app builds with base path `/harbour/values-auction/` in production
(set via `.env.production` → `VITE_BASE_PATH`). in local dev the base
stays at `/` so `npm run dev` just works.

to wire the public url you add a rewrite in the sibling `ghandoff/windedvertigo`
repo, which owns routing for `windedvertigo.com/harbour/*`. open that repo,
edit `site/next.config.ts`, and add this to the `rewrites()` array:

```ts
{
  source: '/harbour/values-auction/:path*',
  destination: 'https://values-auction.vercel.app/harbour/values-auction/:path*',
},
```

(replace the destination with whatever production url vercel prints on your
first `vercel --prod`.) redeploy the `site` project. `windedvertigo.com/harbour/values-auction/`
is now live.

**important:** hitting the raw vercel url at its root (e.g.
`values-auction-xxxx.vercel.app/`) will 404 — the basePath moves everything
under `/harbour/values-auction/`. always share the `windedvertigo.com/harbour/values-auction/`
url, not the vercel url directly.

**known limit:** the deployed build uses the `broadcastchannel` transport,
which only syncs across tabs on the *same browser*. for cross-device play
(someone on another laptop, someone on their phone) we'd need to host the
`ws` hub from `server/index.ts` — currently not deployed. for solo demos
(opening facilitator + participant + wall tabs on your own mac) the
broadcastchannel path works perfectly.

## environment variables

| variable          | default                | notes                                       |
| ----------------- | ---------------------- | ------------------------------------------- |
| `VITE_TRANSPORT`  | `broadcast`            | `broadcast` or `socket`                     |
| `VITE_WS_URL`     | `ws://localhost:8787`  | only read when `VITE_TRANSPORT=socket`      |
| `PORT` (server)   | `8787`                 | ws hub port                                 |

## session flow

seven acts: arrival · grouping · set the scene · team strategy · auction · reflection · regather.
the facilitator drives act transitions. the auction is authoritative on the
facilitator client, so bids are validated centrally and broadcast as state
snapshots.

## known limits

- phase 1 mvp. no user accounts, no cloud persistence. state lives in the
  facilitator tab + a short-lived localstorage cache.
- the ws hub is a single-process, single-machine hub suitable for lan demos.
  for remote PRME sessions, swap `src/transport/socket.ts` for a supabase
  transport — the rest of the app is unchanged.
- identity card export renders a 1200×630 png via an svg + canvas roundtrip.
  the server-rendered satori path is scaffolded but not wired — html-to-image
  semantics were unnecessary given our static svg layout.
- no deck editor, no startup profile editor, no multi-language.
