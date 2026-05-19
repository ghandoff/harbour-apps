import type { NextConfig } from "next";

const config: NextConfig = {
  basePath: "/harbour/rubric-co-builder",
  reactStrictMode: true,
  poweredByHeader: false,
  // Note: headers() is not honoured by OpenNext on CF Workers.
  // Security headers are injected by worker.ts via @windedvertigo/security.
  headers: async () => [
    {
      source: "/(.*)",
      headers: [
        { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
      ],
    },
  ],
};

export default config;
