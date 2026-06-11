/**
 * /harbour/redeem — the public "have an access code?" entry point.
 *
 * Sign-in is required to redeem (entitlements are user-keyed and persist across
 * devices; the 30-second sign-in gets them there). Signed-in users see the
 * redeem form; everyone else gets a sign-in prompt that returns here.
 */

import Link from "next/link";
import { auth } from "@/lib/auth";
import { RedeemForm } from "./redeem-form";

export const dynamic = "force-dynamic";

export default async function RedeemPage() {
  const session = await auth();
  const signedIn = !!session?.user?.email && !!session.userId;

  return (
    <main
      id="main"
      className="min-h-screen px-6 py-12"
      style={{ background: "linear-gradient(180deg, var(--wv-cadet) 0%, #161e2e 100%)" }}
    >
      <div className="mx-auto max-w-md space-y-6">
        <header className="space-y-2">
          <p className="text-xs font-semibold tracking-[0.3em] text-[var(--color-accent-on-dark)]">
            the harbour
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight text-[var(--color-text-on-dark)]">
            have an access code?
          </h1>
          <p className="text-[15px] leading-relaxed text-[var(--color-text-on-dark-muted)]">
            enter your code to unlock free, full access to the apps it includes — across the
            whole harbour.
          </p>
        </header>

        {signedIn ? (
          <RedeemForm signInEmail={session!.user!.email!} />
        ) : (
          <div className="rounded-2xl border border-[var(--wv-champagne)]/30 bg-[var(--wv-champagne)]/10 p-5 space-y-3">
            <p className="text-sm text-[var(--color-text-on-dark-muted)]">
              sign in first (about 30 seconds) — your access then follows you across every device.
            </p>
            <Link
              href="/login?callbackUrl=/redeem"
              className="inline-flex items-center gap-2 rounded-full bg-[var(--wv-champagne)] px-5 py-3 font-semibold text-[var(--wv-cadet)] hover:opacity-90 transition-opacity"
            >
              sign in to continue
              <span aria-hidden>&rarr;</span>
            </Link>
          </div>
        )}

        <Link
          href="/"
          className="inline-block text-xs text-[var(--color-text-on-dark-muted)] hover:text-[var(--wv-champagne)] transition-colors"
        >
          ← back to harbour
        </Link>
      </div>
    </main>
  );
}
