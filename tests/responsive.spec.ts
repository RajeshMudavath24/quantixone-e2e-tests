import { test, expect, Page } from '@playwright/test';
import { assertViewportLayout, openMainNavigation, safeGoto } from '../helpers/testHelpers';

type Viewport = { width: number; height: number; deviceLabel: string };

const viewports: Viewport[] = [
  { width: 1920, height: 1080, deviceLabel: 'desktop-xl' },
  { width: 1280, height: 720, deviceLabel: 'desktop' },
  { width: 768, height: 1024, deviceLabel: 'tablet' },
  { width: 375, height: 812, deviceLabel: 'mobile' },
];

const assertCoreLayout = async (page: Page, viewport: Viewport) => {
  const heading = page.getByRole('heading', { level: 1 }).first();
  await expect(heading).toBeVisible({ timeout: 30000 });

  await openMainNavigation(page);
  await expect(page.getByRole('navigation').first()).toBeVisible();
  await assertViewportLayout(page);

  const primaryCta = page.getByRole('link', { name: /book a demo|get started|contact/i }).first();
  await expect(primaryCta).toBeVisible();
};

for (const viewport of viewports) {
  test(`TC-RESP-${viewport.width} homepage layout on ${viewport.deviceLabel} is usable`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await safeGoto(page, '/');
    await assertCoreLayout(page, viewport);
  });

  test(`TC-RESP-${viewport.width}-B no significant horizontal scroll on ${viewport.deviceLabel}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await safeGoto(page, '/');
    const viewportWidth = viewport.width;
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 30);
  });
}