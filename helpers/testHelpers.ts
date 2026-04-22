import { expect, Locator, Page } from '@playwright/test';

export async function guardedClick(locator: Locator, allowForce: boolean = false): Promise<void> {
  await expect(locator).toBeVisible({ timeout: 60000 });
  await locator.scrollIntoViewIfNeeded();
  try {
    await locator.click();
  } catch (err) {
    if (!allowForce) {
      throw err;
    }
    await locator.click({ force: true });
  }
}

export async function closeBlockingOverlays(page: Page): Promise<void> {
  if (page.isClosed()) return;
  const cookieButtons = [
    page.getByRole('button', { name: /\b(accept|agree|allow all|got it|allow)\b/i }).first(),
    page.getByRole('button', { name: /decline|reject|close|dismiss/i }).first(),
  ];

  for (const button of cookieButtons) {
    if (await button.isVisible({ timeout: 1500 }).catch(() => false)) {
      await guardedClick(button, true).catch(() => null);
      if (!page.isClosed()) {
        await page.waitForTimeout(200).catch(() => null);
      }
    }
  }
}

export async function closeMobileDialogs(page: Page): Promise<void> {
  if (page.isClosed()) return;
  await page.keyboard.press('Escape').catch(() => null);

  const dialog = page.locator('[role="dialog"]');
  const dialogCount = await dialog.count();
  for (let i = 0; i < Math.min(dialogCount, 3); i++) {
    const currentDialog = dialog.nth(i);
    if (await currentDialog.isVisible({ timeout: 1000 }).catch(() => false)) {
      const closeButton = currentDialog
        .getByRole('button', { name: /close|dismiss|cancel|no thanks|x/i })
        .first();
      if (await closeButton.isVisible({ timeout: 1000 }).catch(() => false)) {
        await guardedClick(closeButton, true).catch(() => null);
      } else {
        await page.keyboard.press('Escape').catch(() => null);
      }
    }
  }
}

/** networkidle max wait — capped so pages with perpetual requests do not burn 60s per stabilize call */
const NETWORK_IDLE_MS = 20000;

export async function stabilizePage(page: Page): Promise<void> {
  if (page.isClosed()) return;
  await page.waitForLoadState('domcontentloaded', { timeout: 60000 }).catch(() => null);
  await page.waitForLoadState('networkidle', { timeout: NETWORK_IDLE_MS }).catch(() => null);
  await closeBlockingOverlays(page);
  await closeMobileDialogs(page);
}

function gotoErrorMessage(err: unknown): string {
  return String((err as { message?: string })?.message ?? err ?? '');
}

/** Transient network / DNS issues — safe to retry without changing test intent */
function isTransientNavigationError(err: unknown): boolean {
  return /ERR_INTERNET_DISCONNECTED|ERR_NETWORK_CHANGED|ERR_CONNECTION_RESET|ERR_CONNECTION_REFUSED|ERR_CONNECTION_ABORTED|ERR_TIMED_OUT|ERR_NAME_NOT_RESOLVED|NS_ERROR_UNKNOWN_HOST|NS_ERROR_NET_RESET|EAI_AGAIN|ETIMEDOUT/i.test(
    gotoErrorMessage(err)
  );
}

export async function safeGoto(page: Page, path: string = '/'): Promise<void> {
  const normalizedPath = path.startsWith('http') ? path : path.startsWith('/') ? path : `/${path}`;
  const primaryUrl = normalizedPath.startsWith('http') ? normalizedPath : `https://quantixone.com${normalizedPath}`;
  const fallbackUrl = normalizedPath.startsWith('http')
    ? normalizedPath.replace('https://quantixone.com', 'https://www.quantixone.com')
    : `https://www.quantixone.com${normalizedPath}`;
  const candidateUrls = primaryUrl === fallbackUrl ? [primaryUrl] : [primaryUrl, fallbackUrl];

  let lastError: unknown;
  const maxRounds = 6;

  for (let round = 0; round < maxRounds; round++) {
    for (const url of candidateUrls) {
      try {
        await page.goto(url, {
          waitUntil: 'domcontentloaded',
          timeout: 60000,
        });
        await stabilizePage(page);
        return;
      } catch (err) {
        lastError = err;
        if (!isTransientNavigationError(err)) {
          throw err;
        }
      }
    }

    if (round < maxRounds - 1) {
      await page.waitForTimeout(2000 + round * 1500);
    }
  }

  throw lastError;
}

export async function openMainNavigation(page: Page): Promise<void> {
  await stabilizePage(page);
  const nav = page.getByRole('navigation').first();
  const navLink = page.getByRole('link', { name: /features|pricing|blog/i }).first();
  if (
    (await nav.isVisible({ timeout: 1000 }).catch(() => false)) ||
    (await navLink.isVisible({ timeout: 1000 }).catch(() => false))
  ) {
    return;
  }
  const menuButton = page
    .getByRole('button', { name: /menu|open navigation|toggle navigation|open menu/i })
    .first();
  if (await menuButton.isVisible({ timeout: 3000 }).catch(() => false)) {
    await guardedClick(menuButton);
    await stabilizePage(page);
    const navigationReady =
      (await nav.isVisible({ timeout: 6000 }).catch(() => false)) ||
      (await navLink.isVisible({ timeout: 6000 }).catch(() => false));
    expect(navigationReady).toBeTruthy();
  }
}

export async function clickIfVisible(locator: Locator, timeoutMs: number = 3000): Promise<boolean> {
  const isVisible = await locator.isVisible({ timeout: timeoutMs }).catch(() => false);
  if (isVisible) {
    await guardedClick(locator, true);
    return true;
  }
  return false;
}

export async function safeClick(page: Page, locator: Locator): Promise<void> {
  await stabilizePage(page);
  await guardedClick(locator, true);
  await page.waitForLoadState('domcontentloaded', { timeout: 60000 }).catch(() => null);
  await page.waitForLoadState('networkidle', { timeout: NETWORK_IDLE_MS }).catch(() => null);
}

/** Click after light overlay handling — avoids a full stabilizePage (duplicate networkidle) before each action */
export async function clickWithOverlaysClosed(page: Page, locator: Locator): Promise<void> {
  if (page.isClosed()) return;
  await closeBlockingOverlays(page);
  await closeMobileDialogs(page);
  if (page.isClosed()) return;
  await expect(locator).toBeVisible({ timeout: 60000 });
  await locator.scrollIntoViewIfNeeded();
  try {
    await locator.click();
  } catch {
    await locator.click({ force: true });
  }
  await page.waitForLoadState('domcontentloaded', { timeout: 60000 }).catch(() => null);
  await page.waitForLoadState('networkidle', { timeout: NETWORK_IDLE_MS }).catch(() => null);
}

export async function assertViewportLayout(page: Page): Promise<void> {
  const viewport = page.viewportSize();
  if (!viewport) return;
  const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
  expect(bodyWidth).toBeLessThanOrEqual(viewport.width + 30);
}
