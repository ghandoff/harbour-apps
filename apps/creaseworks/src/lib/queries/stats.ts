/**
 * Public stats for the landing page.
 *
 * Session 21: marketing polish — social proof section.
 */

import { sql } from "@/lib/db";
import { unstable_cache } from "next/cache";

export interface PublicStats {
  playdateCount: number;
  materialCount: number;
  reflectionCount: number;
}

async function _getPublicStats(): Promise<PublicStats> {
  const [playdates, materials, reflections] = await Promise.all([
    sql.query(
      `SELECT COUNT(*)::int AS count FROM playdates_cache WHERE status = 'published'`,
    ),
    sql.query(
      `SELECT COUNT(*)::int AS count FROM materials_cache WHERE do_not_use = FALSE`,
    ),
    sql.query(`SELECT COUNT(*)::int AS count FROM runs_cache`),
  ]);

  return {
    playdateCount: playdates.rows[0]?.count ?? 0,
    materialCount: materials.rows[0]?.count ?? 0,
    reflectionCount: reflections.rows[0]?.count ?? 0,
  };
}

export const getPublicStats = unstable_cache(_getPublicStats, ["public-stats"], {
  revalidate: 3600,
});
