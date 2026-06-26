/**
 * creaseworks-eval — coherence dashboard.
 *
 * Server component: reads every evaluation + the AI one-reads from D1 and
 * renders the collection-level view —
 *   • the cascade heatmap (5 playdates × the lenses)
 *   • where the room splits (convergence/divergence per item)
 *   • the per-playdate roll-up (gate, layer-3 door, justice, verdict)
 *   • the one read per playdate, with whether the room agreed
 *
 * force-dynamic: never statically prerender — it must read D1 per request.
 */

import Link from "next/link";
import { evalHref } from "@/lib/eval-nav";
import { getEvalEnv } from "@/lib/eval-server";
import { EVAL_PLAYDATES, ITEMS, type EvalItem } from "@/lib/eval-rubric";
import {
  type RawAnswers,
  SCORED_LAYERS,
  layerScore,
  normalizeItem,
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

/** a display label for a raw answer value. */
function valLabel(v: unknown): string {
  if (Array.isArray(v)) return v.length ? v.join(" + ") : "none";
  if (typeof v === "number") return String(v);
  return typeof v === "string" ? v : "—";
}

/** split = 1 − modalShare across a set of answers to one item (0 = unanimous). */
function splitOf(item: EvalItem, values: unknown[]): { n: number; split: number; dist: [string, number][] } {
  // bucket health items to {0,.5,1} labels, categorical by raw label
  const labels = values.map((v) => {
    const norm = normalizeItem(item, v);
    if (norm !== null) return norm === 1 ? "high" : norm === 0 ? "low" : "mid";
    return valLabel(v);
  });
  const counts = new Map<string, number>();
  for (const l of labels) counts.set(l, (counts.get(l) ?? 0) + 1);
  const n = labels.length;
  const modalN = Math.max(...counts.values());
  const dist = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  return { n, split: n ? 1 - modalN / n : 0, dist };
}

function cell(score: number | null) {
  if (score === null) return { bg: "rgba(39,50,72,0.06)", fg: "#9ca3af", txt: "—" };
  const pct = Math.round(score * 100);
  if (score < 0.34) return { bg: "color-mix(in srgb, var(--wv-redwood) 22%, var(--wv-white))", fg: "var(--wv-redwood)", txt: `${pct}` };
  if (score < 0.67) return { bg: "color-mix(in srgb, var(--wv-sienna) 26%, var(--wv-white))", fg: "#9a5a2c", txt: `${pct}` };
  return { bg: "color-mix(in srgb, var(--wv-seafoam) 34%, var(--wv-white))", fg: "#1f7a5c", txt: `${pct}` };
}

const FRAME_ITEMS = ITEMS.filter((it) => it.registers.includes("frame") && it.type !== "text");

export default async function EvalDashboard() {
  const env = getEvalEnv();

  let rows: Row[] = [];
  let oneReads: { playdate_slug: string; text: string }[] = [];
  let votes: { playdate_slug: string; agree: number }[] = [];
  if (env) {
    rows = (await env.db
      .prepare("SELECT playdate_slug, evaluator_name, register, answers_json, created_at FROM evaluations ORDER BY created_at DESC")
      .all<Row>()).results ?? [];
    oneReads = (await env.db
      .prepare("SELECT playdate_slug, text FROM one_reads")
      .all<{ playdate_slug: string; text: string }>()).results ?? [];
    votes = (await env.db
      .prepare("SELECT playdate_slug, agree FROM one_read_votes")
      .all<{ playdate_slug: string; agree: number }>()).results ?? [];
  }

  const byPlaydate = new Map<string, { answers: RawAnswers; register: string }[]>();
  for (const r of rows) {
    const list = byPlaydate.get(r.playdate_slug) ?? [];
    list.push({ answers: parse(r.answers_json), register: r.register });
    byPlaydate.set(r.playdate_slug, list);
  }

  const readBySlug = new Map(oneReads.map((r) => [r.playdate_slug, r.text]));
  const voteBySlug = new Map<string, { up: number; total: number }>();
  for (const v of votes) {
    const e = voteBySlug.get(v.playdate_slug) ?? { up: 0, total: 0 };
    e.up += v.agree ? 1 : 0;
    e.total += 1;
    voteBySlug.set(v.playdate_slug, e);
  }

  // divergence: per (playdate, frame item), where ≥2 reviews disagree most
  const splits: { slug: string; title: string; item: EvalItem; n: number; split: number; dist: [string, number][] }[] = [];
  for (const p of EVAL_PLAYDATES) {
    const frame = (byPlaydate.get(p.slug) ?? []).filter((s) => s.register === "frame");
    for (const item of FRAME_ITEMS) {
      const vals = frame.map((s) => s.answers[item.id]).filter((v) => v !== undefined);
      if (vals.length < 2) continue;
      const { n, split, dist } = splitOf(item, vals);
      if (split > 0) splits.push({ slug: p.slug, title: p.title, item, n, split, dist });
    }
  }
  splits.sort((a, b) => b.split - a.split || b.n - a.n);
  const topSplits = splits.slice(0, 8);

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
        table.ed-grid { border-collapse: collapse; width: 100%; min-width: 560px; }
        .ed-grid th, .ed-grid td { padding: 8px 8px; text-align: center; font-size: 12.5px; }
        .ed-grid th { font-weight: 800; color: var(--wv-cadet); border-bottom: 2px solid rgba(39,50,72,0.10); }
        .ed-grid th.play, .ed-grid td.play { text-align: left; font-weight: 700; color: var(--wv-cadet); white-space: nowrap; }
        .ed-grid td.heat { font-weight: 800; border-radius: 8px; }
        .ed-n { font-size: 11px; color: #9ca3af; font-weight: 600; }
        .ed-legend { display: flex; gap: 14px; margin-top: 12px; font-size: 12px; color: #6b7280; flex-wrap: wrap; }
        .ed-legend i { display: inline-block; width: 12px; height: 12px; border-radius: 3px; vertical-align: -1px; margin-right: 4px; }
        .ed-roll th, .ed-roll td { padding: 8px 10px; font-size: 13px; text-align: left; border-bottom: 1px solid rgba(39,50,72,0.07); }
        .ed-roll th { font-weight: 800; color: var(--wv-cadet); }
        .ed-pill { display: inline-block; font-weight: 800; font-size: 11px; border-radius: 8px; padding: 2px 8px; }
        .ed-split { padding: 10px 0; border-bottom: 1px solid rgba(39,50,72,0.07); }
        .ed-split:last-child { border-bottom: none; }
        .ed-split-top { display: flex; justify-content: space-between; gap: 10px; align-items: baseline; }
        .ed-split-q { font-size: 13.5px; font-weight: 700; color: var(--wv-cadet); }
        .ed-split-where { font-size: 12px; color: #6b7280; }
        .ed-split-bar { font-size: 12px; color: #4b5563; margin-top: 4px; }
        .ed-split-dist { display: inline-block; background: var(--soft, color-mix(in srgb, var(--wv-periwinkle) 18%, var(--wv-white)));
          border: 1px solid rgba(39,50,72,0.1); border-radius: 999px; padding: 1px 9px; margin: 2px 4px 0 0; font-size: 11.5px; color: #4b5563; }
        .ed-read { padding: 12px 0; border-bottom: 1px solid rgba(39,50,72,0.07); }
        .ed-read:last-child { border-bottom: none; }
        .ed-read-title { font-weight: 800; font-size: 13.5px; color: var(--wv-cadet); margin-bottom: 4px; }
        .ed-read-title .agree { font-weight: 700; font-size: 11.5px; color: #6b7280; margin-left: 8px; }
        .ed-read-text { font-size: 13px; line-height: 1.6; color: #4b5563; margin: 0; white-space: pre-wrap; }
        .ed-empty { background: var(--wv-white); border-radius: 16px; padding: 28px; text-align: center; color: #6b7280; border: 1px dashed rgba(39,50,72,0.2); }
        .ed-back { font-size: 13px; font-weight: 800; color: var(--wv-teal); text-decoration: none; }
      `}</style>

      <h1 className="ed-h1">coherence dashboard</h1>
      <p className="ed-sub">
        every playdate, climbed through the lenses. the heatmap shows where the suite is strong and where it&rsquo;s thin;
        the split section shows where the room disagrees — the rows worth talking about.
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
            <h2>the lens heatmap</h2>
            <p className="note">average lens health (0–100) across all submissions. felt play = everyone who played; lenses 1–4 = the collective&rsquo;s frame reviews.</p>
            <table className="ed-grid">
              <thead>
                <tr>
                  <th className="play">playdate</th>
                  {SCORED_LAYERS.map((c) => <th key={c.key}>{c.label}</th>)}
                  <th>n</th>
                </tr>
              </thead>
              <tbody>
                {EVAL_PLAYDATES.map((p) => {
                  const subs = byPlaydate.get(p.slug) ?? [];
                  return (
                    <tr key={p.slug}>
                      <td className="play">{p.title}</td>
                      {SCORED_LAYERS.map((c) => {
                        const score = mean(subs.map((s) => layerScore(c.key, s.answers)));
                        const cl = cell(score);
                        return (
                          <td key={c.key} className="heat" style={{ background: cl.bg, color: cl.fg }}>{cl.txt}</td>
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
            <h2>where the room splits</h2>
            <p className="note">items where frame reviewers most disagree (≥2 reviews). these are the rows to talk through — convergence is quiet, divergence is the signal.</p>
            {topSplits.length === 0 ? (
              <p className="ed-read-text">no divergence yet — needs at least two frame reviews of the same playdate.</p>
            ) : (
              topSplits.map((s, i) => (
                <div key={i} className="ed-split">
                  <div className="ed-split-top">
                    <span className="ed-split-q">{s.item.prompt}</span>
                    <span className="ed-split-where">{Math.round(s.split * 100)}% split · {s.n} reviews</span>
                  </div>
                  <div className="ed-split-bar">
                    <span className="ed-split-where">{s.title}: </span>
                    {s.dist.map(([label, count], j) => (
                      <span key={j} className="ed-split-dist">{count}× {label}</span>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="ed-card">
            <h2>per-playdate roll-up</h2>
            <p className="note">the collection-matrix signals: the no-default-player gate, the layer-3 door, justice, the team&rsquo;s verdict.</p>
            <table className="ed-roll">
              <thead>
                <tr><th>playdate</th><th>gate</th><th>layer-3 door</th><th>justice</th><th>coherence</th><th>verdict</th></tr>
              </thead>
              <tbody>
                {EVAL_PLAYDATES.map((p) => {
                  const frame = (byPlaydate.get(p.slug) ?? []).filter((s) => s.register === "frame");
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
                      <td>{verdict ? <span className="ed-pill" style={{ background: vColor[verdict] ?? "rgba(39,50,72,0.08)", color: "var(--wv-cadet)" }}>{verdict}</span> : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {readBySlug.size > 0 && (
            <div className="ed-card">
              <h2>the one read</h2>
              <p className="note">one voice, not the answer. the agree rate is how often the room found it matched — a low rate means the page lost to the room.</p>
              {EVAL_PLAYDATES.filter((p) => readBySlug.has(p.slug)).map((p) => {
                const v = voteBySlug.get(p.slug);
                const agree = v && v.total ? `${Math.round((v.up / v.total) * 100)}% agreed (${v.total})` : "no votes yet";
                return (
                  <div key={p.slug} className="ed-read">
                    <div className="ed-read-title">{p.title}<span className="agree">{agree}</span></div>
                    <p className="ed-read-text">{readBySlug.get(p.slug)}</p>
                  </div>
                );
              })}
            </div>
          )}

          <div className="ed-card">
            <h2>recent evaluations</h2>
            <table className="ed-roll">
              <thead><tr><th>when</th><th>who</th><th>register</th><th>playdate</th></tr></thead>
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
