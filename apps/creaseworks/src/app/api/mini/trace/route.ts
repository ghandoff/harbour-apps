/**
 * POST /api/mini/trace — receive a batch of mini-local behavioural events.
 *
 * Writes to MINI_DB.trace_events, keyed to family_code only. Rules enforced
 * HERE, not just in the client:
 *   • an event with no valid family_code is dropped (fail-soft, never blocks play),
 *   • only the 8 known event types are accepted,
 *   • we persist exactly the app-sent payload object — the client never puts a
 *     child name / player id in it, and this route adds no identity of its own.
 *
 * Ships in every flavour; getMiniEnv() is null without the MINI_DB binding, so
 * prod/eval 404 and expose nothing.
 */

import { NextRequest, NextResponse } from "next/server";
import { getMiniEnv } from "@/lib/mini-server";

const EVENT_TYPES = new Set([
  "material_picked",
  "wants_to_do",
  "job_assigned",
  "scaffold_tap",
  "phase_time",
  "provocation_flip",
  "ending_choice",
  "guess_event",
  // P1
  "ambiguity_set",
  "door_chosen",
]);
const CODE_SHAPE = /^[a-z0-9][a-z0-9-]{1,39}$/;

export async function POST(req: NextRequest) {
  const env = getMiniEnv();
  if (!env) return NextResponse.json({ error: "not available" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const events = Array.isArray(body?.events) ? body.events : [];

  let written = 0;
  for (const e of events) {
    const family = typeof e?.family_code === "string" ? e.family_code.trim().toLowerCase() : "";
    if (!CODE_SHAPE.test(family)) continue; // no valid family code → skip
    const type = typeof e?.event_type === "string" ? e.event_type : "";
    if (!EVENT_TYPES.has(type)) continue;
    const session = typeof e?.session_id === "string" ? e.session_id.slice(0, 64) : null;
    const slug = typeof e?.playdate_slug === "string" ? e.playdate_slug.slice(0, 64) : null;
    const payload =
      e?.payload && typeof e.payload === "object" && !Array.isArray(e.payload)
        ? JSON.stringify(e.payload).slice(0, 4000)
        : "{}";
    try {
      await env.db
        .prepare(
          "INSERT INTO trace_events (id, family_code, session_id, playdate_slug, event_type, payload_json) VALUES (?, ?, ?, ?, ?, ?)",
        )
        .bind(crypto.randomUUID(), family, session, slug, type, payload)
        .run();
      written++;
    } catch {
      // best-effort: a dropped trace never breaks play
    }
  }

  return NextResponse.json({ ok: true, written });
}
