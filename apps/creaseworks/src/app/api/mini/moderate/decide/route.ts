/**
 * POST /api/mini/moderate/decide — approve or reject one submission.
 *
 * Gated by MODERATOR_CODE (x-moderator-code header). Body:
 *   { id, decision: 'approve'|'reject', reviewer?, reason?, tags?: string[] }
 *
 * approve → evidence.approved=1 + moderated_at now (appears on the wall).
 * reject  → evidence.approved=0 + moderated_at now (leaves the queue, stays
 *           hidden). Either way a moderation_log row is written — the
 *           labelled corpus (who / why / tags) that later trains a pre-screen.
 */

import { NextRequest, NextResponse } from "next/server";
import { getMiniEnv, checkModerator, MODERATOR_REVIEWERS, MINI_BODY_MAX } from "@/lib/mini-server";

export async function POST(req: NextRequest) {
  const env = getMiniEnv();
  if (!env) return NextResponse.json({ error: "not available" }, { status: 404 });

  if (!checkModerator(req.headers.get("x-moderator-code"))) {
    return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  }

  const json = await req.json().catch(() => null);
  const id = typeof json?.id === "string" ? json.id : "";
  if (!/^[0-9a-f-]{36}$/.test(id)) {
    return NextResponse.json({ error: "bad id" }, { status: 400 });
  }
  const decision = json?.decision === "approve" || json?.decision === "reject" ? json.decision : null;
  if (!decision) return NextResponse.json({ error: "decision required" }, { status: 400 });

  // reviewer: prefer a known name, but accept any short label rather than reject
  const rawReviewer = typeof json?.reviewer === "string" ? json.reviewer.trim().toLowerCase() : "";
  const reviewer = (MODERATOR_REVIEWERS as readonly string[]).includes(rawReviewer)
    ? rawReviewer
    : rawReviewer.slice(0, 40) || null;
  const reason = typeof json?.reason === "string" ? json.reason.trim().slice(0, MINI_BODY_MAX) || null : null;
  const tags = Array.isArray(json?.tags)
    ? json.tags.filter((t: unknown): t is string => typeof t === "string").slice(0, 12).map((t: string) => t.slice(0, 60))
    : [];
  // what the AI had suggested when the human decided — null if it wasn't shown
  const aiSuggestion =
    json?.aiSuggestion === "approve" || json?.aiSuggestion === "reject" ? json.aiSuggestion : null;

  // the row must exist + still be pending (idempotent — a double-tap on the
  // second reviewer's screen won't silently re-decide an already-handled item)
  const row = await env.db
    .prepare("SELECT id FROM evidence WHERE id = ? AND moderated_at IS NULL")
    .bind(id)
    .first();
  if (!row) return NextResponse.json({ error: "already handled or not found" }, { status: 409 });

  const approved = decision === "approve" ? 1 : 0;
  await env.db
    .prepare("UPDATE evidence SET approved = ?, moderated_at = datetime('now') WHERE id = ?")
    .bind(approved, id)
    .run();

  await env.db
    .prepare(
      "INSERT INTO moderation_log (id, evidence_id, decision, reviewer, reason, tags, ai_suggestion) VALUES (?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(crypto.randomUUID(), id, decision, reviewer, reason, JSON.stringify(tags), aiSuggestion)
    .run();

  return NextResponse.json({ ok: true });
}
