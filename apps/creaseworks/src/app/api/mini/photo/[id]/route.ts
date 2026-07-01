/**
 * GET /api/mini/photo/[id] — stream an evidence photo from the pilot bucket.
 * An APPROVED photo is public + cacheable. An unapproved photo is served only
 * when the request presents the matching family code (?code=<code>) — so a
 * family can see its OWN pending creations, but a stranger still needs both
 * the exact id AND the code, keeping the guess-the-key protection intact.
 */

import { NextRequest, NextResponse } from "next/server";
import { getMiniEnv, normalizeCode } from "@/lib/mini-server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const env = getMiniEnv();
  if (!env) return NextResponse.json({ error: "not available" }, { status: 404 });

  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) {
    return NextResponse.json({ error: "bad id" }, { status: 400 });
  }

  const row = await env.db
    .prepare("SELECT r2_key, code, approved FROM evidence WHERE id = ?")
    .bind(id)
    .first<{ r2_key: string | null; code: string; approved: number }>();

  if (!row?.r2_key) return NextResponse.json({ error: "not found" }, { status: 404 });

  // public if approved; otherwise only the owning family (matching code) may view
  const requestCode = normalizeCode(req.nextUrl.searchParams.get("code"));
  const isApproved = row.approved === 1;
  const isOwner = requestCode !== null && requestCode === row.code;
  if (!isApproved && !isOwner) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const obj = await env.evidence.get(row.r2_key);
  if (!obj) return NextResponse.json({ error: "not found" }, { status: 404 });

  return new NextResponse(obj.body, {
    headers: {
      "Content-Type": obj.httpMetadata?.contentType ?? "image/jpeg",
      // approved is shareable + cacheable; a pending own-photo must not be
      // held by any shared cache (it becomes public only once approved).
      "Cache-Control": isApproved ? "public, max-age=3600" : "private, no-store",
    },
  });
}
