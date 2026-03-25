import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display dashboard heading', async ({ page }) => {
    await expect(page.locator('h1')).toHaveText('Dashboard');
  });

  test('should render metric cards', async ({ page }) => {
    const metricCards = page.locator('[data-testid="metric-card"]');
    await expect(metricCards).toHaveCount(4);
  });

  test('should display sidebar navigation', async ({ page }) => {
    const sidebar = page.locator('nav');
    await expect(sidebar).toBeVisible();
  });

  test('should render chart widget', async ({ page }) => {
    await expect(page.locator('text=User Activity')).toBeVisible();
  });

  test('should render recent users table', async ({ page }) => {
    await expect(page.locator('text=Recent Users')).toBeVisible();
    const rows = page.locator('table tbody tr');
    await expect(rows).toHaveCount(5);
  });

  test('should navigate to users page via sidebar', async ({ page }) => {
    await page.click('nav >> text=Users');
    await page.waitForURL('/users');
    expect(page.url()).toContain('/users');
  });
});
