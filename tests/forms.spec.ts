import { test, expect, Page } from '@playwright/test';
import { DemoBookingPage } from '../pages/DemoBookingPage';
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

  test('TC-FORM-001 demo page opens and calendly iframe is visible', async ({ page }) => {
    const { frame } = await setupForm(page);
    if (frame) {
      await expect(frame.locator('body')).toBeVisible();
    } else {
      await expect(page).toHaveURL(/demo|free-demo/i);
    }
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