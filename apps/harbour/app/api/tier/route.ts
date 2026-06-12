/**
 * GET /harbour/api/tier?app=<slug> — the shared freemium tier check.
 *
 * Companion apps (Next.js, Worker, or static) call this with the credentialed
 * `.windedvertigo.com` session cookie (same origin) to learn the viewer's tier
 * for an app, so we don't wire DB + auth into all seven. Honours the global
 * kill-switch (HARBOUR_GATE_ENFORCED) and the collective view-as preview.
 *
 *   { tier: string, enforced: boolean }
 *
 * When `enforced` is false the gate is dormant → `tier` is always the top tier
 * (full access for everyone). Never cached.
 */

import { NextResponse } from "next/server";
import { getViewer } from "@/lib/viewer";
import { resolveTier } from "@windedvertigo/stripe";

export const dynamic = "force-dynamic";

const NO_STORE = { "cache-control": "no-store" };

export async function GET(req: Request) {
  const app = new URL(req.url).searchParams.get("app");
  if (!app) {
    return NextResponse.json({ error: "app_required" }, { status: 400, headers: NO_STORE });
  }

  const viewer = await getViewer();
  // Collective (or the harbourmaster persona) → top tier. Persona previews carry
  // no real entitlements, so they resolve from the floor (what a member sees).
  const isInternal = viewer.effective.staff;
  const userId = viewer.persona ? null : viewer.realUserId ?? null;
  const orgId = viewer.persona ? null : viewer.realOrgId;

  const tier = await resolveTier({ app, userId, orgId, isInternal });
  const enforced = process.env.HARBOUR_GATE_ENFORCED === "true";

  return NextResponse.json({ tier, enforced }, { headers: NO_STORE });
}
