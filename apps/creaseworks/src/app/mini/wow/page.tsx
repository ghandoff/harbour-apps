"use client";

/**
 * mini wow — the curated wall.
 *
 * Approved submissions from pilot families: photo + the child's words +
 * which activity. Suggestion box, not live feed — a grown-up on our
 * side approves each one before it appears (D1 `approved` flag).
 */

import { useEffect, useState } from "react";
import { apiUrl } from "@/lib/api-url";
import { MINI_ACTIVITIES } from "@/lib/mini-pilot";
import { MiniStageHero } from "../stage-hero";

interface WallItem {
  id: string;
  activity_slug: string | null;
  body: string | null;
  has_photo: number;
  created_at: string;
}

export default function MiniWowPage() {
  const [wall, setWall] = useState<WallItem[] | null>(null);

  useEffect(() => {
    fetch(apiUrl("/api/mini/wall"))
      .then((r) => (r.ok ? r.json() : { wall: [] }))
      .then((d) => setWall(d.wall ?? []))
      .catch(() => setWall([]));
  }, []);

  const titleFor = (slug: string | null) =>
    MINI_ACTIVITIES.find((a) => a.slug === slug)?.title ?? null;
  const accentFor = (slug: string | null) =>
    MINI_ACTIVITIES.find((a) => a.slug === slug)?.accent ?? "var(--wv-sienna)";

  return (
    <div>
      <MiniStageHero stage="wow" />

      <style>{`
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
        .mini-wall-card img { width: 100%; aspect-ratio: 4/3; object-fit: cover; display: block; }
        .mini-wall-body { padding: 12px 14px; }
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
      `}</style>

      {wall === null ? null : wall.length === 0 ? (
        <p className="mini-wall-empty">
          the wall is waiting for its first creation —<br />
          yours could be the one! 🦋
        </p>
      ) : (
        <div className="mini-wall">
          {wall.map((item) => (
            <figure
              key={item.id}
              className="mini-wall-card"
              style={{ ["--accent" as string]: accentFor(item.activity_slug) }}
            >
              {item.has_photo ? (
                <img
                  src={apiUrl(`/api/mini/photo/${item.id}`)}
                  alt={item.body ?? "a creation from a pilot family"}
                  loading="lazy"
                />
              ) : null}
              <figcaption className="mini-wall-body">
                {item.body && <p className="mini-wall-words">&ldquo;{item.body}&rdquo;</p>}
                {titleFor(item.activity_slug) && (
                  <p className="mini-wall-activity">{titleFor(item.activity_slug)}</p>
                )}
              </figcaption>
            </figure>
          ))}
        </div>
      )}
    </div>
  );
}
