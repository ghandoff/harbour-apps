import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import { isValidRoomCode } from "@/lib/room-code";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_VOTES = 3;

export async function POST(
  req: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const normalised = code.toUpperCase();
  if (!isValidRoomCode(normalised)) {
    return NextResponse.json({ error: "invalid code" }, { status: 400 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json body" }, { status: 400 });
  }
  const o = (body ?? {}) as Record<string, unknown>;
  const participantId = typeof o.participant_id === "string" ? o.participant_id : "";
  const criterionId = typeof o.criterion_id === "string" ? o.criterion_id : "";
  if (!participantId || !criterionId) {
    return NextResponse.json({ error: "missing ids" }, { status: 400 });
  }

  const store = getStore();
  const snapshot = await store.getSnapshot(normalised);
  if (!snapshot) {
    return NextResponse.json({ error: "room not found" }, { status: 404 });
  }
  const count = await store.countVotesForParticipant(participantId, snapshot.room.id);
  if (count >= MAX_VOTES) {
    return NextResponse.json(
      { error: `you've used all ${MAX_VOTES} dots. remove one first.` },
      { status: 409 },
    );
  }
  const vote = await store.castVote(participantId, criterionId);
  if (!vote) {
    return NextResponse.json({ error: "couldn't cast vote" }, { status: 400 });
  }
  return NextResponse.json(vote, { status: 201 });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const normalised = code.toUpperCase();
  if (!isValidRoomCode(normalised)) {
    return NextResponse.json({ error: "invalid code" }, { status: 400 });
  }
  const url = new URL(req.url);
  const participantId = url.searchParams.get("participant_id") ?? "";
  const criterionId = url.searchParams.get("criterion_id") ?? "";
  if (!participantId || !criterionId) {
    return NextResponse.json({ error: "missing ids" }, { status: 400 });
  }
  await getStore().removeVote(participantId, criterionId);
  return NextResponse.json({ ok: true });
}
