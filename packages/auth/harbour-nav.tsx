"use client";

/**
 * Shared harbour navigation — rendered at the top of every harbour app.
 *
 * Architecture:
 *   - A minimal persistent top bar: anchor + breadcrumb + optional action slot.
 *   - A signature "harbour drawer" (HTML <dialog>) that reveals all 19 apps
 *     arranged across two piers: workshop + threshold.
 *   - Each app has a unique accent colour chip drawn from the brand palettes.
 *
 * Opens via tap on the anchor, or via cmd/ctrl+K on desktop.
 * Uses native <dialog>.showModal() for focus trap + ESC handling.
 *
 * Client component (needs state, keyboard listeners, time-of-day tide).
 */

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from "react";

import {
  HARBOUR_APPS as BUNDLED_HARBOUR_APPS,
  type HarbourAppEntry,
  type HarbourAppKey,
} from "./harbour-apps-data";

export type { HarbourAppKey } from "./harbour-apps-data";

/**
 * Runtime URL the React HarbourNav fetches on mount to refresh the app
 * list. Served by the wv-harbour-nav-cdn Worker with permissive CORS,
 * so consumers on any origin can reach it. A `HARBOUR_APPS` data change
 * + cdn-worker deploy is enough to propagate everywhere — no rebuild
 * of the React consumers required.
 *
 * The bundled BUNDLED_HARBOUR_APPS array is the SSR / initial-paint
 * fallback. If the fetch fails (offline, CDN outage), the nav still
 * renders against whatever was current when this app was built.
 */
const HARBOUR_APPS_URL = "https://windedvertigo.com/harbour-apps.json";

export const APP_ACCENTS: Record<HarbourAppKey, string> =
  BUNDLED_HARBOUR_APPS.reduce(
    (acc, a) => {
      acc[a.key as HarbourAppKey] = a.accent;
      return acc;
    },
    {} as Record<HarbourAppKey, string>,
  );

export interface HarbourNavProps {
  currentApp: HarbourAppKey;
  user?: {
    name?: string | null;
    email?: string | null;
  } | null;
  signInPath?: string;
  signOutPath?: string;
  /**
   * Optional per-page action rendered on the right side of the top bar
   * (e.g. paper.trail's "capture" button). Falls back to sign-in when
   * absent and no user is signed in.
   */
  action?: ReactNode;
}

function tideForHour(hour: number): string {
  if (hour >= 5 && hour < 11) return "rising tide";
  if (hour >= 11 && hour < 15) return "high tide";
  if (hour >= 15 && hour < 20) return "ebbing tide";
  return "low tide";
}

export function HarbourNav({
  currentApp,
  user,
  signInPath,
  signOutPath,
  action,
}: HarbourNavProps) {
  const [open, setOpen] = useState(false);
  const [tide, setTide] = useState<string>("");
  const [apps, setApps] =
    useState<readonly HarbourAppEntry[]>(BUNDLED_HARBOUR_APPS);
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const anchorRef = useRef<HTMLButtonElement | null>(null);

  // Refresh the app list from the cdn worker on mount. Bundled data
  // already drove the initial paint, so a successful fetch silently
  // upgrades the drawer to current data without any visible flash.
  // A failed fetch (offline / CDN outage) leaves the bundled fallback
  // in place — the nav remains functional, just possibly stale.
  useEffect(() => {
    let cancelled = false;
    fetch(HARBOUR_APPS_URL, { cache: "default" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`${r.status}`))))
      .then((data: unknown) => {
        if (cancelled || !Array.isArray(data) || data.length === 0) return;
        setApps(data as readonly HarbourAppEntry[]);
      })
      .catch(() => {
        /* keep bundled fallback */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const current = apps.find((a) => a.key === currentApp);
  const launch = apps.filter((a) => a.pier === "launch");
  const repairs = apps.filter((a) => a.pier === "repairs");

  const basePath = `/harbour/${currentApp}`;
  const resolvedSignIn = signInPath ?? `${basePath}/login`;
  const resolvedSignOut = signOutPath ?? `${basePath}/api/auth/signout`;

  // Open/close the native <dialog> in sync with React state.
  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (open && !d.open) {
      try {
        d.showModal();
      } catch {
        /* already open in another frame — ignore */
      }
    } else if (!open && d.open) {
      d.close();
    }
  }, [open]);

  // Bridge native close (ESC, form cancel) back into React state.
  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    const onClose = () => setOpen(false);
    d.addEventListener("close", onClose);
    return () => d.removeEventListener("close", onClose);
  }, []);

  // Return focus to the anchor when drawer closes.
  const wasOpen = useRef(false);
  useEffect(() => {
    if (wasOpen.current && !open) anchorRef.current?.focus();
    wasOpen.current = open;
  }, [open]);

  // cmd/ctrl+K toggles the drawer (power-user affordance).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Tide indicator — computed client-side to avoid SSR hydration mismatch.
  useEffect(() => {
    const update = () => setTide(tideForHour(new Date().getHours()));
    update();
    const id = window.setInterval(update, 15 * 60 * 1000);
    return () => window.clearInterval(id);
  }, []);

  // Close when the backdrop (native ::backdrop pseudo-element) is clicked.
  const handleDialogClick = useCallback(
    (e: ReactMouseEvent<HTMLDialogElement>) => {
      if (e.target === dialogRef.current) setOpen(false);
    },
    [],
  );

  return (
    <>
      <header
        className="harbour-topbar"
        style={
          current
            ? ({ ["--topbar-accent" as string]: current.accent } as CSSProperties)
            : undefined
        }
      >
        <div className="harbour-topbar-crumb">
          <button
            ref={anchorRef}
            type="button"
            className="harbour-anchor"
            onClick={() => setOpen(true)}
            aria-label="open the harbour drawer"
            aria-expanded={open}
            aria-controls="harbour-drawer"
          >
            <AnchorGlyph />
            <span className="harbour-anchor-label">harbour</span>
          </button>
          <span className="harbour-anchor-sep" aria-hidden="true" />
          <a href={basePath} className="harbour-breadcrumb">
            {current?.label ?? currentApp}
          </a>
        </div>

        <div className="harbour-topbar-action">
          {action ??
            (user ? (
              <a href={resolvedSignOut} className="harbour-signin">
                sign out
              </a>
            ) : (
              <a href={resolvedSignIn} className="harbour-signin">
                sign in
              </a>
            ))}
        </div>
      </header>

      <dialog
        ref={dialogRef}
        id="harbour-drawer"
        className="harbour-drawer"
        aria-labelledby="harbour-drawer-title"
        onClick={handleDialogClick}
      >
        <div className="harbour-drawer-inner">
          <header className="harbour-drawer-head">
            <h2
              id="harbour-drawer-title"
              className="harbour-drawer-title"
            >
              {current ? "the harbour" : "lost at sea"}
            </h2>
            <span className="harbour-tide" aria-hidden={!tide}>
              {tide}
            </span>
            <button
              type="button"
              className="harbour-close"
              onClick={() => setOpen(false)}
              aria-label="close drawer"
            >
              <svg
                viewBox="0 0 24 24"
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                aria-hidden="true"
                focusable="false"
              >
                <path d="M6 6 L 18 18" />
                <path d="M18 6 L 6 18" />
              </svg>
            </button>
          </header>

          {!current && (
            <div className="harbour-lost">
              <p>you&rsquo;ve drifted off the map.</p>
              <a href="/harbour" className="harbour-lost-action">
                drift back to harbour →
              </a>
            </div>
          )}

          <section
            className="harbour-pier"
            aria-labelledby="harbour-pier-launch"
          >
            <h3 id="harbour-pier-launch" className="harbour-pier-label">
              launch pier
            </h3>
            <ul className="harbour-pier-list">
              {launch.map((app) => (
                <DockItem
                  key={app.key}
                  app={app}
                  isDocked={app.key === currentApp}
                  onNavigate={() => setOpen(false)}
                />
              ))}
            </ul>
          </section>

          {repairs.length > 0 && (
            <section
              className="harbour-pier"
              aria-labelledby="harbour-pier-repairs"
            >
              <h3 id="harbour-pier-repairs" className="harbour-pier-label">
                repairs pier
              </h3>
              <ul className="harbour-pier-list">
                {repairs.map((app) => (
                  <DockItem
                    key={app.key}
                    app={app}
                    isDocked={app.key === currentApp}
                    onNavigate={() => setOpen(false)}
                  />
                ))}
              </ul>
            </section>
          )}

          <footer className="harbour-drawer-foot">
            {user ? (
              <>
                <span className="harbour-user">
                  {user.name ?? user.email}
                </span>
                <a
                  href={resolvedSignOut}
                  className="harbour-drawer-link"
                  onClick={() => setOpen(false)}
                >
                  sign out
                </a>
              </>
            ) : (
              <a
                href={resolvedSignIn}
                className="harbour-drawer-link"
                data-accent=""
                onClick={() => setOpen(false)}
              >
                sign in
              </a>
            )}
          </footer>
        </div>
      </dialog>
    </>
  );
}

function AnchorGlyph() {
  return (
    <svg
      className="harbour-anchor-sigil"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="12" cy="5" r="2.25" />
      <path d="M12 7.25 V 20.5" />
      <path d="M8.25 11.5 H 15.75" />
      <path d="M4.75 12.5 C 4.75 17, 8.25 20.5, 12 20.5 C 15.75 20.5, 19.25 17, 19.25 12.5" />
    </svg>
  );
}

function DockItem({
  app,
  isDocked,
  onNavigate,
}: {
  app: HarbourAppEntry;
  isDocked: boolean;
  onNavigate: () => void;
}) {
  const inner = (
    <>
      <span className="harbour-dock-chip" aria-hidden="true" />
      <span className="harbour-dock-body">
        <span className="harbour-dock-label">{app.label}</span>
        <span className="harbour-dock-tagline">{app.tagline}</span>
      </span>
      <span className="harbour-dock-trail" aria-hidden="true">
        {isDocked ? "docked here" : app.comingSoon ? "soon" : "→"}
      </span>
    </>
  );

  if (app.comingSoon) {
    // Render as a non-interactive span — no href, no tab stop, dimmed.
    return (
      <li>
        <span
          className="harbour-dock harbour-dock--coming-soon"
          style={{ ["--dock-accent" as string]: app.accent }}
          aria-label={`${app.label} — coming soon`}
        >
          {inner}
        </span>
      </li>
    );
  }

  return (
    <li>
      <a
        href={app.href}
        className={`harbour-dock${isDocked ? " is-docked" : ""}`}
        onClick={onNavigate}
        aria-current={isDocked ? "page" : undefined}
        style={{ ["--dock-accent" as string]: app.accent }}
      >
        {inner}
      </a>
    </li>
  );
}
