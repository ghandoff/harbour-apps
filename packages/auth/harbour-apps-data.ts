/**
 * Single source of truth for the harbour-nav app list.
 *
 * Lives in its own React-free module so the build script can serialize
 * it to `harbour-apps.json` (served by the wv-harbour-nav-cdn Worker)
 * without bundling the rest of the nav package. The React HarbourNav
 * uses this array as the SSR / initial-paint fallback and then refreshes
 * from the same JSON at runtime — so a future data change only needs
 * a cdn-worker deploy, not a sweep of every consumer.
 *
 * Order within each pier is the visible order in the drawer.
 */

export type Pier = "launch" | "repairs" | "hidden";

export interface HarbourAppEntry {
  key: string;
  label: string;
  href: string;
  tagline: string;
  accent: string;
  pier: Pier;
  /** When true the item is shown in the drawer but rendered as a non-link
   *  (dimmed, no href, not focusable). Use for coming-soon repairs entries. */
  comingSoon?: boolean;
}

export const HARBOUR_APPS = [
  // ── launch pier — apps currently live on the harbour map ───────
  { key: "vertigo-vault",      label: "vertigo.vault",      href: "/harbour/vertigo-vault",      tagline: "learning activities",            accent: "#43b187", pier: "launch"  },
  { key: "lines-become-loops", label: "lines become loops", href: "/harbour/lines-become-loops", tagline: "systems thinking simulator",     accent: "#6ee7b7", pier: "launch"  },
  { key: "read-the-room",      label: "read the room",      href: "/harbour/read-the-room",      tagline: "a quiet game of interpretation", accent: "#c084fc", pier: "launch"  },
  { key: "values-companion",   label: "values.auction",     href: "/harbour/values-companion",   tagline: "live values game",               accent: "#fbbf24", pier: "launch"  },
  { key: "cuts-catalogue",     label: "cuts.catalogue",     href: "/harbour/cuts-catalogue",     tagline: "editorial pacing tool",          accent: "#fb923c", pier: "launch"  },
  { key: "co-rubric-companion",label: "co.rubric",          href: "/harbour/co-rubric-companion",tagline: "rubric co-design",               accent: "#93c5fd", pier: "launch"  },
  { key: "regenerative-practices-catalogue", label: "regenerative.library", href: "/harbour/regenerative-practices-catalogue", tagline: "open practice library", accent: "#a8c97c", pier: "launch"  },
  // ── repairs pier — on the harbour map, coming soon ─────────────
  { key: "depth-chart",        label: "depth.chart",        href: "/harbour/depth-chart",        tagline: "assessment generator",           accent: "#7dd3fc", pier: "repairs", comingSoon: true },
  { key: "creaseworks",        label: "creaseworks",        href: "/harbour/creaseworks",        tagline: "creative playdates",             accent: "#cb7858", pier: "repairs", comingSoon: true },
  // ── repairs pier — live workers, coming soon to the harbour map ─
  { key: "paper-trail",        label: "paper.trail",        href: "/harbour/paper-trail",        tagline: "physical-digital bridge",        accent: "#ffebd2", pier: "repairs", comingSoon: true },
  { key: "deep-deck",          label: "deep.deck",          href: "/harbour/deep-deck",          tagline: "conversation cards",             accent: "#fcd34d", pier: "repairs", comingSoon: true },
  { key: "raft-house",         label: "raft.house",         href: "/harbour/raft-house",         tagline: "group learning",                 accent: "#58cbb2", pier: "repairs", comingSoon: true },
  { key: "tidal-pool",         label: "tidal.pool",         href: "/harbour/tidal-pool",         tagline: "systems thinking sandbox",       accent: "#d2fdff", pier: "repairs", comingSoon: true },
  { key: "mirror-log",         label: "mirror.log",         href: "/harbour/mirror-log",         tagline: "reflection journal",             accent: "#d5d2ff", pier: "repairs", comingSoon: true },
  { key: "orbit-lab",          label: "orbit.lab",          href: "/harbour/orbit-lab",          tagline: "orbital mechanics",              accent: "#93c5fd", pier: "repairs", comingSoon: true },
  { key: "proof-garden",       label: "proof.garden",       href: "/harbour/proof-garden",       tagline: "mathematical proof",             accent: "#22c55e", pier: "repairs", comingSoon: true },
  { key: "bias-lens",          label: "bias.lens",          href: "/harbour/bias-lens",          tagline: "cognitive bias",                 accent: "#f59e0b", pier: "repairs", comingSoon: true },
  { key: "scale-shift",        label: "scale.shift",        href: "/harbour/scale-shift",        tagline: "powers of ten",                  accent: "#c4b5fd", pier: "repairs", comingSoon: true },
  { key: "pattern-weave",      label: "pattern.weave",      href: "/harbour/pattern-weave",      tagline: "gestalt perception",             accent: "#fda4af", pier: "repairs", comingSoon: true },
  { key: "market-mind",        label: "market.mind",        href: "/harbour/market-mind",        tagline: "opportunity cost",               accent: "#e09878", pier: "repairs", comingSoon: true },
  { key: "rhythm-lab",         label: "rhythm.lab",         href: "/harbour/rhythm-lab",         tagline: "subdivision & groove",           accent: "#ddd6fe", pier: "repairs" },
  { key: "code-weave",         label: "code.weave",         href: "/harbour/code-weave",         tagline: "recursion & abstraction",        accent: "#a5f3fc", pier: "repairs", comingSoon: true },
  { key: "time-prism",         label: "time.prism",         href: "/harbour/time-prism",         tagline: "historical empathy",             accent: "#fde68a", pier: "repairs", comingSoon: true },
  { key: "liminal-pass",       label: "liminal.pass",       href: "/harbour/liminal-pass",       tagline: "threshold concepts",             accent: "#fca5a5", pier: "repairs", comingSoon: true },
  { key: "emerge-box",         label: "emerge.box",         href: "/harbour/emerge-box",         tagline: "cellular automata",              accent: "#86efac", pier: "repairs", comingSoon: true },
] as const satisfies readonly HarbourAppEntry[];

export type HarbourAppKey = (typeof HARBOUR_APPS)[number]["key"];
