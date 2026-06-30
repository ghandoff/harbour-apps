"use client";

/**
 * MaterialsIcons — B4, Payton's admin surface on the dashboard.
 *
 * Lists `accepted` materials (no icons yet) and lets Payton upload 3 bespoke
 * icon candidates each. On upload the material moves to `icons_proposed` and
 * the family picks one in the mini grown-up corner. Reviewer attribution =
 * the eval-home preset login (sessionStorage cw-eval-name).
 */

import { useEffect, useRef, useState } from "react";
import { fetchMaterials, uploadIcons, type SubmittedMaterial } from "@/lib/cw-materials";

const NAME_KEY = "cw-eval-name";

export function MaterialsIcons() {
  const [items, setItems] = useState<SubmittedMaterial[] | null>(null);
  const [reviewer, setReviewer] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const files = useRef<Record<string, (File | null)[]>>({});

  useEffect(() => {
    try {
      setReviewer(sessionStorage.getItem(NAME_KEY));
    } catch {}
    void fetchMaterials("accepted").then(setItems);
  }, []);

  async function upload(m: SubmittedMaterial) {
    if (busy) return;
    const picked = (files.current[m.id] ?? []).filter(Boolean) as File[];
    if (picked.length !== 3) {
      setErr(`${m.title}: choose exactly 3 icon files`);
      return;
    }
    setErr(null);
    setBusy(m.id);
    const urls = await uploadIcons({ id: m.id, files: picked, reviewer });
    setBusy(null);
    if (urls) setItems((prev) => (prev ?? []).filter((x) => x.id !== m.id));
    else setErr(`${m.title}: upload failed — try again`);
  }

  if (items === null || items.length === 0) return null;

  return (
    <div className="ed-card">
      <style>{`
        .mi-row { padding: 12px 0; border-bottom: 1px solid rgba(39,50,72,0.08); }
        .mi-row:last-child { border-bottom: none; }
        .mi-title { font-weight: 800; font-size: 15px; color: var(--wv-cadet); }
        .mi-meta { font-size: 12px; color: #6b7280; margin: 2px 0 8px; }
        .mi-files { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
        .mi-files input[type=file] { font-size: 12px; max-width: 200px; }
        button.mi-btn:not([type="submit"]):not(.wv-header-signout) {
          font-weight: 800; font-size: 13px; border: none; border-radius: 10px; padding: 7px 14px; cursor: pointer; color: var(--wv-white); background: var(--wv-teal);
        }
        button.mi-btn:not([type="submit"]):not(.wv-header-signout):disabled { opacity: 0.4; cursor: default; }
        .mi-err { color: var(--wv-redwood); font-size: 12px; font-weight: 700; margin-top: 6px; }
      `}</style>
      <h2>icons to design 🎨 <span style={{ fontWeight: 600, fontSize: 13, color: "#6b7280" }}>(payton)</span></h2>
      <p className="note">
        accepted materials waiting for icons. upload <strong>3 bespoke candidates</strong> each — the family then picks the one that goes live. png / webp / jpg, ≤ 512KB.
      </p>

      {!reviewer && (
        <p className="ed-read-text">tap your name on the eval home first, so the upload is attributed.</p>
      )}

      {items.map((m) => (
        <div className="mi-row" key={m.id}>
          <div className="mi-title">{m.title}</div>
          <div className="mi-meta">
            discovered by <strong>{m.group_code}</strong> · {m.form_primary ?? "—"}
            {m.description ? ` · “${m.description}”` : ""}
          </div>
          <div className="mi-files">
            {[0, 1, 2].map((i) => (
              <input
                key={i}
                type="file"
                accept="image/png,image/webp,image/jpeg"
                aria-label={`${m.title} icon candidate ${i + 1}`}
                onChange={(e) => {
                  const arr = files.current[m.id] ?? [null, null, null];
                  arr[i] = e.target.files?.[0] ?? null;
                  files.current[m.id] = arr;
                }}
              />
            ))}
            <button
              type="button"
              className="mi-btn"
              disabled={!reviewer || busy === m.id}
              onClick={() => upload(m)}
            >
              {busy === m.id ? "uploading…" : "send 3 to the family"}
            </button>
          </div>
        </div>
      ))}
      {err && <p className="mi-err">{err}</p>}
    </div>
  );
}
