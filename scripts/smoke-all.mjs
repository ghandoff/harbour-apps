#!/usr/bin/env node
// Cross-stack functional smoke test for the winded.vertigo worker fleet.
//
// Endpoint-based (no secrets needed) — hits live URLs and asserts each worker
// serves + the highest-value service-backed surfaces actually work. Run it after
// ANY secret rotation, deploy, or infra change to confirm nothing broke:
//
//   node scripts/smoke-all.mjs
//
// Exit 0 = all pass, 1 = one or more failures. Complements:
//   - scripts/audit-secrets.mjs        (secret DRIFT across destinations)
//   - port/scripts/audit-rfp-pagination.mjs (RFP board truncation)
// This one checks live FUNCTIONAL health.

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15";

// Each check: { name, url, expect (status or fn), contains? (substring in body) }
const CHECKS = [
  { name: "wv-site home",            url: "https://windedvertigo.com/",                          expect: 200 },
  { name: "wv-site harbour (Notion CMS)", url: "https://windedvertigo.com/harbour",              expect: 200, contains: ["harbour"] },
  { name: "wv-port /api/version",    url: "https://port.windedvertigo.com/api/version",          expect: 200, contains: ["\"worker\""] },
  { name: "wv-port /opportunities",  url: "https://port.windedvertigo.com/opportunities",        expect: 200 },
  { name: "creaseworks",             url: "https://windedvertigo.com/harbour/creaseworks",       expect: 200 },
  { name: "creaseworks auth providers", url: "https://windedvertigo.com/harbour/creaseworks/api/auth/providers", expect: 200, contains: ["google"] },
  { name: "vertigo-vault",           url: "https://windedvertigo.com/harbour/vertigo-vault",     expect: 200 },
  { name: "depth-chart",             url: "https://windedvertigo.com/harbour/depth-chart",       expect: 200 },
  { name: "read-the-room",           url: "https://windedvertigo.com/harbour/read-the-room",     expect: 200 },
  { name: "raft-house",              url: "https://windedvertigo.com/harbour/raft-house",        expect: 200 },
  { name: "ancestry home",           url: "https://ancestry.windedvertigo.com/",                 expect: 200 },
  { name: "ancestry auth providers (own OAuth client)", url: "https://ancestry.windedvertigo.com/api/auth/providers", expect: 200, contains: ["google"] },
];

async function run1(c) {
  try {
    const res = await fetch(c.url, { headers: { "user-agent": UA }, redirect: "follow", signal: AbortSignal.timeout(20000) });
    const okStatus = typeof c.expect === "function" ? c.expect(res.status) : res.status === c.expect;
    let body = "";
    if (c.contains) body = await res.text();
    const missing = (c.contains || []).filter((s) => !body.includes(s));
    const ok = okStatus && missing.length === 0;
    return { ...c, status: res.status, ok, detail: !okStatus ? `HTTP ${res.status}` : missing.length ? `missing: ${missing.join(", ")}` : "" };
  } catch (e) {
    return { ...c, status: 0, ok: false, detail: e.name === "TimeoutError" ? "timeout" : (e.message || "fetch failed").slice(0, 60) };
  }
}

const results = await Promise.all(CHECKS.map(run1));
let failed = 0;
for (const r of results) {
  console.log(`  ${r.ok ? "✓" : "✗"}  ${r.name}  ${r.ok ? "" : "→ " + r.detail}`);
  if (!r.ok) failed++;
}
console.log(`\n${results.length - failed}/${results.length} passed` + (failed ? ` — ${failed} FAILED` : " — all healthy"));
process.exit(failed ? 1 : 0);
