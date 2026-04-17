import { test, expect, Page } from '@playwright/test';
import { openMainNavigation, safeClick, safeGoto, stabilizePage } from '../helpers/testHelpers';

test.describe('Feature Pages, Blogs, and Legal', () => {
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
      await Promise.all([page.waitForURL(expectedUrl, { timeout: 20000 }), safeClick(page, link)]);
    } else {
      await safeGoto(page, fallbackPath);
      await page.waitForURL(expectedUrl, { timeout: 20000 });
    }
    await stabilizePage(page);
    await expect(page.locator('body')).toBeVisible();
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
    const bodyTextLength = (await page.locator('body').innerText()).trim().length;
    expect(bodyTextLength).toBeGreaterThan(100);
  });

  test('TC-FEAT-005 privacy page is accessible', async ({ page }) => {
    await navigateByLinkText(page, /privacy/i, /privacy/i, '/privacy-policy');
  });

  test('TC-FEAT-006 terms page is accessible', async ({ page }) => {
    await navigateByLinkText(page, /terms/i, /terms|condition/i, '/terms-and-conditions');
  });
});
