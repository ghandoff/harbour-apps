import CharacterSlot, { type CharacterName } from "@windedvertigo/characters";
import type { Game } from "@/lib/notion";
import { InterestForm } from "./interest-form";

interface PierCTeaserProps {
  games: Game[];
}

/**
 * Pier C — family play.
 *
 * The only place on the landing where characters appear (per brand
 * rule: kid-facing apps speak in character voice; pro tools don't).
 * Pier C is email-capture only until Wave 2 opens in late June.
 */

const CHARACTER_BY_SLUG: Record<string, CharacterName> = {
  creaseworks: "cord",
  "raft-house": "mud",
  "deep-deck": "swatch",
};

const PREVIEW_ORDER = ["creaseworks", "raft-house", "deep-deck"];

export function PierCTeaser({ games }: PierCTeaserProps) {
  // Surface the three Wave-2 apps in a fixed order so the row reads
  // creaseworks → raft.house → deep.deck regardless of Notion sort.
  const ordered = PREVIEW_ORDER.map((slug) =>
    games.find((g) => g.slug === slug),
  ).filter((g): g is Game => Boolean(g));

  return (
    <section
      id="pier-c"
      aria-label="pier c — family play"
      className="scroll-mt-24 px-6 py-16 sm:py-24"
    >
      <div className="max-w-5xl mx-auto">
        <header className="mb-10 sm:mb-12 text-center">
          <p className="text-xs font-semibold tracking-[0.25em] text-[var(--color-accent-on-dark)] mb-3">
            pier c — family play
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-[var(--color-text-on-dark)] mb-4 tracking-tight">
            opening end of june
          </h2>
          <p className="text-base sm:text-lg text-[var(--color-text-on-dark-muted)] max-w-xl mx-auto leading-relaxed">
            we&rsquo;re co-designing with real kids. join the waitlist and
            we&rsquo;ll write the moment a tool is ready to play with.
          </p>
        </header>

        <div className="max-w-md mx-auto mb-12">
          <InterestForm context="wave-2" placeholder="your email" cta="join the waitlist" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {ordered.map((game) => (
            <PreviewTile key={game.slug} game={game} />
          ))}
        </div>
      </div>
    </section>
  );
}

function PreviewTile({ game }: { game: Game }) {
  const character = CHARACTER_BY_SLUG[game.slug];

  return (
    <article
      className={`relative rounded-2xl overflow-hidden border border-white/5 p-6 flex flex-col aspect-[5/3] ${
        game.image ? "" : `bg-gradient-to-br ${game.color}`
      }`}
    >
      {game.image && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={game.image}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/55" />
        </>
      )}

      <div className="relative z-10 flex items-start justify-between mb-3">
        {character ? (
          <CharacterSlot
            character={character}
            size={52}
            animate={false}
            variant="kid"
          />
        ) : (
          <span aria-hidden="true" />
        )}
        <span className="text-[10px] font-semibold tracking-[0.2em] uppercase rounded-full px-2.5 py-1 bg-white/10 text-[var(--color-text-on-dark)]">
          june
        </span>
      </div>

      <div className="relative z-10 mt-auto">
        <h3 className="text-lg font-bold text-[var(--color-text-on-dark)] tracking-tight mb-1">
          {game.name}
        </h3>
        <p className="text-xs sm:text-sm text-[var(--color-text-on-dark-muted)]">
          {game.tagline}
        </p>
      </div>
    </article>
  );
}
