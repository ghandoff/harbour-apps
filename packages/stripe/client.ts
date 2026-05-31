/**
 * Stripe SDK singleton — shared across all harbour apps.
 *
 * Initialised lazily from STRIPE_SECRET_KEY.
 * All harbour apps share the same Stripe account.
 */

import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }
    // CRITICAL on Cloudflare Workers: the Stripe SDK defaults to Node's `http`
    // module, which doesn't exist on Workers — every API call then fails with
    // "An error occurred with our connection to Stripe." Use the fetch-based
    // HTTP client (global fetch is available on Workers). Webhook signature
    // verification already uses constructEventAsync (Workers-safe), so this is
    // the remaining piece for outbound calls (checkout sessions, customers).
    _stripe = new Stripe(key, {
      httpClient: Stripe.createFetchHttpClient(),
    });
  }
  return _stripe;
}
