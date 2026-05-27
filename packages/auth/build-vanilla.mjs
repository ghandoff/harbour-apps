#!/usr/bin/env node
/**
 * Bundle the harbour nav widget into a single self-contained IIFE.
 *
 * Single source of truth: apps/harbour-nav-cdn/public/harbour-nav-widget.js
 *
 * Production serving: wv-harbour-nav-cdn Worker takes the URL via
 * specific CF route (windedvertigo.com/harbour-nav-widget.js and the
 * www variant). The route beats wv-site's /* catchall, so consumers
 * keep the same <script src> URL and wv-site no longer ships the
 * artifact at all.
 *
 * Deploy after rebuilding:
 *   cd apps/harbour-nav-cdn && npx wrangler deploy
 *
 * Usage (from packages/auth/):
 *   node build-vanilla.mjs
 *
 * Or, easier (from harbour-apps root):
 *   npm run rebuild-nav
 */

import { build } from "esbuild";
import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));

// Primary destination — committed in this repo.
const primaryOutDir = resolve(here, "../../apps/harbour-nav-cdn/public");
await mkdir(primaryOutDir, { recursive: true });
const primaryOutFile = resolve(primaryOutDir, "harbour-nav-widget.js");

const result = await build({
  entryPoints: [resolve(here, "harbour-nav-vanilla.tsx")],
  bundle: true,
  format: "iife",
  globalName: "WvHarbourNav",
  outfile: primaryOutFile,
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

const outKey = Object.keys(result.metafile.outputs).find((k) =>
  k.endsWith("harbour-nav-widget.js"),
);
const bytes = outKey ? result.metafile.outputs[outKey].bytes : 0;
const kb = (bytes / 1024).toFixed(1);
console.log(
  `\n✓ built ${primaryOutFile} (${kb} KiB minified)`,
);
console.log(
  `\n  next: cd apps/harbour-nav-cdn && npx wrangler deploy`,
);
