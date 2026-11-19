import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts', 'allure-vitest/setup'],
    exclude: ['tests/e2e/**', 'node_modules/**'],
    reporters: [
      'default',
      [
        'allure-vitest/reporter',
        {
          resultsDir: path.resolve(__dirname, '../../../artifacts/allure-results'),
          globalLabels: { test_layer: 'component-and-unit' },
        },
      ],
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      thresholds: {
        statements: 60,
        branches: 50,
      },
      exclude: [
        'src/lib/api/generated/**',
        'tests/**',
        '**/*.config.*',
        '**/*.d.ts',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
