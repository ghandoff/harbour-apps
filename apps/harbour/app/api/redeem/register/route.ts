/**
 * POST /harbour/api/redeem/register — OPTIONAL institutional registration after
 * a successful redemption (ask, don't force). Captures an institutional email +
 * institution, tags the domain, links to a verified org if one exists, and —
 * only with explicit consent — enrols the email in the `ppcs-2026` Resend
 * audience for updates / feedback / future packs. Access does NOT depend on this.
 *
 *   200 { registered:true, linkedInstitution }
 *   400 invalid_json/invalid_email · 401 unauthorized · 500 internal_error
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { registerInstitutional } from "@/lib/queries/institutional";
import { addToAudience } from "@/lib/resend-audience";

export const dynamic = "force-dynamic";

const PPCS_AUDIENCE = "ppcs-2026";
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email || !session.userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: {
    institutionalEmail?: unknown;
    institution?: unknown;
    consent?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const institutionalEmail =
    typeof body.institutionalEmail === "string" ? body.institutionalEmail.trim() : "";
  const institution =
    typeof body.institution === "string" && body.institution.trim()
      ? body.institution.trim()
      : null;
  const consent = body.consent === true;

  if (!EMAIL_RE.test(institutionalEmail)) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }

  try {
    const result = await registerInstitutional({
      userId: session.userId,
      institutionalEmail,
      institution,
      consent,
      campaign: "ppcs-2026",
    });

    // Enrol only with explicit consent (no pre-ticked boxes).
    if (consent) {
      await addToAudience(PPCS_AUDIENCE, institutionalEmail);
    }

    return NextResponse.json({
      registered: true,
      linkedInstitution: result.linkedOrg?.org_name ?? null,
    });
  } catch (err) {
    console.error(
      "[harbour/redeem/register]",
      err instanceof Error ? err.message : err,
    );
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
