/**
 * POST /api/access-codes/redeem
 *
 * Self-service code redemption — signed-in users submit a code to unlock packs.
 *
 * Request body: { code: string }
 *
 * Responses:
 *   200 { redeemed: true, packCount: N }
 *   200 { redeemed: true, alreadyRedeemed: true }  — idempotent repeat
 *   400 { error: "code_required" }
 *   401 { error: "unauthorized" }
 *   404 { error: "not_found" }      — code doesn't exist / is revoked
 *   410 { error: "expired" }        — code past expires_at
 *   409 { error: "limit_reached" }  — max_uses exhausted
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { validateAndRedeem } from "@/lib/queries/access-codes";

export async function POST(req: NextRequest) {
  const session = await requireAuth();

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const code = typeof body.code === "string" ? body.code.trim() : "";
  if (!code) {
    return NextResponse.json({ error: "code_required" }, { status: 400 });
  }

  try {
    const result = await validateAndRedeem(code, session.userId);

    if (!result.success) {
      const statusMap: Record<string, number> = {
        not_found:      404,
        expired:        410,
        limit_reached:  409,
        already_redeemed: 200,
        revoked:        404,
      };
      const status = statusMap[result.error ?? "not_found"] ?? 400;

      // already_redeemed is treated as success (idempotent)
      if (result.error === "already_redeemed") {
        return NextResponse.json({ redeemed: true, alreadyRedeemed: true });
      }

      return NextResponse.json(
        { error: result.error },
        { status },
      );
    }

    // Fetch pack count for the success message
    const packCount = (result.code?.pack_names?.length) ?? 0;
    return NextResponse.json({ redeemed: true, packCount, campaign: result.code?.campaign });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "redemption failed";
    console.error("[access-codes/redeem]", msg);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
