import { test, expect } from '@playwright/test';
import { safeGoto } from '../helpers/testHelpers';
import './setup';

test.describe('Meeting Booking', () => {
  test('TC-BOOK-001 meeting booking flow works', async ({ page }) => {
    await safeGoto(page, '/');

    const acceptCookies = page.getByRole('button', { name: /\baccept\b/i }).first();
    if (await acceptCookies.isVisible({ timeout: 1500 }).catch(() => false)) {
      await acceptCookies.click();
    }

    const cta = page
      .getByRole('link', { name: /book a demo|book demo|schedule.*demo|get a demo|request.*demo/i })
      .first()
      .or(
        page
          .getByRole('button', {
            name: /book a demo|book demo|schedule.*demo|get a demo|request.*demo/i,
          })
          .first()
      );

    await expect(cta).toBeVisible({ timeout: 10000 });
    await cta.scrollIntoViewIfNeeded();
    await cta.click();

    const calendlyIframe = page
      .locator('iframe[src*="calendly"], iframe[title*="Calendly"], iframe[src*="booking"]')
      .first();
    const bookingHeading = page.getByRole('heading', { name: /book|schedule|demo|meeting/i }).first();

    const reachedBookingSurface = await Promise.race([
      calendlyIframe
        .waitFor({ state: 'visible', timeout: 10000 })
        .then(() => true)
        .catch(() => false),
      expect(page)
        .toHaveURL(/demo|booking/i, { timeout: 10000 })
        .then(() => true)
        .catch(() => false),
    ]);
    expect(reachedBookingSurface).toBeTruthy();

    const bookingVisible =
      (await calendlyIframe.isVisible({ timeout: 2000 }).catch(() => false)) ||
      (await bookingHeading.isVisible({ timeout: 2000 }).catch(() => false));

    expect(bookingVisible).toBeTruthy();
  });
});
