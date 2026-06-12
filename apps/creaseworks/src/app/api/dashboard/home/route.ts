/**
 * GET /api/dashboard/home — all data for the authenticated home dashboard.
 *
 * Replaces the server-side data fetches that previously ran inside the
 * Home page server component. Those fetches made the page dynamic (because
 * getSession() reads cookies) and prevented edge caching of the logged-out
 * marketing page. Moving them here lets the public page stay static while
 * authenticated users get their personalised view via a single fetch.
 */

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { getUserCredits, REDEMPTION_THRESHOLDS } from "@/lib/queries/credits";
import { getRunsForUser } from "@/lib/queries/runs/list-queries";
import { getGalleryEvidence } from "@/lib/queries/gallery";
import { getUserMaterialIds } from "@/lib/queries/user-materials";

export async function GET() {
  const session = await requireAuth();

  const [credits, recentRuns, galleryItems, inventoryIds] = await Promise.all([
    getUserCredits(session.userId),
    getRunsForUser({ userId: session.userId, orgId: session.orgId, isAdmin: session.isAdmin }, 3, 0),
    getGalleryEvidence(3, 0),
    getUserMaterialIds(session.userId),
  ]);

  return NextResponse.json({
    credits,
    thresholds: REDEMPTION_THRESHOLDS,
    recentRuns,
    galleryItems,
    inventoryIds,
  });
}
