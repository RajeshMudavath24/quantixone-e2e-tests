import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';

test('Homepage loads and hero section is visible', async ({ page }) => {
  const home = new HomePage(page);

  await home.navigate('/');

  await expect(home.heroHeading).toBeVisible();
  await expect(home.heroCTA).toBeVisible();
});