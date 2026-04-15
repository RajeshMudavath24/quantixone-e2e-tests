import { test, expect } from '@playwright/test';

const viewports = [
  { width: 1280, height: 720 },   // laptop
  { width: 768, height: 1024 },   // tablet
  { width: 375, height: 667 },    // mobile
  { width: 1440, height: 900 }    // desktop
];

viewports.forEach((viewport) => {
  test(`Homepage responsive check - ${viewport.width}x${viewport.height}`, async ({ page }) => {

    await page.setViewportSize(viewport);

    await page.goto('https://quantixone.com');

    // Hero section visible
    await expect(page.locator('h1')).toBeVisible();

    // No horizontal scroll
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = viewport.width;

    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 20);
  });
});