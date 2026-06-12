/**
 * Shared database queries for harbour commerce.
 *
 * Handles Stripe customer linking (user-level and org-level),
 * purchase creation, entitlement granting, and idempotency checks.
 * All queries run against the shared Neon Postgres database.
 */

import { sql } from "./db";

// ── Stripe customer management ──────────────────────────────────────

/**
 * Get or create a Stripe customer for an individual user.
 * Primary linking path for harbour — not everyone belongs to an org.
 */
export async function getUserStripeCustomerId(
  userId: string,
): Promise<string | null> {
  const r = await sql.query(
    "SELECT stripe_customer_id FROM users WHERE id = $1 LIMIT 1",
    [userId],
  );
  return r.rows[0]?.stripe_customer_id ?? null;
}

export async function setUserStripeCustomerId(
  userId: string,
  customerId: string,
): Promise<void> {
  await sql.query(
    "UPDATE users SET stripe_customer_id = $1, updated_at = NOW() WHERE id = $2",
    [customerId, userId],
  );
}

/**
 * Get or create a Stripe customer for an organisation.
 * Secondary linking path for B2B/school purchases.
 */
export async function getOrgStripeCustomerId(
  orgId: string,
): Promise<string | null> {
  const r = await sql.query(
    "SELECT stripe_customer_id FROM organisations WHERE id = $1 LIMIT 1",
    [orgId],
  );
  return r.rows[0]?.stripe_customer_id ?? null;
}

export async function setOrgStripeCustomerId(
  orgId: string,
  customerId: string,
): Promise<void> {
  await sql.query(
    "UPDATE organisations SET stripe_customer_id = $1, updated_at = NOW() WHERE id = $2",
    [customerId, orgId],
  );
}

// ── Purchases ───────────────────────────────────────────────────────

export async function createPurchase(opts: {
  orgId: string | null;
  userId: string;
  packCatalogueId: string;
  amountCents: number;
  currency: string;
  paymentProvider: string;
  paymentRef: string | null;
  stripeSessionId: string | null;
  stripePaymentIntentId: string | null;
  app: string;
}): Promise<string> {
  const result = await sql.query(
    `INSERT INTO purchases
       (org_id, user_id, pack_catalogue_id, purchaser_id, amount_cents, currency,
        payment_provider, payment_ref, status,
        stripe_session_id, stripe_payment_intent_id, app)
     VALUES ($1, $2, $3, $2, $4, $5, $6, $7, 'completed', $8, $9, $10)
     RETURNING id`,
    [
      opts.orgId,
      opts.userId,
      opts.packCatalogueId,
      opts.amountCents,
      opts.currency,
      opts.paymentProvider,
      opts.paymentRef,
      opts.stripeSessionId,
      opts.stripePaymentIntentId,
      opts.app,
    ],
  );
  return result.rows[0].id;
}

export async function getPurchaseByStripeSessionId(
  sessionId: string,
): Promise<{ id: string } | null> {
  const result = await sql.query(
    "SELECT id FROM purchases WHERE stripe_session_id = $1 LIMIT 1",
    [sessionId],
  );
  return result.rows[0] ?? null;
}

// ── Entitlements ────────────────────────────────────────────────────

/**
 * Check whether a user (or their org) has an active entitlement for a pack.
 */
export async function checkEntitlement(
  orgId: string | null,
  packCacheId: string,
  userId?: string | null,
): Promise<boolean> {
  if (!orgId && !userId) return false;

  const result = await sql.query(
    `SELECT 1 FROM entitlements
     WHERE pack_cache_id = $1
       AND revoked_at IS NULL
       AND (expires_at IS NULL OR expires_at > NOW())
       AND (
         (org_id = $2 AND $2 IS NOT NULL)
         OR
         (user_id = $3 AND $3 IS NOT NULL)
       )
     LIMIT 1`,
    [packCacheId, orgId ?? null, userId ?? null],
  );
  return result.rows.length > 0;
}

/**
 * Check whether a user has any active entitlement for a given app.
 */
export async function hasAppAccess(
  userId: string,
  orgId: string | null,
  app: string,
): Promise<boolean> {
  const result = await sql.query(
    `SELECT 1 FROM entitlements e
     JOIN packs_catalogue cat ON cat.pack_cache_id = e.pack_cache_id
     WHERE cat.app = $1
       AND e.revoked_at IS NULL
       AND (e.expires_at IS NULL OR e.expires_at > NOW())
       AND (
         (e.org_id = $2 AND $2 IS NOT NULL)
         OR
         (e.user_id = $3 AND $3 IS NOT NULL)
       )
     LIMIT 1`,
    [app, orgId ?? null, userId],
  );
  return result.rows.length > 0;
}

/**
 * Get all active entitlements for a user across all harbour apps.
 */
export async function getUserEntitlements(
  userId: string,
  orgId: string | null,
) {
  const result = await sql.query(
    `SELECT
       e.id,
       e.pack_cache_id,
       pc.title AS pack_title,
       pc.slug AS pack_slug,
       cat.app,
       cat.product_type,
       e.granted_at,
       e.expires_at
     FROM entitlements e
     JOIN packs_cache pc ON pc.id = e.pack_cache_id
     JOIN packs_catalogue cat ON cat.pack_cache_id = e.pack_cache_id
     WHERE e.revoked_at IS NULL
       AND (e.expires_at IS NULL OR e.expires_at > NOW())
       AND (
         (e.org_id = $1 AND $1 IS NOT NULL)
         OR
         (e.user_id = $2 AND $2 IS NOT NULL)
       )
     ORDER BY cat.app, e.granted_at DESC`,
    [orgId ?? null, userId],
  );
  return result.rows;
}

/**
 * Grant an entitlement to an org for a pack.
 */
export async function grantEntitlement(
  orgId: string,
  packCacheId: string,
  purchaseId?: string | null,
  expiresAt?: string | null,
) {
  await sql.query(
    `INSERT INTO packs_catalogue (pack_cache_id, visible)
     VALUES ($1, false)
     ON CONFLICT (pack_cache_id) DO NOTHING`,
    [packCacheId],
  );

  const existing = await sql.query(
    `UPDATE entitlements
     SET revoked_at = NULL,
         purchase_id = COALESCE($3, entitlements.purchase_id),
         granted_at = COALESCE(entitlements.granted_at, NOW()),
         expires_at = $4
     WHERE org_id = $1
       AND pack_cache_id = $2
       AND user_id IS NULL
     RETURNING id`,
    [orgId, packCacheId, purchaseId || null, expiresAt || null],
  );
  if (existing.rows.length > 0) return existing.rows[0];

  const result = await sql.query(
    `INSERT INTO entitlements (org_id, pack_cache_id, purchase_id, granted_at, expires_at)
     VALUES ($1, $2, $3, NOW(), $4)
     RETURNING id`,
    [orgId, packCacheId, purchaseId || null, expiresAt || null],
  );
  return result.rows[0];
}

/**
 * Grant an entitlement to an individual user for a pack.
 */
/** A tier name (open-ended; per-app ladders define the set). */
export type AccessTier = string;

/** One rung of a per-app tier ladder. `app` undefined = the free floor. */
export interface TierRung {
  tier: string;
  /** app slug whose active entitlement unlocks this rung (else free floor) */
  app?: string;
}

/**
 * Per-app ordered tier ladders (low → high). The first rung is the free floor
 * (no entitlement). Higher rungs unlock by holding an entitlement for `app`.
 * PPCS2026 grants the companion-tier pack (keyed by the app slug), so
 * `hasAppAccess(app)` resolves the companion rung. Future facilitation/LLM tiers
 * slot in as additional rungs with their own (distinct) pack apps — no rework.
 */
export const TIER_LADDERS: Record<string, TierRung[]> = {
  "co-rubric-companion": [
    { tier: "sampler" },
    { tier: "companion", app: "co-rubric-companion" },
  ],
  // other apps are added here as they're gated (read-the-room, lines-become-loops, …)
};

/** The ladder for an app (default: sampler → companion gated by the app's pack). */
function ladderFor(app: string): TierRung[] {
  return TIER_LADDERS[app] ?? [{ tier: "sampler" }, { tier: "companion", app }];
}

/**
 * Resolve a viewer's tier for an app from its ordered ladder.
 *
 * Returns the TOP tier when the global kill-switch is OFF
 * (`HARBOUR_GATE_ENFORCED !== "true"`) or the viewer is internal (collective).
 * Otherwise returns the highest rung whose entitlement the viewer holds
 * (user- or org-level), falling back to the free floor. Signed-out viewers get
 * the floor. The switch lets every app ship its gate dormant until launch.
 */
export async function resolveTier(opts: {
  app: string;
  userId: string | null;
  orgId: string | null;
  isInternal?: boolean;
}): Promise<AccessTier> {
  const ladder = ladderFor(opts.app);
  const top = ladder[ladder.length - 1].tier;
  const floor = ladder[0].tier;

  if (process.env.HARBOUR_GATE_ENFORCED !== "true") return top;
  if (opts.isInternal) return top;
  if (!opts.userId) return floor;

  for (let i = ladder.length - 1; i >= 1; i--) {
    const rung = ladder[i];
    if (rung.app && (await hasAppAccess(opts.userId, opts.orgId, rung.app))) {
      return rung.tier;
    }
  }
  return floor;
}

export async function grantUserEntitlement(
  userId: string,
  packCacheId: string,
  purchaseId?: string | null,
  expiresAt?: string | null,
) {
  await sql.query(
    `INSERT INTO packs_catalogue (pack_cache_id, visible)
     VALUES ($1, false)
     ON CONFLICT (pack_cache_id) DO NOTHING`,
    [packCacheId],
  );

  const existing = await sql.query(
    `UPDATE entitlements
     SET revoked_at = NULL,
         purchase_id = COALESCE($3, entitlements.purchase_id),
         granted_at = COALESCE(entitlements.granted_at, NOW()),
         expires_at = $4
     WHERE user_id = $1
       AND pack_cache_id = $2
       AND org_id IS NULL
     RETURNING id`,
    [userId, packCacheId, purchaseId || null, expiresAt || null],
  );
  if (existing.rows.length > 0) return existing.rows[0];

  const result = await sql.query(
    `INSERT INTO entitlements (user_id, pack_cache_id, granted_at, expires_at)
     VALUES ($1, $2, NOW(), $3)
     RETURNING id`,
    [userId, packCacheId, expiresAt || null],
  );
  return result.rows[0];
}
