/**
 * CastParade — the seven material characters as a brand-signature strip.
 *
 * Placed between the hero and the GameDock. Its job is connective tissue:
 * any kid who sees these characters in creaseworks recognises the harbour
 * as their home; any adult understands there is a shared cast behind the
 * tools. The parade does not assign characters to specific apps (too
 * controversial, too premature — naming session is parked) — it just
 * introduces the cast as a collective identity for the whole harbour.
 *
 * Rendering choices:
 *   - Kid register (bright, saturated) on a cream panel nested inside the
 *     dark harbour surface. The panel itself is a visual bridge: "warm
 *     kid-world lives here" without needing any explanatory copy.
 *   - Size 88px — big enough to read SVG detail at arm's length, small
 *     enough to fit 7 across on mobile without wrapping at ≥375px.
 *   - animate={true} — each character's own idle wobble plays, staggered
 *     by the component's internal index so the row never moves in lockstep.
 *   - No names. Current names (Cord/Jugs/Twig/Swatch/Crate/Mud/Drip) are
 *     working placeholders; naming session with the collective is parked.
 *     Publishing names now would commit to them prematurely.
 *
 * Server-safe: CharacterSlot is an inline SVG component with no "use client"
 * directive, so this renders at request time with no hydration cost.
 */

import CharacterSlot, {
  type CharacterName,
} from "@windedvertigo/characters";

const CAST: CharacterName[] = [
  "cord",
  "twig",
  "swatch",
  "jugs",
  "crate",
  "mud",
  "drip",
];

export function CastParade() {
  return (
    <section
      aria-label="the material cast"
      className="py-14 sm:py-20 px-6"
    >
      <div
        className="mx-auto rounded-3xl px-4 sm:px-8 py-8 sm:py-12"
        style={{
          maxWidth: 960,
          background: "var(--wv-cream, #fff6e8)",
          boxShadow:
            "0 1px 0 rgba(255, 255, 255, 0.04), 0 24px 60px -30px rgba(0, 0, 0, 0.45)",
        }}
      >
        <p
          className="text-center mb-6 sm:mb-8"
          style={{
            fontSize: "0.6875rem",
            fontWeight: 700,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "var(--wv-sienna, #cb7858)",
          }}
        >
          the material cast
        </p>
        <div className="grid grid-cols-7 gap-1 sm:gap-3 place-items-center">
          {CAST.map((name) => (
            <div
              key={name}
              className="flex items-center justify-center"
              style={{ width: "100%", aspectRatio: "1 / 1" }}
            >
              <CharacterSlot
                character={name}
                size={88}
                variant="kid"
                animate={true}
              />
            </div>
          ))}
        </div>
        <p
          className="text-center mt-6 sm:mt-8 mx-auto"
          style={{
            fontSize: "0.8125rem",
            lineHeight: 1.6,
            color: "var(--wv-cadet, #273248)",
            opacity: 0.7,
            maxWidth: "42ch",
          }}
        >
          seven ways matter behaves — every tool in the harbour speaks
          their language.
        </p>
      </div>
    </section>
  );
}
