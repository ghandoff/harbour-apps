#!/usr/bin/env node
// Configurable load runner for raft-house.
//
// Usage:
//   node bin/raft-load.mjs --tier smoke              # 2×2×10s, pennies
//   node bin/raft-load.mjs --tier moderate           # 10×20×5min, single $
//   node bin/raft-load.mjs --tier heavy              # 50×100×5min, approaches $10 cap
//   node bin/raft-load.mjs --rooms 5 --participants 3 --duration 30  # custom (seconds)
//
// Smoke tier runs without prompting. Moderate/heavy require --force AND
// print a cost estimate before starting.

import { runLoad, LOAD_TIERS } from "../src/load.mjs";

const DEFAULT_BASE = "https://windedvertigo.com/harbour/raft-house";

function parseArgs(argv) {
  const args = { baseUrl: DEFAULT_BASE, tier: null, rooms: null, participants: null, duration: null, force: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--tier") args.tier = argv[++i];
    else if (a === "--rooms") args.rooms = Number(argv[++i]);
    else if (a === "--participants") args.participants = Number(argv[++i]);
    else if (a === "--duration") args.duration = Number(argv[++i]);
    else if (a === "--force") args.force = true;
    else if (!a.startsWith("--")) args.baseUrl = a.replace(/\/$/, "");
  }
  return args;
}

const args = parseArgs(process.argv);

let config;
if (args.tier) {
  const tier = LOAD_TIERS[args.tier];
  if (!tier) {
    console.error(`unknown tier: ${args.tier}. options: ${Object.keys(LOAD_TIERS).join(", ")}`);
    process.exit(2);
  }
  config = { baseUrl: args.baseUrl, ...tier };
} else if (args.rooms && args.participants && args.duration) {
  config = {
    baseUrl: args.baseUrl,
    rooms: args.rooms,
    participantsPerRoom: args.participants,
    durationMs: args.duration * 1000,
  };
} else {
  console.error("provide --tier {smoke|moderate|heavy} OR --rooms N --participants M --duration SECS");
  process.exit(2);
}

// Cost estimate. Worker request pricing on CF Paid Workers is roughly
// $0.30 per million requests. Each ws message = 1 request; each submit
// round-trip produces ~3 server-side events. Smoke is pennies; moderate
// ~10K msgs ≈ $0.003; heavy ~5M msgs ≈ $1.50 worker-billed.
const estMessages =
  config.rooms *
  config.participantsPerRoom *
  Math.ceil(config.durationMs / (config.submitIntervalMs ?? 2000));
const estUSD = (estMessages / 1_000_000) * 0.3;

console.log(`\n raft-house load test — ${args.baseUrl}`);
console.log(`  rooms:        ${config.rooms}`);
console.log(`  participants: ${config.participantsPerRoom} per room`);
console.log(`  duration:     ${(config.durationMs / 1000).toFixed(0)}s`);
console.log(`  est messages: ${estMessages.toLocaleString()} (Worker requests)`);
console.log(`  est cost:     $${estUSD.toFixed(3)} (CF Worker requests only)\n`);

const isModerateOrHeavy = args.tier === "moderate" || args.tier === "heavy" || estUSD > 0.05;
if (isModerateOrHeavy && !args.force) {
  console.log("  → moderate/heavy tier requires --force to run.");
  console.log("  → re-run with --force to proceed.");
  process.exit(0);
}

const t0 = Date.now();
const result = await runLoad(config);
const wallMs = Date.now() - t0;

console.log(`\n  load test complete (${(wallMs / 1000).toFixed(1)}s wall)\n`);
console.log(`  connections     : ${result.connectionsOk}/${result.totalConnections} ok`);
console.log(`  total messages  : ${result.totalMessages}`);
console.log(`  submit RTT (ms) : p50=${result.stateUpdateRTTms.p50} p95=${result.stateUpdateRTTms.p95} p99=${result.stateUpdateRTTms.p99} max=${result.stateUpdateRTTms.max} (n=${result.stateUpdateRTTms.count})`);
console.log(`  fanout (ms)     : p50=${result.broadcastFanoutMs.p50} p95=${result.broadcastFanoutMs.p95} p99=${result.broadcastFanoutMs.p99} max=${result.broadcastFanoutMs.max} (n=${result.broadcastFanoutMs.count})`);

if (Object.keys(result.errors).length === 0) {
  console.log(`  errors          : none`);
} else {
  console.log(`  errors          :`);
  for (const [k, v] of Object.entries(result.errors)) {
    console.log(`     ${v}× ${k}`);
  }
}
console.log();

process.exit(result.connectionsFailed === 0 && Object.keys(result.errors).length === 0 ? 0 : 1);
