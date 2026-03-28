import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import {
  getTeaserPlaydateBySlug,
  getTeaserMaterialsForPlaydate,
  getCollectivePlaydateBySlug,
} from "@/lib/queries/playdates";
import { getFirstVisiblePackForPlaydate } from "@/lib/queries/packs";
import { checkEntitlement } from "@/lib/queries/entitlements";
import { getSession } from "@/lib/auth-helpers";
import Image from "next/image";
import EntitledPlaydateView from "@/components/ui/entitled-playdate-view";
import QuickLogButton from "@/components/ui/quick-log-button";
export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function PlaydateTeaserPage({ params }: Props) {
  const { slug } = await params;
  const session = await getSession();

  // ── Internal user → always show full collective view ──
  if (session?.isInternal) {
    const fullPlaydate = await getCollectivePlaydateBySlug(slug);
    if (!fullPlaydate) return notFound();

    const [materials, pack] = await Promise.all([
      getTeaserMaterialsForPlaydate(fullPlaydate.id),
      getFirstVisiblePackForPlaydate(fullPlaydate.id),
    ]);

    // If the playdate IS in a pack, redirect to the pack view
    if (pack) {
      redirect(`/packs/${pack.slug}/playdates/${slug}?from=sampler`);
    }

    return (
      <main className="min-h-screen px-6 py-16 max-w-3xl mx-auto">
        <Link
          href="/sampler"
          className="text-sm text-cadet/50 hover:text-cadet mb-6 inline-block"
        >
          &larr; back to playdates
        </Link>

        {fullPlaydate.cover_url && (
          <div className="relative w-full h-[240px] sm:h-[320px] rounded-xl overflow-hidden bg-cadet/5 mb-6">
            <Image
              src={fullPlaydate.cover_url}
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 768px"
            />
          </div>
        )}

        <h1 className="text-3xl font-semibold tracking-tight mb-4">
          {fullPlaydate.title}
        </h1>

        <EntitledPlaydateView
          playdate={fullPlaydate}
          materials={materials}
          packSlug={null}
        />
      </main>
    );
  }

  // ── Everyone else → sampler teaser path ──
  const playdate = await getTeaserPlaydateBySlug(slug);
  if (!playdate) return notFound();

  const pack = await getFirstVisiblePackForPlaydate(playdate.id);

  // Entitled user WITH a pack → redirect to the pack's playdate page
  if (session && pack) {
    const isEntitled = await checkEntitlement(session.orgId, pack.id, session.userId);
    if (isEntitled) {
      redirect(`/packs/${pack.slug}/playdates/${slug}?from=sampler`);
    }
  }

  // ── Everyone else → sampler teaser ──
  const packHref = pack ? `/packs/${pack.slug}` : "/packs";

  return (
    <main className="min-h-screen px-6 py-16 max-w-3xl mx-auto">
      <Link
        href="/sampler"
        className="text-sm text-cadet/50 hover:text-cadet mb-6 inline-block"
      >
        &larr; back to playdates
      </Link>

      {playdate.cover_url && (
        <div className="relative w-full h-[240px] sm:h-[320px] rounded-xl overflow-hidden bg-cadet/5 mb-6">
          <Image
            src={playdate.cover_url}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 768px"
          />
        </div>
      )}

      <h1 className="text-3xl font-semibold tracking-tight mb-2">
        {playdate.title}
      </h1>

      {playdate.headline && (
        <p className="text-lg text-cadet/60 mb-6">{playdate.headline}</p>
      )}

      {/* ── tile 1: at a glance ── */}
      <section className="rounded-xl border border-cadet/10 bg-champagne/30 p-6 mb-4">
        <h2 className="text-sm font-semibold text-cadet/80 mb-4">
          at a glance
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          {playdate.primary_function && (
            <div className="flex items-start gap-2.5">
              <span className="text-base leading-none mt-px">🎯</span>
              <div>
                <p className="text-cadet/45 text-xs font-medium">what&apos;s it about</p>
                <p className="text-cadet/80">{playdate.primary_function}</p>
              </div>
            </div>
          )}
          {playdate.friction_dial !== null && (
            <div className="flex items-start gap-2.5">
              <span className="text-base leading-none mt-px">🎚️</span>
              <div>
                <p className="text-cadet/45 text-xs font-medium">energy level</p>
                <p className="text-cadet/80">
                  {playdate.friction_dial <= 2
                    ? `chill (${playdate.friction_dial}/5)`
                    : playdate.friction_dial <= 3
                      ? `medium (${playdate.friction_dial}/5)`
                      : `high energy (${playdate.friction_dial}/5)`}
                </p>
              </div>
            </div>
          )}
          {playdate.start_in_120s && (
            <div className="flex items-start gap-2.5">
              <span className="text-base leading-none mt-px">⚡</span>
              <div>
                <p className="text-cadet/45 text-xs font-medium">setup time</p>
                <p className="text-cadet/80">ready in under 2 minutes</p>
              </div>
            </div>
          )}
          {(playdate.arc_emphasis as string[])?.length > 0 && (
            <div className="flex items-start gap-2.5">
              <span className="text-base leading-none mt-px">🌱</span>
              <div>
                <p className="text-cadet/45 text-xs font-medium">what kids practise</p>
                <p className="text-cadet/80">{(playdate.arc_emphasis as string[]).join(", ")}</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── tile 2: the big idea ── */}
      {playdate.rails_sentence && (
        <section className="rounded-xl border border-cadet/10 bg-white p-6 mb-4">
          <h2 className="text-sm font-semibold text-cadet/80 mb-2">
            the big idea
          </h2>
          <p className="text-sm text-cadet/80 italic">
            {playdate.rails_sentence}
          </p>
        </section>
      )}

      {/* ── tiles 3–6: phase rhythm ── */}
      <div className="space-y-3 mb-4">
        {/* tile 3: find */}
        <section className="rounded-xl border border-redwood/15 bg-redwood/5 p-5">
          <h3 className="text-xs font-bold text-redwood tracking-wider mb-1">
            find
          </h3>
          <p className="text-sm text-cadet/70">
            gather your materials and set the stage — this is where curiosity
            gets sparked and the playdate begins to take shape.
          </p>
        </section>

        {/* tile 4: fold */}
        <section className="rounded-xl border border-sienna/15 bg-sienna/5 p-5">
          <h3 className="text-xs font-bold text-sienna tracking-wider mb-1">
            fold
          </h3>
          <p className="text-sm text-cadet/70">
            dive into the hands-on exploration — kids experiment, build,
            and discover through open-ended play with real materials.
          </p>
        </section>

        {/* tile 5: unfold */}
        <section className="rounded-xl border border-cadet/15 bg-cadet/5 p-5">
          <h3 className="text-xs font-bold text-cadet tracking-wider mb-1">
            unfold
          </h3>
          <p className="text-sm text-cadet/70">
            pause and reflect on what happened — notice what kids tried,
            what surprised them, and what they might do differently next time.
          </p>
        </section>

        {/* tile 6: find again (conditional) */}
        {playdate.has_find_again && (
          <section className="rounded-xl border border-redwood/20 bg-redwood/5 p-5">
            <h3 className="text-xs font-bold text-redwood tracking-wider mb-1">
              find again
            </h3>
            <p className="text-sm text-cadet/70">
              carry the idea beyond the playdate — a prompt to spot the same
              concept in everyday life, turning one session into ongoing curiosity.
            </p>
          </section>
        )}
      </div>

      {/* ── full facilitation guide — upsell ── */}
      <section className="rounded-xl border border-sienna/20 bg-gradient-to-b from-champagne/20 to-champagne/5 p-6 mb-8">
        <div className="flex items-start gap-3 mb-4">
          <span className="text-lg leading-none mt-0.5">🔒</span>
          <div>
            <h2 className="text-sm font-semibold text-cadet/80 mb-1">
              full facilitation guide
            </h2>
            <p className="text-sm text-cadet/60">
              unlock the complete playdate with step-by-step facilitation
              for each phase, material swap ideas, timing tips, and
              developmental notes.
            </p>
          </div>
        </div>

        <Link
          href={packHref}
          className="inline-block rounded-lg bg-redwood px-5 py-2.5 text-sm text-white font-medium hover:bg-sienna transition-colors"
        >
          {pack ? `unlock with ${pack.title}` : "see packs"}
        </Link>
      </section>

      {/* quick-log + full reflection CTAs — authenticated users only */}
      {session && (
        <section className="flex flex-wrap items-center gap-3 mb-8">
          <QuickLogButton
            playdateId={playdate.id}
            playdateTitle={playdate.title}
            playdateSlug={slug}
          />
          <Link
            href={`/reflections/new?playdate=${slug}`}
            className="inline-block rounded-lg bg-redwood px-5 py-2.5 text-sm text-white font-medium hover:bg-sienna transition-colors"
          >
            log a reflection
          </Link>
        </section>
      )}
    </main>
  );
}
