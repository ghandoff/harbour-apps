import Link from "next/link";
import { BLOOMS_ORDER, BLOOMS_LEVELS } from "@/lib/blooms";

export default function DepthChartHome() {
  return (
    <main id="main" className="min-h-screen flex flex-col">
      {/* hero */}
      <section
        aria-label="hero"
        className="flex-1 flex flex-col items-center justify-center text-center px-6 pt-24 pb-16"
      >
        <div className="max-w-2xl space-y-6">
          <p className="text-xs font-semibold tracking-[0.25em] text-[var(--color-accent-on-dark)]">
            winded.vertigo / depth.chart
          </p>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-[var(--color-text-on-dark)] leading-[1.1] tracking-tight">
            depth.chart
          </h1>
          <p className="text-lg sm:text-xl text-[var(--color-text-on-dark-muted)] leading-relaxed max-w-xl mx-auto">
            generate methodologically sound formative assessment tasks from
            lesson plans and syllabi — grounded in constructive alignment,
            evaluative judgment theory, and psychometric rigor.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <Link
              href="/depth-chart/upload"
              className="inline-block bg-[var(--wv-champagne)] text-[var(--wv-cadet)] font-semibold py-3 px-8 rounded-lg hover:opacity-90 transition-opacity no-underline"
            >
              upload a lesson plan →
            </Link>
            <Link
              href="/depth-chart/plan/history"
              className="inline-block text-sm text-[var(--color-text-on-dark-muted)] hover:text-[var(--wv-champagne)] transition-colors no-underline"
            >
              view plan history
            </Link>
          </div>
        </div>
      </section>

      {/* how it works */}
      <section
        aria-label="how it works"
        className="max-w-4xl mx-auto px-6 pb-24 w-full"
      >
        <h2 className="text-sm font-semibold tracking-[0.2em] text-[var(--color-text-on-dark-muted)] mb-8 text-center">
          how it works
        </h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              step: "1",
              title: "upload",
              desc: "paste or upload your lesson plan, syllabus, or course outline",
            },
            {
              step: "2",
              title: "parse",
              desc: "we extract learning objectives and classify them on Bloom's taxonomy",
            },
            {
              step: "3",
              title: "generate",
              desc: "each objective gets a constructively aligned assessment task with rubric",
            },
            {
              step: "4",
              title: "scaffold",
              desc: "every task includes an evaluative judgment scaffold for student self-assessment",
            },
          ].map((item) => (
            <div
              key={item.step}
              className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-2"
            >
              <span className="text-xs font-bold text-[var(--wv-champagne)]">
                {item.step}
              </span>
              <h3 className="text-sm font-semibold text-[var(--color-text-on-dark)]">
                {item.title}
              </h3>
              <p className="text-xs text-[var(--color-text-on-dark-muted)] leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Bloom's taxonomy reference */}
      <section
        aria-label="bloom's taxonomy"
        className="max-w-4xl mx-auto px-6 pb-24 w-full"
      >
        <h2 className="text-sm font-semibold tracking-[0.2em] text-[var(--color-text-on-dark-muted)] mb-8 text-center">
          cognitive levels
        </h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {BLOOMS_ORDER.map((level) => {
            const info = BLOOMS_LEVELS[level];
            return (
              <div
                key={level}
                className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-1"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: info.color }}
                  />
                  <span className="text-sm font-semibold text-[var(--color-text-on-dark)]">
                    {info.label}
                  </span>
                  <span className="text-[10px] text-[var(--color-text-on-dark-muted)] ml-auto">
                    {info.category}
                  </span>
                </div>
                <p className="text-xs text-[var(--color-text-on-dark-muted)]">
                  {info.description}
                </p>
                <p className="text-[10px] text-[var(--color-text-on-dark-muted)]">
                  {info.example_verbs.slice(0, 4).join(", ")}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* attribution */}
      <footer className="text-center py-8 px-6 text-xs text-[var(--color-text-on-dark-muted)]">
        <p>
          built on constructive alignment (Biggs, 1996), evaluative judgment
          theory (Sadler, 1989), and the six authenticity criteria
          (Baquero-Vargas & Pérez-Salas, 2023).
        </p>
        <p className="mt-2 opacity-50">
          a winded.vertigo project
        </p>
      </footer>
    </main>
  );
}
