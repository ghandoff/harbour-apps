"use client";

/**
 * ViewAsBar — collective-only "view as <persona>" switcher + view-status.
 *
 * Renders NOTHING unless /api/me reports realStaff (derived from the session
 * email, never the cookie) — so the public never sees or uses it. Selecting a
 * persona sets the `wv_view_as` cookie client-side (the wv-site proxy mangles
 * Set-Cookie, so we avoid a server route) and reloads; the server honours it
 * only for real staff. "your view" clears the cookie. Mounted once in the
 * layout, so it appears on every harbour page.
 */

import { useEffect, useState } from "react";

interface Me {
  realStaff?: boolean;
  activePersona?: string | null;
}

const VIEWS: { key: string | null; label: string }[] = [
  { key: null, label: "your view" },
  { key: "public", label: "public" },
  { key: "visitor", label: "visitor" },
  { key: "profiled", label: "profiled" },
  { key: "crew", label: "crew" },
];

function setView(persona: string | null) {
  document.cookie =
    persona === null
      ? "wv_view_as=; path=/harbour; max-age=0; samesite=lax"
      : `wv_view_as=${persona}; path=/harbour; max-age=2592000; samesite=lax`;
  window.location.reload();
}

export function ViewAsBar() {
  const [me, setMe] = useState<Me | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/harbour/api/me", { credentials: "include" })
      .then((r) => r.json())
      .then((data: Me) => {
        if (!cancelled) setMe(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // Collective-only: render nothing for everyone else.
  if (!me?.realStaff) return null;

  const active = me.activePersona ?? null;

  return (
    <div className="view-as-bar" role="region" aria-label="collective view-as">
      <span className="view-as-status">
        viewing&nbsp;as: <b>{active ?? "your view"}</b>
      </span>
      <div className="view-as-chips">
        {VIEWS.map((v) => {
          const isActive = v.key === active;
          return (
            <button
              key={v.key ?? "self"}
              type="button"
              className={`view-as-chip${isActive ? " is-active" : ""}`}
              aria-pressed={isActive}
              onClick={() => !isActive && setView(v.key)}
            >
              {v.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
