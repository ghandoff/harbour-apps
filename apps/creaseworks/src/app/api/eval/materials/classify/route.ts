/**
 * POST /api/eval/materials/classify  { id, reviewer }  — the material dials
 * pre-screen (P1.5).
 *
 * For one pending submission, drafts its "dials" from the title + description:
 *   • form_primary — one of the material form categories,
 *   • loud_quiet   — a playful sensory read,
 *   • affords      — a few Layer-B verbs it can DO.
 * A human on the review dashboard confirms or edits before accept — this only
 * DRAFTS. Cached in submitted_materials.ai_dials so each material is billed once.
 *
 * Gated the same way material review is (a collective reviewer name). Fail-soft:
 * without ANTHROPIC_API_KEY it returns { configured: false } and the dashboard
 * stays human-only. Uses Haiku — a tiny title+caption call, kept cheap.
 */

import { NextRequest, NextResponse } from "next/server";
import { getEvalEnv, isCollective } from "@/lib/eval-server";
import { MATERIAL_FORMS, MATERIAL_VERBS } from "@/lib/cw-materials";

const MODEL = "claude-haiku-4-5-20251001";
const FORMS = MATERIAL_FORMS as readonly string[];
const VERBS = MATERIAL_VERBS as readonly string[];

const SYSTEM = `you help the winded.vertigo collective sort kid-found "loose parts" materials for a children's making app. given a material's name (and maybe a short note), draft three dials that a human then confirms or overrides — you never decide.

1. form — the ONE closest category from exactly: ${FORMS.map((f) => `"${f}"`).join(", ")}.
2. loud_quiet — a playful sensory read: "loud" (clattery, shiny, attention-grabbing) or "quiet" (soft, muted, calm). pick one.
3. affords — 2 to 4 verbs for what a child could DO with it, from exactly: ${VERBS.map((v) => `"${v}"`).join(", ")}.

respond with STRICT JSON only, no prose, no code fence:
{"form_primary":"<one form>","loud_quiet":"loud"|"quiet","affords":[<2-4 verbs>],"reason":"<under 18 words, plain lowercase>"}`;

export async function POST(req: NextRequest) {
  const env = getEvalEnv();
  if (!env) return NextResponse.json({ error: "not available" }, { status: 404 });

  const json = await req.json().catch(() => null);
  const reviewer = typeof json?.reviewer === "string" ? json.reviewer : "";
  if (!isCollective(reviewer)) {
    return NextResponse.json({ error: "only the collective can classify materials" }, { status: 403 });
  }
  const id = typeof json?.id === "string" ? json.id : "";
  if (!/^[0-9a-f-]{36}$/.test(id)) return NextResponse.json({ error: "bad id" }, { status: 400 });

  const row = await env.db
    .prepare("SELECT title, description, ai_dials FROM submitted_materials WHERE id = ?")
    .bind(id)
    .first<{ title: string; description: string | null; ai_dials: string | null }>();
  if (!row) return NextResponse.json({ error: "not found" }, { status: 404 });

  // serve the cache first — one draft per material
  if (row.ai_dials) {
    const cached = validate(safeParse(row.ai_dials));
    if (cached) return NextResponse.json({ configured: true, cached: true, ...cached });
  }

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return NextResponse.json({ configured: false });

  const promptText = `material: "${trim(row.title, 80)}"\nnote: ${row.description ? `"${trim(row.description, 200)}"` : "(none)"}\n\ngive your draft dials as strict JSON.`;

  let parsed: Dials | null = null;
  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({ model: MODEL, max_tokens: 200, system: SYSTEM, messages: [{ role: "user", content: promptText }] }),
    });
    if (!r.ok) {
      console.error("[materials/classify] anthropic error:", r.status, await r.text().catch(() => ""));
      return NextResponse.json({ error: "classify failed" }, { status: 502 });
    }
    const data = (await r.json()) as { content?: { text?: string }[] };
    parsed = validate(extractJson(data.content?.[0]?.text ?? ""));
  } catch (err) {
    console.error("[materials/classify] threw:", err);
    return NextResponse.json({ error: "classify failed" }, { status: 502 });
  }
  if (!parsed) return NextResponse.json({ error: "unparseable draft" }, { status: 502 });

  // cache — first writer wins if two reviewers open the same card at once
  await env.db
    .prepare("UPDATE submitted_materials SET ai_dials = ? WHERE id = ? AND ai_dials IS NULL")
    .bind(JSON.stringify(parsed), id)
    .run();

  return NextResponse.json({ configured: true, cached: false, ...parsed });
}

interface Dials {
  form_primary: string | null;
  loud_quiet: "loud" | "quiet" | null;
  affords: string[];
  reason?: string;
}

function trim(s: string, max: number): string {
  return s.replace(/\s+/g, " ").trim().slice(0, max);
}

function safeParse(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/** tolerant JSON extraction — models sometimes wrap the object in prose/fences. */
function extractJson(text: string): unknown {
  const match = text.match(/\{[\s\S]*\}/);
  return match ? safeParse(match[0]) : null;
}

/** keep only values inside the known vocabularies, so a stray suggestion can't
 *  smuggle an arbitrary form/verb into the confirmed material. */
function validate(o: unknown): Dials | null {
  if (!o || typeof o !== "object") return null;
  const r = o as Record<string, unknown>;
  const form_primary = typeof r.form_primary === "string" && FORMS.includes(r.form_primary) ? r.form_primary : null;
  const loud_quiet = r.loud_quiet === "loud" || r.loud_quiet === "quiet" ? r.loud_quiet : null;
  const affords = Array.isArray(r.affords)
    ? [...new Set(r.affords.filter((v): v is string => typeof v === "string" && VERBS.includes(v)))].slice(0, 4)
    : [];
  const reason = typeof r.reason === "string" ? r.reason.slice(0, 200) : undefined;
  // require at least the two dials that don't already exist on the row to be useful
  if (!form_primary && !loud_quiet && affords.length === 0) return null;
  return { form_primary, loud_quiet, affords, reason };
}
