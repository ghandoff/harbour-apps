"use client";

/**
 * FamilyMaterials — the family's side of the open-ended materials loop, shown
 * in the grown-up corner.
 *
 *   B4 · pick the icon — when a material the family discovered has been
 *        accepted and Payton has uploaded 3 candidates (icons_proposed), the
 *        family picks the one that goes live.
 *   B6 · "materials we added" — the family's whole collection with status, and
 *        the live ones with their chosen icon. Recognition, not currency:
 *        "you found something the creaseworks community hadn't yet."
 *
 * Reads the family/class code from identity; fetches cross-host from the eval
 * worker. Renders nothing until there's a code + something to show.
 */

import { useCallback, useEffect, useState } from "react";
import { getGroup } from "@/lib/cw-identity";
import {
  fetchMaterials,
  chooseIcon,
  iconCandidates,
  type SubmittedMaterial,
} from "@/lib/cw-materials";

const STATUS_LABEL: Record<string, string> = {
  pending: "waiting for review",
  accepted: "accepted — icons coming",
  icons_proposed: "pick your icon!",
  live: "live for everyone 🎉",
  declined: "not this time",
};

export function FamilyMaterials() {
  const [code, setCode] = useState<string | null>(null);
  const [proposing, setProposing] = useState<SubmittedMaterial[]>([]);
  const [all, setAll] = useState<SubmittedMaterial[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async (c: string) => {
    const [prop, mine] = await Promise.all([
      fetchMaterials("icons_proposed", c),
      fetchMaterials("all", c),
    ]);
    setProposing(prop);
    setAll(mine);
  }, []);

  useEffect(() => {
    const c = getGroup()?.code ?? null;
    setCode(c);
    if (c) void load(c);
  }, [load]);

  async function pick(m: SubmittedMaterial, url: string) {
    if (busy) return;
    setBusy(m.id);
    const ok = await chooseIcon({ id: m.id, chosenIconUrl: url });
    setBusy(null);
    if (ok && code) void load(code);
  }

  if (!code || all.length === 0) return null;

  return (
    <div className="fm">
      <style>{`
        .fm { margin-top: 14px; padding-top: 14px; border-top: 1px solid rgba(39,50,72,0.12); }
        .fm h3 { font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif; font-weight: 800; font-size: 15px; color: var(--wv-cadet); margin: 0 0 4px; }
        .fm p.fm-note { font-size: 12.5px; color: #6b7280; margin: 0 0 10px; line-height: 1.5; }
        .fm-pick { background: color-mix(in srgb, var(--wv-seafoam) 22%, var(--wv-white)); border: 2px solid var(--wv-teal); border-radius: 14px; padding: 12px; margin-bottom: 12px; }
        .fm-pick-title { font-weight: 800; font-size: 14px; color: var(--wv-cadet); margin-bottom: 8px; }
        .fm-cands { display: flex; gap: 10px; flex-wrap: wrap; }
        button.fm-cand:not([type="submit"]):not(.wv-header-signout) {
          width: 76px; height: 76px; border: 2px solid rgba(39,50,72,0.18); border-radius: 14px; background: var(--wv-white); cursor: pointer; padding: 6px; display: grid; place-items: center;
        }
        button.fm-cand:not([type="submit"]):not(.wv-header-signout):hover { border-color: var(--wv-teal); }
        button.fm-cand:disabled { opacity: 0.5; }
        .fm-cand img { max-width: 100%; max-height: 100%; }
        .fm-list { display: flex; flex-direction: column; gap: 6px; }
        .fm-item { display: flex; align-items: center; gap: 10px; font-size: 13px; color: var(--wv-cadet); }
        .fm-item img { width: 28px; height: 28px; object-fit: contain; }
        .fm-badge { font-size: 11px; font-weight: 700; color: #6b7280; margin-left: auto; }
        .fm-badge.live { color: #1f7a5c; }
      `}</style>

      {proposing.length > 0 && (
        <>
          <h3>pick your material’s icon 🎨</h3>
          <p className="fm-note">payton drew 3 for the material your family discovered — tap your favourite to make it live for everyone.</p>
          {proposing.map((m) => (
            <div className="fm-pick" key={m.id}>
              <div className="fm-pick-title">{m.title}</div>
              <div className="fm-cands">
                {iconCandidates(m).map((url, i) => (
                  <button
                    key={i}
                    type="button"
                    className="fm-cand"
                    disabled={busy === m.id}
                    onClick={() => pick(m, url)}
                    aria-label={`choose icon ${i + 1} for ${m.title}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`icon option ${i + 1}`} />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </>
      )}

      <h3>materials we added 🌍</h3>
      <p className="fm-note">things your family found that weren’t on the list — your gift to the creaseworks community.</p>
      <div className="fm-list">
        {all.map((m) => (
          <div className="fm-item" key={m.id}>
            {m.status === "live" && m.chosen_icon_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={m.chosen_icon_url} alt="" />
            ) : (
              <span aria-hidden>🧱</span>
            )}
            <span>{m.title}</span>
            <span className={`fm-badge${m.status === "live" ? " live" : ""}`}>
              {STATUS_LABEL[m.status] ?? m.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
