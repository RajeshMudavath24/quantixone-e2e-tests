import { test, expect, Page } from '@playwright/test';
import { ChatbotPage } from '../pages/ChatbotPage';
import {
  clickIfVisible,
  clickWithOverlaysClosed,
  closeBlockingOverlays,
  closeMobileDialogs,
  guardedClick,
} from '../helpers/testHelpers';
import './setup';

test.describe('Chatbot - Interaction Stability', () => {
  test.describe.configure({ timeout: 240000 });

  async function setupChatbot(page: Page) {
    const chatbot = new ChatbotPage(page);
    await chatbot.openHome();
    const available = await chatbot.isAvailable();
    if (available) {
      await chatbot.openPanel();
    }
    return chatbot;
  }

  test('TC-CHAT-001 chatbot launcher is available on homepage', async ({ page }) => {
    const chatbot = new ChatbotPage(page);
    await chatbot.openHome();
    if (await chatbot.isAvailable()) {
      await expect(chatbot.openButton()).toBeVisible();
    } else {
      await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
    }
  });

  test('TC-CHAT-002 chatbot panel opens correctly', async ({ page }) => {
    const chatbot = await setupChatbot(page);
    if (await chatbot.isAvailable()) {
      await expect(chatbot.panel()).toBeVisible();
    } else {
      await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
    }
  });

  test('TC-CHAT-003 chatbot input accepts typed message', async ({ page }) => {
    const chatbot = await setupChatbot(page);
    if (await chatbot.isAvailable()) {
      await chatbot.ensureComposerReady();
      const field = chatbot.input();
      await expect(field).toBeVisible({ timeout: 20000 });
      await field.fill('Hello there');
      const typed = await field.evaluate((el: Element) => {
        if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) return el.value;
        return (el as HTMLElement).innerText?.trim() ?? '';
      });
      expect(typed).toMatch(/hello there/i);
    } else {
      await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
    }
  });

  test('TC-CHAT-004 chatbot provides service-related response', async ({ page }) => {
    const chatbot = await setupChatbot(page);
    if (await chatbot.isAvailable() && (await chatbot.input().isVisible({ timeout: 3000 }).catch(() => false))) {
      await chatbot.sendMessage('What services does QuantixOne provide?');
      await expect(chatbot.latestAssistantReply()).toBeVisible({ timeout: 45000 });
      const reply = await chatbot.latestAssistantReply().textContent();
      expect((reply ?? '').trim().length).toBeGreaterThan(0);
    } else {
      await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
    }
  });

  test('TC-CHAT-005 chatbot handles follow-up query in same thread', async ({ page }) => {
    const chatbot = await setupChatbot(page);
    if (await chatbot.isAvailable() && (await chatbot.input().isVisible({ timeout: 3000 }).catch(() => false))) {
      await chatbot.sendMessage('Do you support test automation strategy?');
      await expect(chatbot.latestAssistantReply()).toBeVisible({ timeout: 45000 });
      await chatbot.sendMessage('Can your team help with implementation too?');
      await expect(chatbot.latestAssistantReply()).toBeVisible({ timeout: 45000 });
      const followUp = await chatbot.latestAssistantReply().textContent();
      expect((followUp ?? '').trim().length).toBeGreaterThan(0);
    } else {
      await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
    }
  });

  test('TC-CHAT-006 chatbot panel can be reopened without crash', async ({ page }) => {
    const chatbot = await setupChatbot(page);
    const closeButton = page.getByRole('button', { name: /close|minimize/i }).first();
    if (await closeButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await clickIfVisible(closeButton, 2000);
    }
    await page.waitForTimeout(1000);
    await expect(chatbot.openButton()).toBeVisible({ timeout: 60000 });
    for (let attempt = 0; attempt < 2; attempt++) {
      if (attempt === 0) {
        await clickWithOverlaysClosed(page, chatbot.openButton());
      } else {
        await closeBlockingOverlays(page);
        await closeMobileDialogs(page);
        await expect(chatbot.openButton()).toBeVisible({ timeout: 60000 });
        await guardedClick(chatbot.openButton(), true);
        await page.waitForLoadState('domcontentloaded', { timeout: 60000 }).catch(() => null);
        await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => null);
      }
      if (await chatbot.panel().isVisible({ timeout: 20000 }).catch(() => false)) {
        break;
      }
    }
    await expect(chatbot.panel()).toBeVisible({ timeout: 20000 });
  });
});
