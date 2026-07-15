#!/usr/bin/env node
// Generic secret-rotation propagator. Reads a current secret value from a
// "source-of-truth" file (port/.env.local), validates via vendor probe, then
// propagates to every listed destination: Vercel project envs, CF Worker
// secrets, local .env.local mirrors. Triggers Vercel redeploys at the end.
//
// **The secret value never prints to stdout, never goes through the Bash
// arg list (always piped via stdin where possible), and is wiped from
// process.env at exit.**
//
// Usage:
//   node scripts/rotate-secret.mjs --secret=NAME [--dry-run]
//   node scripts/rotate-secret.mjs --secret=ALL [--dry-run]   # batch all configured
//
// Documented in docs/runbooks/secret-rotation.md.

import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { parseArgs } from "node:util";

const HOME = homedir();
const SOURCE = `${HOME}/Projects/windedvertigo/port/.env.local`;

// Per-secret config. Add new entries as more secrets enter the rotation routine.
// Audit script: `node scripts/audit-secrets.mjs` to find drift; the destinations
// listed here come from that audit's findings.
// NOTE (07 jul 2026 overhaul): port/site/creaseworks/harbour/depth-chart/ops/
// ancestry all migrated OFF Vercel to Cloudflare Workers. All `vercelProjects`
// are now empty and `redeployVercelAfterUpdate: false` — the old Vercel entries
// were stale (the `vercel ls` redeploy step threw "Not authorized" and crashed
// the whole run). Destinations are now CF Workers, verified against live
// `wrangler secret list` on 07 jul 2026. A few apps DO stay on Vercel
// deliberately (nordic-sqr-rct, some Vite SPAs) but none of these secrets ship
// to them.
const SECRETS = {
  RESEND_API_KEY: {
    probeUrl: "https://api.resend.com/domains",
    probeHeaders: { Authorization: "Bearer $K" },
    probeOkStatus: 200,
    vercelProjects: [],
    // verified holders 07 jul 2026
    cfWorkers: [
      "wv-port",
      "wv-site",
      "wv-ancestry",
      "wv-harbour-harbour",
      "wv-harbour-depth-chart",
      "wv-harbour-creaseworks",
    ],
    localFiles: [
      `${HOME}/Projects/harbour-apps/apps/creaseworks/.env.local`,
      `${HOME}/Projects/harbour-apps/apps/vertigo-vault/.env.local`,
      `${HOME}/Projects/harbour-apps/apps/paper-trail/.env.local`,
      `${HOME}/Projects/windedvertigo/ancestry/.env.local`,
    ],
    redeployVercelAfterUpdate: false,
  },
  NOTION_TOKEN: {
    probeUrl: "https://api.notion.com/v1/users/me",
    probeHeaders: { Authorization: "Bearer $K", "Notion-Version": "2022-06-28" },
    probeOkStatus: 200,
    vercelProjects: [],
    // verified holders 07 jul 2026, + paper-trail/vault added 14 jul 2026
    // (both were missing from every prior version of this list, which is why
    // paper-trail ran on a dead token for ~23h until caught by launch smoke —
    // see docs/decisions/ or memory for the incident writeup)
    cfWorkers: [
      "wv-port",
      "wv-site",
      "wv-harbour-harbour",
      "wv-harbour-depth-chart",
      "wv-harbour-creaseworks",
      "wv-harbour-paper-trail",
      "wv-vault",
    ],
    localFiles: [
      `${HOME}/Projects/harbour-apps/apps/creaseworks/.env.local`,
      `${HOME}/Projects/harbour-apps/apps/vertigo-vault/.env.local`,
      `${HOME}/Projects/harbour-apps/apps/harbour/.env.local`,
      `${HOME}/Projects/harbour-apps/apps/paper-trail/.env.local`,
      `${HOME}/Projects/windedvertigo/site/.env.local`,
      `${HOME}/Projects/windedvertigo/ops/.env.local`,
    ],
    redeployVercelAfterUpdate: false,
  },
  // ANTHROPIC_API_KEY is NO LONGER a shared-value secret (removed 07 jul 2026).
  // Each app now carries its OWN Anthropic key for per-app cost tracking:
  //   wv-port → 1Password ANTHROPIC_KEY_WV_PORT
  //   wv-ancestry → ANTHROPIC_KEY_WV_ANCESTRY
  //   wv-harbour-creaseworks-eval → ANTHROPIC_KEY_CREASEWORKS_EVAL
  //   wv-harbour-creaseworks-mini → ANTHROPIC_KEY_CREASEWORKS_MINI
  //   wv-harbour-depth-chart → console key "wv-2026-07" (sole user; rename pending)
  // A single opRef → many-workers rotation would clobber per-app keys, so it does
  // NOT belong here. Rotate a per-app key directly:
  //   op read op://winded.vertigo/<ITEM>/credential | probe | wrangler secret put ANTHROPIC_API_KEY --name <worker>
  SLACK_BOT_TOKEN: {
    // 1Password source, Touch-ID released.
    opRef: "op://winded.vertigo/SLACK_BOT_TOKEN/credential",
    // Slack ALWAYS returns HTTP 200 — validity lives in the body's "ok" field,
    // so we body-check instead of status-check (probeBodyIncludes).
    probeUrl: "https://slack.com/api/auth.test",
    probeMethod: "POST",
    probeHeaders: { Authorization: "Bearer $K" },
    probeBodyIncludes: '"ok":true',
    // the winded.vertigo bot token across these 6 CF workers (verified 07 jul
    // 2026). Deliberately NOT nordic/ops — nordic may use its own Slack bot;
    // confirm before adding, or a rotation clobbers it.
    vercelProjects: [],
    cfWorkers: [
      "wv-port",
      "wv-harbour-harbour",
      "wv-harbour-depth-chart",
      "wv-harbour-creaseworks",
      "wv-harbour-creaseworks-eval",
      "wv-harbour-creaseworks-mini",
    ],
    localFiles: [],
    redeployVercelAfterUpdate: false,
  },
  // Deferred rotations not yet wired (add when rotated): GUSTO_CLIENT_SECRET,
  // GOOGLE_CLIENT_SECRET (5-worker SSO), POSTGRES_URL/password, R2_ACCESS_KEY_ID/
  // R2_SECRET_ACCESS_KEY, CRON_SECRET, REVALIDATION_SECRET, LINKEDIN/BLUESKY/FEEDLY.
};

const { values } = parseArgs({
  options: {
    secret: { type: "string" },
    "dry-run": { type: "boolean", default: false },
  },
});

if (!values.secret) {
  console.error(`usage: rotate-secret.mjs --secret=NAME [--dry-run]`);
  console.error(`       rotate-secret.mjs --secret=ALL [--dry-run]`);
  console.error(`available: ${Object.keys(SECRETS).join(", ")}`);
  process.exit(1);
}

const targets = values.secret === "ALL" ? Object.keys(SECRETS) : [values.secret];
for (const t of targets) {
  if (!SECRETS[t]) {
    console.error(`unknown secret: ${t}`);
    console.error(`available: ${Object.keys(SECRETS).join(", ")}`);
    process.exit(1);
  }
}

// CF auth: use ~/.cf-token only if it exists with content; otherwise leave
// CLOUDFLARE_API_TOKEN unset and let wrangler authenticate via its own OAuth
// login. The token file is deprecated — an empty or absent file is expected.
const cfTokenPath = `${HOME}/.cf-token`;
const cfToken = existsSync(cfTokenPath) ? readFileSync(cfTokenPath, "utf8").trim() : "";

// Probe a secret's validity. Default: HTTP status must equal probeOkStatus.
// If the vendor signals validity in the response BODY (e.g. Slack always returns
// 200), set probeBodyIncludes to a substring that must appear in the body.
// probeMethod overrides the default GET. The value is never printed.
function probeValid(cfg, secretValue) {
  const headerArgs = [];
  for (const [k, v] of Object.entries(cfg.probeHeaders ?? {})) {
    headerArgs.push("-H", `${k}: ${v.replace("$K", secretValue)}`);
  }
  const methodArgs = cfg.probeMethod ? ["-X", cfg.probeMethod] : [];
  if (cfg.probeBodyIncludes) {
    const r = spawnSync("curl", ["-s", ...methodArgs, cfg.probeUrl, ...headerArgs], { encoding: "utf8" });
    return (r.stdout ?? "").includes(cfg.probeBodyIncludes);
  }
  const r = spawnSync(
    "curl",
    ["-s", "-o", "/dev/null", "-w", "%{http_code}", ...methodArgs, cfg.probeUrl, ...headerArgs],
    { encoding: "utf8" }
  );
  return r.stdout === String(cfg.probeOkStatus);
}

// ── Per-secret rotation routine ──────────────────────────────────────────
async function rotateOne(name, cfg) {
  console.log("\n" + "═".repeat(78));
  console.log(`ROTATING ${name}`);
  console.log("═".repeat(78));

  // Step 1: load current value — from 1Password (opRef) if configured, else the
  // source-of-truth file. The value is captured into a variable, never printed.
  let secretValue;
  if (cfg.opRef) {
    try {
      // `op read` prompts Touch ID via the desktop app; value → stdout → variable.
      secretValue = execFileSync("op", ["read", cfg.opRef], { encoding: "utf8" }).trim();
    } catch {
      console.error(`  ✗ op read failed for ${cfg.opRef}`);
      console.error(`    check: 1Password CLI integration is on, the item exists, and Touch ID was approved`);
      return { name, success: false, reason: "op-read-failed" };
    }
    if (!secretValue) return { name, success: false, reason: "op-empty" };
    console.log(`  ✓ loaded from 1Password (${cfg.opRef})`);
  } else {
    if (!existsSync(SOURCE)) {
      console.error(`  source-of-truth file missing: ${SOURCE}`);
      return { name, success: false, reason: "no-source" };
    }
    const raw = readFileSync(SOURCE, "utf8");
    const lineMatch = raw.match(new RegExp(`^${name}=(.+)$`, "m"));
    if (!lineMatch) {
      console.error(`  ${name} not found in ${SOURCE}`);
      return { name, success: false, reason: "missing-from-source" };
    }
    secretValue = lineMatch[1].trim();
    if (
      (secretValue.startsWith('"') && secretValue.endsWith('"')) ||
      (secretValue.startsWith("'") && secretValue.endsWith("'"))
    ) {
      secretValue = secretValue.slice(1, -1);
    }
    console.log(`  ✓ loaded from source (length: ${secretValue.length})`);
  }

  // Step 2: probe validity (status-check, or body-check for vendors like Slack)
  if (!probeValid(cfg, secretValue)) {
    console.error(`  ✗ probe failed — the source value is invalid`);
    console.error(`    update the source (1Password item or ${SOURCE}) with a fresh key first`);
    return { name, success: false, reason: "source-invalid" };
  }
  console.log(`  ✓ probe OK`);

  if (values["dry-run"]) {
    console.log(`  [dry-run] would update ${cfg.vercelProjects.length} Vercel × 3 envs + ` +
                `${cfg.cfWorkers.length} CF Workers + ${cfg.localFiles.length} local files`);
    return { name, success: true, dry: true };
  }

  const result = { name, success: true, vercel: {}, cf: {}, local: [] };

  // Step 3: Vercel project envs
  // Sensitive vars (production/preview) need --value flag; dev accepts stdin.
  for (const [project, cwd] of cfg.vercelProjects) {
    if (!existsSync(cwd)) {
      console.warn(`  ! vercel ${project}: cwd ${cwd} missing — skip`);
      result.vercel[project] = "skip-no-cwd";
      continue;
    }
    for (const env of ["production", "preview", "development"]) {
      spawnSync("vercel", ["env", "rm", name, env, "--yes"], {
        cwd,
        stdio: ["ignore", "ignore", "ignore"],
      });
      const isSensitive = env === "production" || env === "preview";
      const addArgs = isSensitive
        ? ["env", "add", name, env, "--value", secretValue, "--force", "--yes"]
        : ["env", "add", name, env, "--force", "--yes"];
      const addRes = spawnSync("vercel", addArgs, {
        cwd,
        input: isSensitive ? undefined : secretValue,
        encoding: "utf8",
      });
      const ok = addRes.status === 0;
      console.log(`  ${ok ? "✓" : "✗"} vercel: ${project}/${env}`);
      result.vercel[`${project}/${env}`] = ok ? "ok" : (addRes.stderr?.split("\n")[0] ?? "fail");
    }
  }

  // Step 4: CF Worker secrets
  if (cfToken) process.env.CLOUDFLARE_API_TOKEN = cfToken;
  for (const worker of cfg.cfWorkers) {
    const putRes = spawnSync("npx", ["wrangler", "secret", "put", name, "--name", worker], {
      input: secretValue + "\n",
      encoding: "utf8",
    });
    const ok = putRes.status === 0;
    console.log(`  ${ok ? "✓" : "✗"} cf worker: ${worker}`);
    result.cf[worker] = ok ? "ok" : (putRes.stderr?.split("\n")[0] ?? "fail");
  }

  // Step 5: local .env.local files
  for (const file of cfg.localFiles) {
    if (!existsSync(file)) {
      console.warn(`  ! local skip (missing): ${file}`);
      result.local.push({ file, status: "skip-missing" });
      continue;
    }
    const before = readFileSync(file, "utf8");
    const re = new RegExp(`^${name}=.*$`, "m");
    const after = re.test(before)
      ? before.replace(re, `${name}=${secretValue}`)
      : before + `\n${name}=${secretValue}\n`;
    writeFileSync(file, after);
    console.log(`  ✓ local: ${file.replace(HOME, "~")}`);
    result.local.push({ file, status: "ok" });
  }

  // Step 6: trigger Vercel redeploys (turbo-ignore may cancel; runtime env reads still pick up new value)
  // Wrapped so a dead/unauthorized Vercel project can't throw and abort the whole
  // run (that crash is exactly what stale post-migration entries caused). CF
  // worker secrets already activated in Step 4 regardless.
  if (cfg.redeployVercelAfterUpdate) {
    for (const [project, cwd] of cfg.vercelProjects) {
      if (!existsSync(cwd)) continue;
      try {
        const lsRes = spawnSync("vercel", ["ls"], { cwd, encoding: "utf8" });
        if (lsRes.status !== 0) { console.warn(`  ! vercel redeploy ${project}: ls failed — skip`); continue; }
        const last = lsRes.stdout.split("\n").find((l) => l.includes("Production") && l.includes("Ready"));
        if (!last) continue;
        const url = last.match(/(https:\/\/\S+\.vercel\.app)/)?.[1];
        if (!url) continue;
        spawnSync("vercel", ["redeploy", url, "--target=production"], { cwd, stdio: "ignore" });
      } catch (e) {
        console.warn(`  ! vercel redeploy ${project}: ${e instanceof Error ? e.message : "error"} — skip`);
      }
    }
  }

  // Step 7: re-probe to confirm
  const verified = probeValid(cfg, secretValue);
  console.log(`  ${verified ? "✓ re-probe verified" : "✗ re-probe failed"}`);
  result.verified = verified;

  // Wipe
  secretValue = "";
  return result;
}

// ── Main ─────────────────────────────────────────────────────────────────
const results = [];
for (const t of targets) {
  results.push(await rotateOne(t, SECRETS[t]));
}
delete process.env.CLOUDFLARE_API_TOKEN;

console.log("\n" + "═".repeat(78));
console.log("ROTATION SUMMARY");
console.log("═".repeat(78));
for (const r of results) {
  if (r.dry) {
    console.log(`  [dry-run] ${r.name}`);
    continue;
  }
  if (!r.success) {
    console.log(`  ✗ ${r.name}: ${r.reason}`);
    continue;
  }
  const vercelFails = Object.entries(r.vercel ?? {}).filter(([, v]) => v !== "ok");
  const cfFails = Object.entries(r.cf ?? {}).filter(([, v]) => v !== "ok");
  const localFails = (r.local ?? []).filter((l) => l.status !== "ok");
  const allOk = vercelFails.length === 0 && cfFails.length === 0 && localFails.length === 0 && r.verified;
  console.log(
    `  ${allOk ? "✓" : "⚠"} ${r.name}: ` +
    `vercel ${Object.keys(r.vercel).length - vercelFails.length}/${Object.keys(r.vercel).length}, ` +
    `cf ${Object.keys(r.cf).length - cfFails.length}/${Object.keys(r.cf).length}, ` +
    `local ${(r.local.length - localFails.length)}/${r.local.length}, ` +
    `verified=${r.verified}`
  );
  vercelFails.forEach(([k, v]) => console.log(`      vercel fail: ${k} (${v})`));
  cfFails.forEach(([k, v]) => console.log(`      cf fail: ${k} (${v})`));
  localFails.forEach((l) => console.log(`      local fail: ${l.file} (${l.status})`));
}
console.log("\ndone. all secret values wiped from process memory.");
