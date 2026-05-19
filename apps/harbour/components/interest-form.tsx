"use client";

import { useState } from "react";

type Context = "wave-2" | "drydock" | "pier-b-prme" | "pier-a";

interface InterestFormProps {
  context: Context;
  appSlug?: string;
  /** Placeholder copy for the input. */
  placeholder?: string;
  /** Button label. */
  cta?: string;
  /** Tighter horizontal layout for inline-in-card usage. */
  compact?: boolean;
}

/**
 * Email capture form posting to /api/harbour/register-interest.
 *
 * Reusable across pier-section (per-card coming-soon), pier-c-teaser
 * (section level wave-2), and drydock-wall (section level drydock).
 * Lives client-side so we can show optimistic confirmation without
 * a round-trip — the API itself is fire-and-forget from the user's
 * perspective (errors are swallowed to avoid blocking submission).
 */
export function InterestForm({
  context,
  appSlug,
  placeholder = "your email",
  cta = "notify me",
  compact = false,
}: InterestFormProps) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">(
    "idle",
  );

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email || state === "sending") return;
    setState("sending");
    try {
      const response = await fetch("/harbour/api/harbour/register-interest", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, context, appSlug }),
      });
      if (!response.ok) throw new Error(`status ${response.status}`);
      setState("done");
    } catch (err) {
      console.error("[interest-form] submit failed:", err);
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <p className="text-sm text-[var(--color-accent-on-dark)]">
        thanks — we&rsquo;ll be in touch.
      </p>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className={`flex ${compact ? "flex-row gap-2" : "flex-col sm:flex-row gap-2"} items-stretch`}
    >
      <label className="sr-only" htmlFor={`email-${context}-${appSlug ?? "section"}`}>
        email
      </label>
      <input
        id={`email-${context}-${appSlug ?? "section"}`}
        type="email"
        required
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={placeholder}
        className="flex-1 min-w-0 rounded-full px-4 py-2 text-sm bg-white/5 border border-white/10 text-[var(--color-text-on-dark)] placeholder:text-[var(--color-text-on-dark-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--wv-sienna)]"
      />
      <button
        type="submit"
        disabled={state === "sending"}
        className="rounded-full px-4 py-2 text-sm font-semibold bg-[var(--wv-sienna)] text-[var(--color-text-on-dark)] hover:brightness-110 transition-all border border-white/10 disabled:opacity-60"
      >
        {state === "sending" ? "…" : cta}
      </button>
      {state === "error" && (
        <p className="text-xs text-[var(--color-text-on-dark-muted)]">
          something went wrong — try again
        </p>
      )}
    </form>
  );
}
