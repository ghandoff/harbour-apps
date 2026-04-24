import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import { isValidRoomCode } from "@/lib/room-code";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// tally pledge votes: picks the most-voted pledge_response per slot,
// writes it to canonical pledge_slots, and advances to commit.
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const normalised = code.toUpperCase();
  if (!isValidRoomCode(normalised)) {
    return NextResponse.json({ error: "invalid code" }, { status: 400 });
  }
  let result;
  try {
    result = await getStore().tallyPledgeVotes(normalised);
  } catch (err) {
    console.error("tallyPledgeVotes error:", err);
    return NextResponse.json({ error: "internal server error" }, { status: 500 });
  }
  if (!result) {
    return NextResponse.json({ error: "room not found" }, { status: 404 });
  }
  return NextResponse.json(result);
}
