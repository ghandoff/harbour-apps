# Raft House — PartyServer migration + game-dev handoff

> Handoff prompt for a fresh (Opus) conversation. Two-part mission: **(1)** migrate
> raft-house's real-time layer off the standalone PartyKit CLI onto PartyServer +
> Durable Objects on its own Cloudflare Worker, audit + smoke-test it solid; **(2)**
> only then, use that session to develop the Raft House game and its sub-games.
>
> Authored 2026-05-30 after investigating the migration in a prior session. The key
> non-obvious finding is front-loaded: it's **not a drop-in** — the WebSocket can't
> traverse the wv-site Next proxy, so it needs **direct CF Workers routes** (the
> depth-chart/harbour auth-bypass pattern). Paste this whole block into the new
> conversation, or point the session at this file.

---

```
You're working in ~/Projects/harbour-apps (ghandoff/harbour-apps), app: apps/raft-house.
Two-part mission, STRICTLY in order:
  PART 1 — migrate raft-house's real-time layer from the standalone PartyKit CLI to
           PartyServer + Durable Objects on its own Cloudflare Worker, and get it
           AUDITED + SMOKE-TESTED solid.
  PART 2 — only once Part 1 is verified solid, become the working session for further
           development of the Raft House game and its sub-games.

READ FIRST: apps/raft-house/CLAUDE.md is governed by the repo-root CLAUDE.md — read it
(deployment topology, OpenNext-on-CF worker.ts rules, basePath behavior, git workflow,
cost discipline). Also docs/deployment-topology.md and docs/security/cf-headers-wrapper.md.

═══════════════════════════════════════════════════════════════════════
PART 1 — THE MIGRATION
═══════════════════════════════════════════════════════════════════════
WHY: PartyKit was acquired by Cloudflare (2025); the forward path is Durable Objects /
PartyServer, not the standalone `partykit` CLI. Today raft-house deploys its real-time
layer SEPARATELY to *.partykit.dev via `partykit deploy`, and the `partykit` devDep drags
in miniflare@3 → undici@5.29.0 (Dependabot #5, already dismissed as tolerable_risk pending
this migration). Migrating consolidates raft-house onto ONE Cloudflare deploy.

⚠️ THE CRITICAL CONSTRAINT — this is NOT a drop-in, and skipping this breaks production:
raft-house's wrangler.jsonc has NO `routes` — it's served at /harbour/raft-house/* through
the wv-site Next.js proxy. WebSocket upgrades do NOT reliably traverse Next rewrites. The
current setup works ONLY because the client connects DIRECT to *.partykit.dev, bypassing
the proxy entirely. So a same-origin WS to /harbour/raft-house/parties/* will NOT reach the
worker through the proxy. THE FIX: add DIRECT CF Workers routes for the parties path
(exactly the depth-chart / harbour auth-subtree bypass pattern) so the WS hits
wv-harbour-raft-house directly, bypassing the site proxy.

CURRENT IMPLEMENTATION (read all of these fully before changing anything):
- apps/raft-house/party/room.ts — PartyKit `RoomServer` (default export; constructor(room:
  Party); onStart / onConnect(conn) / onMessage(message, sender) / onClose(conn);
  this.room.storage, this.room.broadcast(string), this.room.getConnections(); conn.uri /
  .id / .send / .close; instance field `facilitatorConn`). NOTE: timers are STATE objects
  ({startedAt, durationMs, pausedAt}) interpreted client-side — there are NO server-side
  alarms to port.
- apps/raft-house/lib/use-party.ts — client hook; raw `WebSocket` (NOT partysocket) to
  `wss://${NEXT_PUBLIC_PARTYKIT_HOST}/party/${roomCode}?role=&name=&participantRole=`, with
  manual reconnect/backoff + a message queue. Consumers: app/facilitate/live/[code]/page.tsx
  and app/play/[code]/page.tsx.
- apps/raft-house/lib/types.ts — RoomState / ClientMessage / FacilitatorMessage /
  ParticipantMessage / ServerBroadcast / Participant / Activity types, shared by server +
  client. KEEP these and the wire protocol identical.
- apps/raft-house/partykit.json — { name, main: party/room.ts, compatibilityDate }.
- apps/raft-house/worker.ts — OpenNext wrapper (mirrors apps/depth-chart/worker.ts): imports
  openNextHandler + DOQueueHandler/DOShardedTagCache/BucketCachePurge from ./.open-next/
  worker.js, re-exports them, default = wrapWithSecurityHeaders(handler, { csp:
  HARBOUR_DEFAULT_CSP, skipPaths: [/^\/cdn-cgi\//] }).
- apps/raft-house/wrangler.jsonc — name wv-harbour-raft-house, main worker.ts, ASSETS
  binding, WORKER_SELF_REFERENCE service. NO routes, NO durable_objects yet.
- apps/raft-house/next.config.ts — CSP connect-src (line ~33) includes
  `wss://*.partykit.dev wss://*.partykit.io`.

MIGRATION STEPS:
1. Add `partyserver`. Port RoomServer → `class RaftRoom extends Server<Env>`:
   - onStart → onStart, using this.ctx.storage (DO storage) instead of this.room.storage.
   - onConnect(conn, ctx) → read role/name/participantRole from ctx.request.url query params
     (PartyServer connections have no `.uri`).
   - onMessage(conn, msg) → ⚠️ PartyServer REVERSES the arg order vs PartyKit (connection
     first, message second). Adjust accordingly.
   - onClose(conn) → same.
   - this.room.broadcast/getConnections → this.broadcast/this.getConnections; this.name is
     the room id (was room.id).
   - ⚠️ Do NOT rely on the `facilitatorConn` instance field — PartyServer hibernates by
     default, so instance fields are lost across eviction. Look the facilitator connection
     up via this.getConnections() filtered by state.facilitatorId when forwarding hints.
   - Keep ALL RoomState reducer logic byte-for-byte identical.
2. worker.ts: import routePartykitRequest from partyserver. In the fetch path, BEFORE the
   OpenNext handler: `const res = await routePartykitRequest(request, env); if (res) return
   res;` (so /parties/* upgrades hit the DO; everything else falls through to Next + the
   security wrapper). EXPORT the RaftRoom class from worker.ts (wrangler binds DOs by
   exported class name — same rule as DOQueueHandler; missing export = deploy fails).
3. wrangler.jsonc:
   - durable_objects: [{ name: "RaftRoom", class_name: "RaftRoom" }]
   - migrations: [{ tag: "v1", new_sqlite_classes: ["RaftRoom"] }]  (PartyServer = SQLite DOs)
   - routes: direct CF routes for `windedvertigo.com/harbour/raft-house/parties/*` and the
     www variant (zone windedvertigo.com), plus `workers_dev: true`. Mirror the direct-routes
     block in apps/harbour/wrangler.jsonc (used there for /harbour/api/auth).
4. use-party.ts: connect to same-origin `wss://<host>/harbour/raft-house/parties/<server>/
   <roomCode>?...` — CONFIRM the exact prefix/path routePartykitRequest expects against the
   partyserver docs (it may need the basePath handled). Retire NEXT_PUBLIC_PARTYKIT_HOST.
   You MAY swap the raw WebSocket for PartyServer's PartySocket client (handles reconnect),
   but keep the message protocol identical.
5. next.config.ts CSP: replace `wss://*.partykit.dev wss://*.partykit.io` with same-origin
   `wss:` (and remove the dead `https://vitals.vercel-insights.com` while you're in there —
   it's a Vercel-era artifact).
6. Remove `partykit` devDep + partykit.json. `grep -rn partysocket apps/raft-house` — if
   unused, remove it. `npm install` from repo ROOT; confirm `npm why undici` no longer shows
   the partykit→miniflare@3 path (5.29.0 gone). NB: npm `overrides` do NOT apply in this repo
   (see CLAUDE.md) — fix via the direct dep, not overrides.

AUDIT + SMOKE TEST (Garrett requires this be SOLID before ANY Part 2 work — do not skip):
- `cd apps/raft-house && npx opennextjs-cloudflare build` compiles clean.
- CF deploy is manual + Garrett-gated. When he deploys: the direct routes register on deploy
  and must WIN over wv-site's /* catchall — confirm precedence (CF specific routes beat the
  catchall; CLAUDE.md documents this for harbour-nav).
- Live smoke test of a real room: facilitator opens /facilitate/live/[code]; ≥2 participants
  join via /play/[code]; verify state syncs across: join/leave, setup, advance/goto, timer
  start/pause/resume/clear, reveal-results, send-hint (broadcast + targeted), request-hint
  (participant→facilitator), kick, end-session; dropped-socket reconnect resumes; room state
  survives a DO eviction (storage persistence). In the Network tab confirm the WS is
  `wss://windedvertigo.com/...` returning 101 Switching Protocols — this is the make-or-break
  for the routing fix.
- Only AFTER it's verified solid: retire the old `partykit deploy` / partykit.dev host.
- ONE PR for the migration. Do NOT deploy production without Garrett's explicit go-ahead.
- If PartyServer routing can't cleanly bridge the basePath /harbour/raft-house + the parties
  prefix through the direct CF route, STOP and report options rather than ship a broken WS.

═══════════════════════════════════════════════════════════════════════
PART 2 — FURTHER RAFT HOUSE DEVELOPMENT (only after Part 1 is audited + solid)
═══════════════════════════════════════════════════════════════════════
Raft House is a facilitator-led group-learning game (tagline "group learning"; repairs pier;
currently comingSoon). Structure: app/facilitate/live/[code] (facilitator console),
app/play/[code] (participant view), app/join, app/checkout (Stripe), app/api/*; plus
components/activities, lib/games, and prototypes/* (7 prototype sub-games: archipelago,
bubble-cluster, card-deal, combined, design-audit, serendipity, treasure-map). A session runs
a sequence of "activities," each with a "mechanic" (mechanic.tempo drives an auto-timer).
Garrett wants to revisit and develop the game and its sub-games.
DO NOT start building Part 2 immediately. First MAP the current game model (lib/types.ts
Activity/mechanic, lib/games, components/activities, and the prototypes/) and present an
inventory + a proposed development plan, and confirm direction with Garrett before coding.
Keep Part 2 PRs separate from the migration PR.

CONSTRAINTS (repo-wide): rebase before push; branch naming feat/*|fix/*|chore/*; OpenNext-CF
worker.ts DO re-export rule; middleware.ts not proxy.ts; basePath /harbour/raft-house is
auto-prepended by Link/router/redirect (never hardcode it); manual CF deploy, Garrett-gated;
cost discipline (no new Vercel project, no new SaaS). raft-house uses Neon + Auth.js + Stripe
+ Notion like its sibling apps.
```

---

## Related Cloudflare-migration cleanup (separate, small)

Not part of this migration, but the same Vercel→CF artifact family — captured here so it
isn't lost: **remove dead `@vercel/analytics`** from the ~10 harbour apps still shipping it
(bias-lens, code-weave, emerge-box, liminal-pass, harbour, paper-trail, market-mind,
orbit-lab, mirror-log, rhythm-lab) — it doesn't report from CF Workers. Per app: drop the
`<Analytics/>` import + component, the dep, and the `https://vitals.vercel-insights.com` CSP
entry. The real replacement is Cloudflare Workers Analytics Engine (see
`docs/harbour-analytics-and-superuser-views.md`). One PR; redeploy is non-urgent (dead code).
</content>
