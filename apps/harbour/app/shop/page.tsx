/**
 * /harbour/shop — the Shipwright's Dock storefront.
 *
 * Each app is a boat in the harbour bay (its real SVG where one exists, else a
 * procedural fallback), flying a flag with the app's icon. Click a boat to pull
 * it to the dock and fit upgrades (its packs). Boats are the apps; packs are the
 * upgrades you bring aboard.
 *
 * This server component does the data work — sellable packs + ownership +
 * role-based "fit for you" — and hands a plain BoatVM[] to the ShipyardDock
 * client island. Commerce (BuyButton → /api/checkout → webhook → entitlement)
 * is unchanged. getAvailablePacks already excludes packs the user owns; owned
 * ones are merged back in per boat and shown as "fitted".
 *
 * Deep-link /harbour/shop?app=<slug> narrows to one boat.
 */

import Link from "next/link";
import {
  getAvailablePacks,
  getOwnedPacks,
  isInDevelopment,
  type Pack,
} from "@/lib/queries/membership";
import { recommendFromRoles } from "@/lib/pier-data";
import { getViewer } from "@/lib/viewer";
import { boatFor } from "@/lib/shop-boats";
import { ShipyardDock, type BoatVM, type PackVM } from "./shipyard-dock";

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

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ app?: string }>;
}) {
  const { app: appFilter } = await searchParams;

  // The effective viewer — honours a staff member's "view as <persona>" cookie,
  // so the shop renders from that perspective (gating + CTA). Real data reads
  // use the real user only when NOT previewing a persona.
  const viewer = await getViewer();
  const { effective, persona } = viewer;
  const signedIn = effective.signedIn;
  const staff = effective.staff;
  const dataUserId = persona ? undefined : viewer.realUserId;

  const [available, owned] = await Promise.all([
    // Collective (staff) members see in-development boats so they can build them
    // out; the public + PRME members only see launched apps.
    getAvailablePacks(dataUserId, { includePreview: staff }),
    signedIn && !persona && viewer.realUserId
      ? getOwnedPacks(viewer.realUserId)
      : Promise.resolve([] as Pack[]),
  ]);

  const recommendedApps =
    signedIn && !staff ? recommendFromRoles(effective.roles) : [];

  const sellable = available.filter((p) => p.priceCents && p.priceCents > 0);

  // Group owned + sellable packs by app.
  const apps = new Map<string, { owned: Pack[]; avail: Pack[] }>();
  for (const p of owned) {
    const g = apps.get(p.app) ?? { owned: [], avail: [] };
    g.owned.push(p);
    apps.set(p.app, g);
  }
  for (const p of sellable) {
    const g = apps.get(p.app) ?? { owned: [], avail: [] };
    g.avail.push(p);
    apps.set(p.app, g);
  }

  let boats: BoatVM[] = [...apps.entries()]
    .filter(([, g]) => g.avail.length > 0 || g.owned.length > 0)
    .map(([app, g]) => {
      const packs: PackVM[] = [
        ...g.owned.map((p) => ({ packCacheId: p.packCacheId, title: p.title, price: null, owned: true })),
        ...g.avail.map((p) => ({ packCacheId: p.packCacheId, title: p.title, price: formatPrice(p.priceCents, p.currency), owned: false })),
      ];
      return {
        ...boatFor(app),
        packs,
        recommended: recommendedApps.includes(app),
        inDevelopment: isInDevelopment(app),
      };
    })
    .sort((a, b) => Number(b.recommended) - Number(a.recommended) || a.label.localeCompare(b.label));

  if (appFilter) boats = boats.filter((b) => b.slug === appFilter);

  return (
    <main
      id="main"
      className="min-h-screen"
      style={{ background: "linear-gradient(180deg, var(--wv-cadet) 0%, #161e2e 100%)" }}
    >
      <div className="mx-auto max-w-[1120px]">
        <header className="px-6 sm:px-10 pt-9">
          <p className="text-xs font-semibold tracking-[0.3em] text-[var(--color-accent-on-dark)]">
            the harbour shop
          </p>
          <h1 className="mt-1.5 text-4xl font-extrabold tracking-tight text-[var(--color-text-on-dark)]">
            the shipwright&rsquo;s dock
          </h1>
          <p className="mt-2 max-w-[48ch] text-[15px] leading-relaxed text-[var(--color-text-on-dark-muted)]">
            your boats are the apps. pull one up to the dock and fit it with upgrades — no
            rush, no tricks; browse the whole harbour first.
          </p>

          {staff && (
            <p className="mt-5 rounded-xl border border-[var(--wv-champagne)]/30 bg-[var(--wv-champagne)]/10 px-4 py-3 text-sm text-[var(--color-text-on-dark-muted)]">
              ⚓ you&rsquo;re crew — every boat is already aboard. this is what members see.
            </p>
          )}
          {!signedIn && (
            <p className="mt-5 rounded-xl border border-[var(--wv-champagne)]/30 bg-[var(--wv-champagne)]/10 px-4 py-3 text-sm text-[var(--color-text-on-dark-muted)]">
              <Link href="/login?callbackUrl=/shop" className="font-semibold text-[var(--wv-champagne)] hover:opacity-80">
                sign in
              </Link>{" "}
              to bring a boat aboard — your packs unlock instantly across the harbour.
            </p>
          )}
        </header>

        {boats.length === 0 ? (
          <p className="px-6 sm:px-10 py-16 text-sm text-[var(--color-text-on-dark-muted)]">
            no boats moored here yet — check back soon.
          </p>
        ) : (
          <ShipyardDock boats={boats} signedIn={signedIn} />
        )}

        <footer className="px-6 sm:px-10 pb-8 pt-4 text-xs text-[var(--color-text-on-dark-muted)]">
          <p className="max-w-[52ch] leading-relaxed">
            coming soon: earn knots as you play and put them toward upgrades, and try each
            boat with a free sample before you fit it.
          </p>
          <Link href="/" className="mt-2 inline-block hover:text-[var(--wv-champagne)] transition-colors">
            ← back to harbour
          </Link>
        </footer>
      </div>
    </main>
  );
}
