"use client";

import { useState, useMemo } from "react";
import type { RuleSandboxConfig, Participant } from "@/lib/types";

interface Props {
  config: RuleSandboxConfig;
  role: "facilitator" | "participant";
  onSubmit?: (response: unknown) => void;
  responses?: Record<string, unknown>;
  participants?: Record<string, Participant>;
  submitted?: boolean;
}

interface SandboxResponse {
  parameters: Record<string, number>;
  output: number;
  reflection: string;
}

/**
 * Safe arithmetic expression evaluator.
 * Supports: +, -, *, /, %, parentheses, and named variables.
 * Does NOT use eval or new Function.
 */
function evaluateFormula(
  formula: string,
  variables: Record<string, number>,
): number {
  let pos = 0;
  const expr = formula.replace(/\s+/g, "");

  function parseExpr(): number {
    let result = parseTerm();
    while (pos < expr.length && (expr[pos] === "+" || expr[pos] === "-")) {
      const op = expr[pos++];
      const term = parseTerm();
      result = op === "+" ? result + term : result - term;
    }
    return result;
  }

  function parseTerm(): number {
    let result = parseFactor();
    while (
      pos < expr.length &&
      (expr[pos] === "*" || expr[pos] === "/" || expr[pos] === "%")
    ) {
      const op = expr[pos++];
      const factor = parseFactor();
      if (op === "*") result *= factor;
      else if (op === "/") result = factor !== 0 ? result / factor : NaN;
      else result = factor !== 0 ? result % factor : NaN;
    }
    return result;
  }

  function parseFactor(): number {
    // unary minus
    if (expr[pos] === "-") {
      pos++;
      return -parseFactor();
    }
    // parentheses
    if (expr[pos] === "(") {
      pos++;
      const result = parseExpr();
      pos++; // skip ')'
      return result;
    }
    // number literal
    if (/[0-9.]/.test(expr[pos])) {
      let numStr = "";
      while (pos < expr.length && /[0-9.]/.test(expr[pos])) {
        numStr += expr[pos++];
      }
      return parseFloat(numStr);
    }
    // variable name
    let name = "";
    while (pos < expr.length && /[a-zA-Z_0-9]/.test(expr[pos])) {
      name += expr[pos++];
    }
    if (name in variables) return variables[name];
    return NaN;
  }

  try {
    const result = parseExpr();
    return isFinite(result) ? Math.round(result * 100) / 100 : NaN;
  } catch {
    return NaN;
  }
}

export function RuleSandboxActivity({
  config,
  role,
  onSubmit,
  responses,
  participants,
  submitted,
}: Props) {
  const defaults = useMemo(() => {
    const d: Record<string, number> = {};
    for (const p of config.parameters) {
      d[p.id] = p.defaultValue;
    }
    return d;
  }, [config.parameters]);

  const [values, setValues] = useState<Record<string, number>>(defaults);
  const [reflection, setReflection] = useState("");

  const output = useMemo(
    () => evaluateFormula(config.formula, values),
    [config.formula, values],
  );

  const handleChange = (id: string, value: number) => {
    setValues((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = () => {
    if (!reflection.trim()) return;
    const response: SandboxResponse = {
      parameters: { ...values },
      output,
      reflection: reflection.trim(),
    };
    onSubmit?.(response);
  };

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">{config.prompt}</h3>

      {role === "participant" && !submitted ? (
        <div className="space-y-5">
          {/* parameter sliders */}
          <div className="space-y-4">
            {config.parameters.map((param) => (
              <div key={param.id}>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-medium">{param.label}</label>
                  <span className="text-sm font-mono font-bold text-[var(--rh-teal)]">
                    {values[param.id]}
                    {param.unit && (
                      <span className="text-xs text-[var(--rh-text-muted)] ml-0.5">
                        {param.unit}
                      </span>
                    )}
                  </span>
                </div>
                <input
                  type="range"
                  min={param.min}
                  max={param.max}
                  step={param.step}
                  value={values[param.id]}
                  onChange={(e) =>
                    handleChange(param.id, Number(e.target.value))
                  }
                  className="w-full accent-[var(--rh-cyan)]"
                />
                <div className="flex justify-between text-[10px] text-[var(--rh-text-muted)]">
                  <span>
                    {param.min}
                    {param.unit}
                  </span>
                  <span>
                    {param.max}
                    {param.unit}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* output display */}
          <div className="p-4 rounded-xl bg-[var(--rh-deep)] text-white text-center">
            <p className="text-xs uppercase tracking-wider opacity-70 mb-1">
              {config.outputLabel}
            </p>
            <p className="text-3xl font-mono font-bold">
              {isNaN(output) ? "—" : output.toLocaleString()}
              {config.outputUnit && (
                <span className="text-base opacity-70 ml-1">
                  {config.outputUnit}
                </span>
              )}
            </p>
          </div>

          {/* reflection */}
          <div>
            <p className="text-sm font-medium mb-2">
              {config.reflectionPrompt}
            </p>
            <textarea
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              placeholder="write your observation..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-black/10 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[var(--rh-cyan)]/30"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={!reflection.trim()}
            className="w-full py-3 rounded-xl bg-[var(--rh-cyan)] text-white font-semibold hover:bg-[var(--rh-teal)] transition-colors disabled:opacity-30"
          >
            submit observation
          </button>
        </div>
      ) : role === "participant" && submitted ? (
        <div className="text-center py-6 text-[var(--rh-text-muted)]">
          <p className="text-2xl mb-2">🔬</p>
          <p className="text-sm">observation submitted — waiting for reveal</p>
        </div>
      ) : (
        /* facilitator view */
        <div className="space-y-4">
          {responses ? (
            <div className="space-y-3">
              {Object.entries(responses).map(([pid, response]) => {
                const sub = response as SandboxResponse;
                const name =
                  participants?.[pid]?.displayName || pid.slice(0, 6);
                return (
                  <div
                    key={pid}
                    className="p-3 rounded-xl bg-white border border-black/5"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-[var(--rh-text-muted)]">
                        {name}
                      </span>
                      <span className="text-xs font-mono font-bold text-[var(--rh-teal)]">
                        {config.outputLabel}: {sub.output?.toLocaleString()}
                        {config.outputUnit}
                      </span>
                    </div>
                    {/* parameter values */}
                    <div className="flex flex-wrap gap-2 mb-2">
                      {config.parameters.map((param) => (
                        <span
                          key={param.id}
                          className="text-[10px] bg-[var(--rh-sand-light)] px-1.5 py-0.5 rounded"
                        >
                          {param.label}: {sub.parameters?.[param.id]}
                          {param.unit}
                        </span>
                      ))}
                    </div>
                    <p className="text-sm italic text-[var(--rh-text)]">
                      &ldquo;{sub.reflection}&rdquo;
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-[var(--rh-text-muted)]">
              observations are hidden — click &quot;reveal results&quot; to show
            </p>
          )}
        </div>
      )}
    </div>
  );
}
