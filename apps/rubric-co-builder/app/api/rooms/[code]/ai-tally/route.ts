import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import { isValidRoomCode } from "@/lib/room-code";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/rooms/[code]/ai-tally
// locks in the ceiling (client reads it from ai_use_votes) and advances state to pledge.
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const normalised = code.toUpperCase();
  if (!isValidRoomCode(normalised)) {
    return NextResponse.json({ error: "invalid code" }, { status: 400 });
  }
  const store = getStore();
  const result = await store.tallyAiLadder(normalised);
  if (!result) {
    return NextResponse.json({ error: "room not found" }, { status: 404 });
  }
  await store.updateRoomState(normalised, "pledge");
  return NextResponse.json(result);
}
