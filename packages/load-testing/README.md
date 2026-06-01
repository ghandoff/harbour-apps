# @windedvertigo/load-testing

Smoke + load test harness for harbour apps. raft-house is the first
consumer; other apps can plug their scenarios into the same primitives.

## What's here

```
src/
  ws-client.mjs           # PartyServer-aware WebSocket client (open, send, waitFor, close)
  fixtures.mjs            # Activity fixtures for all 9 ActivityType values in raft-house
  load.mjs                # Configurable N × M × T load runner + latency stats
  scenarios/
    session-lifecycle.mjs # End-to-end facilitator + 2 participants, every reducer
    activity-matrix.mjs   # 1 room per activity type — round-trip submit + reveal
    http-routes.mjs       # GET + POST smoke for every Next route
    prototypes.mjs        # Static-HTML smoke for the 7 prototype sub-games
bin/
  raft-smoke.mjs          # Runs every scenario; exit code 0/1
  raft-load.mjs           # Configurable load (smoke / moderate / heavy tier)
```

## Running

```bash
# Smoke battery (pennies — runs against live windedvertigo.com)
node packages/load-testing/bin/raft-smoke.mjs

# Same, but include the 35s DO-eviction persistence check
node packages/load-testing/bin/raft-smoke.mjs --persistence

# Targeted: skip prototypes (they need local fs only)
node packages/load-testing/bin/raft-smoke.mjs --skip prototypes

# Custom base URL (e.g. a preview deploy)
node packages/load-testing/bin/raft-smoke.mjs https://wv-harbour-raft-house.windedvertigo.workers.dev/harbour/raft-house

# Load — tier mode
node packages/load-testing/bin/raft-load.mjs --tier smoke       # 2×2×10s
node packages/load-testing/bin/raft-load.mjs --tier moderate --force   # 10×20×5min
node packages/load-testing/bin/raft-load.mjs --tier heavy --force      # 50×100×5min

# Load — custom (seconds)
node packages/load-testing/bin/raft-load.mjs --rooms 5 --participants 3 --duration 30 --force
```

## Cost discipline

The load runner hits the live CF Worker. CLAUDE.md sets a $10 on-demand spending
cap on Vercel; CF Workers bill per request (~$0.30/M on Paid tier). Tiered cost
estimates printed before each run:

| tier     | rooms | participants | duration | est worker reqs | est $    |
|----------|-------|--------------|----------|-----------------|----------|
| smoke    | 2     | 2 each       | 10s      | ~30             | $0.000   |
| moderate | 10    | 20 each      | 5 min    | ~30,000         | $0.009   |
| heavy    | 50    | 100 each     | 5 min    | ~500,000        | $0.150   |

Moderate and heavy require `--force` AND print the estimate before starting.

## What's verified

| What | Where |
|------|-------|
| WS handshake → 101 | http-routes + every scenario |
| Initial state hydration + yourId | session-lifecycle, activity-matrix |
| All 9 activity types round-trip | activity-matrix |
| Facilitator commands (setup, advance, pause, resume, timer-*, reveal, hint, kick, end) | session-lifecycle |
| Participant commands (submit, request-hint, navigate) | session-lifecycle, activity-matrix |
| Targeted vs broadcast hint | session-lifecycle |
| Dropped-socket reconnect | session-lifecycle |
| DO eviction persistence (35s) | session-lifecycle --persistence |
| Auth.js providers wired | http-routes |
| Stripe webhook signature gate (400, not 500) | http-routes |
| Security-header wrapper active | http-routes |
| All 7 prototype sub-games load with expected DOM markers | prototypes |
