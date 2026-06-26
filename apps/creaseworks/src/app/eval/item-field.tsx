"use client";

/**
 * creaseworks eval — one rubric item, rendered by type.
 *
 * Value shapes by type:
 *   scale5            → number 1–5
 *   gate3/yesno/choice→ string (the chosen option)
 *   triad             → string[] (the present qualities)
 *   text              → string
 *
 * Styles live in the play page's <style> block (shared classNames) so a
 * long rubric doesn't ship the same CSS dozens of times.
 */

import type { EvalItem } from "@/lib/eval-rubric";
import { GATE3_OPTIONS, YESNO_OPTIONS } from "@/lib/eval-rubric";

export type AnswerValue = number | string | string[];

interface Props {
  item: EvalItem;
  value: AnswerValue | undefined;
  onChange: (id: string, value: AnswerValue) => void;
}

const SCALE_ENDS: Record<string, [string, string]> = {
  // low-label, high-label for the 1–5 scales (per item where it helps)
  "felt-test": ["not at all", "a lot"],
};

export function ItemField({ item, value, onChange }: Props) {
  const set = (v: AnswerValue) => onChange(item.id, v);

  return (
    <div className="ef-item">
      <p className="ef-prompt">{item.prompt}</p>
      {item.help && <p className="ef-help">{item.help}</p>}

      {item.type === "scale5" && (
        <div>
          <div className="ef-scale" role="group" aria-label={item.prompt}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                className="ef-scalebtn"
                data-on={value === n}
                aria-pressed={value === n}
                onClick={() => set(n)}
              >
                {n}
              </button>
            ))}
          </div>
          <div className="ef-scale-ends">
            <span>{SCALE_ENDS[item.id]?.[0] ?? "no"}</span>
            <span>{SCALE_ENDS[item.id]?.[1] ?? "yes"}</span>
          </div>
        </div>
      )}

      {(item.type === "gate3" || item.type === "yesno" || item.type === "choice") && (
        <div className="ef-opts" role="group" aria-label={item.prompt}>
          {(item.type === "gate3"
            ? [...GATE3_OPTIONS]
            : item.type === "yesno"
              ? [...YESNO_OPTIONS]
              : item.options ?? []
          ).map((opt) => (
            <button
              key={opt}
              type="button"
              className="ef-opt"
              data-on={value === opt}
              aria-pressed={value === opt}
              onClick={() => set(opt)}
            >
              {opt}
            </button>
          ))}
        </div>
      )}

      {item.type === "triad" && (
        <div className="ef-opts" role="group" aria-label={item.prompt}>
          {(item.options ?? []).map((opt) => {
            const arr = Array.isArray(value) ? value : [];
            const on = arr.includes(opt);
            return (
              <button
                key={opt}
                type="button"
                className="ef-opt"
                data-on={on}
                aria-pressed={on}
                onClick={() => set(on ? arr.filter((x) => x !== opt) : [...arr, opt])}
              >
                {opt}
              </button>
            );
          })}
        </div>
      )}

      {item.type === "text" && (
        <textarea
          className="ef-text"
          value={typeof value === "string" ? value : ""}
          onChange={(e) => set(e.target.value)}
          placeholder="optional"
          rows={3}
          maxLength={2000}
        />
      )}
    </div>
  );
}
