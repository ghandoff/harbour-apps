"use client";

/**
 * MaterialPickerHero — kid-friendly material grid for the logged-out
 * landing hero. Tapping a tile navigates to /find?material=[slug].
 *
 * Kid refresh (2026-04): cream tiles on cadet bg, irregular squircle
 * corners, deterministic accent rotation (one per tile, never mixed),
 * phase-staggered idle wobble, tap = accent flash + squish.
 */

import { useRouter } from "next/navigation";
import Image from "next/image";
import { materialSlug } from "@/lib/material-slug";
import CharacterSlot, { resolveCharacterFromForm } from "@windedvertigo/characters";

interface HeroMaterial {
  id: string;
  title: string;
  emoji: string | null;
  icon: string | null;
  form_primary: string | null;
}

interface MaterialPickerHeroProps {
  materials: HeroMaterial[];
}

const ACCENTS = [
  "var(--wv-cornflower)",
  "var(--wv-teal)",
  "var(--wv-seafoam)",
  "var(--wv-periwinkle)",
  "var(--wv-mint)",
] as const;

const CORNERS = [
  "22px 28px 18px 26px",
  "26px 20px 28px 22px",
  "20px 26px 24px 28px",
  "28px 22px 26px 20px",
] as const;


export default function MaterialPickerHero({ materials }: MaterialPickerHeroProps) {
  const router = useRouter();

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 sm:gap-4" style={{ maxWidth: 480 }}>
      {materials.map((m, i) => {
        const slug = materialSlug(m.title);
        const accent = ACCENTS[i % ACCENTS.length];
        const corners = CORNERS[i % CORNERS.length];
        // crayon-drawer asymmetry: every 4th tile tilts back or forward
        const restRotation = i % 4 === 0 ? -2 : i % 4 === 3 ? 2 : 0;

        return (
          <button
            key={m.id}
            onClick={() => router.push(`/find?material=${slug}`)}
            className="mph-tile"
            style={{
              ["--accent" as string]: accent,
              ["--corners" as string]: corners,
              ["--rest-rotation" as string]: `${restRotation}deg`,
              ["--wobble-delay" as string]: `${(i * 0.37) % 3.6}s`,
              ["--in-delay" as string]: `${i * 50}ms`,
            }}
            aria-label={`find playdates using ${m.title}`}
          >
            <span className="mph-icon-wrap">
              {(() => {
                // Resolve character host from form_primary first, then title fallback.
                // Returns null for crate/mud/drip until those characters are built,
                // AND null when no keyword matches — in both cases we fall back.
                const char = resolveCharacterFromForm(m.form_primary, m.title);
                const slot = char ? <CharacterSlot character={char} size={40} animate={false} /> : null;
                if (slot) return slot;
                if (m.icon) return (
                  <Image
                    src={`/harbour/creaseworks/icons/materials/${m.icon}.png`}
                    alt=""
                    width={40}
                    height={40}
                    className="object-contain"
                  />
                );
                return <span className="mph-emoji">{m.emoji ?? "🧱"}</span>;
              })()}
            </span>
            <span className="mph-label">{m.title}</span>
            <span className="mph-accent-chip" aria-hidden="true" />
          </button>
        );
      })}

      <style>{`
        /* selector specificity note: globals.css ships an aggressive
           "rounder EVERYTHING" + "physical button" system at
           button:not([type="submit"]):not(.wv-header-signout) (0,2,1)
           that overrides border-radius to 14px and adds transform:
           scale(0.95) on active — fighting our squircle geometry and
           the component's individual transform properties. We match
           that selector shape + add .mph-tile so our rules win on
           specificity (0,3,1) rather than source order alone.         */
        button.mph-tile:not([type="submit"]):not(.wv-header-signout) {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 10px 6px 12px;
          min-height: 88px;
          background: var(--wv-cream);
          border: 1px solid rgba(39, 50, 72, 0.08);
          border-radius: var(--corners);
          cursor: pointer;
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-weight: 700;
          box-shadow: 0 2px 0 rgba(39, 50, 72, 0.08);

          /* individual transform properties so hover/active don't fight the wobble.
             we also clear 'transform' explicitly so the global :active rule
             (transform: scale(0.95)) can't compose with our 'scale:' property. */
          transform: none;
          rotate: var(--rest-rotation);
          translate: 0 0;
          scale: 1;

          transition: translate 180ms cubic-bezier(0.34, 1.56, 0.64, 1),
                      scale 180ms cubic-bezier(0.34, 1.56, 0.64, 1),
                      background 140ms ease,
                      box-shadow 180ms ease;

          animation: mphIn 420ms cubic-bezier(0.34, 1.56, 0.64, 1) var(--in-delay) both,
                     mphWobble 3.6s ease-in-out var(--wobble-delay) infinite;
        }

        button.mph-tile:not([type="submit"]):not(.wv-header-signout):hover {
          transform: none;
          translate: 0 -2px;
          scale: 1.04;
          box-shadow: 0 6px 0 rgba(39, 50, 72, 0.1), 0 0 0 2px var(--accent);
        }

        button.mph-tile:not([type="submit"]):not(.wv-header-signout):active {
          transform: none;
          scale: 0.92;
          background: var(--accent);
          transition: scale 80ms ease, background 80ms ease;
        }

        button.mph-tile:not([type="submit"]):not(.wv-header-signout):focus-visible {
          outline: 3px solid var(--color-focus);
          outline-offset: 3px;
        }

        .mph-icon-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
        }

        .mph-emoji {
          font-size: 26px;
          line-height: 1;
        }

        .mph-label {
          font-weight: 800;
          font-size: 11px;
          line-height: 1.15;
          color: var(--wv-cadet);
          text-align: center;
          letter-spacing: 0.01em;
          /* keep long slashed compounds ("glue stick/white/washable") inside
             the tile — slashes are valid break points and anywhere lets
             narrow widths chunk words as a last resort. text-wrap: balance
             gives us roughly equal line widths on 2-3 line labels.          */
          overflow-wrap: anywhere;
          word-break: break-word;
          text-wrap: balance;
          max-width: 100%;
        }

        .mph-accent-chip {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: var(--accent);
        }

        @keyframes mphIn {
          from { opacity: 0; translate: 0 8px; scale: 0.85; }
          to   { opacity: 1; translate: 0 0;   scale: 1; }
        }

        /* rotate-only wobble leaves translate + scale free for hover/active */
        @keyframes mphWobble {
          0%, 100% { rotate: var(--rest-rotation); }
          50%      { rotate: calc(var(--rest-rotation) + 1.2deg); }
        }

        @media (prefers-reduced-motion: reduce) {
          button.mph-tile:not([type="submit"]):not(.wv-header-signout) {
            animation: none;
            transition: background 120ms ease;
            transform: none;
            rotate: var(--rest-rotation);
            translate: 0 0;
            scale: 1;
          }
          button.mph-tile:not([type="submit"]):not(.wv-header-signout):hover {
            translate: 0 0;
            scale: 1;
          }
          button.mph-tile:not([type="submit"]):not(.wv-header-signout):active {
            scale: 1;
          }
        }
      `}</style>
    </div>
  );
}
