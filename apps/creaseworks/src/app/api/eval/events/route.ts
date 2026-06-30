/**
 * POST /api/eval/events — batch-ingest behavioural traces.
 *
 * Body: { events: [{ event_type, stage?, activity?, seq?,
 *                     group_code?, player_id?, device_token?, session_id? }] }
 *
 * Each event carries its OWN identity snapshot (stamped client-side at the
 * moment it was logged) rather than one batch-level identity — so an event
 * logged before the "who's playing?" tap has a null player_id and a later
 * one in the same session carries it. That's what makes the within-child
 * signal honest.
 *
 * Minimal-core events only (session_start, stage_enter, activity_open);
 * return + dwell are derived downstream from player_id + timestamps. Fails
 * closed on a bad batch but never throws — traces are best-effort.
 *
 * getEvalEnv() returns null without EVAL_DB, so prod/mini 404.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  getEvalEnv,
  normalizeGroupCode,
  TRACE_EVENT_TYPES,
  TRACE_STAGES,
  EVENT_BATCH_MAX,
  TOKEN_MAX,
  type TraceEventType,
} from "@/lib/eval-server";

const ACTIVITY_MAX = 80;
const EVENT_TYPE_SET = new Set<string>(TRACE_EVENT_TYPES);
const STAGE_SET = new Set<string>(TRACE_STAGES);

interface CleanEvent {
  event_type: TraceEventType;
  stage: string | null;
  activity: string | null;
  seq: number | null;
  group_code: string | null;
  player_id: string | null;
  device_token: string | null;
  session_id: string | null;
}

function token(v: unknown): string | null {
  return typeof v === "string" && v.length > 0 ? v.slice(0, TOKEN_MAX) : null;
}

function clean(raw: unknown): CleanEvent | null {
  if (!raw || typeof raw !== "object") return null;
  const e = raw as Record<string, unknown>;
  if (!EVENT_TYPE_SET.has(e.event_type as string)) return null;
  const stage = typeof e.stage === "string" && STAGE_SET.has(e.stage) ? e.stage : null;
  const activity =
    typeof e.activity === "string" && e.activity.trim()
      ? e.activity.trim().slice(0, ACTIVITY_MAX)
      : null;
  const seq = Number.isFinite(e.seq) ? Math.trunc(e.seq as number) : null;
  return {
    event_type: e.event_type as TraceEventType,
    stage,
    activity,
    seq,
    group_code: normalizeGroupCode(e.group_code),
    player_id: token(e.player_id),
    device_token: token(e.device_token),
    session_id: token(e.session_id),
  };
}

export async function POST(req: NextRequest) {
  const env = getEvalEnv();
  if (!env) return NextResponse.json({ error: "not available" }, { status: 404 });

  const json = (await req.json().catch(() => null)) as { events?: unknown } | null;
  const list = json && Array.isArray(json.events) ? json.events : null;
  if (!list) return NextResponse.json({ error: "events array required" }, { status: 400 });

  const events = list.slice(0, EVENT_BATCH_MAX).map(clean).filter((e): e is CleanEvent => e !== null);
  if (events.length === 0) return NextResponse.json({ ok: true, written: 0 });

  // run the batch concurrently — a serial await-per-event loop stacked up to
  // EVENT_BATCH_MAX (50) sequential D1 round-trips per flush, which adds
  // hundreds of ms under multi-family play. Best-effort: a partial failure
  // still records the rest.
  await Promise.all(
    events.map((e) =>
      env.db
        .prepare(
          "INSERT INTO events (id, group_code, player_id, device_token, session_id, event_type, stage, activity, seq) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        )
        .bind(
          crypto.randomUUID(),
          e.group_code,
          e.player_id,
          e.device_token,
          e.session_id,
          e.event_type,
          e.stage,
          e.activity,
          e.seq,
        )
        .run(),
    ),
  );

  return NextResponse.json({ ok: true, written: events.length });
}
