import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class HomePage extends BasePage {
  readonly heroHeading: Locator;
  readonly heroCTA: Locator;

  constructor(page: Page) {
    super(page);

    this.heroHeading = page.locator('h1');
    this.heroCTA = page.locator('a, button').first();
  }
}