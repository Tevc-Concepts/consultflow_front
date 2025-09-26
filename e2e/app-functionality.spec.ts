import { test, expect } from '@playwright/test';

test.describe('Dashboard Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard');
  });

  test('should display KPI cards', async ({ page }) => {
    // Wait for data to load
    await page.waitForSelector('[data-testid="dashboard-container"]');

    // Check for KPI cards
    await expect(page.getByText('Revenue')).toBeVisible();
    await expect(page.getByText('Gross Profit')).toBeVisible();
    await expect(page.getByText('Net Income')).toBeVisible();
    await expect(page.getByText('Cash Balance')).toBeVisible();
    await expect(page.getByText('Burn Rate')).toBeVisible();
  });

  test('should allow filtering by date range', async ({ page }) => {
    // Wait for the page to load
    await page.waitForSelector('[data-testid="dashboard-container"]');

    // Check if date range filters are available
    await expect(page.getByText('Last 30')).toBeVisible();
    await expect(page.getByText('Last 90')).toBeVisible();
    await expect(page.getByText('Custom')).toBeVisible();

    // Click on Last 90 days
    await page.getByText('Last 90').click();
    
    // Check if button is selected (has different styling)
    await expect(page.getByText('Last 90')).toHaveClass(/bg-medium/);
  });

  test('should display revenue vs expenses chart', async ({ page }) => {
    // Wait for data to load
    await page.waitForSelector('[data-testid="dashboard-container"]');

    // Check for chart container
    await expect(page.getByText('Revenue vs Expenses')).toBeVisible();
  });

  test('should show company selector', async ({ page }) => {
    // Wait for page load
    await page.waitForSelector('[data-testid="dashboard-container"]');

    // Check for company selector
    await expect(page.getByText('Company')).toBeVisible();
    
    // Check if there's a select element
    const select = page.locator('select');
    await expect(select.first()).toBeVisible();
  });

  test('should handle mobile view', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/dashboard');

    // Wait for load
    await page.waitForSelector('[data-testid="dashboard-container"]');

    // Check if KPI cards are horizontally scrollable on mobile
    const kpiContainer = page.locator('.overflow-x-auto');
    await expect(kpiContainer.first()).toBeVisible();

    // Check mobile navigation
    await expect(page.locator('nav[aria-label="Primary"]')).toBeVisible();
  });
});

test.describe('Reports Page', () => {
  test('should display P&L report by default', async ({ page }) => {
    await page.goto('/reports');

    // Check for P&L tab selected
    await expect(page.getByRole('tab', { name: 'P&L' })).toHaveAttribute('aria-selected', 'true');
    
    // Check for P&L content
    await expect(page.getByText('Profit & Loss')).toBeVisible();
  });

  test('should switch between report tabs', async ({ page }) => {
    await page.goto('/reports');

    // Click on Balance Sheet tab
    await page.getByRole('tab', { name: 'Balance Sheet' }).click();
    await expect(page.getByText('Balance Sheet')).toBeVisible();

    // Click on Cash Flow tab
    await page.getByRole('tab', { name: 'Cash Flow' }).click();
    await expect(page.getByText('Cash Flow')).toBeVisible();
  });
});

test.describe('Authentication Flow', () => {
  test('should show login page', async ({ page }) => {
    await page.goto('/login');

    await expect(page.getByText('Sign in to Consultflow')).toBeVisible();
    await expect(page.getByRole('textbox', { name: /email/i })).toBeVisible();
    await expect(page.getByRole('textbox', { name: /password/i })).toBeVisible();
  });

  test('should navigate to onboarding for demo', async ({ page }) => {
    await page.goto('/login');

    await page.getByRole('link', { name: 'demo mode' }).click();
    await expect(page).toHaveURL('/onboarding');
  });
});

test.describe('Report Builder', () => {
  test('should display builder interface', async ({ page }) => {
    await page.goto('/builder');

    await expect(page.getByText('Report Builder')).toBeVisible();
    await expect(page.getByText('Slides')).toBeVisible();
    await expect(page.getByText('Block Palette')).toBeVisible();
  });

  test('should allow adding new slides', async ({ page }) => {
    await page.goto('/builder');

    const addButton = page.getByRole('button', { name: 'Add' });
    await expect(addButton).toBeVisible();
    
    // Count initial slides
    const initialSlides = await page.locator('.border.rounded-xl.p-3').count();
    
    // Add new slide
    await addButton.click();
    
    // Check if slide count increased
    const newSlides = await page.locator('.border.rounded-xl.p-3').count();
    expect(newSlides).toBe(initialSlides + 1);
  });
});