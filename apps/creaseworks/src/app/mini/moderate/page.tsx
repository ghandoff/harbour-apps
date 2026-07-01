"use client";

/**
 * mini moderate — the collective's human-in-the-loop review queue.
 *
 * Passphrase (MODERATOR_CODE) → tap your name → approve/reject each pending
 * submission with a reason + quick tags. Every decision is logged (who / why /
 * tags) as the labelled corpus that later trains an AI pre-screen. Nothing a
 * family shares reaches the public wall until it's approved here.
 */

import { useCallback, useEffect, useState } from "react";
import { apiUrl } from "@/lib/api-url";
import { MINI_ACTIVITIES } from "@/lib/mini-pilot";

const CODE_KEY = "cw-mod-code";
const REVIEWERS = ["jamie", "garrett", "maria", "payton", "lamis"];
const TAGS = ["clear child work", "blurry / hard to see", "a face is visible", "off-task", "lovely example"];

interface Item {
  id: string;
  code: string;
  activity_slug: string | null;
  body: string | null;
  has_photo: number;
  created_at: string;
}
type Notes = { reason: string; tags: string[] };

export default function MiniModeratePage() {
  const [code, setCode] = useState("");
  const [authed, setAuthed] = useState(false);
  const [gateError, setGateError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [reviewer, setReviewer] = useState<string | null>(null);
  const [queue, setQueue] = useState<Item[] | null>(null);
  const [notes, setNotes] = useState<Record<string, Notes>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const loadQueue = useCallback(async (pass: string): Promise<boolean> => {
    setChecking(true);
    setGateError(null);
    try {
      const res = await fetch(apiUrl("/api/mini/moderate/queue"), {
        headers: { "x-moderator-code": pass },
      });
      if (res.status === 401) {
        setGateError("that passphrase didn’t work.");
        return false;
      }
      if (!res.ok) {
        setGateError("couldn’t load the queue — try again.");
        return false;
      }
      const data = (await res.json()) as { queue: Item[] };
      setQueue(data.queue ?? []);
      setAuthed(true);
      try { sessionStorage.setItem(CODE_KEY, pass); } catch {}
      return true;
    } catch {
      setGateError("couldn’t reach the server — try again.");
      return false;
    } finally {
      setChecking(false);
    }
  }, []);

  // resume an authed session on refresh
  useEffect(() => {
    let saved = "";
    try { saved = sessionStorage.getItem(CODE_KEY) ?? ""; } catch {}
    if (saved) {
      setCode(saved);
      void loadQueue(saved);
    }
  }, [loadQueue]);

  const noteFor = (id: string): Notes => notes[id] ?? { reason: "", tags: [] };
  const setNote = (id: string, patch: Partial<Notes>) =>
    setNotes((prev) => ({ ...prev, [id]: { ...noteFor(id), ...patch } }));
  const toggleTag = (id: string, tag: string) => {
    const cur = noteFor(id).tags;
    setNote(id, { tags: cur.includes(tag) ? cur.filter((t) => t !== tag) : [...cur, tag] });
  };

  async function decide(item: Item, decision: "approve" | "reject") {
    if (!reviewer) return;
    setBusy(item.id);
    try {
      const n = noteFor(item.id);
      const res = await fetch(apiUrl("/api/mini/moderate/decide"), {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-moderator-code": code },
        body: JSON.stringify({ id: item.id, decision, reviewer, reason: n.reason, tags: n.tags }),
      });
      if (res.ok || res.status === 409) {
        setQueue((q) => (q ? q.filter((x) => x.id !== item.id) : q));
      } else if (res.status === 401) {
        setAuthed(false);
        setGateError("session expired — enter the passphrase again.");
      }
    } finally {
      setBusy(null);
    }
  }

  const titleFor = (slug: string | null) => MINI_ACTIVITIES.find((a) => a.slug === slug)?.title ?? slug ?? "—";

  return (
    <div className="mod">
      <style>{`
        .mod { color: var(--wv-white); }
        .mod-h { font-family: var(--font-fraunces), serif; font-weight: 600; font-size: 24px; margin: 4px 0 2px; }
        .mod-sub { font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif; font-weight: 700; font-size: 13px; opacity: 0.85; margin: 0 0 18px; }
        .mod-card { background: var(--wv-white); color: var(--wv-cadet); border-radius: 16px 20px 14px 18px; padding: 16px 16px 14px; margin-bottom: 16px; box-shadow: 0 3px 0 rgba(39,50,72,0.15); }
        .mod-gate { max-width: 360px; }
        .mod-input { width: 100%; font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif; font-size: 16px; color: var(--wv-cadet); background: var(--wv-white); border: 2px solid rgba(39,50,72,0.18); border-radius: 12px; padding: 10px 14px; box-sizing: border-box; }
        .mod-input:focus-visible { outline: 3px solid var(--color-focus); outline-offset: 2px; }
        .mod-label { font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif; font-weight: 800; font-size: 13px; color: var(--wv-cadet); display: block; margin-bottom: 6px; }
        .mod-err { color: var(--wv-redwood); font-weight: 800; font-size: 13px; margin-top: 8px; }
        .mod-chips { display: flex; flex-wrap: wrap; gap: 8px; }
        button.mod-chip { cursor: pointer; font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif; font-weight: 800; font-size: 13px; color: var(--wv-cadet); background: var(--wv-white); border: 2px solid rgba(39,50,72,0.16); border-radius: 12px; padding: 7px 13px; }
        button.mod-chip[data-on="true"] { border-color: var(--wv-teal); background: color-mix(in srgb, var(--wv-teal) 22%, var(--wv-white)); }
        button.mod-chip:focus-visible { outline: 3px solid var(--color-focus); outline-offset: 2px; }
        .mod-photo { width: 100%; max-height: 420px; object-fit: contain; background: rgba(39,50,72,0.06); border-radius: 12px; display: block; margin-bottom: 10px; }
        .mod-meta { font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif; font-size: 12px; color: #6b7280; font-weight: 700; }
        .mod-words { font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif; font-weight: 700; font-size: 15px; color: var(--wv-cadet); line-height: 1.45; margin: 4px 0 10px; }
        .mod-textarea { width: 100%; box-sizing: border-box; font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif; font-size: 15px; color: var(--wv-cadet); background: var(--wv-white); border: 2px solid rgba(39,50,72,0.16); border-radius: 12px; padding: 9px 12px; margin: 10px 0; }
        .mod-actions { display: flex; gap: 10px; }
        button.mod-btn { flex: 1; cursor: pointer; font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif; font-weight: 800; font-size: 15px; color: var(--wv-white); border: none; border-radius: 14px; padding: 12px; }
        button.mod-btn:disabled { opacity: 0.4; cursor: default; }
        button.mod-approve { background: var(--wv-teal); }
        button.mod-reject { background: var(--wv-redwood); }
        .mod-empty { font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif; font-weight: 800; font-size: 18px; text-align: center; padding: 40px 20px; }
        .mod-names { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 18px; }
        button.mod-name { cursor: pointer; font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif; font-weight: 800; font-size: 14px; color: var(--wv-cadet); background: var(--wv-white); border: 2px solid transparent; border-radius: 12px; padding: 8px 14px; }
        button.mod-name[data-on="true"] { border-color: var(--wv-sun); }
      `}</style>

      {!authed ? (
        <div className="mod-gate">
          <h1 className="mod-h">🔒 moderation</h1>
          <p className="mod-sub">enter the moderator passphrase to review submissions.</p>
          <div className="mod-card">
            <label className="mod-label" htmlFor="mod-pass">passphrase</label>
            <input
              id="mod-pass"
              className="mod-input"
              type="password"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && code && loadQueue(code)}
              autoCapitalize="none"
              autoCorrect="off"
            />
            <div className="mod-actions" style={{ marginTop: 12 }}>
              <button
                type="button"
                className="mod-btn mod-approve"
                disabled={!code || checking}
                onClick={() => loadQueue(code)}
              >
                {checking ? "checking…" : "enter"}
              </button>
            </div>
            {gateError && <p className="mod-err">{gateError}</p>}
          </div>
        </div>
      ) : (
        <>
          <h1 className="mod-h">🧭 moderation queue</h1>
          <p className="mod-sub">approve to publish on the wall, or reject to keep it off. your call + reason is logged.</p>

          <label className="mod-label">who’s reviewing?</label>
          <div className="mod-names">
            {REVIEWERS.map((n) => (
              <button key={n} type="button" className="mod-name" data-on={reviewer === n} onClick={() => setReviewer(n)}>
                {n}
              </button>
            ))}
          </div>

          {queue === null ? null : queue.length === 0 ? (
            <p className="mod-empty">nothing waiting — the queue is clear. 🎉</p>
          ) : (
            queue.map((item) => {
              const n = noteFor(item.id);
              return (
                <div key={item.id} className="mod-card">
                  {item.has_photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      className="mod-photo"
                      src={apiUrl(`/api/mini/photo/${item.id}?code=${encodeURIComponent(item.code)}`)}
                      alt={item.body ?? "a submitted creation"}
                    />
                  ) : null}
                  <p className="mod-meta">{titleFor(item.activity_slug)} · {item.code} · {item.created_at}</p>
                  {item.body && <p className="mod-words">“{item.body}”</p>}

                  <div className="mod-chips">
                    {TAGS.map((t) => (
                      <button key={t} type="button" className="mod-chip" data-on={n.tags.includes(t)} onClick={() => toggleTag(item.id, t)}>
                        {t}
                      </button>
                    ))}
                  </div>

                  <textarea
                    className="mod-textarea"
                    rows={2}
                    maxLength={2000}
                    placeholder="why? (what made this a yes or no — helps train the pre-screen)"
                    value={n.reason}
                    onChange={(e) => setNote(item.id, { reason: e.target.value })}
                  />

                  <div className="mod-actions">
                    <button type="button" className="mod-btn mod-approve" disabled={!reviewer || busy === item.id} onClick={() => decide(item, "approve")}>
                      {busy === item.id ? "…" : "✓ approve → wall"}
                    </button>
                    <button type="button" className="mod-btn mod-reject" disabled={!reviewer || busy === item.id} onClick={() => decide(item, "reject")}>
                      {busy === item.id ? "…" : "✕ reject"}
                    </button>
                  </div>
                  {!reviewer && <p className="mod-err">tap your name above first.</p>}
                </div>
              );
            })
          )}
        </>
      )}
    </div>
  );
}
