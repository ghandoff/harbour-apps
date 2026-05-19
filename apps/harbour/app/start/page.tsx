import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

/**
 * "Who are you?" picker.
 *
 * Public, no auth. Sends visitors to the matching pier anchor on the
 * landing page so the first thing they see is for them.
 */

const OPTIONS: { label: string; href: string; sub: string }[] = [
  {
    label: "i facilitate workshops",
    sub: "team offsites, l&d, sustainability practice — pier a",
    href: "/harbour#pier-a",
  },
  {
    label: "i teach in higher-ed or run a cert series",
    sub: "prme faculty, mba educators, certificate programmes — pier b",
    href: "/harbour#pier-b",
  },
  {
    label: "i'm a parent or play-based educator",
    sub: "kid-facing tools, opening late june — pier c",
    href: "/harbour#pier-c",
  },
];

export default function StartPage() {
  return (
    <>
      <Header />

      <main id="main" className="min-h-[80vh] flex items-center px-6 py-20">
        <div className="max-w-2xl mx-auto w-full">
          <p className="text-xs font-semibold tracking-[0.25em] text-[var(--color-accent-on-dark)] mb-3">
            welcome
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-[var(--color-text-on-dark)] mb-3 tracking-tight">
            who are you?
          </h1>
          <p className="text-base sm:text-lg text-[var(--color-text-on-dark-muted)] mb-10 leading-relaxed">
            pick whichever fits best. you can always wander into another pier
            after.
          </p>

          <ul className="flex flex-col gap-3">
            {OPTIONS.map((option) => (
              <li key={option.href}>
                <a
                  href={option.href}
                  className="block rounded-2xl border border-white/10 p-5 sm:p-6 hover:border-white/30 hover:bg-white/5 transition-colors no-underline"
                >
                  <p className="text-lg sm:text-xl font-semibold text-[var(--color-text-on-dark)] mb-1">
                    {option.label}
                  </p>
                  <p className="text-sm text-[var(--color-text-on-dark-muted)]">
                    {option.sub}
                  </p>
                </a>
              </li>
            ))}
          </ul>

          <p className="mt-10 text-sm text-[var(--color-text-on-dark-muted)]">
            <a href="/harbour" className="underline-offset-4 hover:underline">
              ← back to the harbour
            </a>
          </p>
        </div>
      </main>

      <Footer />
    </>
  );
}
