import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getOwnedPacks, isStaffEmail } from "@/lib/queries/membership";

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
  if (!staff && session.userId) {
    try {
      const owned = await getOwnedPacks(session.userId);
      ownedApps = [...new Set(owned.map((p) => p.app))];
    } catch (err) {
      // Ownership is a nice-to-have for the map; never fail the whole payload.
      console.warn("[api/me] getOwnedPacks failed:", err);
    }
  }

  return NextResponse.json(
    { signedIn: true, name: firstName, isStaff: staff, ownedApps },
    { headers: { "cache-control": "no-store" } },
  );
}
