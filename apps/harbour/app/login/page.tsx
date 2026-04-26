"use client";

/**
 * Harbour sign-in.
 *
 * Phase 3a ships magic-link only via Resend. Google OAuth follows in
 * Phase 3b once the existing Pool A OAuth client has the harbour
 * redirect URI registered. The same `signIn()` helper from
 * `next-auth/react` handles both — adding a Google button later is
 * additive, no architectural change.
 *
 * Pattern mirrors apps/depth-chart/app/login/page.tsx (the canonical
 * Pool A login). Auth.js v5's basePath stripping for redirects on
 * CF Workers is handled via `WORKERS_AUTH_PAGES_BASEPATH=/harbour`
 * set on the worker's secrets.
 */

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";

function LoginInner() {
  const params = useSearchParams();
  const verify = params.get("verify");
  const error = params.get("error");
  const callback_url = params.get("callbackUrl") || "/";

  // Auth.js v5 client signIn() handles CSRF token + redirect flow on its own.
  // Path needs the /harbour basePath because Auth.js redirect URLs are
  // emitted relative to the app's mount point.
  const fullCallback = `/harbour${callback_url}`;

  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleResend(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    await signIn("resend", {
      email: email.toLowerCase().trim(),
      callbackUrl: fullCallback,
    });
  }

  if (verify) {
    return (
      <main id="main" className="min-h-screen flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center space-y-4">
          <h1 className="text-2xl font-bold text-[var(--color-text-on-dark)]">
            check your email
          </h1>
          <p className="text-sm text-[var(--color-text-on-dark-muted)]">
            we sent a sign-in link to your email address. click it to continue.
          </p>
          <a
            href="/harbour"
            className="inline-block text-xs text-[var(--wv-champagne)] hover:opacity-80"
          >
            ← back to harbour
          </a>
        </div>
      </main>
    );
  }

  return (
    <main id="main" className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-[var(--color-text-on-dark)]">
            sign in to harbour
          </h1>
          <p className="text-sm text-[var(--color-text-on-dark-muted)]">
            one account, all the apps under harbour.
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-sm text-red-400 text-center">
            {error === "OAuthAccountNotLinked"
              ? "this email is already linked to another sign-in method."
              : "something went wrong. please try again."}
          </div>
        )}

        {/* email magic link */}
        <form onSubmit={handleResend} className="space-y-3">
          <input
            type="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className="w-full bg-white/5 border border-white/15 rounded-lg px-4 py-3 text-[var(--color-text-on-dark)] placeholder:text-white/30 focus:outline-none focus:border-[var(--wv-champagne)] transition-colors"
          />
          <button
            type="submit"
            disabled={!email.trim() || submitting}
            className="w-full bg-[var(--wv-champagne)] text-[var(--wv-cadet)] font-semibold py-3 px-6 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          >
            send magic link
          </button>
        </form>

        <p className="text-center text-xs text-[var(--color-text-on-dark-muted)]">
          no account needed — signing in creates one automatically.
        </p>

        <div className="text-center">
          <a
            href="/harbour"
            className="text-xs text-[var(--color-text-on-dark-muted)] hover:text-[var(--wv-champagne)] transition-colors"
          >
            ← continue without signing in
          </a>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginInner />
    </Suspense>
  );
}
