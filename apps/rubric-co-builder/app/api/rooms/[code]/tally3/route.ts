import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import { isValidRoomCode } from "@/lib/room-code";
import { isFacilitatorAuthorized } from "@/lib/facilitator-token";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// tally AI use votes and advance to pledge
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
  if ((snapshot.room.state as string) !== "vote3") {
    return NextResponse.json({ already_advanced: true, state: snapshot.room.state });
  }
  const result = await store.tallyAiVote(normalised);
  if (!result) {
    return NextResponse.json({ error: "room not found" }, { status: 404 });
  }
  return NextResponse.json(result);
}
