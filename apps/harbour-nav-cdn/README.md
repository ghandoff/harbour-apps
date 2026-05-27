# wv-harbour-nav-cdn

Owns the canonical copy of `harbour-nav-widget.js` for every harbour
app and the windedvertigo site. Served from:

- `https://windedvertigo.com/harbour-nav-widget.js`
- `https://www.windedvertigo.com/harbour-nav-widget.js`

Both routes are claimed in [`wrangler.jsonc`](./wrangler.jsonc) at a
more specific path than `wv-site`'s `windedvertigo.com/*` catchall,
so CF route ordering routes this URL here without any consumer-side
change.

## Why a separate worker

The bundle used to live in two places — source in
`packages/auth/harbour-nav-vanilla.tsx`, built artifact copied into
`windedvertigo/site/public/harbour-nav-widget.js`. The two copies
drifted whenever a session rebuilt one but not the other. This
worker eliminates the second copy.

## How to update the widget

```sh
cd apps/harbour-nav-cdn
npm run deploy
```

That single command rebuilds the bundle from
`packages/auth/harbour-nav-vanilla.tsx` (via the existing
`build-vanilla.mjs` script) and ships it to Cloudflare. There is no
"don't forget to copy the file to the other repo" step.

To preview locally before deploying:

```sh
cd apps/harbour-nav-cdn
npm run build      # rebuild bundle into ./public
npx wrangler dev   # local preview at http://localhost:8787/harbour-nav-widget.js
```

To tail production logs:

```sh
cd apps/harbour-nav-cdn
npm run tail
```

## Cache behaviour

- Edge TTL: 5 min (`s-maxage=300`)
- Browser TTL: 5 min, with `stale-while-revalidate=86400` so users
  serving a cached widget keep working for a day while the browser
  asynchronously refreshes
- Re-deploys flush the edge cache automatically

If you need a faster propagation for a hotfix, you can purge the URL
from the CF dashboard or call the API:

```sh
curl -X POST "https://api.cloudflare.com/client/v4/zones/3b70c2ddcf9976faccb01d37ccf2e1ee/purge_cache" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{"files":["https://windedvertigo.com/harbour-nav-widget.js"]}'
```

## Adding a new app to the launch pier

1. Edit `packages/auth/harbour-nav.tsx`:
   - Add the entry to `HARBOUR_APPS` with the right `pier`
   - Add the key to the `HarbourAppKey` union type
2. From this directory: `npm run deploy`
3. In each consumer page, add the script tag (Next.js apps use the
   `HarbourNav` React component instead):
   ```html
   <script
     src="https://windedvertigo.com/harbour-nav-widget.js"
     data-app="<slug>"
     defer
   ></script>
   ```
4. Confirm in production by opening the drawer from any harbour app.

## Source layout

```
apps/harbour-nav-cdn/
├── wrangler.jsonc          # worker config + routes
├── worker.ts               # one-asset handler with cache headers
├── public/
│   └── harbour-nav-widget.js   # built artifact (gitignored if regenerable)
├── package.json            # build + deploy scripts
└── README.md               # this file

packages/auth/
├── harbour-nav.tsx         # React component + app list (source of truth)
├── harbour-nav-vanilla.tsx # vanilla auto-mount entry
└── build-vanilla.mjs       # esbuild bundler (outputs to ../../apps/harbour-nav-cdn/public/)
```
