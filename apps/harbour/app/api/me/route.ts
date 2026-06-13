import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getOwnedPacks } from "@/lib/queries/membership";
import { recommendFromRoles } from "@/lib/pier-data";
import { getViewer } from "@/lib/viewer";
import { GATE_PREVIEW_COOKIE } from "../tier/route";

/**
 * GET /harbour/api/me
 *
 * Personalization payload for the signed-in-aware hub, reported for the
 * EFFECTIVE viewer — so a staff member previewing "as public/visitor/crew"
 * (via the wv_view_as cookie) gets that persona's hero + boat marks. Also
 * returns `realStaff` + `activePersona` so the (staff-only) CollectiveDrawer knows to
 * render and which chip is active.
 *
 * No secrets; session-dependent → never cached.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const viewer = await getViewer();
  const { effective, realStaff, persona } = viewer;

  // Freemium-preview state (the CollectiveDrawer's "full ⇄ sampler" toggle) —
  // honoured only for real staff, mirroring /api/tier's override.
  const jar = await cookies();
  const gatePreview = realStaff && jar.get(GATE_PREVIEW_COOKIE)?.value === "sampler";

  if (!effective.signedIn) {
    return NextResponse.json(
      { signedIn: false, isStaff: false, realStaff, activePersona: persona, gatePreview },
      { headers: { "cache-control": "no-store" } },
    );
  }

  // Persona previews show no real name (except the harbourmaster = real staff).
  const name = persona && persona !== "harbourmaster" ? null : viewer.realName;

  let ownedApps: string[] = [];
  let recommendedApps: string[] = [];
  if (!effective.staff) {
    // Ownership is only meaningful for the real signed-in member, not a persona.
    if (!persona && viewer.realUserId) {
      try {
        const owned = await getOwnedPacks(viewer.realUserId);
        ownedApps = [...new Set(owned.map((p) => p.app))];
      } catch (err) {
        console.warn("[api/me] getOwnedPacks failed:", err);
      }
    }
    recommendedApps = recommendFromRoles(effective.roles).filter(
      (s) => !ownedApps.includes(s),
    );
  }

  return NextResponse.json(
    {
      signedIn: true,
      name,
      isStaff: effective.staff,
      ownedApps,
      recommendedApps,
      realStaff,
      activePersona: persona,
      gatePreview,
    },
    { headers: { "cache-control": "no-store" } },
  );
}
