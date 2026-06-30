"use client";

/**
 * player-picker — the kid-facing "who's playing?" tap.
 *
 * A purely presentational modal: the trace probe decides WHEN to show it
 * (a roster exists but no player is selected this session) and hands in the
 * roster + a last-player hint. Tap an avatar → onPick; "not right now" →
 * onSkip (an anonymous session, honestly recorded). No names anywhere —
 * just colour + animal tiles, big enough for little hands.
 */

import { avatarEmoji, avatarHex, avatarLabel } from "@/lib/cw-avatars";
import type { Player } from "@/lib/cw-identity";

export function PlayerPicker({
  players,
  lastPlayerId,
  onPick,
  onSkip,
}: {
  players: Player[];
  lastPlayerId?: string | null;
  onPick: (p: Player) => void;
  onSkip: () => void;
}) {
  if (players.length === 0) return null;

  return (
    <div className="pp-scrim" role="dialog" aria-modal="true" aria-label="who's playing?">
      <style>{`
        .pp-scrim {
          position: fixed; inset: 0; z-index: 60;
          background: rgba(39, 50, 72, 0.55);
          display: flex; align-items: center; justify-content: center;
          padding: 20px;
          animation: ppFade 180ms ease both;
        }
        @keyframes ppFade { from { opacity: 0; } to { opacity: 1; } }
        .pp-card {
          background: var(--wv-white);
          border-radius: 28px 34px 26px 32px;
          padding: 24px 22px 18px;
          width: 100%; max-width: 460px;
          max-height: 90vh; overflow-y: auto;
          box-shadow: 0 14px 40px rgba(39, 50, 72, 0.3);
          animation: ppPop 320ms cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }
        @keyframes ppPop { from { opacity: 0; scale: 0.92; } to { opacity: 1; scale: 1; } }
        .pp-title {
          font-family: var(--font-fraunces), serif; font-weight: 600;
          font-size: 26px; color: var(--wv-cadet);
          text-align: center; margin: 0 0 4px;
        }
        .pp-sub {
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-weight: 700; font-size: 15px; color: var(--wv-cadet);
          text-align: center; margin: 0 0 18px;
        }
        .pp-grid {
          display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px;
        }
        @media (max-width: 360px) { .pp-grid { grid-template-columns: repeat(2, 1fr); } }
        button.pp-tile {
          cursor: pointer; background: none; border: none; padding: 0;
          display: flex; flex-direction: column; align-items: center; gap: 6px;
          transition: scale 140ms cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        button.pp-tile:hover { scale: 1.06; }
        button.pp-tile:active { scale: 0.94; }
        button.pp-tile:focus-visible { outline: none; }
        button.pp-tile:focus-visible .pp-face {
          outline: 4px solid var(--color-focus); outline-offset: 3px;
        }
        .pp-face {
          width: 84px; height: 84px;
          border-radius: 26px 30px 24px 28px;
          display: flex; align-items: center; justify-content: center;
          font-size: 44px; line-height: 1;
          box-shadow: 0 5px 0 rgba(39, 50, 72, 0.18);
        }
        .pp-tile[data-last="true"] .pp-face {
          box-shadow: 0 0 0 3px var(--wv-redwood), 0 5px 0 rgba(39, 50, 72, 0.18);
        }
        .pp-name {
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-weight: 700; font-size: 13px; color: var(--wv-cadet);
        }
        .pp-skip {
          display: block; margin: 18px auto 4px; cursor: pointer;
          background: none; border: none;
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-weight: 700; font-size: 14px; color: #6b7280;
          text-decoration: underline; text-underline-offset: 3px;
        }
        .pp-skip:focus-visible { outline: 3px solid var(--color-focus); outline-offset: 2px; border-radius: 6px; }
        @media (prefers-reduced-motion: reduce) {
          .pp-scrim, .pp-card { animation: none; }
          button.pp-tile:hover, button.pp-tile:active { scale: 1; }
        }
      `}</style>

      <div className="pp-card">
        <p className="pp-title">who&rsquo;s playing? 👋</p>
        <p className="pp-sub">tap your buddy</p>
        <div className="pp-grid">
          {players.map((p) => (
            <button
              key={p.id}
              type="button"
              className="pp-tile"
              data-last={p.id === lastPlayerId}
              onClick={() => onPick(p)}
              aria-label={avatarLabel(p.avatar)}
            >
              <span className="pp-face" style={{ background: avatarHex(p.avatar) }} aria-hidden="true">
                {avatarEmoji(p.avatar)}
              </span>
              <span className="pp-name">{avatarLabel(p.avatar)}</span>
            </button>
          ))}
        </div>
        <button type="button" className="pp-skip" onClick={onSkip}>
          not right now
        </button>
      </div>
    </div>
  );
}
