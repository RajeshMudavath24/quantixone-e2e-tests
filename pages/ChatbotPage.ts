import { expect, Locator, Page } from '@playwright/test';
import { clickWithOverlaysClosed, guardedClick, closeBlockingOverlays, closeMobileDialogs } from '../helpers/testHelpers';

export class ChatbotPage {
  private static readonly ASSISTANT_REPLY_SELECTOR =
    '[class*="bot" i], [class*="assistant" i], [data-testid*="bot" i], [data-testid*="assistant" i], [role="article"]';

  constructor(private readonly page: Page) {}

  async openHome(): Promise<void> {
    const urls = ['https://quantixone.com/', 'https://www.quantixone.com/'];
    let lastError: unknown;

    for (const url of urls) {
      try {
        await this.page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await closeBlockingOverlays(this.page);
        await closeMobileDialogs(this.page);
        return;
      } catch (err) {
        lastError = err;
      }
    }

    throw lastError;
  }

  openButton(): Locator {
    return this.page.getByRole('button', { name: /chat|assistant|help|support/i }).first();
  }

  async isAvailable(): Promise<boolean> {
    return this.openButton().isVisible({ timeout: 10000 }).catch(() => false);
  }

  async openPanel(): Promise<void> {
    await expect(this.openButton()).toBeVisible({ timeout: 30000 });
    await clickWithOverlaysClosed(this.page, this.openButton());
    await expect(this.page.getByRole('button', { name: /close chat/i })).toBeVisible({ timeout: 15000 });
    if (!(await this.panel().isVisible({ timeout: 4000 }).catch(() => false))) {
      await clickWithOverlaysClosed(this.page, this.openButton());
    }
    await expect(this.panel()).toBeVisible({ timeout: 15000 });
  }

  /**
   * Welcome screen often hides the composer until the user starts a thread
   * (e.g. "Ask a question" or the Messages tab).
   */
  async ensureComposerReady(): Promise<void> {
    const inputNowVisible = async (): Promise<boolean> => {
      const field = this.input();
      if (await field.isVisible({ timeout: 2500 }).catch(() => false)) {
        await expect(field).toBeVisible({ timeout: 8000 });
        await field.scrollIntoViewIfNeeded();
        return true;
      }
      return false;
    };

    for (let attempt = 0; attempt < 3; attempt++) {
      if (!(await this.panel().isVisible({ timeout: 3000 }).catch(() => false))) {
        await this.openPanel();
      }
      await expect(this.panel()).toBeVisible({ timeout: 20000 });

      if (await inputNowVisible()) return;

      const messagesTab = this.page
        .getByRole('tab', { name: /^messages$/i })
        .or(this.page.getByRole('button', { name: /^messages$/i }))
        .first();
      if (await messagesTab.isVisible({ timeout: 5000 }).catch(() => false)) {
        await guardedClick(messagesTab, true);
        await this.page.waitForLoadState('domcontentloaded').catch(() => null);
        await this.page.waitForTimeout(250 + attempt * 150);
        if (await inputNowVisible()) return;
      }

      const askEntry = this.page
        .getByRole('button', { name: /ask a question/i })
        .filter({ hasText: /AI Agent|team can help/i })
        .or(
          this.page.getByRole('button', {
            name: /type a message|start (a )?chat|new message/i,
          })
        )
        .first();
      if (await askEntry.isVisible({ timeout: 8000 }).catch(() => false)) {
        await guardedClick(askEntry, true);
        await this.page.waitForLoadState('domcontentloaded').catch(() => null);
        await this.page.waitForTimeout(350 + attempt * 150);
        if (await inputNowVisible()) return;
      }

      const askFallback = this.page
        .getByRole('button', { name: /ask a question|type a message|start (a )?chat|new message/i })
        .first();
      if (await askFallback.isVisible({ timeout: 4000 }).catch(() => false)) {
        await guardedClick(askFallback, true);
        await this.page.waitForTimeout(350 + attempt * 150);
        if (await inputNowVisible()) return;
      }

      await this.page.waitForTimeout(250 * (attempt + 1));
    }

    await this.page.waitForTimeout(400);
    await expect(this.input()).toBeVisible({ timeout: 30000 });
    await this.input().scrollIntoViewIfNeeded();
  }

  panel(): Locator {
    const closeChat = this.page.getByRole('button', { name: /close chat/i });
    return this.page
      .locator('div')
      .filter({ has: closeChat })
      .first()
      .or(
        this.page.locator(
          '[role="dialog"], [aria-label*="chat" i], [class*="chat" i], [id*="chat" i]'
        )
      )
      .first();
  }

  input(): Locator {
    const close = this.page.getByRole('button', { name: /close chat/i });
    const inWidget = this.page.locator('div').filter({ has: close });
    const inPanelEditors = inWidget
      .locator(
        'textarea, [contenteditable="true"], [contenteditable], div[role="textbox"], p[contenteditable]'
      )
      .filter({ visible: true });
    return inPanelEditors
      .first()
      .or(inWidget.getByRole('textbox').filter({ visible: true }).first())
      .or(
        this.page
          .getByRole('textbox', { name: /ask a question/i })
          .or(this.page.getByPlaceholder(/ask a question/i))
          .or(this.page.getByRole('textbox', { name: /message|chat/i }))
          .or(this.page.getByPlaceholder(/message|type|ask/i))
      )
      .or(
        this.page
          .locator('[contenteditable="true"], [contenteditable]')
          .filter({ visible: true })
          .filter({ has: close })
          .first()
      );
  }

  sendButton(): Locator {
    return this.page.getByRole('button', { name: /send|submit|ask/i }).first();
  }

  async sendMessage(message: string, ensureReady = true): Promise<void> {
    if (ensureReady) {
      await this.ensureComposerReady();
    }
    await expect(this.input()).toBeVisible({ timeout: 20000 });
    await this.input().fill(message);
    const send = this.sendButton();
    if (await send.isVisible({ timeout: 800 }).catch(() => false)) {
      const clicked = await send
        .click({ timeout: 2000 })
        .then(() => true)
        .catch(() => false);
      if (!clicked) {
        await this.input().press('Enter');
      }
      return;
    }
    await this.input().press('Enter');
  }

  latestAssistantReply(): Locator {
    return this.assistantReplies().last();
  }

  assistantReplies(): Locator {
    return this.page.locator(ChatbotPage.ASSISTANT_REPLY_SELECTOR);
  }
}
