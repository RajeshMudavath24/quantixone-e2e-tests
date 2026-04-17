import { expect, Locator, Page } from '@playwright/test';
import { safeGoto } from '../helpers/testHelpers';

export class ChatbotPage {
  constructor(private readonly page: Page) {}

  async openHome(): Promise<void> {
    await safeGoto(this.page, '/');
  }

  openButton(): Locator {
    return this.page.getByRole('button', { name: /chat|assistant|help|support/i }).first();
  }

  async isAvailable(): Promise<boolean> {
    return this.openButton().isVisible({ timeout: 12000 }).catch(() => false);
  }

  async openPanel(): Promise<void> {
    await expect(this.openButton()).toBeVisible({ timeout: 15000 });
    await this.openButton().click();
    await expect(this.panel()).toBeVisible({ timeout: 20000 });
  }

  panel(): Locator {
    return this.page
      .locator('[role="dialog"], [aria-label*="chat" i], [class*="chat" i], [id*="chat" i]')
      .first();
  }

  input(): Locator {
    return this.page
      .getByRole('textbox', { name: /message|ask|chat/i })
      .or(this.page.getByPlaceholder(/message|type|ask/i))
      .first();
  }

  sendButton(): Locator {
    return this.page.getByRole('button', { name: /send|submit|ask/i }).first();
  }

  async sendMessage(message: string): Promise<void> {
    await expect(this.input()).toBeVisible({ timeout: 15000 });
    await this.input().fill(message);
    if (await this.sendButton().isVisible({ timeout: 1000 }).catch(() => false)) {
      await this.sendButton().click();
    } else {
      await this.input().press('Enter');
    }
  }

  latestAssistantReply(): Locator {
    return this.page
      .locator(
        '[class*="bot" i], [class*="assistant" i], [data-testid*="bot" i], [data-testid*="assistant" i], [role="article"]'
      )
      .last();
  }
}
