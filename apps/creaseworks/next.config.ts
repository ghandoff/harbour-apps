import type { NextConfig } from "next"; // trigger deploy

const nextConfig: NextConfig = {
  /* creaseworks is served at windedvertigo.com/harbour/creaseworks via Vercel
     multi-zone rewrites (see apps/site/vercel.json). basePath ensures Next.js
     generates correct asset URLs and internal links under that prefix.

     CW_MINI=1 builds the pilot canary flavour instead: basePath
     /harbour/creaseworks-mini, deployed to the wv-harbour-creaseworks-mini
     worker with direct zone routes (see wrangler.mini.jsonc). Same app,
     different mount point — keeps the pilot off prod's path entirely. */
  /* three flavours, one app:
       default  → /harbour/creaseworks            (prod, Neon + Stripe + auth)
       CW_MINI  → /harbour/creaseworks-mini        (pilot canary, D1 + R2)
       CW_EVAL  → /harbour/creaseworks-eval        (cascade audit tool, own D1) */
  basePath: process.env.CW_EVAL
    ? "/harbour/creaseworks-eval"
    : process.env.CW_MINI
      ? "/harbour/creaseworks-mini"
      : "/harbour/creaseworks",
  poweredByHeader: false,

  // expose the flavour to client components — miniHref()/evalHref() use it
  // to emit clean pilot URLs (src/lib/mini-pilot.ts, src/lib/eval-nav.ts)
  env: {
    NEXT_PUBLIC_CW_MINI: process.env.CW_MINI ? "1" : "",
    NEXT_PUBLIC_CW_EVAL: process.env.CW_EVAL ? "1" : "",
  },

  /* mini flavour only: serve the /mini pages at the basePath root so the
     pilot URL is windedvertigo.com/harbour/creaseworks-mini with no
     /mini tail. internal rewrites — the URL bar never changes.

     the "/" rewrite must run beforeFiles: the app has a real root page
     (the prod landing), and afterFiles rewrites only fire when no
     filesystem route matches — so a default-phase "/" rewrite silently
     loses to the landing page. the stage paths have no filesystem
     routes, so afterFiles is fine for them. */
  async rewrites() {
    /* eval flavour: serve the /eval surfaces at the basePath root so the
       audit URL is windedvertigo.com/harbour/creaseworks-eval with no
       /eval tail. same beforeFiles/afterFiles split as mini. */
    if (process.env.CW_EVAL) {
      return {
        beforeFiles: [{ source: "/", destination: "/eval" }],
        afterFiles: [
          { source: "/dashboard", destination: "/eval/dashboard" },
          { source: "/insights", destination: "/eval/insights" },
          { source: "/play/:slug", destination: "/eval/play/:slug" },
        ],
        fallback: [],
      };
    }
    if (!process.env.CW_MINI) return [];
    return {
      // beforeFiles runs BEFORE filesystem routing, so these win over any real
      // app/* route of the same name. "/" needs it (collides with the prod
      // landing) and so does "/find" — the full app has a real app/find/ route
      // (page + challenge/hunt/material children), so an afterFiles "/find"
      // rewrite silently LOSES to it: the mini look stage 404s into full-app
      // chrome (no mini layout → the chrome-hiding :has() rule never fires).
      // /fold, /unfold, /find-again have no colliding route today, but keeping
      // all four here is consistent and collision-proof.
      beforeFiles: [
        { source: "/", destination: "/mini" },
        // public "arc" URLs → legacy page dirs (kept internally as look/make/show/wow)
        { source: "/find", destination: "/mini/look" },
        { source: "/find/:mode", destination: "/mini/look/:mode" },
        { source: "/fold", destination: "/mini/make" },
        { source: "/unfold", destination: "/mini/show" },
        { source: "/find-again", destination: "/mini/wow" },
      ],
      afterFiles: [
        // legacy URLs stay resolvable (worker.mini.ts 301s them to the arc first;
        // these are a safety net if a 301 is ever bypassed)
        { source: "/look", destination: "/mini/look" },
        { source: "/look/:mode", destination: "/mini/look/:mode" },
        { source: "/make", destination: "/mini/make" },
        { source: "/show", destination: "/mini/show" },
        { source: "/wow", destination: "/mini/wow" },
        { source: "/guide", destination: "/mini/guide" },
        { source: "/moderate", destination: "/mini/moderate" },
      ],
      fallback: [],
    };
  },
  transpilePackages: ["@windedvertigo/tokens", "@windedvertigo/auth", "@windedvertigo/stripe", "@windedvertigo/feedback"],

  /* Custom loader routes all next/image requests through Cloudflare CDN
     (cdn.creaseworks.co) instead of Vercel's /_next/image proxy.
     This avoids consuming the 5 000 transforms/mo Hobby quota. */
  images: {
    loader: "custom",
    loaderFile: "./src/lib/cloudflare-image-loader.ts",
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              // Note: unsafe-inline kept for Next.js hydration scripts/styles.
              // Dynamic code execution directive removed — not needed by app or Stripe.js.
              "script-src 'self' 'unsafe-inline' https://js.stripe.com",
              "style-src 'self' 'unsafe-inline'",
              "font-src 'self'",
              "img-src 'self' data: https:",
              "connect-src 'self' https://api.stripe.com",
              "frame-src https://js.stripe.com",
              "worker-src 'self'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
