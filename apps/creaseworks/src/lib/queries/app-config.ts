import { sql } from "@/lib/db";
import { withKVCache } from "@/lib/kv-cache";

export interface ConfigItem {
  name: string;
  key: string | null;
  group: string | null;
  sortOrder: number;
  metadata: string | null;
}

/**
 * Fetch all config items for a given group.
 *
 * The `metadata` field stores a JSON string for structured data
 * (e.g. `{ "label": "just play", "emoji": "🎈", "sub": "..." }`).
 * Consumers parse it as needed.
 *
 * Cached for 5 minutes via Next.js data cache.
 */
export async function getConfigGroup(group: string): Promise<ConfigItem[]> {
  return withKVCache(`app-config:${group}`, 300, async () => {
    const result = await sql`
      SELECT name, key, grp, sort_order, metadata
      FROM app_config_cache
      WHERE grp = ${group}
      ORDER BY sort_order ASC
    `;
    return result.rows.map((row) => ({
      name: row.name,
      key: row.key,
      group: row.grp,
      sortOrder: row.sort_order ?? 0,
      metadata: row.metadata,
    }));
  });
}

/**
 * Parse the metadata JSON string from a config item.
 * Returns an empty object on parse failure.
 */
export function parseMetadata<T = Record<string, unknown>>(
  item: ConfigItem,
): T {
  if (!item.metadata) return {} as T;
  try {
    return JSON.parse(item.metadata) as T;
  } catch {
    return {} as T;
  }
}
