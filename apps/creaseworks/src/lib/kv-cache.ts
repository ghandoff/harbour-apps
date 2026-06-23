import { getCloudflareContext } from "@opennextjs/cloudflare";

type KV = {
  get(key: string, type: "json"): Promise<unknown>;
  put(key: string, value: string, opts?: { expirationTtl?: number }): Promise<void>;
};

/**
 * Wraps a Neon DB query with CF KV caching.
 *
 * Keys are namespaced under "cw:data:" to avoid collisions with the
 * OpenNext ISR entries that OpenNext itself writes into NEXT_INC_CACHE_KV.
 *
 * KV errors (including getCloudflareContext unavailability in local dev)
 * are swallowed — the DB query always runs as fallback.
 */
export async function withKVCache<T>(
  key: string,
  ttlSeconds: number,
  fn: () => Promise<T>,
): Promise<T> {
  const cacheKey = `cw:data:${key}`;
  let kv: KV | undefined;

  try {
    const { env } = await getCloudflareContext({ async: true });
    kv = (env as { NEXT_INC_CACHE_KV?: KV }).NEXT_INC_CACHE_KV;
    if (kv) {
      const cached = await kv.get(cacheKey, "json");
      if (cached !== null) return cached as T;
    }
  } catch {
    // CF context unavailable (local dev) or KV read failed — fall through
  }

  const result = await fn();

  if (kv) {
    try {
      await kv.put(cacheKey, JSON.stringify(result), { expirationTtl: ttlSeconds });
    } catch {
      // ignore write failures — result already fetched
    }
  }

  return result;
}
