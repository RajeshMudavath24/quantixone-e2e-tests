import { defineConfig, devices } from '@playwright/test';

const desktop1280 = { width: 1280, height: 720 };

export default defineConfig({
  timeout: 90000,
  testDir: './tests',
  fullyParallel: true,
  workers: process.env.CI ? 2 : undefined,
  expect: {
    timeout: 15000,
  },
  retries: process.env.CI ? 2 : 1,
  reporter: [['list'], ['html', { open: 'never' }]],

  use: {
    baseURL: 'https://quantixone.com',
    video: 'on',
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
    actionTimeout: 15000,
    navigationTimeout: 45000,
  },

  projects: [
    {
      name: 'Chromium',
      use: { ...devices['Desktop Chrome'], viewport: desktop1280 },
    },
    {
      name: 'Firefox',
      use: { ...devices['Desktop Firefox'], viewport: desktop1280 },
    },
    {
      name: 'WebKit',
      use: { ...devices['Desktop Safari'], viewport: desktop1280 },
    },
  ],
});