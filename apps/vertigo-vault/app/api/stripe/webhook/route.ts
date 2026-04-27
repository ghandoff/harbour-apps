/**
 * POST /api/stripe/webhook — Handle Stripe webhook events.
 *
 * The actual processing logic lives in lib/stripe/webhook-handler.ts so
 * it can be invoked directly from the admin replay route. This file is
 * a thin wrapper that adds the DLQ + dedup layer per Gate A.1
 * (Cloudflare KV-backed; degrades to passthrough on Vercel).
 *
 * Webhook flow:
 * 1. Verify webhook signature
 * 2. Confirm payment_status === "paid"
 * 3. Check idempotency (no duplicate purchases)
 * 4. Atomically create purchase record + grant entitlement
 * 5. Send purchase-confirmation email via Resend
 */

import { withDLQ } from "@/lib/webhook-dlq";
import { resolveStripeDLQStore } from "@/lib/stripe/dlq-store";
import { handleStripeWebhook } from "@/lib/stripe/webhook-handler";

export const POST = withDLQ(handleStripeWebhook, {
  getStore: resolveStripeDLQStore,
});
