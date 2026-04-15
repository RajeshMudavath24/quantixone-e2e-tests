import { test, expect } from '@playwright/test';

test('Check for console errors', async ({ page }) => {
  const errors: string[] = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  await page.goto('https://quantixone.com');

  expect(errors.length).toBe(0);
});

test('Check page load performance', async ({ page }) => {
  const start = Date.now();

  await page.goto('https://quantixone.com');

  const loadTime = Date.now() - start;

  expect(loadTime).toBeLessThan(5000); // 5 sec
});