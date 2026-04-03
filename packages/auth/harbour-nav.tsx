/**
 * Shared harbour navigation bar — rendered at the top of every harbour app.
 *
 * Server component. Each app's layout calls auth() locally and passes the
 * session data as props. The nav itself has no auth dependency.
 *
 * Uses the .wv-header* CSS classes from @windedvertigo/tokens.
 */

const HARBOUR_APPS = [
  {
    key: "creaseworks",
    label: "creaseworks",
    href: "/harbour/creaseworks",
    tagline: "creative playdates",
  },
  {
    key: "vertigo-vault",
    label: "vertigo.vault",
    href: "/harbour/vertigo-vault",
    tagline: "learning activities",
  },
  {
    key: "depth-chart",
    label: "depth.chart",
    href: "/harbour/depth-chart",
    tagline: "assessment generator",
  },
  {
    key: "deep-deck",
    label: "deep.deck",
    href: "/harbour/deep-deck",
    tagline: "conversation cards",
  },
  {
    key: "raft-house",
    label: "raft.house",
    href: "/harbour/raft-house",
    tagline: "group learning",
  },
] as const;

export type HarbourAppKey =
  | "creaseworks"
  | "vertigo-vault"
  | "depth-chart"
  | "deep-deck"
  | "raft-house";

export interface HarbourNavProps {
  currentApp: HarbourAppKey;
  user?: {
    name?: string | null;
    email?: string | null;
  } | null;
  signInPath?: string;
  signOutPath?: string;
}

export function HarbourNav({
  currentApp,
  user,
  signInPath,
  signOutPath,
}: HarbourNavProps) {
  const otherApps = HARBOUR_APPS.filter((app) => app.key !== currentApp);
  const current = HARBOUR_APPS.find((app) => app.key === currentApp);
  const basePath = `/harbour/${currentApp}`;
  const resolvedSignIn = signInPath ?? `${basePath}/login`;
  const resolvedSignOut = signOutPath ?? `${basePath}/api/auth/signout`;

  return (
    <header className="wv-header harbour-nav" style={{ position: "sticky", top: 0, zIndex: 50 }}>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-md, 16px)" }}>
        <a
          href="/harbour"
          className="wv-header-brand"
          style={{ opacity: 0.5, fontSize: "0.75rem" }}
        >
          harbour
        </a>
        <span
          style={{
            color: "var(--wv-champagne, #ffebd2)",
            opacity: 0.3,
            fontSize: "0.75rem",
          }}
        >
          /
        </span>
        <span className="wv-header-brand">{current?.label ?? currentApp}</span>
      </div>

      <nav className="wv-header-nav" aria-label="harbour apps">
        {otherApps.map((app) => (
          <a
            key={app.key}
            href={app.href}
            className="wv-header-nav-link"
            title={app.tagline}
          >
            {app.label}
          </a>
        ))}

        {user ? (
          <span style={{ display: "flex", alignItems: "center", gap: "var(--space-sm, 8px)" }}>
            <span className="wv-header-email">
              {user.name ?? user.email}
            </span>
            <a href={resolvedSignOut} className="wv-header-signout" style={{ textDecoration: "none" }}>
              sign out
            </a>
          </span>
        ) : (
          <a href={resolvedSignIn} className="wv-header-nav-link" data-accent="">
            sign in
          </a>
        )}
      </nav>
    </header>
  );
}
