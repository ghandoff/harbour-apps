# values auction

a live, facilitator-driven classroom game for the winded.vertigo / PRME network. 35 minutes, 15–60 participants, 4–12 teams. this is the phase 1 mvp: a runnable vite + lit app with three views, real-time sync across tabs and lan, and full act-by-act flow.

## requirements

- node 20+
- a modern browser (chromium, firefox, or safari) with `BroadcastChannel` support

## install

```bash
npm install
```

## run

### default — broadcastchannel transport (single machine, multi-tab)

```bash
npm run dev
# then open:
#   http://localhost:5173/#/facilitate?code=DEMO
#   http://localhost:5173/#/join?code=DEMO
#   http://localhost:5173/#/wall?code=DEMO
```

open the facilitator first; it's authoritative. then open participants and the wall in other tabs.

### cross-device — ws transport

```bash
npm run dev:server              # terminal 1 (ws on :8787)
VITE_TRANSPORT=socket npm run dev  # terminal 2
```

devices on the same lan can now point at your machine's ip to join the session.

## test

```bash
npm test            # vitest: reducers, store, transport
npm run e2e         # playwright smoke: facilitator + participant round trip
```

## build

```bash
npm run build && npm run preview
```

## environment variables

- `VITE_TRANSPORT` — `broadcast` (default) or `socket`
- `VITE_WS_URL` — override the ws url (default: `ws://<hostname>:8787`)
- `WS_PORT` — port the `dev:server` ws listens on (default: 8787)

## how it works

three views of the same session state, all reachable via hash routes:

- `#/join?code=XYZ` — the participant phone/laptop view
- `#/facilitate?code=XYZ` — the host's dashboard (authoritative)
- `#/wall?code=XYZ` — the projector view

the facilitator client owns state. participants dispatch *intents* (e.g., "place bid"), the facilitator validates and broadcasts the resulting state. swap the transport to supabase or similar in phase 2 without touching reducers.

## known limits

- single session; no user auth, no persistence beyond the current browser session
- no mobile voice rooms, no LMS integration, english only
- sound is muted (no audio files shipped; drop `public/sfx/gavel.mp3` to wire it up later)
- ws server stores only an in-memory snapshot + a local `events.log` (jsonl); a fresh restart loses state
- identity card download falls back to `html-to-image` in-browser since there's no `/api/identity-card` endpoint in the mvp
- no production deployment here — disconnected from vercel on purpose

## file map

```
src/
├── main.ts            # boots the correct view based on route
├── router.ts
├── views/             # participant, facilitator, wall
├── components/        # lit primitives + session-specific
├── content/           # startups, values, copy, acts (verbatim)
├── state/             # types, reducers, store, selectors
├── transport/         # transport interface + broadcast + socket impls
├── utils/             # timer, id, a11y helpers
├── design/            # tokens, reset, base, motion css
└── identity-card/     # satori template + download pipeline
server/                # ws hub for cross-device sync
tests/                 # vitest specs + playwright smoke
```

## next steps

see `DECISIONS.md` for the open questions and trade-offs baked into the mvp.
