/**
 * /api/eval/materials — open-ended materials ("bring back whatever you find").
 *
 *   POST  — a kid submitted a material that's not on the list. Stored
 *           `pending` for collective review; pings #crease-camp.
 *   GET   — list submissions: ?status=pending|accepted|icons_proposed|live|
 *           declined (default pending), optional &group=<code> to scope to one
 *           family, or ?status=all&group=<code> for a family's whole collection.
 *   PATCH — accept (assign form_primary) · decline · choose (family picks the
 *           live icon → status live + #crease-camp spotlight).
 *
 * Source of truth is EVAL_DB. The mini submits + the family picks cross-host,
 * root-relative — same as events/roster. Slack failure is logged via body.ok.
 */

import { NextRequest, NextResponse } from "next/server";
import { getEvalEnv, normalizeGroupCode, EVAL_NAME_MAX } from "@/lib/eval-server";

const TITLE_MAX = 48;
const DESC_MAX = 280;
const FORM_MAX = 60;
const URL_MAX = 300;
const VALID_STATUS = new Set(["pending", "accepted", "declined", "icons_proposed", "live"]);

function str(v: unknown, max: number): string | null {
  return typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null;
}

async function slack(text: string, tag: string) {
  const token = process.env.SLACK_BOT_TOKEN;
  const channel = process.env.SLACK_FEEDBACK_CHANNEL;
  if (!token || !channel) return;
  try {
    const res = await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ channel, text }),
    });
    const body = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
    if (!body.ok) console.error(`[eval/materials] ${tag} slack error:`, body.error ?? res.status);
  } catch (err) {
    console.error(`[eval/materials] ${tag} slack threw:`, err);
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

  // dedup: the same family re-submitting the same title is idempotent — no
  // duplicate row, no second Slack ping (guards double-taps + spam).
  const dup = await env.db
    .prepare("SELECT id FROM submitted_materials WHERE group_code = ? AND lower(title) = lower(?) AND status != 'declined'")
    .bind(code, title)
    .first();
  if (dup) return NextResponse.json({ ok: true, deduped: true });

  // cap the pending queue per family so no one can flood review + #crease-camp.
  const pend = await env.db
    .prepare("SELECT count(*) AS n FROM submitted_materials WHERE group_code = ? AND status = 'pending'")
    .bind(code)
    .first<{ n: number }>();
  if ((pend?.n ?? 0) >= 12) {
    return NextResponse.json({ error: "lots waiting for review already — let the collective catch up first" }, { status: 429 });
  }

  await env.db
    .prepare(
      "INSERT INTO submitted_materials (id, group_code, submitted_by, title, description, status) VALUES (?, ?, ?, ?, ?, 'pending')",
    )
    .bind(crypto.randomUUID(), code, submittedBy, title, description)
    .run();

  await slack(`🧱 *[creaseworks]* new material *${title}* from ${code}${description ? `\n> ${description}` : ""}\n_needs collective review_`, "submit");
  return NextResponse.json({ ok: true });
}

// GET — list submissions by status (+ optional group, or status=all for a family)
export async function GET(req: NextRequest) {
  const env = getEvalEnv();
  if (!env) return NextResponse.json({ error: "not available" }, { status: 404 });

  const status = req.nextUrl.searchParams.get("status") ?? "pending";
  const group = normalizeGroupCode(req.nextUrl.searchParams.get("group"));
  const allStatuses = status === "all";
  if (!allStatuses && !VALID_STATUS.has(status)) return NextResponse.json({ error: "bad status" }, { status: 400 });
  if (allStatuses && !group) return NextResponse.json({ error: "status=all needs a group" }, { status: 400 });

  const cols =
    "id, group_code, submitted_by, title, description, form_primary, status, icon_candidate_urls, chosen_icon_url, created_at";
  const q = allStatuses
    ? env.db.prepare(`SELECT ${cols} FROM submitted_materials WHERE group_code = ? ORDER BY created_at DESC`).bind(group)
    : group
      ? env.db.prepare(`SELECT ${cols} FROM submitted_materials WHERE status = ? AND group_code = ? ORDER BY created_at ASC`).bind(status, group)
      : env.db.prepare(`SELECT ${cols} FROM submitted_materials WHERE status = ? ORDER BY created_at ASC`).bind(status);
  const rows = (await q.all()).results;
  return NextResponse.json({ materials: rows });
}

// PATCH — collective accept/decline, or family choose-icon (→ live + spotlight)
export async function PATCH(req: NextRequest) {
  const env = getEvalEnv();
  if (!env) return NextResponse.json({ error: "not available" }, { status: 404 });

  const json = await req.json().catch(() => null);
  if (!json) return NextResponse.json({ error: "json body required" }, { status: 400 });

  const id = str(json.id, 64);
  const action =
    json.action === "accept" || json.action === "decline" || json.action === "choose" ? json.action : null;
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
  } else if (action === "choose") {
    const chosen = str(json.chosen_icon_url, URL_MAX);
    if (!chosen) return NextResponse.json({ error: "chosen_icon_url required" }, { status: 400 });
    const m = await env.db
      .prepare("SELECT status, icon_candidate_urls, title, group_code FROM submitted_materials WHERE id=?")
      .bind(id)
      .first<{ status: string; icon_candidate_urls: string | null; title: string; group_code: string }>();
    if (!m || m.status !== "icons_proposed") {
      return NextResponse.json({ error: "not awaiting an icon choice" }, { status: 409 });
    }
    // the chosen URL MUST be one Payton actually proposed — never an arbitrary
    // caller-supplied URL, which would become the tile icon for EVERYONE.
    let candidates: string[] = [];
    try {
      const a = m.icon_candidate_urls ? JSON.parse(m.icon_candidate_urls) : [];
      candidates = Array.isArray(a) ? a : [];
    } catch {}
    if (!candidates.includes(chosen)) {
      return NextResponse.json({ error: "chosen icon must be one of the proposed candidates" }, { status: 400 });
    }
    await env.db
      .prepare("UPDATE submitted_materials SET chosen_icon_url=?, status='live' WHERE id=? AND status='icons_proposed'")
      .bind(chosen, id)
      .run();
    await slack(`🌟 *[creaseworks]* a new material is live — *${m.title}*, discovered by the ${m.group_code} family! it's now on the list for everyone 🎉`, "spotlight");
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
