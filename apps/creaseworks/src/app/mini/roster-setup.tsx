"use client";

/**
 * RosterSetup — the anonymous avatar roster, inside the grown-up corner.
 *
 * One code now: the family/class code is validated above (in the corner),
 * and this manages the avatars that hang off it — so the code, photo
 * sharing, the roster, and the behavioural traces all key off one value.
 * Two kinds of member:
 *   • the kids   — each child gets a buddy (the within-child key)
 *   • the grown-ups — parents/teachers get one too, so multiple adults
 *     across sessions are identifiable
 * Colour + animal only — never a name. The adult's "teal-otter = my child"
 * mapping stays in their head.
 */

import { useEffect, useState } from "react";
import {
  getGroup,
  setGroup,
  fetchRoster,
  addPlayer,
  removePlayer,
  splitRoster,
  type GroupKind,
  type Player,
  type PlayerKind,
} from "@/lib/cw-identity";
import { ALL_AVATARS, avatarEmoji, avatarHex, avatarLabel } from "@/lib/cw-avatars";

// display caps only — the server (eval-server ROSTER_MAX_*) is authoritative.
const FAMILY_CAP = 8;
const CLASS_CAP = 40;

export function RosterSetup({ code }: { code: string | null }) {
  const [kind, setKind] = useState<GroupKind>("family");
  const [players, setPlayers] = useState<Player[]>([]);
  const [adding, setAdding] = useState<PlayerKind | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // bind to the validated code: adopt its existing kind + roster
  useEffect(() => {
    if (!code) {
      setPlayers([]);
      return;
    }
    const g = getGroup();
    if (g?.kind) setKind(g.kind);
    let cancelled = false;
    void fetchRoster(code).then((r) => {
      if (cancelled) return;
      const k = r.kind ?? g?.kind ?? "family";
      setKind(k);
      setGroup(code, k); // ensure the code is bound as the group (traces attribute)
      setPlayers(r.players);
      if (r.players.length === 0) setAdding("child"); // empty → show the kids grid
    });
    return () => {
      cancelled = true;
    };
  }, [code]);

  const { children, adults } = splitRoster(players);
  const cap = kind === "class" ? CLASS_CAP : FAMILY_CAP;
  const full = players.length >= cap;
  const available = ALL_AVATARS.filter((a) => !players.some((p) => p.avatar === a));

  async function add(avatar: string, playerKind: PlayerKind) {
    if (!code) return;
    setErr(null);
    setBusy(true);
    const updated = await addPlayer(code, kind, avatar, playerKind);
    setBusy(false);
    if (!updated) {
      setErr("couldn't add that one — check your connection and try again.");
      return;
    }
    setPlayers(updated);
  }

  async function remove(id: string) {
    if (!code) return;
    setBusy(true);
    await removePlayer(code, id);
    setPlayers((ps) => ps.filter((p) => p.id !== id));
    setBusy(false);
  }

  function flipKind(k: GroupKind) {
    setKind(k);
    if (code) setGroup(code, k);
  }

  function addGrid(playerKind: PlayerKind) {
    return (
      <div className="rs-add-grid" role="group" aria-label={`choose a ${playerKind === "adult" ? "grown-up" : "buddy"} to add`}>
        {available.map((a) => (
          <button
            key={a}
            type="button"
            className="rs-av"
            style={{ background: avatarHex(a) }}
            onClick={() => add(a, playerKind)}
            disabled={busy}
            aria-label={`add ${avatarLabel(a)}`}
          >
            {avatarEmoji(a)}
          </button>
        ))}
      </div>
    );
  }

  function chips(list: Player[]) {
    return (
      <div className="rs-roster">
        {list.map((p) => (
          <span key={p.id} className="rs-chip" data-adult={p.kind === "adult"}>
            <span className="rs-chip-face" style={{ background: avatarHex(p.avatar) }} aria-hidden="true">
              {avatarEmoji(p.avatar)}
            </span>
            <span className="rs-chip-name">{avatarLabel(p.avatar)}</span>
            <button
              type="button"
              className="rs-chip-x"
              onClick={() => remove(p.id)}
              aria-label={`remove ${avatarLabel(p.avatar)}`}
            >
              ×
            </button>
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className="rs">
      <style>{`
        .rs { border-top: 1.5px solid rgba(39, 50, 72, 0.1); padding-top: 14px; margin-bottom: 6px; }
        .rs-h { font-family: var(--font-fraunces), serif; font-weight: 600; font-size: 16px; color: var(--wv-cadet); margin: 0 0 4px; }
        .rs-note { font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif; font-size: 12px; line-height: 1.55; color: #6b7280; margin: 0 0 10px; }
        .rs-note strong { color: var(--wv-cadet); }
        .rs-locked { font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif; font-size: 12.5px; color: #6b7280; line-height: 1.55; margin: 0; }
        .rs-modes { display: flex; gap: 8px; margin-bottom: 10px; }
        button.rs-mode { cursor: pointer; flex: 1; font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif; font-weight: 800; font-size: 13px;
          color: var(--wv-cadet); background: var(--wv-white); border: 1.5px solid rgba(39, 50, 72, 0.16); border-radius: 12px; padding: 9px 0; }
        button.rs-mode[data-on="true"] { border-color: var(--wv-teal); background: var(--wv-mint); }
        button.rs-mode:focus-visible { outline: 3px solid var(--color-focus); outline-offset: 2px; }
        .rs-section-h { font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif; font-weight: 800; font-size: 13px; color: var(--wv-cadet); margin: 12px 0 6px; }
        .rs-roster { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 6px; }
        .rs-chip { display: inline-flex; align-items: center; gap: 6px; padding: 4px 8px 4px 4px; background: var(--wv-white);
          border: 1.5px solid rgba(39, 50, 72, 0.14); border-radius: 12px; }
        .rs-chip[data-adult="true"] { border-color: var(--wv-navy); border-style: dashed; }
        .rs-chip-face { width: 28px; height: 28px; border-radius: 9px 11px 8px 10px; display: inline-flex; align-items: center; justify-content: center; font-size: 17px; }
        .rs-chip-name { font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif; font-weight: 700; font-size: 12px; color: var(--wv-cadet); }
        button.rs-chip-x { cursor: pointer; background: none; border: none; color: #9ca3af; font-size: 15px; font-weight: 800; line-height: 1; padding: 0 2px; }
        button.rs-chip-x:focus-visible { outline: 2px solid var(--color-focus); outline-offset: 1px; border-radius: 4px; }
        .rs-add-prompt { font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif; font-weight: 700; font-size: 12.5px; line-height: 1.5; color: var(--wv-cadet); margin: 0 0 8px; }
        button.rs-add-toggle { cursor: pointer; font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif; font-weight: 800; font-size: 13px;
          color: var(--wv-cadet); background: var(--wv-white); border: 1.5px dashed rgba(39, 50, 72, 0.25); border-radius: 12px; padding: 8px 14px; }
        button.rs-add-toggle:focus-visible { outline: 3px solid var(--color-focus); outline-offset: 2px; }
        /* no inner max-height/overflow: the grown-up sheet is the single
           scroll. a nested scroll here was shorter than the grid (avatars
           clipped) and ate taps on touch — flow the whole grid instead. */
        .rs-add-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 8px; margin-top: 8px; padding: 2px; }
        @media (max-width: 380px) { .rs-add-grid { grid-template-columns: repeat(5, 1fr); } }
        button.rs-av { cursor: pointer; aspect-ratio: 1; border: none; border-radius: 12px 14px 10px 13px; display: flex; align-items: center; justify-content: center;
          font-size: 22px; box-shadow: 0 2px 0 rgba(39, 50, 72, 0.14); transition: scale 120ms ease; }
        button.rs-av:hover { scale: 1.08; }
        button.rs-av:focus-visible { outline: 3px solid var(--color-focus); outline-offset: 2px; }
        .rs-cap { font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif; font-size: 11.5px; color: #6b7280; margin-top: 10px; }
        .rs-err { font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif; font-size: 12px; color: var(--wv-redwood); margin-top: 8px; }
        @media (prefers-reduced-motion: reduce) { button.rs-av:hover { scale: 1; } }
      `}</style>

      <p className="rs-h">who&rsquo;s playing? (set up the roster)</p>
      <p className="rs-note">
        give each child — and each grown-up — an anonymous buddy so we can see how a child&rsquo;s play grows over
        visits, and which grown-up was facilitating. <strong>we store a colour + animal only — never a name.</strong>{" "}
        you keep &ldquo;teal otter = my child&rdquo; in your head.
      </p>

      {!code ? (
        <p className="rs-locked">enter your family or class code above first — then set up who plays.</p>
      ) : (
        <>
          {players.length === 0 && (
            <div className="rs-modes">
              <button type="button" className="rs-mode" data-on={kind === "family"} onClick={() => flipKind("family")}>
                👪 a family
              </button>
              <button type="button" className="rs-mode" data-on={kind === "class"} onClick={() => flipKind("class")}>
                🏫 a class
              </button>
            </div>
          )}

          {/* the kids */}
          <p className="rs-section-h">🧒 the kids</p>
          {children.length > 0 && chips(children)}
          {full ? null : adding === "child" || children.length === 0 ? (
            <>
              {children.length === 0 && (
                <p className="rs-add-prompt">
                  tap a buddy for each child{kind === "class" ? " — one per pupil" : ""}. add more anytime — new
                  sibling or classmate? add them here.
                </p>
              )}
              {addGrid("child")}
              {children.length > 0 && (
                <button type="button" className="rs-add-toggle" style={{ marginTop: 8 }} onClick={() => setAdding(null)}>
                  done adding kids
                </button>
              )}
            </>
          ) : (
            <button type="button" className="rs-add-toggle" onClick={() => setAdding("child")}>
              + add another child
            </button>
          )}

          {/* the grown-ups */}
          <p className="rs-section-h">👤 the grown-ups</p>
          {adults.length > 0 && chips(adults)}
          {full ? null : adding === "adult" ? (
            <>
              {addGrid("adult")}
              <button type="button" className="rs-add-toggle" style={{ marginTop: 8 }} onClick={() => setAdding(null)}>
                done adding grown-ups
              </button>
            </>
          ) : (
            <button type="button" className="rs-add-toggle" onClick={() => setAdding("adult")}>
              {adults.length ? "+ add another grown-up" : "+ add a grown-up (parent / teacher)"}
            </button>
          )}

          <p className="rs-cap">
            {children.length} {children.length === 1 ? "child" : "children"} · {adults.length} grown-up
            {adults.length === 1 ? "" : "s"} ({players.length}/{cap}){full ? " — roster full" : ""}.
          </p>
          {err && <p className="rs-err">{err}</p>}
        </>
      )}
    </div>
  );
}
