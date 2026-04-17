import { expect, Locator, Page } from '@playwright/test';

export async function closeBlockingOverlays(page: Page): Promise<void> {
  const cookieButtons = [
    page.getByRole('button', { name: /\b(accept|agree|allow all|got it)\b/i }).first(),
    page.getByRole('button', { name: /decline|reject|close/i }).first(),
  ];

  for (const button of cookieButtons) {
    if (await button.isVisible({ timeout: 1200 }).catch(() => false)) {
      await button.click({ force: true }).catch(() => null);
      await page.waitForTimeout(200);
    }
  }
}

export async function closeMobileDialogs(page: Page): Promise<void> {
  const dialog = page.locator('[role="dialog"]').first();
  if (await dialog.isVisible({ timeout: 1000 }).catch(() => false)) {
    await page.keyboard.press('Escape').catch(() => null);
    const closeButton = page.getByRole('button', { name: /close|dismiss|cancel|x/i }).first();
    if (await closeButton.isVisible({ timeout: 1000 }).catch(() => false)) {
      await closeButton.click({ force: true }).catch(() => null);
    }
  }
}

export async function stabilizePage(page: Page): Promise<void> {
  await closeBlockingOverlays(page);
  await closeMobileDialogs(page);
  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => null);
}

export async function safeGoto(page: Page, path: string = '/'): Promise<void> {
  await page.goto(path, { waitUntil: 'domcontentloaded' });
  await stabilizePage(page);
}

export async function openMainNavigation(page: Page): Promise<void> {
  const nav = page.getByRole('navigation').first();
  if (await nav.isVisible({ timeout: 1000 }).catch(() => false)) {
    return;
  }
  const menuButton = page
    .getByRole('button', { name: /menu|open navigation|toggle navigation|open menu/i })
    .first();
  if (await menuButton.isVisible({ timeout: 3000 }).catch(() => false)) {
    await menuButton.click();
    await expect(page.getByRole('navigation').first()).toBeVisible({ timeout: 10000 });
  }
}

export async function clickIfVisible(locator: Locator, timeoutMs: number = 3000): Promise<boolean> {
  const isVisible = await locator.isVisible({ timeout: timeoutMs }).catch(() => false);
  if (isVisible) {
    await locator.scrollIntoViewIfNeeded().catch(() => null);
    await locator.click().catch(async () => locator.click({ force: true }));
    return true;
  }
  return false;
}

export async function safeClick(page: Page, locator: Locator): Promise<void> {
  await stabilizePage(page);
  await expect(locator).toBeVisible({ timeout: 15000 });
  await locator.scrollIntoViewIfNeeded().catch(() => null);
  await locator.click().catch(async () => locator.click({ force: true }));
}

export async function assertViewportLayout(page: Page): Promise<void> {
  const viewport = page.viewportSize();
  if (!viewport) return;
  const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
  expect(bodyWidth).toBeLessThanOrEqual(viewport.width + 30);
}
