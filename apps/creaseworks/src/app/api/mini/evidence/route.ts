/**
 * POST /api/mini/evidence — a family shares what they made.
 *
 * multipart/form-data: code, activitySlug?, body? (the child's words),
 * photo? (jpeg/png/webp/heic ≤ 5MB). At least one of body/photo.
 * Photo goes straight into the MINI_EVIDENCE bucket via the native
 * binding (no presign hop — the worker is the upload path), the row
 * lands in D1 unapproved. Nothing is public until reviewed (the
 * suggestion-box rule from the fruitstand).
 */

import { NextRequest, NextResponse } from "next/server";
import {
  getMiniEnv,
  validateCode,
  MINI_BODY_MAX,
  MINI_PHOTO_MAX,
  MINI_PHOTO_TYPES,
} from "@/lib/mini-server";

export async function POST(req: NextRequest) {
  const env = getMiniEnv();
  if (!env) return NextResponse.json({ error: "not available" }, { status: 404 });

  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "multipart form required" }, { status: 400 });

  const code = String(form.get("code") ?? "").trim().toLowerCase();
  if (!code || !(await validateCode(env.db, code))) {
    return NextResponse.json({ error: "valid family code required" }, { status: 403 });
  }

  const activitySlug = String(form.get("activitySlug") ?? "").slice(0, 64) || null;
  const body = String(form.get("body") ?? "").trim().slice(0, MINI_BODY_MAX) || null;
  const photo = form.get("photo");
  const hasPhoto = photo instanceof File && photo.size > 0;

  if (!body && !hasPhoto) {
    return NextResponse.json({ error: "a photo or some words required" }, { status: 400 });
  }

  let r2Key: string | null = null;
  if (hasPhoto) {
    if (!MINI_PHOTO_TYPES.has(photo.type)) {
      return NextResponse.json({ error: "unsupported image type" }, { status: 400 });
    }
    if (photo.size > MINI_PHOTO_MAX) {
      return NextResponse.json({ error: "photo must be under 5 MB" }, { status: 400 });
    }
    const id = crypto.randomUUID();
    const ext = photo.type === "image/png" ? "png" : photo.type === "image/webp" ? "webp" : photo.type === "image/heic" ? "heic" : "jpg";
    r2Key = `${code}/${id}.${ext}`;
    await env.evidence.put(r2Key, await photo.arrayBuffer(), {
      httpMetadata: { contentType: photo.type },
    });
  }

  const evidenceId = crypto.randomUUID();
  await env.db
    .prepare(
      "INSERT INTO evidence (id, code, activity_slug, r2_key, body) VALUES (?, ?, ?, ?, ?)",
    )
    .bind(evidenceId, code, activitySlug, r2Key, body)
    .run();

  return NextResponse.json({ ok: true, id: evidenceId });
}
