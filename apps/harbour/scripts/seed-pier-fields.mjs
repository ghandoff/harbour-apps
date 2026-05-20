/**
 * One-off Notion backfill: add `Pier` (multi-select) and `Launch Wave`
 * (select) properties to the harbour-games database, then populate them
 * for every existing row according to the mapping below.
 *
 * Idempotent — property updates upsert option sets; row updates with
 * the same values are no-ops. Safe to re-run.
 *
 * Usage (from apps/harbour/):
 *   node scripts/seed-pier-fields.mjs
 *
 * Required env vars:
 *   NOTION_TOKEN — Notion integration token (export from .env.local)
 */

import { Client } from "@notionhq/client";

const DATABASE_ID = "8e3f3364b2654640a91ed0f38b091a07";

if (!process.env.NOTION_TOKEN) {
  console.error("NOTION_TOKEN is required");
  process.exit(1);
}

const notion = new Client({ auth: process.env.NOTION_TOKEN });

// ── slug → (Pier[], Wave) ────────────────────────────────
// Mirrors apps/harbour/lib/pier-data.ts. Slugs not listed here get
// Pier=[] and Launch Wave=coming-soon, landing them in the drydock.
const ASSIGNMENTS = {
  "vertigo-vault": { pier: ["leadership", "classroom"], wave: "wave-1" },
  "lines-become-loops": { pier: ["leadership", "classroom"], wave: "wave-1" },
  "values-auction": { pier: ["leadership"], wave: "wave-1" },
  "read-the-room": { pier: ["leadership", "classroom"], wave: "wave-1" },
  "regenerative-practices": { pier: ["leadership", "classroom"], wave: "wave-1" },
  "co-design-rubric": { pier: ["classroom"], wave: "wave-1" },
  "depth-chart": { pier: ["classroom"], wave: "coming-soon" },
  creaseworks: { pier: ["family"], wave: "wave-2" },
  "raft-house": { pier: ["family"], wave: "wave-2" },
  "deep-deck": { pier: ["family"], wave: "wave-2" },
};

const PIER_OPTIONS = ["leadership", "classroom", "family", "drydock"];
const WAVE_OPTIONS = ["wave-1", "wave-2", "coming-soon"];

// ── 1. add the properties to the data source ──────────────
// Notion v5 split databases (metadata) from data sources (rows + schema).
// Properties are added via dataSources.update, not databases.update.
async function addProperties(dataSourceId) {
  console.log("[1/3] adding Pier + Launch Wave properties to data source…");
  await notion.dataSources.update({
    data_source_id: dataSourceId,
    properties: {
      Pier: {
        multi_select: {
          options: PIER_OPTIONS.map((name) => ({ name })),
        },
      },
      "Launch Wave": {
        select: {
          options: WAVE_OPTIONS.map((name) => ({ name })),
        },
      },
    },
  });
  console.log("       ✓ properties added (or already present)");
}

// ── 2. paginate every page in the DB ─────────────────────
async function getDataSourceId() {
  const db = await notion.databases.retrieve({ database_id: DATABASE_ID });
  if (!db.data_sources?.length) {
    throw new Error(`no data sources for database ${DATABASE_ID}`);
  }
  return db.data_sources[0].id;
}

async function* paginatePages(dataSourceId) {
  let startCursor;
  do {
    const response = await notion.dataSources.query({
      data_source_id: dataSourceId,
      page_size: 100,
      ...(startCursor ? { start_cursor: startCursor } : {}),
    });
    for (const page of response.results) {
      if ("properties" in page) yield page;
    }
    startCursor = response.has_more ? response.next_cursor : undefined;
  } while (startCursor);
}

function getSlug(page) {
  const slugProp = page.properties?.Slug;
  if (!slugProp || slugProp.type !== "rich_text") return "";
  return slugProp.rich_text.map((t) => t.plain_text).join("");
}

// ── 3. update each page with its pier/wave ────────────────
async function backfillRows(dataSourceId) {
  console.log("[2/3] fetching all rows…");

  const pages = [];
  for await (const page of paginatePages(dataSourceId)) pages.push(page);
  console.log(`       ✓ ${pages.length} rows found`);

  console.log("[3/3] writing Pier + Launch Wave per row…");
  let assigned = 0;
  let defaulted = 0;
  for (const page of pages) {
    const slug = getSlug(page);
    const assignment = ASSIGNMENTS[slug];
    const pier = assignment?.pier ?? [];
    const wave = assignment?.wave ?? "coming-soon";

    await notion.pages.update({
      page_id: page.id,
      properties: {
        Pier: {
          multi_select: pier.map((name) => ({ name })),
        },
        "Launch Wave": {
          select: { name: wave },
        },
      },
    });

    if (assignment) {
      assigned++;
      console.log(`       ✓ ${slug} → [${pier.join(", ")}] / ${wave}`);
    } else {
      defaulted++;
      console.log(`       ✓ ${slug || "(no slug)"} → drydock / coming-soon`);
    }
  }
  console.log(
    `\ndone. ${assigned} explicitly assigned, ${defaulted} defaulted to drydock.`,
  );
}

(async () => {
  try {
    const dataSourceId = await getDataSourceId();
    await addProperties(dataSourceId);
    await backfillRows(dataSourceId);
  } catch (err) {
    console.error("seed failed:", err);
    process.exit(1);
  }
})();
