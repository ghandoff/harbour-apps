"use client";

/**
 * Wraps a pier section with the fog-of-war reveal mechanic borrowed from
 * Roll20's "Explorer Mode" (tabletop RPG dynamic lighting). Each pier
 * starts dimmed; scrolling it into view lights it up; revisits persist
 * across sessions via localStorage.
 *
 * Three states, written as `data-fog-state` on the wrapper div:
 *   - "dim":     never visited on this device. Saturation + brightness
 *                pulled down. Pier name still legible, cards readable but
 *                visually quiet.
 *   - "lit":     currently in / has been in view this scroll session.
 *                Full saturation + brightness.
 *   - "visited": visited previously, now off-screen. Roll20 Explorer Mode
 *                equivalent — slightly desaturated but brighter than
 *                "dim". "You've been here before, you remember it."
 *
 * SSR contract: the section is "lit" by default (no data attribute set
 * server-side). On mount, this component reads localStorage and the
 * media query for `prefers-reduced-motion`, and only THEN dims the
 * section if appropriate. This ordering means:
 *   - No-JS users (screen readers, crawlers) see a fully lit page.
 *   - JS users see a brief moment of lit-on-paint before the dim
 *     applies, which is acceptable — the dim is the "I haven't
 *     explored this yet" cue, not a paint-blocker.
 *   - Users with `prefers-reduced-motion: reduce` never see the fog
 *     effect at all (CSS overrides the filter rules).
 *
 * The mechanic is purely decorative — all content is fully present in
 * the DOM at every state, so screen reader users get the entire pier
 * IA as a linear document regardless. The fog is filter / opacity,
 * never display: none or visibility: hidden.
 */

import { useEffect, useRef, useState } from "react";

type FogState = "lit" | "dim" | "visited";

interface FogOfWarSectionProps {
  /** Unique key for this pier — used as the localStorage entry. */
  pierSlug: string;
  /** Children rendered inside the wrapper (the actual pier section). */
  children: React.ReactNode;
}

const STORAGE_KEY = "wv-harbour-piers-visited";

function readVisited(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((s) => typeof s === "string"));
  } catch {
    return new Set();
  }
}

function writeVisited(visited: Set<string>): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...visited]));
  } catch {
    /* localStorage may be unavailable (private mode, quota) — no-op */
  }
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function FogOfWarSection({ pierSlug, children }: FogOfWarSectionProps) {
  // Start "lit" so SSR + first paint show full content. The post-mount
  // effect dims if appropriate.
  const [state, setState] = useState<FogState>("lit");
  const ref = useRef<HTMLDivElement>(null);
  const visitedRef = useRef<Set<string> | null>(null);

  // On mount: decide initial fog state based on prior visits + a11y
  // preferences. Runs once per mount; no-ops on subsequent renders.
  useEffect(() => {
    if (prefersReducedMotion()) {
      // Honour reduced motion: skip the dim phase entirely.
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot mount-time init that depends on a browser API (matchMedia), can't be expressed as a lazy useState initializer because the visited/dim branch below also needs to run. Behaviour is observably correct.
      setState("lit");
      return;
    }

    const visited = readVisited();
    visitedRef.current = visited;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- see above; one-shot mount-time init keyed on pierSlug.
    setState(visited.has(pierSlug) ? "visited" : "dim");
  }, [pierSlug]);

  // Watch for the section coming into view. Once it does, light it up
  // and persist the visit. The observer keeps firing for re-entries
  // but state never goes BACK to "dim" once "lit" — Roll20 semantics:
  // you've seen this pier, you keep seeing it (just transitions to
  // "visited" if you leave the page and come back).
  useEffect(() => {
    if (state === "lit") return;
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === "undefined") {
      // No IO support → fall back to lit immediately.
      // eslint-disable-next-line react-hooks/set-state-in-effect -- environment-capability check; refactoring to lazy init would defeat the per-section observer setup that follows. Behaviour is observably correct.
      setState("lit");
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setState("lit");

        // Persist the visit so a returning visitor lands on this pier
        // in the "visited" state next time.
        const visited = visitedRef.current ?? readVisited();
        if (!visited.has(pierSlug)) {
          visited.add(pierSlug);
          visitedRef.current = visited;
          writeVisited(visited);
        }

        observer.disconnect();
      },
      {
        // 25% of the section must be visible before we light it up.
        // rootMargin pulls the trigger zone up a bit so the section
        // is already "arriving" when it lights, not waiting to be
        // halfway in view.
        threshold: 0.25,
        rootMargin: "0px 0px -10% 0px",
      },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [pierSlug, state]);

  return (
    <div ref={ref} data-fog-state={state} className="fog-section">
      {children}
    </div>
  );
}
