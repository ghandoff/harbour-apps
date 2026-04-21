import { defineConfig, loadEnv } from 'vite';
import { resolve } from 'node:path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    base: env.VITE_BASE_PATH || '/',
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
      },
    },
    server: {
      port: 5173,
      host: true,
    },
    test: {
      environment: 'jsdom',
      globals: false,
      include: ['tests/**/*.spec.ts'],
      exclude: ['tests/e2e/**'],
    },
  } as any;
});
