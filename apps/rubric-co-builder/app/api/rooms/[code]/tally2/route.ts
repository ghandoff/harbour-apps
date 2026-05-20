import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import { isValidRoomCode } from "@/lib/room-code";
import { isFacilitatorAuthorized } from "@/lib/facilitator-token";
import { STATE_ORDER } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// tally round 2: pick the most-voted scale_response per (criterion, level),
// write it into canonical scales, and advance to ai_ladder_propose.
export async function POST(
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
  const store = getStore();
  const snapshot = await store.getSnapshot(normalised);
  if (!snapshot) {
    return NextResponse.json({ error: "room not found" }, { status: 404 });
  }
  if (snapshot.room.state !== "vote2") {
    const currentIdx = STATE_ORDER.indexOf(snapshot.room.state);
    const vote2Idx = STATE_ORDER.indexOf("vote2");
    if (currentIdx < vote2Idx) {
      return NextResponse.json({ error: "room is not yet in vote2 state" }, { status: 400 });
    }
    return NextResponse.json({ already_advanced: true, state: snapshot.room.state });
  }
  const result = await store.tallyScaleResponseVotes(
    normalised,
    "ai_ladder_propose",
  );
  if (!result) {
    return NextResponse.json({ error: "room not found" }, { status: 404 });
  }
  return NextResponse.json(result);
}
