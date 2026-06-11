"use client";

/**
 * MiniFeedbackButton — the floating "tell us" button on every mini page.
 *
 * Payton's pattern from the fruitstand: "every time they stop or pause
 * or go 'what do I do?' … click that bug and type it in really quick."
 * Opens a tiny dialog, posts to the pilot feedback store with the
 * current stage attached, closes. Needs the family code; without one it
 * points the grown-up at the welcome strip.
 */

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { apiUrl } from "@/lib/api-url";
import { loadCode, miniHref, miniStageFromPathname } from "@/lib/mini-pilot";

type State = "closed" | "open" | "sending" | "sent";

export function MiniFeedbackButton() {
  const pathname = usePathname();
  const [state, setState] = useState<State>("closed");
  const [body, setBody] = useState("");
  const code = typeof window !== "undefined" ? loadCode() : null;

  async function send() {
    const text = body.trim();
    if (!text || !code) return;
    setState("sending");
    try {
      await fetch(apiUrl("/api/mini/feedback"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          stage: miniStageFromPathname(pathname) ?? "welcome",
          body: text,
        }),
      });
      setBody("");
      setState("sent");
      setTimeout(() => setState("closed"), 1600);
    } catch {
      setState("open");
    }
  }

  return (
    <>
      <style>{`
        button.mini-fb-fab:not([type="submit"]):not(.wv-header-signout) {
          position: fixed;
          left: 14px;
          bottom: calc(14px + env(safe-area-inset-bottom));
          z-index: 40;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-weight: 800;
          font-size: 12px;
          color: var(--wv-cadet);
          background: var(--wv-white);
          border: 1.5px solid rgba(39, 50, 72, 0.15);
          border-radius: 16px 20px 14px 18px;
          padding: 8px 12px;
          cursor: pointer;
          box-shadow: 0 3px 10px rgba(39, 50, 72, 0.15);
        }
        button.mini-fb-fab:not([type="submit"]):not(.wv-header-signout):focus-visible {
          outline: 3px solid var(--color-focus);
          outline-offset: 2px;
        }
        .mini-fb-panel {
          position: fixed;
          left: 14px;
          right: 14px;
          bottom: calc(14px + env(safe-area-inset-bottom));
          z-index: 41;
          max-width: 420px;
          background: var(--wv-white);
          border: 1.5px solid rgba(39, 50, 72, 0.12);
          border-radius: 18px 24px 16px 22px;
          box-shadow: 0 8px 28px rgba(39, 50, 72, 0.25);
          padding: 14px;
        }
        .mini-fb-panel textarea {
          width: 100%;
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-size: 14px;
          line-height: 1.5;
          background: var(--wv-cream);
          border: 1.5px solid rgba(39, 50, 72, 0.1);
          border-radius: 12px;
          padding: 10px 12px;
          min-height: 64px;
          resize: none;
          margin-bottom: 10px;
        }
        .mini-fb-row { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
        button.mini-fb-send:not([type="submit"]):not(.wv-header-signout) {
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-weight: 800;
          font-size: 13px;
          color: var(--wv-white);
          background: var(--wv-cadet);
          border: none;
          border-radius: 12px;
          padding: 8px 18px;
          cursor: pointer;
        }
        button.mini-fb-cancel:not([type="submit"]):not(.wv-header-signout) {
          font-size: 12px;
          color: var(--wv-cadet);
          opacity: 0.5;
          background: none;
          border: none;
          cursor: pointer;
          text-decoration: underline;
        }
        .mini-fb-hint { font-size: 12px; color: var(--wv-cadet); opacity: 0.6; line-height: 1.5; }
        .mini-fb-hint a { text-decoration: underline; }
        @media print { .mini-fb-fab, .mini-fb-panel { display: none !important; } }
      `}</style>

      {state === "closed" && (
        <button
          type="button"
          className="mini-fb-fab"
          onClick={() => setState("open")}
          aria-label="tell us what just happened — quick feedback"
        >
          💬 tell us
        </button>
      )}

      {state === "sent" && (
        <button type="button" className="mini-fb-fab" disabled>
          ✓ got it — thank you!
        </button>
      )}

      {(state === "open" || state === "sending") && (
        <div className="mini-fb-panel" role="dialog" aria-label="quick feedback">
          {code ? (
            <>
              <textarea
                autoFocus
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="what just happened? confusion, surprise, a quote — anything."
                maxLength={2000}
              />
              <div className="mini-fb-row">
                <button
                  type="button"
                  className="mini-fb-cancel"
                  onClick={() => setState("closed")}
                >
                  cancel
                </button>
                <button
                  type="button"
                  className="mini-fb-send"
                  disabled={state === "sending" || !body.trim()}
                  onClick={send}
                >
                  {state === "sending" ? "sending…" : "send"}
                </button>
              </div>
            </>
          ) : (
            <p className="mini-fb-hint">
              enter your family code on the{" "}
              <Link href={miniHref("/")}>welcome page</Link> first (under
              &ldquo;for grown-ups&rdquo;) — then this button sends us your
              notes.{" "}
              <button
                type="button"
                className="mini-fb-cancel"
                onClick={() => setState("closed")}
              >
                close
              </button>
            </p>
          )}
        </div>
      )}
    </>
  );
}
