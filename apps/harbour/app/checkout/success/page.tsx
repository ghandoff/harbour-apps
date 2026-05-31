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
    <main
      id="main"
      className="min-h-screen px-6 py-16"
      style={{
        background:
          "linear-gradient(180deg, var(--wv-cadet) 0%, var(--color-surface-raised) 100%)",
      }}
    >
      <div className="max-w-md mx-auto space-y-6 text-center">
        <p className="text-4xl" aria-hidden>
          ⚓
        </p>
        <h1 className="text-2xl font-bold text-[var(--color-text-on-dark)]">
          you&apos;re aboard
        </h1>
        <p className="text-base text-[var(--color-text-on-dark-muted)] leading-relaxed">
          {pack ? <>thanks for buying <span className="text-[var(--color-text-on-dark)]">{pack}</span>. </> : "thanks for your purchase. "}
          your boat is moored in your harbour — access unlocks across every app
          within a few seconds and appears under your account.
        </p>
        <div className="flex flex-col gap-2">
          <Link
            href="/account"
            className="inline-flex items-center justify-center gap-2 bg-[var(--wv-sienna)] text-[var(--color-text-on-dark)] font-semibold py-3 px-6 rounded-full border border-white/10 hover:brightness-110 transition-all"
          >
            go to your account
            <span aria-hidden="true">&rarr;</span>
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
