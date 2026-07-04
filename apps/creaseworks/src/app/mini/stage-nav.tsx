"use client";

/**
 * MiniStageNav — the four-stage "arc" progress strip (find → fold → unfold →
 * find again).
 *
 * Tappable once a session is underway; the current stage is filled with its
 * tint. Hidden on the welcome page. Icons are the real branded phase SVGs
 * (public/phase-icons/) so a pre-reader navigates by image. The squircle chip
 * shape stays. On narrow phones only the icon shows.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MINI_STAGES, miniHref, miniStageFromPathname, MINI_AT_ROOT } from "@/lib/mini-pilot";

// plain <img> srcs don't get basePath auto-prepended — serve from whichever
// flavour this build is mounted at (mirrors found-picker.tsx's ICON_BASE)
const ICON_BASE = MINI_AT_ROOT ? "/harbour/creaseworks-mini" : "/harbour/creaseworks";

export function MiniStageNav() {
  const pathname = usePathname();

  // stage segment works for both flavours (/look in mini, /mini/look in prod)
  const current = miniStageFromPathname(pathname);
  if (!current) return null; // welcome page — keep the header quiet

  return (
    <nav aria-label="mini stages" className="mini-stage-nav">
      <style>{`
        .mini-stage-nav { display: flex; gap: 6px; }
        .mini-stage-dot {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 9px;
          border-radius: 14px 18px 12px 16px;
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-weight: 800;
          font-size: 11px;
          color: var(--wv-cadet);
          background: var(--wv-white);
          border: 1.5px solid rgba(39, 50, 72, 0.1);
          text-decoration: none;
        }
        .mini-stage-dot[data-active="true"] {
          color: var(--wv-cadet);
          background: var(--tint);
          border-color: var(--accent);
          border-width: 2px;
        }
        .mini-stage-dot:focus-visible {
          outline: 3px solid var(--color-focus);
          outline-offset: 2px;
        }
        .mini-stage-icon { width: 18px; height: 18px; object-fit: contain; display: block; }
        @media (max-width: 420px) {
          .mini-stage-dot span.mini-stage-label { display: none; }
          .mini-stage-dot { padding: 5px 7px; }
        }
      `}</style>
      {MINI_STAGES.map((stage) => (
        <Link
          key={stage.key}
          href={miniHref(`/${stage.key}`)}
          className="mini-stage-dot"
          data-active={current === stage.key}
          aria-current={current === stage.key ? "step" : undefined}
          aria-label={stage.label}
          style={{
            ["--accent" as string]: stage.accent,
            ["--tint" as string]: stage.tint,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="mini-stage-icon"
            src={`${ICON_BASE}/phase-icons/${stage.icon}`}
            alt=""
            aria-hidden="true"
          />
          <span className="mini-stage-label">{stage.label}</span>
        </Link>
      ))}
    </nav>
  );
}
