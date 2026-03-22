/**
 * Material mastery — aggregate per-user material usage history.
 *
 * Tracks how many times a user has used each material and in which
 * functions. Powers the "function discovery" celebration and badges.
 */

import { sql } from "@/lib/db";

export interface MaterialUsageRecord {
  materialId: string;
  title: string;
  formPrimary: string | null;
  emoji: string | null;
  icon: string | null;
  /** total number of runs using this material */
  totalRuns: number;
  /** distinct functions this material was used as */
  functionsUsed: string[];
}

/**
 * Get a user's material usage history — which materials they've used,
 * how many times, and in which functions.
 */
export async function getUserMaterialMastery(
  userId: string,
): Promise<MaterialUsageRecord[]> {
  const result = await sql.query(
    `WITH usage AS (
       SELECT
         rm.material_id,
         COUNT(DISTINCT rc.id) AS total_runs,
         COALESCE(
           array_agg(DISTINCT (mua.value ->> 'function_used'))
           FILTER (WHERE mua.value ->> 'function_used' IS NOT NULL AND mua.value ->> 'function_used' != ''),
           '{}'
         ) AS functions_used
       FROM run_materials rm
       JOIN runs_cache rc ON rc.id = rm.run_id
       LEFT JOIN LATERAL jsonb_array_elements(rc.materials_used_as) AS mua(value)
         ON (mua.value ->> 'material_id') = rm.material_id::text
       WHERE rc.created_by = $1
       GROUP BY rm.material_id
     )
     SELECT
       u.material_id,
       m.title,
       m.form_primary,
       m.emoji,
       m.icon,
       u.total_runs,
       u.functions_used
     FROM usage u
     JOIN materials_cache m ON m.id = u.material_id
     ORDER BY u.total_runs DESC, m.title ASC`,
    [userId],
  );

  return result.rows.map((row: Record<string, unknown>) => ({
    materialId: row.material_id as string,
    title: row.title as string,
    formPrimary: row.form_primary as string | null,
    emoji: row.emoji as string | null,
    icon: row.icon as string | null,
    totalRuns: parseInt(String(row.total_runs ?? "0"), 10),
    functionsUsed: (row.functions_used as string[]) ?? [],
  }));
}

/**
 * Check if a user is using a material in a new function for the first time.
 * Returns the new functions (if any) that haven't been used before.
 */
export async function getNewFunctionDiscoveries(
  userId: string,
  materialId: string,
  functionUsed: string,
): Promise<boolean> {
  const result = await sql.query(
    `SELECT 1 FROM runs_cache rc
     JOIN run_materials rm ON rm.run_id = rc.id
     CROSS JOIN LATERAL jsonb_array_elements(rc.materials_used_as) AS mua(value)
     WHERE rc.created_by = $1
       AND rm.material_id = $2
       AND (mua.value ->> 'material_id') = $2::text
       AND (mua.value ->> 'function_used') = $3
     LIMIT 1`,
    [userId, materialId, functionUsed],
  );
  return result.rows.length === 0;
}
