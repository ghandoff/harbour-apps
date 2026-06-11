import type { Metadata } from "next";
import { MiniFeedbackButton } from "./feedback-button";
import { MiniStageNav } from "./stage-nav";

/**
 * creaseworks mini — pilot shell.
 *
 * The root layout wires HarbourNav + NavBar + Footer + FeedbackWidget
 * around every page. The mini needs a clean kid-first canvas without
 * restructuring the whole app into route groups, so this layout marks
 * itself with [data-mini-root] and a body:has() rule hides the app
 * chrome (everything except #main-content and the skip link). Pilot-
 * grade pragmatism — revisit if the mini graduates to its own app.
 *
 * Deliberately NOT touching middleware.ts for this (it crashed the CF
 * worker once already — commit 1780f80).
 */

export const metadata: Metadata = {
  title: "creaseworks mini",
  description:
    "a tiny version of creaseworks for families — look, make, show, wow.",
};

export default function MiniLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div data-mini-root className="mini-shell">
      <style>{`
        /* hide app chrome (nav, footer, feedback widget) on mini pages.
           direct children of body other than the main-content wrapper
           and the skip link. */
        body:has([data-mini-root]) > *:not(:has([data-mini-root])):not(.skip-link):not(script) {
          /* !important: the FeedbackWidget 🐛 button portals into body
             with inline styles — and it's a dead button on the pilot
             worker anyway (posts to the main app's db, which this
             worker can't reach). the mini's own "tell us" replaces it. */
          display: none !important;
        }
        body:has([data-mini-root]) {
          padding-top: 0;
          background: var(--wv-cream);
        }
        .mini-shell {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: var(--wv-cream);
        }
        .mini-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 18px 10px;
        }
        .mini-wordmark {
          font-family: var(--font-fraunces), serif;
          font-weight: 600;
          font-size: 16px;
          color: var(--wv-cadet);
          letter-spacing: 0.01em;
        }
        .mini-wordmark .mini-tag {
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-weight: 800;
          font-size: 11px;
          color: var(--wv-white);
          background: var(--wv-redwood);
          border-radius: 10px 14px 10px 12px;
          padding: 2px 8px;
          margin-left: 6px;
          vertical-align: 2px;
        }
        .mini-main {
          flex: 1;
          width: 100%;
          max-width: 640px;
          margin: 0 auto;
          padding: 8px 18px 32px;
        }
      `}</style>

      <header className="mini-header">
        <span className="mini-wordmark">
          creaseworks<span className="mini-tag">mini</span>
        </span>
        <MiniStageNav />
      </header>

      <main className="mini-main">{children}</main>
      <MiniFeedbackButton />
    </div>
  );
}
