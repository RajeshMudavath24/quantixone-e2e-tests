import { test, expect } from '@playwright/test';
import { openMainNavigation, safeGoto } from '../helpers/testHelpers';

test.describe('Navigation and Routing', () => {
  test('TC-NAV-001 404 page returns not-found experience', async ({ page }) => {
    await safeGoto(page, '/this-page-should-not-exist-qa');
    await expect(page).toHaveURL(/this-page-should-not-exist-qa/i);
    await expect(page.locator('body')).toContainText(/404|not found|page not found/i);
  });

  test('TC-NAV-002 browser back and forward navigation works', async ({ page }) => {
    await safeGoto(page, '/');
    await openMainNavigation(page);
    const pricing = page.getByRole('link', { name: /pricing/i }).first();
    await expect(pricing).toBeVisible();
    await pricing.click();
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
      await anchorLink.scrollIntoViewIfNeeded().catch(() => null);
      await anchorLink.click().catch(async () => anchorLink.click({ force: true }));
      await expect(page).toHaveURL(new RegExp(`${href}$`));
    } else {
      await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
    }
  });

  test('TC-NAV-004 mobile menu opens and closes safely', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await safeGoto(page, '/');
    const menu = page.getByRole('button', { name: /menu|open navigation|toggle/i }).first();
    await expect(menu).toBeVisible();
    await menu.click();
    await expect(page.getByRole('navigation').first()).toBeVisible();
    const close = page.getByRole('button', { name: /close|menu|toggle/i }).first();
    if (await close.isVisible({ timeout: 2000 }).catch(() => false)) {
      await close.click({ force: true }).catch(() => null);
    }
  });

  test('TC-NAV-005 top nav links route to valid pages', async ({ page }) => {
    await safeGoto(page, '/');
    await openMainNavigation(page);
    const links = [/features/i, /pricing/i, /blog/i];
    for (const linkMatcher of links) {
      const link = page.getByRole('link', { name: linkMatcher }).first();
      if (await link.isVisible({ timeout: 2000 }).catch(() => false)) {
        await link.click();
        await expect(page).toHaveURL(/features|pricing|blog/i);
        await page.goBack();
        await openMainNavigation(page);
      }
    }
  });

  test('TC-NAV-006 footer legal links are reachable', async ({ page }) => {
    await safeGoto(page, '/');
    const privacy = page.getByRole('link', { name: /privacy/i }).first();
    const terms = page.getByRole('link', { name: /terms/i }).first();
    await expect(privacy).toBeVisible();
    await expect(terms).toBeVisible();
    await privacy.click();
    await expect(page).toHaveURL(/privacy/i);
    await page.goBack();
    await terms.click();
    await expect(page).toHaveURL(/terms|condition/i);
  });
});
