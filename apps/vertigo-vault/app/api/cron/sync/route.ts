import { NextResponse } from "next/server";
import { syncVaultActivities } from "@/lib/sync/vault-activities";
import {
  getImageFailureCount,
  resetImageFailureCount,
} from "@/lib/sync/sync-image";

/**
 * POST /api/cron/sync
 *
 * Daily at 06:00 UTC. Invoked by the CF Workers scheduled() handler in
 * worker.ts (cron trigger declared in wrangler.jsonc → triggers.crons).
 * Also reachable directly via curl with a valid CRON_SECRET bearer for
 * manual runs.
 *
 * CF Workers have a 30s CPU budget per request — see the round cap in
 * lib/notion.ts queryAllPages. If the sync grows past that, split into
 * chunks or move to a Durable Object queue.
 */
export async function POST(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error("[cron/sync] CRON_SECRET is not set — rejecting request");
    return NextResponse.json({ error: "not configured" }, { status: 500 });
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  }

  try {
    const t0 = Date.now();
    resetImageFailureCount();
    const count = await syncVaultActivities();
    const imageFailures = getImageFailureCount();
    const elapsed = ((Date.now() - t0) / 1000).toFixed(1);

    if (imageFailures > 0) {
      console.warn(
        `[cron/sync] vault sync complete: ${count} activities in ${elapsed}s, ${imageFailures} image failures`,
      );
    } else {
      console.log(`[cron/sync] vault sync complete: ${count} activities in ${elapsed}s`);
    }
    return NextResponse.json({
      ok: true,
      count,
      elapsedSeconds: elapsed,
      imageFailures,
    });
  } catch (err: any) {
    console.error("[cron/sync] vault sync failed:", err);
    return NextResponse.json(
      { ok: false, error: err.message ?? "unknown error" },
      { status: 500 },
    );
  }
}

/**
 * Vercel cron invokes GET by default — redirect to POST handler.
 */
export async function GET(request: Request) {
  return POST(request);
}
