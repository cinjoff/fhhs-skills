import { test, expect } from '@playwright/test';

test.describe('Login', () => {
  test('should show login form', async ({ page }) => {
    await page.goto('/login');

    expect(await page.locator('.email-input').isVisible()).toBeTruthy();
    expect(await page.locator('input[type="password"]').isVisible()).toBeTruthy();
    expect(await page.locator('.btn-primary').isVisible()).toBeTruthy();
  });

  test('should login successfully', async ({ page }) => {
    await page.goto('/login');

    await page.fill('.email-input', 'admin@acme.com');
    await page.fill('input[type="password"]', 'SecurePass123');
    await page.click('.btn-primary');

    await page.waitForURL('/');
    expect(page.url()).toContain('/');
  });

  test('should show error on invalid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.fill('.email-input', 'wrong@email.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('.btn-primary');

    await expect(page.locator('.text-red-600')).toBeVisible();
  });
});
