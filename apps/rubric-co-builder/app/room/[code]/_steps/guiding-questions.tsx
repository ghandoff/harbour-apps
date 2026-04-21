"use client";

import { useState } from "react";
import type { RoomState } from "@/lib/types";

const QUESTIONS: Record<RoomState, string[]> = {
  lobby: [],
  frame: [
    "what would it mean to have really nailed this outcome?",
    "what does this outcome look like in a week that went well, versus a week that didn’t?",
    "what would a reader struggle to see in the final artefact that’s actually important?",
  ],
  propose: [
    "what should count as excellent here — not just acceptable?",
    "what separates decent from brilliant, in your words?",
    "what fails most often in this kind of project? name it.",
    "which criterion is so hard to fake that it forces real work?",
  ],
  vote: [
    "which three are genuinely different from each other?",
    "which one is hardest to fake with polish?",
    "which one would you most want to be graded on?",
  ],
  vote2: [
    "now that you've seen how each criterion gets scaled — does your ranking change?",
    "which criterion will actually change how you work on the artefact?",
    "which descriptor still feels vague? vote for the ones where the language landed.",
  ],
  vote3: [
    "which criteria are doing real work — not just sounding good?",
    "which ones would survive a hard conversation with the marker?",
    "if you could only keep three, which three?",
  ],
  scale: [
    "what does this look like when it only barely passes?",
    "what’s the leap from emerging to proficient — in one concrete sentence?",
    "what makes advanced advanced — what has the team actually done that a proficient team didn’t?",
  ],
  calibrate: [
    "what in the artefact made you score that way?",
    "what piece of language would have moved you one level up or down?",
    "where did the descriptor feel slippery — what would you rewrite?",
  ],
  ai_ladder: [
    "what kind of help with this work would still feel like your work?",
    "what would cross a line for you personally, even if it isn’t cheating?",
    "what ceiling lets the team stretch without outsourcing the thinking?",
  ],
  pledge: [
    "what specific tool are you actually picturing?",
    "what would make you confident enough to disclose it to the reader?",
    "what would a future you regret not writing down here?",
  ],
  commit: [],
};

export function GuidingQuestions({ state }: { state: RoomState }) {
  const list = QUESTIONS[state];
  const [open, setOpen] = useState(true);
  if (!list || list.length === 0) return null;

  return (
    <aside
      className="mb-6 rounded-lg border border-[color:var(--color-cadet)]/15 bg-white"
      aria-label="guiding questions"
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <span className="text-xs tracking-widest text-[color:var(--color-cadet)]/70">
          guiding questions
        </span>
        <span className="text-xs text-[color:var(--color-cadet)]/50">
          {open ? "hide" : "show"}
        </span>
      </button>
      {open ? (
        <ul className="px-4 pb-4 space-y-2">
          {list.map((q, i) => (
            <li
              key={i}
              className="text-sm text-[color:var(--color-cadet)]/90 leading-relaxed pl-4 relative before:absolute before:left-0 before:top-2.5 before:w-1.5 before:h-1.5 before:rounded-full before:bg-[color:var(--color-sienna)]"
            >
              {q}
            </li>
          ))}
        </ul>
      ) : null}
    </aside>
  );
}
