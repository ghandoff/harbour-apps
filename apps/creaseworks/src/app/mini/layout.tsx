import type { Metadata } from "next";
import { FeedbackWidget } from "@windedvertigo/feedback";
import { apiUrl } from "@/lib/api-url";
import { GrownUpCorner } from "./grown-up-corner";
import { MiniStageNav } from "./stage-nav";

/**
 * creaseworks mini — pilot shell.
 *
 * White canvas (champagne/cream is never a background — standing rule),
 * vibrancy from the secondary palette via per-stage tint bands.
 *
 * The root layout wires HarbourNav + NavBar + Footer + FeedbackWidget
 * around every page. The mini needs a clean kid-first canvas without
 * restructuring the whole app into route groups, so this layout marks
 * itself with [data-mini-root] and a body:has() rule hides the app
 * chrome. !important because the root FeedbackWidget portals into body
 * with inline styles — and it posts to the prod db this worker can't
 * reach. The mini mounts its OWN FeedbackWidget (same familiar 🐛,
 * bottom-right) pointed at the pilot endpoint instead.
 *
 * Deliberately NOT touching middleware.ts (crashed the CF worker once —
 * commit 1780f80).
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
        body:has([data-mini-root]) > *:not(:has([data-mini-root])):not(.skip-link):not(script) {
          display: none !important;
        }
        body:has([data-mini-root]) {
          padding-top: 0;
          background: var(--wv-navy);
        }
        .mini-shell {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: var(--wv-navy);
        }
        /* white bar pinned at top — stays white per garrett; the rest of
           the canvas is navy (#436db1), deep enough that white bare-on-
           canvas text clears AA at all sizes (5.2:1). */
        .mini-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 14px 18px 12px;
          background: var(--wv-white);
          box-shadow: 0 2px 10px rgba(39, 50, 72, 0.18);
          position: sticky;
          top: 0;
          z-index: 30;
        }
        .mini-wordmark {
          font-family: var(--font-fraunces), serif;
          font-weight: 600;
          font-size: 16px;
          color: var(--wv-cadet);
          letter-spacing: 0.01em;
          white-space: nowrap;
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
          padding: 8px 18px 64px; /* room for the grown-ups tab */
        }
        @media print {
          .mini-header { display: none; }
        }
      `}</style>

      <header className="mini-header">
        <span className="mini-wordmark">
          creaseworks<span className="mini-tag">mini</span>
        </span>
        <MiniStageNav />
      </header>

      <main className="mini-main">{children}</main>

      <GrownUpCorner />
      {/* the familiar 🐛, bottom-right, wired to the pilot store */}
      <FeedbackWidget appSlug="creaseworks-mini" endpoint={apiUrl("/api/mini/feedback")} />
    </div>
  );
}
