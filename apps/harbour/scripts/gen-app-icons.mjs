/**
 * Rasterize the bespoke app-icon SVGs (Payton's, in the shared Drive) into small
 * transparent webp used as each app's "maritime flag" in the shop. Source SVGs
 * are heavy design-tool exports (up to 3.7 MB) with feColorMatrix filters, so we
 * flatten them to ~256px webp (a few KB each) instead of shipping the raw SVG.
 *
 * Source dir is the shared Drive by default; override with HARBOUR_ICON_SRC.
 * Run: `cd apps/harbour && node scripts/gen-app-icons.mjs`
 */
import sharp from "sharp";
import { mkdir, access } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(here, "../public/icons");
const SRC =
  process.env.HARBOUR_ICON_SRC ||
  "/Users/garrettjaeger/Library/CloudStorage/GoogleDrive-garrett@windedvertigo.com/Shared drives/winded.vertigo/studio/harbour/Harbour/icons";

// Drive filename (no ext) → canonical HARBOUR_APPS slug.
const MAP = {
  "vertigo-vault": "vertigo-vault",
  "co-rubric": "co-rubric-companion",
  "cuts-catalogue": "cuts-catalogue",
  "lines-become-loops": "lines-become-loops",
  "read-the-room": "read-the-room",
  "regenerative-library": "regenerative-practices-catalogue",
  "values-auction": "values-companion",
};

await mkdir(OUT, { recursive: true });
let n = 0;
for (const [file, slug] of Object.entries(MAP)) {
  const src = path.join(SRC, `${file}.svg`);
  try {
    await access(src);
  } catch {
    console.warn("skip (missing):", src);
    continue;
  }
  await sharp(src, { density: 200 })
    .resize(256, 256, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .webp({ quality: 90 })
    .toFile(path.join(OUT, `${slug}.webp`));
  n += 1;
}
console.log(`wrote ${n} app icon(s) to ${OUT}`);
