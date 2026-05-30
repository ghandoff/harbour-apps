/**
 * Harbour membership dashboard.
 *
 * Server component. Reads the session via the shared `auth()` helper, then
 * the shared Neon DB for entitlements / packs catalogue / credit balance
 * (see lib/queries/membership.ts). Middleware (`middleware.ts`, matcher
 * includes `/account/:path*`) redirects unauthenticated visitors to /login.
 *
 * Two faces:
 *   - staff (@windedvertigo.com): full-access badge, no commerce.
 *   - customer: credit balance, owned packs, and a discovery list of what's
 *     available across the harbour. Buying is not wired here yet — individual
 *     (org-less) checkout lands in a later phase; for now each available pack
 *     links to the app that owns it.
 */

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  isStaffEmail,
  getCreditBalance,
  getOwnedPacks,
  getAvailablePacks,
  getProfile,
  getCreditLedger,
  type Pack,
  type CreditEntry,
} from "@/lib/queries/membership";
import { getKnotsBalance, getKnotsEarned, rankFor } from "@/lib/knots";

// Session-dependent — never statically cache.
export const dynamic = "force-dynamic";

// Display labels for the profile role values (mirrors the /start taxonomy).
const ROLE_LABELS: Record<string, string> = {
  facilitator: "facilitator",
  educator: "higher-ed educator",
  "parent-caregiver": "parent / play-based educator",
  explorer: "explorer",
};

const INTENT_LABELS: Record<string, string> = {
  "run-session": "run a session",
  "rethink-assessment": "rethink assessment",
  "play-family": "play with my kid",
  "get-inspired": "get inspired",
};

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
  return [...map.entries()];
}

async function signOutAction() {
  "use server";
  const { signOut } = await import("@/lib/auth");
  await signOut({ redirectTo: "/" });
}

export default async function AccountPage() {
  const session = await auth();

  // Defensive — middleware should have caught this, but a direct nav
  // with a stale session can land here without one.
  if (!session?.user?.email) {
    redirect("/login?callbackUrl=/account");
  }

  const email = session.user.email;
  const userId = session.userId;
  const staff = isStaffEmail(email);

  let creditBalance = 0;
  let owned: Pack[] = [];
  let available: Pack[] = [];
  let ledger: CreditEntry[] = [];
  let onboardingCompleted = true;
  let profileRoles: string[] = [];
  let profileIntent: string[] = [];
  let knotsBalance = 0;
  let rank = rankFor(0);
  // Resilient: one failing read degrades its section instead of 500ing the
  // whole dashboard, and logs which query failed (visible in `wrangler tail`).
  const safe = async <T,>(label: string, p: Promise<T>, fallback: T): Promise<T> => {
    try {
      return await p;
    } catch (err) {
      console.error(`[account] ${label} failed:`, err);
      return fallback;
    }
  };

  // The profile (roles/intent) is personalization, not commerce — fetch it for
  // EVERYONE signed in, including staff, so completing it isn't a dead-end for
  // the harbourmaster. Without this, staff complete a profile and /account
  // shows nothing back.
  if (userId) {
    const profile = await safe("getProfile", getProfile(userId), {
      onboardingCompleted: false,
      playPreferences: null,
    });
    onboardingCompleted = profile.onboardingCompleted;
    const prefs = profile.playPreferences ?? {};
    // New shape { roles[], intent[] }; tolerate old { role, interests }.
    profileRoles = Array.isArray(prefs.roles)
      ? (prefs.roles as string[])
      : typeof prefs.role === "string"
        ? [prefs.role]
        : [];
    profileIntent = Array.isArray(prefs.intent)
      ? (prefs.intent as string[])
      : Array.isArray(prefs.interests)
        ? (prefs.interests as string[])
        : [];
  }

  // Commerce + engagement (credits, packs, knots) is customer-only — staff hold
  // everything, so there's nothing to buy and no knots ladder to climb.
  if (!staff && userId) {
    const [bal, own, avail, led, kBal, kEarned] = await Promise.all([
      safe("getCreditBalance", getCreditBalance(userId), 0),
      safe("getOwnedPacks", getOwnedPacks(userId), [] as Pack[]),
      safe("getAvailablePacks", getAvailablePacks(userId), [] as Pack[]),
      safe("getCreditLedger", getCreditLedger(userId), [] as CreditEntry[]),
      safe("getKnotsBalance", getKnotsBalance(userId), 0),
      safe("getKnotsEarned", getKnotsEarned(userId), 0),
    ]);
    knotsBalance = kBal;
    rank = rankFor(kEarned);
    creditBalance = bal;
    owned = own;
    available = avail;
    ledger = led;
  }

  return (
    <main id="main" className="min-h-screen px-6 py-12">
      <div className="max-w-2xl mx-auto space-y-8">
        <header className="space-y-1">
          <h1 className="text-2xl font-bold text-[var(--color-text-on-dark)]">
            your harbour account
          </h1>
          <p className="text-sm text-[var(--color-text-on-dark-muted)]">
            signed in as {email}
          </p>
        </header>

        {staff && (
          <section className="rounded-lg border border-[var(--wv-champagne)]/30 bg-[var(--wv-champagne)]/10 p-5 space-y-2">
            <p className="text-sm font-semibold text-[var(--wv-champagne)]">
              harbourmaster — full access
            </p>
            <p className="text-sm text-[var(--color-text-on-dark-muted)]">
              winded.vertigo crew. every app and package across the harbour is
              unlocked for your account. nothing to buy here.
            </p>
          </section>
        )}

        {/* profile — personalization shown to EVERYONE signed in (staff + crew).
            Completing it should never be a dead-end, even for the harbourmaster. */}
        {/* profile nudge — aboard → crew */}
        {!onboardingCompleted && (
              <section className="rounded-lg border border-[var(--wv-champagne)]/30 bg-[var(--wv-champagne)]/10 p-5 space-y-3">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-[var(--wv-champagne)]">
                    make the harbour yours
                  </p>
                  <p className="text-sm text-[var(--color-text-on-dark-muted)]">
                    tell us a little about you and we&apos;ll point you at the
                    right boats.
                  </p>
                </div>
                <Link
                  href="/harbour/profile"
                  className="inline-block bg-[var(--wv-champagne)] text-[var(--wv-cadet)] font-semibold py-2 px-5 rounded-lg hover:opacity-90 transition-opacity text-sm"
                >
                  complete your profile →
                </Link>
              </section>
            )}

            {/* profile summary — for completed crew */}
            {onboardingCompleted && (profileRoles.length > 0 || profileIntent.length > 0) && (
              <section className="rounded-lg border border-white/10 bg-white/5 p-5 space-y-3">
                <div className="flex items-baseline justify-between gap-4">
                  <h2 className="text-sm font-semibold text-[var(--color-text-on-dark)]">
                    your profile
                  </h2>
                  <Link
                    href="/harbour/profile"
                    className="text-xs text-[var(--wv-champagne)] hover:opacity-80"
                  >
                    edit →
                  </Link>
                </div>
                {profileRoles.length > 0 && (
                  <p className="text-sm text-[var(--color-text-on-dark-muted)]">
                    sailing as{" "}
                    <span className="text-[var(--color-text-on-dark)]">
                      {profileRoles.map((r) => ROLE_LABELS[r] ?? r).join(", ")}
                    </span>
                  </p>
                )}
                {profileIntent.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {profileIntent.map((i) => (
                      <span
                        key={i}
                        className="rounded-full border border-white/15 px-3 py-1 text-xs text-[var(--color-text-on-dark)]"
                      >
                        {INTENT_LABELS[i] ?? i}
                      </span>
                    ))}
                  </div>
                )}
              </section>
            )}

        {/* commerce + engagement — customer-only (staff hold everything) */}
        {!staff && (
          <>
            {/* knots — the engagement currency */}
            <section className="rounded-lg border border-white/10 bg-white/5 p-5">
              <div className="flex items-baseline justify-between gap-4">
                <span className="text-sm text-[var(--color-text-on-dark-muted)]">
                  your knots
                </span>
                <span className="text-2xl font-bold text-[var(--color-text-on-dark)]">
                  {knotsBalance}
                </span>
              </div>
              <p className="mt-1 text-sm text-[var(--color-text-on-dark-muted)]">
                rank:{" "}
                <span className="text-[var(--wv-champagne)] font-semibold">
                  {rank.current.title}
                </span>
              </p>
              {rank.next && (
                <p className="mt-2 text-xs text-[var(--color-text-on-dark-muted)]">
                  {rank.toNext} knots to {rank.next.title}
                  {rank.next.knot ? ` — unlocks the ${rank.next.knot.name}` : ""}.
                </p>
              )}
              <p className="mt-2 text-xs text-[var(--color-text-on-dark-muted)]">
                earn knots by completing your profile, referring others, and
                sharing what you make — not by playing. each rank teaches you a
                new knot.
              </p>
            </section>

            {/* knot locker — recognition as a learnable reward */}
            {rank.unlocked.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-sm font-semibold text-[var(--color-text-on-dark)]">
                  your knot locker
                </h2>
                {rank.unlocked.map(
                  (r) =>
                    r.knot && (
                      <div
                        key={r.knot.name}
                        className="rounded-lg border border-white/10 bg-white/5 p-5 space-y-2"
                      >
                        <div className="flex items-baseline justify-between gap-4">
                          <p className="text-base font-semibold text-[var(--color-text-on-dark)]">
                            {r.knot.name}
                          </p>
                          <a
                            href={r.knot.watch}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-[var(--wv-champagne)] hover:opacity-80 shrink-0"
                          >
                            watch it tied →
                          </a>
                        </div>
                        <p className="text-sm text-[var(--color-text-on-dark-muted)]">
                          {r.knot.goodFor}
                        </p>
                        <ol className="list-decimal pl-5 space-y-1 text-sm text-[var(--color-text-on-dark)]">
                          {r.knot.steps.map((s, i) => (
                            <li key={i}>{s}</li>
                          ))}
                        </ol>
                      </div>
                    ),
                )}
                {rank.next?.knot && (
                  <div className="rounded-lg border border-dashed border-white/15 p-5 text-sm text-[var(--color-text-on-dark-muted)]">
                    next knot — <span className="text-[var(--color-text-on-dark)]">{rank.next.knot.name}</span>: {rank.toNext} knots to go.
                  </div>
                )}
              </section>
            )}

            {/* credits (creaseworks reflection credits — distinct from knots) */}
            {(creditBalance > 0 || ledger.length > 0) && (
            <section className="rounded-lg border border-white/10 bg-white/5 p-5">
              <div className="flex items-baseline justify-between gap-4">
                <span className="text-sm text-[var(--color-text-on-dark-muted)]">
                  your credits
                </span>
                <span className="text-2xl font-bold text-[var(--color-text-on-dark)]">
                  {creditBalance}
                </span>
              </div>
              <p className="mt-2 text-xs text-[var(--color-text-on-dark-muted)]">
                earn credits inside the apps — spend them on packs and upgrades.
              </p>
              {ledger.length > 0 && (
                <ul className="mt-4 space-y-2 border-t border-white/10 pt-3">
                  {ledger.map((e, idx) => (
                    <li
                      key={idx}
                      className="flex items-baseline justify-between gap-4 text-xs"
                    >
                      <span className="text-[var(--color-text-on-dark-muted)]">
                        {e.label.replace(/_/g, " ")}
                      </span>
                      <span
                        className={
                          e.delta >= 0
                            ? "text-[var(--wv-champagne)]"
                            : "text-[var(--color-text-on-dark-muted)]"
                        }
                      >
                        {e.delta >= 0 ? "+" : ""}
                        {e.delta}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
            )}

            {/* owned */}
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-[var(--color-text-on-dark)]">
                your packs
              </h2>
              {owned.length === 0 ? (
                <p className="text-sm text-[var(--color-text-on-dark-muted)]">
                  you don&apos;t own any packs yet — explore what&apos;s
                  available below.
                </p>
              ) : (
                <ul className="space-y-2">
                  {owned.map((p) => (
                    <li
                      key={p.packCacheId}
                      className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 flex items-baseline justify-between gap-4"
                    >
                      <span className="text-sm text-[var(--color-text-on-dark)]">
                        {p.title}
                      </span>
                      <span className="text-xs text-[var(--color-text-on-dark-muted)]">
                        {p.app}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* available across the harbour */}
            {available.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-sm font-semibold text-[var(--color-text-on-dark)]">
                  available across the harbour
                </h2>
                {groupByApp(available).map(([app, packs]) => (
                  <div key={app} className="space-y-2">
                    <h3 className="text-xs uppercase tracking-wide text-[var(--color-text-on-dark-muted)]">
                      {app}
                    </h3>
                    <ul className="space-y-2">
                      {packs.map((p) => {
                        const price = formatPrice(p.priceCents, p.currency);
                        return (
                          <li
                            key={p.packCacheId}
                            className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 flex items-center justify-between gap-4"
                          >
                            <div className="min-w-0">
                              <p className="text-sm text-[var(--color-text-on-dark)] truncate">
                                {p.title}
                              </p>
                              {price && (
                                <p className="text-xs text-[var(--color-text-on-dark-muted)]">
                                  {price}
                                </p>
                              )}
                            </div>
                            <Link
                              href={`/${app}`}
                              className="shrink-0 text-xs font-medium text-[var(--wv-champagne)] hover:opacity-80"
                            >
                              explore →
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </section>
            )}
          </>
        )}

        <form action={signOutAction}>
          <button
            type="submit"
            className="w-full bg-[var(--wv-champagne)] text-[var(--wv-cadet)] font-semibold py-3 px-6 rounded-lg hover:opacity-90 transition-opacity"
          >
            sign out
          </button>
        </form>

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
