import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getProfile, saveProfile, isStaffEmail } from "@/lib/queries/membership";
import { addToAudience, HARBOUR_MEMBERS_AUDIENCE } from "@/lib/resend-audience";
import { awardKnots } from "@/lib/knots";

/**
 * /harbour/api/profile
 *
 * GET  — current profile state for the signed-in user.
 * POST — save the profile (the aboard→crew gateway): records role + interests
 *        in play_preferences, flips onboarding_completed, and enrols non-staff
 *        members into the harbour-members Resend audience.
 *
 * Session-dependent → never cache.
 */
export const dynamic = "force-dynamic";

const ROLES = ["facilitator", "educator", "parent-caregiver"] as const;
const INTERESTS = ["leadership", "classroom", "family"] as const;
type Role = (typeof ROLES)[number];

export async function GET() {
  const session = await auth();
  if (!session?.userId) {
    return NextResponse.json({ signedIn: false }, { status: 401 });
  }
  const profile = await getProfile(session.userId);
  return NextResponse.json(
    { signedIn: true, ...profile },
    { headers: { "cache-control": "no-store" } },
  );
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const email = session?.user?.email;
  if (!session?.userId || !email) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: { role?: unknown; interests?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  // Validate against the known taxonomy (mirrors the /start persona picker).
  if (!ROLES.includes(body.role as Role)) {
    return NextResponse.json({ error: "invalid role" }, { status: 400 });
  }
  const interests = Array.isArray(body.interests)
    ? body.interests.filter((i): i is string => INTERESTS.includes(i as never))
    : [];

  await saveProfile(session.userId, {
    role: body.role,
    interests,
    completedAt: new Date().toISOString(),
  });

  // Enrol customers (not staff) into the marketing/announcement audience.
  // Best-effort — never block profile completion on Resend.
  if (!isStaffEmail(email)) {
    await addToAudience(HARBOUR_MEMBERS_AUDIENCE, email.toLowerCase().trim());
  }

  // Welcome knots for joining the crew — once per member (idempotent), lands
  // them at their first unlocked knot (the bowline). Best-effort; never blocks.
  await awardKnots(session.userId, "profile_completed", 20, { once: true });

  return NextResponse.json(
    { ok: true },
    { headers: { "cache-control": "no-store" } },
  );
}
