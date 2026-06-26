/**
 * creaseworks eval — coherence dashboard.
 *
 * Server component: reads every submitted evaluation from D1 and renders
 * the collection-level view jamie's brief asks for — a heatmap of the 5
 * playdates × the cascade layers, so collection-wide thinness (e.g.
 * "layer 3 light across the board") is visible at a glance, plus a
 * per-playdate roll-up and the recent submissions.
 *
 * force-dynamic: never statically prerender — it must read D1 per request.
 */

import Link from "next/link";
import { evalHref } from "@/lib/eval-nav";
import { getEvalEnv } from "@/lib/eval-server";
import { EVAL_PLAYDATES } from "@/lib/eval-rubric";
import {
  type RawAnswers,
  feltScore,
  briefScore,
  frameworkScore,
  foundationScore,
  gatePass,
  layer3Door,
  justicePresent,
  verdictCall,
  coherenceRaw,
} from "@/lib/eval-score";

export const dynamic = "force-dynamic";

interface Row {
  playdate_slug: string;
  evaluator_name: string | null;
  register: string;
  answers_json: string;
  created_at: string;
}

function parse(json: string): RawAnswers {
  try {
    const o = JSON.parse(json);
    return o && typeof o === "object" ? (o as RawAnswers) : {};
  } catch {
    return {};
  }
}

function mean(vals: (number | null)[]): number | null {
  const p = vals.filter((v): v is number => v !== null);
  return p.length ? p.reduce((a, b) => a + b, 0) / p.length : null;
}

function modal(vals: (string | null)[]): string | null {
  const counts = new Map<string, number>();
  for (const v of vals) if (v) counts.set(v, (counts.get(v) ?? 0) + 1);
  let best: string | null = null;
  let bestN = 0;
  for (const [k, n] of counts) if (n > bestN) { best = k; bestN = n; }
  return best;
}

const LAYER_COLS = [
  { key: "felt", label: "felt play" },
  { key: "brief", label: "brief" },
  { key: "framework", label: "framework" },
  { key: "foundation", label: "foundation" },
] as const;

function cell(score: number | null) {
  if (score === null) return { bg: "rgba(39,50,72,0.06)", fg: "#9ca3af", txt: "—" };
  const pct = Math.round(score * 100);
  if (score < 0.34) return { bg: "color-mix(in srgb, var(--wv-redwood) 22%, var(--wv-white))", fg: "var(--wv-redwood)", txt: `${pct}` };
  if (score < 0.67) return { bg: "color-mix(in srgb, var(--wv-sienna) 26%, var(--wv-white))", fg: "#9a5a2c", txt: `${pct}` };
  return { bg: "color-mix(in srgb, var(--wv-seafoam) 34%, var(--wv-white))", fg: "#1f7a5c", txt: `${pct}` };
}

export default async function EvalDashboard() {
  const env = getEvalEnv();

  let rows: Row[] = [];
  if (env) {
    const res = await env.db
      .prepare(
        "SELECT playdate_slug, evaluator_name, register, answers_json, created_at FROM evaluations ORDER BY created_at DESC",
      )
      .all<Row>();
    rows = res.results ?? [];
  }

  // group by playdate
  const byPlaydate = new Map<string, { answers: RawAnswers; register: string; row: Row }[]>();
  for (const r of rows) {
    const list = byPlaydate.get(r.playdate_slug) ?? [];
    list.push({ answers: parse(r.answers_json), register: r.register, row: r });
    byPlaydate.set(r.playdate_slug, list);
  }

  const totalFelt = rows.filter((r) => r.register === "felt").length;
  const totalFrame = rows.filter((r) => r.register === "frame").length;

  return (
    <div>
      <style>{`
        .ed-h1 { font-family: var(--font-fraunces), serif; font-weight: 600; font-size: 24px; color: var(--wv-cadet); margin: 0 0 4px; }
        .ed-sub { font-size: 14px; color: #4b5563; margin: 0 0 18px; line-height: 1.6; }
        .ed-stats { display: flex; gap: 12px; margin-bottom: 22px; flex-wrap: wrap; }
        .ed-stat { background: var(--wv-white); border-radius: 14px; padding: 12px 16px; border: 1px solid rgba(39,50,72,0.08); }
        .ed-stat b { display: block; font-size: 22px; font-weight: 800; color: var(--wv-cadet); }
        .ed-stat span { font-size: 12px; color: #6b7280; }
        .ed-card { background: var(--wv-white); border: 1.5px solid rgba(39,50,72,0.10); border-radius: 18px 22px 16px 20px;
          padding: 18px; margin-bottom: 18px; box-shadow: 0 3px 0 rgba(39,50,72,0.06); overflow-x: auto; }
        .ed-card h2 { font-family: var(--font-fraunces), serif; font-weight: 600; font-size: 18px; color: var(--wv-cadet); margin: 0 0 4px; }
        .ed-card p.note { font-size: 12.5px; color: #6b7280; margin: 0 0 14px; line-height: 1.5; }
        table.ed-grid { border-collapse: collapse; width: 100%; min-width: 520px; }
        .ed-grid th, .ed-grid td { padding: 8px 10px; text-align: center; font-size: 13px; }
        .ed-grid th { font-weight: 800; color: var(--wv-cadet); border-bottom: 2px solid rgba(39,50,72,0.10); }
        .ed-grid th.play, .ed-grid td.play { text-align: left; font-weight: 700; color: var(--wv-cadet); white-space: nowrap; }
        .ed-grid td.heat { font-weight: 800; border-radius: 8px; }
        .ed-n { font-size: 11px; color: #9ca3af; font-weight: 600; }
        .ed-legend { display: flex; gap: 14px; margin-top: 12px; font-size: 12px; color: #6b7280; flex-wrap: wrap; }
        .ed-legend i { display: inline-block; width: 12px; height: 12px; border-radius: 3px; vertical-align: -1px; margin-right: 4px; }
        .ed-roll th, .ed-roll td { padding: 8px 10px; font-size: 13px; text-align: left; border-bottom: 1px solid rgba(39,50,72,0.07); }
        .ed-roll th { font-weight: 800; color: var(--wv-cadet); }
        .ed-pill { display: inline-block; font-weight: 800; font-size: 11px; border-radius: 8px; padding: 2px 8px; }
        .ed-empty { background: var(--wv-white); border-radius: 16px; padding: 28px; text-align: center; color: #6b7280; border: 1px dashed rgba(39,50,72,0.2); }
        .ed-back { font-size: 13px; font-weight: 800; color: var(--wv-teal); text-decoration: none; }
      `}</style>

      <h1 className="ed-h1">coherence dashboard</h1>
      <p className="ed-sub">
        every playdate, climbed. the heatmap shows where the suite is strong and where it&rsquo;s thin —
        a column of low scores is a collection-wide gap, not a one-game problem.
      </p>

      <div className="ed-stats">
        <div className="ed-stat"><b>{rows.length}</b><span>evaluations</span></div>
        <div className="ed-stat"><b>{totalFelt}</b><span>🌿 felt</span></div>
        <div className="ed-stat"><b>{totalFrame}</b><span>🧭 frame</span></div>
        <div className="ed-stat"><b>{byPlaydate.size}/5</b><span>playdates touched</span></div>
      </div>

      {rows.length === 0 ? (
        <div className="ed-empty">
          no evaluations yet. <Link href={evalHref("")} className="ed-back">start the first one →</Link>
        </div>
      ) : (
        <>
          <div className="ed-card">
            <h2>the cascade heatmap</h2>
            <p className="note">average layer health (0–100) across all submissions. felt = everyone who played; brief / framework / foundation = the collective&rsquo;s frame reviews.</p>
            <table className="ed-grid">
              <thead>
                <tr>
                  <th className="play">playdate</th>
                  {LAYER_COLS.map((c) => <th key={c.key}>{c.label}</th>)}
                  <th>n</th>
                </tr>
              </thead>
              <tbody>
                {EVAL_PLAYDATES.map((p) => {
                  const subs = byPlaydate.get(p.slug) ?? [];
                  const scores = {
                    felt: mean(subs.map((s) => feltScore(s.answers))),
                    brief: mean(subs.map((s) => briefScore(s.answers))),
                    framework: mean(subs.map((s) => frameworkScore(s.answers))),
                    foundation: mean(subs.map((s) => foundationScore(s.answers))),
                  };
                  return (
                    <tr key={p.slug}>
                      <td className="play">{p.title}</td>
                      {LAYER_COLS.map((c) => {
                        const cl = cell(scores[c.key]);
                        return (
                          <td key={c.key} className="heat" style={{ background: cl.bg, color: cl.fg }}>
                            {cl.txt}
                          </td>
                        );
                      })}
                      <td className="ed-n">{subs.length}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="ed-legend">
              <span><i style={{ background: "color-mix(in srgb, var(--wv-seafoam) 34%, var(--wv-white))" }} />strong (67–100)</span>
              <span><i style={{ background: "color-mix(in srgb, var(--wv-sienna) 26%, var(--wv-white))" }} />partial (34–66)</span>
              <span><i style={{ background: "color-mix(in srgb, var(--wv-redwood) 22%, var(--wv-white))" }} />weak (0–33)</span>
              <span><i style={{ background: "rgba(39,50,72,0.06)" }} />no data</span>
            </div>
          </div>

          <div className="ed-card">
            <h2>per-playdate roll-up</h2>
            <p className="note">the collection-matrix signals: the hard gate, the layer-3 door, justice, the team&rsquo;s verdict.</p>
            <table className="ed-roll">
              <thead>
                <tr>
                  <th>playdate</th>
                  <th>gate</th>
                  <th>layer-3 door</th>
                  <th>justice</th>
                  <th>coherence</th>
                  <th>verdict</th>
                </tr>
              </thead>
              <tbody>
                {EVAL_PLAYDATES.map((p) => {
                  const subs = byPlaydate.get(p.slug) ?? [];
                  const frame = subs.filter((s) => s.register === "frame");
                  const gateVals = frame.map((s) => gatePass(s.answers)).filter((v): v is boolean => v !== null);
                  const gateRate = gateVals.length ? Math.round((gateVals.filter(Boolean).length / gateVals.length) * 100) : null;
                  const door = modal(frame.map((s) => layer3Door(s.answers)));
                  const justVals = frame.map((s) => justicePresent(s.answers)).filter((v): v is boolean => v !== null);
                  const justRate = justVals.length ? justVals.filter(Boolean).length / justVals.length : null;
                  const coh = mean(frame.map((s) => coherenceRaw(s.answers)));
                  const verdict = modal(frame.map((s) => verdictCall(s.answers)));
                  const vColor: Record<string, string> = {
                    keep: "color-mix(in srgb, var(--wv-seafoam) 36%, var(--wv-white))",
                    strengthen: "color-mix(in srgb, var(--wv-mint) 55%, var(--wv-white))",
                    redesign: "color-mix(in srgb, var(--wv-sienna) 28%, var(--wv-white))",
                    remove: "color-mix(in srgb, var(--wv-redwood) 24%, var(--wv-white))",
                  };
                  return (
                    <tr key={p.slug}>
                      <td style={{ fontWeight: 700 }}>{p.title}</td>
                      <td>{gateRate === null ? "—" : `${gateRate}% pass`}</td>
                      <td>{door ?? "—"}</td>
                      <td>{justRate === null ? "—" : `${Math.round(justRate * 100)}%`}</td>
                      <td>{coh === null ? "—" : `${coh.toFixed(1)}/5`}</td>
                      <td>
                        {verdict ? (
                          <span className="ed-pill" style={{ background: vColor[verdict] ?? "rgba(39,50,72,0.08)", color: "var(--wv-cadet)" }}>
                            {verdict}
                          </span>
                        ) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="ed-card">
            <h2>recent evaluations</h2>
            <table className="ed-roll">
              <thead>
                <tr><th>when</th><th>who</th><th>register</th><th>playdate</th></tr>
              </thead>
              <tbody>
                {rows.slice(0, 20).map((r, i) => {
                  const title = EVAL_PLAYDATES.find((p) => p.slug === r.playdate_slug)?.title ?? r.playdate_slug;
                  return (
                    <tr key={i}>
                      <td style={{ color: "#6b7280", fontSize: 12 }}>{r.created_at}</td>
                      <td>{r.evaluator_name ?? "—"}</td>
                      <td>{r.register === "frame" ? "🧭 frame" : "🌿 felt"}</td>
                      <td>{title}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      <Link href={evalHref("")} className="ed-back">← back to the audit home</Link>
    </div>
  );
}
