/**
 * POST /api/mini/moderate/suggest  { id }  — the AI pre-screen draft call.
 *
 * Gated by MODERATOR_CODE (x-moderator-code header). For one pending photo:
 * looks at the image + caption + playdate against a moderation rubric,
 * grounded in the collective's recent real decisions (few-shot from
 * moderation_log), and returns a DRAFT { suggestion, reason, tags }. A human
 * still confirms or overrides — this never decides anything.
 *
 * Fail-soft: without ANTHROPIC_API_KEY it returns { configured: false } and the
 * UI stays human-only. Cached in ai_suggestions so each photo is billed once.
 */

import { NextRequest, NextResponse } from "next/server";
import { getMiniEnv, checkModerator } from "@/lib/mini-server";

const MODEL = "claude-sonnet-5";
const TAGS = ["clear child work", "blurry / hard to see", "a face is visible", "off-task", "lovely example"];
const VISION_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

const SYSTEM = `you help the winded.vertigo collective moderate a public "wow wall" of creations that children make in the creaseworks play app. you give ONE draft call that a human then confirms or overrides — you never decide.

the wall celebrates a child's own making. APPROVE when the photo clearly shows a child-made creation, on-task for the playdate, safe and appropriate. lean REJECT (flag for a human) when you see: an identifiable child's face, any personal information (a name, address, a screen showing details), off-task or unrelated content, an empty/blank/accidental shot, or work that looks adult-made rather than the child's.

respond with STRICT JSON only, no prose, no code fence:
{"suggestion":"approve"|"reject","reason":"<under 18 words, plain lowercase>","tags":[<zero or more of exactly: ${TAGS.map((t) => `"${t}"`).join(", ")}>]}`;

export async function POST(req: NextRequest) {
  const env = getMiniEnv();
  if (!env) return NextResponse.json({ error: "not available" }, { status: 404 });
  if (!checkModerator(req.headers.get("x-moderator-code"))) {
    return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  }

  const json = await req.json().catch(() => null);
  const id = typeof json?.id === "string" ? json.id : "";
  if (!/^[0-9a-f-]{36}$/.test(id)) {
    return NextResponse.json({ error: "bad id" }, { status: 400 });
  }

  // serve the cache first — one draft per photo
  const cached = await env.db
    .prepare("SELECT suggestion, reason, tags, model FROM ai_suggestions WHERE evidence_id = ?")
    .bind(id)
    .first<{ suggestion: string; reason: string; tags: string; model: string }>();
  if (cached) {
    return NextResponse.json({
      configured: true,
      cached: true,
      suggestion: cached.suggestion,
      reason: cached.reason,
      tags: safeTags(cached.tags),
    });
  }

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return NextResponse.json({ configured: false });

  const row = await env.db
    .prepare("SELECT r2_key, body, activity_slug FROM evidence WHERE id = ?")
    .bind(id)
    .first<{ r2_key: string | null; body: string | null; activity_slug: string | null }>();
  if (!row) return NextResponse.json({ error: "not found" }, { status: 404 });

  // build the image block (skip vision on formats the API can't take, e.g. heic)
  let imageBlock: unknown = null;
  if (row.r2_key) {
    const obj = await env.evidence.get(row.r2_key);
    const type = obj?.httpMetadata?.contentType ?? "image/jpeg";
    if (obj && VISION_TYPES.has(type)) {
      const b64 = bytesToBase64(await obj.arrayBuffer());
      imageBlock = { type: "image", source: { type: "base64", media_type: type, data: b64 } };
    } else if (obj) {
      // unsupported format — let a human handle it, don't burn a call
      return NextResponse.json({ configured: true, suggestion: null, reason: "can't preview this image format — please review by eye." });
    }
  }

  // few-shot: the collective's recent real decisions ground the model's taste
  const { results: recent } = await env.db
    .prepare(
      `SELECT m.decision, m.reason, m.tags, e.body
       FROM moderation_log m JOIN evidence e ON e.id = m.evidence_id
       ORDER BY m.created_at DESC LIMIT 20`,
    )
    .bind()
    .all<{ decision: string; reason: string | null; tags: string | null; body: string | null }>();
  const examples = recent
    .map((r) => `- the collective chose ${r.decision}${r.body ? ` on a creation captioned "${trim(r.body)}"` : ""}${r.reason ? ` — "${trim(r.reason)}"` : ""}`)
    .join("\n");

  const promptText =
    (examples ? `recent decisions by the collective (learn their taste):\n${examples}\n\n` : "") +
    `now assess this submission.\nplaydate: ${row.activity_slug ?? "unknown"}\nchild's words: ${row.body ? `"${trim(row.body)}"` : "(none)"}\n${imageBlock ? "the photo is attached." : "there is no photo — judge on the words alone."}\n\ngive your draft call as strict JSON.`;

  const content = imageBlock ? [imageBlock, { type: "text", text: promptText }] : [{ type: "text", text: promptText }];

  let parsed: { suggestion: string; reason: string; tags: string[] } | null = null;
  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({ model: MODEL, max_tokens: 300, system: SYSTEM, messages: [{ role: "user", content }] }),
    });
    if (!r.ok) {
      console.error("[moderate/suggest] anthropic error:", r.status, await r.text().catch(() => ""));
      return NextResponse.json({ error: "suggestion failed" }, { status: 502 });
    }
    const data = (await r.json()) as { content?: { text?: string }[] };
    parsed = parseSuggestion(data.content?.[0]?.text ?? "");
  } catch (err) {
    console.error("[moderate/suggest] threw:", err);
    return NextResponse.json({ error: "suggestion failed" }, { status: 502 });
  }
  if (!parsed) return NextResponse.json({ error: "unparseable suggestion" }, { status: 502 });

  // cache — first writer wins if two reviewers open the same card at once
  await env.db
    .prepare("INSERT OR IGNORE INTO ai_suggestions (evidence_id, suggestion, reason, tags, model) VALUES (?, ?, ?, ?, ?)")
    .bind(id, parsed.suggestion, parsed.reason, JSON.stringify(parsed.tags), MODEL)
    .run();

  return NextResponse.json({ configured: true, cached: false, ...parsed });
}

function trim(s: string): string {
  return s.replace(/\s+/g, " ").trim().slice(0, 200);
}

function safeTags(raw: string | null): string[] {
  try {
    const arr = JSON.parse(raw ?? "[]");
    return Array.isArray(arr) ? arr.filter((t) => TAGS.includes(t)) : [];
  } catch {
    return [];
  }
}

/** tolerant JSON extraction — models sometimes wrap the object in prose/fences. */
function parseSuggestion(text: string): { suggestion: string; reason: string; tags: string[] } | null {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const o = JSON.parse(match[0]) as { suggestion?: unknown; reason?: unknown; tags?: unknown };
    const suggestion = o.suggestion === "approve" || o.suggestion === "reject" ? o.suggestion : null;
    if (!suggestion) return null;
    const reason = typeof o.reason === "string" ? o.reason.slice(0, 200) : "";
    const tags = Array.isArray(o.tags) ? o.tags.filter((t): t is string => typeof t === "string" && TAGS.includes(t)) : [];
    return { suggestion, reason, tags };
  } catch {
    return null;
  }
}

function bytesToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(bin);
}
