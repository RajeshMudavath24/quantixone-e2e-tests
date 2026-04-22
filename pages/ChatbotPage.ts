import { expect, Locator, Page } from '@playwright/test';
import { guardedClick, safeClick, safeGoto } from '../helpers/testHelpers';

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
    await safeClick(this.page, this.openButton());
    await expect(this.page.getByRole('button', { name: /close chat/i })).toBeVisible({ timeout: 20000 });
    if (!(await this.panel().isVisible({ timeout: 4000 }).catch(() => false))) {
      await safeClick(this.page, this.openButton());
    }
    await expect(this.panel()).toBeVisible({ timeout: 20000 });
  }

  /**
   * Welcome screen often hides the composer until the user starts a thread
   * (e.g. "Ask a question" or the Messages tab).
   */
  async ensureComposerReady(): Promise<void> {
    const idleMs = 20000;

    const inputNowVisible = async (): Promise<boolean> => {
      const field = this.input();
      if (await field.isVisible({ timeout: 2500 }).catch(() => false)) {
        await expect(field).toBeVisible({ timeout: 8000 });
        await field.scrollIntoViewIfNeeded();
        return true;
      }
      return false;
    };

    for (let attempt = 0; attempt < 4; attempt++) {
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
        await this.page.waitForLoadState('networkidle', { timeout: idleMs }).catch(() => null);
        await this.page.waitForTimeout(500 + attempt * 200);
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
        await this.page.waitForLoadState('networkidle', { timeout: idleMs }).catch(() => null);
        await this.page.waitForTimeout(700 + attempt * 200);
        if (await inputNowVisible()) return;
      }

      const askFallback = this.page
        .getByRole('button', { name: /ask a question|type a message|start (a )?chat|new message/i })
        .first();
      if (await askFallback.isVisible({ timeout: 4000 }).catch(() => false)) {
        await guardedClick(askFallback, true);
        await this.page.waitForLoadState('networkidle', { timeout: idleMs }).catch(() => null);
        await this.page.waitForTimeout(700 + attempt * 200);
        if (await inputNowVisible()) return;
      }

      await this.page.waitForTimeout(400 * (attempt + 1));
    }

    await this.page.waitForTimeout(600);
    await expect(this.input()).toBeVisible({ timeout: 60000 });
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

  async sendMessage(message: string): Promise<void> {
    await this.ensureComposerReady();
    await expect(this.input()).toBeVisible({ timeout: 20000 });
    await this.input().fill(message);
    if (await this.sendButton().isVisible({ timeout: 1000 }).catch(() => false)) {
      await safeClick(this.page, this.sendButton());
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
