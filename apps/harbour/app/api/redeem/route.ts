/**
 * POST /harbour/api/redeem — public access-code redemption (the harbour hub is
 * the public host; the creaseworks endpoint is hidden behind "coming soon").
 *
 * Requires sign-in (entitlements are user-keyed + persist cross-device). Rate-
 * limited per user. On success grants the code's pack entitlements.
 *
 *   200 { redeemed:true, alreadyRedeemed, packCount, campaign }
 *   400 code_required/invalid_json · 401 unauthorized · 404 not_found
 *   409 limit_reached · 410 expired · 429 rate_limited · 500 internal_error
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  validateAndRedeem,
  tooManyRedeemAttempts,
  recordRedeemAttempt,
} from "@/lib/queries/access-codes";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email || !session.userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const userId = session.userId;

  if (await tooManyRedeemAttempts(userId)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }
  await recordRedeemAttempt(userId);

  let body: { code?: unknown };
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
    const result = await validateAndRedeem(code, userId);
    if (!result.success) {
      const statusMap: Record<string, number> = {
        not_found: 404,
        expired: 410,
        limit_reached: 409,
      };
      return NextResponse.json(
        { error: result.error },
        { status: statusMap[result.error ?? "not_found"] ?? 400 },
      );
    }
    return NextResponse.json({
      redeemed: true,
      alreadyRedeemed: result.alreadyRedeemed ?? false,
      packCount: result.packCount ?? 0,
      campaign: result.campaign,
    });
  } catch (err) {
    console.error("[harbour/redeem]", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
