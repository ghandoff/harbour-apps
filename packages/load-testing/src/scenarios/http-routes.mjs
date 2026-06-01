// HTTP route + checkout/auth/Stripe webhook smoke.
//
// Checks every Next route enumerated by `next build` for raft-house (see PR #154
// build output). Uses status-class + a few content sniffs rather than full
// rendering — we want fast pass/fail signals, not visual diffs.
//
// Stripe webhook contract here is the important bit: the route MUST return
//   400 (Bad Request) on a POST with no `stripe-signature` header, NOT 500.
// A 500 means our signature-verification code path threw before checking the
// signature (misconfigured env, broken import, etc). A 400 means the wiring
// is correct AND the route is protected against unsigned POSTs.

/**
 * @param {{ baseUrl: string }} opts
 */
export async function runHttpRoutes({ baseUrl }) {
  const t0 = Date.now();
  const steps = [];
  const step = (name, ok, detail) => steps.push({ step: name, ok, detail });

  // Public routes — 200 expected (Next.js may render with empty state for [code] routes).
  // path "" hits the basePath root (raft-house uses trailingSlash:false; the slash
  // variant 308-redirects to no-slash, so we MUST hit no-slash for the canonical
  // response — including for the security-header assertion below).
  const publicRoutes = [
    { path: "", expectStatus: [200] },
    { path: "/login", expectStatus: [200] },
    { path: "/join", expectStatus: [200] },
    { path: "/facilitate/live/SMOKEROOM", expectStatus: [200] },
    { path: "/play/SMOKEROOM", expectStatus: [200] },
  ];

  // Auth-required routes — should redirect (302/303/307) when unauthenticated.
  // If 200 comes back, Auth.js is rendering a login screen at that route which
  // is still acceptable; we count anything <500 as wired correctly.
  const protectedRoutes = [
    { path: "/facilitate", expectStatus: [200, 302, 303, 307] },
    { path: "/facilitate/history", expectStatus: [200, 302, 303, 307] },
    { path: "/checkout/success", expectStatus: [200, 302, 303, 307] },
  ];

  for (const r of [...publicRoutes, ...protectedRoutes]) {
    try {
      const res = await fetch(baseUrl + r.path, { redirect: "manual" });
      const ok = r.expectStatus.includes(res.status);
      step(`GET ${r.path || "/"}`, ok, `HTTP ${res.status}`);
    } catch (e) {
      step(`GET ${r.path || "/"}`, false, /** @type {Error} */ (e).message);
    }
  }

  // ── /api/auth route handler — Auth.js GET to /api/auth/providers
  // returns 200 with the providers JSON when wired correctly. Any other
  // shape (404, 500, HTML) means Auth.js isn't loaded.
  try {
    const res = await fetch(baseUrl + "/api/auth/providers");
    const ok = res.status === 200;
    let providers = null;
    if (ok) {
      try {
        providers = await res.json();
      } catch {
        /* not JSON */
      }
    }
    step(
      "GET /api/auth/providers",
      ok && providers && typeof providers === "object",
      `HTTP ${res.status}${providers ? `, providers=${Object.keys(providers).join(",")}` : ""}`,
    );
  } catch (e) {
    step("GET /api/auth/providers", false, /** @type {Error} */ (e).message);
  }

  // ── /api/checkout — POST without auth should be 401/403 (or redirect).
  // 500 means the handler crashed; 200 means it created a session for an
  // unauthenticated user (bug). Anything in 4xx is acceptable.
  try {
    const res = await fetch(baseUrl + "/api/checkout", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({}),
      redirect: "manual",
    });
    const ok = res.status >= 400 && res.status < 500;
    step("POST /api/checkout (unauth)", ok, `HTTP ${res.status}`);
  } catch (e) {
    step("POST /api/checkout (unauth)", false, /** @type {Error} */ (e).message);
  }

  // ── /api/save-session — POST without auth should be 401/403 (or redirect).
  try {
    const res = await fetch(baseUrl + "/api/save-session", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({}),
      redirect: "manual",
    });
    const ok = res.status >= 400 && res.status < 500;
    step("POST /api/save-session (unauth)", ok, `HTTP ${res.status}`);
  } catch (e) {
    step("POST /api/save-session (unauth)", false, /** @type {Error} */ (e).message);
  }

  // ── /api/feedback — typically allows anonymous submission. Accept 200/400/401.
  try {
    const res = await fetch(baseUrl + "/api/feedback", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message: "smoke-test ping — please ignore" }),
      redirect: "manual",
    });
    // We don't actually want to spam the feedback channel, so we send a known
    // marker AND require the response to NOT be a 5xx. The feedback route
    // either accepts (200) or rejects unauthenticated (401/403) — both are
    // "wired correctly".
    const ok = res.status < 500;
    step("POST /api/feedback", ok, `HTTP ${res.status}`);
  } catch (e) {
    step("POST /api/feedback", false, /** @type {Error} */ (e).message);
  }

  // ── /api/stripe/webhook — THE critical signature-verification check.
  //   - 400 = correct (route exists, sig verification ran, found nothing to verify)
  //   - 500 = WRONG (route exists but threw before signature check, e.g. missing env)
  //   - 404 = WRONG (route not wired)
  try {
    const res = await fetch(baseUrl + "/api/stripe/webhook", {
      method: "POST",
      headers: { "content-type": "application/json" },
      // Empty body. Stripe webhook handlers expect a `stripe-signature` header AND
      // raw bytes. We send neither — the handler should bail with 400.
      body: "",
      redirect: "manual",
    });
    const ok = res.status === 400;
    step(
      "POST /api/stripe/webhook (no signature → 400)",
      ok,
      `HTTP ${res.status} (500=bad: route threw; 404=bad: not wired; 400=good)`,
    );
  } catch (e) {
    step("POST /api/stripe/webhook (no signature → 400)", false, /** @type {Error} */ (e).message);
  }

  // ── Security headers — sanity that the @windedvertigo/security wrapper
  // is active on this Worker. HIT THE CANONICAL URL (no trailing slash for
  // raft-house) so we get the actual page response, not a 308 redirect.
  try {
    const res = await fetch(baseUrl, { redirect: "manual" });
    const hsts = res.headers.get("strict-transport-security");
    const csp = res.headers.get("content-security-policy");
    const xfo = res.headers.get("x-frame-options");
    step(
      "security-headers-on-root",
      !!hsts && !!csp && !!xfo,
      `hsts=${!!hsts} csp=${!!csp} xfo=${!!xfo}`,
    );
  } catch (e) {
    step("security-headers-on-root", false, /** @type {Error} */ (e).message);
  }

  return {
    scenario: "http-routes",
    passed: steps.every((s) => s.ok),
    steps,
    durationMs: Date.now() - t0,
  };
}
