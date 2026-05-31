/**
 * /harbour/checkout/success — post-purchase confirmation.
 *
 * Stripe redirects here after a completed Checkout (the entitlement is granted
 * asynchronously by the webhook, so we confirm warmly and point the member at
 * their account / the apps; the pack appears under /account once the webhook
 * lands, typically within seconds).
 */

import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ pack?: string }>;
}) {
  const { pack } = await searchParams;

  return (
    <main id="main" className="min-h-screen px-6 py-16">
      <div className="max-w-md mx-auto space-y-6 text-center">
        <p className="text-4xl" aria-hidden>
          ⚓
        </p>
        <h1 className="text-2xl font-bold text-[var(--color-text-on-dark)]">
          you&apos;re aboard
        </h1>
        <p className="text-base text-[var(--color-text-on-dark-muted)] leading-relaxed">
          {pack ? <>thanks for buying <span className="text-[var(--color-text-on-dark)]">{pack}</span>. </> : "thanks for your purchase. "}
          your access unlocks across the harbour within a few seconds — it&apos;ll
          appear under your account.
        </p>
        <div className="flex flex-col gap-2">
          <Link
            href="/account"
            className="inline-block bg-[var(--wv-champagne)] text-[var(--wv-cadet)] font-semibold py-3 px-6 rounded-lg hover:opacity-90 transition-opacity"
          >
            go to your account
          </Link>
          <Link
            href="/"
            className="text-sm text-[var(--color-text-on-dark-muted)] hover:text-[var(--wv-champagne)] transition-colors"
          >
            ← back to harbour
          </Link>
        </div>
      </div>
    </main>
  );
}
