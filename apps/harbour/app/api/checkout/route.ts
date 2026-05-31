/**
 * POST /api/checkout — central harbour storefront checkout.
 *
 * Unlike the per-app checkout routes (which filter to their own app), the
 * harbour storefront sells packs on behalf of ANY harbour app: it looks up the
 * pack by id across the whole catalogue and hands the pack's OWNING app to
 * createHarbourCheckout, so the purchase + entitlement are attributed correctly.
 * Entitlements key on pack_cache_id, so a pack bought here unlocks in its app.
 *
 * Requires a session. Returns { url } (the Stripe Checkout URL).
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sql } from "@/lib/db";
import { createHarbourCheckout, checkEntitlement } from "@windedvertigo/stripe";

export const dynamic = "force-dynamic";

// The storefront lives at the harbour root; success/cancel return here.
const HARBOUR_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://windedvertigo.com/harbour";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email || !session.userId) {
    return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const { packCacheId } = body as { packCacheId?: string };
  if (!packCacheId || typeof packCacheId !== "string") {
    return NextResponse.json({ error: "packCacheId is required" }, { status: 400 });
  }

  // Central lookup — any visible, sellable pack regardless of which app owns it.
  const packResult = await sql.query(
    `SELECT pc.id          AS pack_cache_id,
            pc.title       AS title,
            cat.id         AS catalogue_id,
            cat.app        AS app,
            cat.price_cents AS price_cents,
            cat.currency    AS currency,
            cat.stripe_price_id AS stripe_price_id
       FROM packs_cache pc
       JOIN packs_catalogue cat ON cat.pack_cache_id = pc.id
      WHERE pc.id = $1
        AND cat.visible = TRUE
      LIMIT 1`,
    [packCacheId],
  );
  const pack = packResult.rows[0];
  if (!pack) {
    return NextResponse.json({ error: "pack not found" }, { status: 404 });
  }
  if (!pack.price_cents || pack.price_cents <= 0) {
    return NextResponse.json(
      { error: "this pack is not available for purchase" },
      { status: 400 },
    );
  }

  // Don't let someone re-buy what they already hold.
  const alreadyEntitled = await checkEntitlement(
    session.orgId ?? null,
    packCacheId,
    session.userId,
  );
  if (alreadyEntitled) {
    return NextResponse.json(
      { error: "you already have access to this pack" },
      { status: 400 },
    );
  }

  try {
    const url = await createHarbourCheckout({
      app: pack.app, // the pack's owning app — for attribution + the customer description
      appUrl: HARBOUR_URL, // success/cancel return to the harbour storefront
      userId: session.userId,
      email: session.user.email,
      userName: session.user.name,
      orgId: session.orgId,
      orgName: session.orgName,
      packCacheId: pack.pack_cache_id,
      catalogueId: pack.catalogue_id,
      packTitle: pack.title,
      priceCents: pack.price_cents,
      currency: pack.currency || "USD",
      stripePriceId: pack.stripe_price_id ?? undefined,
      successPath: "/checkout/success",
      cancelPath: "/shop",
    });
    return NextResponse.json({ url });
  } catch (err) {
    console.error("[harbour] checkout error:", err);
    return NextResponse.json(
      { error: "failed to create checkout session" },
      { status: 500 },
    );
  }
}
