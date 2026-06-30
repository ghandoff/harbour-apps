"use client";

/**
 * MaterialsReview — collective moderation of kid-submitted materials (B3).
 *
 * Lists `pending` submissions from /api/eval/materials; the collective
 * accepts (assigning a form category — which drives the character cast +
 * matching) or declines. Attribution = the reviewer's name from the eval
 * home preset login (sessionStorage cw-eval-name), same as evaluations.
 *
 * Reuses the dashboard's .ed-card / .note / .ed-read-text styles (the
 * dashboard's <style> is global within the page); a small scoped block
 * styles the review controls.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { evalHref } from "@/lib/eval-nav";
import {
  fetchMaterials,
  reviewMaterial,
  MATERIAL_FORMS,
  type SubmittedMaterial,
} from "@/lib/cw-materials";

const NAME_KEY = "cw-eval-name";

export function MaterialsReview() {
  const [items, setItems] = useState<SubmittedMaterial[] | null>(null);
  const [reviewer, setReviewer] = useState<string | null>(null);
  const [forms, setForms] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    try {
      setReviewer(sessionStorage.getItem(NAME_KEY));
    } catch {}
    void fetchMaterials("pending").then(setItems);
  }, []);

  async function act(m: SubmittedMaterial, action: "accept" | "decline") {
    if (busy) return;
    const formPrimary = forms[m.id] ?? MATERIAL_FORMS[0];
    setBusy(m.id);
    setErr(null);
    const ok = await reviewMaterial({ id: m.id, action, formPrimary, reviewer });
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
      `}</style>
      <h2>new materials to review 🧱</h2>
      <p className="note">
        materials kids found that aren’t on the list yet. accept (pick what kind it is) to move it toward the collective list, or decline. accepted ones go to payton for icons, then the family picks the one that goes live.
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
            <div className="mr-actions">
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
