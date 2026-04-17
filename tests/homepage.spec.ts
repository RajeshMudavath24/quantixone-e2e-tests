import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { assertViewportLayout, openMainNavigation } from '../helpers/testHelpers';

test.describe('Homepage - Core Content', () => {
  test('TC-HOME-001 hero heading and CTA are visible', async ({ page }) => {
    const home = new HomePage(page);
    await home.navigate('/');
    await expect(home.heroHeading).toBeVisible();
    await expect(home.heroCTA).toBeVisible();
  });

  test('TC-HOME-002 page title includes brand keyword', async ({ page }) => {
    const home = new HomePage(page);
    await home.navigate('/');
    await expect(page).toHaveTitle(/quantixone|quantix/i);
  });

  test('TC-HOME-003 logo link is present and navigates safely', async ({ page }) => {
    const home = new HomePage(page);
    await home.navigate('/');
    const logo = page.getByRole('link', { name: /quantixone|logo|home/i }).first();
    await expect(logo).toBeVisible();
    await logo.click();
    await expect(page).toHaveURL(/quantixone\.com/);
  });

  test('TC-HOME-004 primary navigation includes Features and Pricing', async ({ page }) => {
    const home = new HomePage(page);
    await home.navigate('/');
    await openMainNavigation(page);
    await expect(home.navigation).toBeVisible();
    await expect(page.getByRole('link', { name: /features/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /pricing/i }).first()).toBeVisible();
  });

  test('TC-HOME-005 footer and legal links are visible', async ({ page }) => {
    const home = new HomePage(page);
    await home.navigate('/');
    await expect(home.footer).toBeVisible();
    await expect(page.getByRole('link', { name: /privacy|policy/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /terms/i }).first()).toBeVisible();
  });

  test('TC-HOME-006 CTA section includes at least one demo/contact action', async ({ page }) => {
    const home = new HomePage(page);
    await home.navigate('/');
    const ctaLinks = page.getByRole('link', { name: /book a demo|get started|contact/i });
    await expect(ctaLinks.first()).toBeVisible();
    expect(await ctaLinks.count()).toBeGreaterThan(0);
  });

  test('TC-HOME-007 hero content stays within viewport threshold', async ({ page }) => {
    const home = new HomePage(page);
    await home.navigate('/');
    await expect(home.heroHeading).toBeVisible();
    await assertViewportLayout(page);
  });

  test('TC-HOME-008 at least one service/features section is rendered', async ({ page }) => {
    const home = new HomePage(page);
    await home.navigate('/');
    const section = page
      .locator('section')
      .filter({ hasText: /service|solution|feature|platform|quality|testing/i })
      .first();
    await expect(section).toBeVisible({ timeout: 15000 });
  });
});