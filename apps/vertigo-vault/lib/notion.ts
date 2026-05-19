import { Client } from "@notionhq/client";
import type { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";

/**
 * Notion client + v5 data-source adapter for vertigo-vault.
 *
 * v5 migration notes:
 *  - `@notionhq/client` v5 uses `fetch` (CF-Workers-compatible) instead
 *    of `node:https.request` (which CF Workers don't polyfill, even with
 *    nodejs_compat).
 *  - The v2 `notion.databases.query()` API was replaced by
 *    `notion.dataSources.query()`. v5 splits the old "database" concept
 *    into databases (metadata) + data sources (queryable rows). We
 *    resolve a database's first data_source_id once and cache it, so
 *    call sites read the same as before.
 *
 * Mirrors the inline adapter in apps/harbour/lib/notion.ts. We don't
 * route through `@windedvertigo/notion-adapter` because that package
 * still ships only the v2 implementation (the rest of the monorepo
 * stays on v2).
 */

let _notion: Client | null = null;

function getNotion(): Client {
  if (!_notion) {
    if (!process.env.NOTION_TOKEN) {
      throw new Error("NOTION_TOKEN environment variable is required");
    }
    _notion = new Client({ auth: process.env.NOTION_TOKEN });
  }
  return _notion;
}

export { getNotion as notion };

/** Vault only needs the single vault database ID. */
export const NOTION_DBS = {
  vault: process.env.NOTION_DB_VAULT ?? "",
} as const;

// Notion rate limit: 3 req/s. We use 350ms delay for safety.
export const RATE_LIMIT_DELAY_MS = 350;

export async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── v5 data-source adapter ────────────────────────────────
// Cache data_source_id per legacy database ID. The retrieve() call costs
// one request; doing it on every paginated query would blow the rate
// budget on large databases.
const dataSourceCache = new Map<string, string>();

async function getDataSourceId(databaseId: string): Promise<string> {
  const cached = dataSourceCache.get(databaseId);
  if (cached) return cached;
  const client = getNotion();
  const db = await client.databases.retrieve({ database_id: databaseId });
  if (!("data_sources" in db) || db.data_sources.length === 0) {
    throw new Error(`no data sources found for database ${databaseId}`);
  }
  const id = db.data_sources[0].id;
  dataSourceCache.set(databaseId, id);
  return id;
}

/**
 * Paginate through all results of a Notion database query.
 *
 * Caps pagination at 50 rounds (5000 rows) to bound worst-case latency
 * under the CF Workers CPU budget — see app/api/cron/sync/route.ts.
 */
export async function queryAllPages(
  databaseId: string,
): Promise<PageObjectResponse[]> {
  const client = getNotion();
  const data_source_id = await getDataSourceId(databaseId);
  const pages: PageObjectResponse[] = [];
  let cursor: string | undefined = undefined;
  let rounds = 0;

  do {
    await delay(RATE_LIMIT_DELAY_MS);
    const response = await client.dataSources.query({
      data_source_id,
      page_size: 100,
      ...(cursor !== undefined ? { start_cursor: cursor } : {}),
    });

    for (const page of response.results) {
      if ("properties" in page) pages.push(page as PageObjectResponse);
    }

    cursor = response.has_more ? (response.next_cursor ?? undefined) : undefined;
    rounds++;
  } while (cursor && rounds < 50);

  return pages;
}
