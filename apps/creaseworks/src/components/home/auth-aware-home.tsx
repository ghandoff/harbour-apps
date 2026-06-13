"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

interface DashboardData {
  credits: number;
  thresholds: Record<string, number>;
  recentRuns: Array<{
    id: string;
    title: string | null;
    run_type: string;
    run_date: string | null;
    playdate_title: string | null;
    playdate_slug: string | null;
  }>;
  galleryItems: Array<{
    id: string;
    thumbnail_key: string | null;
    storage_key: string | null;
    quote_text: string | null;
    playdate_title: string | null;
    user_first_name: string | null;
  }>;
  inventoryIds: string[];
}

/**
 * Renders the authenticated play dashboard when the user is signed in,
 * or null (showing the server-rendered marketing page beneath it) otherwise.
 *
 * Keeping auth detection client-side lets the server component render the
 * logged-out marketing page statically (revalidate = 3600, edge-cacheable),
 * while authenticated users still get their personalised dashboard.
 */
export function AuthAwareHome() {
  const { status } = useSession();
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/harbour/creaseworks/api/dashboard/home")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setData(d))
      .catch(() => null);
  }, [status]);

  if (status !== "authenticated" || !data) return null;

  const { credits, thresholds, recentRuns, galleryItems, inventoryIds } = data;

  const thresholdEntries = [
    { label: "a free sampler PDF", target: thresholds.sampler_pdf },
    { label: "a free playdate", target: thresholds.single_playdate },
    { label: "a free pack", target: thresholds.full_pack },
  ];
  const nextGoal =
    thresholdEntries.find((t) => credits < t.target) ??
    thresholdEntries[thresholdEntries.length - 1];
  const creditsToGo = Math.max(nextGoal.target - credits, 0);
  const matcherHref = inventoryIds.length > 0 ? "/harbour/creaseworks/find?from=workshop" : "/harbour/creaseworks/find";

  return (
    <div
      className="absolute inset-0 min-h-screen z-10"
      style={{ backgroundColor: "var(--wv-cadet)" }}
    >
      <div className="px-5 pt-24 pb-32 sm:pt-28" style={{ maxWidth: 720, margin: "0 auto" }}>

        <section className="text-center mb-10">
          <h1
            className="text-3xl sm:text-4xl font-bold font-serif tracking-tight mb-3"
            style={{ color: "var(--wv-white)" }}
          >
            what should we do today?
          </h1>
          <p className="text-sm mb-6" style={{ color: "var(--color-text-on-dark-muted)" }}>
            {inventoryIds.length > 0
              ? `your workshop has ${inventoryIds.length} material${inventoryIds.length === 1 ? "" : "s"} — let's find something to make.`
              : "tell us what you have on hand and we'll find a playdate."}
          </p>
          <Link
            href={matcherHref}
            className="inline-block rounded-xl px-10 py-4 text-base font-bold transition-all hover:scale-105 active:scale-95"
            style={{
              backgroundColor: "var(--wv-redwood)",
              color: "var(--wv-white)",
              boxShadow: "0 4px 20px rgba(177, 80, 67, 0.3)",
            }}
          >
            find a playdate
          </Link>
        </section>

        {credits > 0 && (
          <section
            className="rounded-xl px-5 py-4 mb-6"
            style={{
              backgroundColor: "rgba(255,235,210,0.06)",
              border: "1px solid rgba(255,235,210,0.08)",
            }}
          >
            <div className="flex items-center gap-3">
              <span
                className="inline-flex items-center justify-center rounded-full font-bold tabular-nums flex-shrink-0"
                style={{
                  width: 36,
                  height: 36,
                  fontSize: credits >= 100 ? "0.65rem" : "0.8rem",
                  backgroundColor: "var(--wv-sienna)",
                  color: "var(--wv-white)",
                }}
              >
                {credits}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium" style={{ color: "var(--wv-champagne)" }}>
                  crease credits
                </p>
                <p className="text-xs" style={{ color: "var(--color-text-on-dark-muted)" }}>
                  {creditsToGo > 0
                    ? `${creditsToGo} more for ${nextGoal.label}`
                    : `you've earned enough for ${nextGoal.label}!`}
                </p>
              </div>
              <Link href="/harbour/creaseworks/profile" className="text-xs font-medium" style={{ color: "var(--wv-sienna)" }}>
                view
              </Link>
            </div>
          </section>
        )}

        {recentRuns.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold" style={{ color: "var(--wv-white)" }}>recent activity</h2>
              <Link href="/harbour/creaseworks/log" className="text-xs font-medium" style={{ color: "var(--wv-sienna)" }}>
                see all
              </Link>
            </div>
            <div className="space-y-2">
              {recentRuns.map((run) => (
                <Link
                  key={run.id}
                  href={run.playdate_slug ? `/harbour/creaseworks/play/${run.playdate_slug}` : "/harbour/creaseworks/log"}
                  className="flex items-center gap-3 rounded-lg px-4 py-3 transition-colors hover:bg-white/5"
                  style={{ backgroundColor: "var(--color-surface-raised)" }}
                >
                  <span
                    className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{
                      backgroundColor:
                        run.run_type === "find_again"
                          ? "rgba(88, 203, 178, 0.15)"
                          : "rgba(203, 120, 88, 0.15)",
                      color:
                        run.run_type === "find_again"
                          ? "var(--wv-seafoam)"
                          : "var(--wv-sienna)",
                    }}
                  >
                    {run.run_type === "find_again" ? "FA" : "R"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: "var(--wv-white)" }}>
                      {run.playdate_title ?? run.title}
                    </p>
                    {run.run_date && (
                      <p className="text-2xs" style={{ color: "var(--color-text-on-dark-muted)" }}>
                        {new Date(run.run_date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {galleryItems.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold" style={{ color: "var(--wv-white)" }}>new in the community</h2>
              <Link href="/harbour/creaseworks/community" className="text-xs font-medium" style={{ color: "var(--wv-sienna)" }}>
                explore
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {galleryItems.map((item) => (
                <Link
                  key={item.id}
                  href="/harbour/creaseworks/community"
                  className="rounded-lg overflow-hidden aspect-square relative group"
                  style={{ backgroundColor: "var(--color-surface-raised)" }}
                >
                  {item.thumbnail_key || item.storage_key ? (
                    <Image
                      src={`/harbour/creaseworks/api/evidence/${item.id}/thumb`}
                      alt={item.playdate_title ? `from ${item.playdate_title}` : "community share"}
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                      sizes="(max-width: 640px) 33vw, 200px"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center p-3">
                      <p
                        className="text-xs text-center line-clamp-4 leading-relaxed"
                        style={{ color: "var(--color-text-on-dark-muted)" }}
                      >
                        {item.quote_text ?? "shared by " + item.user_first_name}
                      </p>
                    </div>
                  )}
                  {item.playdate_title && (
                    <div
                      className="absolute bottom-0 left-0 right-0 px-2 py-1.5"
                      style={{ background: "linear-gradient(transparent, rgba(0,0,0,0.6))" }}
                    >
                      <p className="text-2xs text-white truncate">{item.playdate_title}</p>
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
