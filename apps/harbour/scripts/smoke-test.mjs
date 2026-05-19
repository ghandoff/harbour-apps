#!/usr/bin/env node
/**
 * Harbour end-to-end smoke test — hits every public route a first-time
 * visitor would touch, asserts the pier IA markers are present in the
 * HTML, and probes the email-capture API for both happy- and bad-path
 * responses.
 *
 * Run after every harbour deploy to catch regressions before users do.
 *
 * Usage:
 *   node scripts/smoke-test.mjs                                 # localhost:3004
 *   node scripts/smoke-test.mjs https://windedvertigo.com/harbour
 *   node scripts/smoke-test.mjs https://wv-harbour-harbour.windedvertigo.workers.dev/harbour
 *
 * Requires: Node 18+ (uses native fetch).
 */

const BASE = process.argv[2] || "http://localhost:3004/harbour";

/* ── Route definitions ────────────────────────────────────── */

/** Public routes — must return 200 for any visitor. */
const publicRoutes = [
  "/",
  "/start",
  "/login",
];

/**
 * Pier-IA markers that must appear in the rendered /harbour HTML.
 * If any of these disappears, the landing has silently broken.
 */
const piaMarkers = [
  "pier a — leadership",
  "pier b — classroom",
  "pier c — family",
  "drydock — more vessels",
  "opening end of june",
  "not sure where to start",
];

/** /start picker must offer all three options. */
const startMarkers = [
  "who are you",
  "i facilitate workshops",
  "i teach in higher-ed",
  "parent or play-based",
];

/** API routes — register-interest validation. */
const apiTests = [
  {
    label: "register-interest valid drydock",
    path: "/api/harbour/register-interest",
    method: "POST",
    body: { email: "smoke-test@windedvertigo.com", context: "drydock" },
    expectStatus: [200],
    expectJsonOk: true,
  },
  {
    label: "register-interest valid pier-a",
    path: "/api/harbour/register-interest",
    method: "POST",
    body: { email: "smoke-test@windedvertigo.com", context: "pier-a" },
    expectStatus: [200],
    expectJsonOk: true,
  },
  {
    label: "register-interest invalid email",
    path: "/api/harbour/register-interest",
    method: "POST",
    body: { email: "not-an-email", context: "drydock" },
    expectStatus: [400],
  },
  {
    label: "register-interest invalid context",
    path: "/api/harbour/register-interest",
    method: "POST",
    body: { email: "smoke-test@windedvertigo.com", context: "bogus" },
    expectStatus: [400],
  },
  {
    label: "register-interest invalid json",
    path: "/api/harbour/register-interest",
    method: "POST",
    raw: "not json",
    expectStatus: [400],
  },
];

/* ── Test runner ──────────────────────────────────────────── */

const results = [];
let passed = 0;
let warned = 0;
let failed = 0;

async function testRoute(path, expectedStatuses, label, opts = {}) {
  const url = path === "/" ? BASE : `${BASE}${path}`;
  const start = Date.now();

  try {
    const res = await fetch(url, {
      method: opts.method || "GET",
      redirect: "manual",
      headers: {
        "User-Agent": "harbour-smoke-test/1.0",
        ...(opts.body || opts.raw ? { "content-type": "application/json" } : {}),
      },
      body: opts.body ? JSON.stringify(opts.body) : opts.raw,
      signal: AbortSignal.timeout(15000),
    });
    const ms = Date.now() - start;
    const status = res.status;
    const ok = expectedStatuses.includes(status);

    let markersOk = "—";
    let jsonOk = "—";
    if (status === 200 && opts.requireMarkers) {
      const body = await res.text();
      const missing = opts.requireMarkers.filter(
        (m) => !body.toLowerCase().includes(m.toLowerCase()),
      );
      markersOk = missing.length === 0 ? "✓" : `✗ missing: ${missing.join(", ")}`;
    } else if (opts.expectJsonOk) {
      const body = await res.json().catch(() => null);
      jsonOk = body?.ok === true ? "✓" : `✗ body=${JSON.stringify(body)}`;
    }

    const allOk =
      ok &&
      (markersOk === "—" || markersOk === "✓") &&
      (jsonOk === "—" || jsonOk === "✓");

    if (allOk) {
      passed++;
      results.push({ tag: label, status, ms, markers: markersOk, json: jsonOk, icon: "✅" });
    } else {
      failed++;
      results.push({ tag: label, status, ms, markers: markersOk, json: jsonOk, icon: "❌" });
    }
  } catch (err) {
    const ms = Date.now() - start;
    failed++;
    results.push({
      tag: label,
      status: "ERR",
      ms,
      markers: "—",
      json: "—",
      icon: "❌",
      error: err.message?.slice(0, 80),
    });
  }
}

console.log(`\n🔍  Smoke testing ${BASE}\n`);

await testRoute("/", [200], "[pub]  /", { requireMarkers: piaMarkers });
await testRoute("/start", [200], "[pub]  /start", { requireMarkers: startMarkers });
await testRoute("/login", [200], "[pub]  /login");

for (const t of apiTests) {
  await testRoute(t.path, t.expectStatus, `[api]  ${t.label}`, {
    method: t.method,
    body: t.body,
    raw: t.raw,
    expectJsonOk: t.expectJsonOk,
  });
}

/* ── Report ──────────────────────────────────────────────── */

console.log("─".repeat(96));
console.log(
  `${"Route".padEnd(52)} ${"Status".padEnd(8)} ${"Time".padEnd(10)} ${"Markers/JSON"}`,
);
console.log("─".repeat(96));

for (const r of results) {
  const statusStr = String(r.status).padEnd(8);
  const msStr = `${r.ms}ms`.padEnd(10);
  const detail = r.markers !== "—" ? r.markers : r.json;
  console.log(`${r.icon} ${r.tag.padEnd(50)} ${statusStr} ${msStr} ${detail}`);
  if (r.error) console.log(`   └─ ${r.error}`);
}

console.log("─".repeat(96));
console.log(`\n✅ ${passed} passed   ⚠️ ${warned} warnings   ❌ ${failed} errors\n`);

if (failed > 0) process.exit(1);
