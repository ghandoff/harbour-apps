import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getProfile, saveProfile, isStaffEmail } from "@/lib/queries/membership";
import { addToAudience, HARBOUR_MEMBERS_AUDIENCE } from "@/lib/resend-audience";
import { awardKnots } from "@/lib/knots";

/**
 * /harbour/api/profile
 *
 * GET  — current profile state for the signed-in user.
 * POST — save the profile (the aboard→crew gateway): records roles + intent
 *        (both multi-select) in play_preferences, flips onboarding_completed,
 *        and enrols non-staff members into the harbour-members Resend audience.
 *
 * Session-dependent → never cache.
 */
export const dynamic = "force-dynamic";

const ROLES = ["facilitator", "educator", "parent-caregiver", "explorer"] as const;
const INTENT = ["run-session", "rethink-assessment", "play-family", "get-inspired"] as const;

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

  let body: { roles?: unknown; intent?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  // Validate against the known taxonomy; both are multi-select.
  const roles = Array.isArray(body.roles)
    ? body.roles.filter((r): r is string => ROLES.includes(r as never))
    : [];
  if (roles.length === 0) {
    return NextResponse.json({ error: "pick at least one role" }, { status: 400 });
  }
  const intent = Array.isArray(body.intent)
    ? body.intent.filter((i): i is string => INTENT.includes(i as never))
    : [];

  await saveProfile(session.userId, {
    roles,
    intent,
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
