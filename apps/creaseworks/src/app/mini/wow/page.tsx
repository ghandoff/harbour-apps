"use client";

/**
 * mini wow — the wall, with a family-scoped "your creations" section.
 *
 * A family sees their OWN photos immediately (pending + approved), scoped by
 * their family/class code. The global "wall" below stays a curated suggestion
 * box — a grown-up on our side approves each one before it appears publicly
 * (D1 `approved` flag). Nothing a family shares is public until reviewed.
 */

import { useEffect, useState } from "react";
import { apiUrl } from "@/lib/api-url";
import { MINI_ACTIVITIES, loadCode } from "@/lib/mini-pilot";
import { MiniStageHero } from "../stage-hero";
import { miniTrace } from "@/lib/cw-mini-trace";
import { FamilyMuseum } from "../family-museum";

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

/**
 * On the public wall, the maker's words are hidden behind "what do YOU think it
 * does?" — you guess in the room, then tap to reveal. Revealing logs a guess_event
 * (family-code-keyed, trace only). No new content is displayed or captured, so the
 * moderation / your-creations / AI pre-screen paths are untouched — kid-safe.
 */
function WallBody({ item }: { item: WallItem }) {
  const [revealed, setRevealed] = useState(false);
  if (!item.body) return null;
  const reveal = () => {
    setRevealed(true);
    miniTrace("guess_event", { playdate_slug: item.activity_slug, kind: "wall_reveal" });
  };
  return revealed ? (
    <p className="mini-wall-words">&ldquo;{item.body}&rdquo;</p>
  ) : (
    <button type="button" className="mini-wall-reveal" onClick={reveal}>
      what do YOU think it does? <span>tap to see their words →</span>
    </button>
  );
}

export default function MiniWowPage() {
  const [wall, setWall] = useState<WallItem[] | null>(null);
  const [mine, setMine] = useState<MineItem[] | null>(null);
  const [code, setCode] = useState<string | null>(null);

  useEffect(() => {
    setCode(loadCode());
    fetch(apiUrl("/api/mini/wall"))
      .then((r) => (r.ok ? r.json() : { wall: [] }))
      .then((d) => setWall(d.wall ?? []))
      .catch(() => setWall([]));
  }, []);

  useEffect(() => {
    if (!code) {
      setMine(null);
      return;
    }
    fetch(apiUrl(`/api/mini/mine?code=${encodeURIComponent(code)}`))
      .then((r) => (r.ok ? r.json() : { mine: [] }))
      .then((d) => setMine(d.mine ?? []))
      .catch(() => setMine([]));
  }, [code]);

  const titleFor = (slug: string | null) =>
    MINI_ACTIVITIES.find((a) => a.slug === slug)?.title ?? null;
  const accentFor = (slug: string | null) =>
    MINI_ACTIVITIES.find((a) => a.slug === slug)?.accent ?? "var(--wv-sienna)";

  // approved photos use the plain (cacheable) url; a family's own pending photo
  // needs its code to authorise the fetch.
  const photoSrc = (item: WallItem, pending: boolean) =>
    apiUrl(
      `/api/mini/photo/${item.id}` +
        (pending && code ? `?code=${encodeURIComponent(code)}` : ""),
    );

  function card(item: WallItem, pending: boolean) {
    return (
      <figure
        key={item.id}
        className="mini-wall-card"
        style={{ ["--accent" as string]: accentFor(item.activity_slug) }}
      >
        {item.has_photo ? (
          <div className="mini-wall-imgwrap">
            <img src={photoSrc(item, pending)} alt={item.body ?? "a creation"} loading="lazy" />
            {pending && <span className="mini-wall-pending">⏳ just your family — waiting to join the wall</span>}
          </div>
        ) : null}
        <figcaption className="mini-wall-body">
          {pending
            ? item.body && <p className="mini-wall-words">&ldquo;{item.body}&rdquo;</p>
            : <WallBody item={item} />}
          {titleFor(item.activity_slug) && (
            <p className="mini-wall-activity">{titleFor(item.activity_slug)}</p>
          )}
        </figcaption>
      </figure>
    );
  }

  return (
    <div>
      <MiniStageHero stage="wow" />

      <style>{`
        .mini-wall-h {
          font-family: var(--font-fraunces), serif;
          font-weight: 600;
          font-size: 20px;
          color: var(--color-text-on-dark);
          margin: 6px 0 4px;
        }
        .mini-wall-sub {
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-weight: 700;
          font-size: 13px;
          color: var(--color-text-on-dark);
          opacity: 0.85;
          margin: 0 0 12px;
        }
        .mini-wall-section { margin-bottom: 28px; }
        .mini-wall { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        @media (max-width: 420px) { .mini-wall { grid-template-columns: 1fr; } }
        .mini-wall-card {
          background: var(--wv-white);
          border: 1.5px solid rgba(39, 50, 72, 0.08);
          border-top: 4px solid var(--accent);
          border-radius: 18px 24px 16px 22px;
          overflow: hidden;
          box-shadow: 0 3px 0 rgba(39, 50, 72, 0.08);
        }
        .mini-wall-imgwrap { position: relative; }
        .mini-wall-card img { width: 100%; aspect-ratio: 4/3; object-fit: cover; display: block; }
        .mini-wall-pending {
          position: absolute;
          left: 8px;
          bottom: 8px;
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-weight: 800;
          font-size: 11px;
          color: var(--wv-cadet);
          background: color-mix(in srgb, var(--wv-sun) 88%, var(--wv-white));
          border-radius: 8px 12px 8px 10px;
          padding: 4px 9px;
          box-shadow: 0 2px 0 rgba(39, 50, 72, 0.16);
        }
        .mini-wall-body { padding: 12px 14px; }
        button.mini-wall-reveal:not([type="submit"]):not(.wv-header-signout) {
          display: block; width: 100%; text-align: left; cursor: pointer;
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-weight: 800; font-size: 13.5px; color: var(--wv-cadet);
          background: color-mix(in srgb, var(--accent) 12%, var(--wv-white));
          border: 1.5px dashed var(--accent); border-radius: 10px 13px 9px 12px; padding: 8px 10px;
        }
        button.mini-wall-reveal span { display: block; font-weight: 700; font-size: 11px; color: #6b7280; margin-top: 2px; }
        button.mini-wall-reveal:focus-visible { outline: 3px solid var(--color-focus); outline-offset: 2px; }
        .mini-wall-words {
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-weight: 700;
          font-size: 14px;
          color: var(--wv-cadet);
          line-height: 1.45;
        }
        .mini-wall-activity {
          display: inline-block;
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-weight: 800;
          font-size: 11px;
          color: var(--wv-cadet);
          background: color-mix(in srgb, var(--accent) 22%, var(--wv-white));
          border: 1.5px solid var(--accent);
          border-radius: 10px 14px 8px 12px;
          padding: 3px 9px;
          margin-top: 8px;
        }
        .mini-wall-empty {
          text-align: center;
          padding: 36px 20px;
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-weight: 800;
          /* ≥18.66px bold = WCAG "large text" → champagne clears AA on cornflower */
          font-size: 20px;
          color: var(--color-text-on-dark);
          line-height: 1.6;
        }
        .mini-wall-hint {
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-weight: 700;
          font-size: 14px;
          color: var(--color-text-on-dark);
          line-height: 1.5;
        }
        button.mini-wall-link {
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-weight: 800;
          font-size: 14px;
          color: var(--color-text-on-dark);
          background: none;
          border: none;
          padding: 0;
          text-decoration: underline;
          cursor: pointer;
        }
      `}</style>

      {/* ── your family museum (scoped to the family code) ── */}
      <FamilyMuseum
        mine={mine}
        code={code}
        renderCard={card}
        onSetCode={() => window.dispatchEvent(new Event("cw:open-corner"))}
      />

      {/* ── the wall (global, curated) ── */}
      <section className="mini-wall-section">
        <h2 className="mini-wall-h">🌟 the wall</h2>
        <p className="mini-wall-sub">creations the collective has picked to share with everyone.</p>
        {wall === null ? null : wall.length === 0 ? (
          <p className="mini-wall-empty">
            the wall is waiting for its first creation —<br />
            yours could be the one! 🦋
          </p>
        ) : (
          <div className="mini-wall">{wall.map((item) => card(item, false))}</div>
        )}
      </section>
    </div>
  );
}
