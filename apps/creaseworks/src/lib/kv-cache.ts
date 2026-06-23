import { getCloudflareContext } from "@opennextjs/cloudflare";

type KV = {
  get(key: string, type: "json"): Promise<unknown>;
  put(key: string, value: string, opts?: { expirationTtl?: number }): Promise<void>;
  list(opts?: { prefix?: string; limit?: number; cursor?: string }): Promise<{
    keys: { name: string }[];
    list_complete: boolean;
    cursor?: string;
  }>;
  delete(key: string): Promise<void>;
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

/**
 * Deletes all KV entries whose keys start with the given prefix.
 * Used by sync-notion to evict stale Notion-backed content from the cache
 * immediately rather than waiting for TTL expiry.
 */
export async function purgeKVPrefix(prefix: string): Promise<void> {
  let kv: KV | undefined;
  try {
    const { env } = await getCloudflareContext({ async: true });
    kv = (env as { NEXT_INC_CACHE_KV?: KV }).NEXT_INC_CACHE_KV;
  } catch {
    return;
  }
  if (!kv) return;

  let cursor: string | undefined;
  do {
    const result = await kv.list({ prefix, limit: 100, ...(cursor ? { cursor } : {}) });
    await Promise.all(result.keys.map((k) => kv!.delete(k.name)));
    cursor = result.list_complete ? undefined : result.cursor;
  } while (cursor);
}
