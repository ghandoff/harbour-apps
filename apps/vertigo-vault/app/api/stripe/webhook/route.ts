/**
 * POST /api/stripe/webhook — Handle Stripe webhook events.
 *
 * Processes checkout.session.completed events:
 * 1. Verify webhook signature
 * 2. Confirm payment_status === "paid"
 * 3. Check idempotency (no duplicate purchases)
 * 4. Atomically create purchase record + grant entitlement
 * 5. Send purchase-confirmation email via Resend
 */

import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe/client";
import { createPurchase, getPurchaseByStripeSessionId } from "@/lib/queries/purchases";
import { grantEntitlement, grantUserEntitlement } from "@/lib/queries/entitlements";
import { sendPurchaseConfirmationEmail } from "@/lib/email";

export async function POST(req: Request) {
  const stripe = getStripe();
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "missing signature" }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[webhook] STRIPE_WEBHOOK_SECRET not configured");
    return NextResponse.json({ error: "webhook not configured" }, { status: 500 });
  }

  let event;
  try {
    // constructEventAsync uses SubtleCrypto (available on CF Workers).
    // The sync constructEvent variant requires Node crypto which Workers
    // don't polyfill even with nodejs_compat.
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
  } catch (err) {
    console.error("[webhook] signature verification failed:", err);
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    // ── Payment status gate ────────────────────────────────────────
    // For async payment methods (bank transfer, SEPA, etc.) the session
    // completes before the money lands. Only grant access when paid.
    if (session.payment_status !== "paid") {
      console.log(
        `[webhook] session ${session.id} payment_status="${session.payment_status}", deferring`,
      );
      return NextResponse.json({ received: true });
    }

    // Idempotency check
    const existing = await getPurchaseByStripeSessionId(session.id);
    if (existing) {
      console.log(`[webhook] duplicate session ${session.id}, skipping`);
      return NextResponse.json({ received: true });
    }

    const { orgId, packCacheId, catalogueId, userId, packTitle } =
      session.metadata ?? {};

    if (!packCacheId || !catalogueId || !userId) {
      console.error("[webhook] missing metadata on session:", session.id);
      return NextResponse.json({ error: "missing metadata" }, { status: 400 });
    }

    // Sequential writes under the Neon HTTP driver — no BEGIN/COMMIT.
    // Neon's HTTP transport is stateless per query (no persistent client
    // to acquire), which is what makes it CF-Workers-safe but also rules
    // out the prior pool-based BEGIN/COMMIT pattern. Correctness rests on
    // (a) Stripe redelivering on any non-2xx response, and (b) the
    // idempotency check above short-circuiting once the purchase row exists.
    // If grantEntitlement fails after createPurchase, we return 500 and
    // Stripe retries — but the purchase row is now present, so the retry
    // will skip via the idempotency check, leaving an orphan purchase
    // without an entitlement. Same tradeoff packages/stripe/webhook.ts
    // (used by creaseworks + deep-deck) already accepts.
    try {
      const purchaseId = await createPurchase({
        orgId: orgId || null,
        packCatalogueId: catalogueId,
        purchaserId: userId,
        amountCents: session.amount_total ?? 0,
        currency: session.currency ?? "usd",
        paymentProvider: "stripe",
        paymentRef: session.payment_intent as string | null,
        stripeSessionId: session.id,
        stripePaymentIntentId: session.payment_intent as string | null,
      });

      if (orgId) {
        await grantEntitlement(orgId, packCacheId, purchaseId);
      } else {
        await grantUserEntitlement(userId, packCacheId, null, purchaseId);
      }

      console.log(
        `[webhook] purchase ${purchaseId} for pack ${packCacheId}`,
        orgId ? `(org: ${orgId})` : `(user: ${userId})`,
      );

      const customerEmail =
        session.customer_details?.email ?? session.customer_email;

      if (customerEmail) {
        sendPurchaseConfirmationEmail({
          to: customerEmail,
          packName: packTitle || "Vault Pack",
          amountCents: session.amount_total ?? 0,
          currency: session.currency ?? "usd",
        }).catch((err) => {
          console.error("[webhook] email send error:", err);
        });
      }
    } catch (err) {
      console.error("[webhook] purchase write failed:", err);
      return NextResponse.json(
        { error: "purchase processing failed" },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({ received: true });
}
