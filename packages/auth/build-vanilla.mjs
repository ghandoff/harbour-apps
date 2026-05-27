#!/usr/bin/env node
/**
 * Bundle the harbour nav widget into a single self-contained IIFE file.
 *
 * Output: dist/harbour-nav-widget.js
 *
 * Re-run after any change to harbour-nav.tsx or harbour-nav-vanilla.tsx,
 * then copy to windedvertigo/site/public/harbour-nav-widget.js so it is
 * served at https://windedvertigo.com/harbour-nav-widget.js.
 *
 * Usage (from packages/auth/):
 *   node build-vanilla.mjs
 */

import { build } from "esbuild";
import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const outdir = resolve(here, "dist");
await mkdir(outdir, { recursive: true });

const result = await build({
  entryPoints: [resolve(here, "harbour-nav-vanilla.tsx")],
  bundle: true,
  format: "iife",
  globalName: "WvHarbourNav",
  outfile: resolve(outdir, "harbour-nav-widget.js"),
  sourcemap: true,
  minify: true,
  target: ["es2020"],
  jsx: "automatic",
  jsxImportSource: "react",
  loader: { ".tsx": "tsx", ".ts": "ts" },
  define: {
    "process.env.NODE_ENV": '"production"',
  },
  metafile: true,
  logLevel: "info",
});

const out = result.metafile.outputs["dist/harbour-nav-widget.js"];
const bytes = out ? out.bytes : 0;
const kb = (bytes / 1024).toFixed(1);
console.log(`\n✓ built dist/harbour-nav-widget.js (${kb} KiB minified)`);
console.log(
  `  next: cp dist/harbour-nav-widget.js ../../../windedvertigo/site/public/harbour-nav-widget.js`,
);
