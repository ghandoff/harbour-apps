/**
 * POST /api/stripe/webhook — harbour storefront Stripe webhook.
 *
 * Delegates to the shared handler, which verifies the signature, enforces
 * idempotency, records the purchase, and grants the entitlement from the
 * checkout-session metadata (packCacheId / catalogueId / userId) — so it works
 * for cross-app purchases made through the central storefront. The "harbour"
 * arg is the log/email context only; the grant is metadata-driven.
 *
 * Routing note: this is a plain server-to-server POST returning 200, so it
 * should traverse the wv-site proxy like the per-app webhooks do. If a Stripe
 * test event doesn't reach it, add a direct CF route for this path in
 * wrangler.jsonc (the depth-chart/raft-house auth/parties bypass pattern).
 */

import { handleStripeWebhook } from "@windedvertigo/stripe/webhook";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  return handleStripeWebhook(req, "harbour");
}
