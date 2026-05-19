/**
 * Vault activity queries with tier-based column selection.
 *
 * Access tiers:
 *   teaser       — browsable catalog (name, headline, duration, etc.)
 *   entitled     — Explorer pack ($9.99): full body + materials
 *   practitioner — Practitioner pack ($19.99): + play catalyst prompts + video
 *   internal     — admin/collective: + sync metadata
 */

import { sql } from "@/lib/db";
import { mapVaultRow, mapVaultRows } from "./vault-row";
import {
  columnsToSql,
  VAULT_TEASER_COLUMNS,
  VAULT_PRME_FREE_COLUMNS,
  VAULT_ENTITLED_COLUMNS,
  VAULT_PRACTITIONER_COLUMNS,
  VAULT_INTERNAL_COLUMNS,
} from "@/lib/security/column-selectors";
export type VaultAccessTier = "teaser" | "entitled" | "practitioner" | "internal";

/**
 * Well-known vault pack slugs. These must match the slugs created in
 * the packs Notion database and synced to packs_cache.
 */
const VAULT_PACK_SLUGS = {
  explorer: "vault-explorer",
  practitioner: "vault-practitioner",
} as const;

/**
 * Resolve the highest vault access tier for a user.
 *
 * Internal users (admin / windedvertigo.com team) always get full access.
 * Unauthenticated visitors get teaser — returns before any DB round-trip,
 * so PRME free-access traffic pays zero DB cost here.
 *
 * For authenticated users this used to do up to 3 sequential neon-HTTP
 * queries (pack-id lookup + checkEntitlement(practitioner) + checkEntitlement(explorer)),
 * each ~30–80ms = 90–240ms in DB time alone. We now resolve both packs +
 * their active-entitlement state in a single join, saving 2 round-trips
 * for every signed-in pageview.
 *
 * The query returns one row per active entitlement that matches either
 * vault pack and is owned by the caller's user OR org. We pick the
 * highest tier present (practitioner supersedes explorer) to preserve
 * the previous tier-precedence semantics exactly.
 */
export async function resolveVaultTier(
  orgId: string | null,
  userId: string | null,
  isInternal: boolean,
): Promise<VaultAccessTier> {
  if (isInternal) return "internal";
  if (!orgId && !userId) return "teaser";

  // Single round-trip: join packs_cache → entitlements, filter to the two
  // vault pack slugs, active rows only, owned by this user OR org.
  // The org/user predicates each gate on the parameter being non-null so a
  // missing identifier never matches a row with a NULL on the other side.
  const result = await sql.query(
    `SELECT pc.slug
       FROM packs_cache pc
       JOIN entitlements e ON e.pack_cache_id = pc.id
      WHERE pc.slug IN ($1, $2)
        AND e.revoked_at IS NULL
        AND (e.expires_at IS NULL OR e.expires_at > NOW())
        AND (
          ($3::uuid IS NOT NULL AND e.org_id = $3)
          OR
          ($4::uuid IS NOT NULL AND e.user_id = $4)
        )`,
    [
      VAULT_PACK_SLUGS.explorer,
      VAULT_PACK_SLUGS.practitioner,
      orgId,
      userId,
    ],
  );

  const owned = new Set(result.rows.map((r: { slug: string }) => r.slug));
  if (owned.has(VAULT_PACK_SLUGS.practitioner)) return "practitioner";
  if (owned.has(VAULT_PACK_SLUGS.explorer)) return "entitled";
  return "teaser";
}

function columnsForTier(tier: VaultAccessTier): string {
  switch (tier) {
    case "teaser":
      return columnsToSql(VAULT_TEASER_COLUMNS);
    case "entitled":
      return columnsToSql(VAULT_ENTITLED_COLUMNS);
    case "practitioner":
      return columnsToSql(VAULT_PRACTITIONER_COLUMNS);
    case "internal":
      return columnsToSql(VAULT_INTERNAL_COLUMNS);
  }
}

/**
 * Resolve which content tiers a given access tier can see.
 *
 * Tier hierarchy (cumulative):
 *   teaser       → only "prme" activities
 *   entitled     → "prme" + "explorer"
 *   practitioner → "prme" + "explorer" + "practitioner"
 *   internal     → everything (no filter)
 */
function visibleContentTiers(tier: VaultAccessTier): string[] | null {
  switch (tier) {
    case "teaser":
      return ["prme"];
    case "entitled":
      return ["prme", "explorer"];
    case "practitioner":
    case "internal":
      return null; // no row filter — show all
  }
}

/**
 * List vault activities filtered by both:
 *   1. Column selection (tier-based field visibility)
 *   2. Row filtering (only show activities the user's tier unlocks)
 *
 * Free users see only the 22 PRME activities.
 * Explorer users see PRME + Explorer (47).
 * Practitioner/internal users see all (72).
 */
export async function getVaultActivities(tier: VaultAccessTier) {
  const cols = columnsForTier(tier);
  const allowed = visibleContentTiers(tier);

  if (!allowed) {
    // practitioner / internal → all rows
    const result = await sql.query(
      `SELECT ${cols} FROM vault_activities_cache ORDER BY name ASC`,
    );
    return mapVaultRows(result.rows);
  }

  // Build parameterised IN clause for allowed content tiers
  const placeholders = allowed.map((_, i) => `$${i + 1}`).join(", ");
  const result = await sql.query(
    `SELECT ${cols} FROM vault_activities_cache
     WHERE tier IN (${placeholders})
     ORDER BY name ASC`,
    allowed,
  );
  return mapVaultRows(result.rows);
}

/**
 * Resolve which columns to fetch for a single activity detail view.
 *
 * PRME activities are free content — they always expose body, materials,
 * and materials regardless of the user's access tier. Play catalyst prompts
 * and video walkthroughs remain behind the practitioner paywall.
 *
 * Non-PRME activities use the standard tier-based column selection.
 */
function columnsForDetail(userTier: VaultAccessTier, contentTier: string): string {
  if (contentTier === "prme") {
    // Practitioner/internal already supersede PRME free columns
    if (userTier === "practitioner" || userTier === "internal") {
      return columnsForTier(userTier);
    }
    return columnsToSql(VAULT_PRME_FREE_COLUMNS);
  }
  return columnsForTier(userTier);
}

/**
 * Get a single vault activity by slug.
 * Enforces row-level access: free users can only view PRME activities.
 * Returns null if the activity exists but the user's tier doesn't unlock it.
 *
 * Practitioner/internal users get a single-query fast path since their
 * column set always supersedes PRME free columns. Lower tiers need a
 * two-phase query: first resolve the content tier, then fetch with the
 * appropriate columns (PRME activities get expanded columns for free).
 */
export async function getVaultActivityBySlug(
  slug: string,
  tier: VaultAccessTier,
) {
  const allowed = visibleContentTiers(tier);

  if (!allowed) {
    // Practitioner / internal → no row filter, column set supersedes PRME free.
    // Single query: `tier` is in every column set so we can read it from the result.
    const cols = columnsForTier(tier);
    const result = await sql.query(
      `SELECT ${cols} FROM vault_activities_cache WHERE slug = $1`,
      [slug],
    );
    return result.rows[0] ? mapVaultRow(result.rows[0]) : null;
  }

  // Phase 1: check row access + get content tier
  const meta = await sql.query(
    `SELECT tier FROM vault_activities_cache WHERE slug = $1`,
    [slug],
  );
  const contentTier = meta.rows[0]?.tier as string | undefined;
  if (!contentTier) return null;

  // Row-level check: is this content tier visible to the user?
  if (!allowed.includes(contentTier)) return null;

  // Phase 2: fetch with content-tier-aware columns
  const cols = columnsForDetail(tier, contentTier);
  const result = await sql.query(
    `SELECT ${cols} FROM vault_activities_cache WHERE slug = $1`,
    [slug],
  );
  return result.rows[0] ? mapVaultRow(result.rows[0]) : null;
}

/**
 * Lightweight metadata-only query — fetches just what generateMetadata()
 * needs without column-level access checks. All fields here are teaser-safe.
 */
export async function getVaultActivityMeta(slug: string) {
  const result = await sql.query(
    `SELECT name, headline, cover_r2_key, type, duration, tier, slug
     FROM vault_activities_cache WHERE slug = $1`,
    [slug],
  );
  if (!result.rows[0]) return undefined;
  // Compute cover_url from cover_r2_key — see lib/queries/vault-row.ts
  const mapped = mapVaultRow(result.rows[0]);
  return mapped as {
    name: string;
    headline: string | null;
    cover_url: string | null;
    type: string[];
    duration: string | null;
    tier: string;
    slug: string;
  };
}

/**
 * Look up just the content tier for a slug (no access check).
 * Used by the detail page to redirect gated activities to the
 * correct pack page instead of showing a raw 404.
 */
export async function getActivityContentTier(slug: string): Promise<string | null> {
  const result = await sql.query(
    `SELECT tier FROM vault_activities_cache WHERE slug = $1`,
    [slug],
  );
  return (result.rows[0]?.tier as string) ?? null;
}

/**
 * Count vault activities, optionally filtered by content tier.
 * Used by pack detail pages to show activity counts.
 */
export async function getVaultActivityCount(contentTier?: string) {
  if (contentTier) {
    const result = await sql`
      SELECT COUNT(*)::int AS count FROM vault_activities_cache WHERE tier = ${contentTier}
    `;
    return result.rows[0]?.count ?? 0;
  }
  const result = await sql`SELECT COUNT(*)::int AS count FROM vault_activities_cache`;
  return result.rows[0]?.count ?? 0;
}

/**
 * Get related activities for a vault activity.
 * Returns teaser-level columns (related activities are shown as cards).
 * Enforces row-level access — free users only see related PRME activities.
 */
export async function getRelatedActivities(
  activityId: string,
  tier: VaultAccessTier = "teaser",
) {
  const cols = columnsToSql(VAULT_TEASER_COLUMNS);
  const allowed = visibleContentTiers(tier);

  if (!allowed) {
    // practitioner / internal → show all related
    const result = await sql.query(
      `SELECT ${cols} FROM vault_activities_cache vac
       JOIN vault_related_activities vra ON vra.related_activity_id = vac.id
       WHERE vra.vault_activity_id = $1
       ORDER BY vac.name ASC`,
      [activityId],
    );
    return result.rows;
  }

  // Filter related activities by the user's visible content tiers
  const placeholders = allowed.map((_, i) => `$${i + 2}`).join(", ");
  const result = await sql.query(
    `SELECT ${cols} FROM vault_activities_cache vac
     JOIN vault_related_activities vra ON vra.related_activity_id = vac.id
     WHERE vra.vault_activity_id = $1 AND vac.tier IN (${placeholders})
     ORDER BY vac.name ASC`,
    [activityId, ...allowed],
  );
  return result.rows;
}
