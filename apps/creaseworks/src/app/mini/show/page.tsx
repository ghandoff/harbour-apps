"use client";

/**
 * mini show — photo + the child's words.
 *
 * The grown-up snaps a photo of the creation and types (or transcribes)
 * what the child says about it. Both go to the pilot store attached to
 * the family code; nothing appears publicly until reviewed.
 *
 * No family code yet → inline entry field so the grown-up doesn't have
 * to navigate away. The kid flow itself never requires reading.
 */

import { useEffect, useRef, useState } from "react";
import { apiUrl } from "@/lib/api-url";
import { loadCode, loadFound, loadSelected, matchActivities, saveCode } from "@/lib/mini-pilot";
import { MiniStageHero } from "../stage-hero";
import { postEval } from "@/lib/eval-submit";
import { FACE_EMOJI } from "@/lib/eval-rubric";
import { GuessBeat, ProvocationCard } from "../unfold-tools";
import { FindAgainDoors } from "../find-again-tools";
import { setGroup } from "@/lib/cw-identity";
import { PhotoFraming } from "../photo-framing";

type SendState = "idle" | "sending" | "done" | "error";

export default function MiniShowPage() {
  const [code, setCode] = useState<string | null>(null);
  const [codeInput, setCodeInput] = useState("");
  const [codeError, setCodeError] = useState(false);
  const [codeChecking, setCodeChecking] = useState(false);
  const [activitySlug, setActivitySlug] = useState<string | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [words, setWords] = useState("");
  const [state, setState] = useState<SendState>("idle");
  const inputRef = useRef<HTMLInputElement>(null);
  // the kid's own end-of-play moment (posts to the eval worker, register=kid)
  const [kidFun, setKidFun] = useState<string | null>(null);
  const [kidAgain, setKidAgain] = useState<string | null>(null);
  const [kidSent, setKidSent] = useState(false);
  // the two optional "wonder" beats collapse behind one calm, closed disclosure
  const [wonderOpen, setWonderOpen] = useState(false);

  useEffect(() => {
    setCode(loadCode());
    // attach the playdate the child ACTUALLY played (persisted in make). Only
    // re-derive from the matcher when nothing was persisted — re-guessing here
    // mis-attributed the reflection + eval/evidence to the wrong game.
    const played = loadSelected();
    if (played) {
      setActivitySlug(played);
    } else {
      const found = loadFound();
      if (found.length) setActivitySlug(matchActivities(found)[0].activity.slug);
    }
  }, []);

  function pickPhoto(file: File | undefined) {
    if (!file) return;
    setPhoto(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  async function submitCode() {
    const trimmed = codeInput.trim().toLowerCase();
    if (!trimmed || codeChecking) return;
    // server-validate against the real codes (not a client-only regex) so a
    // mistyped / wrong code can't arm a share that then fails at the server.
    setCodeChecking(true);
    setCodeError(false);
    try {
      const res = await fetch(apiUrl("/api/mini/session"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: trimmed }),
      });
      if (res.ok) {
        saveCode(trimmed);
        setGroup(trimmed, "family"); // one code: also the roster/traces key
        setCode(trimmed);
        window.dispatchEvent(new Event("cw:code-set")); // clear the first-run banner
      } else {
        setCodeError(true);
      }
    } catch {
      setCodeError(true);
    } finally {
      setCodeChecking(false);
    }
  }

  async function share() {
    if (!code || (!photo && !words.trim())) return;
    setState("sending");
    try {
      const form = new FormData();
      form.set("code", code);
      if (activitySlug) form.set("activitySlug", activitySlug);
      if (words.trim()) form.set("body", words.trim());
      if (photo) form.set("photo", photo);
      const res = await fetch(apiUrl("/api/mini/evidence"), { method: "POST", body: form });
      setState(res.ok ? "done" : "error");
    } catch {
      setState("error");
    }
  }

  function sendKid() {
    if (!kidFun) return;
    const slug = activitySlug ?? "character-from-a-crease";
    const answers: Record<string, string> = { "kid-fun": kidFun };
    if (kidAgain) answers["kid-again"] = kidAgain;
    setKidSent(true); // optional, optimistic — it's the child's voice, not gated
    void postEval({ slug, register: "kid", name: code, answers });
  }

  return (
    <div>
      <MiniStageHero stage="show" />

      <style>{`
        .mini-show-card {
          background: var(--wv-white);
          border: 1.5px solid rgba(39, 50, 72, 0.08);
          border-radius: 24px 30px 22px 28px;
          padding: 20px;
          box-shadow: 0 4px 0 rgba(39, 50, 72, 0.08);
        }
        .mini-show-photo-zone {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-height: 140px;
          border: 3px dashed var(--wv-navy);
          background: color-mix(in srgb, var(--wv-periwinkle) 30%, var(--wv-white));
          border-radius: 18px 24px 16px 22px;
          cursor: pointer;
          margin-bottom: 14px;
          overflow: hidden;
        }
        .mini-show-photo-zone img {
          width: 100%;
          max-height: 260px;
          object-fit: cover;
        }
        .mini-show-photo-hint {
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-weight: 800;
          font-size: 16px;
          color: var(--wv-cadet);
          padding: 20px;
          text-align: center;
        }
        .mini-show-words {
          width: 100%;
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-size: 15px;
          line-height: 1.5;
          color: var(--wv-cadet);
          background: var(--wv-white);
          border: 2px solid var(--wv-navy);
          border-radius: 14px;
          padding: 12px 14px;
          min-height: 84px;
          resize: vertical;
          margin-bottom: 14px;
        }
        .mini-show-words:focus-visible {
          outline: 3px solid var(--color-focus);
          outline-offset: 1px;
        }
        button.mini-show-share:not([type="submit"]):not(.wv-header-signout) {
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-weight: 800;
          font-size: 18px;
          color: var(--wv-white);
          background: var(--wv-redwood);
          border: none;
          border-radius: 20px 26px 18px 24px;
          padding: 14px 30px;
          cursor: pointer;
          box-shadow: 0 4px 0 rgba(39, 50, 72, 0.15);
          transition: scale 150ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 150ms ease;
        }
        button.mini-show-share:not([type="submit"]):not(.wv-header-signout):disabled { opacity: 0.4; cursor: default; }
        button.mini-show-share:not([type="submit"]):not(.wv-header-signout):not(:disabled):hover { scale: 1.04; }
        button.mini-show-share:not([type="submit"]):not(.wv-header-signout):not(:disabled):active { scale: 0.95; }
        button.mini-show-share:not([type="submit"]):not(.wv-header-signout):focus-visible {
          outline: 3px solid var(--color-focus);
          outline-offset: 3px;
        }
        .mini-show-note { font-size: 13px; font-weight: 600; color: color-mix(in srgb, var(--wv-cadet) 75%, transparent); margin-top: 12px; line-height: 1.6; }
        .mini-show-done {
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-weight: 800;
          font-size: 17px;
          color: var(--wv-cadet);
          text-align: center;
          padding: 24px 0 10px;
        }
        .mini-show-done a {
          display: inline-block;
          margin-top: 14px;
          text-decoration: underline;
          font-size: 14px;
        }
        .mini-show-code-box {
          background: color-mix(in srgb, var(--wv-mint) 35%, var(--wv-white));
          border: 2px solid var(--wv-teal);
          border-radius: 18px 22px 16px 20px;
          padding: 14px 16px;
          margin-bottom: 14px;
        }
        .mini-show-code-label {
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-weight: 800;
          font-size: 13px;
          color: var(--wv-cadet);
          margin-bottom: 8px;
        }
        .mini-show-code-row {
          display: flex;
          gap: 8px;
        }
        .mini-show-code-input {
          flex: 1;
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-size: 15px;
          font-weight: 700;
          color: var(--wv-cadet);
          background: var(--wv-white);
          border: 2px solid var(--wv-teal);
          border-radius: 12px;
          padding: 10px 12px;
        }
        .mini-show-code-input:focus-visible {
          outline: 3px solid var(--color-focus);
          outline-offset: 1px;
        }
        button.mini-show-code-btn:not([type="submit"]):not(.wv-header-signout) {
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-weight: 800;
          font-size: 14px;
          color: var(--wv-white);
          background: var(--wv-teal);
          border: none;
          border-radius: 12px 16px 10px 14px;
          padding: 10px 16px;
          cursor: pointer;
          white-space: nowrap;
        }
        button.mini-show-code-btn:focus-visible { outline: 3px solid var(--color-focus); outline-offset: 3px; }
        .mini-show-code-err {
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-size: 12px;
          font-weight: 700;
          color: var(--wv-redwood);
          margin-top: 6px;
        }
        /* the kid's end-of-play moment — bright, big, tappable */
        .mini-kid-card {
          background: color-mix(in srgb, var(--wv-mint) 45%, var(--wv-white));
          border: 2px solid var(--wv-teal);
          border-radius: 22px 28px 20px 26px;
          padding: 18px 18px 20px;
          margin-bottom: 16px;
          box-shadow: 0 4px 0 rgba(39, 50, 72, 0.08);
        }
        .mini-kid-q, .mini-kid-q2 {
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-weight: 800; font-size: 18px; color: var(--wv-cadet); text-align: center; margin: 0 0 12px;
        }
        .mini-kid-q2 { font-size: 16px; margin: 16px 0 10px; }
        .mini-kid-faces { display: flex; gap: 10px; justify-content: center; }
        button.mini-kid-face:not([type="submit"]):not(.wv-header-signout) {
          position: relative;
          flex: 1; max-width: 110px; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 4px;
          background: var(--wv-white); border: 2px solid rgba(39, 50, 72, 0.14); border-radius: 16px 20px 14px 18px; padding: 12px 8px;
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif; font-weight: 800; font-size: 13px; color: var(--wv-cadet);
          transition: transform 120ms ease, border-color 120ms ease, scale 120ms ease;
        }
        button.mini-kid-face[data-on="true"] { border-color: var(--wv-teal);
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--wv-teal) 35%, var(--wv-white));
          background: color-mix(in srgb, var(--wv-teal) 18%, var(--wv-white)); transform: translateY(-2px); }
        button.mini-kid-face:focus-visible { outline: 3px solid var(--color-focus); outline-offset: 2px; }
        button.mini-kid-face:active { scale: 0.96; }
        .mini-kid-tick { position: absolute; top: 6px; right: 8px; width: 20px; height: 20px; border-radius: 50%;
          background: var(--wv-teal); color: var(--wv-white); font-size: 12px; font-weight: 900;
          display: inline-flex; align-items: center; justify-content: center; }
        .mini-kid-emoji { font-size: 38px; line-height: 1; }
        .mini-kid-again { display: flex; gap: 8px; justify-content: center; }
        button.mini-kid-opt:not([type="submit"]):not(.wv-header-signout) {
          cursor: pointer; font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif; font-weight: 800; font-size: 15px;
          color: var(--wv-cadet); background: var(--wv-white); border: 2px solid rgba(39, 50, 72, 0.14); border-radius: 14px; padding: 10px 22px;
          transition: scale 120ms ease, border-color 120ms ease, background 120ms ease;
        }
        button.mini-kid-opt[data-on="true"] { border-color: var(--wv-teal); border-width: 2.5px; background: color-mix(in srgb, var(--wv-teal) 24%, var(--wv-white)); }
        button.mini-kid-opt:focus-visible { outline: 3px solid var(--color-focus); outline-offset: 2px; }
        button.mini-kid-opt:active { scale: 0.96; }
        @media (prefers-reduced-motion: reduce) {
          button.mini-kid-face:active, button.mini-kid-opt:active { scale: 1; }
        }
        button.mini-kid-send:not([type="submit"]):not(.wv-header-signout) {
          display: block; margin: 18px auto 0; cursor: pointer; font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-weight: 800; font-size: 17px; color: var(--wv-white); background: var(--wv-teal); border: none;
          border-radius: 18px 22px 16px 20px; padding: 12px 30px; box-shadow: 0 4px 0 rgba(39, 50, 72, 0.15);
        }
        button.mini-kid-send:disabled { opacity: 0.4; cursor: default; }
        button.mini-kid-send:focus-visible { outline: 3px solid var(--color-focus); outline-offset: 3px; }
        .mini-kid-thanks {
          text-align: center; font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif; font-weight: 800;
          font-size: 18px; color: var(--wv-cadet); padding: 24px 18px;
        }
        /* photo + words are the primary flow; one clear order top to bottom */
        .mini-show-section {
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif; font-weight: 800; font-size: 14px;
          color: var(--wv-cadet); margin: 4px 0 8px;
        }
        /* one calm, collapsed entry point for the optional wonder beats (on the white card) */
        button.mini-wonder-toggle:not([type="submit"]):not(.wv-header-signout) {
          display: flex; align-items: center; justify-content: space-between; gap: 10px; width: 100%;
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-weight: 800; font-size: 14px; color: var(--wv-cadet);
          background: transparent; border: 1.5px dashed rgba(39, 50, 72, 0.4);
          border-radius: 16px 20px 14px 18px; padding: 12px 16px; cursor: pointer; text-align: left;
          margin: 4px 0 12px; transition: background 140ms ease;
        }
        button.mini-wonder-toggle:hover { background: color-mix(in srgb, var(--wv-cadet) 5%, transparent); }
        button.mini-wonder-toggle:focus-visible { outline: 3px solid var(--color-focus); outline-offset: 2px; }
        .mini-help-toggle-cue { font-size: 13px; font-weight: 800; opacity: 0.75; }
        .mini-help-panel { margin-bottom: 6px; }
        /* the child's end beat is a light footnote, not a competing hero */
        .mini-kid-card--end {
          background: color-mix(in srgb, var(--wv-mint) 24%, var(--wv-white));
          border-width: 1.5px; box-shadow: none; margin: 16px 0 0; padding: 16px 16px 18px;
        }
        .mini-kid-card--end .mini-kid-q { font-size: 16px; }
        .mini-kid-card--end .mini-kid-send { font-size: 16px; padding: 10px 26px; }
      `}</style>

      {state === "done" ? (
        <FindAgainDoors slug={activitySlug} photoUrl={previewUrl} />
      ) : (
        <>
          {/* primary flow: capture the creation + its words, then share */}
          <div className="mini-show-card">

          {!code && (
            <div className="mini-show-code-box">
              <p className="mini-show-code-label">grown-ups: enter your family code to unlock sharing</p>
              <div className="mini-show-code-row">
                <input
                  className="mini-show-code-input"
                  type="text"
                  value={codeInput}
                  onChange={(e) => { setCodeInput(e.target.value); setCodeError(false); }}
                  onKeyDown={(e) => e.key === "Enter" && submitCode()}
                  placeholder="e.g. sunny-fox"
                  aria-label="family code"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                />
                <button type="button" className="mini-show-code-btn" onClick={submitCode} disabled={codeChecking}>
                  {codeChecking ? "checking…" : "go →"}
                </button>
              </div>
              {codeError && (
                <p className="mini-show-code-err">that code isn&rsquo;t recognised — check it with the collective</p>
              )}
            </div>
          )}

          <p className="mini-show-section">📸 take a picture!</p>
          <div
            className="mini-show-photo-zone"
            onClick={() => inputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
            aria-label="add a photo of what you made"
          >
            {previewUrl ? (
              <img src={previewUrl} alt="your creation" />
            ) : (
              <span className="mini-show-photo-hint">
                📸 tap to add a photo of what you made!
              </span>
            )}
          </div>
          {/* no capture= attr so iOS offers camera OR library — camera-only blocked sharing if denied for colour catcher */}
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic"
            style={{ display: "none" }}
            onChange={(e) => pickPhoto(e.target.files?.[0])}
          />

          <PhotoFraming />

          {/* both optional wonder beats tucked behind one calm, closed disclosure */}
          <button
            type="button"
            className="mini-help-toggle mini-wonder-toggle"
            aria-expanded={wonderOpen}
            onClick={() => setWonderOpen((o) => !o)}
          >
            <span>🙊 want to play with it more?</span>
            <span className="mini-help-toggle-cue" aria-hidden="true">{wonderOpen ? "hide ▾" : "open ▸"}</span>
          </button>
          {wonderOpen && (
            <div className="mini-help-panel">
              <GuessBeat slug={activitySlug} />
              <ProvocationCard slug={activitySlug} />
            </div>
          )}

          <p className="mini-show-section">💬 what did you find out?</p>
          <textarea
            className="mini-show-words"
            value={words}
            onChange={(e) => setWords(e.target.value)}
            placeholder="what surprised you? what changed when you looked again?"
            maxLength={2000}
          />

          <button
            type="button"
            className="mini-show-share"
            disabled={!code || (!photo && !words.trim()) || state === "sending"}
            onClick={share}
          >
            {state === "sending" ? "sharing…" : "share it! →"}
          </button>

          {state === "error" && (
            <p className="mini-show-note" style={{ color: "var(--wv-redwood)", opacity: 1 }}>
              that didn&rsquo;t go through — try again in a moment?
            </p>
          )}
          </div>

          {/* a small end beat, after the showing — the child's own voice, not a competing hero */}
          {!kidSent ? (
            <div className="mini-kid-card mini-kid-card--end">
              <p className="mini-kid-q">how was it?</p>
              <div className="mini-kid-faces">
                {["good", "great", "the best"].map((f) => (
                  <button
                    key={f}
                    type="button"
                    className="mini-kid-face"
                    data-on={kidFun === f}
                    aria-pressed={kidFun === f}
                    onClick={() => setKidFun(f)}
                  >
                    {kidFun === f && <span className="mini-kid-tick" aria-hidden="true">✓</span>}
                    <span className="mini-kid-emoji" aria-hidden="true">{FACE_EMOJI[f]}</span>
                    <span>{f}</span>
                  </button>
                ))}
              </div>
              <p className="mini-kid-q2">play it again?</p>
              <div className="mini-kid-again">
                {["yes", "maybe", "no"].map((a) => (
                  <button
                    key={a}
                    type="button"
                    className="mini-kid-opt"
                    data-on={kidAgain === a}
                    aria-pressed={kidAgain === a}
                    onClick={() => setKidAgain(a)}
                  >
                    {kidAgain === a && "✓ "}{a}
                  </button>
                ))}
              </div>
              <button type="button" className="mini-kid-send" disabled={!kidFun} onClick={sendKid}>
                send it! 🎉
              </button>
            </div>
          ) : (
            <div className="mini-kid-card mini-kid-card--end mini-kid-thanks">🎉 thanks for telling us!</div>
          )}
        </>
      )}
    </div>
  );
}
