import { test, expect } from '@playwright/test';

test.describe('Consultflow Homepage', () => {
  test('should display homepage correctly', async ({ page }) => {
    await page.goto('/');

    // Check title
    await expect(page).toHaveTitle(/Consultflow/);

    // Check main heading
    await expect(page.getByRole('heading', { 
      name: 'Consolidated, explainable finance for modern firms.' 
    })).toBeVisible();

    // Check navigation links
    await expect(page.getByRole('link', { name: 'Try the demo' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'View dashboard' })).toBeVisible();

    // Check feature cards
    await expect(page.getByText('Consolidation & multi‑currency')).toBeVisible();
    await expect(page.getByText('Forecasting & scenarios')).toBeVisible();
    await expect(page.getByText('AI that explains')).toBeVisible();
  });

  test('should navigate to onboarding when clicking demo button', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('link', { name: 'Start in demo mode' }).click();
    await expect(page).toHaveURL('/onboarding');
    await expect(page.getByText('Welcome to Consultflow')).toBeVisible();
  });

  test('should navigate to dashboard', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('link', { name: 'View dashboard' }).click();
    await expect(page).toHaveURL('/dashboard');
  });

  test('should have responsive design', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Mobile navigation should be visible
    await expect(page.locator('nav[aria-label="Primary"]')).toBeVisible();

    // Desktop viewport
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto('/');

    // Desktop navigation should be visible
    await expect(page.getByRole('navigation')).toBeVisible();
  });
});