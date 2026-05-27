#!/usr/bin/env node
/**
 * Bundle the harbour nav widget into a single self-contained IIFE.
 *
 * Writes the artifact to TWO destinations in one shot to keep
 * the cross-repo bundle from drifting across sessions:
 *
 *   1. apps/harbour-nav-cdn/public/harbour-nav-widget.js
 *      Canonical source inside harbour-apps. Tracked in git.
 *      Also serves as the asset for the (currently unused but
 *      kept for future use) wv-harbour-nav-cdn Worker.
 *
 *   2. windedvertigo/site/public/harbour-nav-widget.js
 *      Production-serving location — wv-site ships this file
 *      at https://windedvertigo.com/harbour-nav-widget.js.
 *      Copied automatically if the sibling repo is found locally.
 *
 * Why both: in a previous attempt to eliminate the two-home
 * problem, we tried a dedicated Worker (wv-harbour-nav-cdn) that
 * would take the URL via a more-specific CF route. The route was
 * registered correctly but CF in this account did not honour route
 * specificity for that path (wv-site's catchall kept winning per
 * wrangler-tail evidence). Until that's resolved, the most reliable
 * pattern is: one build script writes to both destinations, both
 * destinations are committed to their respective repos, and
 * sessions never have to remember to copy by hand.
 *
 * Usage (from packages/auth/):
 *   node build-vanilla.mjs
 *
 * Or, easier (from harbour-apps root):
 *   npm run rebuild-nav
 *
 * That root script also stages the file in BOTH repos so you
 * don't accidentally commit one without the other.
 */

import { build } from "esbuild";
import { mkdir, copyFile, access } from "node:fs/promises";
import { constants } from "node:fs";
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

// Secondary destination — the sibling windedvertigo repo's wv-site.
// Skip silently if the sibling isn't checked out locally (e.g. CI).
const siblingSitePath = resolve(
  here,
  "../../../windedvertigo/site/public/harbour-nav-widget.js",
);
try {
  await access(dirname(siblingSitePath), constants.W_OK);
  await copyFile(primaryOutFile, siblingSitePath);
  console.log(`✓ copied to sibling repo: ${siblingSitePath}`);
  console.log(
    `\n  next: commit BOTH copies to their respective repos so deploys`,
  );
  console.log(`        of either won't drift back to a stale bundle.`);
} catch {
  console.log(
    `\n  sibling repo not found at ${siblingSitePath}`,
  );
  console.log(
    `  → skipping wv-site copy (this is normal in CI). On a workstation,`,
  );
  console.log(
    `    clone ghandoff/windedvertigo as a sibling of this repo to enable`,
  );
  console.log(`    the auto-copy.`);
}
