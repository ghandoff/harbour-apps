import type { NextConfig } from "next"; // trigger deploy

const nextConfig: NextConfig = {
  /* creaseworks is served at windedvertigo.com/harbour/creaseworks via Vercel
     multi-zone rewrites (see apps/site/vercel.json). basePath ensures Next.js
     generates correct asset URLs and internal links under that prefix.

     CW_MINI=1 builds the pilot canary flavour instead: basePath
     /harbour/creaseworks-mini, deployed to the wv-harbour-creaseworks-mini
     worker with direct zone routes (see wrangler.mini.jsonc). Same app,
     different mount point — keeps the pilot off prod's path entirely. */
  basePath: process.env.CW_MINI ? "/harbour/creaseworks-mini" : "/harbour/creaseworks",
  poweredByHeader: false,

  // expose the flavour to client components — miniHref() in
  // src/lib/mini-pilot.ts uses it to emit clean pilot URLs
  env: { NEXT_PUBLIC_CW_MINI: process.env.CW_MINI ? "1" : "" },

  /* mini flavour only: serve the /mini pages at the basePath root so the
     pilot URL is windedvertigo.com/harbour/creaseworks-mini with no
     /mini tail. internal rewrites — the URL bar never changes.

     the "/" rewrite must run beforeFiles: the app has a real root page
     (the prod landing), and afterFiles rewrites only fire when no
     filesystem route matches — so a default-phase "/" rewrite silently
     loses to the landing page. the stage paths have no filesystem
     routes, so afterFiles is fine for them. */
  async rewrites() {
    if (!process.env.CW_MINI) return [];
    return {
      beforeFiles: [{ source: "/", destination: "/mini" }],
      afterFiles: [
        { source: "/look", destination: "/mini/look" },
        { source: "/look/:mode", destination: "/mini/look/:mode" },
        { source: "/make", destination: "/mini/make" },
        { source: "/show", destination: "/mini/show" },
        { source: "/wow", destination: "/mini/wow" },
        { source: "/guide", destination: "/mini/guide" },
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
