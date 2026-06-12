"use client";

/**
 * Live tier chip for the staff preview hub — fetches the shared endpoint the same
 * way the real apps do (`/harbour/api/tier?app=<slug>`, same origin, credentialed),
 * so it reflects exactly what each app's gate currently sees for this viewer.
 * Re-reads on focus so flipping the toggle (a full nav) shows fresh state.
 */

import { useEffect, useState } from "react";

interface Tier {
  tier?: string;
  enforced?: boolean;
  preview?: boolean;
}

export function GatePreviewLive({ slug }: { slug: string }) {
  const [t, setT] = useState<Tier | null>(null);

  useEffect(() => {
    let live = true;
    const load = () =>
      fetch(`/harbour/api/tier?app=${encodeURIComponent(slug)}`, { credentials: "include" })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (live) setT(d);
        })
        .catch(() => {
          if (live) setT(null);
        });
    load();
    window.addEventListener("focus", load);
    return () => {
      live = false;
      window.removeEventListener("focus", load);
    };
  }, [slug]);

  if (!t) return null;
  const sampler = t.enforced && t.tier === "sampler";
  return (
    <span
      className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide"
      style={{
        background: sampler ? "rgba(203,120,88,0.2)" : "rgba(255,235,210,0.1)",
        color: sampler ? "var(--wv-sienna)" : "var(--color-text-on-dark-muted)",
      }}
      title={`tier=${t.tier ?? "?"} · enforced=${String(t.enforced)}${t.preview ? " · preview" : ""}`}
    >
      {sampler ? "sampler" : t.tier ?? "?"}
      {t.preview ? " · preview" : ""}
    </span>
  );
}
