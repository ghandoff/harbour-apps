/**
 * POST /api/mini/feedback — pilot feedback via the shared 🐛 FeedbackWidget.
 *
 * Accepts the widget's payload shape (packages/feedback/types.ts):
 *   { app_slug, route, feedback_type, severity, comment, device_info }
 * The family code attaches server-side from the `cw-mini-code` cookie
 * (set when the grown-up validates their code) and is OPTIONAL —
 * code-less bug reports are still valuable. The stage is derived from
 * the widget's `route` field.
 */

import { NextRequest, NextResponse } from "next/server";
import { getMiniEnv, MINI_BODY_MAX } from "@/lib/mini-server";

export async function POST(req: NextRequest) {
  const env = getMiniEnv();
  if (!env) return NextResponse.json({ error: "not available" }, { status: 404 });

  const json = await req.json().catch(() => null);
  if (!json) return NextResponse.json({ error: "json body required" }, { status: 400 });

  const feedbackType = typeof json.feedback_type === "string" ? json.feedback_type.slice(0, 16) : null;
  const severity = Number.isInteger(json.severity) && json.severity >= 1 && json.severity <= 5 ? json.severity : null;
  const comment = typeof json.comment === "string" ? json.comment.trim().slice(0, MINI_BODY_MAX) : null;
  const route = typeof json.route === "string" ? json.route.slice(0, 128) : null;
  const ua = typeof json.device_info?.ua === "string" ? json.device_info.ua.slice(0, 256) : null;

  if (!feedbackType && !comment) {
    return NextResponse.json({ error: "feedback type or comment required" }, { status: 400 });
  }

  // family code from the cookie set at code validation — optional
  const rawCode = req.cookies.get("cw-mini-code")?.value ?? null;
  const code = rawCode && /^[a-z]+-[a-z]+$/.test(rawCode) ? rawCode : null;

  // stage from the route's last path segment (e.g. /look/classic → look)
  const stage = route?.split("/").filter(Boolean).find((seg: string) =>
    ["look", "make", "show", "wow", "guide", "mini"].includes(seg),
  ) ?? null;

  await env.db
    .prepare(
      "INSERT INTO feedback (id, code, stage, feedback_type, severity, route, ua, body) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(crypto.randomUUID(), code, stage, feedbackType, severity, route, ua, comment)
    .run();

  return NextResponse.json({ ok: true });
}
