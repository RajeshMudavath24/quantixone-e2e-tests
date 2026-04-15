import { test, expect } from '@playwright/test';

test.describe.configure({ timeout: 60000 });

const navigateToDemoForm = async (page: import('@playwright/test').Page) => {
  await page.goto('https://quantixone.com', { waitUntil: 'domcontentloaded' });

  const cookieAcceptButton = page.getByRole('button', { name: 'Accept' });
  if (await cookieAcceptButton.isVisible()) {
    await cookieAcceptButton.click();
  }

  await Promise.all([
    page.waitForURL('**/free-demo', { timeout: 30000, waitUntil: 'commit' }),
    page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Book a Demo' }).click(),
  ]);

  const bookingsIframe = page.locator('main iframe').first();
  await expect(bookingsIframe).toBeVisible({ timeout: 20000 });
  await bookingsIframe.scrollIntoViewIfNeeded();

  const bookingsFrame = page.frameLocator('main iframe');
  const firstNameInput = bookingsFrame.getByPlaceholder('First and last name *');
  const detailsHeading = bookingsFrame.getByRole('heading', { name: 'Add your details' });

  if (!(await firstNameInput.isVisible())) {
    const firstAvailableDate = bookingsFrame
      .getByRole('button', { name: /Times available/i })
      .first();
    if (await firstAvailableDate.isVisible()) {
      await firstAvailableDate.click();
    }

    const firstAvailableTime = bookingsFrame.getByRole('radio').first();
    if (await firstAvailableTime.isVisible()) {
      await firstAvailableTime.check();
    }
  }

  await expect(detailsHeading).toBeVisible({ timeout: 30000 });
  await expect(firstNameInput).toBeVisible({ timeout: 30000 });

  return { bookingsFrame, firstNameInput };
};

test('Verify form opens after clicking Book a Demo', async ({ page }) => {
  const { firstNameInput } = await navigateToDemoForm(page);
  await expect(firstNameInput).toBeVisible();
});

test('Verify email input accepts value', async ({ page }) => {
  const { bookingsFrame } = await navigateToDemoForm(page);
  const emailInput = bookingsFrame.getByPlaceholder('Email *');

  await expect(emailInput).toBeVisible();
  await emailInput.fill('test@example.com');

  await expect(emailInput).toHaveValue('test@example.com');
});