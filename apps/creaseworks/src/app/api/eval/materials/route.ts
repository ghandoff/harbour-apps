/**
 * /api/eval/materials — open-ended materials ("bring back whatever you find").
 *
 *   POST  — a kid submitted a material that's not on the list. Stored
 *           `pending` for collective review; pings #crease-camp.
 *   GET   — list submissions by status (default `pending`) for the dashboard
 *           review card.
 *   PATCH — the collective accepts (assigns form_primary) or declines.
 *
 * Source of truth is EVAL_DB (the collective moderates via the dashboard).
 * The mini submits cross-host, root-relative — same as events/roster.
 * Ships in every flavour; getEvalEnv() returns null without EVAL_DB, so
 * prod/mini 404 and expose nothing. Slack failure is logged via body.ok,
 * never the HTTP status (slack always returns 200).
 */

import { NextRequest, NextResponse } from "next/server";
import { getEvalEnv, normalizeGroupCode, EVAL_NAME_MAX } from "@/lib/eval-server";

const TITLE_MAX = 48;
const DESC_MAX = 280;
const FORM_MAX = 60;
const VALID_STATUS = new Set(["pending", "accepted", "declined", "icons_proposed", "live"]);

function str(v: unknown, max: number): string | null {
  return typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null;
}

async function pingSlack(title: string, code: string, description: string | null) {
  const token = process.env.SLACK_BOT_TOKEN;
  const channel = process.env.SLACK_FEEDBACK_CHANNEL;
  if (!token || !channel) return;
  const text = `🧱 *[creaseworks]* new material *${title}* from ${code}${description ? `\n> ${description}` : ""}\n_needs collective review_`;
  try {
    const res = await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ channel, text }),
    });
    const body = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
    if (!body.ok) console.error("[eval/materials] slack error:", body.error ?? res.status);
  } catch (err) {
    console.error("[eval/materials] slack threw:", err);
  }
}

// POST — submit a new material (status pending)
export async function POST(req: NextRequest) {
  const env = getEvalEnv();
  if (!env) return NextResponse.json({ error: "not available" }, { status: 404 });

  const json = await req.json().catch(() => null);
  if (!json) return NextResponse.json({ error: "json body required" }, { status: 400 });

  const code = normalizeGroupCode(json.code ?? json.group);
  if (!code) return NextResponse.json({ error: "valid family/class code required" }, { status: 400 });

  const title = str(json.title, TITLE_MAX);
  if (!title) return NextResponse.json({ error: "title required" }, { status: 400 });

  const description = str(json.description, DESC_MAX);
  const submittedBy = str(json.submitted_by, EVAL_NAME_MAX);

  await env.db
    .prepare(
      "INSERT INTO submitted_materials (id, group_code, submitted_by, title, description, status) VALUES (?, ?, ?, ?, ?, 'pending')",
    )
    .bind(crypto.randomUUID(), code, submittedBy, title, description)
    .run();

  await pingSlack(title, code, description);
  return NextResponse.json({ ok: true });
}

// GET — list submissions by status (default pending) for the review card
export async function GET(req: NextRequest) {
  const env = getEvalEnv();
  if (!env) return NextResponse.json({ error: "not available" }, { status: 404 });

  const status = req.nextUrl.searchParams.get("status") ?? "pending";
  if (!VALID_STATUS.has(status)) return NextResponse.json({ error: "bad status" }, { status: 400 });

  const rows = (
    await env.db
      .prepare(
        "SELECT id, group_code, submitted_by, title, description, form_primary, status, chosen_icon_url, created_at FROM submitted_materials WHERE status = ? ORDER BY created_at ASC",
      )
      .bind(status)
      .all()
  ).results;
  return NextResponse.json({ materials: rows });
}

// PATCH — collective accept (assign form_primary) or decline
export async function PATCH(req: NextRequest) {
  const env = getEvalEnv();
  if (!env) return NextResponse.json({ error: "not available" }, { status: 404 });

  const json = await req.json().catch(() => null);
  if (!json) return NextResponse.json({ error: "json body required" }, { status: 400 });

  const id = str(json.id, 64);
  const action = json.action === "accept" || json.action === "decline" ? json.action : null;
  const reviewer = str(json.reviewer, EVAL_NAME_MAX);
  if (!id || !action) return NextResponse.json({ error: "id + action required" }, { status: 400 });

  if (action === "accept") {
    const form = str(json.form_primary, FORM_MAX);
    if (!form) return NextResponse.json({ error: "form_primary required to accept" }, { status: 400 });
    await env.db
      .prepare(
        "UPDATE submitted_materials SET status='accepted', form_primary=?, accepted_by=?, accepted_at=datetime('now') WHERE id=? AND status='pending'",
      )
      .bind(form, reviewer, id)
      .run();
  } else {
    await env.db
      .prepare(
        "UPDATE submitted_materials SET status='declined', accepted_by=?, accepted_at=datetime('now') WHERE id=? AND status='pending'",
      )
      .bind(reviewer, id)
      .run();
  }
  return NextResponse.json({ ok: true });
}
