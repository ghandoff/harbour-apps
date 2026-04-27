/**
 * POST /api/admin/replay-webhook
 *
 * Manual replay of a Stripe event that landed in the DLQ. Useful when
 * an event exhausted Stripe's auto-retry window (~3 days) and the root
 * cause has since been fixed.
 *
 * Auth: Bearer CRON_SECRET (same secret used by /api/cron/sync, kept
 * narrow to operator workflows).
 *
 * Body:
 *   { "event_id": "evt_..." }
 *
 * Behaviour:
 *   1. Look up the DLQ entry by event id.
 *   2. Reconstruct a Request matching the original webhook (same body,
 *      same `stripe-signature` header) and dispatch it to the real
 *      webhook route handler.
 *   3. Return whatever the inner handler returns, plus a header
 *      indicating this was a replay.
 *
 * On CF Workers, the KV binding is read from getCloudflareContext().env.
 * On Vercel (current production), this route is effectively a no-op
 * because there is no KV binding — it returns 503 with a clear message.
 */

import { NextResponse } from "next/server";
import { handleStripeWebhook } from "@/lib/stripe/webhook-handler";
import { readDLQEntry } from "@/lib/webhook-dlq";
import { resolveStripeDLQStore } from "@/lib/stripe/dlq-store";

export async function POST(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error("[replay-webhook] CRON_SECRET not configured");
    return NextResponse.json({ error: "not configured" }, { status: 500 });
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  }

  let body: { event_id?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const eventId = typeof body.event_id === "string" ? body.event_id : null;
  if (eventId === null) {
    return NextResponse.json(
      { error: "missing event_id" },
      { status: 400 },
    );
  }

  const store = resolveStripeDLQStore();
  if (store === null) {
    return NextResponse.json(
      {
        error:
          "DLQ store not available — this route only works on the CF Workers runtime",
      },
      { status: 503 },
    );
  }

  const entry = await readDLQEntry(store, eventId);
  if (entry === null) {
    return NextResponse.json(
      { error: "event not in DLQ (may have expired or never failed)" },
      { status: 404 },
    );
  }

  // Reconstruct the original webhook request. Preserve the
  // stripe-signature header so the inner handler's signature
  // verification still passes.
  const headers = new Headers({ "content-type": "application/json" });
  if (entry.signature !== null) {
    headers.set("stripe-signature", entry.signature);
  }

  const replayUrl = new URL("/api/stripe/webhook", request.url).toString();
  const replayReq = new Request(replayUrl, {
    method: "POST",
    headers,
    body: entry.payload_raw,
  });

  console.log(
    `[replay-webhook] replaying event ${eventId} (originally failed at ${new Date(entry.ts).toISOString()})`,
  );

  // Call the inner handler directly so we bypass the DLQ wrapper's
  // dedup short-circuit (the original event id is already marked "seen"
  // by the prior successful-then-DLQ'd attempt).
  const innerResponse = await handleStripeWebhook(replayReq);

  // Annotate the response so the operator sees this was a replay.
  const annotatedHeaders = new Headers(innerResponse.headers);
  annotatedHeaders.set("x-replayed-from-dlq", "true");
  annotatedHeaders.set("x-original-error", entry.error_msg);

  return new Response(innerResponse.body, {
    status: innerResponse.status,
    statusText: innerResponse.statusText,
    headers: annotatedHeaders,
  });
}
