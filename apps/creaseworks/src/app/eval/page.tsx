"use client";

/**
 * creaseworks eval — home.
 *
 * Two moves: say who you are + which register you're in (felt = you
 * played it; frame = you're reviewing it against the framework), then
 * pick a playdate. Register + name live in sessionStorage so they never
 * touch the URL (no PII in query strings); the play page reads them.
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { evalHref } from "@/lib/eval-nav";
import {
  EVAL_PLAYDATES,
  REGISTER_META,
  type Register,
} from "@/lib/eval-rubric";

const NAME_KEY = "cw-eval-name";
const REG_KEY = "cw-eval-register";

export default function EvalHome() {
  const router = useRouter();
  const [register, setRegister] = useState<Register | null>(null);
  const [name, setName] = useState("");

  // restore a prior session so a returning evaluator isn't re-asked
  useEffect(() => {
    try {
      const n = sessionStorage.getItem(NAME_KEY);
      const r = sessionStorage.getItem(REG_KEY) as Register | null;
      if (n) setName(n);
      if (r === "kid" || r === "grownup" || r === "collective") setRegister(r);
      // deep-link from the mini's grown-up corner: #collective (a HASH, not a
      // query — a query on the basePath root 404s in Next; the hash is
      // client-only so the server still serves the clean 200 home)
      const h = window.location.hash.replace(/^#/, "");
      if (h === "kid" || h === "grownup" || h === "collective") setRegister(h);
    } catch {}
  }, []);

  const ready = register !== null && name.trim().length > 0;

  function start(slug: string) {
    if (!ready || !register) return;
    try {
      sessionStorage.setItem(NAME_KEY, name.trim());
      sessionStorage.setItem(REG_KEY, register);
    } catch {}
    router.push(evalHref(`/play/${slug}`));
  }

  return (
    <div>
      <style>{`
        .eh-lede { font-size: 16px; line-height: 1.6; color: var(--wv-cadet); margin: 0 0 6px; }
        .eh-lede strong { font-weight: 800; }
        .eh-sub { font-size: 14px; line-height: 1.6; color: #4b5563; margin: 0 0 22px; }
        .eh-h { font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-weight: 800; font-size: 14px; color: var(--wv-cadet); margin: 0 0 10px; }
        .eh-regs { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 22px; }
        @media (max-width: 640px) { .eh-regs { grid-template-columns: 1fr; } }
        button.eh-reg:not([type="submit"]) {
          text-align: left; cursor: pointer; background: var(--wv-white);
          border: 2px solid rgba(39,50,72,0.12); border-radius: 16px 20px 14px 18px;
          padding: 16px; transition: border-color 120ms ease, transform 120ms ease;
        }
        button.eh-reg:hover { transform: translateY(-1px); }
        button.eh-reg[data-on="true"] { border-color: var(--wv-teal); background: color-mix(in srgb, var(--wv-mint) 30%, var(--wv-white)); }
        button.eh-reg:focus-visible { outline: 3px solid var(--color-focus); outline-offset: 2px; }
        .eh-reg-emoji { font-size: 26px; line-height: 1; }
        .eh-reg-label { font-weight: 800; font-size: 16px; color: var(--wv-cadet); margin: 8px 0 2px; }
        .eh-reg-sub { font-size: 13px; line-height: 1.5; color: #4b5563; }
        .eh-name { display: ${register ? "block" : "none"}; margin-bottom: 22px; }
        .eh-name label { display: block; font-weight: 800; font-size: 14px; color: var(--wv-cadet); margin-bottom: 6px; }
        .eh-name input {
          width: 100%; box-sizing: border-box; font-family: inherit; font-size: 15px;
          color: var(--wv-cadet); background: var(--wv-white); border: 2px solid rgba(39,50,72,0.16);
          border-radius: 12px; padding: 11px 13px;
        }
        .eh-name input:focus-visible { outline: 3px solid var(--color-focus); outline-offset: 1px; }
        .eh-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        @media (max-width: 540px) { .eh-grid { grid-template-columns: 1fr; } }
        button.eh-tile:not([type="submit"]) {
          text-align: left; cursor: pointer; background: var(--wv-white);
          border: 1.5px solid rgba(39,50,72,0.10); border-radius: 18px 22px 16px 20px;
          padding: 14px 16px; box-shadow: 0 3px 0 rgba(39,50,72,0.07);
          transition: transform 120ms ease, box-shadow 120ms ease; opacity: ${ready ? "1" : "0.5"};
        }
        button.eh-tile:not(:disabled):hover { transform: translateY(-2px); box-shadow: 0 5px 0 rgba(39,50,72,0.09); }
        button.eh-tile:disabled { cursor: not-allowed; }
        button.eh-tile:focus-visible { outline: 3px solid var(--color-focus); outline-offset: 2px; }
        .eh-tile-title { font-weight: 800; font-size: 15px; color: var(--wv-cadet); margin-bottom: 3px; }
        .eh-tile-tag { font-size: 12.5px; line-height: 1.45; color: #4b5563; }
        .eh-hint { font-size: 13px; color: #6b7280; margin: 0 0 12px; min-height: 18px; }
      `}</style>

      <p className="eh-lede">
        tell us what a creaseworks playdate was <strong>really like</strong>.
      </p>
      <p className="eh-sub">
        pick how you met it. kids tap a few faces; grown-ups tick what they saw;
        the collective climbs the five lenses.
      </p>
      <p className="eh-sub" style={{ fontWeight: 700, color: "var(--wv-cadet)" }}>
        your reflections shape what we build next — they matter as much as the photos.
      </p>

      <p className="eh-h">how did you meet it?</p>
      <div className="eh-regs">
        {(Object.keys(REGISTER_META) as Register[]).map((r) => (
          <button
            key={r}
            type="button"
            className="eh-reg"
            data-on={register === r}
            aria-pressed={register === r}
            onClick={() => setRegister(r)}
          >
            <span className="eh-reg-emoji" aria-hidden="true">{REGISTER_META[r].emoji}</span>
            <div className="eh-reg-label">{REGISTER_META[r].label}</div>
            <div className="eh-reg-sub">{REGISTER_META[r].sub}</div>
          </button>
        ))}
      </div>

      <div className="eh-name">
        <label htmlFor="eh-name-input">your name (so the team knows whose eyes these are)</label>
        <input
          id="eh-name-input"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. jamie"
          maxLength={60}
          autoCapitalize="words"
        />
      </div>

      <p className="eh-h">pick a playdate to evaluate</p>
      <p className="eh-hint">
        {ready ? "tap one to begin." : "choose a register and add your name first."}
      </p>
      <div className="eh-grid">
        {EVAL_PLAYDATES.map((p) => (
          <button
            key={p.slug}
            type="button"
            className="eh-tile"
            disabled={!ready}
            onClick={() => start(p.slug)}
          >
            <div className="eh-tile-title">{p.title}</div>
            <div className="eh-tile-tag">{p.tagline}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
