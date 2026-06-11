"use client";

/**
 * FoundPicker — the "tap what you have" grid, shared by the classic and
 * timer look modes.
 *
 * Renders the 36 pilot materials as EmojiTiles (characters resolve from
 * form_primary automatically). Selection lives in local state; "done
 * looking!" saves the titles to sessionStorage and heads to make.
 * Zero reading required: tiles are pictures-first, the count chip and
 * done button carry the only words.
 */

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { resolveCharacterFromForm } from "@windedvertigo/characters";
import { EmojiTile } from "@/components/matcher/emoji-tile";
import { MINI_MATERIALS } from "@/lib/mini-data";
import { MINI_AT_ROOT, miniHref, saveFound } from "@/lib/mini-pilot";

// plain <img> srcs don't get basePath auto-prepended — serve icons from
// whichever flavour this build is mounted at
const ICON_BASE = MINI_AT_ROOT ? "/harbour/creaseworks-mini" : "/harbour/creaseworks";

export function FoundPicker({
  /** heading above the grid — modes set their own framing */
  prompt,
}: {
  prompt: string;
}) {
  const router = useRouter();
  const [picked, setPicked] = useState<Set<string>>(new Set());

  const toggle = useCallback((title: string) => {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      return next;
    });
  }, []);

  const done = useCallback(() => {
    saveFound(Array.from(picked));
    router.push(miniHref("/make"));
  }, [picked, router]);

  const count = picked.size;

  return (
    <div className="mini-found">
      <style>{`
        .mini-found-prompt {
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-weight: 800;
          font-size: 16px;
          color: var(--wv-cadet);
          margin-bottom: 14px;
        }
        .mini-found-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          padding-bottom: 96px; /* room for the sticky done bar */
        }
        @media (min-width: 480px) {
          .mini-found-grid { grid-template-columns: repeat(4, 1fr); }
        }
        .mini-found-bar {
          position: fixed;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 14px;
          padding: 14px 18px calc(14px + env(safe-area-inset-bottom));
          background: var(--wv-white);
          box-shadow: 0 -4px 18px rgba(39, 50, 72, 0.12);
        }
        .mini-found-count {
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-weight: 800;
          font-size: 14px;
          color: var(--wv-cadet);
        }
        button.mini-found-done:not([type="submit"]):not(.wv-header-signout) {
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-weight: 800;
          font-size: 17px;
          color: var(--wv-white);
          background: var(--wv-redwood);
          border: none;
          border-radius: 20px 26px 18px 24px;
          padding: 14px 30px;
          cursor: pointer;
          box-shadow: 0 4px 0 rgba(39, 50, 72, 0.15);
          transition: scale 150ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 150ms ease;
        }
        button.mini-found-done:not([type="submit"]):not(.wv-header-signout):disabled {
          opacity: 0.4;
          cursor: default;
        }
        button.mini-found-done:not([type="submit"]):not(.wv-header-signout):not(:disabled):hover { scale: 1.04; }
        button.mini-found-done:not([type="submit"]):not(.wv-header-signout):not(:disabled):active { scale: 0.95; }
        button.mini-found-done:not([type="submit"]):not(.wv-header-signout):focus-visible {
          outline: 3px solid var(--color-focus);
          outline-offset: 3px;
        }
      `}</style>

      <p className="mini-found-prompt">{prompt}</p>

      <div className="mini-found-grid">
        {MINI_MATERIALS.map((mat, i) => (
          <EmojiTile
            key={mat.id}
            emoji={mat.emoji ?? "🧱"}
            emojiSrc={
              mat.icon ? `${ICON_BASE}/icons/materials/${mat.icon}.png` : undefined
            }
            characterName={resolveCharacterFromForm(mat.formPrimary, mat.title)}
            label={mat.title}
            selected={picked.has(mat.title)}
            onClick={() => toggle(mat.title)}
            index={i}
            size="md"
            fluid
          />
        ))}
      </div>

      <div className="mini-found-bar">
        <span className="mini-found-count" aria-live="polite">
          {count === 0 ? "tap what you found!" : `${count} thing${count === 1 ? "" : "s"}!`}
        </span>
        <button
          type="button"
          className="mini-found-done"
          disabled={count === 0}
          onClick={done}
        >
          done looking! →
        </button>
      </div>
    </div>
  );
}
