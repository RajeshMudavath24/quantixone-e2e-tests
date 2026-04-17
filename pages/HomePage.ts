import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class HomePage extends BasePage {
  readonly heroHeading: Locator;
  readonly heroCTA: Locator;
  readonly navigation: Locator;
  readonly footer: Locator;

  constructor(page: Page) {
    super(page);

    this.heroHeading = page.getByRole('heading', { level: 1 }).first();
    this.heroCTA = page.getByRole('link', { name: /book a demo|get started|contact us/i }).first();
    this.navigation = page.getByRole('navigation').first();
    this.footer = page.getByRole('contentinfo').first();
  }
}