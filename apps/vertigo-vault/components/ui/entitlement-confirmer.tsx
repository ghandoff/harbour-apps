"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

/**
 * EntitlementConfirmer — closes the Stripe-webhook race window on the
 * checkout success page.
 *
 * Stripe webhook delivery usually lands in <2s, but can take 15-30s under
 * load. If a user clicks "browse activities" the moment they land on
 * /checkout/success — which they will, because they're excited — and the
 * click beats the webhook, they see the teaser view (no entitlement yet),
 * assume the purchase failed, and email support.
 *
 * This component polls /api/vault/tier with exponential backoff for up to
 * ~16s. Before the entitlement is visible it renders a "confirming your
 * access" state with no CTA, so the user can't accidentally race the
 * webhook. Once tier flips to "entitled" or above, it swaps to the
 * welcome state with a "browse activities" CTA.
 *
 * Backoff schedule: 500ms → 1s → 2s → 4s → 8s (sum 15.5s). After that
 * we surface a manual reload affordance — by then either Stripe failed
 * to deliver (rare; webhook retry covers it) or the user navigated away.
 */

const POLL_DELAYS_MS = [500, 1000, 2000, 4000, 8000];

type Phase = "confirming" | "confirmed" | "timeout";

interface EntitlementConfirmerProps {
  packName: string;
  packDetailHref: string;
}

export default function EntitlementConfirmer({
  packName,
  packDetailHref,
}: EntitlementConfirmerProps) {
  const [phase, setPhase] = useState<Phase>("confirming");

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      for (const delay of POLL_DELAYS_MS) {
        await new Promise((r) => setTimeout(r, delay));
        if (cancelled) return;
        try {
          const res = await fetch("/api/vault/tier", {
            cache: "no-store",
            credentials: "include",
          });
          if (!res.ok) continue;
          const data = (await res.json()) as { tier?: string };
          if (
            data.tier === "entitled" ||
            data.tier === "practitioner" ||
            data.tier === "internal"
          ) {
            if (!cancelled) setPhase("confirmed");
            return;
          }
          // tier is still teaser — webhook hasn't landed yet, keep polling
        } catch {
          // network blip; the next delay covers retries
        }
      }
      if (!cancelled) setPhase("timeout");
    }

    poll();
    return () => {
      cancelled = true;
    };
  }, []);

  if (phase === "confirming") {
    return (
      <>
        <h1
          className="text-2xl font-bold mb-2"
          style={{ color: "var(--vault-text)" }}
        >
          confirming your access…
        </h1>
        <p
          className="text-sm mb-8 leading-relaxed"
          style={{ color: "var(--vault-text-muted)" }}
        >
          your payment is in. we&apos;re activating {packName} now — usually
          takes a few seconds.
        </p>
        <div
          aria-live="polite"
          className="inline-flex items-center gap-2 text-xs"
          style={{ color: "var(--vault-text-muted)" }}
        >
          <span
            className="inline-block w-2 h-2 rounded-full animate-pulse"
            style={{ backgroundColor: "var(--vault-accent)" }}
          />
          working on it…
        </div>
      </>
    );
  }

  if (phase === "confirmed") {
    return (
      <>
        <h1
          className="text-2xl font-bold mb-2"
          style={{ color: "var(--vault-text)" }}
        >
          welcome to {packName}!
        </h1>
        <p
          className="text-sm mb-8 leading-relaxed"
          style={{ color: "var(--vault-text-muted)" }}
        >
          your purchase is confirmed. you now have full access to all
          activities included in this pack.
        </p>
        <Link
          href="/"
          className="inline-block w-full rounded-lg px-5 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: "var(--vault-accent)" }}
        >
          browse activities
        </Link>
        <div className="mt-6">
          <Link
            href={packDetailHref}
            className="text-xs underline transition-opacity hover:opacity-80"
            style={{ color: "var(--vault-text-muted)" }}
          >
            view your pack details
          </Link>
        </div>
      </>
    );
  }

  // timeout — webhook hasn't reported the entitlement yet. Stripe will
  // retry on its own; tell the user to refresh in a moment.
  return (
    <>
      <h1
        className="text-2xl font-bold mb-2"
        style={{ color: "var(--vault-text)" }}
      >
        purchase confirmed
      </h1>
      <p
        className="text-sm mb-8 leading-relaxed"
        style={{ color: "var(--vault-text-muted)" }}
      >
        your payment landed with Stripe. activating your access is taking a
        little longer than usual — please refresh in a moment, or email{" "}
        <a href="mailto:hello@windedvertigo.com" className="underline">
          hello@windedvertigo.com
        </a>{" "}
        if it doesn&apos;t show up.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="inline-block w-full rounded-lg px-5 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
        style={{ backgroundColor: "var(--vault-accent)" }}
      >
        refresh
      </button>
    </>
  );
}
