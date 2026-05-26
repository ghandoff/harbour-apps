#!/usr/bin/env node
/**
 * Vault end-to-end smoke test — hits every public + protected route and
 * reports HTTP status, latency, and presence of the title/og:title tags.
 *
 * The PRME-free routes (a sample of `tier=prme` activity slugs) must
 * return 200 with `isAccessibleForFree:true` in the JSON-LD so the free
 * tier remains accessible to past PRME participants without sign-in.
 *
 * Usage:
 *   node scripts/smoke-test.mjs                                 # localhost:3002
 *   node scripts/smoke-test.mjs https://windedvertigo.com/harbour/vertigo-vault
 *   node scripts/smoke-test.mjs https://wv-vault.windedvertigo.workers.dev/harbour/vertigo-vault
 *
 * Requires: Node 18+ (uses native fetch).
 */

const BASE = process.argv[2] || "http://localhost:3002/harbour/vertigo-vault";

/* ── Route definitions ────────────────────────────────────── */

/** Public routes — 200 for any visitor. */
const publicRoutes = [
  "/",
  "/login",
  "/explorer",
  "/practitioner",
  "/teams",
];

/**
 * PRME-free activity slugs — must return 200 with the JSON-LD
 * `isAccessibleForFree:true` so PRME participants without an entitlement
 * can still consume free content. If any of these starts redirecting or
 * 404'ing for an unauthenticated user, free-tier access broke.
 */
const prmeFreeSlugs = [
  "/animal-herding",
  "/build-a-bridge",
  "/cheerleader",
];

/** API routes — expected status per route. */
const apiRoutes = [
  // cron endpoint is CRON_SECRET-gated; without secret → 401
  { path: "/api/cron/sync", method: "POST", expectStatus: [401] },
  // Stripe webhook is POST-only → GET should 405
  { path: "/api/stripe/webhook", method: "GET", expectStatus: [405] },
  // /api/checkout requires sign-in → 401 unauthenticated. Proves the
  // auth gate is wired before any pack-slug logic runs.
  {
    path: "/api/checkout",
    method: "POST",
    expectStatus: [401],
    body: { packSlug: "vault-explorer" },
    label: "explorer checkout (unauth → 401)",
  },
  // Defense-in-depth: even with a forged/valid session, the practitioner
  // slug must be refused at the API layer (videos not ready). The 401
  // happens first for unauthenticated traffic — both prove the slug
  // never reaches the price lookup.
  {
    path: "/api/checkout",
    method: "POST",
    expectStatus: [400, 401],
    body: { packSlug: "vault-practitioner" },
    label: "practitioner checkout (refused)",
  },
  // /api/vault/tier requires sign-in → 401 unauthenticated. Proves the
  // success-page poller's gate exists.
  { path: "/api/vault/tier", method: "GET", expectStatus: [401] },
];

/**
 * Pack-page body assertions — checks the rendered HTML contains the
 * expected sell vs. coming-soon affordance. Catches accidental regressions
 * (someone re-enables the practitioner buy button before videos ship).
 */
const packPageChecks = [
  {
    path: "/explorer",
    mustContain: ["$9.99"],
    mustNotContain: [],
    label: "explorer page sells $9.99",
  },
  {
    path: "/practitioner",
    mustContain: ["coming soon"],
    // No practitioner PurchaseButton should ship from the server-rendered HTML.
    mustNotContain: ['packSlug="vault-practitioner"', "packSlug=\\\"vault-practitioner\\\""],
    label: "practitioner page is coming-soon",
  },
];

/* ── Test runner ──────────────────────────────────────────── */

const results = [];
let passed = 0;
let warned = 0;
let failed = 0;

async function testRoute(path, expectedStatuses, label, opts = {}) {
  // Special-case "/" — appending it to BASE produces a trailing slash that
  // Next.js 308s to strip. Hit BASE without the trailing slash for the home
  // route so we measure the actual response, not the redirect.
  const url = path === "/" ? BASE : `${BASE}${path}`;
  const start = Date.now();

  try {
    const init = {
      method: opts.method || "GET",
      redirect: "manual",
      headers: { "User-Agent": "vault-smoke-test/1.0" },
      signal: AbortSignal.timeout(15000),
    };
    if (opts.body !== undefined) {
      init.headers["Content-Type"] = "application/json";
      init.body = JSON.stringify(opts.body);
    }

    const res = await fetch(url, init);
    const ms = Date.now() - start;
    const status = res.status;
    const ok = expectedStatuses.includes(status);

    let hasTitle = "—";
    let prmeFree = "—";
    let bodyOk = true;
    if (status === 200 && res.headers.get("content-type")?.includes("text/html")) {
      const body = await res.text();
      hasTitle = /<title[^>]*>.+<\/title>/i.test(body) ? "✓" : "✗";
      if (opts.checkPrmeFree) {
        prmeFree = /"isAccessibleForFree":true/.test(body) ? "✓" : "✗";
      }
      if (opts.mustContain) {
        for (const needle of opts.mustContain) {
          if (!body.includes(needle)) bodyOk = false;
        }
      }
      if (opts.mustNotContain) {
        for (const needle of opts.mustNotContain) {
          if (body.includes(needle)) bodyOk = false;
        }
      }
    }

    if (ok && bodyOk && (!opts.checkPrmeFree || prmeFree !== "✗")) {
      passed++;
      results.push({ tag: label, status, ms, hasTitle, prmeFree, ok: true, icon: "✅" });
    } else {
      warned++;
      results.push({ tag: label, status, ms, hasTitle, prmeFree, ok: false, icon: "⚠️" });
    }
  } catch (err) {
    const ms = Date.now() - start;
    failed++;
    results.push({
      tag: label,
      status: "ERR",
      ms,
      hasTitle: "—",
      prmeFree: "—",
      ok: false,
      icon: "❌",
      error: err.message?.slice(0, 60),
    });
  }
}

console.log(`\n🔍  Smoke testing ${BASE}\n`);

for (const path of publicRoutes) {
  await testRoute(path, [200], `[pub]  ${path}`);
}

for (const slug of prmeFreeSlugs) {
  await testRoute(slug, [200], `[prme] ${slug}`, { checkPrmeFree: true });
}

for (const { path, mustContain, mustNotContain, label } of packPageChecks) {
  await testRoute(path, [200], `[pack] ${label}`, { mustContain, mustNotContain });
}

for (const route of apiRoutes) {
  const label = route.label
    ? `[api]  ${route.label}`
    : `[api]  ${route.method} ${route.path}`;
  await testRoute(route.path, route.expectStatus, label, {
    method: route.method,
    body: route.body,
  });
}

/* ── Report ──────────────────────────────────────────────── */

console.log("─".repeat(80));
console.log(
  `${"Route".padEnd(40)} ${"Status".padEnd(8)} ${"Time".padEnd(8)} ${"Title".padEnd(6)} ${"PRME".padEnd(5)}`,
);
console.log("─".repeat(80));

for (const r of results) {
  const statusStr = String(r.status).padEnd(8);
  const msStr = `${r.ms}ms`.padEnd(8);
  console.log(
    `${r.icon} ${r.tag.padEnd(38)} ${statusStr} ${msStr} ${r.hasTitle.padEnd(6)} ${r.prmeFree}`,
  );
  if (r.error) console.log(`   └─ ${r.error}`);
}

console.log("─".repeat(80));
console.log(`\n✅ ${passed} passed   ⚠️ ${warned} warnings   ❌ ${failed} errors\n`);

if (failed > 0) process.exit(1);
