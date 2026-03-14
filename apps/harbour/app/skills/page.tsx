import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { DepthChart } from "@/components/depth-chart";
import { ScrollReveal } from "@/components/scroll-reveal";

export const metadata = {
  title: "depth.chart — the harbour",
  description:
    "21 social, behavioral, and cognitive skills for navigating complexity, creativity, and connection — charting the skills beneath the surface.",
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
              the harbour / depth.chart
            </p>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-[var(--color-text-on-dark)] leading-[1.1] tracking-tight mb-6">
              depth.chart
            </h1>
            <p className="text-lg sm:text-xl text-[var(--color-text-on-dark-muted)] leading-relaxed max-w-xl mx-auto">
              21 skills across two domains — social & behavioral and
              cognitive — that research shows are essential for navigating
              complexity, uncertainty, and transformation.
            </p>
          </div>
        </section>

        {/* ── Skills grid ─────────────────────────────────────── */}
        <section
          aria-label="skills"
          className="max-w-6xl mx-auto px-6 pb-24"
        >
          <DepthChart />
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
