/**
 * POST /api/eval/submit — one evaluation of one playdate.
 *
 * Body: { playdate_slug, evaluator_name, register, answers }
 *   answers is a flat map of rubric item id → value (number | string |
 *   string[]). Stored as a JSON blob so the rubric can grow without a
 *   migration. The dashboard parses it.
 *
 * Ships in every flavour; getEvalEnv() returns null without the EVAL_DB
 * binding, so prod/mini 404 and expose nothing.
 */

import { NextRequest, NextResponse } from "next/server";
import { getEvalEnv, EVAL_NAME_MAX, EVAL_ANSWERS_MAX } from "@/lib/eval-server";
import { EVAL_PLAYDATES } from "@/lib/eval-rubric";

const VALID_SLUGS = new Set(EVAL_PLAYDATES.map((p) => p.slug));

export async function POST(req: NextRequest) {
  const env = getEvalEnv();
  if (!env) return NextResponse.json({ error: "not available" }, { status: 404 });

  const json = await req.json().catch(() => null);
  if (!json) return NextResponse.json({ error: "json body required" }, { status: 400 });

  const slug = typeof json.playdate_slug === "string" ? json.playdate_slug : "";
  if (!VALID_SLUGS.has(slug)) {
    return NextResponse.json({ error: "unknown playdate" }, { status: 400 });
  }

  const register =
    json.register === "kid" || json.register === "grownup" || json.register === "collective"
      ? json.register
      : null;
  if (!register) return NextResponse.json({ error: "register required" }, { status: 400 });

  const name =
    typeof json.evaluator_name === "string" ? json.evaluator_name.trim().slice(0, EVAL_NAME_MAX) : null;

  const answers = json.answers && typeof json.answers === "object" ? json.answers : null;
  if (!answers || Array.isArray(answers)) {
    return NextResponse.json({ error: "answers object required" }, { status: 400 });
  }
  const answersJson = JSON.stringify(answers);
  if (answersJson.length > EVAL_ANSWERS_MAX) {
    return NextResponse.json({ error: "answers too large" }, { status: 413 });
  }
  if (Object.keys(answers).length === 0) {
    return NextResponse.json({ error: "no answers" }, { status: 400 });
  }

  await env.db
    .prepare(
      "INSERT INTO evaluations (id, playdate_slug, evaluator_name, register, answers_json) VALUES (?, ?, ?, ?, ?)",
    )
    .bind(crypto.randomUUID(), slug, name, register, answersJson)
    .run();

  // ping Slack — awaited, and we check the RESPONSE BODY's ok, not just
  // the HTTP status: slack always returns 200 and signals failure in
  // body.ok (the bug that ate the mini's first notifications).
  const slackToken = process.env.SLACK_BOT_TOKEN;
  const slackChannel = process.env.SLACK_FEEDBACK_CHANNEL;
  if (slackToken && slackChannel) {
    const icon = register === "collective" ? "🧭" : register === "grownup" ? "👀" : "🧒";
    const text = `${icon} *[creaseworks-audit]* ${register} eval of *${slug}*${name ? ` by ${name}` : ""} — ${Object.keys(answers).length} answers`;
    try {
      const res = await fetch("https://slack.com/api/chat.postMessage", {
        method: "POST",
        headers: { Authorization: `Bearer ${slackToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ channel: slackChannel, text }),
      });
      const body = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!body.ok) console.error("[eval/submit] slack error:", body.error ?? res.status);
    } catch (err) {
      console.error("[eval/submit] slack threw:", err);
    }
  }

  return NextResponse.json({ ok: true });
}
