"use client";

/**
 * FoundPicker — the "tap what you have" grid, shared by the classic and
 * timer look modes.
 *
 * Renders the 39 pilot materials as EmojiTiles (characters resolve from
 * form_primary automatically). Selection lives in local state; "done
 * looking!" saves the titles to sessionStorage and heads to make.
 * Zero reading required: tiles are pictures-first, the count chip and
 * done button carry the only words.
 */

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { resolveCharacterFromForm } from "@windedvertigo/characters";
import { EmojiTile } from "@/components/matcher/emoji-tile";
import { MINI_MATERIALS } from "@/lib/mini-data";
import { MINI_AT_ROOT, miniHref, saveFound } from "@/lib/mini-pilot";
import { getGroup, getSelectedPlayer } from "@/lib/cw-identity";
import { submitMaterial } from "@/lib/cw-materials";
import { miniTrace } from "@/lib/cw-mini-trace";

// plain <img> srcs don't get basePath auto-prepended — serve icons from
// whichever flavour this build is mounted at
const ICON_BASE = MINI_AT_ROOT ? "/harbour/creaseworks-mini" : "/harbour/creaseworks";

// titles already on the list — a typed match selects the tile instead of
// submitting a duplicate for review.
const MATERIAL_TITLES = new Set(MINI_MATERIALS.map((m) => m.title));
const MAT_BY_TITLE = new Map(MINI_MATERIALS.map((m) => [m.title, m] as const));

export function FoundPicker({
  /** heading above the grid — modes set their own framing */
  prompt,
  /** when given, called with the picked titles instead of the default
   *  save-and-route-to-make (used by the things game's multi-round loop) */
  onDone,
  /** label for the finish button (default heads to make) */
  doneLabel = "done finding! →",
  /** which find tool invoked the picker — stamped on the material_picked trace */
  tool = "classic",
}: {
  prompt: string;
  onDone?: (picked: string[]) => void;
  doneLabel?: string;
  tool?: string;
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

  // "bring back whatever you find" — a material that isn't on the list.
  // Used privately in this session immediately; submitted to the collective
  // for review (only when a family/class code is set, so it's attributable).
  const [custom, setCustom] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const submittedRef = useRef<Set<string>>(new Set());

  const addCustom = useCallback(() => {
    const title = draft.trim().toLowerCase().slice(0, 48);
    if (!title) return;
    setPicked((prev) => new Set(prev).add(title));
    setDraft("");
    if (MATERIAL_TITLES.has(title)) return; // already listed — just select it
    // synchronous guard: a rapid double-tap fires addCustom twice before state
    // commits, so dedup on a ref (not the custom array) to avoid a double POST.
    if (submittedRef.current.has(title)) return;
    submittedRef.current.add(title);
    setCustom((prev) => (prev.includes(title) ? prev : [...prev, title]));
    const code = getGroup()?.code;
    if (code) void submitMaterial({ code, title, submittedBy: getSelectedPlayer()?.avatar ?? null });
  }, [draft]);

  // optional "what does it want to do?" — logs wants_to_do; fully ignorable
  const [chosen, setChosen] = useState<Record<string, string>>({});
  const chooseVerb = useCallback((title: string, verb: string) => {
    setChosen((prev) => ({ ...prev, [title]: verb }));
    miniTrace("wants_to_do", { material: title, verb });
  }, []);

  const done = useCallback(() => {
    if (onDone) {
      onDone(Array.from(picked)); // multi-round tools handle their own saving
      return;
    }
    // log what was gathered — family_code-keyed, no playdate chosen yet, no identity
    for (const title of picked) {
      miniTrace("material_picked", {
        material: title,
        look_tool: tool,
        loud_quiet: MAT_BY_TITLE.get(title)?.loudQuiet ?? null,
      });
    }
    saveFound(Array.from(picked));
    router.push(miniHref("/make"));
  }, [picked, router, onDone, tool]);

  const count = picked.size;
  const affordable = Array.from(picked)
    .map((t) => MAT_BY_TITLE.get(t))
    .filter((m): m is NonNullable<typeof m> => !!m && (m.affords?.length ?? 0) > 0);

  return (
    <div className="mini-found">
      <style>{`
        /* white tiles + readable labels — scoped so prod's EmojiTile is untouched */
        .mini-found .et-tile {
          background: var(--wv-white);
          border-width: 2px;
        }
        .mini-found .et-label {
          opacity: 1;
          color: #4b5563;
          /* reserve two lines so 1-line and 2-line names yield equal
             tile heights — uniform grid regardless of label length */
          min-height: 2.4em;
        }
        .mini-found-prompt {
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-weight: 800;
          /* ≥18.66px bold = WCAG "large text" → champagne clears AA on cornflower */
          font-size: 20px;
          color: var(--color-text-on-dark);
          margin-bottom: 14px;
        }
        .mini-found-aff { margin: 2px 0 18px; }
        .mini-found-aff-q {
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-weight: 800; font-size: 14px; color: var(--color-text-on-dark); margin-bottom: 8px;
        }
        .mini-found-aff-q span { font-weight: 700; opacity: 0.8; }
        .mini-found-aff-row { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; margin-bottom: 6px; }
        .mini-found-aff-name {
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-weight: 800; font-size: 13px; color: var(--color-text-on-dark); min-width: 116px;
        }
        .mini-found-aff-verbs { display: inline-flex; flex-wrap: wrap; gap: 6px; }
        button.mini-found-verb:not([type="submit"]):not(.wv-header-signout) {
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-weight: 800; font-size: 12px; color: var(--wv-cadet); background: var(--wv-white);
          border: 1.5px solid rgba(39, 50, 72, 0.16); border-radius: 10px 12px 8px 11px;
          padding: 5px 10px; cursor: pointer;
        }
        button.mini-found-verb[data-on="true"] {
          background: color-mix(in srgb, var(--wv-teal) 24%, var(--wv-white)); border-color: var(--wv-teal);
        }
        button.mini-found-verb:focus-visible { outline: 3px solid var(--color-focus); outline-offset: 2px; }
        .mini-found-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          padding-bottom: 14px;
        }
        @media (min-width: 480px) {
          .mini-found-grid { grid-template-columns: repeat(4, 1fr); }
        }
        .mini-found-add {
          padding: 4px 0 96px; /* clears the sticky done bar */
        }
        .mini-found-add-label {
          display: block;
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-weight: 800;
          font-size: 14px;
          color: var(--color-text-on-dark);
          margin-bottom: 8px;
        }
        .mini-found-add-row { display: flex; gap: 8px; }
        .mini-found-add-input {
          flex: 1;
          min-width: 0;
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-size: 16px; /* ≥16px avoids iOS zoom-on-focus */
          color: var(--wv-cadet);
          background: var(--wv-white);
          border: 2px solid rgba(39, 50, 72, 0.18);
          border-radius: 14px;
          padding: 10px 14px;
        }
        .mini-found-add-input:focus-visible {
          outline: 3px solid var(--color-focus);
          outline-offset: 2px;
        }
        button.mini-found-add-btn:not([type="submit"]):not(.wv-header-signout) {
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-weight: 800;
          font-size: 15px;
          color: var(--wv-white);
          background: var(--wv-teal);
          border: none;
          border-radius: 14px;
          padding: 10px 18px;
          cursor: pointer;
          white-space: nowrap;
        }
        button.mini-found-add-btn:not([type="submit"]):not(.wv-header-signout):disabled {
          opacity: 0.4;
          cursor: default;
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
              mat.iconUrl ?? (mat.icon ? `${ICON_BASE}/icons/materials/${mat.icon}.png` : undefined)
            }
            characterName={mat.preferIcon || mat.iconUrl ? null : resolveCharacterFromForm(mat.formPrimary, mat.title)}
            label={mat.title}
            selected={picked.has(mat.title)}
            onClick={() => toggle(mat.title)}
            index={i}
            size="md"
            fluid
          />
        ))}
        {custom.map((title, i) => (
          <EmojiTile
            key={`custom-${title}`}
            emoji="🧱"
            characterName={null}
            label={title}
            selected={picked.has(title)}
            onClick={() => toggle(title)}
            index={MINI_MATERIALS.length + i}
            size="md"
            fluid
          />
        ))}
      </div>

      {affordable.length > 0 && (
        <div className="mini-found-aff">
          <p className="mini-found-aff-q">
            what does each want to do? <span>(tap if you like — or just finish)</span>
          </p>
          {affordable.map((m) => (
            <div key={m.id} className="mini-found-aff-row">
              <span className="mini-found-aff-name">{m.emoji ?? "🧱"} {m.title}</span>
              <span className="mini-found-aff-verbs">
                {(m.affords ?? []).map((v) => (
                  <button
                    key={v}
                    type="button"
                    className="mini-found-verb"
                    data-on={chosen[m.title] === v}
                    onClick={() => chooseVerb(m.title, v)}
                  >
                    {v}
                  </button>
                ))}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="mini-found-add">
        <label htmlFor="mini-add-mat" className="mini-found-add-label">
          didn’t see it? add what you found:
        </label>
        <div className="mini-found-add-row">
          <input
            id="mini-add-mat"
            className="mini-found-add-input"
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addCustom();
              }
            }}
            placeholder="type what you found"
            maxLength={48}
            autoComplete="off"
            aria-label="add a material you found that isn’t on the list"
          />
          <button
            type="button"
            className="mini-found-add-btn"
            onClick={addCustom}
            disabled={!draft.trim()}
          >
            + add
          </button>
        </div>
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
          {doneLabel}
        </button>
      </div>
    </div>
  );
}
