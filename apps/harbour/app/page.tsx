import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { CredibilityZone } from "@/components/credibility-zone";
import { ScrollReveal } from "@/components/scroll-reveal";
import { CastParade } from "@/components/cast-parade";
import { PierSection } from "@/components/pier-section";
import { PierCTeaser } from "@/components/pier-c-teaser";
import { DrydockWall } from "@/components/drydock-wall";
import {
  fetchGames,
  fetchCredibility,
  type Game,
  type CredibilityData,
} from "@/lib/notion";

/** ISR: revalidate every hour so Notion edits appear without a redeploy. */
export const revalidate = 3600;

const EMPTY_CREDIBILITY: CredibilityData = {
  sectionLabel: "",
  sectionHeading: "",
  credentials: [],
  principles: [],
  bio: null,
  hero: null,
  cta: null,
  connection: null,
};

export default async function HarbourPage() {
  // Tolerant fetches: if Notion is unavailable (stale local token at
  // build time, transient outage at revalidate time), render with empty
  // fallbacks so the page still ships. PIER_MAP/WAVE_MAP in pier-data.ts
  // covers slug→pier mapping; here we just guarantee a valid shape.
  const [games, credibilityData] = await Promise.all([
    fetchGames().catch((err: unknown) => {
      console.warn("[page] fetchGames failed, rendering with empty array:", err);
      return [] as Game[];
    }),
    fetchCredibility().catch((err: unknown) => {
      console.warn(
        "[page] fetchCredibility failed, rendering with defaults:",
        err,
      );
      return EMPTY_CREDIBILITY;
    }),
  ]);

  const pierA = games.filter((g) => g.pier.includes("leadership"));
  const pierB = games.filter((g) => g.pier.includes("classroom"));
  const pierC = games.filter((g) => g.pier.includes("family"));
  const drydock = games.filter(
    (g) => g.pier.length === 0 || g.pier.includes("drydock"),
  );

  return (
    <>
      <Header />

      <main id="main">
        {/* ── Hero ────────────────────────────────────────────── */}
        <section
          aria-label="hero"
          className="min-h-[90vh] flex flex-col items-center justify-center text-center px-6 pt-20"
        >
          <div className="max-w-3xl">
            <p className="text-xs font-semibold tracking-[0.25em] text-[var(--color-accent-on-dark)] mb-6">
              {credibilityData.hero?.tagline ?? "winded.vertigo presents"}
            </p>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-[var(--color-text-on-dark)] leading-[1.1] tracking-tight mb-6">
              {credibilityData.hero?.title ?? "the harbour is open"}
            </h1>
            <p className="text-lg sm:text-xl text-[var(--color-text-on-dark-muted)] leading-relaxed max-w-xl mx-auto mb-6">
              {credibilityData.hero?.subtitle ??
                "three piers, one harbour: tools for facilitators, classrooms, and families."}
            </p>

            <p className="text-sm text-[var(--color-text-on-dark-muted)] mb-10">
              <a href="/harbour/start" className="underline-offset-4 hover:underline">
                not sure where to start?
              </a>
            </p>

            {/* Scroll hint */}
            <div
              className="flex flex-col items-center gap-2 text-[var(--color-text-on-dark-muted)]"
              aria-hidden="true"
            >
              <span className="text-xs tracking-widest">come in</span>
              <svg
                className="w-5 h-5 animate-bounce"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 14l-7 7m0 0l-7-7m7 7V3"
                />
              </svg>
            </div>
          </div>
        </section>

        {/* ── Pier A — leadership ─────────────────────────────── */}
        <PierSection
          pier="pier-a"
          label="pier a — leadership"
          audience="for workplace facilitators, l&d teams, and sustainability professionals. tools you can run with a group on monday morning."
          games={pierA}
        />

        {/* ── Pier B — classroom ──────────────────────────────── */}
        <PierSection
          pier="pier-b"
          label="pier b — classroom"
          audience="for prme faculty, mba educators, and certificate programmes. tools that map onto a syllabus and survive a semester."
          games={pierB}
        />

        {/* ── cast parade — connective tissue into pier c ─────── */}
        <CastParade />

        {/* ── Pier C — family (wave 2 teaser) ─────────────────── */}
        <PierCTeaser games={pierC} />

        {/* ── Drydock — coming-soon micro-apps ────────────────── */}
        <DrydockWall games={drydock} />

        {/* ── Credibility zone ─────────────────────────────────── */}
        <CredibilityZone data={credibilityData} />

        {/* ── Invitation ───────────────────────────────────────── */}
        <section
          aria-label="invitation"
          className="py-20 sm:py-28 text-center px-6"
        >
          <ScrollReveal>
            <div className="max-w-2xl mx-auto">
              <h2 className="text-3xl sm:text-4xl font-bold text-[var(--color-text-on-dark)] mb-4">
                {credibilityData.cta?.heading ?? "ready to play?"}
              </h2>
              <p className="text-[var(--color-text-on-dark-muted)] text-lg">
                {credibilityData.cta?.body ?? "pick a tool and start exploring."}
              </p>
            </div>
          </ScrollReveal>
        </section>
      </main>

      <Footer />
    </>
  );
}
