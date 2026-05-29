"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Profile capture form — the aboard→crew step. Short and playful: pick a role
 * (mirrors the /start persona picker), optionally flag interests, save. On
 * success it POSTs to /harbour/api/profile (which records preferences, marks
 * onboarding complete, and enrols non-staff in the members audience) then
 * returns you to the harbour.
 */

const ROLES = [
  { value: "facilitator", label: "i facilitate workshops", sub: "team offsites, l&d, sustainability practice" },
  { value: "educator", label: "i teach in higher-ed", sub: "prme faculty, mba educators, certificate programmes" },
  { value: "parent-caregiver", label: "i'm a parent or play-based educator", sub: "kid-facing tools" },
] as const;

const INTERESTS = [
  { value: "leadership", label: "leadership" },
  { value: "classroom", label: "classroom" },
  { value: "family", label: "family" },
] as const;

export function ProfileForm({
  initialRole,
  initialInterests,
}: {
  initialRole: string | null;
  initialInterests: string[];
}) {
  const router = useRouter();
  const [role, setRole] = useState<string | null>(initialRole);
  const [interests, setInterests] = useState<string[]>(initialInterests);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleInterest(v: string) {
    setInterests((cur) =>
      cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v],
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!role) {
      setError("pick whichever fits best to continue.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/harbour/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ role, interests }),
      });
      if (!res.ok) throw new Error(`save failed (${res.status})`);
      // basePath (/harbour) is auto-prepended — use "/" not "/harbour"
      // or it doubles to /harbour/harbour. (CLAUDE.md basePath gotcha.)
      router.push("/");
    } catch {
      setError("something went wrong saving your profile. please try again.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-[var(--color-text-on-dark)] mb-1">
          which fits you best?
        </legend>
        {ROLES.map((r) => (
          <label
            key={r.value}
            className={`block rounded-2xl border p-4 sm:p-5 cursor-pointer transition-colors ${
              role === r.value
                ? "border-[var(--wv-champagne)] bg-white/5"
                : "border-white/10 hover:border-white/30"
            }`}
          >
            <input
              type="radio"
              name="role"
              value={r.value}
              checked={role === r.value}
              onChange={() => setRole(r.value)}
              className="sr-only"
            />
            <span className="block text-base font-semibold text-[var(--color-text-on-dark)]">
              {r.label}
            </span>
            <span className="block text-sm text-[var(--color-text-on-dark-muted)]">
              {r.sub}
            </span>
          </label>
        ))}
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-[var(--color-text-on-dark)] mb-1">
          what are you drawn to? <span className="font-normal text-[var(--color-text-on-dark-muted)]">(optional)</span>
        </legend>
        <div className="flex flex-wrap gap-2">
          {INTERESTS.map((i) => (
            <label
              key={i.value}
              className={`rounded-full border px-4 py-2 text-sm cursor-pointer transition-colors ${
                interests.includes(i.value)
                  ? "border-[var(--wv-champagne)] bg-[var(--wv-champagne)] text-[var(--wv-cadet)]"
                  : "border-white/15 text-[var(--color-text-on-dark)] hover:border-white/40"
              }`}
            >
              <input
                type="checkbox"
                checked={interests.includes(i.value)}
                onChange={() => toggleInterest(i.value)}
                className="sr-only"
              />
              {i.label}
            </label>
          ))}
        </div>
      </fieldset>

      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-[var(--wv-champagne)] text-[var(--wv-cadet)] font-semibold py-3 px-6 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {submitting ? "saving…" : "set sail"}
      </button>
    </form>
  );
}
