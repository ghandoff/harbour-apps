/**
 * GET /api/vault/tier — return the caller's current vault access tier.
 *
 * Used by the checkout-success page poller (components/ui/entitlement-confirmer.tsx)
 * to detect when the Stripe webhook has processed the new purchase and the
 * entitlement is visible. Polled with exponential backoff for ~10s after a
 * successful checkout redirect.
 *
 * Returns 200 always when signed in (tier="teaser" for unauthenticated-
 * adjacent edge cases, or the resolved tier for entitled users), 401 if
 * the caller has no session at all. Never throws — the poller treats
 * non-200 as "keep trying", so resilient handling here keeps the UX smooth.
 */

import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-helpers";
import { resolveVaultTier } from "@/lib/queries/vault";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: "unauthorized" },
        { status: 401, headers: { "cache-control": "no-store" } },
      );
    }

    const tier = await resolveVaultTier(
      session.orgId ?? null,
      session.userId ?? null,
      session.isInternal ?? false,
    );

    return NextResponse.json(
      { tier },
      { status: 200, headers: { "cache-control": "no-store" } },
    );
  } catch (err) {
    console.error("[api/vault/tier] resolve failed:", err);
    // Return 500 with a payload so the poller can decide to retry vs. show
    // an error state. Don't leak error details.
    return NextResponse.json(
      { error: "tier lookup failed" },
      { status: 500, headers: { "cache-control": "no-store" } },
    );
  }
}
