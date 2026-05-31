/**
 * Access code queries — campaign-style redeemable codes.
 *
 * Distribution models:
 *   single campaign code  → createCode("PRME2026", "prme-2026", { maxUses: 50, expiresAt: ... })
 *   batch unique codes    → createBatchCodes("prme-2026", 50, { prefix: "PRME", maxUses: 1 })
 *   unlimited/time-only   → createCode("CONF2026", "conf-2026", { expiresAt: endOfConf })
 *
 * Redemption is atomic (SELECT ... FOR UPDATE within a transaction) to
 * prevent use_count races under concurrent load.
 */

import { sql } from "@/lib/db";
import { grantUserEntitlement } from "@/lib/queries/entitlements";

// ── types ────────────────────────────────────────────────────────────────────

export interface AccessCode {
  id: string;
  code: string;
  campaign: string;
  description: string | null;
  created_by: string | null;
  created_at: string;
  expires_at: string | null;
  max_uses: number | null;
  use_count: number;
  revoked_at: string | null;
  /** Pack cache IDs this code grants (populated by list queries). */
  pack_names?: string[];
  /** Redemption count (populated by admin list). */
  redemption_count?: number;
}

export interface RedemptionResult {
  success: boolean;
  /** Present on success — the code that was redeemed. */
  code?: AccessCode;
  /** Present on failure — human-readable reason. */
  error?: "not_found" | "expired" | "limit_reached" | "already_redeemed" | "revoked";
}

export interface CampaignStats {
  campaign: string;
  total_codes: number;
  active_codes: number;
  total_redemptions: number;
  redemptions_this_week: number;
  /** 0–1: fraction of redeeming users with last_active_at > redeemed_at */
  activation_rate: number;
}

// ── helpers ───────────────────────────────────────────────────────────────────

/** Generate a human-readable slug: PREFIX-XXXX-XXXX (uppercase alphanumeric) */
function generateSlug(prefix: string): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // remove ambiguous I, O, 0, 1
  const segment = () =>
    Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `${prefix.toUpperCase()}-${segment()}-${segment()}`;
}

// ── create ────────────────────────────────────────────────────────────────────

export interface CreateCodeOptions {
  maxUses?: number | null;
  expiresAt?: Date | null;
  description?: string;
  packIds?: string[];
}

/**
 * Create a single redeemable code.
 * If `code` is omitted, generates a random slug.
 */
export async function createCode(
  codeStr: string,
  campaign: string,
  createdBy: string,
  opts: CreateCodeOptions = {},
): Promise<AccessCode> {
  const r = await sql.query(
    `INSERT INTO access_codes (code, campaign, description, created_by, expires_at, max_uses)
     VALUES (upper(trim($1)), lower(trim($2)), $3, $4, $5, $6)
     RETURNING *`,
    [
      codeStr,
      campaign,
      opts.description ?? null,
      createdBy,
      opts.expiresAt ?? null,
      opts.maxUses ?? null,
    ],
  );
  const row: AccessCode = r.rows[0];

  if (opts.packIds && opts.packIds.length > 0) {
    await attachPacks(row.id, opts.packIds);
  }
  return row;
}

/**
 * Generate N unique single-use codes for a campaign (batch mode).
 * All codes share the same campaign label and options.
 */
export async function createBatchCodes(
  campaign: string,
  count: number,
  createdBy: string,
  opts: CreateCodeOptions & { prefix?: string } = {},
): Promise<AccessCode[]> {
  const prefix = opts.prefix ?? campaign.toUpperCase().slice(0, 6);
  const codes: AccessCode[] = [];

  for (let i = 0; i < count; i++) {
    let slug = generateSlug(prefix);
    let attempts = 0;
    // Retry on collision (extremely rare)
    while (attempts < 5) {
      try {
        const code = await createCode(slug, campaign, createdBy, {
          ...opts,
          maxUses: opts.maxUses ?? 1, // unique codes default to single-use
        });
        codes.push(code);
        break;
      } catch {
        slug = generateSlug(prefix);
        attempts++;
      }
    }
  }
  return codes;
}

/** Attach packs to a code (replaces existing). */
async function attachPacks(codeId: string, packIds: string[]): Promise<void> {
  for (const packId of packIds) {
    await sql.query(
      `INSERT INTO access_code_packs (code_id, pack_cache_id)
       VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [codeId, packId],
    );
  }
}

// ── validate + redeem ─────────────────────────────────────────────────────────

/**
 * Validate a code and, if valid, grant entitlements to the user.
 *
 * Uses SELECT … FOR UPDATE within a transaction to prevent concurrent
 * over-redemption when multiple users submit the same campaign code simultaneously.
 *
 * Idempotent: if the user has already redeemed this code, returns success
 * without creating duplicate entitlements.
 */
export async function validateAndRedeem(
  codeStr: string,
  userId: string,
): Promise<RedemptionResult> {
  // Wrap in a transaction for atomicity
  await sql.query("BEGIN");
  try {
    // 1. Lock the code row
    const lockResult = await sql.query(
      `SELECT * FROM access_codes
        WHERE upper(code) = upper($1)
          AND revoked_at IS NULL
        FOR UPDATE`,
      [codeStr],
    );

    if (lockResult.rows.length === 0) {
      await sql.query("ROLLBACK");
      return { success: false, error: "not_found" };
    }

    const code: AccessCode = lockResult.rows[0];

    // 2. Check expiry
    if (code.expires_at && new Date(code.expires_at) < new Date()) {
      await sql.query("ROLLBACK");
      return { success: false, error: "expired" };
    }

    // 3. Check use limit
    if (code.max_uses !== null && code.use_count >= code.max_uses) {
      await sql.query("ROLLBACK");
      return { success: false, error: "limit_reached" };
    }

    // 4. Check if user already redeemed this code (idempotency)
    const alreadyRedeemed = await sql.query(
      `SELECT id FROM access_code_redemptions WHERE code_id = $1 AND user_id = $2`,
      [code.id, userId],
    );
    if (alreadyRedeemed.rows.length > 0) {
      // Already redeemed — idempotent success (entitlements already granted)
      await sql.query("ROLLBACK");
      return { success: true, code };
    }

    // 5. Increment use_count
    await sql.query(
      `UPDATE access_codes SET use_count = use_count + 1 WHERE id = $1`,
      [code.id],
    );

    // 6. Log the redemption
    await sql.query(
      `INSERT INTO access_code_redemptions (code_id, user_id) VALUES ($1, $2)`,
      [code.id, userId],
    );

    // 7. Fetch associated packs
    const packsResult = await sql.query(
      `SELECT pack_cache_id FROM access_code_packs WHERE code_id = $1`,
      [code.id],
    );
    const packIds: string[] = packsResult.rows.map((r: { pack_cache_id: string }) => r.pack_cache_id);

    // 8. Grant entitlements (expires when code expires, or never)
    for (const packId of packIds) {
      await grantUserEntitlement(userId, packId, code.expires_at ?? null);
    }

    await sql.query("COMMIT");
    return { success: true, code };
  } catch (err) {
    await sql.query("ROLLBACK");
    throw err;
  }
}

// ── admin queries ─────────────────────────────────────────────────────────────

/** List all active codes, enriched with pack names and redemption counts. */
export async function listAllCodes(): Promise<AccessCode[]> {
  const r = await sql.query(`
    SELECT
      ac.*,
      (SELECT COUNT(*)::int FROM access_code_redemptions acr WHERE acr.code_id = ac.id) AS redemption_count
    FROM access_codes ac
    WHERE ac.revoked_at IS NULL
    ORDER BY ac.created_at DESC
  `);

  const codes: AccessCode[] = r.rows;

  // Batch-fetch pack names
  if (codes.length > 0) {
    const packMap = await batchGetCodePackNames(codes.map((c) => c.id));
    for (const code of codes) {
      code.pack_names = packMap.get(code.id) ?? [];
    }
  }
  return codes;
}

/** List codes for a specific campaign. */
export async function listCodesByCampaign(campaign: string): Promise<AccessCode[]> {
  const r = await sql.query(
    `SELECT ac.*,
            (SELECT COUNT(*)::int FROM access_code_redemptions acr WHERE acr.code_id = ac.id) AS redemption_count
     FROM access_codes ac
     WHERE ac.campaign = lower($1) AND ac.revoked_at IS NULL
     ORDER BY ac.created_at DESC`,
    [campaign],
  );
  return r.rows;
}

/** Revoke a code (soft delete). */
export async function revokeCode(codeId: string): Promise<void> {
  await sql.query(
    `UPDATE access_codes SET revoked_at = NOW() WHERE id = $1`,
    [codeId],
  );
}

/** Per-campaign stats for the analytics dashboard. */
export async function getCampaignStats(): Promise<CampaignStats[]> {
  const r = await sql.query(`
    SELECT
      ac.campaign,
      COUNT(DISTINCT ac.id)::int                                                    AS total_codes,
      COUNT(DISTINCT ac.id) FILTER (
        WHERE ac.revoked_at IS NULL
          AND (ac.expires_at IS NULL OR ac.expires_at > NOW())
      )::int                                                                         AS active_codes,
      COUNT(DISTINCT acr.id)::int                                                   AS total_redemptions,
      COUNT(DISTINCT acr.id) FILTER (
        WHERE acr.redeemed_at >= NOW() - INTERVAL '7 days'
      )::int                                                                         AS redemptions_this_week,
      COALESCE(
        COUNT(DISTINCT acr.user_id) FILTER (WHERE u.last_active_at > acr.redeemed_at)
        ::float / NULLIF(COUNT(DISTINCT acr.user_id), 0),
        0
      )                                                                              AS activation_rate
    FROM access_codes ac
    LEFT JOIN access_code_redemptions acr ON acr.code_id = ac.id
    LEFT JOIN users u ON u.id = acr.user_id
    GROUP BY ac.campaign
    ORDER BY total_redemptions DESC
  `);
  return r.rows;
}

/** Batch-fetch pack names for a list of code IDs. */
async function batchGetCodePackNames(
  codeIds: string[],
): Promise<Map<string, string[]>> {
  if (codeIds.length === 0) return new Map();
  const r = await sql.query(
    `SELECT acp.code_id, pc.title AS pack_title
     FROM access_code_packs acp
     JOIN packs_cache pc ON pc.id = acp.pack_cache_id
     WHERE acp.code_id = ANY($1)
     ORDER BY pc.title ASC`,
    [codeIds],
  );
  const map = new Map<string, string[]>();
  for (const row of r.rows) {
    const arr = map.get(row.code_id) ?? [];
    arr.push(row.pack_title);
    map.set(row.code_id, arr);
  }
  return map;
}
