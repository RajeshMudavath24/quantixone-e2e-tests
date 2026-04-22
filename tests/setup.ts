import { test } from '@playwright/test';
import { closeBlockingOverlays, closeMobileDialogs } from '../helpers/testHelpers';

test.beforeEach(async ({ page }) => {
  page.setDefaultTimeout(60000);
  page.on('dialog', async (dialog) => {
    await dialog.dismiss().catch(() => null);
  });
  await closeBlockingOverlays(page);
  await closeMobileDialogs(page);
  await page.keyboard.press('Escape').catch(() => null);
  await page.waitForLoadState('domcontentloaded', { timeout: 60000 }).catch(() => null);
});
