import type { Metadata } from "next";
import Link from "next/link";
import { evalHref } from "@/lib/eval-nav";

/**
 * creaseworks eval — audit shell.
 *
 * An adult-facing tool, so a calm light canvas (not the kid navy of the
 * mini). Same chrome-hide trick as the mini layout: mark the root with
 * [data-eval-root] and a body:has() rule removes the app header / nav /
 * footer / root feedback widget, which post to a prod db this worker
 * can't reach anyway.
 */

export const metadata: Metadata = {
  title: "creaseworks audit",
  description:
    "evaluate creaseworks playdates against the design cascade — the felt play and the framework.",
};

export default function EvalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-eval-root className="eval-shell">
      <style>{`
        body:has([data-eval-root]) > *:not(:has([data-eval-root])):not(.skip-link):not(script) {
          display: none !important;
        }
        body:has([data-eval-root]) {
          padding-top: 0;
          background: color-mix(in srgb, var(--wv-periwinkle) 18%, var(--wv-white));
        }
        .eval-shell {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: color-mix(in srgb, var(--wv-periwinkle) 18%, var(--wv-white));
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          color: var(--wv-cadet);
        }
        .eval-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 14px 20px 12px;
          background: var(--wv-white);
          box-shadow: 0 2px 10px rgba(39, 50, 72, 0.10);
          position: sticky;
          top: 0;
          z-index: 30;
        }
        .eval-wordmark {
          font-family: var(--font-fraunces), serif;
          font-weight: 600;
          font-size: 16px;
          color: var(--wv-cadet);
          text-decoration: none;
          white-space: nowrap;
        }
        .eval-wordmark .eval-tag {
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-weight: 800;
          font-size: 11px;
          color: var(--wv-white);
          background: var(--wv-teal);
          border-radius: 10px 14px 10px 12px;
          padding: 2px 8px;
          margin-left: 6px;
          vertical-align: 2px;
        }
        .eval-wordmark:focus-visible,
        .eval-dashlink:focus-visible {
          outline: 3px solid var(--color-focus);
          outline-offset: 3px;
          border-radius: 8px;
        }
        .eval-dashlink {
          font-weight: 800;
          font-size: 13px;
          color: var(--wv-teal);
          text-decoration: none;
        }
        /* the kid play screen is a child's surface — hide the grown-up
           analytics link when the kid register is active */
        .eval-shell:has(.ep-kid) .eval-dashlink { display: none; }
        .eval-main {
          flex: 1;
          width: 100%;
          max-width: 720px;
          margin: 0 auto;
          padding: 18px 20px 80px;
        }
      `}</style>

      <header className="eval-header">
        <Link href={evalHref("")} className="eval-wordmark" aria-label="creaseworks audit home">
          creaseworks<span className="eval-tag">audit</span>
        </Link>
        <Link href={evalHref("/dashboard")} className="eval-dashlink">
          coherence dashboard →
        </Link>
      </header>

      <main className="eval-main">{children}</main>
    </div>
  );
}
