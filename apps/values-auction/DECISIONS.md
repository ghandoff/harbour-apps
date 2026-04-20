# decisions

one-line-per-decision log of non-obvious calls made while building the phase 1 mvp.

## architecture

- placed the app at `apps/values-auction/` inside the `harbour-apps` monorepo to pick up `npm workspaces`, but left it disconnected from vercel and turbo (no `turbo.json` entry) to avoid the per-project build-multiplication cost flagged in root `CLAUDE.md`.
- used vite + lit + vanilla css exactly as the brief specified. no frameworks added.
- kept the reactive store homegrown (≤100 loc, as specified). no redux, zustand, or pinia.
- authority model: the facilitator client is authoritative. participants send action *intents*; facilitator reduces and re-broadcasts `state`. this matches the brief's §9 and makes a future supabase transport a drop-in swap.

## transport

- `BroadcastTransport` (default) uses the native `BroadcastChannel` per session id — zero infra, works across tabs on the same machine.
- `SocketTransport` connects to a local `ws` server (`server/index.ts`) that caches the last `state` payload so late joiners (participants, walls) get a snapshot when they connect.
- both implement the same `Transport` interface and pass the same contract test in `tests/transport.spec.ts`.
- late-joiner hack: non-authoritative clients send a no-op `action` message on connect so the facilitator can re-broadcast state. cheaper than adding a `requestState` message type for the mvp.

## grouping algorithm

- the brief left the exact team-assignment rule open (see maria's note).
- mvp behaviour: team count = `clamp(ceil(n/4), 1, 8)` (target 4 people per team, max 8 teams = 8 startup profiles). participants are ordered by archetype (rebel → diplomat → builder → steward → undeclared) then round-robined into buckets. each bucket gets the next startup in the `STARTUPS` list. deterministic; no randomness.
- result: every team gets a mix of archetypes rather than clumping rebels together. this is deliberate — the pedagogy rewards intra-team strategic tension, and you get that by spreading the rebels across teams.
- if a session has more than 32 participants the last team gets 5+ members. flagged as a known edge case; facilitator can override via the broadcast + override tools.

## auction rules (implicit in the reducer)

- minimum bid increment: 1 credo. the brief said "bids below current high + 1" must be rejected; we implement exactly that.
- teams cannot bid more than their remaining credos. the reducer drops over-budget bids silently and emits no event — the participant ui shows the bid button as disabled as a primary guard.
- when an auction ends with no bids, the value is removed from the deck but no team is awarded. this keeps scarcity real (a skipped value is gone forever for this session).

## motion + brand

- redwood `#b15043` is reserved for urgency states only (auction countdown <10s, live bid banner, urgent buttons). every other interactive surface uses cadet blue.
- used `--ease-spring` cubic-bezier for bid-button press, lock-in, and tile selection. all other transitions use `--ease-out-quart` / `--ease-in-out`.
- body copy is entirely lowercase per the brand rule; proper nouns (team names, startup names, value card names, "Inter") keep their original case.

## accessibility

- every interactive element is keyboard-reachable; value cards on the strategy board support mouse drag *and* focus-then-press-m/n/w.
- the countdown component announces at 10, 5, 3, 2, 1 seconds via a polite aria-live region (matches §10).
- bid and lock-in events route through `assertive` aria-live so they're interrupting but not duplicated.
- redwood on white fails 4.5:1 at 14px so urgent text stays at 16px+ and/or white-on-redwood.
- `prefers-reduced-motion` swaps animation-duration to 0 and keeps only the `--dur-fast` cross-fades.

## identity card export

- server path (`POST /api/identity-card` → satori → resvg) is stubbed in `src/identity-card/render.ts` but no `/api/identity-card` endpoint runs in the mvp ws server — it's scoped for phase 2.
- client-side fallback uses `html-to-image` to snapshot the rendered DOM card. not pixel-perfect to a 1200×630 canvas, but serves the demo.

## tests

- unit coverage focuses on the reducer (every action + invariants like "credos never go negative", "deck shrinks on lock-in") and the transport contract.
- playwright e2e is a single smoke path: facilitator creates session, participant joins, archetype chosen, facilitator auto-assigns + advances to auction, participant sees a bid button. cap at ~5 seconds of real time; does not run the full 35-minute clock.

## things left deliberately stubbed

- no sound wiring yet (awaiting maria's gavel/tick files, per her note).
- no spanish copy (english only, strings externalised in `content/copy.ts` so spanish can layer in without touching components).
- no hosted deployment; staying disconnected from vercel is intentional (see §infrastructure in root CLAUDE.md — each new vercel project adds a build per push across the monorepo).
- the 8 startup logos are the brief's simple placeholders. if maria drops real marks into `public/logos/*.svg` the components pick them up by filename.

## open question for maria

- grouping algorithm: do you want "pick the archetype that feels *least* like you" to drive a deliberate mismatch (e.g., rebels paired with diplomats)? currently the MVP just round-robins for balance. happy to lock in a pairing rule before the next build.
