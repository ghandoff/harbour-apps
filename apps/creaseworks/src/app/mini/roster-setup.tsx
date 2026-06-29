"use client";

/**
 * RosterSetup — the grown-up's anonymous player roster, inside the corner.
 *
 * Distinct from the family CODE (which gates photo sharing, validated
 * against MINI_DB): this is the GROUP roster in the eval store. A caregiver
 * sets up 1–4 family avatars; a teacher enters a class code and builds a
 * ~30-avatar roster shared across that code's devices. We store a colour +
 * animal only — never a child's name. The adult's "teal-otter = my
 * daughter" mapping stays in their head.
 *
 * Group codes are meant to be collective-issued (a family may reuse their
 * familiar family code). Self-serve class-code *creation* with real
 * accounts lives on the harbour unified-auth track — out of scope here.
 */

import { useEffect, useState } from "react";
import {
  getGroup,
  setGroup,
  clearGroup,
  fetchRoster,
  addPlayer,
  removePlayer,
  type Group,
  type Player,
} from "@/lib/cw-identity";
import type { GroupKind } from "@/lib/eval-server";
import { ALL_AVATARS, avatarEmoji, avatarHex, avatarLabel } from "@/lib/cw-avatars";

// display caps only — the server (eval-server ROSTER_MAX_*) is authoritative
// and returns 409 if exceeded.
const FAMILY_CAP = 8;
const CLASS_CAP = 40;

function normCode(raw: string): string | null {
  const c = raw.trim().toLowerCase();
  return /^[a-z0-9][a-z0-9-]{1,39}$/.test(c) ? c : null;
}

export function RosterSetup({ familyCode }: { familyCode?: string | null }) {
  const [group, setGroupState] = useState<Group | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [kind, setKind] = useState<GroupKind>("family");
  const [codeInput, setCodeInput] = useState("");
  const [adding, setAdding] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // restore an existing group + its roster
  useEffect(() => {
    const g = getGroup();
    if (g) {
      setGroupState(g);
      setKind(g.kind);
      void fetchRoster(g.code).then((r) => setPlayers(r.players));
    } else if (familyCode) {
      // prefill the family flow with the code they already use for sharing
      setCodeInput(familyCode);
    }
  }, [familyCode]);

  const cap = (group?.kind ?? kind) === "class" ? CLASS_CAP : FAMILY_CAP;
  const available = ALL_AVATARS.filter((a) => !players.some((p) => p.avatar === a));
  const full = players.length >= cap;

  async function startRoster() {
    setErr(null);
    const code = normCode(codeInput);
    if (!code) {
      setErr("codes are lowercase letters, numbers and hyphens (e.g. sunny-fox).");
      return;
    }
    setBusy(true);
    setGroup(code, kind); // persist on this device
    const g = { code, kind };
    setGroupState(g);
    const r = await fetchRoster(code);
    // if the code already has a roster, adopt its kind for the cap
    if (r.kind) {
      setKind(r.kind);
      setGroup(code, r.kind);
      setGroupState({ code, kind: r.kind });
    }
    setPlayers(r.players);
    setBusy(false);
  }

  async function add(avatar: string) {
    if (!group) return;
    setErr(null);
    setBusy(true);
    const updated = await addPlayer(group.code, group.kind, avatar);
    setBusy(false);
    if (!updated) {
      setErr("couldn't add that one — the roster may be full.");
      return;
    }
    setPlayers(updated);
  }

  async function remove(id: string) {
    if (!group) return;
    setBusy(true);
    await removePlayer(group.code, id);
    setPlayers((ps) => ps.filter((p) => p.id !== id));
    setBusy(false);
  }

  function changeCode() {
    clearGroup();
    setGroupState(null);
    setPlayers([]);
    setAdding(false);
    setCodeInput("");
  }

  const addGrid = (
    <div className="rs-add-grid" role="group" aria-label="choose a buddy to add">
      {available.map((a) => (
        <button
          key={a}
          type="button"
          className="rs-av"
          style={{ background: avatarHex(a) }}
          onClick={() => add(a)}
          disabled={busy}
          aria-label={`add ${avatarLabel(a)}`}
        >
          {avatarEmoji(a)}
        </button>
      ))}
    </div>
  );

  return (
    <div className="rs">
      <style>{`
        .rs { border-top: 1.5px solid rgba(39, 50, 72, 0.1); padding-top: 14px; margin-bottom: 6px; }
        .rs-h { font-family: var(--font-fraunces), serif; font-weight: 600; font-size: 16px; color: var(--wv-cadet); margin: 0 0 4px; }
        .rs-note { font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif; font-size: 12px; line-height: 1.55; color: #6b7280; margin: 0 0 10px; }
        .rs-note strong { color: var(--wv-cadet); }
        .rs-modes { display: flex; gap: 8px; margin-bottom: 10px; }
        button.rs-mode { cursor: pointer; flex: 1; font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif; font-weight: 800; font-size: 13px;
          color: var(--wv-cadet); background: var(--wv-white); border: 1.5px solid rgba(39, 50, 72, 0.16); border-radius: 12px; padding: 9px 0; }
        button.rs-mode[data-on="true"] { border-color: var(--wv-teal); background: var(--wv-mint); }
        button.rs-mode:focus-visible { outline: 3px solid var(--color-focus); outline-offset: 2px; }
        .rs-mode-help { font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif; font-size: 11.5px; color: #6b7280; margin: -4px 0 10px; }
        .rs-row { display: flex; gap: 8px; }
        .rs-input { flex: 1; font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif; font-size: 14px; padding: 8px 12px;
          border: 1.5px solid rgba(39, 50, 72, 0.2); border-radius: 12px; background: var(--wv-white); color: var(--wv-cadet); }
        .rs-input:focus-visible { outline: 3px solid var(--color-focus); outline-offset: 1px; }
        button.rs-start { cursor: pointer; font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif; font-weight: 800; font-size: 13px;
          color: var(--wv-white); background: var(--wv-navy); border: none; border-radius: 12px; padding: 8px 16px; }
        button.rs-start:disabled { opacity: 0.5; cursor: default; }
        button.rs-start:focus-visible { outline: 3px solid var(--color-focus); outline-offset: 2px; }
        .rs-active-head { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; margin-bottom: 8px; }
        .rs-active-code { font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif; font-weight: 800; font-size: 13px; color: var(--wv-cadet); }
        .rs-active-code span { font-weight: 700; color: #6b7280; }
        button.rs-change { cursor: pointer; background: none; border: none; font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-weight: 700; font-size: 12px; color: var(--wv-teal); text-decoration: underline; }
        .rs-roster { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 10px; }
        .rs-chip { display: inline-flex; align-items: center; gap: 6px; padding: 4px 8px 4px 4px; background: var(--wv-white);
          border: 1.5px solid rgba(39, 50, 72, 0.14); border-radius: 12px; }
        .rs-chip-face { width: 28px; height: 28px; border-radius: 9px 11px 8px 10px; display: inline-flex; align-items: center; justify-content: center; font-size: 17px; }
        .rs-chip-name { font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif; font-weight: 700; font-size: 12px; color: var(--wv-cadet); }
        button.rs-chip-x { cursor: pointer; background: none; border: none; color: #9ca3af; font-size: 15px; font-weight: 800; line-height: 1; padding: 0 2px; }
        button.rs-chip-x:focus-visible { outline: 2px solid var(--color-focus); outline-offset: 1px; border-radius: 4px; }
        .rs-add-prompt { font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif; font-weight: 700; font-size: 12.5px; line-height: 1.5; color: var(--wv-cadet); margin: 0 0 8px; }
        button.rs-add-toggle { cursor: pointer; font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif; font-weight: 800; font-size: 13px;
          color: var(--wv-cadet); background: var(--wv-white); border: 1.5px dashed rgba(39, 50, 72, 0.25); border-radius: 12px; padding: 8px 14px; }
        button.rs-add-toggle:focus-visible { outline: 3px solid var(--color-focus); outline-offset: 2px; }
        .rs-add-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 8px; margin-top: 10px; max-height: 188px; overflow-y: auto; padding: 2px; }
        @media (max-width: 380px) { .rs-add-grid { grid-template-columns: repeat(5, 1fr); } }
        button.rs-av { cursor: pointer; aspect-ratio: 1; border: none; border-radius: 12px 14px 10px 13px; display: flex; align-items: center; justify-content: center;
          font-size: 22px; box-shadow: 0 2px 0 rgba(39, 50, 72, 0.14); transition: scale 120ms ease; }
        button.rs-av:hover { scale: 1.08; }
        button.rs-av:focus-visible { outline: 3px solid var(--color-focus); outline-offset: 2px; }
        .rs-cap { font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif; font-size: 11.5px; color: #6b7280; margin-top: 8px; }
        .rs-err { font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif; font-size: 12px; color: var(--wv-redwood); margin-top: 8px; }
        @media (prefers-reduced-motion: reduce) { button.rs-av:hover { scale: 1; } }
      `}</style>

      <p className="rs-h">who&rsquo;s playing? (set up the roster)</p>
      <p className="rs-note">
        give each child an anonymous buddy so we can see how a child&rsquo;s play grows over visits.{" "}
        <strong>we store a colour + animal only — never your child&rsquo;s name.</strong> you keep the
        &ldquo;teal otter = my child&rdquo; in your head.
      </p>

      {!group ? (
        <>
          <div className="rs-modes">
            <button type="button" className="rs-mode" data-on={kind === "family"} onClick={() => setKind("family")}>
              👪 a family
            </button>
            <button type="button" className="rs-mode" data-on={kind === "class"} onClick={() => setKind("class")}>
              🏫 a class
            </button>
          </div>
          <p className="rs-mode-help">
            {kind === "family"
              ? "use your family code, or make a short one up (e.g. sunny-fox)."
              : "enter your class code from us — the roster is shared across every device using it."}
          </p>
          <div className="rs-row">
            <input
              className="rs-input"
              type="text"
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && startRoster()}
              placeholder={kind === "family" ? "sunny-fox" : "room-3b"}
              autoCapitalize="none"
              autoCorrect="off"
              aria-label="group code"
            />
            <button type="button" className="rs-start" disabled={busy} onClick={startRoster}>
              {busy ? "…" : "start"}
            </button>
          </div>
          {err && <p className="rs-err">{err}</p>}
        </>
      ) : (
        <>
          <div className="rs-active-head">
            <span className="rs-active-code">
              {group.code} <span>· {group.kind === "class" ? "class" : "family"} roster</span>
            </span>
            <button type="button" className="rs-change" onClick={changeCode}>
              change code
            </button>
          </div>

          {players.length > 0 && (
            <div className="rs-roster">
              {players.map((p) => (
                <span key={p.id} className="rs-chip">
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
          )}

          {/* empty roster → show the avatars straight away, so adding a child
              isn't hidden behind a toggle (the gap that left a code with zero
              avatars). once there's ≥1, collapse behind "add another buddy"
              for adding throughout — new siblings / classmates. */}
          {players.length === 0 && !full && (
            <>
              <p className="rs-add-prompt">
                tap a buddy for each child{group.kind === "class" ? " — one per pupil" : ""}. you can add more anytime — new sibling or classmate? add them here.
              </p>
              {addGrid}
            </>
          )}

          {players.length > 0 && !full && (
            <>
              <button type="button" className="rs-add-toggle" onClick={() => setAdding((a) => !a)}>
                {adding ? "done adding" : "+ add another buddy"}
              </button>
              {adding && addGrid}
            </>
          )}

          <p className="rs-cap">
            {players.length} / {cap} buddies{full ? " — roster full" : ""}.
          </p>
          {err && <p className="rs-err">{err}</p>}
        </>
      )}
    </div>
  );
}
