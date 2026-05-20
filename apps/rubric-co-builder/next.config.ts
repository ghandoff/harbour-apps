import type { NextConfig } from "next";

const BASE_PATH = "/harbour/co-rubric";

const config: NextConfig = {
  basePath: process.env.NODE_ENV === "development" ? "" : BASE_PATH,
  env: {
    // bake the base path into the client bundle so apiPath() works at runtime
    NEXT_PUBLIC_BASE_PATH: process.env.NODE_ENV === "development" ? "" : BASE_PATH,
  },
  reactStrictMode: true,
  poweredByHeader: false,
};

export default config;
