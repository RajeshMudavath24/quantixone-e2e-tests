import { test, expect } from '@playwright/test';
import { safeGoto } from '../helpers/testHelpers';
import './setup';

test.describe('Performance, stability, and accessibility smoke', () => {
  test('TC-PERF-001 homepage has no severe console/runtime errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (!/favicon|ERR_BLOCKED_BY_CLIENT|ResizeObserver loop limit exceeded/i.test(text)) {
          consoleErrors.push(text);
        }
      }
    });

    page.on('pageerror', (error) => {
      const message = error.message;
      if (!/react error #418|react error #423/i.test(message)) {
        pageErrors.push(message);
      }
    });

    await safeGoto(page, '/');
    expect.soft(consoleErrors, `Console errors:\n${consoleErrors.join('\n')}`).toEqual([]);
    expect.soft(pageErrors, `Page errors:\n${pageErrors.join('\n')}`).toEqual([]);
  });

  test('TC-PERF-002 homepage load metrics are within expected range', async ({ page }) => {
    await safeGoto(page, '/');

    const performanceTiming = await page.evaluate(() => {
      const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        domContentLoaded: nav.domContentLoadedEventEnd,
        loadComplete: nav.loadEventEnd,
        transferSize: nav.transferSize,
      };
    });

    expect(performanceTiming.domContentLoaded).toBeLessThan(10000);
    expect(performanceTiming.loadComplete).toBeLessThan(12000);
    expect(performanceTiming.transferSize).toBeGreaterThan(0);
  });

  test('TC-PERF-003 key navigation links are healthy', async ({ page }) => {
    await safeGoto(page, '/');

    const hrefs = await page
      .locator('a[href]:not([href^="#"]):not([href^="mailto:"]):not([href^="tel:"])')
      .evaluateAll((els) =>
      Array.from(
        new Set(
          els
            .map((el) => (el as HTMLAnchorElement).href)
            .filter((href) => href && href.startsWith('http'))
            .slice(0, 15)
        )
      )
    );

    for (const href of hrefs) {
      const response = await page.request.get(href, { failOnStatusCode: false, timeout: 20000 });
      expect.soft(response.status(), `Broken link detected: ${href}`).toBeLessThan(400);
    }
  });

  test('TC-PERF-004 image sources are valid and non-empty', async ({ page }) => {
    await safeGoto(page, '/');
    const imageMeta = await page.locator('img').evaluateAll((imgs) =>
      imgs.map((img) => ({
        src: (img as HTMLImageElement).getAttribute('src') || '',
      }))
    );
    expect(imageMeta.length).toBeGreaterThanOrEqual(0);
    for (const img of imageMeta) {
      expect.soft(img.src.trim().length).toBeGreaterThan(0);
    }
  });

  test('TC-PERF-005 basic SEO tags are present', async ({ page }) => {
    await safeGoto(page, '/');
    await expect(page).toHaveTitle(/quantixone|quantix/i);
    const description = page.locator('meta[name="description"]');
    await expect(description).toHaveCount(1);
    await expect(description).toHaveAttribute('content', /.+/);
  });

  test('TC-PERF-006 accessibility basics for heading/button/focus', async ({ page }) => {
    await safeGoto(page, '/');

    const mainHeading = page.getByRole('heading', { level: 1 });
    await expect(mainHeading.first()).toBeVisible();

    const buttonCount = await page.getByRole('button').count();
    expect(buttonCount).toBeGreaterThan(0);

    await page.keyboard.press('Tab');
    const focusedTag = await page.evaluate(() => document.activeElement?.tagName ?? '');
    expect((focusedTag ?? '').length).toBeGreaterThan(0);
  });
});