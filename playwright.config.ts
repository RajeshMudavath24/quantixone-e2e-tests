import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  timeout: 30000,

  use: {
    baseURL: 'https://quantixone.com',
    video: 'on',
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'Chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'WebKit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
});