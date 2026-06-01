#!/usr/bin/env node
// Runs the full smoke battery for raft-house and prints a pass/fail report.
//
// Usage:
//   node bin/raft-smoke.mjs                          # default: production
//   node bin/raft-smoke.mjs https://...              # custom base URL
//   node bin/raft-smoke.mjs --persistence            # include DO eviction test (+35s)
//   node bin/raft-smoke.mjs --skip prototypes        # exclude a scenario
//
// Exit code: 0 if all scenarios pass, 1 otherwise. So this is CI-friendly.

import { runSessionLifecycle } from "../src/scenarios/session-lifecycle.mjs";
import { runActivityMatrix } from "../src/scenarios/activity-matrix.mjs";
import { runHttpRoutes } from "../src/scenarios/http-routes.mjs";
import { runPrototypes } from "../src/scenarios/prototypes.mjs";

const DEFAULT_BASE = "https://windedvertigo.com/harbour/raft-house";

function parseArgs(argv) {
  const args = { baseUrl: DEFAULT_BASE, persistence: false, skip: new Set() };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--persistence") args.persistence = true;
    else if (a === "--skip") args.skip.add(argv[++i]);
    else if (!a.startsWith("--")) args.baseUrl = a.replace(/\/$/, "");
  }
  return args;
}

const args = parseArgs(process.argv);

const scenarios = [
  { name: "http-routes", run: () => runHttpRoutes({ baseUrl: args.baseUrl }) },
  { name: "session-lifecycle", run: () => runSessionLifecycle({ baseUrl: args.baseUrl, persistence: args.persistence }) },
  { name: "activity-matrix", run: () => runActivityMatrix({ baseUrl: args.baseUrl }) },
  { name: "prototypes", run: () => runPrototypes() },
];

console.log(`\n raft-house smoke battery — ${args.baseUrl}`);
console.log(` started: ${new Date().toISOString()}`);
console.log(` persistence test: ${args.persistence ? "enabled (+35s)" : "skipped"}`);

const results = [];
for (const s of scenarios) {
  if (args.skip.has(s.name)) {
    console.log(`\n  [skip] ${s.name}`);
    continue;
  }
  process.stdout.write(`\n  [run]  ${s.name} ...`);
  const start = Date.now();
  try {
    const r = await s.run();
    results.push(r);
    process.stdout.write(`\r  [${r.passed ? " ok " : "FAIL"}] ${s.name}  (${r.durationMs}ms, ${r.steps.length} steps)\n`);
    for (const step of r.steps) {
      const mark = step.ok ? "✓" : "✗";
      const detail = step.detail ? `  — ${step.detail}` : "";
      console.log(`         ${mark} ${step.step}${detail}`);
    }
  } catch (e) {
    process.stdout.write(`\r  [FAIL] ${s.name}  (${Date.now() - start}ms) — ${/** @type {Error} */ (e).message}\n`);
    results.push({ scenario: s.name, passed: false, steps: [{ step: "scenario-threw", ok: false, detail: /** @type {Error} */ (e).message }], durationMs: Date.now() - start });
  }
}

const allPassed = results.every((r) => r.passed);
const totalSteps = results.reduce((acc, r) => acc + r.steps.length, 0);
const totalFailed = results.reduce((acc, r) => acc + r.steps.filter((s) => !s.ok).length, 0);

console.log(`\n  summary: ${allPassed ? "ALL PASS" : `FAILED ${totalFailed} of ${totalSteps} steps`}`);
console.log(`  scenarios: ${results.filter((r) => r.passed).length}/${results.length} passed\n`);

process.exit(allPassed ? 0 : 1);
