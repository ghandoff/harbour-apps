/**
 * Generate small flag-icon thumbnails for the shop (the Shipwright's Dock).
 *
 * The full-res app tiles in public/images/<slug>.png are 1–3.5 MB each (1024px+)
 * — far too heavy for the ~34px boat flags. This downscales every tile to a
 * 96×96 WebP in public/images/thumbs/, which the shop's flag references
 * (see lib/shop-boats.ts → `icon`). 96px covers retina for a 34px flag.
 *
 * Run: `cd apps/harbour && node scripts/gen-icon-thumbs.mjs`
 * (sharp resolves from the workspace root node_modules.)
 */
import sharp from "sharp";
import { readdir, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.resolve(here, "../public/images");
const OUT = path.join(SRC, "thumbs");
const SIZE = 96;

await mkdir(OUT, { recursive: true });
const files = (await readdir(SRC)).filter((f) => f.toLowerCase().endsWith(".png"));

let total = 0;
for (const f of files) {
  const slug = f.replace(/\.png$/i, "");
  const out = path.join(OUT, `${slug}.webp`);
  await sharp(path.join(SRC, f))
    .resize(SIZE, SIZE, { fit: "cover", position: "centre" })
    .webp({ quality: 82 })
    .toFile(out);
  total += 1;
}
console.log(`wrote ${total} thumbnail(s) (${SIZE}×${SIZE} webp) to ${OUT}`);
