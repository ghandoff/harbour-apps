"use client";

/**
 * creaseworks mini — welcome.
 *
 * Kid surface only: the four stage characters on their tint dots, the
 * title, one line, one enormous button. Everything adult (framing,
 * family code, print guide) lives in the grown-up corner sheet.
 */

import { useRouter } from "next/navigation";
import CharacterSlot from "@windedvertigo/characters";
import { useCharacterVariant } from "@windedvertigo/characters/variant-context";
import { MINI_STAGES, miniHref } from "@/lib/mini-pilot";

export default function MiniWelcomePage() {
  const router = useRouter();
  const variant = useCharacterVariant();

  return (
    <div className="mini-welcome">
      <style>{`
        .mini-welcome {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding-top: 30px;
        }
        .mini-cast {
          display: flex;
          gap: 14px;
          margin-bottom: 26px;
        }
        .mini-cast-slot {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 92px;
          height: 92px;
          border-radius: 26px 32px 24px 30px;
          background: var(--tint);
          animation: miniBob 3.2s ease-in-out var(--bob-delay) infinite;
        }
        @keyframes miniBob {
          0%, 100% { translate: 0 0; rotate: -1deg; }
          50%      { translate: 0 -7px; rotate: 1.5deg; }
        }
        .mini-title {
          font-family: var(--font-fraunces), serif;
          font-weight: 600;
          font-size: 36px;
          color: var(--wv-cadet);
          margin-bottom: 6px;
        }
        .mini-invite {
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-weight: 800;
          font-size: 18px;
          color: var(--wv-cadet);
          margin: 0 auto 30px;
        }
        button.mini-start:not([type="submit"]):not(.wv-header-signout) {
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-weight: 800;
          font-size: 24px;
          color: var(--wv-white);
          background: var(--wv-redwood);
          border: none;
          border-radius: 26px 32px 24px 30px;
          padding: 22px 48px;
          cursor: pointer;
          box-shadow: 0 6px 0 rgba(39, 50, 72, 0.18);
          transition: scale 160ms cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        button.mini-start:not([type="submit"]):not(.wv-header-signout):hover { scale: 1.05; }
        button.mini-start:not([type="submit"]):not(.wv-header-signout):active { scale: 0.95; }
        button.mini-start:not([type="submit"]):not(.wv-header-signout):focus-visible {
          outline: 3px solid var(--color-focus);
          outline-offset: 3px;
        }
        @media (max-width: 430px) {
          .mini-cast { gap: 8px; }
          .mini-cast-slot { width: 76px; height: 76px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .mini-cast-slot { animation: none; }
        }
      `}</style>

      <div className="mini-cast" aria-hidden="true">
        {MINI_STAGES.map((stage, i) => (
          <span
            key={stage.key}
            className="mini-cast-slot"
            style={{
              ["--bob-delay" as string]: `${i * 0.4}s`,
              ["--tint" as string]: stage.tint,
            }}
          >
            <CharacterSlot
              character={stage.character}
              size={64}
              animate={false}
              variant={variant}
            />
          </span>
        ))}
      </div>

      <h1 className="mini-title">creaseworks mini</h1>
      <p className="mini-invite">find stuff. make something. show everyone!</p>

      <button
        type="button"
        className="mini-start"
        onClick={() => router.push(miniHref("/look"))}
      >
        let&rsquo;s look! →
      </button>
    </div>
  );
}
