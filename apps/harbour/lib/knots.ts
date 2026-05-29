import { sql } from "./db";

/**
 * Knots — the harbour engagement currency.
 *
 * Earned through contribution (completing a profile, referrals, testimonials),
 * never through consuming/playing — this protects the intrinsic joy of the
 * tools (the overjustification effect) and keeps the model "regenerative, not
 * extractive". Recognition is delivered as a real, learnable reward: each rank
 * threshold unlocks the tying instructions for a sailing knot.
 *
 * Rank is computed from LIFETIME EARNED (positive deltas), so spending knots
 * later (redemption — a future phase) never demotes a member. Earns expire
 * ~12 months out (a liability guardrail) but still count toward rank.
 */

export interface KnotGuide {
  /** sailing knot name */
  name: string;
  /** what it's good for */
  goodFor: string;
  /** concise, correct tying steps */
  steps: string[];
  /** reputable animated visual guide */
  watch: string;
}

export interface Rank {
  /** cumulative knots earned to reach this rank */
  threshold: number;
  /** playful maritime rank title */
  title: string;
  /** the knot unlocked at this rank (null at deckhand / start) */
  knot: KnotGuide | null;
}

/**
 * The ladder. Thresholds are sensible v1 defaults — tune freely. Each step
 * unlocks one real knot's instructions. (+20 for completing a profile lands a
 * new member straight at the bowline — a fitting first knot.)
 */
export const RANKS: Rank[] = [
  { threshold: 0, title: "deckhand", knot: null },
  {
    threshold: 20,
    title: "apprentice",
    knot: {
      name: "bowline",
      goodFor: "a fixed loop that won't slip or jam — the 'king of knots'.",
      steps: [
        "make a small overhand loop, leaving a long working end.",
        "pass the working end up through the loop (the rabbit comes out of the hole).",
        "take it around behind the standing line (round the tree).",
        "back down through the same loop (and back down the hole).",
        "hold the loop and pull the standing line to tighten.",
      ],
      watch: "https://www.animatedknots.com/bowline-knot",
    },
  },
  {
    threshold: 75,
    title: "bosun",
    knot: {
      name: "clove hitch",
      goodFor: "quickly securing a line to a post, rail, or piling.",
      steps: [
        "wrap the working end around the post.",
        "cross over the standing line and wrap around the post again.",
        "tuck the working end under that second wrap.",
        "pull both ends to tighten.",
      ],
      watch: "https://www.animatedknots.com/clove-hitch-knot-rope-end-method",
    },
  },
  {
    threshold: 150,
    title: "mate",
    knot: {
      name: "figure-eight",
      goodFor: "a stopper that won't run back through a block or fairlead.",
      steps: [
        "make a loop in the line.",
        "pass the working end behind the standing line.",
        "bring it back down through the loop, forming an '8'.",
        "tighten into a neat figure-eight.",
      ],
      watch: "https://www.animatedknots.com/figure-8-knot",
    },
  },
  {
    threshold: 250,
    title: "navigator",
    knot: {
      name: "sheet bend",
      goodFor: "joining two ropes — even of different thickness.",
      steps: [
        "make a bight (a U) in the thicker rope.",
        "pass the thinner end up through the bight.",
        "wrap it around behind both legs of the bight.",
        "tuck it under itself (not under the bight) and tighten.",
      ],
      watch: "https://www.animatedknots.com/sheet-bend-knot",
    },
  },
  {
    threshold: 400,
    title: "skipper",
    knot: {
      name: "cleat hitch",
      goodFor: "making a boat fast to a dock cleat.",
      steps: [
        "take a full turn around the base of the cleat.",
        "lay figure-eights over the horns of the cleat.",
        "finish with a locking hitch (a flipped loop over the horn).",
        "leave it snug, not jammed — it must come free fast.",
      ],
      watch: "https://www.animatedknots.com/cleat-hitch-rope-to-cleat-knot",
    },
  },
  {
    threshold: 600,
    title: "harbourmaster",
    knot: {
      name: "anchor bend",
      goodFor: "attaching a line to an anchor or a ring that takes a load.",
      steps: [
        "take two turns around the ring, keeping them open.",
        "pass the working end behind the standing line and through both turns.",
        "finish with a half hitch around the standing line.",
        "seize or tuck the tail for a long-term hold.",
      ],
      watch: "https://www.animatedknots.com/anchor-bend-knot",
    },
  },
];

export interface RankState {
  earned: number;
  current: Rank;
  unlocked: Rank[]; // ranks with a knot the member has reached
  next: Rank | null; // next rank to reach (null at top)
  toNext: number; // knots until next rank (0 at top)
}

export function rankFor(earned: number): RankState {
  let current = RANKS[0];
  for (const r of RANKS) if (earned >= r.threshold) current = r;
  const unlocked = RANKS.filter((r) => earned >= r.threshold && r.knot);
  const next = RANKS.find((r) => r.threshold > earned) ?? null;
  return {
    earned,
    current,
    unlocked,
    next,
    toNext: next ? next.threshold - earned : 0,
  };
}

/**
 * Award knots. Best-effort and tolerant — a failure (incl. the table not yet
 * existing pre-migration) is logged, never thrown, so it can't break the flow
 * that triggered it. Pass `once: true` for one-time earns (idempotent via the
 * partial unique index on profile_completed).
 */
export async function awardKnots(
  userId: string,
  reason: string,
  amount: number,
  opts: { once?: boolean; meta?: Record<string, unknown>; expiresInMonths?: number } = {},
): Promise<void> {
  const months = opts.expiresInMonths ?? 12;
  const meta = opts.meta ? JSON.stringify(opts.meta) : null;
  const conflict = opts.once
    ? "ON CONFLICT (user_id, reason) WHERE reason IN ('profile_completed') DO NOTHING"
    : "";
  try {
    await sql.query(
      `INSERT INTO harbour_knots (user_id, delta, reason, meta, expires_at)
       VALUES ($1, $2, $3, $4::jsonb, NOW() + make_interval(months => $5::int))
       ${conflict}`,
      [userId, amount, reason, meta, months],
    );
  } catch (err) {
    console.warn("[knots] award failed:", err);
  }
}

/** Current spendable balance (excludes expired). Tolerant → 0. */
export async function getKnotsBalance(userId: string): Promise<number> {
  try {
    const r = await sql.query(
      `SELECT COALESCE(SUM(delta), 0) AS bal
         FROM harbour_knots
        WHERE user_id = $1 AND (expires_at IS NULL OR expires_at > NOW())`,
      [userId],
    );
    return Number(r.rows[0]?.bal ?? 0);
  } catch {
    return 0;
  }
}

/** Lifetime earned (positive deltas) — drives rank. Tolerant → 0. */
export async function getKnotsEarned(userId: string): Promise<number> {
  try {
    const r = await sql.query(
      `SELECT COALESCE(SUM(delta), 0) AS earned
         FROM harbour_knots WHERE user_id = $1 AND delta > 0`,
      [userId],
    );
    return Number(r.rows[0]?.earned ?? 0);
  } catch {
    return 0;
  }
}
