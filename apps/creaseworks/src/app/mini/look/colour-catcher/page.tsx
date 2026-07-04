"use client";

/**
 * mini look — "colour catcher" — the phone becomes a colour wand.
 *
 * The app calls TWO colours at once ("find something with RED and BLUE on
 * it!"); the kid looks for a SINGLE object that shows both — which nudges
 * them to notice a thing's surface and how its colours sit together, not
 * just one flat swatch. They point the rear camera at the object and the
 * centre of the frame is sampled live; as they pan across the object each
 * named colour lights up, and once both have been seen we cheer and bank
 * the catch. Camera is an enhancement: a manual "got it!" is always
 * present so denied-permission / desktop / tricky-lighting never traps
 * anyone (same pattern as nod-or-spin). There is no miss and no fail —
 * "got it!" and "another pair" are always one tap away.
 *
 * These are sensory finds (a red-and-blue thing — we can't name which
 * object), so the make stage uses the "whatever you collect is right"
 * fallback.
 *
 * Camera lifecycle: getUserMedia on a tap (iOS needs the gesture), a
 * 250ms sample loop drawing the centre crop to a tiny canvas, tracks
 * stopped on unmount.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { miniHref, saveFound, loadContext, type MiniContext } from "@/lib/mini-pilot";
import { MiniStageHero } from "../../stage-hero";

type CamState = "off" | "on" | "denied";

// broadened palette — warm-to-cool plus pink and brown so a two-colour
// pairing lands on lots of everyday things. swatches must render as real
// colours (this is a colour tool), so hex stays here on purpose.
const COLOURS = [
  { key: "red", hue: 0, swatch: "#e24b4a" },
  { key: "orange", hue: 28, swatch: "#e0884a" },
  { key: "yellow", hue: 50, swatch: "#e6b800" },
  { key: "green", hue: 135, swatch: "#43b187" },
  { key: "teal", hue: 178, swatch: "#2fa8a0" },
  { key: "blue", hue: 212, swatch: "#436db1" },
  { key: "purple", hue: 270, swatch: "#8a63d2" },
  { key: "pink", hue: 330, swatch: "#e06699" },
  { key: "brown", hue: 24, swatch: "#8a5a3c" },
] as const;

// same place-aware nudge as the other look tools — indoor vs outdoor vs
// neutral (unset).
const WHERE_NUDGE: Record<MiniContext, string> = {
  indoor: "peek in drawers, cupboards, and the recycling — boxes, wrappers, and toys wear lots of colours.",
  outdoor: "look on the ground, in the bushes, and along the path — leaves, petals, and stones mix colours too.",
};

const HUE_TOLERANCE = 32; // forgiving so a kid isn't fighting white-balance
const SAMPLE_MS = 250;

/** pick two different colour indices for a pairing */
function pickPair(): [number, number] {
  const a = Math.floor(Math.random() * COLOURS.length);
  let b = a;
  while (b === a) b = Math.floor(Math.random() * COLOURS.length);
  return [a, b];
}

function rgbToHsl(r: number, g: number, b: number) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0, s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0));
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  return { h, s, l };
}

function hueGap(a: number, b: number) {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

/** legible text colour for a coloured pill (white on dark, cadet on light) */
function readableOn(hex: string): string {
  const c = hex.replace("#", "").match(/../g)!.map((x) => parseInt(x, 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  const lum = 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  return lum > 0.4 ? "#273248" : "#ffffff";
}

export default function MiniColourCatcherPage() {
  const router = useRouter();
  const [cam, setCam] = useState<CamState>("off");
  // a pairing of two different colours; the kid finds one object with both.
  const [pair, setPair] = useState<[number, number]>([0, 5]); // red + blue first paint
  const [caught, setCaught] = useState(0);
  const [flash, setFlash] = useState(false);
  // which of the two named colours has been spotted so far (camera mode)
  const [seen, setSeen] = useState<[boolean, boolean]>([false, false]);

  // SSR-safe context read: null on server + first client paint (neutral nudge),
  // then swaps to the place-aware nudge once mounted.
  const [context, setContext] = useState<MiniContext | null>(null);
  useEffect(() => {
    setContext(loadContext());
  }, []);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const coolingRef = useRef(false);
  const hitsRef = useRef<[number, number]>([0, 0]);
  const seenRef = useRef<[boolean, boolean]>([false, false]);
  const pairRef = useRef<[number, number]>([0, 5]);
  pairRef.current = pair;

  const first = COLOURS[pair[0]];
  const second = COLOURS[pair[1]];

  const nextPair = useCallback(() => {
    hitsRef.current = [0, 0];
    seenRef.current = [false, false];
    setSeen([false, false]);
    setPair(pickPair());
  }, []);

  const catchIt = useCallback(() => {
    setCaught((c) => c + 1);
    setFlash(true);
    if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(70);
    window.setTimeout(() => setFlash(false), 700);
    nextPair();
  }, [nextPair]);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => () => stop(), [stop]);

  // sample loop while camera is on
  useEffect(() => {
    if (cam !== "on") return;
    const id = window.setInterval(() => {
      if (coolingRef.current) return;
      const v = videoRef.current;
      if (!v || !v.videoWidth) return;
      if (!canvasRef.current) canvasRef.current = document.createElement("canvas");
      const c = canvasRef.current;
      c.width = 16; c.height = 16;
      const ctx = c.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;
      // centre 30% crop of the frame
      const cw = v.videoWidth * 0.3, ch = v.videoHeight * 0.3;
      const sx = (v.videoWidth - cw) / 2, sy = (v.videoHeight - ch) / 2;
      ctx.drawImage(v, sx, sy, cw, ch, 0, 0, 16, 16);
      const { data } = ctx.getImageData(0, 0, 16, 16);
      let r = 0, g = 0, b = 0;
      for (let i = 0; i < data.length; i += 4) { r += data[i]; g += data[i + 1]; b += data[i + 2]; }
      const n = data.length / 4;
      const hsl = rgbToHsl(r / n, g / n, b / n);
      const vivid = hsl.s > 0.25 && hsl.l > 0.18 && hsl.l < 0.85;
      // check the centre against BOTH named colours — panning across a
      // two-tone object lights up each in turn. each needs a couple of
      // steady samples before it counts as seen.
      const [ia, ib] = pairRef.current;
      [ia, ib].forEach((ci, slot) => {
        const near = vivid && hueGap(hsl.h, COLOURS[ci].hue) < HUE_TOLERANCE;
        hitsRef.current[slot] = near ? hitsRef.current[slot] + 1 : 0;
        if (hitsRef.current[slot] >= 2 && !seenRef.current[slot]) {
          seenRef.current[slot] = true;
          setSeen([seenRef.current[0], seenRef.current[1]]);
        }
      });
      // caught only once BOTH colours have shown up on the one object
      if (seenRef.current[0] && seenRef.current[1]) {
        coolingRef.current = true;
        catchIt();
        window.setTimeout(() => (coolingRef.current = false), 900);
      }
    }, SAMPLE_MS);
    return () => window.clearInterval(id);
  }, [cam, catchIt]);

  async function startCam() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      streamRef.current = stream;
      // mount the <video> first (it only renders when cam === "on"); the
      // effect below attaches the stream once the element exists. attaching
      // here would hit a null ref and leave a blank window.
      setCam("on");
    } catch {
      setCam("denied");
    }
  }

  // attach the stream after the video element mounts
  useEffect(() => {
    if (cam !== "on") return;
    const v = videoRef.current;
    if (!v || !streamRef.current) return;
    v.srcObject = streamRef.current;
    v.play().catch(() => {});
  }, [cam]);

  const finish = useCallback(() => {
    stop();
    saveFound([]); // sensory finds → make uses the fallback activity
    router.push(miniHref("/make"));
  }, [stop, router]);

  return (
    <div>
      <MiniStageHero stage="look" />

      <style>{`
        .cc-toprow { display: flex; justify-content: center; margin-bottom: 14px; }
        button.cc-mode:not([type="submit"]):not(.wv-header-signout) {
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-weight: 800; font-size: 15px; color: var(--wv-cadet);
          background: var(--wv-white); border: 2px solid var(--wv-seafoam);
          border-radius: 16px 20px 14px 18px; padding: 10px 18px; cursor: pointer;
        }
        button.cc-mode:focus-visible { outline: 3px solid var(--color-focus); outline-offset: 3px; }
        .cc-prompt {
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-weight: 800; font-size: 22px; color: var(--color-text-on-dark);
          text-align: center; margin-bottom: 10px; line-height: 1.4;
        }
        .cc-prompt .cc-colourword { text-transform: uppercase; }
        .cc-where-nudge {
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-weight: 700; font-size: 13px; color: var(--color-text-on-dark);
          opacity: 0.85; text-align: center; margin: 0 0 14px; line-height: 1.4;
        }
        .cc-seenrow { display: flex; justify-content: center; gap: 10px; margin-bottom: 14px; }
        .cc-seenchip {
          display: inline-flex; align-items: center; gap: 6px;
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-weight: 800; font-size: 13px; color: var(--wv-cadet);
          background: var(--wv-white); border: 2px solid rgba(39,50,72,0.12);
          border-radius: 12px 15px 10px 14px; padding: 5px 12px 5px 8px;
          opacity: 0.5; transition: opacity 150ms ease, border-color 150ms ease;
        }
        .cc-seenchip[data-seen="true"] { opacity: 1; border-color: var(--wv-teal); }
        .cc-seenchip-dot { width: 16px; height: 16px; border-radius: 5px; background: var(--chip); }
        .cc-stage {
          position: relative;
          background: var(--wv-white);
          border: 3px solid transparent;
          border-image: linear-gradient(120deg, var(--swatch-a), var(--swatch-b)) 1;
          border-radius: 28px 34px 26px 32px;
          overflow: hidden;
          margin-bottom: 16px;
          aspect-ratio: 4 / 3;
          display: flex; align-items: center; justify-content: center;
        }
        .cc-stage video { width: 100%; height: 100%; object-fit: cover; }
        .cc-reticle {
          position: absolute; width: 30%; aspect-ratio: 1; border: 4px dashed var(--wv-white);
          border-radius: 18px; box-shadow: 0 0 0 9999px rgba(39,50,72,0.18);
        }
        .cc-swatchbig {
          width: 120px; height: 120px; border-radius: 28px 34px 26px 32px;
          background: linear-gradient(120deg, var(--swatch-a) 0 50%, var(--swatch-b) 50% 100%);
        }
        .cc-flash {
          position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
          background: linear-gradient(120deg, var(--swatch-a), var(--swatch-b)); color: var(--wv-white);
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif; font-weight: 800; font-size: 30px;
          animation: ccPop 300ms cubic-bezier(0.34,1.56,0.64,1);
        }
        @keyframes ccPop { from { scale: 0.6; opacity: 0; } to { scale: 1; opacity: 1; } }
        button.cc-got:not([type="submit"]):not(.wv-header-signout) {
          width: 100%; font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-weight: 800; font-size: 20px; color: var(--wv-white); background: var(--wv-teal);
          border: none; border-radius: 20px 26px 18px 24px; padding: 16px 0; cursor: pointer;
          box-shadow: 0 4px 0 rgba(39,50,72,0.18); margin-bottom: 14px;
          transition: scale 150ms cubic-bezier(0.34,1.56,0.64,1);
        }
        button.cc-got:active { scale: 0.96; }
        button.cc-got:focus-visible { outline: 3px solid var(--color-focus); outline-offset: 3px; }
        .cc-foot { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
        button.cc-swap:not([type="submit"]):not(.wv-header-signout) {
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif; font-weight: 800; font-size: 14px;
          color: var(--wv-cadet); background: var(--wv-white); border: none; border-radius: 14px;
          padding: 10px 16px; cursor: pointer; box-shadow: 0 3px 0 rgba(39,50,72,0.12);
        }
        button.cc-swap:focus-visible { outline: 3px solid var(--color-focus); outline-offset: 3px; }
        .cc-tally-line {
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif; font-weight: 800;
          font-size: 13px; color: var(--color-text-on-dark); opacity: 0.85;
          text-align: center; margin: 12px 0 0;
        }
        button.cc-done:not([type="submit"]):not(.wv-header-signout) {
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif; font-weight: 800; font-size: 15px;
          color: var(--wv-white); background: var(--wv-redwood); border: none;
          border-radius: 16px 20px 14px 18px; padding: 10px 20px; cursor: pointer; box-shadow: 0 4px 0 rgba(39,50,72,0.18);
        }
        button.cc-done:focus-visible { outline: 3px solid var(--color-focus); outline-offset: 3px; }
        .cc-denied {
          text-align: center; font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-weight: 700; font-size: 13px; color: var(--color-text-on-dark); margin-bottom: 12px;
        }
        @media (prefers-reduced-motion: reduce) { .cc-flash { animation: none; } button.cc-got:active { scale: 1; } }
      `}</style>

      <div className="cc-toprow">
        {cam === "on" ? (
          <button type="button" className="cc-mode" onClick={() => { stop(); setCam("off"); }}>
            ✋ turn camera off
          </button>
        ) : (
          <button type="button" className="cc-mode" onClick={startCam}>
            📷 use the colour wand!
          </button>
        )}
      </div>

      {cam === "denied" && (
        <p className="cc-denied">camera&rsquo;s off — no worries, tap &ldquo;got it!&rdquo; when you find both colours.</p>
      )}

      <p className="cc-prompt">
        find one thing with{" "}
        <span
          className="cc-colourword"
          style={{
            background: first.swatch,
            color: readableOn(first.swatch),
            borderRadius: "12px 16px 10px 14px",
            padding: "3px 12px",
          }}
        >
          {first.key}
        </span>{" "}
        and{" "}
        <span
          className="cc-colourword"
          style={{
            background: second.swatch,
            color: readableOn(second.swatch),
            borderRadius: "12px 16px 10px 14px",
            padding: "3px 12px",
          }}
        >
          {second.key}
        </span>{" "}
        on it!
      </p>
      <p className="cc-where-nudge">
        {context ? WHERE_NUDGE[context] : "look wherever you are — indoors or out — for one thing wearing both colours."}
      </p>

      <div
        className="cc-seenrow"
        aria-live="polite"
        aria-label={`${first.key} ${seen[0] ? "spotted" : "not yet"}, ${second.key} ${seen[1] ? "spotted" : "not yet"}`}
      >
        <span className="cc-seenchip" data-seen={seen[0]}>
          <span className="cc-seenchip-dot" style={{ ["--chip" as string]: first.swatch }} aria-hidden="true" />
          {first.key} {seen[0] ? "✓" : ""}
        </span>
        <span className="cc-seenchip" data-seen={seen[1]}>
          <span className="cc-seenchip-dot" style={{ ["--chip" as string]: second.swatch }} aria-hidden="true" />
          {second.key} {seen[1] ? "✓" : ""}
        </span>
      </div>

      <div
        className="cc-stage"
        style={{ ["--swatch-a" as string]: first.swatch, ["--swatch-b" as string]: second.swatch }}
      >
        {cam === "on" ? (
          <>
            <video ref={videoRef} muted playsInline />
            <div className="cc-reticle" aria-hidden="true" />
          </>
        ) : (
          <div className="cc-swatchbig" aria-hidden="true" />
        )}
        {flash && <div className="cc-flash">caught!</div>}
      </div>

      <button type="button" className="cc-got" onClick={catchIt}>
        got it! ✓
      </button>

      <div className="cc-foot">
        <button type="button" className="cc-swap" onClick={nextPair}>🔄 another pair</button>
        <button type="button" className="cc-done" onClick={finish}>done — let&rsquo;s make! →</button>
      </div>
      <p className="cc-tally-line" aria-live="polite">{caught} pairs caught!</p>
    </div>
  );
}
