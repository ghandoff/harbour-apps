/**
 * GET /api/eval/materials/icon?key=… — serve a material icon candidate (or
 * the chosen one) from the private MATERIAL_ICONS bucket. Public read so the
 * tiles can load it everywhere; immutable cache (keys are content-addressed
 * per material/index). No listing — you must know the key.
 */

import { NextRequest, NextResponse } from "next/server";
import { getEvalEnv } from "@/lib/eval-server";

// GET-only route reads the query string → must be dynamic (a multi-method
// route is implicitly dynamic, but this one needs the explicit marker).
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const env = getEvalEnv();
  if (!env?.icons) return NextResponse.json({ error: "not available" }, { status: 404 });

  const key = req.nextUrl.searchParams.get("key") ?? "";
  // strict shape: <uuid>/<0-2>.<ext> — no traversal, no reading arbitrary keys
  if (!/^[0-9a-f-]{36}\/[0-2]\.(png|webp|jpg)$/.test(key)) {
    return NextResponse.json({ error: "bad key" }, { status: 400 });
  }

  const obj = await env.icons.get(key);
  if (!obj) return NextResponse.json({ error: "not found" }, { status: 404 });

  return new Response(obj.body, {
    headers: {
      "Content-Type": obj.httpMetadata?.contentType ?? "application/octet-stream",
      "Cache-Control": "public, max-age=31536000, immutable",
      // an uploaded SVG could carry script; block sniffing + execution when the
      // icon URL is opened directly (img-loading ignores CSP, so tiles are fine)
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
    },
  });
}
