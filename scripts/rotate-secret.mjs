#!/usr/bin/env node
// Generic secret-rotation propagator. Reads a current secret value from a
// "source-of-truth" file, validates it via a probe URL, then propagates to
// every listed destination: Vercel project envs, CF Worker secrets, local
// .env.local files. Triggers Vercel redeploys at the end.
//
// **The secret value never prints to stdout, never goes through the Bash
// arg list (always piped via stdin), and is wiped from process.env at exit.**
//
// Usage:
//   node scripts/rotate-secret.mjs --secret=NAME [--dry-run]
//
// Configure each secret in the SECRETS map below. To rotate a secret:
//   1. Update its value in the SOURCE file (typically port/.env.local —
//      Garrett's working set), then run this script.
//   2. The script verifies the new value works against the probe URL.
//   3. Propagates everywhere else.
//   4. Triggers Vercel redeploys so apps pick up the new value immediately
//      (CF Worker secrets activate without redeploy).
//
// Documented in docs/runbooks/secret-rotation.md.

import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { parseArgs } from "node:util";

const HOME = homedir();
const SOURCE = `${HOME}/Projects/windedvertigo/port/.env.local`;

const SECRETS = {
  RESEND_API_KEY: {
    probeUrl: "https://api.resend.com/domains",
    probeOkStatus: 200,
    vercelProjects: [
      // [project-name, link-cwd]
      ["creaseworks", `${HOME}/Projects/harbour-apps/apps/creaseworks`],
      ["vertigo-vault", `${HOME}/Projects/harbour-apps/apps/vertigo-vault`],
      // port is the source-of-truth — only update if explicitly invalidated
    ],
    cfWorkers: [
      "wv-harbour-harbour",
      "wv-harbour-depth-chart",
      "wv-site",
    ],
    localFiles: [
      `${HOME}/Projects/harbour-apps/apps/creaseworks/.env.local`,
      `${HOME}/Projects/harbour-apps/apps/vertigo-vault/.env.local`,
    ],
    redeployVercelAfterUpdate: true,
  },
  // Future secrets:
  //   ANTHROPIC_API_KEY: { ... },
  //   NOTION_TOKEN: { ... },  // see existing reference_notion_token_rotation_plan.md memory
};

const { values } = parseArgs({
  options: {
    secret: { type: "string" },
    "dry-run": { type: "boolean", default: false },
  },
});

const name = values.secret;
if (!name || !SECRETS[name]) {
  console.error(`usage: rotate-secret.mjs --secret=NAME [--dry-run]`);
  console.error(`available secrets: ${Object.keys(SECRETS).join(", ")}`);
  process.exit(1);
}
const cfg = SECRETS[name];
const dry = values["dry-run"];

// ── Step 1: load current value from source ───────────────────────────────
if (!existsSync(SOURCE)) {
  console.error(`source-of-truth file missing: ${SOURCE}`);
  process.exit(1);
}
const raw = readFileSync(SOURCE, "utf8");
const lineMatch = raw.match(new RegExp(`^${name}=(.+)$`, "m"));
if (!lineMatch) {
  console.error(`${name} not found in ${SOURCE}`);
  process.exit(1);
}
let secretValue = lineMatch[1].trim();
// Strip surrounding quotes if present
if (
  (secretValue.startsWith('"') && secretValue.endsWith('"')) ||
  (secretValue.startsWith("'") && secretValue.endsWith("'"))
) {
  secretValue = secretValue.slice(1, -1);
}
console.log(`✓ loaded ${name} from source (length: ${secretValue.length})`);

// ── Step 2: probe validity ───────────────────────────────────────────────
console.log(`probing ${cfg.probeUrl} for ${cfg.probeOkStatus}…`);
const probeRes = spawnSync(
  "curl",
  ["-s", "-o", "/dev/null", "-w", "%{http_code}", cfg.probeUrl, "-H", `Authorization: Bearer ${secretValue}`],
  { encoding: "utf8" }
);
if (probeRes.stdout !== String(cfg.probeOkStatus)) {
  console.error(`✗ probe failed: HTTP ${probeRes.stdout} (expected ${cfg.probeOkStatus})`);
  console.error(`  the source value is itself stale. update ${SOURCE} with a fresh key first.`);
  process.exit(1);
}
console.log(`✓ probe OK (HTTP ${cfg.probeOkStatus})`);

if (dry) {
  console.log("\n--- DRY RUN ---");
  console.log("would update:");
  cfg.vercelProjects.forEach(([p]) => console.log(`  vercel: ${p} (production, preview, development)`));
  cfg.cfWorkers.forEach((w) => console.log(`  cf worker: ${w}`));
  cfg.localFiles.forEach((f) => console.log(`  local file: ${f}`));
  if (cfg.redeployVercelAfterUpdate) {
    console.log("would redeploy Vercel projects after env update");
  }
  process.exit(0);
}

// ── Step 3: Vercel project envs ──────────────────────────────────────────
for (const [project, cwd] of cfg.vercelProjects) {
  console.log(`\nvercel: ${project}`);
  for (const env of ["production", "preview", "development"]) {
    // Remove existing (ignore errors — may not exist)
    spawnSync("vercel", ["env", "rm", name, env, "--yes"], { cwd, stdio: ["ignore", "ignore", "ignore"] });
    // Add via stdin (never on argv)
    const addRes = spawnSync("vercel", ["env", "add", name, env], {
      cwd,
      input: secretValue,
      encoding: "utf8",
    });
    if (addRes.status === 0) {
      console.log(`  ✓ ${env}`);
    } else {
      console.error(`  ✗ ${env}: ${addRes.stderr?.split("\n")[0] ?? "unknown"}`);
    }
  }
}

// ── Step 4: CF Worker secrets ────────────────────────────────────────────
process.env.CLOUDFLARE_API_TOKEN = readFileSync(`${HOME}/.cf-token`, "utf8").trim();
for (const worker of cfg.cfWorkers) {
  console.log(`\ncf worker: ${worker}`);
  const putRes = spawnSync("npx", ["wrangler", "secret", "put", name, "--name", worker], {
    input: secretValue,
    encoding: "utf8",
  });
  if (putRes.status === 0) {
    console.log(`  ✓ ${worker}`);
  } else {
    console.error(`  ✗ ${worker}: ${putRes.stderr?.split("\n")[0] ?? "unknown"}`);
  }
}

// ── Step 5: local .env.local files ───────────────────────────────────────
for (const file of cfg.localFiles) {
  if (!existsSync(file)) {
    console.warn(`  ! skipping (missing): ${file}`);
    continue;
  }
  const before = readFileSync(file, "utf8");
  const re = new RegExp(`^${name}=.*$`, "m");
  const after = re.test(before)
    ? before.replace(re, `${name}=${secretValue}`)
    : before + `\n${name}=${secretValue}\n`;
  writeFileSync(file, after);
  console.log(`  ✓ local: ${file}`);
}

// ── Step 6: Trigger Vercel redeploys ─────────────────────────────────────
if (cfg.redeployVercelAfterUpdate) {
  for (const [project, cwd] of cfg.vercelProjects) {
    console.log(`\nredeploying ${project}…`);
    // Use the most recent prod deployment as the source for the redeploy
    const lastDeploy = execFileSync("vercel", ["ls"], { cwd, encoding: "utf8" })
      .split("\n")
      .find((l) => l.includes("Production") && l.includes("Ready"));
    if (!lastDeploy) {
      console.warn(`  ! no Ready production deploy to redeploy from for ${project}`);
      continue;
    }
    const url = lastDeploy.match(/(https:\/\/\S+\.vercel\.app)/)?.[1];
    if (!url) {
      console.warn(`  ! could not parse last deploy URL for ${project}`);
      continue;
    }
    const r = spawnSync("vercel", ["redeploy", url, "--target=production"], {
      cwd,
      stdio: "inherit",
    });
    if (r.status === 0) console.log(`  ✓ ${project} redeploy queued`);
  }
}

// ── Step 7: re-probe to confirm the chain is consistent ──────────────────
console.log(`\nre-probe: hitting ${cfg.probeUrl} with the propagated value…`);
const verifyRes = spawnSync(
  "curl",
  ["-s", "-o", "/dev/null", "-w", "%{http_code}", cfg.probeUrl, "-H", `Authorization: Bearer ${secretValue}`],
  { encoding: "utf8" }
);
console.log(verifyRes.stdout === String(cfg.probeOkStatus) ? "✓ verified" : `✗ verify failed (${verifyRes.stdout})`);

// ── Wipe ─────────────────────────────────────────────────────────────────
secretValue = "";
delete process.env.CLOUDFLARE_API_TOKEN;
console.log("\ndone. secret value wiped from process memory.");
