"use client";

/**
 * mini look — "colour catcher" — the phone becomes a colour wand.
 *
 * The app calls a colour ("find something RED!"); the kid points the
 * rear camera at a real object and the centre of the frame is sampled
 * live — a close hue match cheers and banks the catch. Camera is an
 * enhancement: a manual "got it!" is always present so denied-permission
 * / desktop / tricky-lighting never traps anyone (same pattern as
 * nod-or-spin).
 *
 * These are sensory finds (a red thing — we can't name which object), so
 * the make stage uses the "whatever you collect is right" fallback.
 *
 * Camera lifecycle: getUserMedia on a tap (iOS needs the gesture), a
 * 250ms sample loop drawing the centre crop to a tiny canvas, tracks
 * stopped on unmount.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { miniHref, saveFound } from "@/lib/mini-pilot";
import { MiniStageHero } from "../../stage-hero";

type CamState = "off" | "on" | "denied";

const COLOURS = [
  { key: "red", hue: 0, swatch: "#e24b4a" },
  { key: "orange", hue: 28, swatch: "#e0884a" },
  { key: "yellow", hue: 50, swatch: "#e6b800" },
  { key: "green", hue: 135, swatch: "#43b187" },
  { key: "blue", hue: 212, swatch: "#436db1" },
  { key: "purple", hue: 270, swatch: "#8a63d2" },
] as const;

const HUE_TOLERANCE = 32; // forgiving so a kid isn't fighting white-balance
const SAMPLE_MS = 250;

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

export default function MiniColourCatcherPage() {
  const router = useRouter();
  const [cam, setCam] = useState<CamState>("off");
  const [target, setTarget] = useState(0);
  const [caught, setCaught] = useState<Set<string>>(new Set());
  const [flash, setFlash] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const coolingRef = useRef(false);
  const hitsRef = useRef(0);
  const targetRef = useRef(0);
  targetRef.current = target;

  const colour = COLOURS[target];

  const nextColour = useCallback(() => {
    setTarget((t) => {
      let n = t;
      while (n === t) n = Math.floor(Math.random() * COLOURS.length);
      return n;
    });
  }, []);

  const catchIt = useCallback(() => {
    setCaught((prev) => new Set(prev).add(COLOURS[targetRef.current].key));
    setFlash(true);
    if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(70);
    window.setTimeout(() => setFlash(false), 700);
    nextColour();
  }, [nextColour]);

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
      const tgt = COLOURS[targetRef.current];
      const match = hsl.s > 0.25 && hsl.l > 0.18 && hsl.l < 0.85 && hueGap(hsl.h, tgt.hue) < HUE_TOLERANCE;
      hitsRef.current = match ? hitsRef.current + 1 : 0;
      if (hitsRef.current >= 2) {
        hitsRef.current = 0;
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
          text-align: center; margin-bottom: 14px;
        }
        .cc-prompt .cc-colourword { text-transform: uppercase; }
        .cc-stage {
          position: relative;
          background: var(--wv-white);
          border: 3px solid var(--swatch);
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
          width: 120px; height: 120px; border-radius: 28px 34px 26px 32px; background: var(--swatch);
        }
        .cc-flash {
          position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
          background: var(--swatch); color: var(--wv-white);
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
        .cc-tally {
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif; font-weight: 800;
          font-size: 13px; color: var(--wv-cadet); background: var(--wv-white); border-radius: 12px; padding: 6px 12px;
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
        <p className="cc-denied">camera&rsquo;s off — no worries, tap &ldquo;got it!&rdquo; when you find the colour.</p>
      )}

      <p className="cc-prompt">
        find something <span className="cc-colourword" style={{ color: colour.swatch }}>{colour.key}</span>!
      </p>

      <div className="cc-stage" style={{ ["--swatch" as string]: colour.swatch }}>
        {cam === "on" ? (
          <>
            <video ref={videoRef} muted playsInline />
            <div className="cc-reticle" aria-hidden="true" />
          </>
        ) : (
          <div className="cc-swatchbig" style={{ ["--swatch" as string]: colour.swatch }} aria-hidden="true" />
        )}
        {flash && <div className="cc-flash" style={{ ["--swatch" as string]: colour.swatch }}>caught!</div>}
      </div>

      <button type="button" className="cc-got" onClick={catchIt}>
        got it! ✓
      </button>

      <div className="cc-foot">
        <span className="cc-tally" aria-live="polite">{caught.size} colours caught!</span>
        <button type="button" className="cc-done" onClick={finish}>done — let&rsquo;s make! →</button>
      </div>
    </div>
  );
}
