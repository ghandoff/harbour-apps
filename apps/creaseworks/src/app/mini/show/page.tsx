"use client";

/**
 * mini show — photo + the child's words.
 *
 * The grown-up snaps a photo of the creation and types (or transcribes)
 * what the child says about it. Both go to the pilot store attached to
 * the family code; nothing appears publicly until reviewed.
 *
 * No family code yet → a gentle pointer back to the welcome page's
 * grown-up strip. The kid flow itself never requires reading.
 */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { apiUrl } from "@/lib/api-url";
import { loadCode, loadFound, matchActivities, miniHref } from "@/lib/mini-pilot";
import { MiniStageHero } from "../stage-hero";

type SendState = "idle" | "sending" | "done" | "error";

export default function MiniShowPage() {
  const [code, setCode] = useState<string | null>(null);
  const [activitySlug, setActivitySlug] = useState<string | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [words, setWords] = useState("");
  const [state, setState] = useState<SendState>("idle");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCode(loadCode());
    // best-effort: attach the activity the matcher picked this session
    const found = loadFound();
    if (found.length) setActivitySlug(matchActivities(found)[0].activity.slug);
  }, []);

  function pickPhoto(file: File | undefined) {
    if (!file) return;
    setPhoto(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  async function share() {
    if (!code || (!photo && !words.trim())) return;
    setState("sending");
    try {
      const form = new FormData();
      form.set("code", code);
      if (activitySlug) form.set("activitySlug", activitySlug);
      if (words.trim()) form.set("body", words.trim());
      if (photo) form.set("photo", photo);
      const res = await fetch(apiUrl("/api/mini/evidence"), { method: "POST", body: form });
      setState(res.ok ? "done" : "error");
    } catch {
      setState("error");
    }
  }

  return (
    <div>
      <MiniStageHero stage="show" />

      <style>{`
        .mini-show-card {
          background: var(--wv-white);
          border: 1.5px solid rgba(39, 50, 72, 0.08);
          border-radius: 24px 30px 22px 28px;
          padding: 20px;
          box-shadow: 0 4px 0 rgba(39, 50, 72, 0.08);
        }
        .mini-show-photo-zone {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-height: 140px;
          border: 2px dashed rgba(203, 120, 88, 0.5);
          border-radius: 18px 24px 16px 22px;
          cursor: pointer;
          margin-bottom: 14px;
          overflow: hidden;
        }
        .mini-show-photo-zone img {
          width: 100%;
          max-height: 260px;
          object-fit: cover;
        }
        .mini-show-photo-hint {
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-weight: 700;
          font-size: 14px;
          color: var(--wv-cadet);
          opacity: 0.6;
          padding: 20px;
          text-align: center;
        }
        .mini-show-words {
          width: 100%;
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-size: 15px;
          line-height: 1.5;
          color: var(--wv-cadet);
          background: var(--wv-cream);
          border: 1.5px solid rgba(39, 50, 72, 0.1);
          border-radius: 14px;
          padding: 12px 14px;
          min-height: 84px;
          resize: vertical;
          margin-bottom: 14px;
        }
        .mini-show-words:focus-visible {
          outline: 3px solid var(--color-focus);
          outline-offset: 1px;
        }
        button.mini-show-share:not([type="submit"]):not(.wv-header-signout) {
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-weight: 800;
          font-size: 18px;
          color: var(--wv-white);
          background: var(--wv-redwood);
          border: none;
          border-radius: 20px 26px 18px 24px;
          padding: 14px 30px;
          cursor: pointer;
          box-shadow: 0 4px 0 rgba(39, 50, 72, 0.15);
          transition: scale 150ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 150ms ease;
        }
        button.mini-show-share:not([type="submit"]):not(.wv-header-signout):disabled { opacity: 0.4; cursor: default; }
        button.mini-show-share:not([type="submit"]):not(.wv-header-signout):not(:disabled):hover { scale: 1.04; }
        button.mini-show-share:not([type="submit"]):not(.wv-header-signout):not(:disabled):active { scale: 0.95; }
        button.mini-show-share:not([type="submit"]):not(.wv-header-signout):focus-visible {
          outline: 3px solid var(--color-focus);
          outline-offset: 3px;
        }
        .mini-show-note { font-size: 12px; color: var(--wv-cadet); opacity: 0.5; margin-top: 12px; line-height: 1.6; }
        .mini-show-note a { text-decoration: underline; }
        .mini-show-done {
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-weight: 800;
          font-size: 17px;
          color: var(--wv-cadet);
          text-align: center;
          padding: 24px 0 10px;
        }
        .mini-show-done a {
          display: inline-block;
          margin-top: 14px;
          text-decoration: underline;
          font-size: 14px;
        }
      `}</style>

      {state === "done" ? (
        <div className="mini-show-card mini-show-done">
          <p>🎉 shared! a grown-up on our side will add it to the wow wall soon.</p>
          <Link href={miniHref("/wow")}>see the wow wall →</Link>
        </div>
      ) : (
        <div className="mini-show-card">
          <div
            className="mini-show-photo-zone"
            onClick={() => inputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
            aria-label="add a photo of what you made"
          >
            {previewUrl ? (
              <img src={previewUrl} alt="your creation" />
            ) : (
              <span className="mini-show-photo-hint">
                📸 tap to snap a photo of what you made!
              </span>
            )}
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic"
            capture="environment"
            className="hidden"
            style={{ display: "none" }}
            onChange={(e) => pickPhoto(e.target.files?.[0])}
          />

          <textarea
            className="mini-show-words"
            value={words}
            onChange={(e) => setWords(e.target.value)}
            placeholder="grown-ups: what did they say about it? type their words here…"
            maxLength={2000}
          />

          <button
            type="button"
            className="mini-show-share"
            disabled={!code || (!photo && !words.trim()) || state === "sending"}
            onClick={share}
          >
            {state === "sending" ? "sharing…" : "share it! →"}
          </button>

          {state === "error" && (
            <p className="mini-show-note" style={{ color: "var(--wv-redwood)", opacity: 1 }}>
              that didn&rsquo;t go through — try again in a moment?
            </p>
          )}
          {!code && (
            <p className="mini-show-note">
              grown-ups: enter your family code on the{" "}
              <Link href={miniHref("/")}>welcome page</Link> (under &ldquo;for
              grown-ups&rdquo;) to share photos.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
