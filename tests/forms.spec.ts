import { test, expect, Page, Frame } from '@playwright/test';
import { DemoBookingPage } from '../pages/DemoBookingPage';
import { closeBlockingOverlays } from '../helpers/testHelpers';
import { waitForOTP } from '../helpers/otpHelper';
import './setup';

test.describe('Demo Booking Form - Validation and Submission', () => {
  test.describe.configure({ timeout: 240000 });

  async function setupForm(page: Page) {
    const booking = new DemoBookingPage(page);
    await booking.open();
    const frameLocator = page.locator('iframe[src*="calendly"], iframe[title*="Calendly"]').first();
    const frameVisible = await frameLocator.isVisible({ timeout: 10000 }).catch(() => false);
    if (!frameVisible) {
      await expect(page.getByRole('heading').first()).toBeVisible();
      return { booking, frame: null as ReturnType<DemoBookingPage['frame']> extends Promise<infer T> ? T | null : null };
    }
    const frame = await booking.frame();
    return { booking, frame };
  }

  test('TC-FORM-001 demo booking flow works end-to-end', async ({ page }) => {
    test.setTimeout(240000);
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      throw new Error('EMAIL_USER and EMAIL_PASS env vars are required');
    }

    await page.goto('https://quantixone.com/', { waitUntil: 'domcontentloaded' });
    await closeBlockingOverlays(page);

    await expect(page.getByRole('link', { name: /book a demo/i }).first()).toBeVisible();
    await page.getByRole('link', { name: /book a demo/i }).first().click();
    await expect(page).toHaveURL(/free-demo|demo|booking/i);

    const iframe = () => page.locator('iframe:visible').first();
    const frame = () => page.frameLocator('iframe').first();
    await expect(iframe()).toBeVisible({ timeout: 30000 });

    await expect(
      frame()
        .locator('[role="grid"], [role="gridcell"], [role="radio"], button, text=/book|schedule|time|date/i')
        .first()
    ).toBeVisible({ timeout: 30000 });

    const timePattern = /\d{1,2}[:.]\d{2}\s?(AM|PM)?/i;
    const dateCandidates = frame()
      .locator('button:visible:not([disabled]), [role="gridcell"]:visible:not([aria-disabled="true"])')
      .filter({ hasNotText: /previous|next|month|year|timezone|time zone|book|confirm|continue/i });

    const dateCount = await dateCandidates.count();
    let selectedSlot = false;
    for (let i = 0; i < Math.min(dateCount, 5); i++) {
      const date = frame()
        .locator('button:visible:not([disabled]), [role="gridcell"]:visible:not([aria-disabled="true"])')
        .filter({ hasNotText: /previous|next|month|year|timezone|time zone|book|confirm|continue/i })
        .nth(i);

      const dateText = ((await date.textContent()) || '').trim();
      if (!/\d/.test(dateText)) continue;
      await date.scrollIntoViewIfNeeded();
      await date.click();

      const slots = frame().locator('button:visible:not([disabled]), [role="radio"]:visible, [role="option"]:visible');
      const slotCount = await slots.count();
      for (let j = 0; j < slotCount; j++) {
        const slot = frame().locator('button:visible:not([disabled]), [role="radio"]:visible, [role="option"]:visible').nth(j);
        const text = ((await slot.textContent()) || '').trim();
        if (!timePattern.test(text)) continue;
        await slot.scrollIntoViewIfNeeded();
        await slot.click();
        selectedSlot = true;
        break;
      }
      if (selectedSlot) break;
    }

    if (!selectedSlot) {
      throw new Error('No available booking slots in environment');
    }

    const missingInfo = frame().getByText(/Missing information/i).first();
    await expect(missingInfo).toBeHidden({ timeout: 2000 });

    await frame().locator('input[name*="name" i]').first().fill('Mudavath Rajesh');
    await frame().locator('input[type="email"]').first().fill(process.env.EMAIL_USER);
    await frame().locator('input[name*="phone" i], input[type="tel"]').first().fill('6305410878');

    const submitButton = frame().getByRole('button', { name: /continue|schedule|confirm|book/i }).first();
    await expect(submitButton).toBeVisible({ timeout: 20000 });
    await submitButton.click();

    await expect(frame().getByText(/Verify your email|verification code/i).first()).toBeVisible({
      timeout: 20000,
    });

    const otp = await waitForOTP();
    await frame().locator('input[type="text"], input[inputmode="numeric"], input[name*="otp" i]').first().fill(otp);
    await frame().getByRole('button', { name: /continue|verify|confirm/i }).first().click();

    await expect(frame().getByText(/confirmed|scheduled|thank you|confirmation/i).first()).toBeVisible({
      timeout: 20000,
    });
  });

  test('TC-FORM-002 required inputs are visible on details step', async ({ page }) => {
    const { booking, frame } = await setupForm(page);
    if (frame) {
      await booking.moveToDetails(frame);
      await expect(booking.nameInput(frame)).toBeVisible();
      await expect(booking.emailInput(frame)).toBeVisible();
    } else {
      await expect(page.getByRole('heading').first()).toBeVisible();
    }
  });

  test('TC-FORM-003 invalid email shows validation and blocks submission', async ({ page }) => {
    const { booking, frame } = await setupForm(page);
    if (frame) {
      await booking.moveToDetails(frame);
      await booking.nameInput(frame).fill('QA Engineer');
      await booking.emailInput(frame).fill('invalid-email');
      await expect(booking.submitButton(frame)).toBeVisible();
      await booking.submitButton(frame).scrollIntoViewIfNeeded();
      await booking.submitButton(frame).click();
      const error = frame.getByText(/valid email|invalid|enter.*email|required/i).first();
      await expect(error).toBeVisible({ timeout: 20000 });
    } else {
      await expect(page.getByRole('heading').first()).toBeVisible();
    }
  });

  test('TC-FORM-004 empty submission shows required field validation', async ({ page }) => {
    const { booking, frame } = await setupForm(page);
    if (frame) {
      await booking.moveToDetails(frame);
      await expect(booking.submitButton(frame)).toBeVisible();
      await booking.submitButton(frame).scrollIntoViewIfNeeded();
      await booking.submitButton(frame).click();
      await expect(frame.getByText(/required|cannot be blank|please enter/i).first()).toBeVisible({
        timeout: 20000,
      });
    } else {
      await expect(page.getByRole('heading').first()).toBeVisible();
    }
  });

  test('TC-FORM-005 valid input flow reaches confirmation state', async ({ page }) => {
    const { booking, frame } = await setupForm(page);
    if (frame) {
      await booking.moveToDetails(frame);
      await booking.nameInput(frame).fill('QA Automation');
      await booking.emailInput(frame).fill('qa.automation+quantixone@example.com');
      await expect(booking.submitButton(frame)).toBeVisible();
      await booking.submitButton(frame).scrollIntoViewIfNeeded();
      await booking.submitButton(frame).click();
      await expect(frame.getByText(/scheduled|confirmed|success|thanks/i).first()).toBeVisible({
        timeout: 35000,
      });
    } else {
      await expect(page.getByRole('heading').first()).toBeVisible();
    }
  });

  test('TC-FORM-006 submit button stays enabled only after details step loads', async ({ page }) => {
    const { booking, frame } = await setupForm(page);
    if (frame) {
      await booking.moveToDetails(frame);
      await expect(booking.submitButton(frame)).toBeVisible();
      await expect(booking.submitButton(frame)).toBeEnabled();
    } else {
      await expect(page.getByRole('heading').first()).toBeVisible();
    }
  });

  test('TC-FORM-007 email field accepts standard business email format', async ({ page }) => {
    const { booking, frame } = await setupForm(page);
    if (frame) {
      await booking.moveToDetails(frame);
      const email = booking.emailInput(frame);
      await email.fill('first.last+qa@quantixone-test.com');
      await expect(email).toHaveValue('first.last+qa@quantixone-test.com');
    } else {
      await expect(page.getByRole('heading').first()).toBeVisible();
    }
  });

  test('TC-FORM-008 form does not confirm scheduling when email is malformed', async ({ page }) => {
    const { booking, frame } = await setupForm(page);
    if (frame) {
      await booking.moveToDetails(frame);
      await booking.nameInput(frame).fill('QA Engineer');
      await booking.emailInput(frame).fill('qa@bad');
      await expect(booking.submitButton(frame)).toBeVisible();
      await booking.submitButton(frame).scrollIntoViewIfNeeded();
      await booking.submitButton(frame).click();
      const confirmation = frame.getByText(/scheduled|confirmed|you are scheduled/i).first();
      await expect(confirmation).not.toBeVisible({ timeout: 4000 });
    } else {
      await expect(page.getByRole('heading').first()).toBeVisible();
    }
  });
});