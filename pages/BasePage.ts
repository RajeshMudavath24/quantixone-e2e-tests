import { Page } from '@playwright/test';
import { safeGoto } from '../helpers/testHelpers';

export class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async navigate(path: string = '/') {
    await safeGoto(this.page, path);
  }
}