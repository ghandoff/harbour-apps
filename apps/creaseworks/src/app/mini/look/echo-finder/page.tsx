"use client";

/**
 * mini look — "echo finder" — hear a sound, find a thing that makes it,
 * then make the sound back.
 *
 * "🔊 hear it" plays a synthesised reference (crinkle / jingle / tap /
 * thump). The kid finds a material that sounds like that and recreates
 * it; the mic catches the sound onset and moves on. We can't truly
 * classify the sound, so any sound made after hearing the reference
 * counts — forgiving by design, and a manual "i made it!" is always
 * there for denied-mic / desktop. Sensory finds → make uses the fallback.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { miniHref, saveFound, loadContext, type MiniContext } from "@/lib/mini-pilot";
import { MiniStageHero } from "../../stage-hero";

type MicState = "off" | "on" | "denied";
type SoundKey = "crinkle" | "jingle" | "tap" | "thump";

// same sound-hunt, nudged toward where the noisy things hide.
const WHERE_NUDGE: Record<MiniContext, string> = {
  indoor: "hunt in drawers, cupboards, and the recycling — crinkly, jingly, tappy things live there.",
  outdoor: "hunt on the ground, in the bushes, and along the path — sticks, stones, and leaves all have a sound.",
};

const SOUNDS: { key: SoundKey; emoji: string; hint: string }[] = [
  { key: "crinkle", emoji: "🧻", hint: "paper, foil, wrappers" },
  { key: "jingle", emoji: "🔔", hint: "keys, bells, coins" },
  { key: "tap", emoji: "🥢", hint: "sticks, spoons, cups" },
  { key: "thump", emoji: "🥁", hint: "boxes, tubs, pillows" },
];

const RMS_ON = 0.06;
const SUSTAIN_FRAMES = 2; // a quick onset is enough (taps are short)

function playSound(ctx: AudioContext, key: SoundKey) {
  const now = ctx.currentTime;
  // longer noise buffer so crinkle/tap have enough material
  const noiseBuf = (() => {
    const b = ctx.createBuffer(1, ctx.sampleRate * 0.6, ctx.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return b;
  })();

  const burst = (t: number, freq: number, dur: number, type: OscillatorType, gain: number) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type; osc.frequency.value = freq;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g).connect(ctx.destination);
    osc.start(t); osc.stop(t + dur);
  };

  const noise = (t: number, dur: number, hp: number, gain: number) => {
    const s = ctx.createBufferSource(); s.buffer = noiseBuf;
    const f = ctx.createBiquadFilter(); f.type = "highpass"; f.frequency.value = hp;
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f).connect(g).connect(ctx.destination);
    s.start(t); s.stop(t + dur);
  };

  if (key === "crinkle") {
    // 8 overlapping rustle bursts — louder, longer each
    for (let i = 0; i < 8; i++) noise(now + i * 0.08, 0.14, 2500, 0.9);
  } else if (key === "jingle") {
    // louder metallic tones with longer ring
    [1200, 1700, 2100, 1500, 900].forEach((f, i) => burst(now + i * 0.1, f, 0.45, "sine", 0.85));
  } else if (key === "tap") {
    // sharp crack + body resonance — more audible on phone speakers
    [0, 0.22].forEach((t) => { noise(now + t, 0.14, 600, 0.95); burst(now + t, 400, 0.12, "triangle", 0.7); });
  } else {
    // thump: add 160Hz + 320Hz overtones so phone speakers can reproduce it
    [0, 0.28].forEach((t) => {
      burst(now + t, 120, 0.35, "sine", 0.9);
      burst(now + t, 240, 0.28, "sine", 0.6);
      burst(now + t, 480, 0.18, "triangle", 0.4);
    });
  }
}

export default function MiniEchoFinderPage() {
  const router = useRouter();
  const [mic, setMic] = useState<MicState>("off");
  const [idx, setIdx] = useState(0);
  const [count, setCount] = useState(0);
  const [flash, setFlash] = useState(false);
  const [level, setLevel] = useState(0);

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

  const ensureCtx = useCallback(() => {
    if (!ctxRef.current) {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctxRef.current = new Ctx();
    }
    if (ctxRef.current.state === "suspended") ctxRef.current.resume().catch(() => {});
    return ctxRef.current;
  }, []);

  const sound = SOUNDS[idx];

  const hear = useCallback(() => {
    playSound(ensureCtx(), sound.key);
  }, [ensureCtx, sound.key]);

  const matched = useCallback(() => {
    setCount((c) => c + 1);
    setFlash(true);
    if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(70);
    window.setTimeout(() => setFlash(false), 700);
    setIdx((p) => {
      let n = p;
      while (n === p) n = Math.floor(Math.random() * SOUNDS.length);
      return n;
    });
  }, []);

  const stop = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setLevel(0);
  }, []);

  useEffect(() => () => { stop(); ctxRef.current?.close().catch(() => {}); }, [stop]);

  async function startMic() {
    try {
      // processing off so quiet crinkles/taps aren't suppressed before we hear them
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
        video: false,
      });
      streamRef.current = stream;
      const ctx = ensureCtx();
      // must await resume — a suspended context returns flat silence from getByteTimeDomainData
      await ctx.resume();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      ctx.createMediaStreamSource(stream).connect(analyser);
      const buf = new Uint8Array(analyser.fftSize);
      setMic("on");
      const loop = () => {
        analyser.getByteTimeDomainData(buf);
        let sum = 0;
        for (let i = 0; i < buf.length; i++) { const v = (buf[i] - 128) / 128; sum += v * v; }
        const rms = Math.sqrt(sum / buf.length);
        setLevel(Math.min(1, rms / 0.25));
        if (!coolingRef.current) {
          sustainRef.current = rms > RMS_ON ? sustainRef.current + 1 : 0;
          if (sustainRef.current >= SUSTAIN_FRAMES) {
            sustainRef.current = 0;
            coolingRef.current = true;
            matched();
            window.setTimeout(() => (coolingRef.current = false), 1100);
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

  return (
    <div>
      <MiniStageHero stage="look" />

      <style>{`
        .ef-toprow { display: flex; justify-content: center; margin-bottom: 14px; }
        button.ef-mode:not([type="submit"]):not(.wv-header-signout) {
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif; font-weight: 800; font-size: 15px;
          color: var(--wv-cadet); background: var(--wv-white); border: 2px solid var(--wv-seafoam);
          border-radius: 16px 20px 14px 18px; padding: 10px 18px; cursor: pointer; }
        button.ef-mode:focus-visible { outline: 3px solid var(--color-focus); outline-offset: 3px; }
        .ef-denied { text-align: center; font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-weight: 700; font-size: 13px; color: var(--color-text-on-dark); margin-bottom: 12px; }
        .ef-prompt { font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif; font-weight: 800;
          font-size: 22px; color: var(--color-text-on-dark); text-align: center; margin-bottom: 10px; }
        .ef-where-nudge { font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif; font-weight: 700;
          font-size: 13px; color: var(--color-text-on-dark); opacity: 0.85; text-align: center;
          margin: 0 0 16px; line-height: 1.4; }
        .ef-card { position: relative; display: flex; flex-direction: column; align-items: center; gap: 16px;
          background: var(--wv-white); border: 2.5px solid var(--wv-seafoam); border-radius: 28px 34px 26px 32px;
          padding: 28px 20px; margin-bottom: 16px; }
        .ef-emoji { font-size: 96px; line-height: 1; }
        .ef-hint { font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif; font-weight: 700;
          font-size: 14px; color: #4b5563; }
        .ef-meter-track { width: 100%; height: 14px; border-radius: 7px; background: rgba(39,50,72,0.1); overflow: hidden; }
        .ef-meter-fill { height: 100%; background: var(--wv-teal); border-radius: 7px; transition: width 60ms linear; }
        .ef-meter-label { font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif; font-weight: 700;
          font-size: 12px; color: #4b5563; }
        button.ef-hear:not([type="submit"]):not(.wv-header-signout) {
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif; font-weight: 800; font-size: 19px;
          color: var(--wv-cadet); background: var(--wv-mint); border: 2.5px solid var(--wv-teal);
          border-radius: 18px 22px 16px 20px; padding: 12px 26px; cursor: pointer;
          transition: scale 150ms cubic-bezier(0.34,1.56,0.64,1); }
        button.ef-hear:active { scale: 0.96; }
        button.ef-hear:focus-visible { outline: 3px solid var(--color-focus); outline-offset: 3px; }
        .ef-flash { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
          background: var(--wv-teal); color: var(--wv-white); border-radius: 28px 34px 26px 32px;
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif; font-weight: 800; font-size: 28px;
          animation: efPop 300ms cubic-bezier(0.34,1.56,0.64,1); }
        @keyframes efPop { from { scale: 0.6; opacity: 0; } to { scale: 1; opacity: 1; } }
        button.ef-got:not([type="submit"]):not(.wv-header-signout) {
          width: 100%; font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif; font-weight: 800; font-size: 20px;
          color: var(--wv-white); background: var(--wv-teal); border: none; border-radius: 20px 26px 18px 24px;
          padding: 16px 0; cursor: pointer; box-shadow: 0 4px 0 rgba(39,50,72,0.18); margin-bottom: 14px;
          transition: scale 150ms cubic-bezier(0.34,1.56,0.64,1); }
        button.ef-got:active { scale: 0.96; }
        button.ef-got:focus-visible { outline: 3px solid var(--color-focus); outline-offset: 3px; }
        .ef-foot { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
        .ef-tally { font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif; font-weight: 800; font-size: 13px;
          color: var(--wv-cadet); background: var(--wv-white); border-radius: 12px; padding: 6px 12px; }
        button.ef-done:not([type="submit"]):not(.wv-header-signout) {
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif; font-weight: 800; font-size: 15px;
          color: var(--wv-white); background: var(--wv-redwood); border: none; border-radius: 16px 20px 14px 18px;
          padding: 10px 20px; cursor: pointer; box-shadow: 0 4px 0 rgba(39,50,72,0.18); }
        button.ef-done:focus-visible { outline: 3px solid var(--color-focus); outline-offset: 3px; }
        @media (prefers-reduced-motion: reduce) { .ef-flash { animation: none; } button.ef-hear:active, button.ef-got:active { scale: 1; } }
      `}</style>

      <div className="ef-toprow">
        {mic === "on" ? (
          <button type="button" className="ef-mode" onClick={() => { stop(); setMic("off"); }}>
            ✋ turn mic off
          </button>
        ) : (
          <button type="button" className="ef-mode" onClick={startMic}>
            🎤 listen for my sound!
          </button>
        )}
      </div>

      {mic === "denied" && (
        <p className="ef-denied">mic&rsquo;s off — no worries, tap &ldquo;i made it!&rdquo; when you&rsquo;ve made the sound.</p>
      )}

      <p className="ef-prompt">find something that can SAY this…</p>
      <p className="ef-where-nudge">
        {context ? WHERE_NUDGE[context] : "hunt wherever you are — indoors or out — for things that make a sound."}
      </p>

      <div className="ef-card">
        <span className="ef-emoji" aria-hidden="true">{sound.emoji}</span>
        <button type="button" className="ef-hear" onClick={hear}>🔊 hear the {sound.key}!</button>
        <span className="ef-hint">like: {sound.hint}</span>
        {mic === "on" && (
          <>
            <span className="ef-meter-label">sound level</span>
            <div className="ef-meter-track" aria-hidden="true">
              <div className="ef-meter-fill" style={{ width: `${Math.round(level * 100)}%` }} />
            </div>
          </>
        )}
        {flash && <div className="ef-flash">i hear it! 🎉</div>}
      </div>

      <button type="button" className="ef-got" onClick={matched}>i made it! 🔊</button>

      <div className="ef-foot">
        <span className="ef-tally" aria-live="polite">{count} sounds matched!</span>
        <button type="button" className="ef-done" onClick={finish}>done — let&rsquo;s make! →</button>
      </div>
    </div>
  );
}
