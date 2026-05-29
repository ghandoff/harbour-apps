/**
 * Membership queries for the harbour hub account dashboard.
 *
 * Reads the SHARED Neon DB (the same one creaseworks owns) — entitlements,
 * the cross-app packs catalogue, and the reflection-credits ledger. The hub
 * is a read-only consumer here: purchasing and credit-earning stay in the
 * apps that own them (creaseworks). See migrations 001 (base), 038
 * (user-level entitlements), 050 (harbour_commerce: app/product_type), and
 * 028 (reflection credits) in apps/creaseworks/migrations.
 */

import { sql } from "../db";

/** Emails at this domain are winded.vertigo staff — full access, no marketing. */
export const STAFF_EMAIL_DOMAIN = "windedvertigo.com";

/** True when the email belongs to a winded.vertigo staff member. */
export function isStaffEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return email.toLowerCase().trim().split("@")[1] === STAFF_EMAIL_DOMAIN;
}

export interface Pack {
  packCatalogueId: string | null;
  packCacheId: string;
  title: string;
  slug: string | null;
  app: string;
  productType: string;
  priceCents: number | null;
  currency: string;
}

/**
 * Net credit balance for a user: earned (reflection_credits.amount) minus
 * spent (credit_redemptions.credits_spent). Both tables key on a TEXT
 * user_id — the harbour users.id is a UUID, so we pass the stringified id
 * (matching how creaseworks writes these rows).
 */
export async function getCreditBalance(userId: string): Promise<number> {
  const r = await sql.query(
    `SELECT
       COALESCE((SELECT SUM(amount) FROM reflection_credits WHERE user_id = $1), 0)
       - COALESCE((SELECT SUM(credits_spent) FROM credit_redemptions WHERE user_id = $1), 0)
       AS balance`,
    [userId],
  );
  return Number(r.rows[0]?.balance ?? 0);
}

/** Packs the user is currently entitled to (active, non-revoked, unexpired). */
export async function getOwnedPacks(userId: string): Promise<Pack[]> {
  const r = await sql.query(
    `SELECT pcat.id          AS pack_catalogue_id,
            pc.id            AS pack_cache_id,
            pc.title         AS title,
            pc.slug          AS slug,
            COALESCE(pcat.app, 'creaseworks')   AS app,
            COALESCE(pcat.product_type, 'pack') AS product_type,
            pcat.price_cents AS price_cents,
            COALESCE(pcat.currency, 'USD')      AS currency
       FROM entitlements e
       JOIN packs_cache pc        ON pc.id = e.pack_cache_id
       LEFT JOIN packs_catalogue pcat ON pcat.pack_cache_id = e.pack_cache_id
      WHERE e.user_id = $1
        AND e.revoked_at IS NULL
        AND (e.expires_at IS NULL OR e.expires_at > NOW())
      ORDER BY app, title`,
    [userId],
  );
  return r.rows.map(toPack);
}

/**
 * Visible packs across the harbour, optionally excluding ones the user
 * already owns. This is the "what's available" discovery surface.
 */
export async function getAvailablePacks(userId?: string): Promise<Pack[]> {
  const exclusion = userId
    ? `AND NOT EXISTS (
         SELECT 1 FROM entitlements e
          WHERE e.pack_cache_id = pcat.pack_cache_id
            AND e.user_id = $1
            AND e.revoked_at IS NULL
            AND (e.expires_at IS NULL OR e.expires_at > NOW()))`
    : "";
  const r = await sql.query(
    `SELECT pcat.id          AS pack_catalogue_id,
            pc.id            AS pack_cache_id,
            pc.title         AS title,
            pc.slug          AS slug,
            COALESCE(pcat.app, 'creaseworks')   AS app,
            COALESCE(pcat.product_type, 'pack') AS product_type,
            pcat.price_cents AS price_cents,
            COALESCE(pcat.currency, 'USD')      AS currency
       FROM packs_catalogue pcat
       JOIN packs_cache pc ON pc.id = pcat.pack_cache_id
      WHERE pcat.visible = TRUE
        ${exclusion}
      ORDER BY app, title`,
    userId ? [userId] : [],
  );
  return r.rows.map(toPack);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toPack(row: any): Pack {
  return {
    packCatalogueId: row.pack_catalogue_id ?? null,
    packCacheId: row.pack_cache_id,
    title: row.title,
    slug: row.slug ?? null,
    app: row.app,
    productType: row.product_type,
    priceCents: row.price_cents ?? null,
    currency: row.currency ?? "USD",
  };
}

/** A harbour member's profile state (shared `users` columns, no migration). */
export interface HarbourProfile {
  onboardingCompleted: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  playPreferences: Record<string, any> | null;
}

export async function getProfile(userId: string): Promise<HarbourProfile> {
  const r = await sql.query(
    "SELECT onboarding_completed, play_preferences FROM users WHERE id = $1",
    [userId],
  );
  const row = r.rows[0];
  return {
    onboardingCompleted: !!row?.onboarding_completed,
    playPreferences: row?.play_preferences ?? null,
  };
}

/**
 * Mark the profile complete and store preferences. This is the aboard→crew
 * gateway: completing a profile flips `onboarding_completed` and records the
 * role/interests in `play_preferences` (JSONB).
 */
export async function saveProfile(
  userId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  prefs: Record<string, any>,
): Promise<void> {
  await sql.query(
    `UPDATE users
        SET onboarding_completed = TRUE,
            play_preferences = $2::jsonb,
            updated_at = NOW()
      WHERE id = $1`,
    [userId, JSON.stringify(prefs)],
  );
}

/** A single line in the credit ledger — earned or spent. */
export interface CreditEntry {
  createdAt: string;
  delta: number; // +earned, -spent
  label: string;
  kind: "earn" | "spend";
}

/**
 * Recent credit ledger for a user — earns (reflection_credits) and spends
 * (credit_redemptions) interleaved, newest first. Read-only surface for the
 * dashboard; the harbour earn/spend mechanics arrive with the economy phase.
 */
export async function getCreditLedger(
  userId: string,
  limit = 8,
): Promise<CreditEntry[]> {
  const r = await sql.query(
    `SELECT created_at, amount AS delta, reason AS label, 'earn' AS kind
       FROM reflection_credits WHERE user_id = $1
     UNION ALL
     SELECT created_at, -credits_spent AS delta, reward_type AS label, 'spend' AS kind
       FROM credit_redemptions WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [userId, limit],
  );
  return r.rows.map((row) => ({
    createdAt: row.created_at,
    delta: Number(row.delta),
    label: String(row.label ?? ""),
    kind: row.kind as "earn" | "spend",
  }));
}
