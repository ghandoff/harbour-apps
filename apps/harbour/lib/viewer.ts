/**
 * getViewer — the single source of truth for "who is looking at this page",
 * including the collective-only "view as <persona>" override.
 *
 * A w.v staff member can set a `wv_view_as` cookie (via the ViewAsBar) to see
 * any harbour page from another member's perspective. The override is honoured
 * ONLY for a real-staff session — a forged cookie does nothing for anyone else,
 * and it can only ever *downgrade* a staff member's view (there is no persona
 * that grants non-staff a staff-level view). So it's a view preference, never
 * an auth vector; data gating + /api/checkout still check real staff.
 *
 * Returns the *effective* viewer (what the page should render) plus the *real*
 * identity (so the bar knows whether to show, and data reads can use the real
 * user when not previewing).
 */

import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { isStaffEmail, getProfile } from "@/lib/queries/membership";
import { parsePersona, previewFixture, type PreviewPersona } from "@/lib/preview-fixtures";

export const VIEW_AS_COOKIE = "wv_view_as";

export interface EffectiveViewer {
  signedIn: boolean;
  staff: boolean;
  hasProfile: boolean;
  roles: string[];
  intent: string[];
}

export interface Viewer {
  realStaff: boolean;
  realSignedIn: boolean;
  realEmail: string | null;
  realUserId?: string;
  realName: string | null;
  /** active "view as" persona (staff only); null = the viewer's own real view */
  persona: PreviewPersona | null;
  effective: EffectiveViewer;
}

export async function getViewer(): Promise<Viewer> {
  const session = await auth();
  const email = session?.user?.email ?? null;
  const realSignedIn = !!email && !!session?.userId;
  const realStaff = isStaffEmail(email);
  const realName = session?.user?.name?.trim().split(/\s+/)[0] ?? null;

  const jar = await cookies();
  const persona = realStaff ? parsePersona(jar.get(VIEW_AS_COOKIE)?.value) : null;

  let effective: EffectiveViewer;
  if (persona) {
    // Previewing — derive the effective view from the persona fixture.
    const fx = previewFixture(persona);
    effective = {
      signedIn: persona !== "public",
      staff: fx.staff,
      hasProfile: fx.onboardingCompleted,
      roles: fx.profileRoles,
      intent: fx.profileIntent,
    };
  } else {
    // Real viewer. Pull profile only for a signed-in non-staff member (staff
    // are treated as complete; the public has none).
    let roles: string[] = [];
    let intent: string[] = [];
    let hasProfile = realStaff;
    if (realSignedIn && !realStaff && session?.userId) {
      try {
        const profile = await getProfile(session.userId);
        hasProfile = profile.onboardingCompleted;
        const prefs = profile.playPreferences ?? {};
        roles = Array.isArray(prefs.roles)
          ? (prefs.roles as string[])
          : typeof prefs.role === "string"
            ? [prefs.role as string]
            : [];
        intent = Array.isArray(prefs.intent)
          ? (prefs.intent as string[])
          : Array.isArray(prefs.interests)
            ? (prefs.interests as string[])
            : [];
      } catch {
        // profile is personalization; degrade quietly
      }
    }
    effective = { signedIn: realSignedIn, staff: realStaff, hasProfile, roles, intent };
  }

  return {
    realStaff,
    realSignedIn,
    realEmail: email,
    realUserId: session?.userId,
    realName,
    persona,
    effective,
  };
}
