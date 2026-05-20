import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import { isValidRoomCode } from "@/lib/room-code";
import type { RoomState } from "@/lib/types";
import { isFacilitatorAuthorized } from "@/lib/facilitator-token";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// single source of truth — valid target states AND forward-only ordering.
// "calibrate" was removed (legacy state, not in the current session flow).
// rooms already persisted at an unknown state can still advance: if
// currentIdx === -1 the forward check does not fire, so they can proceed.
const STATE_ORDER: RoomState[] = [
  "lobby",
  "frame",
  "propose",
  "vote",
  "criteria_gate",
  "scale",
  "vote2",
  "ai_ladder_propose",
  "ai_ladder",
  "pledge",
  "commit",
];

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const normalised = code.toUpperCase();
  if (!isValidRoomCode(normalised)) {
    return NextResponse.json({ error: "invalid code" }, { status: 400 });
  }

  const snapshot = await getStore().getSnapshot(normalised);
  if (!snapshot) {
    return NextResponse.json({ error: "room not found" }, { status: 404 });
  }
  return NextResponse.json(snapshot);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const normalised = code.toUpperCase();
  if (!isValidRoomCode(normalised)) {
    return NextResponse.json({ error: "invalid code" }, { status: 400 });
  }

  if (!(await isFacilitatorAuthorized(req, normalised))) {
    return NextResponse.json({ error: "facilitator token required" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json body" }, { status: 400 });
  }

  const { state, from_state } = (body ?? {}) as { state?: string; from_state?: string };
  if (!state || !STATE_ORDER.includes(state as RoomState)) {
    return NextResponse.json({ error: "invalid state" }, { status: 400 });
  }

  // always fetch snapshot to enforce forward-only guard
  const snapshot = await getStore().getSnapshot(normalised);
  if (!snapshot) {
    return NextResponse.json({ error: "room not found" }, { status: 404 });
  }

  const currentIdx = STATE_ORDER.indexOf(snapshot.room.state);
  const requestedIdx = STATE_ORDER.indexOf(state as RoomState);
  if (requestedIdx !== -1 && currentIdx !== -1 && requestedIdx <= currentIdx) {
    return NextResponse.json(
      { error: "state can only move forward", current: snapshot.room.state },
      { status: 409 },
    );
  }

  // from_state race guard: if caller says "only advance if still in X" and we've already moved, return current
  if (from_state && snapshot.room.state !== from_state) {
    return NextResponse.json({ code: snapshot.room.code, state: snapshot.room.state });
  }

  const updated = await getStore().updateRoomState(normalised, state as RoomState);
  if (!updated) {
    return NextResponse.json({ error: "room not found" }, { status: 404 });
  }
  return NextResponse.json({ code: updated.code, state: updated.state });
}
