import { test, expect, Page } from '@playwright/test';
import { ChatbotPage } from '../pages/ChatbotPage';
import {
  clickIfVisible,
  clickWithOverlaysClosed,
  closeBlockingOverlays,
  closeMobileDialogs,
  getValidChatbotResponse,
  guardedClick,
} from '../helpers/testHelpers';
import './setup';
test.describe('Chatbot - Interaction Stability', () => {
  test.describe.configure({ timeout: 240000 });

  async function setupChatbot(page: Page) {
    const chatbot = new ChatbotPage(page);
    await chatbot.openHome();
    await expect
      .poll(async () => chatbot.isAvailable(), { timeout: 30000, intervals: [1000, 2000, 3000] })
      .toBeTruthy();
    expect(await chatbot.isAvailable()).toBeTruthy();
    await chatbot.openPanel();
    await expect(chatbot.panel()).toBeVisible({ timeout: 15000 });
    return chatbot;
  }

  test('TC-CHAT-001 chatbot launcher is available on homepage', async ({ page }) => {
    const chatbot = await setupChatbot(page);
    expect(await chatbot.isAvailable()).toBeTruthy();
    await expect(chatbot.openButton()).toBeVisible({ timeout: 15000 });
    await expect(chatbot.panel()).toBeVisible({ timeout: 15000 });
  });

  test('TC-CHAT-002 chatbot panel opens correctly', async ({ page }) => {
    const chatbot = await setupChatbot(page);
    expect(await chatbot.isAvailable()).toBeTruthy();
    await expect(chatbot.panel()).toBeVisible({ timeout: 15000 });
  });

  test('TC-CHAT-003 chatbot input accepts typed message', async ({ page }) => {
    const chatbot = await setupChatbot(page);
    expect(await chatbot.isAvailable()).toBeTruthy();
    await chatbot.ensureComposerReady();
    const field = chatbot.input();
    await expect(field).toBeVisible({ timeout: 20000 });
    await field.fill('Hello there');
    const typed = await field.evaluate((el: Element) => {
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) return el.value;
      return (el as HTMLElement).innerText?.trim() ?? '';
    });
    expect(typed).toMatch(/hello there/i);
  });

  test('TC-CHAT-004 chatbot provides service-related response', async ({ page }) => {
    const chatbot = await setupChatbot(page);
    expect(await chatbot.isAvailable()).toBeTruthy();
    await expect(chatbot.panel()).toBeVisible({ timeout: 15000 });
    await chatbot.ensureComposerReady();
    await expect(chatbot.input()).toBeVisible({ timeout: 20000 });
    const reply = await getValidChatbotResponse(
      page,
      chatbot,
      'What services does QuantixOne provide?'
    );
    expect(reply.toLowerCase()).toMatch(/service|automation|testing|solution|product/);
  });

  test('TC-CHAT-005 chatbot handles follow-up query in same thread', async ({ page }) => {
    const chatbot = await setupChatbot(page);
    expect(await chatbot.isAvailable()).toBeTruthy();
    await expect(chatbot.panel()).toBeVisible({ timeout: 15000 });
    await chatbot.ensureComposerReady();
    await expect(chatbot.input()).toBeVisible({ timeout: 20000 });
    await getValidChatbotResponse(page, chatbot, 'Do you support automation strategy?');

    const followUp = await getValidChatbotResponse(
      page,
      chatbot,
      'Can your team help with implementation?'
    );
    expect(followUp.toLowerCase()).toMatch(/yes|support|help|team|implementation/);
  });

  test('TC-CHAT-006 chatbot panel can be reopened without crash', async ({ page }) => {
    const chatbot = await setupChatbot(page);
    expect(await chatbot.isAvailable()).toBeTruthy();
    const closeButton = page.getByRole('button', { name: /close|minimize/i }).first();
    if (await closeButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await clickIfVisible(closeButton, 2000);
    }
    await page.waitForTimeout(500);
    await expect(chatbot.openButton()).toBeVisible({ timeout: 30000 });
    for (let attempt = 0; attempt < 2; attempt++) {
      if (attempt === 0) {
        await clickWithOverlaysClosed(page, chatbot.openButton());
      } else {
        await closeBlockingOverlays(page);
        await closeMobileDialogs(page);
        await expect(chatbot.openButton()).toBeVisible({ timeout: 30000 });
        await guardedClick(chatbot.openButton(), true);
        await page.waitForLoadState('domcontentloaded', { timeout: 30000 }).catch(() => null);
        await page.waitForTimeout(250);
      }
      if (await chatbot.panel().isVisible({ timeout: 12000 }).catch(() => false)) {
        break;
      }
    }
    await expect(chatbot.panel()).toBeVisible({ timeout: 15000 });
  });
});
