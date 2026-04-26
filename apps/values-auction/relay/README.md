# values-auction relay

cloudflare worker + durable object that relays websocket messages between
values-auction clients in the same session, and caches the latest `state`
payload so late joiners can hydrate.

## why

the app's default `BroadcastChannel` transport only syncs same-browser tabs.
when participants join from phones (different devices), they never receive
state updates from the facilitator. this worker is the cross-device transport.

## protocol

clients connect to:

```
wss://<worker>/ws?session=<code>&role=<facilitator|participant|wall>&id=<clientId>
```

all messages are json: `{ type, payload, at, sender }`. the worker:

- broadcasts every message to all peers in the same session (excluding sender).
- caches the most recent `type: 'state'` message in durable object storage.
- when a client sends `type: 'request-state'`, replies directly with the cached
  state (if any) and also forwards the request to peers so an online
  facilitator can respond with a fresher snapshot.

## deploy

```
cd apps/values-auction/relay
npx wrangler deploy
```

set `VITE_WS_URL=wss://wv-values-auction-relay.<account>.workers.dev` and
`VITE_TRANSPORT=socket` in the values-auction environment.
