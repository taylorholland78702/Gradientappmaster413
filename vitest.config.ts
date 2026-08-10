import { defineConfig } from 'vite';
import path from 'path';

// Separate from vite.config.ts (not merged via `test:` block there) so the
// app's build/dev config — asset resolvers, COOP/COEP headers, manual
// chunking — never has to account for a test runner that doesn't need any
// of it, and vice versa.
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts'],
  },
});
