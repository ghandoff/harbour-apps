/**
 * POST /api/mini/session — set a pilot family/class code.
 * Self-serve: a well-formed code is created on first use (ensureCode), so
 * facilitators pick their own memorable code without pre-seeding.
 * Body: { code }. 200 {ok:true} | 400 malformed code | 404 on prod (no bindings).
 */

import { NextRequest, NextResponse } from "next/server";
import { getMiniEnv, ensureCode } from "@/lib/mini-server";

export async function POST(req: NextRequest) {
  const env = getMiniEnv();
  if (!env) return NextResponse.json({ error: "not available" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const code = typeof body?.code === "string" ? body.code.trim().toLowerCase() : "";
  if (!code) return NextResponse.json({ error: "code required" }, { status: 400 });

  const ok = await ensureCode(env.db, code);
  if (!ok) return NextResponse.json({ error: "invalid code" }, { status: 400 });

  return NextResponse.json({ ok: true, code });
}
