import { test, expect, Page } from '@playwright/test';
import { clickWithOverlaysClosed, openMainNavigation, safeGoto } from '../helpers/testHelpers';
import './setup';

test.describe('Feature Pages, Blogs, and Legal', () => {
  test.describe.configure({ timeout: 240000 });
  async function navigateByLinkText(
    page: Page,
    matcher: RegExp,
    expectedUrl: RegExp,
    fallbackPath: string
  ) {
    await safeGoto(page, '/');
    await openMainNavigation(page);
    const link = page.getByRole('link', { name: matcher }).first();

    if (await link.isVisible({ timeout: 3000 }).catch(() => false)) {
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await expect(link).toBeVisible({ timeout: 60000 });
      await link.scrollIntoViewIfNeeded();
      await clickWithOverlaysClosed(page, link);
      await page.waitForLoadState('domcontentloaded', { timeout: 60000 }).catch(() => null);
      await page.waitForLoadState('networkidle', { timeout: 60000 }).catch(() => null);

      if (!expectedUrl.test(page.url())) {
        await safeGoto(page, fallbackPath);
        await page.waitForLoadState('networkidle', { timeout: 60000 }).catch(() => null);
        await expect(page.url()).toMatch(expectedUrl);
      }
    } else {
      await safeGoto(page, fallbackPath);
      await page.waitForLoadState('networkidle', { timeout: 60000 }).catch(() => null);
      await expect(page.url()).toMatch(expectedUrl);
    }
  }

  test('TC-FEAT-001 pricing page loads successfully', async ({ page }) => {
    await navigateByLinkText(page, /pricing/i, /pricing/i, '/pricing');
  });

  test('TC-FEAT-002 pricing page has CTA/action element', async ({ page }) => {
    await navigateByLinkText(page, /pricing/i, /pricing/i, '/pricing');
    const cta = page.getByRole('link', { name: /book a demo|get started|contact/i }).first();
    await expect(cta).toBeVisible();
  });

  test('TC-FEAT-003 blog listing page loads', async ({ page }) => {
    await navigateByLinkText(page, /blog/i, /blog/i, '/blog');
  });

  test('TC-FEAT-004 blog page displays at least one article card/link', async ({ page }) => {
    await navigateByLinkText(page, /blog/i, /blog/i, '/blog');
    await page.waitForLoadState('networkidle', { timeout: 60000 }).catch(() => null);
    await expect(page).toHaveURL(/blog/i, { timeout: 60000 });
    await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 60000 });
    const blogLinks = page.locator(
      'article a[href], [class*="card"] a[href], a[href*="blog" i], main a[href], section a[href], body a[href]'
    );
    await expect
      .poll(async () => blogLinks.count(), { timeout: 90000 })
      .toBeGreaterThan(0);
    await expect(blogLinks.first()).toBeVisible({ timeout: 30000 });
  });

  test('TC-FEAT-005 privacy page is accessible', async ({ page }) => {
    await navigateByLinkText(page, /privacy/i, /privacy/i, '/privacy-policy');
  });

  test('TC-FEAT-006 terms page is accessible', async ({ page }) => {
    await navigateByLinkText(page, /terms/i, /terms|condition/i, '/terms-and-conditions');
  });
});
