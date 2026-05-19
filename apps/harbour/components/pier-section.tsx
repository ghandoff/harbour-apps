import type { Game } from "@/lib/notion";
import { InterestForm } from "./interest-form";

type PierId = "pier-a" | "pier-b";

interface PierSectionProps {
  pier: PierId;
  label: string;
  audience: string;
  games: Game[];
}

/**
 * Pier A or Pier B section — professional tone, no character mascots.
 *
 * Renders a 2-col card grid (stacked on mobile). Each card is either:
 *   - live (wave-1 AND status=live) → "play now →" link to game.href
 *   - coming-soon → greyed card with inline email capture
 *
 * Cross-pier nudge in the footer points to the sibling pier.
 */
export function PierSection({ pier, label, audience, games }: PierSectionProps) {
  const interestContext = pier === "pier-a" ? "pier-a" : "pier-b-prme";
  const nudge =
    pier === "pier-a"
      ? "many of these tools were built alongside prme faculty → pier b has the classroom versions"
      : "these tools also work in professional settings → pier a is for facilitators";
  const nudgeHref = pier === "pier-a" ? "#pier-b" : "#pier-a";

  if (games.length === 0) return null;

  return (
    <section
      id={pier}
      aria-label={label}
      className="scroll-mt-24 px-6 py-16 sm:py-20"
    >
      <div className="max-w-5xl mx-auto">
        <header className="mb-10 sm:mb-12">
          <p className="text-xs font-semibold tracking-[0.25em] text-[var(--color-accent-on-dark)] mb-3">
            {label}
          </p>
          <p className="text-lg sm:text-xl text-[var(--color-text-on-dark-muted)] max-w-2xl leading-relaxed">
            {audience}
          </p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {games.map((game) => (
            <PierCard
              key={game.slug}
              game={game}
              interestContext={interestContext}
            />
          ))}
        </div>

        <footer className="mt-10 sm:mt-12 text-sm text-[var(--color-text-on-dark-muted)]">
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
      className={`relative rounded-2xl overflow-hidden border p-6 sm:p-8 flex flex-col justify-between aspect-[5/3] ${
        isLive
          ? "border-white/10 shadow-lg"
          : "border-white/5 opacity-80"
      } ${game.image ? "" : `bg-gradient-to-br ${game.color}`}`}
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
            className={`absolute inset-0 ${isLive ? "bg-black/40" : "bg-black/65"}`}
          />
        </>
      )}

      <div className="relative z-10">
        {game.icon ? (
          <span className="text-3xl sm:text-4xl block mb-3" aria-hidden="true">
            {game.icon}
          </span>
        ) : null}
        <h3 className="text-lg sm:text-xl font-bold text-[var(--color-text-on-dark)] tracking-tight mb-1">
          {game.name}
        </h3>
        <p className="text-xs sm:text-sm text-[var(--color-text-on-dark-muted)] tracking-wider">
          {game.tagline}
        </p>
      </div>

      <div className="relative z-10">
        {isLive ? (
          <a
            href={game.href}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--wv-sienna)] text-[var(--color-text-on-dark)] text-sm font-semibold hover:brightness-110 transition-all no-underline border border-white/10"
          >
            play now
            <span aria-hidden="true">&rarr;</span>
          </a>
        ) : (
          <div>
            <p className="text-xs uppercase tracking-widest text-[var(--color-text-on-dark-muted)] mb-2">
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
