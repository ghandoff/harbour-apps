/**
 * /harbour/workshop — collective-only view of all in-development apps.
 *
 * Visible only to @windedvertigo.com staff. Lists every repairs-pier app
 * with deployment status, direct play links, and raft.house game pairings
 * so the team can discover, test, and prioritise work without exposing
 * unfinished tools to the public.
 */

import { redirect } from "next/navigation";
import Link from "next/link";
import { getViewer } from "@/lib/viewer";
import {
  HARBOUR_APPS,
  type HarbourAppEntry,
} from "@windedvertigo/auth/harbour-apps-data";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "workshop — winded.vertigo collective",
  robots: { index: false, follow: false },
};

// ── raft.house game pairings ────────────────────────────────────
// Each micro-app has a conceptual twin inside the raft.house GAME_REGISTRY.
// The game name uses dots (rhythm.lab); the app key uses dashes (rhythm-lab).

interface RaftPairing {
  game: string;   // exact name in GAME_REGISTRY
  disc: string;   // discipline label
  icon: string;   // emoji from GAME_REGISTRY
  loop: string;   // core loop from GAME_REGISTRY
}

const RAFT_PAIRINGS: Record<string, RaftPairing> = {
  "rhythm-lab":    { game: "rhythm.lab",    disc: "music",       icon: "🥁", loop: "layer→subdivide→groove" },
  "orbit-lab":     { game: "orbit.lab",     disc: "physics",     icon: "🪐", loop: "launch→observe→adjust" },
  "proof-garden":  { game: "proof.garden",  disc: "mathematics", icon: "🌿", loop: "plant→connect→bloom" },
  "liminal-pass":  { game: "liminal.pass",  disc: "philosophy",  icon: "🚪", loop: "encounter→struggle→threshold" },
  "bias-lens":     { game: "bias.lens",     disc: "psychology",  icon: "🔍", loop: "anchor→reframe→correct" },
  "scale-shift":   { game: "scale.shift",   disc: "economics",   icon: "📏", loop: "zoom→compare→shift" },
  "pattern-weave": { game: "pattern.weave", disc: "mathematics", icon: "🧶", loop: "find→reverse→compose" },
  "market-mind":   { game: "market.mind",   disc: "economics",   icon: "💡", loop: "choose→reveal→regret" },
  "code-weave":    { game: "code.weave",    disc: "cs",          icon: "🧬", loop: "program→run→debug" },
  "time-prism":    { game: "time.prism",    disc: "physics",     icon: "🔮", loop: "read→decide→compare" },
  "emerge-box":    { game: "emerge.box",    disc: "biology",     icon: "📦", loop: "define→observe→emerge" },
};

// ── partition repairs-pier apps ─────────────────────────────────
const REPAIRS = HARBOUR_APPS.filter((a) => a.pier === "repairs") as HarbourAppEntry[];
const MICRO_APPS   = REPAIRS.filter((a) => a.key in RAFT_PAIRINGS);
const BIGGER_APPS  = REPAIRS.filter((a) => !(a.key in RAFT_PAIRINGS));

// ── components ─────────────────────────────────────────────────

function StatusChip({ live }: { live: boolean }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{
        background: live ? "rgba(134,239,172,0.15)" : "rgba(255,255,255,0.07)",
        color: live ? "#86efac" : "var(--color-text-on-dark-muted)",
        border: live ? "1px solid rgba(134,239,172,0.3)" : "1px solid rgba(255,255,255,0.1)",
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ background: live ? "#86efac" : "rgba(255,255,255,0.3)" }}
        aria-hidden="true"
      />
      {live ? "live" : "coming soon"}
    </span>
  );
}

function MicroAppCard({ app }: { app: HarbourAppEntry }) {
  const pairing = RAFT_PAIRINGS[app.key]!;
  const live = !("comingSoon" in app && app.comingSoon);

  return (
    <div
      className="rounded-xl border bg-white/5 p-5 flex flex-col gap-4"
      style={{ borderColor: `${app.accent}30` }}
    >
      {/* header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-lg" aria-hidden="true">{pairing.icon}</span>
            <h3
              className="font-bold text-base"
              style={{ color: app.accent }}
            >
              {app.label}
            </h3>
          </div>
          <p className="text-xs text-[var(--color-text-on-dark-muted)]">{app.tagline}</p>
        </div>
        <StatusChip live={live} />
      </div>

      {/* raft.house pairing */}
      <div
        className="rounded-lg p-3 space-y-1 text-xs"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
      >
        <p className="text-[var(--color-text-on-dark-muted)]">
          <span className="text-[var(--color-text-on-dark)]">raft.house game:</span>{" "}
          {pairing.icon} {pairing.game}
          {" "}·{" "}
          <span className="opacity-70">{pairing.disc}</span>
        </p>
        <p className="text-[var(--color-text-on-dark-muted)] font-mono">{pairing.loop}</p>
      </div>

      {/* actions */}
      <div className="flex gap-2 mt-auto">
        {live ? (
          <a
            href={app.href}
            className="flex-1 text-center text-xs font-semibold py-2 px-3 rounded-lg transition-opacity hover:opacity-80"
            style={{ background: app.accent, color: "var(--wv-cadet)" }}
          >
            play →
          </a>
        ) : (
          <span
            className="flex-1 text-center text-xs font-semibold py-2 px-3 rounded-lg opacity-40 cursor-not-allowed"
            style={{ background: "rgba(255,255,255,0.1)", color: "var(--color-text-on-dark-muted)" }}
          >
            not yet deployed
          </span>
        )}
        <a
          href="/harbour/raft-house"
          className="text-xs font-semibold py-2 px-3 rounded-lg transition-opacity hover:opacity-80"
          style={{
            background: "rgba(88,203,178,0.15)",
            color: "#58cbb2",
            border: "1px solid rgba(88,203,178,0.25)",
          }}
        >
          raft →
        </a>
      </div>
    </div>
  );
}

function BiggerAppCard({ app }: { app: HarbourAppEntry }) {
  const live = !("comingSoon" in app && app.comingSoon);
  return (
    <div
      className="rounded-xl border bg-white/5 px-5 py-4 flex items-center justify-between gap-4"
      style={{ borderColor: "rgba(255,255,255,0.08)" }}
    >
      <div className="space-y-0.5 min-w-0">
        <p className="font-semibold text-sm truncate" style={{ color: app.accent }}>
          {app.label}
        </p>
        <p className="text-xs text-[var(--color-text-on-dark-muted)] truncate">{app.tagline}</p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <StatusChip live={live} />
        {live && (
          <a
            href={app.href}
            className="text-xs font-semibold py-1.5 px-3 rounded-lg transition-opacity hover:opacity-80"
            style={{ background: app.accent, color: "var(--wv-cadet)" }}
          >
            open →
          </a>
        )}
      </div>
    </div>
  );
}

// ── page ────────────────────────────────────────────────────────

export default async function WorkshopPage() {
  const viewer = await getViewer();

  if (!viewer.realStaff) {
    redirect("/");
  }

  const liveCount = MICRO_APPS.filter((a) => !("comingSoon" in a && a.comingSoon)).length;

  return (
    <main id="main" className="min-h-screen px-6 py-12">
      <div className="max-w-4xl mx-auto space-y-12">

        {/* header */}
        <header className="space-y-3">
          <div className="flex items-center gap-3">
            <Link
              href="/harbour"
              className="text-sm text-[var(--color-text-on-dark-muted)] hover:text-[var(--wv-champagne)] transition-colors"
            >
              ← harbour
            </Link>
          </div>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold text-[var(--color-text-on-dark)]">
                the workshop
              </h1>
              <p className="text-[var(--color-text-on-dark-muted)]">
                collective-only · in-development + prototype apps
              </p>
            </div>
            <span
              className="shrink-0 inline-block px-3 py-1 rounded-full text-xs font-semibold"
              style={{
                background: "rgba(255,235,210,0.1)",
                color: "var(--wv-champagne)",
                border: "1px solid rgba(255,235,210,0.2)",
              }}
            >
              harbourmaster only
            </span>
          </div>
          <p className="text-sm text-[var(--color-text-on-dark-muted)] max-w-2xl leading-relaxed">
            prototype apps under active development. not publicly discoverable — arrive here
            by direct link or via your account. each threshold concept micro-app pairs with a
            facilitated raft.house game on the same concept.
          </p>
        </header>

        {/* threshold concept micro-apps */}
        <section className="space-y-5">
          <div className="flex items-baseline justify-between">
            <h2 className="text-lg font-semibold text-[var(--color-text-on-dark)]">
              threshold concept micro-apps
            </h2>
            <span className="text-xs text-[var(--color-text-on-dark-muted)]">
              {liveCount} of {MICRO_APPS.length} live
            </span>
          </div>
          <p className="text-sm text-[var(--color-text-on-dark-muted)] -mt-2">
            each app is a free-play toy on a threshold concept · paired with a structured
            raft.house facilitated session on the same idea
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {MICRO_APPS.map((app) => (
              <MicroAppCard key={app.key} app={app} />
            ))}
          </div>
        </section>

        {/* bigger in-development apps */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-[var(--color-text-on-dark)]">
            other in-development apps
          </h2>
          <div className="space-y-2">
            {BIGGER_APPS.map((app) => (
              <BiggerAppCard key={app.key} app={app} />
            ))}
          </div>
        </section>

        <footer className="pt-4 border-t border-white/10 text-xs text-[var(--color-text-on-dark-muted)] space-y-1">
          <p>
            to make an app publicly discoverable: remove <code className="font-mono">comingSoon: true</code> from
            its entry in <code className="font-mono">packages/auth/harbour-apps-data.ts</code>, run{" "}
            <code className="font-mono">npm run rebuild-nav</code>, then deploy the cdn worker and the app itself.
          </p>
          <p>
            raft.house game names use <code className="font-mono">dots</code> (e.g. rhythm.lab);
            standalone app keys use <code className="font-mono">dashes</code> (e.g. rhythm-lab) — intentional mirrors.
          </p>
        </footer>
      </div>
    </main>
  );
}
