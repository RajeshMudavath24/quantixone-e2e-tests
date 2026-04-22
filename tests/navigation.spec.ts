import { test, expect } from '@playwright/test';
import { clickWithOverlaysClosed, openMainNavigation, safeClick, safeGoto } from '../helpers/testHelpers';
import './setup';

test.describe('Navigation and Routing', () => {
  test.describe.configure({ timeout: 240000 });
  test('TC-NAV-001 404 page returns not-found experience', async ({ page }) => {
    await safeGoto(page, '/this-page-should-not-exist-qa');
    await expect(page).toHaveURL(/this-page-should-not-exist-qa/i);
    await expect(page.locator('body')).toContainText(/404|not found|page not found/i);
  });

  test('TC-NAV-002 browser back and forward navigation works', async ({ page }) => {
    await safeGoto(page, '/');
    await openMainNavigation(page);
    const pricing = page.getByRole('link', { name: /pricing/i }).first();
    await safeClick(page, pricing);
    await expect(page).toHaveURL(/pricing/i);
    await page.goBack();
    await expect(page).toHaveURL(/quantixone\.com\/?$/);
    await page.goForward();
    await expect(page).toHaveURL(/pricing/i);
  });

  test('TC-NAV-003 in-page anchor navigation scrolls to target section', async ({ page }) => {
    await safeGoto(page, '/');
    const anchorLink = page.locator('a[href^="#"]').first();
    if ((await anchorLink.count()) > 0) {
      const href = await anchorLink.getAttribute('href');
      await safeClick(page, anchorLink);
      await expect(page).toHaveURL(new RegExp(`${href}$`));
    } else {
      await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
    }
  });

  test('TC-NAV-004 mobile menu opens and closes safely', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await safeGoto(page, '/');
    const menu = page.getByRole('button', { name: /menu|open navigation|toggle/i }).first();
    await safeClick(page, menu);
    await expect(page.getByRole('navigation').first()).toBeVisible();
    const close = page.getByRole('button', { name: /close|menu|toggle/i }).first();
    if (await close.isVisible({ timeout: 2000 }).catch(() => false)) {
      await safeClick(page, close);
    }
  });

  test('TC-NAV-005 top nav links route to valid pages', async ({ page }) => {
    await safeGoto(page, '/');
    await openMainNavigation(page);
    const links = [/features/i, /pricing/i, /blog/i];
    for (const linkMatcher of links) {
      const link = page.getByRole('link', { name: linkMatcher }).first();
      if (await link.isVisible({ timeout: 10000 }).catch(() => false)) {
        await expect(link).toBeVisible({ timeout: 60000 });
        await link.scrollIntoViewIfNeeded();
        await clickWithOverlaysClosed(page, link);
        await page.waitForLoadState('networkidle', { timeout: 60000 }).catch(() => null);
        await expect(page).toHaveURL(/features|pricing|blog/i, { timeout: 60000 });
        await safeGoto(page, '/');
        await page.waitForLoadState('domcontentloaded', { timeout: 60000 }).catch(() => null);
        await openMainNavigation(page);
      }
    }
  });

  test('TC-NAV-006 footer legal links are reachable', async ({ page }) => {
    await safeGoto(page, '/');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    const privacy = page.getByRole('link', { name: /privacy/i }).first();
    await expect(privacy).toBeVisible({ timeout: 60000 });
    await privacy.scrollIntoViewIfNeeded();
    await clickWithOverlaysClosed(page, privacy);
    await page.waitForLoadState('networkidle', { timeout: 60000 }).catch(() => null);
    await expect(page).toHaveURL(/privacy/i, { timeout: 60000 });

    await safeGoto(page, '/');
    await page.waitForLoadState('domcontentloaded', { timeout: 60000 }).catch(() => null);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    const terms = page.getByRole('link', { name: /terms/i }).first();
    await expect(terms).toBeVisible({ timeout: 60000 });
    await terms.scrollIntoViewIfNeeded();
    await clickWithOverlaysClosed(page, terms);
    await page.waitForLoadState('networkidle', { timeout: 60000 }).catch(() => null);
    await expect(page).toHaveURL(/terms|condition|legal/i, { timeout: 60000 });
  });
});
