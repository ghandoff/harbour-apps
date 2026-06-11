/**
 * GET /api/mini/photo/[id] — stream an APPROVED evidence photo from the
 * pilot bucket. Lookup is by evidence id with an approved check, so
 * unapproved photos can't be fetched by guessing storage keys.
 */

import { NextRequest, NextResponse } from "next/server";
import { getMiniEnv } from "@/lib/mini-server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const env = getMiniEnv();
  if (!env) return NextResponse.json({ error: "not available" }, { status: 404 });

  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) {
    return NextResponse.json({ error: "bad id" }, { status: 400 });
  }

  const row = await env.db
    .prepare("SELECT r2_key FROM evidence WHERE id = ? AND approved = 1")
    .bind(id)
    .first<{ r2_key: string | null }>();

  if (!row?.r2_key) return NextResponse.json({ error: "not found" }, { status: 404 });

  const obj = await env.evidence.get(row.r2_key);
  if (!obj) return NextResponse.json({ error: "not found" }, { status: 404 });

  return new NextResponse(obj.body, {
    headers: {
      "Content-Type": obj.httpMetadata?.contentType ?? "image/jpeg",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
