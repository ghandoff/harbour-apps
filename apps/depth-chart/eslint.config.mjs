import { createRequire } from "module";
import { defineConfig, globalIgnores } from "eslint/config";

const require = createRequire(import.meta.url);
const nextVitals = require("eslint-config-next/core-web-vitals");
const nextTs = require("eslint-config-next/typescript");
// ESLint 9 flat config scopes plugins per config object, so the rule
// overrides below need their own reference to `react` even though
// eslint-config-next already loads it upstream.
const reactPlugin = require("eslint-plugin-react");

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    ".open-next/**",
    ".turbo/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    plugins: { react: reactPlugin },
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@next/next/no-html-link-for-pages": "warn",
      "react/no-unescaped-entities": "warn",
    },
  },
]);

export default eslintConfig;
