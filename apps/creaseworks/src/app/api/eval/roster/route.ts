/**
 * /api/eval/roster — the anonymous player roster for a group.
 *
 *   GET  ?group=<code>            → { exists, kind, players:[{id,avatar}] }
 *   POST { group, kind, action }  → add / remove a player (avatar)
 *
 * A group row is created on first add (idempotent INSERT OR IGNORE) with
 * the kind from the setup UI. In practice codes are collective-issued;
 * self-serve class-code *creation* (with auth) is out of scope and lives
 * on the harbour unified-auth track. Avatars only — never names (the
 * vocabulary in cw-avatars guarantees no free text reaches the DB).
 *
 * Ships in every flavour; getEvalEnv() returns null without EVAL_DB so
 * prod/mini 404 and expose nothing.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  getEvalEnv,
  normalizeGroupCode,
  GROUP_KINDS,
  type GroupKind,
  ROSTER_MAX_FAMILY,
  ROSTER_MAX_CLASS,
  TOKEN_MAX,
} from "@/lib/eval-server";
import { isValidAvatar } from "@/lib/cw-avatars";

interface PlayerRow {
  id: string;
  avatar: string;
  kind: string;
}

export async function GET(req: NextRequest) {
  const env = getEvalEnv();
  if (!env) return NextResponse.json({ error: "not available" }, { status: 404 });

  const code = normalizeGroupCode(req.nextUrl.searchParams.get("group"));
  if (!code) return NextResponse.json({ error: "valid group required" }, { status: 400 });

  const group = await env.db
    .prepare("SELECT code, kind FROM groups WHERE code = ?")
    .bind(code)
    .first<{ code: string; kind: string }>();

  const players =
    (
      await env.db
        .prepare("SELECT id, avatar, kind FROM players WHERE group_code = ? ORDER BY created_at ASC")
        .bind(code)
        .all<PlayerRow>()
    ).results ?? [];

  return NextResponse.json({
    exists: Boolean(group),
    kind: group?.kind ?? null,
    players,
  });
}

export async function POST(req: NextRequest) {
  const env = getEvalEnv();
  if (!env) return NextResponse.json({ error: "not available" }, { status: 404 });

  const json = (await req.json().catch(() => null)) as {
    group?: unknown;
    kind?: unknown;
    action?: unknown;
    avatar?: unknown;
    id?: unknown;
    playerKind?: unknown;
  } | null;
  if (!json) return NextResponse.json({ error: "json body required" }, { status: 400 });

  const code = normalizeGroupCode(json.group);
  if (!code) return NextResponse.json({ error: "valid group required" }, { status: 400 });

  const action = json.action === "remove" ? "remove" : "add";

  if (action === "remove") {
    const id = typeof json.id === "string" ? json.id.slice(0, TOKEN_MAX) : "";
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    await env.db
      .prepare("DELETE FROM players WHERE id = ? AND group_code = ?")
      .bind(id, code)
      .run();
    return NextResponse.json({ ok: true });
  }

  // add
  const kind: GroupKind = GROUP_KINDS.includes(json.kind as GroupKind)
    ? (json.kind as GroupKind)
    : "family";
  if (!isValidAvatar(json.avatar)) {
    return NextResponse.json({ error: "valid avatar required" }, { status: 400 });
  }
  const avatar = json.avatar;
  const playerKind = json.playerKind === "adult" ? "adult" : "child";

  // create the group on first use (idempotent); keep the original kind if
  // it already exists.
  await env.db
    .prepare("INSERT OR IGNORE INTO groups (code, kind) VALUES (?, ?)")
    .bind(code, kind)
    .run();

  // enforce a roster cap by the group's actual kind
  const grp = await env.db
    .prepare("SELECT kind FROM groups WHERE code = ?")
    .bind(code)
    .first<{ kind: string }>();
  const cap = grp?.kind === "class" ? ROSTER_MAX_CLASS : ROSTER_MAX_FAMILY;

  const existing =
    (
      await env.db
        .prepare("SELECT id, avatar FROM players WHERE group_code = ? ORDER BY created_at ASC")
        .bind(code)
        .all<PlayerRow>()
    ).results ?? [];

  // dedupe: one of each avatar per group, regardless of kind (re-adding is a no-op)
  const already = existing.find((p) => p.avatar === avatar);
  if (already) return NextResponse.json({ ok: true, player: already, players: existing });

  if (existing.length >= cap) {
    return NextResponse.json({ error: "roster full" }, { status: 409 });
  }

  const id = crypto.randomUUID();
  await env.db
    .prepare("INSERT INTO players (id, group_code, avatar, kind) VALUES (?, ?, ?, ?)")
    .bind(id, code, avatar, playerKind)
    .run();

  const player = { id, avatar, kind: playerKind };
  return NextResponse.json({ ok: true, player, players: [...existing, player] });
}
