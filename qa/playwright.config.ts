import { defineConfig, devices } from '@playwright/test';
import path from 'node:path';

const uiUrl = process.env.QA_UI_URL ?? 'http://localhost:3001';
const bffUrl = process.env.QA_BFF_URL ?? 'http://localhost:8090';
const collectDiagnostics = process.env.QA_ALLURE_REPORT !== '1';

export default defineConfig({
  testDir: '.',
  testMatch: [
    '**/ui/**/*.spec.ts',
    '**/api/**/*.spec.ts',
    '**/microservices/**/*.spec.ts',
    '**/e2e/**/*.spec.ts',
  ],
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  timeout: 45_000,
  expect: { timeout: 10_000 },
  reporter: [
    ['list'],
    ['html', { outputFolder: '../artifacts/playwright-report', open: 'never' }],
    ['junit', { outputFile: '../artifacts/playwright-results.xml' }],
    [
      'allure-playwright',
      {
        resultsDir: path.resolve('artifacts/allure-results'),
        detail: false,
        globalLabels: { test_layer: 'QA' },
      },
    ],
  ],
  outputDir: '../artifacts/test-results',
  globalSetup: './global-setup.ts',
  use: {
    trace: collectDiagnostics ? 'retain-on-failure' : 'off',
    screenshot: collectDiagnostics ? 'only-on-failure' : 'off',
    video: collectDiagnostics ? 'retain-on-failure' : 'off',
  },
  projects: [
    {
      name: 'ui',
      testMatch: '**/ui/**/*.spec.ts',
      use: { ...devices['Desktop Chrome'], baseURL: uiUrl },
    },
    {
      name: 'api',
      testMatch: '**/api/**/*.spec.ts',
      use: { baseURL: bffUrl },
    },
    {
      name: 'microservices',
      testMatch: '**/microservices/**/*.spec.ts',
      use: { baseURL: bffUrl },
    },
    {
      name: 'e2e',
      testMatch: '**/e2e/**/*.spec.ts',
      use: { ...devices['Desktop Chrome'], baseURL: uiUrl },
    },
  ],
});
