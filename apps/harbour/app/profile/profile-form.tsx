"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Profile capture — the aboard→crew step. Two orthogonal questions:
 *  1. who you are (roles, multi-select) — you can be several at once.
 *  2. what you're hoping to DO (intent, multi-select) — drives boat
 *     recommendations, so the profile actually directs you somewhere.
 * Saves { roles, intent } to play_preferences, marks onboarding complete,
 * enrols non-staff in the members audience (see /api/profile), then returns
 * to the harbour.
 */

const ROLES = [
  { value: "facilitator", label: "i facilitate", sub: "workshops, team offsites, l&d, sustainability practice" },
  { value: "educator", label: "i teach in higher-ed", sub: "prme faculty, mba educators, certificate programmes" },
  { value: "parent-caregiver", label: "i play with kids", sub: "parent, caregiver, or play-based educator" },
  { value: "explorer", label: "i'm just exploring", sub: "curious what the harbour holds" },
] as const;

const INTENT = [
  { value: "run-session", label: "run a session with a group" },
  { value: "rethink-assessment", label: "rethink how i assess" },
  { value: "play-family", label: "play with my kid" },
  { value: "get-inspired", label: "browse and get inspired" },
] as const;

export function ProfileForm({
  initialRoles,
  initialIntent,
}: {
  initialRoles: string[];
  initialIntent: string[];
}) {
  const router = useRouter();
  const [roles, setRoles] = useState<string[]>(initialRoles);
  const [intent, setIntent] = useState<string[]>(initialIntent);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = (set: React.Dispatch<React.SetStateAction<string[]>>) => (v: string) =>
    set((cur) => (cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v]));
  const toggleRole = toggle(setRoles);
  const toggleIntent = toggle(setIntent);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (roles.length === 0) {
      setError("pick at least one — you can choose more than one.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/harbour/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ roles, intent }),
      });
      if (!res.ok) throw new Error(`save failed (${res.status})`);
      // basePath (/harbour) is auto-prepended — use "/" not "/harbour".
      router.push("/");
    } catch {
      setError("something went wrong saving your profile. please try again.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* who you are — multi-select */}
      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-[var(--color-text-on-dark)] mb-1">
          what brings you to the harbour?{" "}
          <span className="font-normal text-[var(--color-text-on-dark-muted)]">
            (pick all that fit)
          </span>
        </legend>
        {ROLES.map((r) => {
          const on = roles.includes(r.value);
          return (
            <label
              key={r.value}
              className={`block rounded-2xl border p-4 sm:p-5 cursor-pointer transition-colors ${
                on
                  ? "border-[var(--wv-champagne)] bg-white/5"
                  : "border-white/10 hover:border-white/30"
              }`}
            >
              <input
                type="checkbox"
                checked={on}
                onChange={() => toggleRole(r.value)}
                className="sr-only"
              />
              <span className="flex items-center gap-2 text-base font-semibold text-[var(--color-text-on-dark)]">
                <span aria-hidden className="text-[var(--wv-champagne)]">
                  {on ? "⚓" : "○"}
                </span>
                {r.label}
              </span>
              <span className="block text-sm text-[var(--color-text-on-dark-muted)] pl-6">
                {r.sub}
              </span>
            </label>
          );
        })}
      </fieldset>

      {/* what you want to do — drives recommendations */}
      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-[var(--color-text-on-dark)] mb-1">
          what are you hoping to do?{" "}
          <span className="font-normal text-[var(--color-text-on-dark-muted)]">
            (optional — helps us point you at the right boats)
          </span>
        </legend>
        <div className="flex flex-wrap gap-2">
          {INTENT.map((i) => (
            <label
              key={i.value}
              className={`rounded-full border px-4 py-2 text-sm cursor-pointer transition-colors ${
                intent.includes(i.value)
                  ? "border-[var(--wv-champagne)] bg-[var(--wv-champagne)] text-[var(--wv-cadet)]"
                  : "border-white/15 text-[var(--color-text-on-dark)] hover:border-white/40"
              }`}
            >
              <input
                type="checkbox"
                checked={intent.includes(i.value)}
                onChange={() => toggleIntent(i.value)}
                className="sr-only"
              />
              {i.label}
            </label>
          ))}
        </div>
      </fieldset>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-[var(--wv-champagne)] text-[var(--wv-cadet)] font-semibold py-3 px-6 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {submitting ? "charting your course…" : "set sail"}
      </button>
    </form>
  );
}
