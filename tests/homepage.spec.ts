import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';

test('Homepage loads and hero section is visible', async ({ page }) => {
  const home = new HomePage(page);

  await home.navigate('/');

  await expect(home.heroHeading).toBeVisible();
  await expect(home.heroCTA).toBeVisible();
});

test('Verify logo redirects to homepage', async ({ page }) => {
    const home = new HomePage(page);
  
    await home.navigate('/');
  
    const logo = page.locator('a').first(); // basic logo assumption
    await logo.click();
  
    await expect(page).toHaveURL(/quantixone\.com/);
  });
  test('Verify navigation links are visible', async ({ page }) => {
    const home = new HomePage(page);
  
    await home.navigate('/');
  
    const navLinks = page.locator('nav a');
    await expect(navLinks.first()).toBeVisible();
  });
  test('Verify footer links are present', async ({ page }) => {
    const home = new HomePage(page);
  
    await home.navigate('/');
  
    const footerLinks = page.locator('footer a');
    await expect(footerLinks.first()).toBeVisible();
  });