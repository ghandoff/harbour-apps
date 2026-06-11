/**
 * Access-code redemption for the harbour hub (the public redemption host).
 *
 * Mirrors apps/creaseworks/src/lib/queries/access-codes.ts but transaction-free:
 * the hub uses the stateless neon() HTTP driver (no BEGIN/COMMIT), so atomicity
 * rests on the `UNIQUE(code_id, user_id)` constraint — a single
 * `INSERT … ON CONFLICT DO NOTHING RETURNING` both claims the redemption and
 * detects a repeat (idempotent). Safe for unlimited/time-bounded codes like
 * PPCS2026 (max_uses NULL); strict-cap codes keep the transactional creaseworks
 * path. Entitlements are granted via the shared @windedvertigo/stripe helper.
 */

import { sql } from "../db";
import { grantUserEntitlement } from "@windedvertigo/stripe";

export interface RedeemResult {
  success: boolean;
  error?: "not_found" | "expired" | "limit_reached";
  alreadyRedeemed?: boolean;
  packCount?: number;
  campaign?: string;
}

export async function validateAndRedeem(
  codeStr: string,
  userId: string,
): Promise<RedeemResult> {
  const code = codeStr.trim();

  const r = await sql.query(
    `SELECT id, campaign, expires_at, max_uses, use_count
       FROM access_codes
      WHERE upper(code) = upper($1) AND revoked_at IS NULL
      LIMIT 1`,
    [code],
  );
  const row = r.rows[0];
  if (!row) return { success: false, error: "not_found" };

  if (row.expires_at && new Date(row.expires_at) < new Date()) {
    return { success: false, error: "expired" };
  }
  if (row.max_uses !== null && row.use_count >= row.max_uses) {
    return { success: false, error: "limit_reached" };
  }

  // Atomic claim: the UNIQUE(code_id,user_id) constraint makes this the
  // double-redemption guard AND the "already redeemed?" check in one statement.
  const claim = await sql.query(
    `INSERT INTO access_code_redemptions (code_id, user_id)
     VALUES ($1, $2)
     ON CONFLICT (code_id, user_id) DO NOTHING
     RETURNING id`,
    [row.id, userId],
  );
  const packIds = await packIdsFor(row.id);

  if (claim.rows.length === 0) {
    // Already redeemed — idempotent success (entitlements already granted).
    return {
      success: true,
      alreadyRedeemed: true,
      packCount: packIds.length,
      campaign: row.campaign,
    };
  }

  await sql.query(
    `UPDATE access_codes SET use_count = use_count + 1 WHERE id = $1`,
    [row.id],
  );

  for (const packId of packIds) {
    // shared signature: (userId, packCacheId, purchaseId, expiresAt) — entitlement
    // expires with the code (no purchase backing a code grant).
    await grantUserEntitlement(userId, packId, null, row.expires_at ?? null);
  }

  return { success: true, packCount: packIds.length, campaign: row.campaign };
}

async function packIdsFor(codeId: string): Promise<string[]> {
  const r = await sql.query(
    `SELECT pack_cache_id FROM access_code_packs WHERE code_id = $1`,
    [codeId],
  );
  return r.rows.map((p: { pack_cache_id: string }) => p.pack_cache_id);
}

// ── rate limiting (redeem_attempts, migration 061) ───────────────────────────
const RATE_WINDOW_MINUTES = 10;
const RATE_MAX_ATTEMPTS = 10;

/** True when `subject` (user id, or ip fallback) has hit the attempt cap. */
export async function tooManyRedeemAttempts(subject: string): Promise<boolean> {
  const r = await sql.query(
    `SELECT COUNT(*)::int AS n FROM redeem_attempts
      WHERE subject = $1
        AND attempted_at > NOW() - INTERVAL '${RATE_WINDOW_MINUTES} minutes'`,
    [subject],
  );
  return (r.rows[0]?.n ?? 0) >= RATE_MAX_ATTEMPTS;
}

/** Record a redemption attempt for rate limiting. Best-effort. */
export async function recordRedeemAttempt(subject: string): Promise<void> {
  try {
    await sql.query(`INSERT INTO redeem_attempts (subject) VALUES ($1)`, [subject]);
  } catch {
    // rate-limit logging is best-effort; never block a redemption on it
  }
}
