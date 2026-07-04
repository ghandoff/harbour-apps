"use client";

/**
 * MaterialsReview — collective moderation of kid-submitted materials (B3 + P1.5).
 *
 * Lists `pending` submissions from /api/eval/materials; the collective accepts
 * (assigning a form category + optional dials — loud/quiet + affordances — which
 * drive the character cast, matching, and the fold job wheel) or declines. A
 * "✨ suggest dials" button drafts all three via the AI pre-screen; a human
 * confirms or edits before accept. Attribution = the reviewer's name from the
 * eval home preset login (sessionStorage cw-eval-name), same as evaluations.
 *
 * Reuses the dashboard's .ed-card / .note / .ed-read-text styles (global within
 * the page); a small scoped block styles the review controls.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { evalHref } from "@/lib/eval-nav";
import {
  fetchMaterials,
  reviewMaterial,
  classifyMaterial,
  MATERIAL_FORMS,
  MATERIAL_VERBS,
  type SubmittedMaterial,
} from "@/lib/cw-materials";

const NAME_KEY = "cw-eval-name";
type LoudQuiet = "loud" | "quiet" | null;

export function MaterialsReview() {
  const [items, setItems] = useState<SubmittedMaterial[] | null>(null);
  const [reviewer, setReviewer] = useState<string | null>(null);
  const [forms, setForms] = useState<Record<string, string>>({});
  const [loudQuiet, setLoudQuiet] = useState<Record<string, LoudQuiet>>({});
  const [affords, setAffords] = useState<Record<string, string[]>>({});
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [suggesting, setSuggesting] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    try {
      setReviewer(sessionStorage.getItem(NAME_KEY));
    } catch {}
    void fetchMaterials("pending").then((rows) => {
      setItems(rows);
      // pre-fill from any cached AI draft (ai_dials) so re-opening shows it
      const f: Record<string, string> = {};
      const lq: Record<string, LoudQuiet> = {};
      const af: Record<string, string[]> = {};
      const rs: Record<string, string> = {};
      for (const m of rows) {
        if (!m.ai_dials) continue;
        try {
          const d = JSON.parse(m.ai_dials) as { form_primary?: string; loud_quiet?: string; affords?: string[]; reason?: string };
          if (d.form_primary && (MATERIAL_FORMS as readonly string[]).includes(d.form_primary)) f[m.id] = d.form_primary;
          if (d.loud_quiet === "loud" || d.loud_quiet === "quiet") lq[m.id] = d.loud_quiet;
          if (Array.isArray(d.affords)) af[m.id] = d.affords.filter((v) => (MATERIAL_VERBS as readonly string[]).includes(v));
          if (typeof d.reason === "string") rs[m.id] = d.reason;
        } catch {}
      }
      setForms(f);
      setLoudQuiet(lq);
      setAffords(af);
      setReasons(rs);
    });
  }, []);

  async function suggest(m: SubmittedMaterial) {
    if (suggesting || busy) return;
    setSuggesting(m.id);
    setErr(null);
    const d = await classifyMaterial(m.id, reviewer);
    setSuggesting(null);
    if (!d) {
      setErr("no draft available — the AI pre-screen isn't configured, or try again.");
      return;
    }
    setForms((s) => ({ ...s, [m.id]: d.form_primary ?? s[m.id] ?? MATERIAL_FORMS[0] }));
    setLoudQuiet((s) => ({ ...s, [m.id]: d.loud_quiet }));
    setAffords((s) => ({ ...s, [m.id]: d.affords }));
    if (d.reason) setReasons((s) => ({ ...s, [m.id]: d.reason as string }));
  }

  function toggleAfford(id: string, verb: string) {
    setAffords((s) => {
      const cur = s[id] ?? [];
      return { ...s, [id]: cur.includes(verb) ? cur.filter((v) => v !== verb) : [...cur, verb] };
    });
  }

  async function act(m: SubmittedMaterial, action: "accept" | "decline") {
    if (busy) return;
    const formPrimary = forms[m.id] ?? MATERIAL_FORMS[0];
    setBusy(m.id);
    setErr(null);
    const ok = await reviewMaterial({
      id: m.id,
      action,
      formPrimary,
      loudQuiet: action === "accept" ? loudQuiet[m.id] ?? null : null,
      affords: action === "accept" ? affords[m.id] ?? [] : [],
      reviewer,
    });
    setBusy(null);
    if (ok) setItems((prev) => (prev ?? []).filter((x) => x.id !== m.id));
    else setErr("couldn't save — only the collective can review (tap your name on the eval home).");
  }

  // hold render until the first fetch resolves (avoids a flash of empty)
  if (items === null) return null;

  return (
    <div className="ed-card">
      <style>{`
        .mr-row { padding: 12px 0; border-bottom: 1px solid rgba(39,50,72,0.08); }
        .mr-row:last-child { border-bottom: none; }
        .mr-title { font-weight: 800; font-size: 15px; color: var(--wv-cadet); }
        .mr-meta { font-size: 12px; color: #6b7280; margin-top: 2px; }
        .mr-desc { font-size: 13px; color: #4b5563; margin: 4px 0 8px; }
        .mr-actions { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
        .mr-select { font-size: 13px; padding: 6px 8px; border-radius: 8px; border: 1px solid rgba(39,50,72,0.2); background: var(--wv-white); color: var(--wv-cadet); }
        button.mr-btn:not([type="submit"]):not(.wv-header-signout) {
          font-weight: 800; font-size: 13px; border: none; border-radius: 10px; padding: 7px 14px; cursor: pointer; color: var(--wv-white);
        }
        button.mr-accept:not([type="submit"]):not(.wv-header-signout) { background: #1f7a5c; }
        button.mr-decline:not([type="submit"]):not(.wv-header-signout) { background: var(--wv-cadet); }
        button.mr-btn:not([type="submit"]):not(.wv-header-signout):disabled { opacity: 0.4; cursor: default; }
        /* P1.5 dials controls */
        .mr-dials { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin: 8px 0; }
        button.mr-suggest:not([type="submit"]):not(.wv-header-signout) {
          font-weight: 800; font-size: 12px; border: 1.5px solid var(--wv-teal); border-radius: 10px; padding: 6px 11px;
          cursor: pointer; color: var(--wv-cadet); background: color-mix(in srgb, var(--wv-teal) 12%, var(--wv-white));
        }
        button.mr-suggest:not([type="submit"]):not(.wv-header-signout):disabled { opacity: 0.4; cursor: default; }
        button.mr-lq:not([type="submit"]):not(.wv-header-signout) {
          font-weight: 800; font-size: 12px; border: 1.5px solid rgba(39,50,72,0.18); border-radius: 10px; padding: 6px 10px;
          cursor: pointer; color: var(--wv-cadet); background: var(--wv-white);
        }
        button.mr-lq[data-on="true"]:not([type="submit"]):not(.wv-header-signout) { border-color: var(--wv-cornflower); background: color-mix(in srgb, var(--wv-cornflower) 20%, var(--wv-white)); }
        .mr-verbs { display: flex; flex-wrap: wrap; gap: 5px; margin: 4px 0 0; }
        button.mr-verb:not([type="submit"]):not(.wv-header-signout) {
          font-weight: 700; font-size: 11.5px; border: 1.5px solid rgba(39,50,72,0.16); border-radius: 9px; padding: 4px 9px;
          cursor: pointer; color: var(--wv-cadet); background: var(--wv-white);
        }
        button.mr-verb[data-on="true"]:not([type="submit"]):not(.wv-header-signout) { border-color: var(--wv-teal); background: color-mix(in srgb, var(--wv-teal) 22%, var(--wv-white)); }
        button.mr-suggest:focus-visible, button.mr-lq:focus-visible, button.mr-verb:focus-visible { outline: 3px solid var(--color-focus); outline-offset: 2px; }
        .mr-reason { font-size: 12px; color: #6b7280; font-style: italic; margin: 6px 0 0; }
        .mr-dials-label { font-size: 12px; font-weight: 800; color: var(--wv-cadet); }
      `}</style>
      <h2>new materials to review 🧱</h2>
      <p className="note">
        materials kids found that aren’t on the list yet. accept (pick what kind it is — and optionally its dials) to move it toward the collective list, or decline. accepted ones go to payton for icons, then the family picks the one that goes live.
      </p>

      {!reviewer && (
        <p className="ed-read-text">
          tap your name on the{" "}
          <Link href={evalHref("")} className="ed-back">eval home</Link>{" "}
          first, so your review is attributed.
        </p>
      )}

      {items.length === 0 ? (
        <p className="ed-read-text">no new materials waiting — nothing to review right now ✨</p>
      ) : (
        items.map((m) => (
          <div className="mr-row" key={m.id}>
            <div className="mr-title">{m.title}</div>
            <div className="mr-meta">
              discovered by <strong>{m.group_code}</strong>
              {m.submitted_by ? ` · ${m.submitted_by}` : ""}
            </div>
            {m.description && <p className="mr-desc">“{m.description}”</p>}

            {/* dials: AI-suggested, human-confirmed (all optional) */}
            <div className="mr-dials">
              <button
                type="button"
                className="mr-suggest"
                disabled={!reviewer || suggesting === m.id || busy === m.id}
                onClick={() => suggest(m)}
              >
                {suggesting === m.id ? "…thinking" : "✨ suggest dials"}
              </button>
              <span className="mr-dials-label">loud or quiet?</span>
              {(["loud", "quiet"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  className="mr-lq"
                  data-on={loudQuiet[m.id] === v}
                  onClick={() => setLoudQuiet((s) => ({ ...s, [m.id]: s[m.id] === v ? null : v }))}
                >
                  {v === "loud" ? "🔊 loud" : "🔇 quiet"}
                </button>
              ))}
            </div>
            <div className="mr-verbs" aria-label="what it can do">
              {MATERIAL_VERBS.map((verb) => (
                <button
                  key={verb}
                  type="button"
                  className="mr-verb"
                  data-on={(affords[m.id] ?? []).includes(verb)}
                  onClick={() => toggleAfford(m.id, verb)}
                >
                  {verb}
                </button>
              ))}
            </div>
            {reasons[m.id] && <p className="mr-reason">ai: {reasons[m.id]}</p>}

            <div className="mr-actions" style={{ marginTop: 10 }}>
              <select
                className="mr-select"
                value={forms[m.id] ?? MATERIAL_FORMS[0]}
                onChange={(e) => setForms((f) => ({ ...f, [m.id]: e.target.value }))}
                aria-label={`what kind of material is ${m.title}`}
              >
                {MATERIAL_FORMS.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
              <button
                type="button"
                className="mr-btn mr-accept"
                disabled={!reviewer || busy === m.id}
                onClick={() => act(m, "accept")}
              >
                accept
              </button>
              <button
                type="button"
                className="mr-btn mr-decline"
                disabled={!reviewer || busy === m.id}
                onClick={() => act(m, "decline")}
              >
                decline
              </button>
            </div>
          </div>
        ))
      )}
      {err && <p className="ed-read-text" style={{ color: "var(--wv-redwood)", marginTop: 8 }}>{err}</p>}
    </div>
  );
}
