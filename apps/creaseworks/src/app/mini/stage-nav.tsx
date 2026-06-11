"use client";

/**
 * MiniStageNav — the four-stage progress strip (look → make → show → wow).
 *
 * Tappable once a session is underway; the current stage is filled with
 * its accent. Hidden on the welcome page (no stage active yet keeps the
 * landing uncluttered — the big start button is the only call to action).
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import CharacterSlot from "@windedvertigo/characters";
import { useCharacterVariant } from "@windedvertigo/characters/variant-context";
import { MINI_STAGES } from "@/lib/mini-pilot";

const STAGE_ACCENTS: Record<string, string> = {
  look: "var(--wv-cornflower)",
  make: "var(--wv-teal)",
  show: "var(--wv-seafoam)",
  wow: "var(--wv-periwinkle)",
};

export function MiniStageNav() {
  const pathname = usePathname();
  const variant = useCharacterVariant();

  // basePath is stripped from usePathname; mini pages are /mini/<stage>
  const current = pathname.split("/")[2] ?? null;
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
          color: var(--wv-white);
          background: var(--accent);
          border-color: var(--accent);
        }
        .mini-stage-dot:focus-visible {
          outline: 3px solid var(--color-focus);
          outline-offset: 2px;
        }
        @media (max-width: 420px) {
          .mini-stage-dot span.mini-stage-label { display: none; }
          .mini-stage-dot { padding: 4px 6px; }
        }
      `}</style>
      {MINI_STAGES.map((stage) => (
        <Link
          key={stage.key}
          href={`/mini/${stage.key}`}
          className="mini-stage-dot"
          data-active={current === stage.key}
          aria-current={current === stage.key ? "step" : undefined}
          style={{ ["--accent" as string]: STAGE_ACCENTS[stage.key] }}
        >
          <CharacterSlot
            character={stage.character}
            size={18}
            animate={false}
            variant={variant}
          />
          <span className="mini-stage-label">{stage.label}</span>
        </Link>
      ))}
    </nav>
  );
}
