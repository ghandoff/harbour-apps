"use client";

/**
 * GrownUpCorner — the in-context facilitator sheet.
 *
 * One small tab pinned to the left edge on every mini page; tapping it
 * slides up a sheet with guidance for the CURRENT stage, the family-code
 * entry, and a print link. Closing returns to the game — no navigation,
 * no second window, ever ("the last thing we want are kids and parents
 * not knowing which windows to be opened" — garrett).
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { apiUrl } from "@/lib/api-url";
import { MINI_ACTIVITY_CONTENT } from "@/lib/mini-data";
import {
  getMiniStage,
  loadCode,
  loadFound,
  loadSelected,
  matchActivities,
  miniHref,
  miniStageFromPathname,
  saveCode,
  loadDial,
  saveDial,
  type MiniDial,
  type MiniStageKey,
} from "@/lib/mini-pilot";
import { postEval } from "@/lib/eval-submit";
import { itemsFor } from "@/lib/eval-rubric";
import {
  setGroup,
  clearGroup,
  fetchRoster,
  splitRoster,
  getSelectedAdult,
  setSelectedAdult,
  type Player,
} from "@/lib/cw-identity";
import { avatarEmoji, avatarHex, avatarLabel } from "@/lib/cw-avatars";
import { RosterSetup } from "./roster-setup";
import { FamilyMaterials } from "./family-materials";
import { ReadAloud } from "./read-aloud";
import { GrownupCard } from "./grownup-card";

const GROWNUP_ITEMS = itemsFor("grownup");

const WELCOME_GUIDE = [
  "a tiny pilot of creaseworks for ages 4–6: look (hunt for materials) → make → show → wow.",
  "your child drives. you hold the phone and read things aloud — resist instructing.",
  "spot a bug or a confusing moment? the 🐛 button (bottom-right) sends it straight to us.",
];

export function GrownUpCorner() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [codeState, setCodeState] = useState<"none" | "checking" | "ok" | "bad">("none");
  const [savedCode, setSavedCode] = useState<string | null>(null);
  const [adults, setAdults] = useState<Player[]>([]);
  const [adult, setAdult] = useState<Player | null>(null);
  const [dial, setDial] = useState<MiniDial | null>(null);
  const [unfoldPrompt, setUnfoldPrompt] = useState<string | null>(null);
  const [matchedSlug, setMatchedSlug] = useState<string | null>(null);
  const [obs, setObs] = useState<Record<string, string | string[] | number>>({});
  const [obsSent, setObsSent] = useState(false);

  const stageKey = miniStageFromPathname(pathname);
  const stage =
    stageKey && ["look", "make", "show", "wow"].includes(stageKey)
      ? getMiniStage(stageKey as MiniStageKey)
      : null;
  const lines = stage?.adultGuide ?? WELCOME_GUIDE;

  useEffect(() => {
    const c = loadCode();
    if (c) {
      setCodeState("ok");
      setSavedCode(c);
    }
    setAdult(getSelectedAdult());
    setDial(loadDial());
  }, []);

  // the first-run banner (and anywhere else) can ask the corner to open
  useEffect(() => {
    const openIt = () => setOpen(true);
    window.addEventListener("cw:open-corner", openIt);
    return () => window.removeEventListener("cw:open-corner", openIt);
  }, []);

  // load the roster's grown-ups for the "who's the grown-up today?" picker
  useEffect(() => {
    if (!open || !savedCode) return;
    let cancelled = false;
    void fetchRoster(savedCode).then((r) => {
      if (!cancelled) setAdults(splitRoster(r.players).adults);
    });
    return () => {
      cancelled = true;
    };
  }, [open, savedCode]);

  // on show: surface the matched activity's unfold prompt for read-aloud
  useEffect(() => {
    if (stageKey !== "show") return setUnfoldPrompt(null);
    const found = loadFound();
    if (!found.length) return;
    // the played playdate (what the child tapped in make) drives the read-aloud —
    // fall back to the material-matcher only if nothing was explicitly selected.
    const slug = loadSelected() ?? matchActivities(found)[0]?.activity.slug ?? null;
    setUnfoldPrompt(slug ? (MINI_ACTIVITY_CONTENT[slug]?.unfold ?? null) : null);
  }, [stageKey]);

  // the matched playdate for this session — drives the grown-up observation
  useEffect(() => {
    const found = loadFound();
    if (!found.length) return;
    // observation is logged against the played playdate, not the material-inferred one
    setMatchedSlug(loadSelected() ?? matchActivities(found)[0]?.activity.slug ?? null);
  }, [stageKey, open]);

  async function checkCode() {
    const trimmed = code.trim().toLowerCase();
    if (!trimmed) return;
    setCodeState("checking");
    try {
      const res = await fetch(apiUrl("/api/mini/session"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: trimmed }),
      });
      if (res.ok) {
        saveCode(trimmed);
        setGroup(trimmed, "family"); // bind the one code as the roster group too
        setSavedCode(trimmed);
        setCodeState("ok");
        window.dispatchEvent(new Event("cw:code-set")); // clear the first-run banner
      } else setCodeState("bad");
    } catch {
      setCodeState("bad");
    }
  }

  function pickAdult(p: Player) {
    setSelectedAdult(p);
    setAdult(p);
  }

  function sendObs() {
    if (!matchedSlug || Object.keys(obs).length === 0) return;
    setObsSent(true);
    // attribute the facilitating grown-up (avatar only, never a name)
    const answers = adult ? { ...obs, "grown-up": adult.avatar } : obs;
    void postEval({ slug: matchedSlug, register: "grownup", name: loadCode(), answers });
  }

  // the moderator tool lives under /mini too — keep the family corner off it
  if (pathname?.endsWith("/moderate")) return null;

  return (
    <>
      <style>{`
        /* left-edge vertical tab — same pattern as the site's accessibility
           widget, and clear of the picker's bottom done-bar + the 🐛 at
           bottom-right */
        button.guc-tab:not([type="submit"]):not(.wv-header-signout) {
          position: fixed;
          left: 0;
          top: 50%;
          translate: 0 -50%;
          z-index: 45;
          writing-mode: vertical-rl;
          rotate: 180deg;
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-weight: 800;
          font-size: 12px;
          color: var(--wv-cadet);
          background: var(--wv-white);
          border: 1.5px solid rgba(39, 50, 72, 0.15);
          border-left: none;
          border-radius: 14px 0 0 14px;
          padding: 16px 7px 16px 9px;
          cursor: pointer;
          box-shadow: 2px 0 10px rgba(39, 50, 72, 0.12);
        }
        button.guc-tab:not([type="submit"]):not(.wv-header-signout):focus-visible {
          outline: 3px solid var(--color-focus);
          outline-offset: 2px;
        }
        .guc-backdrop {
          position: fixed;
          inset: 0;
          z-index: 46;
          background: rgba(39, 50, 72, 0.35);
        }
        .guc-sheet {
          position: fixed;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 47;
          max-height: 72vh;
          overflow-y: auto;
          background: var(--wv-white);
          border-radius: 22px 22px 0 0;
          box-shadow: 0 -8px 30px rgba(39, 50, 72, 0.3);
          padding: 18px 20px calc(22px + env(safe-area-inset-bottom));
          animation: gucUp 240ms cubic-bezier(0.34, 1.3, 0.64, 1);
        }
        @keyframes gucUp { from { translate: 0 40%; opacity: 0.4; } to { translate: 0 0; opacity: 1; } }
        @media (prefers-reduced-motion: reduce) { .guc-sheet { animation: none; } }
        .guc-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }
        .guc-head h2 {
          font-family: var(--font-fraunces), serif;
          font-weight: 600;
          font-size: 19px;
          color: var(--wv-cadet);
        }
        button.guc-close:not([type="submit"]):not(.wv-header-signout) {
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-weight: 800;
          font-size: 13px;
          color: var(--wv-white);
          background: var(--wv-cadet);
          border: none;
          border-radius: 12px;
          padding: 8px 16px;
          cursor: pointer;
        }
        .guc-lines {
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-size: 14px;
          line-height: 1.6;
          color: var(--wv-cadet);
          margin: 0 0 14px 18px;
          list-style: disc;
        }
        .guc-lines li { margin-bottom: 7px; }
        .guc-readaloud {
          background: var(--tint, var(--wv-mint));
          border-radius: 14px;
          padding: 12px 14px;
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-size: 14px;
          line-height: 1.6;
          color: var(--wv-cadet);
          margin-bottom: 14px;
        }
        .guc-readaloud strong { display: block; font-size: 12px; margin-bottom: 4px; }
        .guc-code {
          border-top: 1.5px solid rgba(39, 50, 72, 0.1);
          padding-top: 12px;
        }
        .guc-code-label {
          display: block;
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-weight: 700;
          font-size: 13px;
          color: var(--wv-cadet);
          margin-bottom: 6px;
        }
        .guc-code-row { display: flex; gap: 8px; }
        .guc-code-input {
          flex: 1;
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-size: 14px;
          padding: 8px 12px;
          border: 1.5px solid rgba(39, 50, 72, 0.2);
          border-radius: 12px;
          background: var(--wv-white);
          color: var(--wv-cadet);
        }
        .guc-code-input:focus-visible { outline: 3px solid var(--color-focus); outline-offset: 1px; }
        button.guc-code-save:not([type="submit"]):not(.wv-header-signout) {
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-weight: 800;
          font-size: 13px;
          color: var(--wv-white);
          background: var(--wv-navy);
          border: none;
          border-radius: 12px;
          padding: 8px 16px;
          cursor: pointer;
        }
        .guc-code-ok {
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-weight: 700;
          font-size: 13px;
          color: var(--wv-cadet);
        }
        .guc-code-bad { font-size: 12px; color: var(--wv-redwood); margin-top: 6px; }
        .guc-code-why { font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif; font-size: 12px; line-height: 1.55; color: #6b7280; margin: 0 0 8px; }
        .guc-code-ok strong { font-weight: 800; }
        button.guc-code-change { cursor: pointer; background: none; border: none; padding: 0; font: inherit; font-size: 12px; font-weight: 700; color: var(--wv-teal); text-decoration: underline; }
        button.guc-code-change:focus-visible { outline: 3px solid var(--color-focus); outline-offset: 2px; border-radius: 4px; }
        .guc-help { border-top: 1.5px solid rgba(39, 50, 72, 0.1); padding-top: 12px; margin-top: 12px; }
        .guc-help-h { font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif; font-weight: 800; font-size: 13px; color: var(--wv-cadet); margin: 0 0 6px; }
        .guc-help-why { font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif; font-size: 12px; line-height: 1.5; color: #6b7280; margin: 0 0 8px; }
        .guc-help-row { display: flex; flex-wrap: wrap; gap: 8px; }
        button.guc-help-chip:not([type="submit"]):not(.wv-header-signout) {
          cursor: pointer; font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif; font-weight: 700; font-size: 12.5px; color: var(--wv-cadet);
          background: var(--wv-white); border: 1.5px solid rgba(39, 50, 72, 0.16); border-radius: 14px; padding: 6px 12px;
        }
        button.guc-help-chip[data-on="true"] { border-color: var(--wv-teal); border-width: 2px; background: color-mix(in srgb, var(--wv-teal) 22%, var(--wv-white)); font-weight: 800; }
        button.guc-help-chip:focus-visible { outline: 3px solid var(--color-focus); outline-offset: 2px; }
        .guc-adult { border-top: 1.5px solid rgba(39, 50, 72, 0.1); padding-top: 12px; margin-top: 12px; }
        .guc-adult-h { font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif; font-weight: 800; font-size: 13px; color: var(--wv-cadet); margin: 0 0 8px; }
        .guc-adult-row { display: flex; flex-wrap: wrap; gap: 8px; }
        button.guc-adult-chip:not([type="submit"]):not(.wv-header-signout) {
          display: inline-flex; align-items: center; gap: 6px; cursor: pointer; padding: 4px 11px 4px 4px;
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif; font-weight: 700; font-size: 12.5px; color: var(--wv-cadet);
          background: var(--wv-white); border: 1.5px solid rgba(39, 50, 72, 0.16); border-radius: 14px; transition: scale 120ms ease, background 120ms ease, border-color 120ms ease;
        }
        button.guc-adult-chip[data-on="true"] { border-color: var(--wv-teal); border-width: 2px; background: color-mix(in srgb, var(--wv-teal) 22%, var(--wv-white)); font-weight: 800; }
        button.guc-adult-chip:focus-visible { outline: 3px solid var(--color-focus); outline-offset: 2px; }
        button.guc-adult-chip:active { scale: 0.96; }
        .guc-adult-face { width: 26px; height: 26px; border-radius: 9px 11px 8px 10px; display: inline-flex; align-items: center; justify-content: center; font-size: 15px; }
        @media (prefers-reduced-motion: reduce) { button.guc-adult-chip:active { scale: 1; } }
        .guc-obs { border-top: 1.5px solid rgba(39, 50, 72, 0.1); padding-top: 14px; margin-bottom: 6px; }
        .guc-obs-h { font-family: var(--font-fraunces), serif; font-weight: 600; font-size: 16px; color: var(--wv-cadet); margin: 0 0 10px; }
        .guc-obs-item { margin-bottom: 12px; }
        .guc-obs-q { font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif; font-weight: 700; font-size: 13.5px; color: var(--wv-cadet); margin: 0 0 6px; }
        .guc-obs-help { font-size: 11.5px; color: #6b7280; margin: 0 0 6px; }
        .guc-chips { display: flex; flex-wrap: wrap; gap: 6px; }
        button.guc-chip:not([type="submit"]):not(.wv-header-signout) {
          cursor: pointer; font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif; font-weight: 700; font-size: 12.5px;
          color: var(--wv-cadet); background: var(--wv-white); border: 1.5px solid rgba(39, 50, 72, 0.16); border-radius: 11px; padding: 7px 11px;
          transition: scale 120ms ease, background 120ms ease, border-color 120ms ease;
        }
        button.guc-chip[data-on="true"] { border-color: var(--wv-teal); border-width: 2px; background: color-mix(in srgb, var(--wv-teal) 24%, var(--wv-white)); font-weight: 800; }
        button.guc-chip:focus-visible { outline: 3px solid var(--color-focus); outline-offset: 2px; }
        button.guc-chip:active, button.guc-num:active { scale: 0.95; }
        .guc-nums { display: flex; gap: 6px; }
        button.guc-num:not([type="submit"]):not(.wv-header-signout) {
          cursor: pointer; flex: 1; max-width: 48px; font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif; font-weight: 800; font-size: 14px;
          color: var(--wv-cadet); background: var(--wv-white); border: 1.5px solid rgba(39, 50, 72, 0.16); border-radius: 10px; padding: 8px 0;
          transition: scale 120ms ease, background 120ms ease, border-color 120ms ease;
        }
        button.guc-num[data-on="true"] { border-color: var(--wv-teal); background: var(--wv-teal); color: var(--wv-white); }
        button.guc-num:focus-visible { outline: 3px solid var(--color-focus); outline-offset: 2px; }
        @media (prefers-reduced-motion: reduce) { button.guc-chip:active, button.guc-num:active { scale: 1; } }
        .guc-obs-text {
          width: 100%; box-sizing: border-box; font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif; font-size: 13px;
          color: var(--wv-cadet); background: var(--wv-white); border: 1.5px solid rgba(39, 50, 72, 0.16); border-radius: 10px; padding: 8px 10px; resize: vertical;
        }
        .guc-obs-text:focus-visible { outline: 3px solid var(--color-focus); outline-offset: 1px; }
        button.guc-obs-send:not([type="submit"]):not(.wv-header-signout) {
          margin-top: 4px; cursor: pointer; font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif; font-weight: 800; font-size: 13px;
          color: var(--wv-white); background: var(--wv-teal); border: none; border-radius: 12px; padding: 9px 18px;
        }
        button.guc-obs-send:disabled { opacity: 0.4; cursor: default; }
        button.guc-obs-send:focus-visible { outline: 3px solid var(--color-focus); outline-offset: 3px; }
        .guc-obs-done { font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif; font-weight: 700; font-size: 13px; color: var(--wv-cadet); }
        .guc-collective { display: block; margin-top: 12px; font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif; font-size: 12px; font-weight: 700; color: var(--wv-teal); text-decoration: underline; }
        .guc-print {
          display: inline-block;
          margin-top: 12px;
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-size: 12px;
          color: var(--wv-cadet);
          text-decoration: underline;
        }
        @media print { .guc-tab, .guc-sheet, .guc-backdrop { display: none !important; } }
      `}</style>

      {!open && (
        <button
          type="button"
          className="guc-tab"
          onClick={() => setOpen(true)}
          aria-label="open the grown-up guide for this step"
        >
          ☝ for grown-ups
        </button>
      )}

      {open && (
        <>
          <div className="guc-backdrop" onClick={() => setOpen(false)} aria-hidden="true" />
          <div
            className="guc-sheet"
            role="dialog"
            aria-label="grown-up guide"
            style={stage ? ({ ["--tint" as string]: stage.tint } as React.CSSProperties) : undefined}
          >
            <div className="guc-head">
              <h2>{stage ? `${stage.label} — for grown-ups` : "for grown-ups"}</h2>
              <button type="button" className="guc-close" onClick={() => setOpen(false)}>
                back to the game ↓
              </button>
            </div>

            <ul className="guc-lines">
              {lines.map((line) => (
                <li key={line.slice(0, 24)}>{line}</li>
              ))}
            </ul>

            {/* ONE code — gates sharing + the roster and ties the family's evidence together (#2) */}
            <div className="guc-code">
              {codeState === "ok" && savedCode ? (
                <p className="guc-code-ok">
                  ✓ code <strong>{savedCode}</strong> saved — sharing + who&rsquo;s-playing are on.{" "}
                  <button
                    type="button"
                    className="guc-code-change"
                    onClick={() => {
                      clearGroup();
                      setSavedCode(null);
                      setCode("");
                      setCodeState("none");
                      setAdults([]);
                      setAdult(null);
                    }}
                  >
                    use a different code
                  </button>
                </p>
              ) : (
                <>
                  <label htmlFor="guc-code" className="guc-code-label">
                    your family or class code
                  </label>
                  <p className="guc-code-why">
                    pick one family or class code. it unlocks photo sharing, sets up who&rsquo;s playing (anonymous
                    avatars), and ties your family&rsquo;s evidence together. make up your own — anything memorable
                    works (like sunny-fox or maria-class-3).
                  </p>
                  <div className="guc-code-row">
                    <input
                      id="guc-code"
                      type="text"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && checkCode()}
                      placeholder="sunny-fox"
                      autoCapitalize="none"
                      autoCorrect="off"
                      className="guc-code-input"
                    />
                    <button type="button" className="guc-code-save" disabled={codeState === "checking"} onClick={checkCode}>
                      {codeState === "checking" ? "checking…" : "save"}
                    </button>
                  </div>
                  {codeState === "bad" && (
                    <p className="guc-code-bad">
                      codes are letters, numbers and hyphens — like sunny-fox or maria-class-3.
                    </p>
                  )}
                </>
              )}
            </div>

            {/* P1.1 (relocated): how much help the fold workshop surfaces —
                a grown-up setting, remembered; the child never sets it. */}
            <div className="guc-help">
              <p className="guc-help-h">🤝 how much help?</p>
              <p className="guc-help-why">sets how much the workshop offers when your child gets stuck. change it anytime.</p>
              <div className="guc-help-row">
                {([["point", "🧭 let them figure it out"], ["walk", "🗺️ walk them through it"]] as const).map(([v, label]) => (
                  <button
                    key={v}
                    type="button"
                    className="guc-help-chip"
                    data-on={dial === v}
                    aria-pressed={dial === v}
                    onClick={() => { saveDial(v); setDial(v); }}
                  >
                    {dial === v ? "✓ " : ""}{label}
                  </button>
                ))}
              </div>
            </div>

            <RosterSetup code={savedCode} />

            {/* B4/B6 — pick your accepted material's icon + "materials we added" */}
            <FamilyMaterials />

            {adults.length > 0 && (
              <div className="guc-adult">
                <p className="guc-adult-h">👤 who&rsquo;s the grown-up today?</p>
                <div className="guc-adult-row">
                  {adults.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      className="guc-adult-chip"
                      data-on={adult?.id === a.id}
                      aria-pressed={adult?.id === a.id}
                      onClick={() => pickAdult(a)}
                      aria-label={avatarLabel(a.avatar)}
                    >
                      <span className="guc-adult-face" style={{ background: avatarHex(a.avatar) }} aria-hidden="true">
                        {avatarEmoji(a.avatar)}
                      </span>
                      {adult?.id === a.id ? "✓ " : ""}
                      {avatarLabel(a.avatar)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {unfoldPrompt && (
              <div className="guc-readaloud">
                <strong>read this aloud:</strong>
                <ReadAloud text={unfoldPrompt} />
              </div>
            )}

            {matchedSlug && (
              <div className="guc-obs">
                <p className="guc-obs-h">tell us what you saw</p>
                {obsSent ? (
                  <p className="guc-obs-done">✓ thank you — logged for the team.</p>
                ) : (
                  <>
                    {GROWNUP_ITEMS.map((it) => (
                      <div key={it.id} className="guc-obs-item">
                        <p className="guc-obs-q">{it.prompt}</p>
                        {it.help && <p className="guc-obs-help">{it.help}</p>}
                        {it.type === "checklist" && (
                          <div className="guc-chips">
                            {(it.options ?? []).map((opt) => {
                              const arr = Array.isArray(obs[it.id]) ? (obs[it.id] as string[]) : [];
                              const on = arr.includes(opt);
                              return (
                                <button
                                  key={opt}
                                  type="button"
                                  className="guc-chip"
                                  data-on={on}
                                  onClick={() =>
                                    setObs((o) => ({ ...o, [it.id]: on ? arr.filter((x) => x !== opt) : [...arr, opt] }))
                                  }
                                >
                                  {on ? "✓ " : ""}{opt}
                                </button>
                              );
                            })}
                          </div>
                        )}
                        {it.type === "scale5" && (
                          <div className="guc-nums">
                            {[1, 2, 3, 4, 5].map((n) => (
                              <button
                                key={n}
                                type="button"
                                className="guc-num"
                                data-on={obs[it.id] === n}
                                onClick={() => setObs((o) => ({ ...o, [it.id]: n }))}
                              >
                                {n}
                              </button>
                            ))}
                          </div>
                        )}
                        {it.type === "choice" && (
                          <div className="guc-chips">
                            {(it.options ?? []).map((opt) => (
                              <button
                                key={opt}
                                type="button"
                                className="guc-chip"
                                data-on={obs[it.id] === opt}
                                onClick={() => setObs((o) => ({ ...o, [it.id]: opt }))}
                              >
                                {obs[it.id] === opt ? "✓ " : ""}{opt}
                              </button>
                            ))}
                          </div>
                        )}
                        {it.type === "text" && (
                          <textarea
                            className="guc-obs-text"
                            rows={2}
                            placeholder="optional"
                            value={(obs[it.id] as string) ?? ""}
                            onChange={(e) => setObs((o) => ({ ...o, [it.id]: e.target.value }))}
                          />
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      className="guc-obs-send"
                      disabled={Object.keys(obs).length === 0}
                      onClick={sendObs}
                    >
                      send what you saw →
                    </button>
                  </>
                )}
                <a className="guc-collective" href="/harbour/creaseworks-eval#collective">
                  reviewing for the collective? open the full five-lens review →
                </a>
              </div>
            )}

            {/* P1.3 grown-up-only flip card — the theory behind THIS playdate.
                Reference only (never a child surface, nothing captured). */}
            {matchedSlug && <GrownupCard slug={matchedSlug} />}

            <Link href={miniHref("/guide")} className="guc-print">
              printable version of the full guide
            </Link>
          </div>
        </>
      )}
    </>
  );
}
