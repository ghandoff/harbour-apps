/**
 * POST /api/eval/one-read/vote  { slug, evaluator_name, agree }
 *
 * Did the AI read match what the evaluator found? "If it does not match
 * what the room found, mark it wrong." The dashboard shows the agree rate
 * so a read the room keeps overriding is visibly untrusted.
 */

import { NextRequest, NextResponse } from "next/server";
import { getEvalEnv, EVAL_NAME_MAX } from "@/lib/eval-server";
import { playdateBySlug } from "@/lib/eval-rubric";

export async function POST(req: NextRequest) {
  const env = getEvalEnv();
  if (!env) return NextResponse.json({ error: "not available" }, { status: 404 });

  const json = await req.json().catch(() => null);
  const slug = json && typeof json.slug === "string" ? json.slug : "";
  if (!playdateBySlug(slug)) return NextResponse.json({ error: "unknown playdate" }, { status: 400 });
  if (typeof json.agree !== "boolean") {
    return NextResponse.json({ error: "agree (boolean) required" }, { status: 400 });
  }
  const name =
    typeof json.evaluator_name === "string" ? json.evaluator_name.trim().slice(0, EVAL_NAME_MAX) : null;

  await env.db
    .prepare("INSERT INTO one_read_votes (id, playdate_slug, evaluator_name, agree) VALUES (?, ?, ?, ?)")
    .bind(crypto.randomUUID(), slug, name, json.agree ? 1 : 0)
    .run();

  return NextResponse.json({ ok: true });
}
