import type { Game } from "@/lib/notion";
import { InterestForm } from "./interest-form";

interface DrydockWallProps {
  games: Game[];
}

/**
 * Drydock — threshold-concept micro-apps still being fitted out.
 *
 * Greyed tiles, name + tagline visible, no links. One section-level
 * notify-me form so visitors can opt in to a future wave without
 * having to pick a specific app.
 */
export function DrydockWall({ games }: DrydockWallProps) {
  if (games.length === 0) return null;

  return (
    <section
      id="drydock"
      aria-label="drydock — more vessels being fitted out"
      className="scroll-mt-24 px-6 py-16 sm:py-20"
    >
      <div className="max-w-5xl mx-auto">
        <header className="mb-8 sm:mb-10">
          <p className="text-xs font-semibold tracking-[0.25em] text-[var(--color-accent-on-dark)] mb-3">
            drydock — more vessels being fitted out
          </p>
          <p className="text-base sm:text-lg text-[var(--color-text-on-dark-muted)] max-w-2xl leading-relaxed mb-6">
            threshold-concept micro-apps in development.
          </p>
          <div className="max-w-md">
            <InterestForm
              context="drydock"
              placeholder="your email"
              cta="notify me when new apps open"
            />
          </div>
        </header>

        <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {games.map((game) => (
            <li key={game.slug}>
              <article
                aria-label={`${game.name} (in drydock)`}
                className="rounded-xl border border-white/5 p-4 opacity-40 hover:opacity-60 transition-opacity"
              >
                <h3 className="text-sm font-semibold text-[var(--color-text-on-dark)] tracking-tight mb-1">
                  {game.name}
                </h3>
                <p className="text-xs text-[var(--color-text-on-dark-muted)] leading-relaxed">
                  {game.tagline}
                </p>
              </article>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
