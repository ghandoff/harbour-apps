/**
 * Resolve the Stripe DLQ KV store at request time.
 *
 * On the eventual CF Workers runtime: returns the KV namespace bound as
 * STRIPE_DLQ in wrangler.jsonc, fetched via @opennextjs/cloudflare's
 * runtime helper.
 *
 * On Vercel today (current production): returns null. With a null
 * store, withDLQ degrades to a passthrough (no dedup, no DLQ
 * persistence) so observable Vercel behaviour is unchanged ahead of the
 * cutover.
 *
 * SYNC, not async, because withDLQ's getStore option is invoked
 * synchronously inside the wrapped handler to avoid an extra microtask
 * on every request. We use require() (wrapped in try/catch) so the
 * lookup fails gracefully when @opennextjs/cloudflare isn't installed
 * (the package is a CF-only devDependency added at cutover time).
 */

import type { DLQStore } from "@/lib/webhook-dlq";

export function resolveStripeDLQStore(): DLQStore | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require("@opennextjs/cloudflare") as {
      getCloudflareContext?: () => { env?: Record<string, unknown> };
    };
    const ctx = mod.getCloudflareContext?.();
    const store = ctx?.env?.STRIPE_DLQ;
    if (store && typeof (store as DLQStore).get === "function") {
      return store as DLQStore;
    }
    return null;
  } catch {
    return null;
  }
}
