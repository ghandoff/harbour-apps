#!/usr/bin/env node
/**
 * sync-live-materials — B5 promotion.
 *
 * Reads `live` open-ended materials from EVAL_DB and merges them into the
 * static snapshot src/lib/mini-data.ts MINI_MATERIALS, so a material the
 * collective accepted + a family iconned becomes a tile EVERYONE sees.
 * The mini canary carries no DB credential, so promotion is this build-time
 * splice + a redeploy (same pattern as the original 2026-06-11 snapshot).
 *
 *   node scripts/sync-live-materials.mjs            # dry-run (prints additions)
 *   node scripts/sync-live-materials.mjs --write    # apply to mini-data.ts
 *
 * Then redeploy the mini:
 *   CW_MINI=1 npx opennextjs-cloudflare build \
 *     && node ../../packages/security/scripts/write-assets-headers.mjs /harbour/creaseworks-mini \
 *     && npx wrangler deploy --config wrangler.mini.jsonc
 *
 * NOTE: the canonical materials list is Neon `materials_cache` (the main
 * product's source of truth). Writing promoted materials back to Neon — so the
 * full product, not just the mini, gains the tile — is a separate step that
 * needs the Neon credential; do that before/alongside this splice.
 */

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP = join(__dirname, "..");
const DATA = join(APP, "src", "lib", "mini-data.ts");
const WRITE = process.argv.includes("--write");

function slug(title) {
  return title.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function fetchLive() {
  // execFile (no shell) — fixed args, no interpolation, no injection surface.
  const out = execFileSync(
    "npx",
    [
      "wrangler", "d1", "execute", "wv-creaseworks-eval", "--remote", "--json",
      "--command",
      "SELECT title, form_primary, chosen_icon_url, group_code FROM submitted_materials WHERE status='live' ORDER BY created_at ASC",
    ],
    { cwd: APP, encoding: "utf8" },
  );
  const parsed = JSON.parse(out);
  const block = Array.isArray(parsed) ? parsed[0] : parsed;
  return block?.results ?? [];
}

const live = fetchLive();
if (live.length === 0) {
  console.log("no live materials to promote — nothing to do.");
  process.exit(0);
}

const src = readFileSync(DATA, "utf8");
const existing = new Set([...src.matchAll(/title:\s*"([^"]+)"/g)].map((m) => m[1]));

const additions = [];
for (const r of live) {
  if (!r.title || existing.has(r.title)) continue;
  const line =
    `  { id: ${JSON.stringify(slug(r.title))}, title: ${JSON.stringify(r.title)}, ` +
    `emoji: null, icon: null, formPrimary: ${JSON.stringify(r.form_primary ?? null)}, ` +
    `iconUrl: ${JSON.stringify(r.chosen_icon_url ?? "")}, discoveredBy: ${JSON.stringify(r.group_code ?? "")} },`;
  additions.push(line);
}

if (additions.length === 0) {
  console.log(`all ${live.length} live material(s) already in the snapshot — nothing to add.`);
  process.exit(0);
}

console.log(`would add ${additions.length} promoted material(s):`);
console.log(additions.join("\n"));

if (!WRITE) {
  console.log("\n(dry-run — re-run with --write to apply, then redeploy the mini)");
  process.exit(0);
}

const marker = "\n];\n\n/** Read-aloud phase content";
if (!src.includes(marker)) {
  console.error("could not locate the MINI_MATERIALS array end — aborting (file shape changed?)");
  process.exit(1);
}
const updated = src.replace(marker, "\n" + additions.join("\n") + marker);
writeFileSync(DATA, updated);
console.log(`\n✓ wrote ${additions.length} entr${additions.length === 1 ? "y" : "ies"} to mini-data.ts — now rebuild + redeploy the mini.`);
