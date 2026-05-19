# middleware.ts vs proxy.ts — Next.js 16 + OpenNext CF

**Verdict: for all CF Workers-deployed apps in this repo, always use `middleware.ts`. Never use `proxy.ts`.**

This document records the source-code-verified research that produced that rule, so the team stops re-litigating the question each time the stack is upgraded.

---

## Stack at time of research (2026-05-18)

| Package | Resolved version |
|---|---|
| `next` | 16.2.4 |
| `@opennextjs/cloudflare` | 1.19.4 |
| `react` | 19.2.5 |

---

## What changed in Next.js 16

Next.js 16 introduced `proxy.ts` as the **successor** to `middleware.ts`. The two files serve the same routing-interception purpose, but they compile to different runtimes:

| File | Compiled runtime | Manifest populated |
|---|---|---|
| `middleware.ts` | **Edge** | `middleware-manifest.json` → key `middleware["/"]` |
| `proxy.ts` | **Node.js** | `functions-config-manifest.json` → key `functions["/_middleware"]` |

This is not configurable. It is hardcoded in Next.js 16's build pipeline.

---

## Proof: Next.js 16 source code

**File**: `node_modules/next/dist/build/index.js` — line 1515

```js
if (staticInfo.runtime === 'nodejs' || isProxyFile(page)) {
    hasNodeMiddleware = true;
    functionsConfigManifest.functions['/_middleware'] = {
        runtime: 'nodejs',
        matchers: ...
    };
}
```

`isProxyFile(page)` returns true when the page path is `/proxy` or `/src/proxy` — i.e., when the file is `proxy.ts`. This is unconditional: even a no-op `proxy.ts` with a single `export function proxy() {}` will set `runtime: 'nodejs'` in `functions-config-manifest.json`.

**File**: `node_modules/next/dist/build/analysis/get-page-static-info.js` — lines 239–240

```js
const isMiddleware = page === `/${MIDDLEWARE_FILENAME}` || page === `/src/${MIDDLEWARE_FILENAME}`;
const isProxy = page === `/${PROXY_FILENAME}` || page === `/src/${PROXY_FILENAME}`;
```

And at line 576:

> "Proxy always runs on Node.js runtime."

This is also confirmed in Next.js docs: https://nextjs.org/docs/messages/middleware-to-proxy

---

## Proof: OpenNext CF 1.19.4 source code

**File**: `node_modules/@opennextjs/cloudflare/dist/cli/build/utils/middleware.js`

```js
export function useNodeMiddleware(options) {
    const buildOutputDotNextDir = path.join(options.appBuildOutputPath, '.next');

    // Check for edge middleware first
    const middlewareManifest = loadMiddlewareManifest(buildOutputDotNextDir);
    const edgeMiddleware = middlewareManifest.middleware['/'];
    if (edgeMiddleware) {
        return false; // edge middleware: OK
    }

    // Check for node middleware
    const functionsConfigManifest = loadFunctionsConfigManifest(buildOutputDotNextDir);
    return Boolean(functionsConfigManifest?.functions['/_middleware']);
}
```

**File**: `node_modules/@opennextjs/cloudflare/dist/cli/build/build.js`

```js
if (useNodeMiddleware(options)) {
    logger.error('Node.js middleware is not currently supported. Consider switching to Edge Middleware.');
    process.exit(1);
}
```

OpenNext CF reads the two manifest files after `next build` completes. If `functions-config-manifest.json["functions"]["/_middleware"]` exists (only set when `proxy.ts` is present), OpenNext CF **hard-exits with code 1**. There is no workaround — the check is unconditional and runs before bundle generation.

---

## What this means in practice

### `middleware.ts` → Edge runtime → OpenNext CF accepts it
- Next.js builds this as an Edge function
- Populates `middleware-manifest.json` with key `middleware["/"]`
- `useNodeMiddleware()` finds the edge entry → returns `false` → build continues ✅

### `proxy.ts` → Node.js runtime → OpenNext CF rejects it
- Next.js builds this as a Node.js function
- Populates `functions-config-manifest.json` with key `functions["/_middleware"]`
- `useNodeMiddleware()` finds the node entry → returns `true` → `process.exit(1)` ❌

### You cannot have both
Next.js 16 also rejects having both files simultaneously:
```
Both middleware file './src/middleware.ts' and proxy file './src/proxy.ts' are detected.
Please use './src/proxy.ts' only.
```

---

## Why Vercel works with either

Vercel's infrastructure supports both Edge and Node.js runtimes. It can deploy whatever Next.js 16 outputs. OpenNext CF targets Cloudflare Workers, which only support the Edge/V8 isolate model — there is no Node.js process to run a Node.js function. Hence the hard block.

---

## Why `proxy-handler.ts` is named that way

The file `apps/creaseworks/src/proxy-handler.ts` (full route protection: JWT auth, Postgres rate limiting, CSRF) is intentionally **not** named `proxy.ts`. If it were named `proxy.ts`, Next.js 16 would detect it as the middleware entrypoint, force it to Node.js runtime, and OpenNext CF would reject the build.

Naming it `proxy-handler.ts` keeps Next.js unaware of it as a special file. The code is preserved for reference and for future Vercel migrations, but it cannot run at the Edge layer regardless — it uses `getToken()` (which requires Node.js) and `pg` Pool (which requires native WebSockets). Features it provides (rate limiting, CSRF) must live in `worker.ts` at the CF Worker level.

This rename was made in commit `7a53f09` specifically to avoid this trap.

---

## The full decision tree for this repo

```
Need middleware logic?
│
├─ App deploys to Cloudflare Workers (creaseworks, harbour, depth-chart, etc.)
│   └─ Use middleware.ts — must be Edge-compatible (no Node.js APIs)
│       └─ Heavy logic (rate limiting, CSRF, Postgres) → put in worker.ts instead
│
└─ App deploys to Vercel (vertigo-vault, etc.)
    ├─ Need Node.js APIs? → use proxy.ts
    └─ Edge-compatible? → either works; prefer middleware.ts for consistency
```

---

## What this means for the proxy-handler.ts code

The full-featured route protection in `proxy-handler.ts` remains dead code in CF-deployed apps. To restore it:

1. **Only possible on Vercel** — where `proxy.ts` is accepted.
2. **Requires Node.js-compatible runtime** — `getToken()` from Auth.js needs Node.js.
3. **Cannot be wired via `proxy.ts` on CF apps** — would cause `process.exit(1)` at build time.

If creaseworks ever moves back to Vercel, restore with:
```ts
// apps/creaseworks/src/proxy.ts
export { proxy, config } from './proxy-handler';
```
Note: the `config` re-export causes a Turbopack lint warning ("re-exported config field"), but webpack mode accepts it.

---

## Upgrade stability

This constraint is stable across the Next.js 16.x range. The `PROXY_FILENAME = 'proxy'` constant and the `isProxyFile()` check are part of Next.js 16's architecture, not a temporary implementation detail. OpenNext CF's hard block on Node.js middleware is equally deliberate — CF Workers have no Node.js runtime to run such functions in.

The rule will need re-evaluation only if:
- OpenNext CF adds Node.js compatibility layer (currently explicitly not planned)
- Next.js changes how it determines proxy runtime (would require a major version)
- CF Workers gains a Node.js compat mode that satisfies OpenNext's check

Check this document before any future stack upgrade that touches `next`, `@opennextjs/cloudflare`, or the middleware/proxy file.

---

*Research date: 2026-05-18. Sources: Next.js 16.2.4 and @opennextjs/cloudflare 1.19.4 node_modules source.*
