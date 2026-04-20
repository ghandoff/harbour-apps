import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import { isValidRoomCode } from "@/lib/room-code";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const normalised = code.toUpperCase();
  if (!isValidRoomCode(normalised)) {
    return NextResponse.json({ error: "invalid code" }, { status: 400 });
  }
  const result = await getStore().tallySelection(normalised);
  if (!result) {
    return NextResponse.json({ error: "room not found" }, { status: 404 });
  }
  // advance state to 'scale' as part of the tally action
  await getStore().updateRoomState(normalised, "scale");
  return NextResponse.json(result);
}
