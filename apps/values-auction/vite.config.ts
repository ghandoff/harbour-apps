import { defineConfig } from 'vite';

// base is configurable for hosted deployments that live under a subpath
// (e.g. github pages project site: /harbour-apps/values-auction/).
// override at build time: `VA_BASE=/harbour-apps/values-auction/ npm run build`.
const base = process.env.VA_BASE ?? '/';

export default defineConfig({
  base,
  server: {
    port: 5173,
    host: true,
  },
  build: {
    target: 'es2022',
    outDir: 'dist',
    sourcemap: true,
  },
  test: {
    environment: 'jsdom',
    globals: false,
    include: ['tests/**/*.spec.ts'],
    exclude: ['tests/e2e/**'],
  },
} as any);
