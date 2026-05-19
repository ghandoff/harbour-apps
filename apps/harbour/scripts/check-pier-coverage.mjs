#!/usr/bin/env node
/**
 * Slug coverage check between Notion harbour-games and lib/pier-data.ts.
 *
 * Two failure modes this catches:
 *   1. A new app added to the Notion DB but missing from PIER_MAP / WAVE_MAP
 *      → app silently lands in the drydock at runtime, no editor recourse.
 *   2. A slug listed in PIER_MAP / WAVE_MAP that no longer exists in Notion
 *      → dead entry in the fallback map (stale, harmless but worth pruning).
 *
 * Read-only. Hits the Notion API once. Requires NOTION_TOKEN.
 *
 * Usage (from apps/harbour/):
 *   NOTION_TOKEN=ntn_... node scripts/check-pier-coverage.mjs
 *
 * Exit codes:
 *   0  every Notion slug has a PIER_MAP entry, every PIER_MAP slug exists in Notion
 *   1  drift found — see report
 *   2  Notion API or filesystem error
 */

import { Client } from "@notionhq/client";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATABASE_ID = "8e3f3364b2654640a91ed0f38b091a07";

if (!process.env.NOTION_TOKEN) {
  console.error("NOTION_TOKEN is required");
  process.exit(2);
}

const notion = new Client({ auth: process.env.NOTION_TOKEN });

/* ── load PIER_MAP / WAVE_MAP from source ─────────────────── */

function loadCodeMaps() {
  const file = resolve(__dirname, "../lib/pier-data.ts");
  const source = readFileSync(file, "utf8");

  const pierBlock = source.match(/PIER_MAP:[^=]+=\s*\{([\s\S]+?)\};/);
  const waveBlock = source.match(/WAVE_MAP:[^=]+=\s*\{([\s\S]+?)\};/);
  if (!pierBlock || !waveBlock) {
    throw new Error(
      "could not find PIER_MAP/WAVE_MAP literals in lib/pier-data.ts",
    );
  }

  const slugRe = /["']([a-z0-9-]+)["']\s*:/g;
  const pierSlugs = new Set();
  const waveSlugs = new Set();
  for (const m of pierBlock[1].matchAll(slugRe)) pierSlugs.add(m[1]);
  for (const m of waveBlock[1].matchAll(slugRe)) waveSlugs.add(m[1]);
  return { pierSlugs, waveSlugs };
}

/* ── fetch Notion slugs ───────────────────────────────────── */

async function fetchNotionSlugs() {
  const db = await notion.databases.retrieve({ database_id: DATABASE_ID });
  const dataSourceId = db.data_sources?.[0]?.id;
  if (!dataSourceId) throw new Error("no data source on harbour-games DB");

  const slugs = new Set();
  let startCursor;
  do {
    const response = await notion.dataSources.query({
      data_source_id: dataSourceId,
      page_size: 100,
      ...(startCursor ? { start_cursor: startCursor } : {}),
    });
    for (const page of response.results) {
      if (!("properties" in page)) continue;
      const slugProp = page.properties.Slug;
      if (slugProp?.type === "rich_text") {
        const text = slugProp.rich_text.map((t) => t.plain_text).join("").trim();
        if (text) slugs.add(text);
      }
    }
    startCursor = response.has_more ? response.next_cursor : undefined;
  } while (startCursor);
  return slugs;
}

/* ── main ─────────────────────────────────────────────────── */

try {
  const { pierSlugs, waveSlugs } = loadCodeMaps();
  const notionSlugs = await fetchNotionSlugs();

  const missingPier = [...notionSlugs].filter((s) => !pierSlugs.has(s));
  const missingWave = [...notionSlugs].filter((s) => !waveSlugs.has(s));
  const stalePier = [...pierSlugs].filter((s) => !notionSlugs.has(s));
  const staleWave = [...waveSlugs].filter((s) => !notionSlugs.has(s));

  console.log(`Notion slugs: ${notionSlugs.size}`);
  console.log(`PIER_MAP entries: ${pierSlugs.size}`);
  console.log(`WAVE_MAP entries: ${waveSlugs.size}`);
  console.log();

  let issues = 0;

  // Many Notion rows legitimately have no pier assignment (they're meant to
  // default to the drydock via the empty-fallback in _fetchGames). Only flag
  // these as "missing" if they map to known Wave-1 / Wave-2 categories
  // elsewhere — i.e. they almost certainly want a pier and someone forgot.
  // Since the script can't tell intent, we just LIST drift and let the
  // human decide.
  if (missingPier.length) {
    issues++;
    console.log("Notion slugs NOT in PIER_MAP (will default to drydock):");
    missingPier.forEach((s) => console.log(`  - ${s}`));
    console.log();
  }
  if (missingWave.length) {
    issues++;
    console.log("Notion slugs NOT in WAVE_MAP (will default to coming-soon):");
    missingWave.forEach((s) => console.log(`  - ${s}`));
    console.log();
  }
  if (stalePier.length) {
    issues++;
    console.log("PIER_MAP entries NOT found in Notion (stale fallback):");
    stalePier.forEach((s) => console.log(`  - ${s}`));
    console.log();
  }
  if (staleWave.length) {
    issues++;
    console.log("WAVE_MAP entries NOT found in Notion (stale fallback):");
    staleWave.forEach((s) => console.log(`  - ${s}`));
    console.log();
  }

  if (issues === 0) {
    console.log("✓ no drift — every Notion slug has fallback coverage and vice versa");
    process.exit(0);
  } else {
    console.log(`drift found in ${issues} category(ies) — review above`);
    process.exit(1);
  }
} catch (err) {
  console.error("check failed:", err.message);
  process.exit(2);
}
