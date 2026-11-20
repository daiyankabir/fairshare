import { test, expect } from '@playwright/test';

test.describe('Filtering and Search', () => {
  let groupId: string;
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/register');
    const email = `test-${Date.now()}@example.com`;
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', 'password123');
    await page.fill('input[formControlName="name"]', 'Test User');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/groups/);
    
    await page.click('button:has-text("Create group")');
    await page.fill('input[formControlName="name"]', 'Filter Test Group');
    await page.click('button[type="submit"]');
    
    const url = page.url();
    groupId = url.match(/\/groups\/([a-z0-9]+)/)?.[1] || '';
  });

  test('should open filter panel', async ({ page }) => {
    await page.click('a[routerLink="expenses"]');
    
    await page.click('button:has-text("Filters")');
    await expect(page.locator('text=Filters')).toBeVisible();
    await expect(page.locator('text=Categories')).toBeVisible();
    await expect(page.locator('text=Date range')).toBeVisible();
    await expect(page.locator('text=Amount range')).toBeVisible();
  });

  test('should filter by category', async ({ page }) => {
    await page.click('a[routerLink="expenses"]');
    await page.click('button:has-text("Filters")');
    
    // Select a category
    await page.check('input[type="checkbox"][value="food"]');
    await page.click('button:has-text("Apply")');
    
    // Should show filtered results
    await expect(page.locator('text=Food')).toBeVisible();
  });

  test('should filter by date range', async ({ page }) => {
    await page.click('a[routerLink="expenses"]');
    await page.click('button:has-text("Filters")');
    
    const today = new Date().toISOString().split('T')[0];
    const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    await page.fill('input[formControlName="dateFrom"]', lastWeek);
    await page.fill('input[formControlName="dateTo"]', today);
    await page.click('button:has-text("Apply")');
    
    // Should show filtered results
  });

  test('should filter by amount range', async ({ page }) => {
    await page.click('a[routerLink="expenses"]');
    await page.click('button:has-text("Filters")');
    
    await page.fill('input[formControlName="amountMin"]', '1000');
    await page.fill('input[formControlName="amountMax"]', '5000');
    await page.click('button:has-text("Apply")');
    
    // Should show filtered results
  });

  test('should filter by payer', async ({ page }) => {
    await page.click('a[routerLink="expenses"]');
    await page.click('button:has-text("Filters")');
    
    // Select payer
    await page.check('input[type="checkbox"][value="payer-1"]');
    await page.click('button:has-text("Apply")');
  });

  test('should filter by participant', async ({ page }) => {
    await page.click('a[routerLink="expenses"]');
    await page.click('button:has-text("Filters")');
    
    // Select participant
    await page.check('input[type="checkbox"][value="participant-1"]');
    await page.click('button:has-text("Apply")');
  });

  test('should filter by currency', async ({ page }) => {
    await page.click('a[routerLink="expenses"]');
    await page.click('button:has-text("Filters")');
    
    await page.check('input[type="checkbox"][value="USD"]');
    await page.click('button:has-text("Apply")');
  });

  test('should search expenses by description', async ({ page }) => {
    await page.click('a[routerLink="expenses"]');
    
    await page.fill('input[placeholder*="Search"]', 'dinner');
    await expect(page.locator('text=Dinner')).toBeVisible();
  });

  test('should sort expenses by date', async ({ page }) => {
    await page.click('a[routerLink="expenses"]');
    
    await page.selectOption('select[formControlName="sortBy"]', 'date');
    await page.selectOption('select[formControlName="sortOrder"]', 'desc');
    
    // Should show sorted results
  });

  test('should sort expenses by amount', async ({ page }) => {
    await page.click('a[routerLink="expenses"]');
    
    await page.selectOption('select[formControlName="sortBy"]', 'amount');
    await page.selectOption('select[formControlName="sortOrder"]', 'asc');
  });

  test('should save filter', async ({ page }) => {
    await page.click('a[routerLink="expenses"]');
    await page.click('button:has-text("Filters")');
    
    await page.fill('input[formControlName="amountMin"]', '1000');
    await page.click('button:has-text("Save filter")');
    
    await page.fill('input[formControlName="filterName"]', 'My filter');
    await page.click('button:has-text("Save")');
    
    await expect(page.locator('text=My filter')).toBeVisible();
  });

  test('should clear filters', async ({ page }) => {
    await page.click('a[routerLink="expenses"]');
    await page.click('button:has-text("Filters")');
    
    await page.fill('input[formControlName="amountMin"]', '1000');
    await page.click('button:has-text("Clear")');
    
    await expect(page.locator('input[formControlName="amountMin"]')).toHaveValue('');
  });
});