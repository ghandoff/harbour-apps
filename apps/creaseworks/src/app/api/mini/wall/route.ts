/**
 * GET /api/mini/wall — the curated wall: approved evidence only.
 * Suggestion box, not live feed (fruitstand decision) — approval happens
 * via D1 for now: UPDATE evidence SET approved = 1 WHERE id = '…'.
 */

import { NextResponse } from "next/server";
import { getMiniEnv } from "@/lib/mini-server";

export async function GET() {
  const env = getMiniEnv();
  if (!env) return NextResponse.json({ error: "not available" }, { status: 404 });

  const { results } = await env.db
    .prepare(
      `SELECT id, activity_slug, body, r2_key IS NOT NULL as has_photo, created_at
       FROM evidence WHERE approved = 1
       ORDER BY created_at DESC LIMIT 60`,
    )
    .bind()
    .all();

  return NextResponse.json({ wall: results });
}
