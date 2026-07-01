/**
 * GET /api/mini/moderate/queue — pending submissions awaiting review.
 *
 * Gated by the MODERATOR_CODE passphrase (x-moderator-code header, verified
 * server-side). Returns everything not yet decided (approved=0 AND
 * moderated_at IS NULL), oldest first, incl. the family code so the client
 * can load a pending photo via the owner-code path on /api/mini/photo/[id].
 */

import { NextRequest, NextResponse } from "next/server";
import { getMiniEnv, checkModerator } from "@/lib/mini-server";

export async function GET(req: NextRequest) {
  const env = getMiniEnv();
  if (!env) return NextResponse.json({ error: "not available" }, { status: 404 });

  if (!checkModerator(req.headers.get("x-moderator-code"))) {
    return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  }

  const { results } = await env.db
    .prepare(
      `SELECT id, code, activity_slug, body, r2_key IS NOT NULL as has_photo, created_at
       FROM evidence
       WHERE approved = 0 AND moderated_at IS NULL
       ORDER BY created_at ASC LIMIT 100`,
    )
    .bind()
    .all();

  return NextResponse.json({ queue: results });
}
