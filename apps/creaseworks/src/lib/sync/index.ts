import { syncMaterials } from "./materials";
import { syncPlaydates } from "./playdates";
import { syncCollections } from "./collections";
import { syncPacks } from "./packs";
import { syncRuns } from "./runs";
import { syncCmsPages } from "./cms-pages";
import { syncSiteCopy } from "./site-copy";
import { syncAppConfig } from "./app-config";
import { invalidateCandidateCache } from "@/lib/queries/matcher";

/**
 * Orchestrate the full Notion → Postgres sync.
 *
 * Order matters:
 *   1. materials        — no foreign-key deps
 *   2. playdates        — resolves playdate_materials → materials_cache
 *   3. collections      — resolves collection_playdates → playdates_cache
 *   4. packs            — resolves pack_playdates    → playdates_cache
 *   5. runs             — resolves run_materials    → materials_cache
 *   6. cms pages        — standalone, no foreign-key deps (individual pages)
 *   7. site copy        — standalone, key/value copy blocks
 *   8. app config       — standalone, grouped config items
 *
 * Vault activities sync has been partitioned to vertigo-vault's own
 * /api/cron/sync endpoint (see apps/vertigo-vault/).
 */
export async function syncAll() {
  const t0 = Date.now();
  console.log("[sync] starting full sync…");

  const materialsCount = await syncMaterials();
  const playdatesCount = await syncPlaydates();
  const collectionsCount = await syncCollections();
  const packsCount = await syncPacks();
  const runsCount = await syncRuns();
  const cmsPageCount = await syncCmsPages();
  const siteCopyCount = await syncSiteCopy();
  const appConfigCount = await syncAppConfig();

  // Invalidate matcher cache so new playdates/materials are picked up immediately
  invalidateCandidateCache();

  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`[sync] full sync complete in ${elapsed}s`);

  return { materialsCount, playdatesCount, collectionsCount, packsCount, runsCount, cmsPageCount, siteCopyCount, appConfigCount, elapsedSeconds: elapsed };
}
