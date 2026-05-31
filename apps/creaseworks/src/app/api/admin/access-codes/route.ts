/**
 * Admin API: /api/admin/access-codes
 *
 * GET    — list all access codes with redemption counts
 * POST   — create one code or a batch of unique codes
 * DELETE — revoke a code by id
 *
 * All routes require admin session (requireAdmin).
 *
 * POST body for a single code:
 * {
 *   code: string          // e.g. "PRME2026" (required unless batch=true)
 *   campaign: string      // e.g. "prme-2026" (required)
 *   description?: string
 *   maxUses?: number | null
 *   expiresInDays?: number | null
 *   packIds?: string[]
 * }
 *
 * POST body for batch unique codes:
 * {
 *   batch: true
 *   count: number         // how many codes to generate (max 500)
 *   prefix?: string       // prefix for generated slugs, e.g. "PRME"
 *   campaign: string
 *   description?: string
 *   expiresInDays?: number | null
 *   packIds?: string[]
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import {
  listAllCodes,
  createCode,
  createBatchCodes,
  revokeCode,
} from "@/lib/queries/access-codes";

/* ── GET: list ──────────────────────────────────────────────────────────── */

export async function GET() {
  await requireAdmin();
  const codes = await listAllCodes();
  return NextResponse.json({ codes });
}

/* ── POST: create ───────────────────────────────────────────────────────── */

export async function POST(req: NextRequest) {
  const session = await requireAdmin();

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const campaign = typeof body.campaign === "string" ? body.campaign.trim().toLowerCase() : "";
  if (!campaign) {
    return NextResponse.json({ error: "campaign is required" }, { status: 400 });
  }

  const expiresAt = body.expiresInDays
    ? new Date(Date.now() + Number(body.expiresInDays) * 86_400_000)
    : null;

  const packIds = Array.isArray(body.packIds)
    ? (body.packIds as string[]).filter((id) => typeof id === "string")
    : [];

  const description = typeof body.description === "string" ? body.description.slice(0, 300) : undefined;

  // ── batch mode ──
  if (body.batch === true) {
    const count = Math.min(500, Math.max(1, Number(body.count) || 1));
    const prefix = typeof body.prefix === "string" ? body.prefix.toUpperCase().slice(0, 8) : undefined;

    const codes = await createBatchCodes(campaign, count, session.userId, {
      prefix,
      maxUses: 1,
      expiresAt,
      packIds,
      description,
    });
    return NextResponse.json({ created: codes.length, codes });
  }

  // ── single code ──
  const codeStr = typeof body.code === "string" ? body.code.trim().toUpperCase() : "";
  if (!codeStr) {
    return NextResponse.json({ error: "code is required (or set batch: true)" }, { status: 400 });
  }

  const maxUses = body.maxUses !== undefined && body.maxUses !== null
    ? Number(body.maxUses)
    : null;

  try {
    const code = await createCode(codeStr, campaign, session.userId, {
      maxUses,
      expiresAt,
      packIds,
      description,
    });
    return NextResponse.json({ created: 1, code });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "failed to create code";
    if (msg.includes("unique") || msg.includes("duplicate")) {
      return NextResponse.json({ error: "code already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/* ── DELETE: revoke ─────────────────────────────────────────────────────── */

export async function DELETE(req: NextRequest) {
  await requireAdmin();

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const codeId = typeof body.id === "string" ? body.id : "";
  if (!codeId) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  await revokeCode(codeId);
  return NextResponse.json({ revoked: true });
}
