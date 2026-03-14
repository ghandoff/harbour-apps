import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { SkillsPrimer } from "@/components/skills-primer";
import { ScrollReveal } from "@/components/scroll-reveal";

export const metadata = {
  title: "holistic skills primer — the harbour",
  description:
    "a curated primer on the relational, somatic, reflective, and generative skills that underpin meaningful facilitation, play, and human connection.",
};

export default function SkillsPage() {
  return (
    <>
      <Header />

      <main id="main">
        {/* ── Hero ────────────────────────────────────────────── */}
        <section
          aria-label="hero"
          className="min-h-[55vh] flex flex-col items-center justify-center text-center px-6 pt-24 pb-12"
        >
          <div className="max-w-3xl">
            <p className="text-xs font-semibold tracking-[0.25em] text-[var(--color-accent-on-dark)] mb-6">
              the harbour / skills primer
            </p>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-[var(--color-text-on-dark)] leading-[1.1] tracking-tight mb-6">
              holistic skills primer
            </h1>
            <p className="text-lg sm:text-xl text-[var(--color-text-on-dark-muted)] leading-relaxed max-w-xl mx-auto">
              the skills that make play meaningful and connection possible.
              relational. somatic. reflective. generative. each one a door.
            </p>
          </div>
        </section>

        {/* ── Skills grid ─────────────────────────────────────── */}
        <section
          aria-label="skills"
          className="max-w-6xl mx-auto px-6 pb-24"
        >
          <SkillsPrimer />
        </section>

        {/* ── Back link ───────────────────────────────────────── */}
        <ScrollReveal>
          <div className="text-center py-12 px-6">
            <a
              href="/"
              className="text-sm text-[var(--color-text-on-dark-muted)] hover:text-[var(--wv-champagne)] transition-colors no-underline"
            >
              ← back to the harbour
            </a>
          </div>
        </ScrollReveal>
      </main>

      <Footer />
    </>
  );
}
