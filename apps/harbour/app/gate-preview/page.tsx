/**
 * /harbour/gate-preview — STAFF-ONLY freemium preview hub.
 *
 * Lets a w.v staff member preview every companion app's free/sampler experience
 * — exactly what the PRME public will see once HARBOUR_GATE_ENFORCED flips on —
 * without touching the global switch. Turning preview ON sets the wv_gate_preview
 * cookie; `/api/tier` then returns the sampler for this viewer only, so all five
 * client gates engage just for you. Real visitors stay on full access.
 */

import { getViewer } from "@/lib/viewer";
import { cookies } from "next/headers";
import { GATE_PREVIEW_COOKIE } from "../api/tier/route";
import { GatePreviewLive } from "./gate-preview-live";

export const dynamic = "force-dynamic";

const APPS = [
  { key: "co-rubric-companion", label: "co.rubric",          href: "/harbour/co-rubric-companion",          gated: "saving / exporting the rubric" },
  { key: "read-the-room",       label: "read the room",      href: "/harbour/read-the-room",                gated: "hosting a room (joining stays free)" },
  { key: "lines-become-loops",  label: "lines become loops", href: "/harbour/lines-become-loops/facilitator", gated: "hosting a class session" },
  { key: "values-companion",    label: "values.auction",     href: "/harbour/values-companion",             gated: "limited taster — 2 orgs, 5 values" },
  { key: "cuts-catalogue",      label: "cuts.catalogue",     href: "/harbour/cuts-catalogue",               gated: "limited taster — 12 of 100 moves" },
];

export default async function GatePreviewPage() {
  const viewer = await getViewer();

  if (!viewer.realStaff) {
    return (
      <main id="main" className="min-h-screen px-6 py-12" style={{ background: "linear-gradient(180deg, var(--wv-cadet) 0%, #161e2e 100%)" }}>
        <div className="mx-auto max-w-md space-y-4 text-[var(--color-text-on-dark)]">
          <h1 className="text-2xl font-extrabold">staff only</h1>
          <p className="text-[15px] text-[var(--color-text-on-dark-muted)]">
            this freemium preview is for the winded.vertigo collective. nothing to see here.
          </p>
          <a href="/harbour" className="inline-block text-xs text-[var(--color-text-on-dark-muted)] hover:text-[var(--wv-champagne)]">← back to harbour</a>
        </div>
      </main>
    );
  }

  const jar = await cookies();
  const on = jar.get(GATE_PREVIEW_COOKIE)?.value === "sampler";
  const globalEnforced = process.env.HARBOUR_GATE_ENFORCED === "true";

  return (
    <main id="main" className="min-h-screen px-6 py-12" style={{ background: "linear-gradient(180deg, var(--wv-cadet) 0%, #161e2e 100%)" }}>
      <div className="mx-auto max-w-2xl space-y-7">
        <header className="space-y-2">
          <p className="text-xs font-semibold tracking-[0.3em] text-[var(--color-accent-on-dark)]">the harbour · staff</p>
          <h1 className="text-3xl font-extrabold tracking-tight text-[var(--color-text-on-dark)]">freemium preview</h1>
          <p className="text-[15px] leading-relaxed text-[var(--color-text-on-dark-muted)]">
            see every companion app&rsquo;s free sampler — what the PRME public gets once the gate goes
            live — without flipping the global switch. preview affects <strong>only your browser</strong>;
            real visitors keep full access. auto-clears after 4 hours.
          </p>
        </header>

        {/* toggle */}
        <div
          className="rounded-2xl border p-5 flex items-center justify-between gap-4"
          style={{
            borderColor: on ? "var(--wv-sienna)" : "rgba(255,235,210,0.2)",
            background: on ? "rgba(203,120,88,0.12)" : "rgba(255,235,210,0.05)",
          }}
        >
          <div className="space-y-1">
            <p className="text-sm font-semibold text-[var(--color-text-on-dark)]">
              preview is {on ? "ON — you are seeing samplers" : "off — you see full access"}
            </p>
            <p className="text-xs text-[var(--color-text-on-dark-muted)]">
              {on
                ? "open any app below to walk its free experience."
                : "turn on, then open each app to walk its sampler."}
            </p>
          </div>
          <a
            href={`/harbour/api/tier/preview?mode=${on ? "off" : "on"}`}
            className="shrink-0 inline-flex items-center gap-2 rounded-full px-5 py-3 font-semibold transition-opacity hover:opacity-90"
            style={{
              background: on ? "rgba(255,235,210,0.15)" : "var(--wv-champagne)",
              color: on ? "var(--color-text-on-dark)" : "var(--wv-cadet)",
            }}
          >
            {on ? "turn preview off" : "turn preview on"}
          </a>
        </div>

        {globalEnforced && (
          <p className="text-xs text-[var(--wv-sienna)]">
            note: HARBOUR_GATE_ENFORCED is already <strong>true</strong> globally — the gate is live for
            everyone, not just this preview.
          </p>
        )}

        {/* apps */}
        <section className="space-y-3">
          <h2 className="text-xs font-semibold tracking-[0.2em] uppercase text-[var(--color-text-on-dark-muted)]">
            the five gated apps
          </h2>
          {APPS.map((a) => (
            <div key={a.key} className="rounded-xl border border-[var(--wv-champagne)]/15 bg-[var(--wv-champagne)]/[0.04] p-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <a href={a.href} className="font-semibold text-[var(--color-text-on-dark)] hover:text-[var(--wv-champagne)] truncate">
                    {a.label} <span aria-hidden>↗</span>
                  </a>
                  <GatePreviewLive slug={a.key} />
                </div>
                <p className="text-xs text-[var(--color-text-on-dark-muted)] truncate">sampler gates: {a.gated}</p>
              </div>
            </div>
          ))}
          <p className="text-xs text-[var(--color-text-on-dark-muted)] pt-1">
            regenerative.library is intentionally never gated (pure CC-BY), so it isn&rsquo;t listed.
          </p>
        </section>

        <a href="/harbour" className="inline-block text-xs text-[var(--color-text-on-dark-muted)] hover:text-[var(--wv-champagne)]">← back to harbour</a>
      </div>
    </main>
  );
}
