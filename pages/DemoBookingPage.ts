import { expect, FrameLocator, Page } from '@playwright/test';
import { closeBlockingOverlays, safeGoto } from '../helpers/testHelpers';

export class DemoBookingPage {
  constructor(private readonly page: Page) {}

  async open(): Promise<void> {
    await safeGoto(this.page, '/');
    const demoEntry = this.page.getByRole('link', { name: /book a demo|demo/i }).first();
    await expect(demoEntry).toBeVisible({ timeout: 20000 });
    await Promise.all([
      this.page.waitForURL(/demo|free-demo|calendly/i, { timeout: 30000 }),
      demoEntry.click(),
    ]);
  }

  async frame(): Promise<FrameLocator> {
    const iframe = this.page.locator('iframe[src*="calendly"], iframe[title*="Calendly"]').first();
    await expect(iframe).toBeVisible({ timeout: 45000 });
    await iframe.scrollIntoViewIfNeeded();
    await closeBlockingOverlays(this.page);
    return this.page.frameLocator('iframe[src*="calendly"], iframe[title*="Calendly"]').first();
  }

  async moveToDetails(frame: FrameLocator): Promise<void> {
    const detailsHeading = frame.getByRole('heading', { name: /add your details/i }).first();
    if (await detailsHeading.isVisible({ timeout: 4000 }).catch(() => false)) return;

    const dateOption = frame
      .getByRole('button', { name: /times available|selected date - times available/i })
      .first();
    await expect(dateOption).toBeVisible({ timeout: 35000 });
    await dateOption.click();

    const timeSlot = frame.getByRole('radio').first();
    await expect(timeSlot).toBeVisible({ timeout: 20000 });
    await timeSlot.check({ force: true });
    await expect(detailsHeading).toBeVisible({ timeout: 20000 });
  }

  nameInput(frame: FrameLocator) {
    return frame.getByLabel(/name/i).or(frame.getByPlaceholder(/first.*name|first and last name/i)).first();
  }

  emailInput(frame: FrameLocator) {
    return frame.getByLabel(/email/i).or(frame.getByPlaceholder(/email/i)).first();
  }

  submitButton(frame: FrameLocator) {
    return frame.getByRole('button', { name: /schedule event|confirm|submit|book/i }).first();
  }
}
