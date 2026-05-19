/**
 * POST /api/cron/snapshot-notion
 *
 * Take a JSON snapshot of the harbour-games Notion database and write
 * it to R2 at `harbour-snapshots/YYYY-MM-DD.json`. Provides a single
 * point-in-time recovery file if Notion rows get deleted or corrupted.
 *
 * Auth: Bearer CRON_SECRET — same gate as /api/admin/sync-tiles.
 *
 * Triggered by:
 *   - The Worker's `scheduled` handler (cron-trigger in wrangler.jsonc)
 *   - Or manually:
 *       curl -X POST https://wv-harbour-harbour.windedvertigo.workers.dev/harbour/api/cron/snapshot-notion \
 *         -H "Authorization: Bearer $CRON_SECRET"
 *
 * Stores under the existing TILE_IMAGES R2 binding (creaseworks-evidence
 * bucket) with a `harbour-snapshots/` prefix — no new infra needed.
 */

import { NextRequest, NextResponse } from "next/server";
import { Client } from "@notionhq/client";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const NOTION_DB_HARBOUR_GAMES = "8e3f3364b2654640a91ed0f38b091a07";
const KEY_PREFIX = "harbour-snapshots";

function verifyAuth(req: NextRequest): boolean {
  const header = req.headers.get("authorization");
  if (!header) return false;
  return header.replace(/^Bearer\s+/, "") === process.env.CRON_SECRET;
}

async function getDataSourceId(notion: Client): Promise<string> {
  const db = await notion.databases.retrieve({
    database_id: NOTION_DB_HARBOUR_GAMES,
  });
  if (!("data_sources" in db) || db.data_sources.length === 0) {
    throw new Error("no data sources on harbour-games DB");
  }
  return db.data_sources[0].id;
}

export async function POST(req: NextRequest) {
  if (!verifyAuth(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const token = process.env.NOTION_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "NOTION_TOKEN not set" }, { status: 500 });
  }

  const ctx = getCloudflareContext();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bucket = (ctx.env as any).TILE_IMAGES;
  if (!bucket) {
    return NextResponse.json(
      { error: "TILE_IMAGES R2 binding not available" },
      { status: 500 },
    );
  }

  const notion = new Client({ auth: token });

  // Paginate every row.
  const pages: unknown[] = [];
  try {
    const dataSourceId = await getDataSourceId(notion);
    let startCursor: string | undefined;
    do {
      const response = await notion.dataSources.query({
        data_source_id: dataSourceId,
        page_size: 100,
        ...(startCursor ? { start_cursor: startCursor } : {}),
      });
      for (const page of response.results) pages.push(page);
      startCursor = response.has_more
        ? (response.next_cursor ?? undefined)
        : undefined;
    } while (startCursor);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[snapshot-notion] notion fetch failed:", err);
    return NextResponse.json(
      { error: "notion fetch failed", detail: msg },
      { status: 502 },
    );
  }

  const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const key = `${KEY_PREFIX}/${date}.json`;
  const body = JSON.stringify(
    {
      takenAt: new Date().toISOString(),
      databaseId: NOTION_DB_HARBOUR_GAMES,
      rowCount: pages.length,
      rows: pages,
    },
    null,
    2,
  );

  try {
    await bucket.put(key, body, {
      httpMetadata: { contentType: "application/json" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[snapshot-notion] R2 put failed:", err);
    return NextResponse.json(
      { error: "r2 write failed", detail: msg, key },
      { status: 502 },
    );
  }

  return NextResponse.json({
    ok: true,
    key,
    rowCount: pages.length,
    bytes: body.length,
  });
}
