/**
 * /harbour/shop — the central harbour storefront.
 *
 * Reads the cross-app packs catalogue (the same getAvailablePacks/getOwnedPacks
 * the /account dashboard uses) and renders sellable packs grouped by app, with
 * a buy button per pack. Anonymous visitors browse + are prompted to sign in;
 * signed-in members see owned packs marked and can purchase the rest.
 *
 * Deep-link: /harbour/shop?app=<slug> filters to one app (the per-app
 * free-sample wall links here).
 */

import Link from "next/link";
import { auth } from "@/lib/auth";
import {
  getAvailablePacks,
  getOwnedPacks,
  type Pack,
} from "@/lib/queries/membership";
import { BuyButton } from "./buy-button";

export const dynamic = "force-dynamic";

function formatPrice(cents: number | null, currency: string): string | null {
  if (cents == null) return null;
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
    }).format(cents / 100);
  } catch {
    return `${(cents / 100).toFixed(2)} ${currency}`;
  }
}

function groupByApp(packs: Pack[]): [string, Pack[]][] {
  const map = new Map<string, Pack[]>();
  for (const p of packs) {
    const list = map.get(p.app) ?? [];
    list.push(p);
    map.set(p.app, list);
  }
  return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ app?: string }>;
}) {
  const { app: appFilter } = await searchParams;
  const session = await auth();
  const signedIn = !!session?.user?.email && !!session.userId;

  const [available, owned] = await Promise.all([
    getAvailablePacks(session?.userId),
    signedIn ? getOwnedPacks(session!.userId) : Promise.resolve([] as Pack[]),
  ]);

  // Only sellable packs (a price set); optionally narrow to a deep-linked app.
  let sellable = available.filter((p) => p.priceCents && p.priceCents > 0);
  if (appFilter) sellable = sellable.filter((p) => p.app === appFilter);

  return (
    <main id="main" className="min-h-screen px-6 py-12">
      <div className="max-w-2xl mx-auto space-y-8">
        <header className="space-y-1">
          <h1 className="text-2xl font-bold text-[var(--color-text-on-dark)]">
            the harbour shop
          </h1>
          <p className="text-sm text-[var(--color-text-on-dark-muted)]">
            {appFilter
              ? `packs for ${appFilter}`
              : "buy access to apps and packs across the harbour"}
          </p>
        </header>

        {!signedIn && (
          <section className="rounded-lg border border-[var(--wv-champagne)]/30 bg-[var(--wv-champagne)]/10 p-5">
            <p className="text-sm text-[var(--color-text-on-dark-muted)]">
              <Link href="/login?callbackUrl=/shop" className="text-[var(--wv-champagne)] font-semibold hover:opacity-80">
                sign in
              </Link>{" "}
              to purchase — your packs unlock instantly across the harbour.
            </p>
          </section>
        )}

        {sellable.length === 0 ? (
          <p className="text-sm text-[var(--color-text-on-dark-muted)]">
            nothing for sale here yet — check back soon.
          </p>
        ) : (
          groupByApp(sellable).map(([app, packs]) => (
            <section key={app} className="space-y-3">
              <h2 className="text-xs uppercase tracking-wide text-[var(--color-text-on-dark-muted)]">
                {app}
              </h2>
              <ul className="space-y-2">
                {packs.map((p) => {
                  const price = formatPrice(p.priceCents, p.currency);
                  return (
                    <li
                      key={p.packCacheId}
                      className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 flex items-center justify-between gap-4"
                    >
                      <div className="min-w-0">
                        <p className="text-sm text-[var(--color-text-on-dark)]">{p.title}</p>
                        {price && (
                          <p className="text-xs text-[var(--color-text-on-dark-muted)]">{price}</p>
                        )}
                      </div>
                      {signedIn ? (
                        <BuyButton packCacheId={p.packCacheId} label={price ? `buy ${price}` : "buy"} />
                      ) : (
                        <Link
                          href="/login?callbackUrl=/shop"
                          className="shrink-0 text-xs font-medium text-[var(--wv-champagne)] hover:opacity-80"
                        >
                          sign in to buy →
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          ))
        )}

        {owned.length > 0 && (
          <section className="space-y-3 border-t border-white/10 pt-6">
            <h2 className="text-sm font-semibold text-[var(--color-text-on-dark)]">
              already yours
            </h2>
            <ul className="space-y-2">
              {owned.map((p) => (
                <li
                  key={p.packCacheId}
                  className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 flex items-baseline justify-between gap-4"
                >
                  <span className="text-sm text-[var(--color-text-on-dark)]">{p.title}</span>
                  <span className="text-xs text-[var(--wv-champagne)]">⚓ owned</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="text-center">
          <Link
            href="/"
            className="text-xs text-[var(--color-text-on-dark-muted)] hover:text-[var(--wv-champagne)] transition-colors"
          >
            ← back to harbour
          </Link>
        </div>
      </div>
    </main>
  );
}
