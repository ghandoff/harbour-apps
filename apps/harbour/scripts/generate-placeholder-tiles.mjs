#!/usr/bin/env node
/**
 * Generate brand-aligned SVG placeholder tile images for harbour apps
 * whose Notion page covers haven't been uploaded yet. Renders each SVG
 * to a 1200×720 PNG via sharp and writes to `dist/placeholder-tiles/`.
 *
 * After running, upload each PNG to R2 via:
 *   wrangler r2 object put creaseworks-evidence/harbour-tiles/<slug>.png \
 *     --file=dist/placeholder-tiles/<slug>.png --remote
 *
 * Or batch upload with the trailing block in this script (see UPLOAD: below).
 *
 * Design: each tile shares the same base layout (cadet base, faint
 * boardwalk stripes, oversized lowercase wordmark, muted tagline)
 * but gets a unique geometric motif in the bottom-right so the six
 * tiles read as a series, not identical clones.
 *
 * Brand palette (per docs/brand-guidelines.md + harbour CLAUDE.md):
 *   --wv-cadet      #273248   page + tile base
 *   --wv-redwood    #b15043   accent (one half of the motifs)
 *   --wv-sienna     #cb7858   accent (other half)
 *   --wv-champagne  #ffebd2   wordmark colour ONLY (never background)
 *   muted-on-dark   rgba(255,255,255,0.6)   tagline
 *
 * Usage (from apps/harbour/):
 *   node scripts/generate-placeholder-tiles.mjs           # render PNGs only
 *   node scripts/generate-placeholder-tiles.mjs --upload  # also push to R2
 */

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, "../dist/placeholder-tiles");
const SHOULD_UPLOAD = process.argv.includes("--upload");

const W = 1200;
const H = 720;

const CADET = "#273248";
const REDWOOD = "#b15043";
const SIENNA = "#cb7858";
const CHAMPAGNE = "#ffebd2";
const MUTED = "rgba(255,255,255,0.62)";

/** Motif definitions — each is a small inline-SVG fragment positioned
 *  in the bottom-right (translate(960, 480) — leaves 240×240 frame).
 *  Stroke / fill in either redwood or sienna, alternating for visual
 *  variety across the series. */
const MOTIFS = {
  "lines-become-loops": {
    accent: SIENNA,
    // Infinity / loop — two interlocking arcs suggesting a feedback loop.
    svg: `
      <g transform="translate(960,480)" stroke="${SIENNA}" stroke-width="6" fill="none" stroke-linecap="round">
        <path d="M30,120 C30,60 90,30 120,90 C150,150 210,180 210,120 C210,60 150,30 120,90 C90,150 30,180 30,120 Z" opacity="0.9"/>
      </g>`,
  },
  "values-companion": {
    accent: REDWOOD,
    // Three stacked auction discs (coin / chip stack).
    svg: `
      <g transform="translate(960,500)" fill="none" stroke="${REDWOOD}" stroke-width="5">
        <ellipse cx="120" cy="160" rx="100" ry="22" opacity="0.95"/>
        <ellipse cx="120" cy="120" rx="100" ry="22" opacity="0.75"/>
        <ellipse cx="120" cy="80"  rx="100" ry="22" opacity="0.55"/>
        <line x1="20"  y1="80"  x2="20"  y2="160" opacity="0.6"/>
        <line x1="220" y1="80"  x2="220" y2="160" opacity="0.6"/>
      </g>`,
  },
  "read-the-room": {
    accent: SIENNA,
    // Concentric observation rings — "noticing" / target.
    svg: `
      <g transform="translate(1080,600)" fill="none" stroke="${SIENNA}" stroke-width="5">
        <circle r="100" opacity="0.4"/>
        <circle r="70"  opacity="0.65"/>
        <circle r="40"  opacity="0.9"/>
        <circle r="10"  fill="${SIENNA}" stroke="none"/>
      </g>`,
  },
  "regenerative-practices": {
    accent: SIENNA,
    // Stylised leaf / sprout — single curve with veins.
    svg: `
      <g transform="translate(960,480)" fill="none" stroke="${SIENNA}" stroke-width="6" stroke-linecap="round">
        <path d="M40,200 Q90,40 220,40 Q170,160 40,200 Z" opacity="0.85" fill="${SIENNA}" fill-opacity="0.12"/>
        <path d="M60,180 Q120,120 200,60" opacity="0.7"/>
        <path d="M90,180 Q120,140 150,100" opacity="0.5"/>
      </g>`,
  },
  "co-rubric-companion": {
    accent: REDWOOD,
    // 3×3 grid of dots — a rubric / criteria matrix.
    svg: `
      <g transform="translate(990,510)" fill="${REDWOOD}">
        ${[0, 1, 2]
          .map((row) =>
            [0, 1, 2]
              .map(
                (col) =>
                  `<circle cx="${col * 60}" cy="${row * 60}" r="${
                    row + col === 0 ? 12 : 10 - row
                  }" opacity="${0.6 + (row + col) * 0.07}"/>`,
              )
              .join(""),
          )
          .join("")}
      </g>`,
  },
  "cuts-catalogue": {
    accent: REDWOOD,
    // Two crossing lines — a "cut" mark, plus two small ticks suggesting
    // catalogued entries.
    svg: `
      <g transform="translate(990,510)" stroke="${REDWOOD}" stroke-width="6" stroke-linecap="round" fill="none">
        <line x1="20"  y1="20"  x2="200" y2="200" opacity="0.95"/>
        <line x1="200" y1="20"  x2="20"  y2="200" opacity="0.6"/>
        <line x1="20"  y1="220" x2="200" y2="220" opacity="0.5"/>
        <line x1="20"  y1="240" x2="140" y2="240" opacity="0.3"/>
      </g>`,
  },
  "harbour-hub": {
    accent: SIENNA,
    // Three piers reaching out into the water — the IA mechanic
    // visualised. Each "pier" is a horizontal bar with a small dot at the
    // sea-end suggesting a pylon. The hub gets a slightly busier motif
    // because it's the cover for the whole landing.
    svg: `
      <g transform="translate(820,420)" stroke="${SIENNA}" fill="none" stroke-linecap="round">
        <line x1="0"   y1="40"  x2="300" y2="40"  stroke-width="8" opacity="0.95"/>
        <circle cx="300" cy="40"  r="10" fill="${SIENNA}" stroke="none"/>
        <line x1="0"   y1="130" x2="260" y2="130" stroke-width="8" opacity="0.75"/>
        <circle cx="260" cy="130" r="10" fill="${SIENNA}" stroke="none"/>
        <line x1="0"   y1="220" x2="220" y2="220" stroke-width="8" opacity="0.55"/>
        <circle cx="220" cy="220" r="10" fill="${SIENNA}" stroke="none"/>
      </g>`,
  },
};

/** Content per tile — formatted wordmark (with lowercase dots between
 *  segments) + tagline that echoes the Notion tagline succinctly. */
const TILES = {
  "lines-become-loops": {
    wordmark: ["lines", "become", "loops"],
    tagline: "a systems-thinking simulator",
  },
  "values-companion": {
    wordmark: ["values", "companion"],
    tagline: "a values game for facilitators",
  },
  "read-the-room": {
    wordmark: ["read", "the", "room"],
    tagline: "a quiet game of interpretation",
  },
  "regenerative-practices": {
    wordmark: ["regenerative", "practices"],
    tagline: "a living catalogue, by PRME faculty",
  },
  "co-rubric-companion": {
    wordmark: ["co", "rubric"],
    tagline: "co-design assessment with your class",
  },
  "cuts-catalogue": {
    wordmark: ["cuts", "catalogue"],
    tagline: "a vocabulary of narrative pacing cuts",
  },
  "harbour-hub": {
    wordmark: ["the", "harbour"],
    tagline: "three piers, one harbour · winded.vertigo",
  },
};

/** Generate the SVG markup for a given slug. */
function buildSvg(slug) {
  const tile = TILES[slug];
  const motif = MOTIFS[slug];
  if (!tile || !motif) throw new Error(`unknown slug: ${slug}`);

  // Wordmark composed line-by-line so each segment can be on its own row.
  // Font size scales down a touch when there are 3 segments so the longest
  // word (regenerative) still fits without truncation.
  const segs = tile.wordmark;
  const fontSize = segs.length >= 3 ? 110 : 132;
  const lineHeight = fontSize * 0.95;
  const totalTextHeight = segs.length * lineHeight;
  const startY = (H - totalTextHeight) / 2 + fontSize * 0.78;

  const wordmarkLines = segs
    .map((word, i) => {
      const dot = i < segs.length - 1 ? "." : "";
      return `
        <text
          x="80"
          y="${startY + i * lineHeight}"
          font-family="Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif"
          font-weight="800"
          font-size="${fontSize}"
          letter-spacing="-3"
          fill="${CHAMPAGNE}"
        >${word}${dot}</text>`;
    })
    .join("");

  // Faint boardwalk-style vertical plank stripes — very low opacity so
  // they read as texture, not noise. Repeated via SVG <pattern>.
  // 96px period to match the boardwalk-plank CSS in app/globals.css.
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <pattern id="planks" x="0" y="0" width="195" height="${H}" patternUnits="userSpaceOnUse">
      <rect width="96" height="${H}" fill="rgba(255,255,255,0.018)"/>
      <rect x="96" width="3" height="${H}" fill="rgba(255,255,255,0.04)"/>
      <rect x="99" width="96" height="${H}" fill="rgba(255,255,255,0.018)"/>
      <rect x="195" width="3" height="${H}" fill="rgba(0,0,0,0.08)"/>
    </pattern>
  </defs>

  <!-- base -->
  <rect width="${W}" height="${H}" fill="${CADET}"/>

  <!-- boardwalk texture -->
  <rect width="${W}" height="${H}" fill="url(#planks)"/>

  <!-- bottom-edge water hint -->
  <rect y="${H - 6}" width="${W}" height="6" fill="rgba(255,255,255,0.06)"/>

  <!-- wordmark -->
  ${wordmarkLines}

  <!-- tagline -->
  <text
    x="80"
    y="${H - 90}"
    font-family="Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif"
    font-weight="500"
    font-size="32"
    letter-spacing="0.3"
    fill="${MUTED}"
  >${tile.tagline}</text>

  <!-- small uppercase eyebrow over the wordmark -->
  <text
    x="80"
    y="100"
    font-family="Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif"
    font-weight="600"
    font-size="20"
    letter-spacing="4"
    fill="${motif.accent}"
    text-transform="uppercase"
  >harbour · ${slug.replace(/-/g, " ")}</text>

  <!-- motif (bottom-right) -->
  ${motif.svg}
</svg>`;
}

async function renderTile(slug) {
  const svg = buildSvg(slug);
  const svgPath = resolve(OUT_DIR, `${slug}.svg`);
  const pngPath = resolve(OUT_DIR, `${slug}.png`);

  await writeFile(svgPath, svg, "utf8");

  await sharp(Buffer.from(svg))
    .resize(W, H, { fit: "fill" })
    .png({ compressionLevel: 9 })
    .toFile(pngPath);

  return { svgPath, pngPath };
}

function uploadToR2(slug, pngPath) {
  return new Promise((resolveProm, rejectProm) => {
    const child = spawn(
      "zsh",
      [
        "-i",
        "-c",
        `wrangler r2 object put creaseworks-evidence/harbour-tiles/${slug}.png --file="${pngPath}" --content-type="image/png" --remote`,
      ],
      { stdio: ["ignore", "pipe", "pipe"] },
    );
    let stderr = "";
    child.stderr.on("data", (d) => (stderr += d.toString()));
    child.on("exit", (code) => {
      if (code === 0) resolveProm();
      else rejectProm(new Error(`wrangler r2 put failed (code ${code}): ${stderr.slice(0, 300)}`));
    });
  });
}

(async () => {
  await mkdir(OUT_DIR, { recursive: true });
  console.log(`Writing tiles to ${OUT_DIR}\n`);

  const slugs = Object.keys(TILES);
  const results = [];
  for (const slug of slugs) {
    try {
      const { pngPath } = await renderTile(slug);
      console.log(`  ✓ rendered ${slug}.png`);
      if (SHOULD_UPLOAD) {
        await uploadToR2(slug, pngPath);
        console.log(`    ✓ uploaded to R2`);
      }
      results.push({ slug, ok: true });
    } catch (err) {
      console.log(`  ✗ ${slug}: ${err.message}`);
      results.push({ slug, ok: false, err: err.message });
    }
  }

  const okCount = results.filter((r) => r.ok).length;
  console.log(`\nDone. ${okCount}/${slugs.length} successful.`);
  if (!SHOULD_UPLOAD) {
    console.log("Re-run with --upload to push the PNGs to R2.");
  }
})();
