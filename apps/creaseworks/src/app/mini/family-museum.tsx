"use client";

/**
 * FamilyMuseum (P1.4) — a warm, per-family gallery of everything THIS family has
 * made, shown on the find-again (wow) stage. Keyed to the family/class code.
 *
 * This is a museum of what IS, never a checklist of what's missing: no empty
 * slots, no completion meter, no "x of y", no progress bars, no counts framed as
 * a target, no badges/scores/streaks/levels. The gentle "your family has made 7
 * things" line celebrates the collection — it never implies a goal.
 *
 * A family's OWN pending (not-yet-approved) photos stay visible to them here,
 * exactly as before — the pending pill just marks "waiting to join the wall".
 * Read-only: no new API, route, or trace event. wow/page.tsx owns the single
 * fetch of `mine` (and the code + photoSrc auth) and hands them down as props,
 * so the global wall's fetch/render and all moderation logic stay untouched.
 *
 * Creations are grouped by the playdate they came from (MINI_ACTIVITIES titles),
 * so a family sees their making gathered into little rooms — with anything that
 * has no known playdate gently gathered at the end.
 */

import { useMemo, useState } from "react";
import { MINI_ACTIVITIES } from "@/lib/mini-pilot";

interface WallItem {
  id: string;
  activity_slug: string | null;
  body: string | null;
  has_photo: number;
  created_at: string;
}

interface MineItem extends WallItem {
  approved: number;
}

interface FamilyMuseumProps {
  /** the family's own creations (pending + approved), fetched by wow/page.tsx */
  mine: MineItem[] | null;
  /** the family/class code, or null before it is set */
  code: string | null;
  /** the shared card renderer from wow/page.tsx (keeps pending-photo auth identical) */
  renderCard: (item: WallItem, pending: boolean) => React.ReactNode;
  /** opens the grown-up corner so a family can set their code */
  onSetCode: () => void;
}

/** an ordered room of creations that share a playdate (or the untitled gather) */
interface MuseumRoom {
  slug: string | null;
  title: string | null;
  accent: string;
  items: MineItem[];
}

const UNTITLED_ACCENT = "var(--wv-cornflower)";

export function FamilyMuseum({ mine, code, renderCard, onSetCode }: FamilyMuseumProps) {
  // the whole museum is tucked behind one calm, closed-by-default disclosure so
  // the wall (what the hero promises) leads and the family's own shelf waits a
  // tap away — matching the fold-phase "need a hand?" collapse pattern.
  const [open, setOpen] = useState(false);

  // group creations into rooms by playdate, keeping MINI_ACTIVITIES order; a
  // final room gathers anything with no known playdate. useMemo so the grouping
  // only reruns when the family's creations change.
  const rooms = useMemo<MuseumRoom[]>(() => {
    if (!mine || mine.length === 0) return [];
    const bySlug = new Map<string | null, MineItem[]>();
    for (const item of mine) {
      const key = item.activity_slug;
      const bucket = bySlug.get(key);
      if (bucket) bucket.push(item);
      else bySlug.set(key, [item]);
    }
    const out: MuseumRoom[] = [];
    // known playdates first, in their curated order
    for (const activity of MINI_ACTIVITIES) {
      const items = bySlug.get(activity.slug);
      if (items && items.length) {
        out.push({ slug: activity.slug, title: activity.title, accent: activity.accent, items });
        bySlug.delete(activity.slug);
      }
    }
    // then anything left (unknown slug or none) gathered gently at the end
    const leftovers: MineItem[] = [];
    for (const items of bySlug.values()) leftovers.push(...items);
    if (leftovers.length) {
      out.push({ slug: null, title: null, accent: UNTITLED_ACCENT, items: leftovers });
    }
    return out;
  }, [mine]);

  const total = mine?.length ?? 0;
  // "made 7 things" celebrates the collection — never a target. one thing reads
  // naturally in the singular; before anything is made, we simply welcome them.
  const madeLine =
    total === 0
      ? null
      : total === 1
        ? "your family has made 1 thing so far — here it is. 🖼️"
        : `your family has made ${total} things so far — here they all are. 🖼️`;

  return (
    <section className="mini-museum-section" aria-label="your family museum">
      <button
        type="button"
        className="mini-help-toggle"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span>🏛️ see everything your family made</span>
        <span className="mini-help-toggle-cue" aria-hidden="true">{open ? "hide ▾" : "open ▸"}</span>
      </button>

      {open && (
        <div className="mini-help-panel">
          {!code ? (
            // no code yet → gentle invitation to set one
            <p className="mini-museum-hint">
              set your family or class code to open your museum.{" "}
              <button type="button" className="mini-museum-link" onClick={onSetCode}>
                set it up →
              </button>
            </p>
          ) : mine === null ? null : total === 0 ? (
            <p className="mini-museum-hint">
              your museum is ready for its first creation — make something on the show page and it
              walks straight in. 📸
            </p>
          ) : (
            <>
              {madeLine && <p className="mini-museum-count">{madeLine}</p>}
              {rooms.map((room) => (
                <div className="mini-museum-room" key={room.slug ?? "__untitled"}>
                  <p
                    className="mini-museum-room-h"
                    style={{ ["--accent" as string]: room.accent }}
                  >
                    {room.title ?? "a little of everything"}
                  </p>
                  <div className="mini-museum-grid">
                    {room.items.map((item) => renderCard(item, item.approved !== 1))}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      <MuseumStyle />
    </section>
  );
}

/** scoped styles — kept together so the museum stays self-contained */
function MuseumStyle() {
  return (
    <style>{`
      .mini-museum-section { margin-bottom: 28px; }
      /* one calm, collapsed entry point on the navy canvas — mirrors the
         fold-phase "need a hand?" disclosure so the two feel of a piece. */
      button.mini-help-toggle:not([type="submit"]):not(.wv-header-signout) {
        display: flex; align-items: center; justify-content: space-between; gap: 10px; width: 100%;
        font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
        font-weight: 800; font-size: 14px; color: var(--wv-white);
        background: transparent; border: 1.5px dashed rgba(255, 255, 255, 0.55);
        border-radius: 16px 20px 14px 18px; padding: 12px 16px; cursor: pointer; text-align: left;
        transition: background 140ms ease;
      }
      button.mini-help-toggle:hover { background: rgba(255, 255, 255, 0.08); }
      button.mini-help-toggle:focus-visible { outline: 3px solid var(--color-focus); outline-offset: 2px; }
      .mini-help-toggle-cue { font-size: 13px; font-weight: 800; opacity: 0.85; }
      .mini-help-panel { margin-top: 12px; }
      .mini-museum-count {
        font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
        font-weight: 800;
        font-size: 14px;
        color: var(--wv-white);
        margin: 0 0 16px;
        line-height: 1.5;
      }
      .mini-museum-room { margin-bottom: 22px; }
      .mini-museum-room:last-child { margin-bottom: 0; }
      .mini-museum-room-h {
        display: inline-block;
        font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
        font-weight: 800;
        font-size: 13px;
        color: var(--wv-cadet);
        background: color-mix(in srgb, var(--accent) 22%, var(--wv-white));
        border: 1.5px solid var(--accent);
        border-radius: 10px 14px 8px 12px;
        padding: 4px 11px;
        margin: 0 0 12px;
      }
      .mini-museum-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
      @media (max-width: 420px) { .mini-museum-grid { grid-template-columns: 1fr; } }
      .mini-museum-hint {
        font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
        font-weight: 700;
        font-size: 14px;
        color: var(--wv-white);
        line-height: 1.5;
      }
      button.mini-museum-link:not([type="submit"]):not(.wv-header-signout) {
        font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
        font-weight: 800;
        font-size: 14px;
        color: var(--wv-white);
        background: none;
        border: none;
        padding: 0;
        text-decoration: underline;
        cursor: pointer;
      }
      button.mini-museum-link:focus-visible { outline: 3px solid var(--color-focus); outline-offset: 2px; border-radius: 6px; }
    `}</style>
  );
}
