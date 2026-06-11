"use client";

/**
 * creaseworks mini — welcome.
 *
 * Two registers on one screen:
 *   - kid hero: the four stage characters, a one-line invitation, and a
 *     single enormous start button. zero reading required to proceed —
 *     the button is the only interactive element in the flow.
 *   - grown-up strip: a collapsible framing card for the facilitating
 *     adult (what this is, how to run it, what feedback we want).
 *
 * "show not tell… they discover the why behind it as they give us the
 * feedback" — garrett, whirlpool 2026-06-10.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import CharacterSlot from "@windedvertigo/characters";
import { useCharacterVariant } from "@windedvertigo/characters/variant-context";
import { MINI_STAGES } from "@/lib/mini-pilot";

export default function MiniWelcomePage() {
  const router = useRouter();
  const variant = useCharacterVariant();
  const [adultOpen, setAdultOpen] = useState(false);

  return (
    <div className="mini-welcome">
      <style>{`
        .mini-welcome {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding-top: 24px;
        }
        .mini-cast {
          display: flex;
          gap: 18px;
          margin-bottom: 20px;
        }
        .mini-cast-slot {
          animation: miniBob 3.2s ease-in-out var(--bob-delay) infinite;
        }
        @keyframes miniBob {
          0%, 100% { translate: 0 0; }
          50%      { translate: 0 -6px; }
        }
        .mini-title {
          font-family: var(--font-fraunces), serif;
          font-weight: 600;
          font-size: 34px;
          color: var(--wv-cadet);
          margin-bottom: 8px;
        }
        .mini-invite {
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-weight: 700;
          font-size: 17px;
          color: var(--wv-cadet);
          opacity: 0.75;
          max-width: 26ch;
          margin: 0 auto 28px;
          line-height: 1.45;
        }
        button.mini-start:not([type="submit"]):not(.wv-header-signout) {
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-weight: 800;
          font-size: 22px;
          color: var(--wv-white);
          background: var(--wv-redwood);
          border: none;
          border-radius: 26px 32px 24px 30px;
          padding: 20px 44px;
          cursor: pointer;
          box-shadow: 0 6px 0 rgba(39, 50, 72, 0.15);
          transition: scale 160ms cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        button.mini-start:not([type="submit"]):not(.wv-header-signout):hover { scale: 1.05; }
        button.mini-start:not([type="submit"]):not(.wv-header-signout):active { scale: 0.95; }
        button.mini-start:not([type="submit"]):not(.wv-header-signout):focus-visible {
          outline: 3px solid var(--color-focus);
          outline-offset: 3px;
        }
        .mini-adult-strip {
          margin-top: 44px;
          width: 100%;
          max-width: 480px;
          text-align: left;
        }
        button.mini-adult-toggle:not([type="submit"]):not(.wv-header-signout) {
          width: 100%;
          background: var(--wv-white);
          border: 1.5px solid rgba(39, 50, 72, 0.1);
          border-radius: 14px;
          padding: 10px 14px;
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-weight: 700;
          font-size: 13px;
          color: var(--wv-cadet);
          opacity: 0.7;
          cursor: pointer;
          text-align: left;
        }
        button.mini-adult-toggle:not([type="submit"]):not(.wv-header-signout):focus-visible {
          outline: 3px solid var(--color-focus);
          outline-offset: 2px;
        }
        .mini-adult-body {
          background: var(--wv-white);
          border: 1.5px solid rgba(39, 50, 72, 0.08);
          border-radius: 14px;
          margin-top: 8px;
          padding: 16px;
          font-size: 14px;
          line-height: 1.6;
          color: var(--wv-cadet);
        }
        .mini-adult-body p { margin-bottom: 10px; }
        .mini-adult-body p:last-child { margin-bottom: 0; }
        @media (prefers-reduced-motion: reduce) {
          .mini-cast-slot { animation: none; }
        }
      `}</style>

      {/* kid hero */}
      <div className="mini-cast" aria-hidden="true">
        {MINI_STAGES.map((stage, i) => (
          <span
            key={stage.key}
            className="mini-cast-slot"
            style={{ ["--bob-delay" as string]: `${i * 0.4}s` }}
          >
            <CharacterSlot
              character={stage.character}
              size={56}
              animate={false}
              variant={variant}
            />
          </span>
        ))}
      </div>

      <h1 className="mini-title">creaseworks mini</h1>
      <p className="mini-invite">
        find things around you. make something new. show everyone!
      </p>

      <button
        type="button"
        className="mini-start"
        onClick={() => router.push("/mini/look")}
      >
        let&rsquo;s look! →
      </button>

      {/* grown-up strip */}
      <div className="mini-adult-strip">
        <button
          type="button"
          className="mini-adult-toggle"
          onClick={() => setAdultOpen(!adultOpen)}
          aria-expanded={adultOpen}
          aria-controls="mini-adult-body"
        >
          {adultOpen ? "▾" : "▸"} for grown-ups — how this works
        </button>
        {adultOpen && (
          <div id="mini-adult-body" className="mini-adult-body">
            <p>
              this is a tiny pilot version of creaseworks: five hands-on
              activities for ages 4–6 using everyday materials. it runs in
              four short phases — <strong>look</strong> (hunt for
              materials), <strong>make</strong> (a matched activity),{" "}
              <strong>show</strong> (photo + their words), and{" "}
              <strong>wow</strong> (see what other kids made).
            </p>
            <p>
              let your child lead. read prompts aloud, but resist
              instructing — there are no wrong materials and no wrong
              builds. you handle the phone; they handle the ideas.
            </p>
            <p>
              we&rsquo;re testing this with friends and family. every time
              your child pauses, gets confused, or surprises you, that
              moment is gold — tap the feedback prompts as you go and tell
              us about it.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
