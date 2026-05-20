import type { Game } from "@/lib/notion";
import { InterestForm } from "./interest-form";

type PierId = "pier-a" | "pier-b";

interface PierSectionProps {
  pier: PierId;
  /** Long label, e.g. "pier a — leadership". */
  label: string;
  /** Short label used as the oversized boardwalk sign, e.g. "leadership". */
  shortLabel: string;
  audience: string;
  games: Game[];
}

/**
 * Pier A or Pier B as a "boardwalk" — a horizontal deck with a plank
 * texture, oversized lowercase pier-name typography on the left
 * (the "sign at the head of the pier"), and the cards flowing as a
 * horizontal rail to the right.
 *
 * Design lineage: category 2 of the design research (horizontal rails)
 * combined with category 12 (typography-led architecture). Wrapped in
 * fog-of-war (category 13) at the page.tsx layer.
 *
 * Brand constraints:
 *   - all copy lowercase, British English
 *   - characters never appear on Pier A or Pier B (kid-zone is Pier C only)
 *   - emoji icon stays as the per-game glyph
 */
export function PierSection({
  pier,
  label,
  shortLabel,
  audience,
  games,
}: PierSectionProps) {
  if (games.length === 0) return null;

  const interestContext = pier === "pier-a" ? "pier-a" : "pier-b-prme";
  const nudge =
    pier === "pier-a"
      ? "many of these tools were built alongside prme faculty → pier b has the classroom versions"
      : "these tools also work in professional settings → pier a is for facilitators";
  const nudgeHref = pier === "pier-a" ? "#pier-b" : "#pier-a";

  return (
    <section
      id={pier}
      aria-label={label}
      className="boardwalk-plank scroll-mt-24 px-4 sm:px-8 py-12 sm:py-16"
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-start gap-6 lg:gap-12">
          {/* ── sign at the head of the pier ───────────────────── */}
          <header className="lg:w-[28%] lg:shrink-0 lg:pt-2">
            <p className="boardwalk-label-sub">{label}</p>
            <h2 className="boardwalk-label">{shortLabel}</h2>
            <p className="mt-3 text-base text-[var(--color-text-on-dark-muted)] leading-relaxed max-w-md">
              {audience}
            </p>
          </header>

          {/* ── the rail of cards along the deck ────────────────── */}
          <div className="flex-1 min-w-0">
            <ul
              role="list"
              className="
                flex gap-4 sm:gap-5
                overflow-x-auto snap-x snap-mandatory
                pb-3 -mb-3
                scrollbar-thin
              "
              style={{
                /* Native scrollbar styling — opt-in for browsers that support it.
                 * Keeps the rail visually clean without hiding the scrollbar
                 * entirely (which would hurt a11y). */
                scrollbarWidth: "thin",
                scrollbarColor:
                  "rgba(255,255,255,0.18) transparent",
              }}
            >
              {games.map((game) => (
                <li
                  key={game.slug}
                  className="
                    snap-start shrink-0
                    w-[18rem] sm:w-[20rem]
                  "
                >
                  <PierCard
                    game={game}
                    interestContext={interestContext}
                  />
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-[var(--color-text-on-dark-muted)] lg:hidden">
              swipe →
            </p>
          </div>
        </div>

        {/* ── cross-pier nudge ───────────────────────────────────── */}
        <footer className="mt-8 lg:mt-12 text-sm text-[var(--color-text-on-dark-muted)]">
          <a
            href={nudgeHref}
            className="underline-offset-4 hover:underline text-[var(--color-text-on-dark)]"
          >
            {nudge}
          </a>
        </footer>
      </div>
    </section>
  );
}

function PierCard({
  game,
  interestContext,
}: {
  game: Game;
  interestContext: "pier-a" | "pier-b-prme";
}) {
  const isLive = game.wave === "wave-1" && game.status === "live";

  return (
    <article
      className={`
        relative h-full rounded-2xl overflow-hidden border p-5 sm:p-6
        flex flex-col justify-between aspect-[5/4]
        ${isLive ? "border-white/10 shadow-lg" : "border-white/5 opacity-85"}
        ${game.image ? "" : `bg-gradient-to-br ${game.color}`}
      `}
    >
      {game.image && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={game.image}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div
            className={`absolute inset-0 ${isLive ? "bg-black/45" : "bg-black/70"}`}
          />
        </>
      )}

      <div className="relative z-10">
        {game.icon ? (
          <span
            className="text-2xl sm:text-3xl block mb-2"
            aria-hidden="true"
          >
            {game.icon}
          </span>
        ) : null}
        <h3 className="text-base sm:text-lg font-bold text-[var(--color-text-on-dark)] tracking-tight mb-1 leading-tight">
          {game.name}
        </h3>
        <p className="text-xs sm:text-sm text-[var(--color-text-on-dark-muted)] leading-snug">
          {game.tagline}
        </p>
      </div>

      <div className="relative z-10 mt-3">
        {isLive ? (
          <a
            href={game.href}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--wv-sienna)] text-[var(--color-text-on-dark)] text-xs sm:text-sm font-semibold hover:brightness-110 transition-all no-underline border border-white/10"
          >
            play now
            <span aria-hidden="true">&rarr;</span>
          </a>
        ) : (
          <div>
            <p className="text-[10px] sm:text-xs uppercase tracking-widest text-[var(--color-text-on-dark-muted)] mb-1.5">
              coming soon
            </p>
            <InterestForm
              context={interestContext}
              appSlug={game.slug}
              placeholder="email me when it&rsquo;s ready"
              cta="notify"
              compact
            />
          </div>
        )}
      </div>
    </article>
  );
}
