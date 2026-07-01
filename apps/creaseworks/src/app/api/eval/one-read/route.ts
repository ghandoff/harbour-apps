/**
 * POST /api/eval/one-read  { slug }  — the AI "one read" per playdate.
 *
 * "One voice, not the answer." A short Claude read across the five
 * lenses, shown AFTER the room has scored, that an evaluator can mark
 * wrong. Generated on demand and cached in D1 (one per playdate, 11
 * currently), so the cost is a handful of small sonnet calls — not per view.
 *
 * Degrades gracefully: without ANTHROPIC_API_KEY it returns
 * { configured: false } and the UI says the read isn't switched on yet.
 */

import { NextRequest, NextResponse } from "next/server";
import { getEvalEnv } from "@/lib/eval-server";
import { playdateBySlug } from "@/lib/eval-rubric";

const MODEL = "claude-sonnet-4-6";

const SYSTEM = `you are giving a single short "read" on a creaseworks playdate for the winded.vertigo collective, against their games design framework. creaseworks designs the conditions for play, never guaranteed outcomes — judge conditions present, never outcomes achieved.

read across the five lenses, briefly:
1. the play condition (the floor): low stakes, metabolisable surprise, messy & non-performative, implicitly hopeful.
2. the mechanics (the lever): conditions-not-play, error is information, no verdict on the player, the KEK return ("same material, new function"), the two-face dig.
3. justice & access: the no-default-player gate — many real routes in, no assumed body/sense/pace/language; a layer-3 door to the wider world the object comes from.
4. aliveness & coherence (the decisive test): does the return travel and the field of possible action widen, or is it only local engagement?
5. what it might fail to see.

you are one voice, not the verdict — if the room disagrees, they mark you wrong. acknowledge what genuinely works before naming what is thin; never dismiss a game on red-flag mechanics alone. ~140 words, plain language, british spelling, lowercase except names. no headings, no bullet list — two or three short paragraphs.`;

export async function POST(req: NextRequest) {
  const env = getEvalEnv();
  if (!env) return NextResponse.json({ error: "not available" }, { status: 404 });

  const json = await req.json().catch(() => null);
  const slug = json && typeof json.slug === "string" ? json.slug : "";
  const playdate = playdateBySlug(slug);
  if (!playdate) return NextResponse.json({ error: "unknown playdate" }, { status: 400 });

  // serve the cache if present
  const cached = await env.db
    .prepare("SELECT text, model, created_at FROM one_reads WHERE playdate_slug = ?")
    .bind(slug)
    .first<{ text: string; model: string; created_at: string }>();
  if (cached) {
    return NextResponse.json({ configured: true, cached: true, ...cached });
  }

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return NextResponse.json({ configured: false });

  const user = `playdate: ${playdate.title}\ninvitation: ${playdate.tagline}\nwhat happens: ${playdate.content}\n\ngive your read.`;

  let text = "";
  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 500,
        system: SYSTEM,
        messages: [{ role: "user", content: user }],
      }),
    });
    if (!r.ok) {
      console.error("[eval/one-read] anthropic error:", r.status, await r.text().catch(() => ""));
      return NextResponse.json({ error: "generation failed" }, { status: 502 });
    }
    const data = (await r.json()) as { content?: { text?: string }[] };
    text = data.content?.[0]?.text?.trim() ?? "";
  } catch (err) {
    console.error("[eval/one-read] threw:", err);
    return NextResponse.json({ error: "generation failed" }, { status: 502 });
  }
  if (!text) return NextResponse.json({ error: "empty read" }, { status: 502 });

  // first-writer-wins: if two reviewers of the same new (uncached) playdate race,
  // one generated read shouldn't clobber the other's — the loser re-reads the cache.
  await env.db
    .prepare("INSERT OR IGNORE INTO one_reads (playdate_slug, text, model) VALUES (?, ?, ?)")
    .bind(slug, text, MODEL)
    .run();

  return NextResponse.json({ configured: true, cached: false, text, model: MODEL });
}
