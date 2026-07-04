"use client";

/**
 * mini look — "huff & puff" — find something light, then BLOW at the phone.
 *
 * The mic listens for a sustained loud burst (a huff/blow); a live wind
 * meter shows the mic working so it's never a mystery. Mic is an
 * enhancement — a manual "i blew it! 💨" is always present for
 * denied-permission / desktop. Sensory finds → make uses the fallback.
 *
 * Audio lifecycle: getUserMedia(audio) + AnalyserNode on a tap, an rAF
 * RMS loop, context closed + tracks stopped on unmount.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { miniHref, saveFound, loadContext, type MiniContext } from "@/lib/mini-pilot";
import { MiniStageHero } from "../../stage-hero";

type MicState = "off" | "on" | "denied";

const PROMPTS = [
  { word: "light & floaty", emoji: "🪶" },
  { word: "papery", emoji: "📄" },
  { word: "fluffy", emoji: "☁️" },
  { word: "teeny tiny", emoji: "🐜" },
] as const;

// same blow-it framing, nudged toward where the light things hide.
const WHERE_NUDGE: Record<MiniContext, string> = {
  indoor: "peek in drawers, cupboards, and the recycling — papery, feathery bits love it there.",
  outdoor: "look on the ground, under bushes, and along the path — leaves, seeds, and fluff drift about.",
};

const RMS_ON = 0.12;       // loudness that counts as a puff
const SUSTAIN_FRAMES = 5;  // ~80ms of sustained loudness

export default function MiniHuffPuffPage() {
  const router = useRouter();
  const [mic, setMic] = useState<MicState>("off");
  const [prompt, setPrompt] = useState(0);
  const [count, setCount] = useState(0);
  const [level, setLevel] = useState(0); // 0..1 wind meter
  const [flash, setFlash] = useState(false);

  // SSR-safe context read: null on server + first client paint (neutral nudge),
  // then swaps to the place-aware nudge once mounted.
  const [context, setContext] = useState<MiniContext | null>(null);
  useEffect(() => {
    setContext(loadContext());
  }, []);

  const ctxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef(0);
  const sustainRef = useRef(0);
  const coolingRef = useRef(false);

  const puff = useCallback(() => {
    setCount((c) => c + 1);
    setFlash(true);
    if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(70);
    window.setTimeout(() => setFlash(false), 700);
    setPrompt((p) => {
      let n = p;
      while (n === p) n = Math.floor(Math.random() * PROMPTS.length);
      return n;
    });
  }, []);

  const stop = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    ctxRef.current?.close().catch(() => {});
    ctxRef.current = null;
  }, []);

  useEffect(() => () => stop(), [stop]);

  async function startMic() {
    try {
      // disable the default audio processing — noiseSuppression/AGC actively
      // filter out blowing and wind, which is exactly the signal we want.
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
        video: false,
      });
      streamRef.current = stream;
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new Ctx();
      ctxRef.current = ctx;
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      src.connect(analyser);
      const buf = new Uint8Array(analyser.fftSize);
      setMic("on");

      const loop = () => {
        analyser.getByteTimeDomainData(buf);
        let sum = 0;
        for (let i = 0; i < buf.length; i++) {
          const v = (buf[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / buf.length);
        setLevel(Math.min(1, rms / 0.3));
        if (!coolingRef.current) {
          sustainRef.current = rms > RMS_ON ? sustainRef.current + 1 : 0;
          if (sustainRef.current >= SUSTAIN_FRAMES) {
            sustainRef.current = 0;
            coolingRef.current = true;
            puff();
            window.setTimeout(() => (coolingRef.current = false), 900);
          }
        }
        rafRef.current = requestAnimationFrame(loop);
      };
      rafRef.current = requestAnimationFrame(loop);
    } catch {
      setMic("denied");
    }
  }

  const finish = useCallback(() => {
    stop();
    saveFound([]);
    router.push(miniHref("/make"));
  }, [stop, router]);

  const p = PROMPTS[prompt];

  return (
    <div>
      <MiniStageHero stage="look" />

      <style>{`
        .hp-toprow { display: flex; justify-content: center; margin-bottom: 14px; }
        button.hp-mode:not([type="submit"]):not(.wv-header-signout) {
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif; font-weight: 800; font-size: 15px;
          color: var(--wv-cadet); background: var(--wv-white); border: 2px solid var(--wv-seafoam);
          border-radius: 16px 20px 14px 18px; padding: 10px 18px; cursor: pointer;
        }
        button.hp-mode:focus-visible { outline: 3px solid var(--color-focus); outline-offset: 3px; }
        .hp-denied { text-align: center; font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-weight: 700; font-size: 13px; color: var(--color-text-on-dark); margin-bottom: 12px; }
        .hp-prompt { font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif; font-weight: 800;
          font-size: 22px; color: var(--color-text-on-dark); text-align: center; margin-bottom: 10px; }
        .hp-where-nudge { font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif; font-weight: 700;
          font-size: 13px; color: var(--color-text-on-dark); opacity: 0.85; text-align: center;
          margin: 0 0 16px; line-height: 1.4; }
        .hp-card {
          position: relative; display: flex; flex-direction: column; align-items: center; gap: 16px;
          background: var(--wv-white); border: 2.5px solid var(--wv-seafoam);
          border-radius: 28px 34px 26px 32px; padding: 28px 20px; margin-bottom: 18px;
        }
        .hp-emoji { font-size: 96px; line-height: 1; transition: transform 120ms ease; }
        .hp-meter-track { width: 100%; height: 16px; border-radius: 8px; background: rgba(39,50,72,0.1); overflow: hidden; }
        .hp-meter-fill { height: 100%; background: var(--wv-teal); border-radius: 8px; transition: width 80ms linear; }
        .hp-meter-label { font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif; font-weight: 700;
          font-size: 13px; color: #4b5563; }
        .hp-flash { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
          background: var(--wv-teal); color: var(--wv-white); border-radius: 28px 34px 26px 32px;
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif; font-weight: 800; font-size: 30px;
          animation: hpPop 300ms cubic-bezier(0.34,1.56,0.64,1); }
        @keyframes hpPop { from { scale: 0.6; opacity: 0; } to { scale: 1; opacity: 1; } }
        button.hp-got:not([type="submit"]):not(.wv-header-signout) {
          width: 100%; font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif; font-weight: 800; font-size: 20px;
          color: var(--wv-white); background: var(--wv-teal); border: none; border-radius: 20px 26px 18px 24px;
          padding: 16px 0; cursor: pointer; box-shadow: 0 4px 0 rgba(39,50,72,0.18); margin-bottom: 14px;
          transition: scale 150ms cubic-bezier(0.34,1.56,0.64,1); }
        button.hp-got:active { scale: 0.96; }
        button.hp-got:focus-visible { outline: 3px solid var(--color-focus); outline-offset: 3px; }
        .hp-foot { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
        .hp-tally { font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif; font-weight: 800; font-size: 13px;
          color: var(--wv-cadet); background: var(--wv-white); border-radius: 12px; padding: 6px 12px; }
        button.hp-done:not([type="submit"]):not(.wv-header-signout) {
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif; font-weight: 800; font-size: 15px;
          color: var(--wv-white); background: var(--wv-redwood); border: none; border-radius: 16px 20px 14px 18px;
          padding: 10px 20px; cursor: pointer; box-shadow: 0 4px 0 rgba(39,50,72,0.18); }
        button.hp-done:focus-visible { outline: 3px solid var(--color-focus); outline-offset: 3px; }
        @media (prefers-reduced-motion: reduce) { .hp-flash { animation: none; } button.hp-got:active { scale: 1; } }
      `}</style>

      <div className="hp-toprow">
        {mic === "on" ? (
          <button type="button" className="hp-mode" onClick={() => { stop(); setMic("off"); setLevel(0); }}>
            ✋ turn mic off
          </button>
        ) : (
          <button type="button" className="hp-mode" onClick={startMic}>
            💨 blow with the mic!
          </button>
        )}
      </div>

      {mic === "denied" && (
        <p className="hp-denied">mic&rsquo;s off — no worries, tap &ldquo;i blew it!&rdquo; when you&rsquo;ve done it.</p>
      )}

      <p className="hp-prompt">find something your breath can MOVE ({p.word}) — then BLOW! {p.emoji}</p>
      <p className="hp-where-nudge">
        {context ? WHERE_NUDGE[context] : "look wherever you are — indoors or out — for light, floaty things."}
      </p>

      <div className="hp-card">
        <span className="hp-emoji" aria-hidden="true" style={{ transform: `translateY(${-level * 14}px)` }}>
          {p.emoji}
        </span>
        {mic === "on" && (
          <>
            <span className="hp-meter-label">wind strength</span>
            <div className="hp-meter-track" aria-hidden="true">
              <div className="hp-meter-fill" style={{ width: `${Math.round(level * 100)}%` }} />
            </div>
          </>
        )}
        {flash && <div className="hp-flash">whoosh! 💨</div>}
      </div>

      <button type="button" className="hp-got" onClick={puff}>i blew it! 💨</button>

      <div className="hp-foot">
        <span className="hp-tally" aria-live="polite">{count} puffed!</span>
        <button type="button" className="hp-done" onClick={finish}>done — let&rsquo;s make! →</button>
      </div>
    </div>
  );
}
