import Link from "next/link";
import type { Metadata } from "next";
import { getPublicStats } from "@/lib/queries/stats";
import { getCopyForPage } from "@/lib/queries/site-copy";

/**
 * Landing page for creaseworks.
 *
 * Dark theme matching windedvertigo.com design language:
 *   - cadet (#273248) background, white text, #1e2738 card surfaces
 *   - redwood accent, champagne hover, lowercase everything
 *   - layout and integration style matches vertigo-vault
 *
 * Copy is sourced from the Notion "site copy" database via getCopyForPage().
 * Each text element uses a fallback so the page renders identically even
 * before the first sync runs.
 */

export const revalidate = 3600;

export const metadata: Metadata = {
  title: { absolute: "creaseworks — playdates that use what you already have" },
  description:
    "simple, tested playdates for parents, teachers, and kids. notice the world around you, see possibility everywhere, and make things with whatever's on hand.",
  alternates: { canonical: "https://windedvertigo.com/harbour/creaseworks" },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      name: "creaseworks",
      url: "https://windedvertigo.com/harbour/creaseworks",
      description:
        "simple, tested playdates for parents, teachers, and kids. use what you already have.",
      parentOrganization: {
        "@type": "Organization",
        name: "winded vertigo",
        url: "https://windedvertigo.com",
      },
    },
    {
      "@type": "WebSite",
      name: "creaseworks",
      url: "https://windedvertigo.com/harbour/creaseworks",
      potentialAction: {
        "@type": "SearchAction",
        target: "https://windedvertigo.com/harbour/creaseworks/matcher",
        description: "find playdates that match what you have on hand",
      },
    },
  ],
};

export default async function Home() {
  const [stats, c] = await Promise.all([
    getPublicStats(),
    getCopyForPage("landing"),
  ]);

  // JSON-LD is a static schema.org object — safe for serialisation
  const jsonLdHtml = JSON.stringify(jsonLd);

  return (
    <main className="min-h-screen" style={{ backgroundColor: "var(--wv-cadet)" }}>
      {/* structured data — static schema.org, not user content */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdHtml }}
      />

      {/* -- hero ------------------------------------------------- */}
      <section className="px-6 py-28 sm:py-36 text-center" style={{ maxWidth: 1100, margin: "0 auto" }}>
        <p
          className="text-xs font-semibold tracking-widest mb-6"
          style={{ color: "var(--wv-redwood)", letterSpacing: "0.1em" }}
        >
          {c["landing.hero.kicker"]?.copy ?? "a winded.vertigo project"}
        </p>

        <h1
          className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6 leading-tight"
          style={{ color: "var(--wv-white)", maxWidth: 800, margin: "0 auto 24px" }}
        >
          {c["landing.hero.headline"]?.copy ?? "playdates that use what you already have"}
        </h1>

        <p
          className="text-lg sm:text-xl mb-12 leading-relaxed"
          style={{ color: "var(--color-text-on-dark-muted)", maxWidth: 600, margin: "0 auto 48px" }}
        >
          {c["landing.hero.subheading"]?.copy ?? "simple, tested playdates for parents, teachers, and kids. notice the world around you, see possibility everywhere, and make things with whatever\u2019s on hand."}
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/sampler"
            className="inline-block rounded-lg px-8 py-3.5 font-medium transition-colors"
            style={{ backgroundColor: "var(--wv-redwood)", color: "var(--wv-white)" }}
          >
            {c["landing.hero.cta-primary"]?.copy ?? "see free playdates"}
          </Link>
          <Link
            href="/packs"
            className="inline-block rounded-lg px-8 py-3.5 font-medium transition-colors"
            style={{
              border: "1.5px solid rgba(255,255,255,0.25)",
              color: "var(--color-text-on-dark)",
              backgroundColor: "transparent",
            }}
          >
            {c["landing.hero.cta-secondary"]?.copy ?? "get a pack"}
          </Link>
        </div>
      </section>

      {/* -- what you get ----------------------------------------- */}
      <section className="px-6 py-20 sm:py-24" style={{ maxWidth: 1100, margin: "0 auto" }}>
        <p
          className="text-xs font-semibold tracking-widest text-center mb-3"
          style={{ color: "var(--wv-redwood)", letterSpacing: "0.08em" }}
        >
          {c["landing.features.kicker"]?.copy ?? "what\u2019s included"}
        </p>
        <h2
          className="text-2xl sm:text-3xl font-bold tracking-tight mb-4 text-center"
          style={{ color: "var(--wv-white)" }}
        >
          {c["landing.features.headline"]?.copy ?? "everything you need to get started"}
        </h2>
        <p
          className="text-center mb-12"
          style={{ color: "var(--color-text-on-dark-muted)", maxWidth: 560, margin: "0 auto 48px" }}
        >
          {c["landing.features.description"]?.copy ?? "every playdate is a complete package \u2014 not just a concept, but step-by-step instructions so you can jump in right away."}
        </p>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <FeatureCard
            icon={<ScriptIcon />}
            title={c["landing.features.card.1.title"]?.copy ?? "step-by-step guide"}
            description={c["landing.features.card.1.description"]?.copy ?? "a simple three-part playdate you can do in under two hours. clear steps, timing, and tips \u2014 no prep degree needed."}
          />
          <FeatureCard
            icon={<MaterialsIcon />}
            title={c["landing.features.card.2.title"]?.copy ?? "use what you have"}
            description={c["landing.features.card.2.description"]?.copy ?? "every playdate tells you what to grab \u2014 cardboard, tape, sticks, whatever's around. plus easy swaps when you don't have the exact thing."}
          />
          <FeatureCard
            icon={<TransferIcon />}
            title={c["landing.features.card.3.title"]?.copy ?? "find again"}
            description={c["landing.features.card.3.description"]?.copy ?? "the fun part after playing. a prompt that helps you notice the same idea popping up in totally different places."}
          />
          <FeatureCard
            icon={<PdfIcon />}
            title={c["landing.features.card.4.title"]?.copy ?? "printable cards"}
            description={c["landing.features.card.4.description"]?.copy ?? "download any playdate as a handy PDF card. keep it in your bag, stick it on the fridge, or hand it to a babysitter."}
          />
        </div>
      </section>

      {/* -- matcher highlight ------------------------------------- */}
      <section className="px-6 py-16 sm:py-20" style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div
          className="rounded-2xl px-8 py-12 sm:px-12 sm:py-16 text-center"
          style={{ backgroundColor: "rgba(250, 241, 232, 0.06)" }}
        >
          <p
            className="text-xs font-semibold tracking-widest mb-3"
            style={{ color: "var(--wv-sienna)", letterSpacing: "0.08em" }}
          >
            {c["landing.matcher.kicker"]?.copy ?? "free tool"}
          </p>
          <h2
            className="text-2xl sm:text-3xl font-bold tracking-tight mb-4"
            style={{ color: "var(--wv-white)" }}
          >
            {c["landing.matcher.headline"]?.copy ?? "what do you have on hand?"}
          </h2>
          <p
            className="mb-8 leading-relaxed"
            style={{ color: "var(--color-text-on-dark-muted)", maxWidth: 500, margin: "0 auto 32px" }}
          >
            {c["landing.matcher.description"]?.copy ?? "tell us what\u2019s around \u2014 cardboard, sticks, fabric, whatever \u2014 and we\u2019ll instantly match you with playdates that work."}
          </p>
          <Link
            href="/matcher"
            className="inline-block rounded-lg px-8 py-3.5 font-medium transition-colors"
            style={{ backgroundColor: "var(--wv-sienna)", color: "var(--wv-white)" }}
          >
            {c["landing.matcher.cta"]?.copy ?? "try the matcher"}
          </Link>
        </div>
      </section>

      {/* -- how it works ----------------------------------------- */}
      <section className="px-6 py-20 sm:py-24" style={{ maxWidth: 1100, margin: "0 auto" }}>
        <p
          className="text-xs font-semibold tracking-widest text-center mb-3"
          style={{ color: "var(--wv-redwood)", letterSpacing: "0.08em" }}
        >
          {c["landing.how-it-works.kicker"]?.copy ?? "getting started"}
        </p>
        <h2
          className="text-2xl sm:text-3xl font-bold tracking-tight mb-12 text-center"
          style={{ color: "var(--wv-white)" }}
        >
          {c["landing.how-it-works.headline"]?.copy ?? "how it works"}
        </h2>

        <div className="space-y-8" style={{ maxWidth: 640, margin: "0 auto" }}>
          <Step
            number="1"
            title={c["landing.how-it-works.step.1.title"]?.copy ?? "find a playdate"}
            description={c["landing.how-it-works.step.1.description"]?.copy ?? "browse free previews or tell us what you have on hand \u2014 we'll find playdates that work with your stuff."}
          />
          <Step
            number="2"
            title={c["landing.how-it-works.step.2.title"]?.copy ?? "grab a pack"}
            description={c["landing.how-it-works.step.2.description"]?.copy ?? "packs are bundles of playdates. buy once and everyone in your family or classroom gets access forever."}
          />
          <Step
            number="3"
            title={c["landing.how-it-works.step.3.title"]?.copy ?? "play!"}
            description={c["landing.how-it-works.step.3.description"]?.copy ?? "follow the steps, see what happens, and try to find the same idea in the wild. no new toys needed."}
          />
        </div>
      </section>

      {/* -- who it's for ----------------------------------------- */}
      <section className="px-6 py-20 sm:py-24" style={{ maxWidth: 1100, margin: "0 auto" }}>
        <p
          className="text-xs font-semibold tracking-widest text-center mb-3"
          style={{ color: "var(--wv-redwood)", letterSpacing: "0.08em" }}
        >
          {c["landing.who-its-for.kicker"]?.copy ?? "who it\u2019s for"}
        </p>
        <h2
          className="text-2xl sm:text-3xl font-bold tracking-tight mb-12 text-center"
          style={{ color: "var(--wv-white)" }}
        >
          {c["landing.who-its-for.headline"]?.copy ?? "made for kids, parents, teachers, and anyone who likes to make things"}
        </h2>

        <div className="grid gap-5 sm:grid-cols-3" style={{ maxWidth: 900, margin: "0 auto" }}>
          <AudienceCard
            title={c["landing.who-its-for.card.1.title"]?.copy ?? "parents"}
            description={c["landing.who-its-for.card.1.description"]?.copy ?? "play right now with whatever's around. no shopping trip needed."}
          />
          <AudienceCard
            title={c["landing.who-its-for.card.2.title"]?.copy ?? "teachers"}
            description={c["landing.who-its-for.card.2.description"]?.copy ?? "bring hands-on playdates into your classroom. works with any budget and any age."}
          />
          <AudienceCard
            title={c["landing.who-its-for.card.3.title"]?.copy ?? "anyone, really"}
            description={c["landing.who-its-for.card.3.description"]?.copy ?? "babysitters, grandparents, camp counselors, kids on their own \u2014 if you like making things, you'll find something here."}
          />
        </div>
      </section>

      {/* -- social proof stats ----------------------------------- */}
      {(stats.playdateCount > 0 || stats.materialCount > 0) && (
        <section className="px-6 py-16 sm:py-20" style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div className="grid gap-8 sm:grid-cols-3 text-center" style={{ maxWidth: 700, margin: "0 auto" }}>
            {stats.playdateCount > 0 && (
              <div>
                <p
                  className="text-3xl sm:text-4xl font-bold mb-1"
                  style={{ color: "var(--wv-redwood)" }}
                >
                  {stats.playdateCount}
                </p>
                <p className="text-sm" style={{ color: "var(--color-text-on-dark-muted)" }}>
                  {c["landing.stats.playdates"]?.copy ?? "playdates and counting"}
                </p>
              </div>
            )}
            {stats.materialCount > 0 && (
              <div>
                <p
                  className="text-3xl sm:text-4xl font-bold mb-1"
                  style={{ color: "var(--wv-sienna)" }}
                >
                  {stats.materialCount}
                </p>
                <p className="text-sm" style={{ color: "var(--color-text-on-dark-muted)" }}>
                  {c["landing.stats.materials"]?.copy ?? "everyday materials"}
                </p>
              </div>
            )}
            {stats.reflectionCount > 0 && (
              <div>
                <p
                  className="text-3xl sm:text-4xl font-bold mb-1"
                  style={{ color: "var(--wv-champagne)" }}
                >
                  {stats.reflectionCount}
                </p>
                <p className="text-sm" style={{ color: "var(--color-text-on-dark-muted)" }}>
                  {c["landing.stats.reflections"]?.copy ?? "reflections logged"}
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* -- CTA -------------------------------------------------- */}
      <section className="px-6 py-20 sm:py-24 text-center" style={{ maxWidth: 1100, margin: "0 auto" }}>
        <h2
          className="text-2xl sm:text-3xl font-bold tracking-tight mb-4"
          style={{ color: "var(--wv-white)" }}
        >
          {c["landing.cta.headline"]?.copy ?? "start exploring \u2014 it\u2019s free"}
        </h2>
        <p
          className="mb-8 leading-relaxed"
          style={{ color: "var(--color-text-on-dark-muted)", maxWidth: 500, margin: "0 auto 32px" }}
        >
          {c["landing.cta.description"]?.copy ?? "peek at playdates, try the matcher, and see if creaseworks is your kind of thing \u2014 no sign-up needed."}
        </p>
        <Link
          href="/sampler"
          className="inline-block rounded-lg px-8 py-3.5 font-medium transition-colors"
          style={{ backgroundColor: "var(--wv-redwood)", color: "var(--wv-white)" }}
        >
          {c["landing.cta.button"]?.copy ?? "see free playdates"}
        </Link>
      </section>

    </main>
  );
}

/* -- sub-components (co-located) ----------------------------------- */

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div
      className="rounded-xl p-6 transition-all"
      style={{ backgroundColor: "var(--color-surface-raised)" }}
    >
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
        style={{ backgroundColor: "rgba(175,79,65,0.15)", color: "var(--wv-sienna)" }}
      >
        {icon}
      </div>
      <h3 className="text-sm font-bold mb-2" style={{ color: "var(--wv-white)" }}>
        {title}
      </h3>
      <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-on-dark-muted)" }}>
        {description}
      </p>
    </div>
  );
}

function AudienceCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div
      className="rounded-xl p-6 text-center"
      style={{ backgroundColor: "var(--color-surface-raised)" }}
    >
      <h3 className="text-base font-bold mb-2" style={{ color: "var(--wv-white)" }}>
        {title}
      </h3>
      <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-on-dark-muted)" }}>
        {description}
      </p>
    </div>
  );
}

function Step({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-5 items-start">
      <div
        className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
        style={{ backgroundColor: "var(--wv-redwood)", color: "var(--wv-white)" }}
      >
        {number}
      </div>
      <div className="pt-1">
        <h3 className="text-base font-bold mb-1" style={{ color: "var(--wv-white)" }}>
          {title}
        </h3>
        <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-on-dark-muted)" }}>
          {description}
        </p>
      </div>
    </div>
  );
}

/* -- inline SVG icons (brand-matched to w.v colour system) --------- */

function ScriptIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 3h12a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V4a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M6 7h8M6 10h6M6 13h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function MaterialsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="3" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="11" y="3" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="3" y="11" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="14" cy="14" r="3" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function TransferIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 4l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 7h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M6 16l-3-3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M17 13H3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function PdfIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5 2h7l5 5v10a1 1 0 01-1 1H5a1 1 0 01-1-1V3a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M12 2v5h5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M7 12h6M7 15h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
