import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getOwnedPacks, getProfile, isStaffEmail } from "@/lib/queries/membership";
import { PIER_MAP, type Pier } from "@/lib/pier-data";

/** Profile role → the pier(s) that role steers toward. "explorer" is broad. */
const ROLE_PIERS: Record<string, Pier[]> = {
  facilitator: ["leadership"],
  educator: ["classroom"],
  "parent-caregiver": ["family"],
};

/** App slugs whose pier matches any of the user's role-piers. */
function recommendFromRoles(roles: string[]): string[] {
  const target = new Set<Pier>(roles.flatMap((r) => ROLE_PIERS[r] ?? []));
  if (target.size === 0) return [];
  return Object.entries(PIER_MAP)
    .filter(([, piers]) => piers.some((p) => target.has(p)))
    .map(([slug]) => slug);
}

/**
 * GET /harbour/api/me
 *
 * Personalization payload for the signed-in-aware hub. Safe to expose to the
 * client: identity basics + which apps the user has access to (so the boat-map
 * can mark "in your harbour"). No secrets, no entitlement internals.
 *
 *   { signedIn, name, isStaff, ownedApps }
 *
 * - `name`: first name only (friendly greeting), or null.
 * - `isStaff`: windedvertigo.com — full access, so every boat is "yours".
 * - `ownedApps`: distinct app slugs the user holds ≥1 entitlement in
 *   (empty for staff — the client treats isStaff as own-everything).
 *
 * Session-dependent → never cache.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  const email = session?.user?.email;

  if (!email) {
    return NextResponse.json(
      { signedIn: false },
      { headers: { "cache-control": "no-store" } },
    );
  }

  const staff = isStaffEmail(email);
  const firstName = session.user?.name?.trim().split(/\s+/)[0] ?? null;

  let ownedApps: string[] = [];
  let recommendedApps: string[] = [];
  if (!staff && session.userId) {
    try {
      const owned = await getOwnedPacks(session.userId);
      ownedApps = [...new Set(owned.map((p) => p.app))];
    } catch (err) {
      // Ownership is a nice-to-have for the map; never fail the whole payload.
      console.warn("[api/me] getOwnedPacks failed:", err);
    }
    try {
      const profile = await getProfile(session.userId);
      const prefs = profile.playPreferences ?? {};
      const roles = Array.isArray(prefs.roles)
        ? (prefs.roles as string[])
        : typeof prefs.role === "string"
          ? [prefs.role as string]
          : [];
      // Recommend boats for the member's roles, minus what they already own.
      recommendedApps = recommendFromRoles(roles).filter((s) => !ownedApps.includes(s));
    } catch (err) {
      console.warn("[api/me] getProfile (recommendations) failed:", err);
    }
  }

  return NextResponse.json(
    { signedIn: true, name: firstName, isStaff: staff, ownedApps, recommendedApps },
    { headers: { "cache-control": "no-store" } },
  );
}
