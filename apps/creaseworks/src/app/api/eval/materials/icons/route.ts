/**
 * POST /api/eval/materials/icons — B4, Payton uploads 3 bespoke icon
 * candidates for an ACCEPTED material. Each goes into the MATERIAL_ICONS
 * bucket via the native binding; the candidate URLs (served back through
 * /api/eval/materials/icon) land on the submission, status → icons_proposed.
 * The family then picks one (PATCH action=choose).
 *
 * multipart/form-data: id, reviewer?, icon0, icon1, icon2 (image ≤ 512KB each).
 */

import { NextRequest, NextResponse } from "next/server";
import { getEvalEnv } from "@/lib/eval-server";

const ICON_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/svg+xml": "svg",
  "image/webp": "webp",
  "image/jpeg": "jpg",
};
const ICON_MAX = 512 * 1024; // 512KB — icons are small
const SERVE_BASE = "/harbour/creaseworks-eval/api/eval/materials/icon";

export async function POST(req: NextRequest) {
  const env = getEvalEnv();
  if (!env) return NextResponse.json({ error: "not available" }, { status: 404 });
  if (!env.icons) return NextResponse.json({ error: "icon storage not bound" }, { status: 503 });

  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "multipart form required" }, { status: 400 });

  const id = String(form.get("id") ?? "").slice(0, 64);
  // UUID-shaped only — id becomes an R2 key prefix, so reject anything with a
  // slash / traversal before a key is constructed (defence-in-depth; the DB
  // lookup below also gates non-existent ids).
  if (!/^[0-9a-f-]{36}$/.test(id)) return NextResponse.json({ error: "valid id required" }, { status: 400 });

  // only accepted materials may receive icons
  const row = await env.db
    .prepare("SELECT status FROM submitted_materials WHERE id = ?")
    .bind(id)
    .first<{ status: string }>();
  if (!row) return NextResponse.json({ error: "unknown material" }, { status: 404 });
  if (row.status !== "accepted") {
    return NextResponse.json({ error: `material is ${row.status}, not accepted` }, { status: 409 });
  }

  const urls: string[] = [];
  for (let i = 0; i < 3; i++) {
    const f = form.get(`icon${i}`);
    if (!(f instanceof File) || f.size === 0) {
      return NextResponse.json({ error: `icon${i} required (3 candidates)` }, { status: 400 });
    }
    const ext = ICON_TYPES[f.type];
    if (!ext) return NextResponse.json({ error: `icon${i}: unsupported type ${f.type}` }, { status: 400 });
    if (f.size > ICON_MAX) return NextResponse.json({ error: `icon${i} must be under 512KB` }, { status: 400 });
    const key = `${id}/${i}.${ext}`;
    await env.icons.put(key, await f.arrayBuffer(), { httpMetadata: { contentType: f.type } });
    urls.push(`${SERVE_BASE}?key=${encodeURIComponent(key)}`);
  }

  const reviewer = String(form.get("reviewer") ?? "").slice(0, 60) || null;
  await env.db
    .prepare(
      "UPDATE submitted_materials SET icon_candidate_urls = ?, status = 'icons_proposed', accepted_by = COALESCE(?, accepted_by) WHERE id = ? AND status = 'accepted'",
    )
    .bind(JSON.stringify(urls), reviewer, id)
    .run();

  return NextResponse.json({ ok: true, urls });
}
