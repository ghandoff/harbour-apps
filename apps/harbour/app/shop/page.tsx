/**
 * /harbour/shop — the central harbour storefront, as boats moored at piers.
 *
 * Each sellable pack is rendered as a "boat" card wearing its app's own accent
 * colour, moored at its content pier (leadership / classroom / family) — the
 * same three-pier taxonomy the hub landing page uses (PIER_MAP in pier-data.ts).
 * This echoes the hub's bobbing-boats scene instead of the old generic dark
 * list. Non-extractive by design: honest prices, no fake urgency, a quiet
 * "a fit for you" pennant for boats that match your role, and a "take a look"
 * link so you can visit a boat before bringing it aboard.
 *
 * Boat identity (accent / tagline / display label / href) comes from the
 * canonical HARBOUR_APPS registry; pier grouping from PIER_MAP. Sellable packs
 * + ownership come from the shared catalogue (getAvailablePacks already excludes
 * what the signed-in user owns; owned boats show separately as "docked").
 *
 * Deep-link: /harbour/shop?app=<slug> narrows to one app.
 */

import type { CSSProperties } from "react";
import Link from "next/link";
import { HARBOUR_APPS } from "@windedvertigo/auth/harbour-apps-data";
import { auth } from "@/lib/auth";
import {
  getAvailablePacks,
  getOwnedPacks,
  getProfile,
  isStaffEmail,
  type Pack,
} from "@/lib/queries/membership";
import { PIER_MAP, recommendFromRoles, type Pier } from "@/lib/pier-data";
import { BuyButton } from "./buy-button";

export const dynamic = "force-dynamic";

/** Boat identity from the canonical app registry, keyed by app slug. */
interface BoatMeta {
  accent: string;
  tagline: string;
  label: string;
  href: string;
}
const BOATS = new Map<string, BoatMeta>(
  HARBOUR_APPS.map((a) => [
    a.key,
    { accent: a.accent, tagline: a.tagline, label: a.label, href: a.href },
  ]),
);

/** The piers a shopper browses, in order, with their sign + audience copy. */
const PIERS: { id: Pier; sign: string; sub: string; audience: string }[] = [
  {
    id: "leadership",
    sign: "leadership",
    sub: "for facilitators & leaders",
    audience: "tools for workshops, teams, and grown-up rooms.",
  },
  {
    id: "classroom",
    sign: "classroom",
    sub: "for the classroom",
    audience: "the same tools, sized for students and courses.",
  },
  {
    id: "family",
    sign: "family",
    sub: "for families & play",
    audience: "cards, decks, and games for playing together.",
  },
  {
    id: "drydock",
    sign: "dry dock",
    sub: "newly fitted out",
    audience: "boats not yet assigned a pier — take a look.",
  },
];

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

/** The pier a pack moors at: its app's first PIER_MAP entry, else dry dock. */
function pierFor(app: string): Pier {
  return PIER_MAP[app]?.[0] ?? "drydock";
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ app?: string }>;
}) {
  const { app: appFilter } = await searchParams;
  const session = await auth();
  const email = session?.user?.email ?? null;
  const signedIn = !!email && !!session?.userId;
  const staff = isStaffEmail(email);

  const [available, owned] = await Promise.all([
    getAvailablePacks(session?.userId),
    signedIn ? getOwnedPacks(session!.userId) : Promise.resolve([] as Pack[]),
  ]);

  // "a fit for you" — boats whose pier matches the member's stated role.
  // Personalisation only; never blocks or reorders, just adds a quiet pennant.
  let recommendedApps: string[] = [];
  if (signedIn && !staff) {
    try {
      const profile = await getProfile(session!.userId);
      const prefs = profile.playPreferences ?? {};
      const roles = Array.isArray(prefs.roles)
        ? (prefs.roles as string[])
        : typeof prefs.role === "string"
          ? [prefs.role as string]
          : [];
      recommendedApps = recommendFromRoles(roles);
    } catch {
      // recommendations are a nice-to-have — never fail the shop over them.
    }
  }

  // Only sellable packs (a price set); optionally narrow to a deep-linked app.
  let sellable = available.filter((p) => p.priceCents && p.priceCents > 0);
  if (appFilter) sellable = sellable.filter((p) => p.app === appFilter);

  // Group sellable packs into their piers, preserving PIERS order.
  const byPier = new Map<Pier, Pack[]>();
  for (const p of sellable) {
    const pier = pierFor(p.app);
    const list = byPier.get(pier) ?? [];
    list.push(p);
    byPier.set(pier, list);
  }
  const piersWithStock = PIERS.filter((pier) => (byPier.get(pier.id)?.length ?? 0) > 0);

  const filterLabel = appFilter ? BOATS.get(appFilter)?.label ?? appFilter : null;

  return (
    <main
      id="main"
      className="min-h-screen"
      style={{
        background:
          "linear-gradient(180deg, var(--wv-cadet) 0%, var(--color-surface-raised) 100%)",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-12 sm:py-16 space-y-12">
        <header className="space-y-2 max-w-2xl">
          <p className="text-xs font-semibold tracking-[0.25em] uppercase text-[var(--color-accent-on-dark)]">
            the harbour shop
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-[var(--color-text-on-dark)] tracking-tight">
            {filterLabel ? <>packs for {filterLabel}</> : "every boat in the harbour"}
          </h1>
          <p className="text-base text-[var(--color-text-on-dark-muted)] leading-relaxed">
            bring aboard what you need — one purchase unlocks across the whole
            harbour. no rush, no tricks; take a look around first.
          </p>
        </header>

        {staff && (
          <section className="rounded-2xl border border-[var(--wv-champagne)]/30 bg-[var(--wv-champagne)]/10 px-5 py-4">
            <p className="text-sm text-[var(--color-text-on-dark-muted)]">
              ⚓ you&apos;re crew — every boat is already aboard. this is what
              members see.
            </p>
          </section>
        )}

        {!signedIn && (
          <section className="rounded-2xl border border-[var(--wv-champagne)]/30 bg-[var(--wv-champagne)]/10 px-5 py-4">
            <p className="text-sm text-[var(--color-text-on-dark-muted)]">
              <Link
                href="/login?callbackUrl=/shop"
                className="text-[var(--wv-champagne)] font-semibold hover:opacity-80"
              >
                sign in
              </Link>{" "}
              to bring a boat aboard — your packs unlock instantly across the harbour.
            </p>
          </section>
        )}

        {piersWithStock.length === 0 ? (
          <p className="text-sm text-[var(--color-text-on-dark-muted)]">
            no boats moored here yet — check back soon.
          </p>
        ) : (
          piersWithStock.map((pier) => {
            const packs = byPier.get(pier.id)!;
            return (
              <section
                key={pier.id}
                aria-label={`${pier.sign} pier`}
                className="boardwalk-plank rounded-2xl px-4 sm:px-8 py-10 sm:py-12"
              >
                <header className="mb-8 max-w-2xl">
                  <p className="boardwalk-label-sub">{pier.sub}</p>
                  <h2 className="boardwalk-label">{pier.sign}</h2>
                  <p className="mt-3 text-sm text-[var(--color-text-on-dark-muted)] leading-relaxed">
                    {pier.audience}
                  </p>
                </header>

                <ul
                  role="list"
                  className="grid gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3"
                >
                  {packs.map((p, i) => {
                    const boat = BOATS.get(p.app);
                    const accent = boat?.accent ?? "rgba(255,255,255,0.4)";
                    const price = formatPrice(p.priceCents, p.currency);
                    const isFit = recommendedApps.includes(p.app);
                    return (
                      <li key={p.packCacheId}>
                        <article
                          className="boat-card boat-bob h-full rounded-2xl p-5 sm:p-6 flex flex-col justify-between gap-4"
                          style={
                            {
                              "--boat-accent": accent,
                              animationDelay: `${(i % 4) * 0.6}s`,
                            } as CSSProperties
                          }
                        >
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between gap-2">
                              <p
                                className="text-xs font-semibold lowercase tracking-wide"
                                style={{ color: accent }}
                              >
                                {boat?.label ?? p.app}
                              </p>
                              {isFit && (
                                <span className="fit-pennant text-[10px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap">
                                  a fit for you
                                </span>
                              )}
                            </div>
                            <h3 className="text-base sm:text-lg font-bold text-[var(--color-text-on-dark)] leading-tight">
                              {p.title}
                            </h3>
                            {boat?.tagline && (
                              <p className="text-xs sm:text-sm text-[var(--color-text-on-dark-muted)] leading-snug">
                                {boat.tagline}
                              </p>
                            )}
                          </div>

                          <div className="space-y-3">
                            <div className="flex items-center justify-between gap-3">
                              {price && (
                                <span className="price-tag text-lg font-bold">
                                  {price}
                                </span>
                              )}
                              {signedIn ? (
                                <BuyButton
                                  packCacheId={p.packCacheId}
                                  label="bring aboard"
                                />
                              ) : (
                                <Link
                                  href="/login?callbackUrl=/shop"
                                  className="shrink-0 text-xs font-medium text-[var(--wv-champagne)] hover:opacity-80"
                                >
                                  sign in to buy →
                                </Link>
                              )}
                            </div>
                            {boat?.href && (
                              <Link
                                href={boat.href.replace(/^\/harbour/, "")}
                                className="inline-block text-xs text-[var(--color-text-on-dark-muted)] hover:text-[var(--color-text-on-dark)] underline-offset-4 hover:underline"
                              >
                                take a look →
                              </Link>
                            )}
                          </div>
                        </article>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })
        )}

        {owned.length > 0 && (
          <section className="space-y-4 border-t border-white/10 pt-8">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-text-on-dark-muted)]">
              docked — already in your harbour
            </h2>
            <ul role="list" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {owned.map((p) => {
                const boat = BOATS.get(p.app);
                const accent = boat?.accent ?? "rgba(255,255,255,0.4)";
                return (
                  <li
                    key={p.packCacheId}
                    className="boat-card rounded-xl px-4 py-3 flex items-center justify-between gap-3"
                    style={{ "--boat-accent": accent } as CSSProperties}
                  >
                    <span className="text-sm text-[var(--color-text-on-dark)] min-w-0 truncate">
                      {p.title}
                    </span>
                    <span className="text-xs text-[var(--wv-champagne)] shrink-0">
                      ⚓ docked
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {/* Honest signposts — no fake buttons. Knots redemption + free samples
            are on the way; we say so plainly rather than implying they work. */}
        <footer className="border-t border-white/10 pt-6 space-y-2">
          <p className="text-xs text-[var(--color-text-on-dark-muted)] leading-relaxed max-w-2xl">
            coming soon: earn knots as you play and put them toward packs, and
            try each boat with a free sample before you buy.
          </p>
          <Link
            href="/"
            className="inline-block text-xs text-[var(--color-text-on-dark-muted)] hover:text-[var(--wv-champagne)] transition-colors"
          >
            ← back to harbour
          </Link>
        </footer>
      </div>
    </main>
  );
}
