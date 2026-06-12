"use client";

/**
 * Freemium tier check for co.rubric — asks the harbour hub's shared endpoint
 * (`/harbour/api/tier`) what tier the current viewer has for this app. Same
 * origin (windedvertigo.com), so the credentialed session cookie is sent.
 *
 * Fails OPEN (companion, gate off) on any error — the gate must never block the
 * experience if the check is unavailable. While `HARBOUR_GATE_ENFORCED` is off
 * the endpoint always returns the top tier, so this is a no-op until launch.
 */

export interface TierResult {
  tier: string;
  enforced: boolean;
}

export async function fetchTier(app: string): Promise<TierResult> {
  try {
    const res = await fetch(`/harbour/api/tier?app=${encodeURIComponent(app)}`, {
      credentials: "include",
    });
    if (!res.ok) return { tier: "companion", enforced: false };
    return (await res.json()) as TierResult;
  } catch {
    return { tier: "companion", enforced: false };
  }
}
