/**
 * GET /api/eval/events/export — the full anonymous trace corpus as JSON,
 * for offline clustering / emergent-profile work (LCA, sequence mining)
 * that doesn't belong in a request handler.
 *
 * Returns groups, players (avatars), and events. Everything is already
 * anonymous (no names anywhere), so this is the same exposure surface as
 * the designer dashboard. getEvalEnv() returns null without EVAL_DB → 404.
 */

import { NextResponse } from "next/server";
import { getEvalEnv } from "@/lib/eval-server";

export const dynamic = "force-dynamic";

const EVENT_CAP = 100000;

export async function GET() {
  const env = getEvalEnv();
  if (!env) return NextResponse.json({ error: "not available" }, { status: 404 });

  const groups =
    (await env.db.prepare("SELECT code, kind, created_at FROM groups ORDER BY created_at ASC").all()).results ?? [];
  const players =
    (await env.db.prepare("SELECT id, group_code, avatar, created_at FROM players ORDER BY created_at ASC").all()).results ?? [];
  const events =
    (
      await env.db
        .prepare(
          "SELECT id, group_code, player_id, device_token, session_id, event_type, stage, activity, seq, created_at FROM events ORDER BY created_at ASC LIMIT ?",
        )
        .bind(EVENT_CAP)
        .all()
    ).results ?? [];

  return NextResponse.json(
    { exported_count: { groups: groups.length, players: players.length, events: events.length }, groups, players, events },
    { headers: { "content-disposition": 'attachment; filename="creaseworks-traces.json"' } },
  );
}
