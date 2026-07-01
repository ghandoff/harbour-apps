/**
 * GET /api/mini/mine?code=<code> — a family's own creations, every approval
 * state (pending + approved), scoped to their family/class code. Powers the
 * "your creations" section on the wow wall so a family sees what they just
 * shared immediately, without waiting for the global curated wall.
 */

import { NextRequest, NextResponse } from "next/server";
import { getMiniEnv, normalizeCode } from "@/lib/mini-server";

export async function GET(req: NextRequest) {
  const env = getMiniEnv();
  if (!env) return NextResponse.json({ error: "not available" }, { status: 404 });

  const code = normalizeCode(req.nextUrl.searchParams.get("code"));
  if (!code) return NextResponse.json({ error: "code required" }, { status: 400 });

  const { results } = await env.db
    .prepare(
      `SELECT id, activity_slug, body, r2_key IS NOT NULL as has_photo, approved, created_at
       FROM evidence WHERE code = ?
       ORDER BY created_at DESC LIMIT 60`,
    )
    .bind(code)
    .all();

  return NextResponse.json({ mine: results });
}
