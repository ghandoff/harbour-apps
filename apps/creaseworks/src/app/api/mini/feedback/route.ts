/**
 * POST /api/mini/feedback — the grown-up's running notes.
 * Body: { code, stage?, body }. "every time they stop or pause or go
 * 'what do I do?' … type it in really quick" (payton, whirlpool).
 */

import { NextRequest, NextResponse } from "next/server";
import { getMiniEnv, validateCode, MINI_BODY_MAX } from "@/lib/mini-server";

export async function POST(req: NextRequest) {
  const env = getMiniEnv();
  if (!env) return NextResponse.json({ error: "not available" }, { status: 404 });

  const json = await req.json().catch(() => null);
  const code = typeof json?.code === "string" ? json.code.trim().toLowerCase() : "";
  const stage = typeof json?.stage === "string" ? json.stage.slice(0, 16) : null;
  const body = typeof json?.body === "string" ? json.body.trim().slice(0, MINI_BODY_MAX) : "";

  if (!code || !(await validateCode(env.db, code))) {
    return NextResponse.json({ error: "valid family code required" }, { status: 403 });
  }
  if (!body) return NextResponse.json({ error: "feedback text required" }, { status: 400 });

  await env.db
    .prepare("INSERT INTO feedback (id, code, stage, body) VALUES (?, ?, ?, ?)")
    .bind(crypto.randomUUID(), code, stage, body)
    .run();

  return NextResponse.json({ ok: true });
}
