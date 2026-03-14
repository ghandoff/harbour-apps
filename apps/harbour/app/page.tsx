import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { GameShowcase, GAMES } from "@/components/game-showcase";
import { CredibilityZone } from "@/components/credibility-zone";
import { ScrollReveal } from "@/components/scroll-reveal";
import { SKILLS } from "@/components/skills-primer";
import credibilityData from "@/data/credibility.json";

export default function HarbourPage() {
  return (
    <>
      <Header />

      <main id="main">
        {/* ── Hero ────────────────────────────────────────────── */}
        <section aria-label="hero" className="min-h-[90vh] flex flex-col items-center justify-center text-center px-6 pt-20">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold tracking-[0.25em] text-[var(--color-accent-on-dark)] mb-6">
              {credibilityData.hero?.tagline ?? "winded.vertigo presents"}
            </p>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-[var(--color-text-on-dark)] leading-[1.1] tracking-tight mb-6">
              {credibilityData.hero?.title ?? "the harbour"}
            </h1>
            <p className="text-lg sm:text-xl text-[var(--color-text-on-dark-muted)] leading-relaxed max-w-xl mx-auto mb-10">
              {credibilityData.hero?.subtitle ?? "playful tools for connection, creativity, and growth."}
            </p>

            {/* Scroll hint */}
            <div className="flex flex-col items-center gap-2 text-[var(--color-text-on-dark-muted)]" aria-hidden="true">
              <span className="text-xs tracking-widest">
                come in
              </span>
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

        {/* ── play. — games and toys ─────────────────────────── */}
        <div id="play">
          <GameShowcase />
        </div>

        {/* ── Skills primer teaser ──────────────────────────────── */}
        <section
          id="skills"
          aria-label="skills primer"
          className="py-20 sm:py-28 px-6"
        >
          <div className="max-w-6xl mx-auto">
            <ScrollReveal>
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-12">
                <div>
                  <p className="text-xs font-semibold tracking-[0.25em] text-[var(--color-accent-on-dark)] mb-3">
                    learn.
                  </p>
                  <h2 className="text-3xl sm:text-4xl font-bold text-[var(--color-text-on-dark)] leading-tight">
                    holistic skills primer
                  </h2>
                  <p className="mt-3 text-[var(--color-text-on-dark-muted)] max-w-md">
                    the relational, somatic, reflective, and generative skills that underpin everything here.
                  </p>
                </div>
                <a
                  href="/skills"
                  className="shrink-0 inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-text-on-dark)] hover:text-[var(--wv-champagne)] transition-colors no-underline"
                >
                  explore all {SKILLS.length} skills →
                </a>
              </div>
            </ScrollReveal>

            {/* Preview: first 3 skills as pill-style teasers */}
            <div className="flex flex-wrap gap-3">
              {SKILLS.slice(0, 6).map((skill) => (
                <ScrollReveal key={skill.slug}>
                  <a
                    href="/skills"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-colors no-underline"
                  >
                    <span className="text-lg leading-none">{skill.icon}</span>
                    <span className="text-sm text-[var(--color-text-on-dark)]">{skill.name}</span>
                  </a>
                </ScrollReveal>
              ))}
              <ScrollReveal>
                <a
                  href="/skills"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition-colors no-underline"
                >
                  <span className="text-sm text-[var(--color-text-on-dark-muted)]">+ {SKILLS.length - 6} more</span>
                </a>
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* ── Credibility zone ─────────────────────────────────── */}
        <CredibilityZone />

        {/* ── Invitation ───────────────────────────────────────── */}
        <section aria-label="invitation" className="py-20 sm:py-28 text-center px-6">
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
