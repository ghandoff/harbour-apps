/**
 * GET /harbour/api/tier/preview?mode=on|off — staff-only freemium-preview toggle.
 *
 * Sets (or clears) the `wv_gate_preview` cookie on `.windedvertigo.com`, then
 * redirects back to the preview hub. While the cookie is on, `/api/tier` returns
 * the sampler for THIS staff viewer only (see ../route.ts), so we can walk every
 * companion app's free experience before flipping the global HARBOUR_GATE_ENFORCED
 * switch. The cookie auto-expires after 4 hours so a forgotten preview can't
 * linger. Honoured only for a real-staff session.
 */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getViewer } from "@/lib/viewer";
import { GATE_PREVIEW_COOKIE } from "../route";

export const dynamic = "force-dynamic";

const NO_STORE = { "cache-control": "no-store" };

export async function GET(req: Request) {
  const viewer = await getViewer();
  if (!viewer.realStaff) {
    return NextResponse.json({ error: "staff_only" }, { status: 403, headers: NO_STORE });
  }

  const on = new URL(req.url).searchParams.get("mode") === "on";
  const jar = await cookies();
  jar.set(GATE_PREVIEW_COOKIE, on ? "sampler" : "", {
    domain: ".windedvertigo.com",
    path: "/",
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: on ? 60 * 60 * 4 : 0, // 4h auto-expire when on; delete when off
  });

  // Absolute same-origin path — route handlers don't auto-prepend basePath.
  return NextResponse.redirect(new URL("/harbour/gate-preview", req.url), {
    headers: NO_STORE,
  });
}
