"use client";

/**
 * mini look — "nod or spin" — the silly embodied hunt (Heads-Up style).
 *
 * The app shows one material big; the phone is held up so the room sees
 * it. The holder reacts with their whole body:
 *   nod (up or down) → got it ✓
 *   spin clockwise   → skip →
 *   spin anticlockwise → go back ←   (mistakes are welcome — that's the point)
 *
 * Motion is an OPT-IN layer over a fully working button version: device
 * orientation needs a permission tap on iOS and doesn't exist on desktop,
 * so the buttons are always present as the reliable path. The framing
 * encourages grown-ups to do the silly moves while kids run to find
 * stuff — or swap. get adults to be more like kids.
 *
 * Detection: nod = |beta − baseline| over threshold; spin = signed
 * shortest-arc delta of alpha (yaw). After any gesture: brief cooldown +
 * haptic + feedback flash, then re-baseline. Thresholds are wide so
 * incidental jiggle won't cross. Deck shuffled after mount (no SSR drift).
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import CharacterSlot, { resolveCharacterFromForm } from "@windedvertigo/characters";
import { useCharacterVariant } from "@windedvertigo/characters/variant-context";
import { MINI_MATERIALS, type MiniMaterial } from "@/lib/mini-data";
import { MINI_AT_ROOT, miniHref, saveFound } from "@/lib/mini-pilot";
import { traceMaterialsPicked } from "@/lib/cw-mini-trace";
import { MiniStageHero } from "../../stage-hero";

const ICON_BASE = MINI_AT_ROOT ? "/harbour/creaseworks-mini" : "/harbour/creaseworks";
const ROUND = 10;
const NOD_DEG = 90;        // beta change for a real, committed nod (phone on forehead) — not a twitch
const SPIN_FULL = 330;     // accumulated yaw for a real full spin (~360°, slightly forgiving)
const SPIN_DEADZONE = 1;   // per-event yaw jitter (deg) to ignore so standing still never drifts to a trigger
const COOLDOWN_MS = 850;
// which accumulated-yaw sign is a physical CLOCKWISE turn — varies by
// device/browser (alpha isn't consistent across hardware). target
// mapping: clockwise = skip, anticlockwise = back. set false after a
// real-device test (2026-06-10): this hardware reports clockwise as
// NEGATIVE yaw. flip this ONE line if a future device is reversed —
// labels don't change.
const SPIN_CLOCKWISE_POSITIVE = false;

type Decision = "got" | "skip" | null;
type Kind = "got" | "skip" | "back";
type MotionState = "off" | "on" | "denied";

export default function MiniNodOrSpinPage() {
  const router = useRouter();
  const variant = useCharacterVariant();

  const [deck, setDeck] = useState<MiniMaterial[]>(MINI_MATERIALS.slice(0, ROUND));
  const [idx, setIdx] = useState(0);
  const [decisions, setDecisions] = useState<Decision[]>(() => Array(ROUND).fill(null));
  const [motion, setMotion] = useState<MotionState>("off");
  const [flash, setFlash] = useState<Kind | null>(null);

  const motionSupported =
    typeof window !== "undefined" && typeof window.DeviceOrientationEvent !== "undefined";

  // shuffle client-side after mount (deterministic SSR paint, no mismatch)
  useEffect(() => {
    const a = [...MINI_MATERIALS];
    for (let k = a.length - 1; k > 0; k--) {
      const j = Math.floor(Math.random() * (k + 1));
      [a[k], a[j]] = [a[j], a[k]];
    }
    setDeck(a.slice(0, ROUND));
    setDecisions(Array(Math.min(ROUND, a.length)).fill(null));
  }, []);

  const finish = useCallback(
    (decs: Decision[]) => {
      const picked = deck.filter((_, i) => decs[i] === "got");
      saveFound(picked.map((m) => m.title));
      traceMaterialsPicked("nod-or-spin", picked);
      router.push(miniHref("/make"));
    },
    [deck, router],
  );

  const decide = useCallback(
    (kind: "got" | "skip") => {
      const next = [...decisions];
      next[idx] = kind;
      setDecisions(next);
      if (idx + 1 >= deck.length) finish(next);
      else setIdx(idx + 1);
    },
    [decisions, idx, deck, finish],
  );

  const goBack = useCallback(() => {
    if (idx === 0) return;
    const next = [...decisions];
    next[idx - 1] = null; // clear so they can re-decide
    setDecisions(next);
    setIdx(idx - 1);
  }, [decisions, idx]);

  // latest action fns behind a ref so the once-attached orientation
  // handler never closes over stale state
  const performRef = useRef<(k: Kind) => void>(() => {});
  performRef.current = (k) => (k === "back" ? goBack() : decide(k));

  // motion detection state (refs — never trigger re-render)
  const m = useRef({ baseBeta: 0, lastAlpha: 0, spin: 0, needBaseline: true, cooling: false });

  const onOrient = useCallback((e: DeviceOrientationEvent) => {
    const s = m.current;
    if (s.cooling) return;
    const beta = e.beta ?? 0;
    const alpha = e.alpha ?? 0;
    if (s.needBaseline) {
      s.baseBeta = beta;
      s.lastAlpha = alpha;
      s.spin = 0;
      s.needBaseline = false;
      return;
    }
    let kind: Kind | null = null;
    if (Math.abs(beta - s.baseBeta) > NOD_DEG) {
      // a nod (up or down) = got it
      kind = "got";
    } else {
      // accumulate yaw across events so it takes a real full spin to fire —
      // a quick shoulder flick (which only ever reaches ~90°) never hits
      // ±SPIN_FULL. each step is normalised to the shortest arc to handle
      // the 0/360 wrap; sub-deadzone jitter is dropped so standing still
      // never creeps to a trigger.
      let da = ((alpha - s.lastAlpha + 540) % 360) - 180;
      s.lastAlpha = alpha;
      if (Math.abs(da) < SPIN_DEADZONE) da = 0;
      s.spin += da;
      // map a completed spin to an action via the single direction
      // constant, so the rotation→action binding and the on-screen arrows
      // can never disagree. target: clockwise = skip, anticlockwise = back.
      if (s.spin >= SPIN_FULL) kind = SPIN_CLOCKWISE_POSITIVE ? "skip" : "back";
      else if (s.spin <= -SPIN_FULL) kind = SPIN_CLOCKWISE_POSITIVE ? "back" : "skip";
    }
    if (!kind) return;
    s.cooling = true;
    setFlash(kind);
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(kind === "back" ? [40, 40, 40] : 90);
    }
    window.setTimeout(() => {
      performRef.current(kind!);
      s.cooling = false;
      s.needBaseline = true;
      setFlash(null);
    }, COOLDOWN_MS);
  }, []);

  useEffect(() => () => window.removeEventListener("deviceorientation", onOrient), [onOrient]);

  async function startMotion() {
    const D = window.DeviceOrientationEvent as unknown as {
      requestPermission?: () => Promise<"granted" | "denied">;
    };
    if (D && typeof D.requestPermission === "function") {
      let res: "granted" | "denied" = "denied";
      try {
        res = await D.requestPermission();
      } catch {
        res = "denied";
      }
      if (res !== "granted") {
        setMotion("denied");
        return;
      }
    }
    m.current.needBaseline = true;
    m.current.cooling = false;
    window.addEventListener("deviceorientation", onOrient);
    setMotion("on");
  }

  function stopMotion() {
    window.removeEventListener("deviceorientation", onOrient);
    setMotion("off");
  }

  const mat = deck[idx];
  if (!mat) return null;
  const char = mat.preferIcon ? null : resolveCharacterFromForm(mat.formPrimary, mat.title);
  const foundCount = decisions.filter((d) => d === "got").length;

  const flashLabel = flash === "got" ? "got it! ✓" : flash === "skip" ? "skip →" : "← back";
  const flashColor = flash === "got" ? "var(--wv-teal)" : flash === "back" ? "var(--wv-redwood)" : "var(--wv-navy)";

  return (
    <div>
      <MiniStageHero stage="look" />

      <style>{`
        .nos-toprow { display: flex; justify-content: center; margin-bottom: 14px; }
        button.nos-mode:not([type="submit"]):not(.wv-header-signout) {
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-weight: 800;
          font-size: 15px;
          color: var(--wv-cadet);
          background: var(--wv-white);
          border: 2px solid var(--wv-seafoam);
          border-radius: 16px 20px 14px 18px;
          padding: 10px 18px;
          cursor: pointer;
        }
        button.nos-mode:not([type="submit"]):not(.wv-header-signout):focus-visible {
          outline: 3px solid var(--color-focus); outline-offset: 3px;
        }
        .nos-denied {
          text-align: center;
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-weight: 700;
          font-size: 14px;
          color: var(--color-text-on-dark);
          margin-bottom: 12px;
        }
        .nos-howto {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 6px;
          margin-bottom: 12px;
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-weight: 800;
          font-size: 11px;
          color: var(--wv-cadet);
        }
        .nos-howto span {
          background: var(--wv-white);
          border-radius: 12px;
          padding: 7px 4px;
          text-align: center;
          white-space: nowrap;
        }
        .nos-card {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 14px;
          background: var(--wv-white);
          border: 2.5px solid var(--wv-seafoam);
          border-radius: 28px 34px 26px 32px;
          padding: 30px 20px;
          margin-bottom: 18px;
          overflow: hidden;
        }
        .nos-emoji { font-size: 110px; line-height: 1; }
        .nos-name {
          font-family: var(--font-fraunces), serif;
          font-weight: 600;
          font-size: 26px;
          color: var(--wv-cadet);
          text-align: center;
          line-height: 1.15;
        }
        .nos-flash {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-weight: 800;
          font-size: 34px;
          color: var(--wv-white);
          background: var(--flash-bg);
        }
        .nos-actions { display: flex; gap: 10px; margin-bottom: 14px; }
        button.nos-btn:not([type="submit"]):not(.wv-header-signout) {
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-weight: 800;
          font-size: 17px;
          border: none;
          border-radius: 18px 22px 16px 20px;
          padding: 16px 0;
          cursor: pointer;
          box-shadow: 0 4px 0 rgba(39, 50, 72, 0.16);
          transition: scale 150ms cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        button.nos-back:not([type="submit"]):not(.wv-header-signout) { flex: 0 0 auto; width: 56px; background: var(--wv-white); color: var(--wv-cadet); }
        button.nos-skip:not([type="submit"]):not(.wv-header-signout) { flex: 1; background: var(--wv-white); color: var(--wv-cadet); }
        button.nos-got:not([type="submit"]):not(.wv-header-signout) { flex: 1.4; background: var(--wv-teal); color: var(--wv-white); }
        button.nos-btn:not([type="submit"]):not(.wv-header-signout):active { scale: 0.95; }
        button.nos-btn:not([type="submit"]):not(.wv-header-signout):focus-visible { outline: 3px solid var(--color-focus); outline-offset: 3px; }
        button.nos-btn:not([type="submit"]):not(.wv-header-signout):disabled { opacity: 0.35; }
        .nos-foot { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
        .nos-tally {
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-weight: 800; font-size: 13px; color: var(--wv-cadet);
          background: var(--wv-white); border-radius: 12px; padding: 6px 12px;
        }
        button.nos-done:not([type="submit"]):not(.wv-header-signout) {
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-weight: 800; font-size: 15px; color: var(--wv-white);
          background: var(--wv-redwood); border: none;
          border-radius: 16px 20px 14px 18px; padding: 10px 20px; cursor: pointer;
          box-shadow: 0 4px 0 rgba(39, 50, 72, 0.18);
        }
        button.nos-done:not([type="submit"]):not(.wv-header-signout):focus-visible { outline: 3px solid var(--color-focus); outline-offset: 3px; }
        @media (prefers-reduced-motion: reduce) {
          button.nos-btn:not([type="submit"]):not(.wv-header-signout):active { scale: 1; }
        }
      `}</style>

      {/* mode toggle / permission */}
      <div className="nos-toprow">
        {motion === "on" ? (
          <button type="button" className="nos-mode" onClick={stopMotion}>
            ✋ use buttons instead
          </button>
        ) : motionSupported ? (
          <button type="button" className="nos-mode" onClick={startMotion}>
            🙃 play hands-free — nod or spin!
          </button>
        ) : null}
      </div>

      {motion === "denied" && (
        <p className="nos-denied">
          couldn&rsquo;t turn on motion — no worries, the buttons work great!
        </p>
      )}

      {motion === "on" && (
        <div className="nos-howto" aria-hidden="true">
          <span>↺ spin = back</span>
          <span>nod = got it ✓</span>
          <span>↻ spin = skip</span>
        </div>
      )}

      <div className="nos-card" key={mat.id}>
        <span aria-hidden="true">
          {char ? (
            <CharacterSlot character={char} size={120} animate={false} variant={variant} />
          ) : mat.icon ? (
            <img
              src={`${ICON_BASE}/icons/materials/${mat.icon}.png`}
              alt=""
              width={110}
              height={110}
              style={{ objectFit: "contain" }}
            />
          ) : (
            <span className="nos-emoji">{mat.emoji ?? "🧱"}</span>
          )}
        </span>
        <span className="nos-name">{mat.title}</span>
        {flash && (
          <div className="nos-flash" style={{ ["--flash-bg" as string]: flashColor }}>
            {flashLabel}
          </div>
        )}
      </div>

      <div className="nos-actions">
        <button
          type="button"
          className="nos-btn nos-back"
          onClick={goBack}
          disabled={idx === 0}
          aria-label="go back to the previous one"
        >
          ←
        </button>
        <button type="button" className="nos-btn nos-skip" onClick={() => decide("skip")}>
          skip →
        </button>
        <button type="button" className="nos-btn nos-got" onClick={() => decide("got")}>
          got it! ✓
        </button>
      </div>

      <div className="nos-foot">
        <span className="nos-tally" aria-live="polite">
          {foundCount} found · {idx + 1}/{deck.length}
        </span>
        <button type="button" className="nos-done" onClick={() => finish(decisions)}>
          done — let&rsquo;s make! →
        </button>
      </div>
    </div>
  );
}
