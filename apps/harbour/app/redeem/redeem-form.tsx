"use client";

/**
 * Redeem an access code, then offer an OPTIONAL institutional registration.
 * Mobile-first, accessible: real <label>s, aria-live status, errors tied to
 * inputs, consent unticked. Access never depends on the registration step.
 * NB: fetch() does NOT get the /harbour basePath — paths are explicit.
 */

import { useState } from "react";
import Link from "next/link";

type RedeemState = "idle" | "redeeming" | "done";

const REDEEM_ERRORS: Record<string, string> = {
  not_found: "that code wasn’t recognised — check it and try again.",
  expired: "that code has expired.",
  limit_reached: "that code has reached its limit.",
  rate_limited: "too many tries — give it a few minutes and try again.",
  code_required: "please enter a code.",
  internal_error: "something went wrong — please try again.",
};

export function RedeemForm({ signInEmail }: { signInEmail: string }) {
  const [code, setCode] = useState("");
  const [state, setState] = useState<RedeemState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [packCount, setPackCount] = useState(0);

  async function redeem(e: React.FormEvent) {
    e.preventDefault();
    const value = code.trim();
    if (!value) {
      setError(REDEEM_ERRORS.code_required);
      return;
    }
    setState("redeeming");
    setError(null);
    try {
      const res = await fetch("/harbour/api/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ code: value }),
      });
      const data = (await res.json()) as {
        redeemed?: boolean;
        packCount?: number;
        error?: string;
      };
      if (!res.ok || !data.redeemed) {
        setError(REDEEM_ERRORS[data.error ?? "internal_error"] ?? REDEEM_ERRORS.internal_error);
        setState("idle");
        return;
      }
      setPackCount(data.packCount ?? 0);
      setState("done");
    } catch {
      setError(REDEEM_ERRORS.internal_error);
      setState("idle");
    }
  }

  if (state === "done") {
    return <RedeemSuccess packCount={packCount} signInEmail={signInEmail} />;
  }

  return (
    <form onSubmit={redeem} className="space-y-4" noValidate>
      <div className="space-y-1.5">
        <label htmlFor="access-code" className="block text-sm font-semibold text-[var(--color-text-on-dark)]">
          access code
        </label>
        <input
          id="access-code"
          name="access-code"
          type="text"
          autoCapitalize="characters"
          autoComplete="off"
          spellCheck={false}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          aria-invalid={!!error}
          aria-describedby={error ? "redeem-error" : undefined}
          placeholder="e.g. PPCS2026"
          className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-[var(--color-text-on-dark)] placeholder:text-white/35 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-focus)]"
        />
        {error && (
          <p id="redeem-error" role="alert" className="text-sm text-red-300">
            {error}
          </p>
        )}
      </div>
      <button
        type="submit"
        disabled={state === "redeeming"}
        className="w-full rounded-full bg-[var(--wv-champagne)] px-5 py-3 font-semibold text-[var(--wv-cadet)] hover:opacity-90 disabled:opacity-50 transition-opacity"
      >
        {state === "redeeming" ? "checking…" : "unlock access"}
      </button>
    </form>
  );
}

function RedeemSuccess({ packCount, signInEmail }: { packCount: number; signInEmail: string }) {
  return (
    <div className="space-y-6" aria-live="polite">
      <div className="rounded-2xl border border-[var(--wv-champagne)]/30 bg-[var(--wv-champagne)]/10 p-5 space-y-1">
        <p className="text-2xl" aria-hidden>⚓</p>
        <p className="text-lg font-bold text-[var(--color-text-on-dark)]">you’re in</p>
        <p className="text-sm text-[var(--color-text-on-dark-muted)]">
          full access unlocked{packCount ? ` across ${packCount} apps` : ""} — it follows you across the
          harbour and every device. <Link href="/" className="text-[var(--wv-champagne)] underline-offset-4 hover:underline">explore the harbour →</Link>
        </p>
      </div>
      <RegisterCard signInEmail={signInEmail} />
    </div>
  );
}

type RegState = "idle" | "submitting" | "done" | "skipped";

function RegisterCard({ signInEmail }: { signInEmail: string }) {
  const [email, setEmail] = useState(signInEmail);
  const [institution, setInstitution] = useState("");
  const [consent, setConsent] = useState(false);
  const [state, setState] = useState<RegState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [linked, setLinked] = useState<string | null>(null);

  async function register(e: React.FormEvent) {
    e.preventDefault();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
      setError("please enter a valid email.");
      return;
    }
    setState("submitting");
    setError(null);
    try {
      const res = await fetch("/harbour/api/redeem/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          institutionalEmail: email.trim(),
          institution: institution.trim() || null,
          consent,
        }),
      });
      const data = (await res.json()) as { registered?: boolean; linkedInstitution?: string | null };
      if (!res.ok || !data.registered) {
        setError("couldn’t save that — please try again.");
        setState("idle");
        return;
      }
      setLinked(data.linkedInstitution ?? null);
      setState("done");
    } catch {
      setError("couldn’t save that — please try again.");
      setState("idle");
    }
  }

  if (state === "skipped") return null;

  if (state === "done") {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5" aria-live="polite">
        <p className="text-sm text-[var(--color-text-on-dark)]">thanks — you’re registered.</p>
        {linked && (
          <p className="mt-1 text-sm text-[var(--color-text-on-dark-muted)]">
            we recognised <span className="text-[var(--color-text-on-dark)]">{linked}</span> — you may unlock
            even more on your next sign-in.
          </p>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={register} className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4" noValidate>
      <div className="space-y-1">
        <h2 className="text-base font-bold text-[var(--color-text-on-dark)]">stay in the loop <span className="font-normal text-[var(--color-text-on-dark-muted)]">(optional)</span></h2>
        <p className="text-sm text-[var(--color-text-on-dark-muted)]">
          add your institutional email for updates, new packs, and the occasional feedback request — it also
          lets us connect you to any institutional licence your organisation has, now or in future.
        </p>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="inst-email" className="block text-sm font-semibold text-[var(--color-text-on-dark)]">institutional email</label>
        <input
          id="inst-email" type="email" autoComplete="email" value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={!!error}
          className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-[var(--color-text-on-dark)] placeholder:text-white/35 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-focus)]"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="inst-name" className="block text-sm font-semibold text-[var(--color-text-on-dark)]">institution <span className="font-normal text-[var(--color-text-on-dark-muted)]">(optional)</span></label>
        <input
          id="inst-name" type="text" value={institution}
          onChange={(e) => setInstitution(e.target.value)}
          placeholder="e.g. university of …"
          className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-[var(--color-text-on-dark)] placeholder:text-white/35 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-focus)]"
        />
      </div>

      <label className="flex items-start gap-3 text-sm text-[var(--color-text-on-dark-muted)]">
        <input
          type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--wv-champagne)]"
        />
        <span>email me PPCS updates, new packs, and occasional feedback requests. you can unsubscribe anytime.</span>
      </label>

      {error && <p role="alert" className="text-sm text-red-300">{error}</p>}

      <div className="flex flex-wrap gap-2">
        <button
          type="submit" disabled={state === "submitting"}
          className="rounded-full bg-[var(--wv-champagne)] px-5 py-2.5 font-semibold text-[var(--wv-cadet)] hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {state === "submitting" ? "saving…" : "register"}
        </button>
        <button
          type="button" onClick={() => setState("skipped")}
          className="rounded-full px-5 py-2.5 text-sm text-[var(--color-text-on-dark-muted)] hover:text-[var(--color-text-on-dark)]"
        >
          no thanks
        </button>
      </div>
    </form>
  );
}
