#!/usr/bin/env node
/**
 * Bundle the feedback widget into a single self-contained file that
 * static-HTML / Vite apps can load via a <script> tag.
 *
 * Output: dist/feedback-widget.js  (IIFE, includes React + ReactDOM)
 *         dist/feedback-widget.js.map
 *
 * Re-run after any change to feedback-widget.tsx or vanilla-entry.tsx,
 * then copy the output to windedvertigo/site/public/feedback-widget.js
 * (so it's served at https://windedvertigo.com/feedback-widget.js).
 *
 * Usage (from packages/feedback/):
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
  entryPoints: [resolve(here, "vanilla-entry.tsx")],
  bundle: true,
  format: "iife",
  globalName: "WvFeedbackWidget",
  outfile: resolve(outdir, "feedback-widget.js"),
  sourcemap: true,
  minify: true,
  target: ["es2020"],
  jsx: "automatic",
  jsxImportSource: "react",
  loader: { ".tsx": "tsx", ".ts": "ts" },
  define: {
    // React production build — strips development-only warnings + dead code.
    "process.env.NODE_ENV": '"production"',
  },
  metafile: true,
  logLevel: "info",
});

// Brief size report so we know roughly what we're shipping.
const out = result.metafile.outputs[`dist/feedback-widget.js`];
const bytes = out ? out.bytes : 0;
const kb = (bytes / 1024).toFixed(1);
console.log(`\n✓ built dist/feedback-widget.js (${kb} KiB minified)`);
console.log(`  next: cp dist/feedback-widget.js ../../../windedvertigo/site/public/feedback-widget.js`);
