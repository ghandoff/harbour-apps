/**
 * POST /api/mini/session — validate a pilot family code.
 * Body: { code }. 200 {ok:true} | 404 unknown code | 404 on prod (no bindings).
 */

import { NextRequest, NextResponse } from "next/server";
import { getMiniEnv, validateCode } from "@/lib/mini-server";

export async function POST(req: NextRequest) {
  const env = getMiniEnv();
  if (!env) return NextResponse.json({ error: "not available" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const code = typeof body?.code === "string" ? body.code.trim().toLowerCase() : "";
  if (!code) return NextResponse.json({ error: "code required" }, { status: 400 });

  const ok = await validateCode(env.db, code);
  if (!ok) return NextResponse.json({ error: "unknown code" }, { status: 404 });

  return NextResponse.json({ ok: true, code });
}
