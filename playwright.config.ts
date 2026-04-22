import { defineConfig, devices } from '@playwright/test';

const desktop1280 = { width: 1280, height: 720 };

export default defineConfig({
  timeout: 240000,
  testDir: './tests',
  fullyParallel: true,
  workers: 6,
  expect: {
    timeout: 15000,
  },
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],

  use: {
    baseURL: 'https://quantixone.com',
    ignoreHTTPSErrors: true,
    video: 'on',
    screenshot: 'on',
    trace: 'on',
    actionTimeout: 15000,
    navigationTimeout: 60000,
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