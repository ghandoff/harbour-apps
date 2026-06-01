// Prototype smoke test for raft-house's 7 sub-game explorations.
//
// The prototypes (apps/raft-house/prototypes/*) are standalone HTML demos —
// NOT deployed by Next or the CF Worker. They live in the repo as design
// explorations for the seven sub-games (archipelago, bubble-cluster, card-deal,
// combined, design-audit, serendipity, treasure-map) plus two flat duplicates
// (archipelago.html, card-deal.html).
//
// To smoke them we spin up a one-off Node http server rooted at the prototypes
// dir on an ephemeral port, GET each file, and assert:
//   - 200 status
//   - HTML content-type
//   - non-empty body (>500 bytes — even the smallest prototype is ~12KB)
//   - contains `<!DOCTYPE html>` and a `<script>` tag (interactive)
//   - title contains "raft.house"
//
// We don't execute the JS — that needs Playwright / a real browser, which is
// out of scope for a smoke harness. But "loads with expected structural
// markers" is enough to catch the common breakages (file not present,
// truncated, missing script, wrong title).

import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { join, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

// Resolve apps/raft-house/prototypes/ relative to this file:
//   packages/load-testing/src/scenarios/prototypes.mjs
//   → ../../../../apps/raft-house/prototypes
const HERE = dirname(fileURLToPath(import.meta.url));
const PROTOTYPES_DIR = join(HERE, "..", "..", "..", "..", "apps", "raft-house", "prototypes");

// Each entry maps a URL path → an expected file. Dir-style prototypes are
// served as `<name>/index.html` but a request to `/<name>/` must auto-resolve.
const PROTOTYPE_PATHS = [
  "/archipelago/",
  "/bubble-cluster/",
  "/card-deal/",
  "/combined/",
  "/design-audit/",
  "/serendipity/",
  "/treasure-map/",
  "/archipelago.html",
  "/card-deal.html",
];

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
};

/** Start a Node http server rooted at the prototypes dir. Returns close fn + base URL. */
async function startProtoServer() {
  const server = createServer(async (req, res) => {
    try {
      let urlPath = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
      // dir-style → serve index.html. Trailing slash MUST be respected (the
      // assertions below test the "/<name>/" form, not "/<name>/index.html").
      if (urlPath.endsWith("/")) urlPath += "index.html";
      const filePath = join(PROTOTYPES_DIR, urlPath);
      // Defense against path traversal (e.g. /../../etc/passwd) — only serve
      // files actually under PROTOTYPES_DIR.
      if (!filePath.startsWith(PROTOTYPES_DIR)) {
        res.writeHead(403);
        return res.end();
      }
      const s = await stat(filePath);
      if (!s.isFile()) {
        res.writeHead(404);
        return res.end();
      }
      const data = await readFile(filePath);
      res.writeHead(200, { "content-type": MIME_TYPES[extname(filePath)] || "application/octet-stream" });
      res.end(data);
    } catch {
      res.writeHead(404);
      res.end();
    }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = /** @type {{ port: number }} */ (server.address()).port;
  return {
    base: `http://127.0.0.1:${port}`,
    close: () =>
      new Promise((resolve) => {
        server.close(() => resolve(undefined));
      }),
  };
}

export async function runPrototypes() {
  const t0 = Date.now();
  const steps = [];
  const step = (name, ok, detail) => steps.push({ step: name, ok, detail });

  const srv = await startProtoServer();
  try {
    for (const path of PROTOTYPE_PATHS) {
      try {
        const res = await fetch(srv.base + path);
        const ctype = res.headers.get("content-type") || "";
        const body = await res.text();
        const checks = {
          status200: res.status === 200,
          isHtml: ctype.includes("text/html"),
          hasDoctype: body.includes("<!DOCTYPE html>"),
          hasScript: body.includes("<script"),
          hasRaftHouseTitle: /raft\.house/i.test(body),
          minSize: body.length > 500,
        };
        const ok = Object.values(checks).every(Boolean);
        const failed = Object.entries(checks)
          .filter(([, v]) => !v)
          .map(([k]) => k);
        step(
          `proto ${path}`,
          ok,
          ok ? `HTTP 200, ${body.length}B, ${ctype.split(";")[0]}` : `failed: ${failed.join(", ")}`,
        );
      } catch (e) {
        step(`proto ${path}`, false, /** @type {Error} */ (e).message);
      }
    }
  } finally {
    await srv.close();
  }

  return {
    scenario: "prototypes",
    passed: steps.every((s) => s.ok),
    steps,
    durationMs: Date.now() - t0,
  };
}
