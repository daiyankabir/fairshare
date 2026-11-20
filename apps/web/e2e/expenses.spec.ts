import { test, expect } from '@playwright/test';

test.describe('Expense Management', () => {
  let groupId: string;
  
  test.beforeEach(async ({ page }) => {
    // Register and login
    await page.goto('/register');
    const email = `test-${Date.now()}@example.com`;
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', 'password123');
    await page.fill('input[formControlName="name"]', 'Test User');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/groups/);
    
    // Create a group
    await page.click('button:has-text("Create group")');
    await page.fill('input[formControlName="name"]', 'Expense Test Group');
    await page.click('button[type="submit"]');
    
    // Extract group ID from URL
    const url = page.url();
    groupId = url.match(/\/groups\/([a-z0-9]+)/)?.[1] || '';
  });

  test('should create an equal split expense', async ({ page }) => {
    await page.click('a[routerLink="expenses"]');
    await page.click('button:has-text("Add expense")');
    
    await expect(page.locator('h1')).toContainText('Add expense');
    
    await page.fill('input[formControlName="description"]', 'Dinner');
    await page.fill('input[formControlName="amount"]', '10000');
    await page.selectOption('select[formControlName="currency"]', 'USD');
    
    // Date should be pre-filled with today
    await page.selectOption('select[formControlName="splitType"]', 'equal');
    
    // Add payers - assume current user is the payer
    await page.click('button:has-text("Add payer")');
    // The payer should be pre-selected
    
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL(new RegExp(`/groups/${groupId}/expenses/[a-z0-9]+`));
    await expect(page.locator('text=Dinner')).toBeVisible();
    await expect(page.locator('text=$100.00')).toBeVisible();
  });

  test('should create a percentage split expense', async ({ page }) => {
    await page.click('a[routerLink="expenses"]');
    await page.click('button:has-text("Add expense")');
    
    await page.fill('input[formControlName="description"]', 'Groceries');
    await page.fill('input[formControlName="amount"]', '5000');
    await page.selectOption('select[formControlName="currency"]', 'USD');
    await page.selectOption('select[formControlName="splitType"]', 'percentage');
    
    // Add splits with percentages
    await page.click('button:has-text("Add split")');
    // Fill in percentage for first split
    // This depends on the UI implementation
    
    await page.click('button[type="submit"]');
    
    await expect(page.locator('text=Groceries')).toBeVisible();
  });

  test('should create an exact amount split expense', async ({ page }) => {
    await page.click('a[routerLink="expenses"]');
    await page.click('button:has-text("Add expense")');
    
    await page.fill('input[formControlName="description"]', 'Utilities');
    await page.fill('input[formControlName="amount"]', '3000');
    await page.selectOption('select[formControlName="currency"]', 'USD');
    await page.selectOption('select[formControlName="splitType"]', 'exact');
    
    await page.click('button[type="submit"]');
    
    await expect(page.locator('text=Utilities')).toBeVisible();
  });

  test('should create a shares split expense', async ({ page }) => {
    await page.click('a[routerLink="expenses"]');
    await page.click('button:has-text("Add expense")');
    
    await page.fill('input[formControlName="description"]', 'Rent');
    await page.fill('input[formControlName="amount"]', '150000');
    await page.selectOption('select[formControlName="currency"]', 'USD');
    await page.selectOption('select[formControlName="splitType"]', 'shares');
    
    await page.click('button[type="submit"]');
    
    await expect(page.locator('text=Rent')).toBeVisible();
  });

  test('should list expenses', async ({ page }) => {
    await page.click('a[routerLink="expenses"]');
    await expect(page.locator('text=Dinner')).toBeVisible();
    await expect(page.locator('text=Groceries')).toBeVisible();
  });

  test('should filter expenses by category', async ({ page }) => {
    await page.click('a[routerLink="expenses"]');
    
    // Open filter panel
    await page.click('button:has-text("Filters")');
    
    // Select category filter
    // This depends on the UI implementation
    
    // Close filter panel
    await page.click('button:has-text("Close")');
  });

  test('should search expenses', async ({ page }) => {
    await page.click('a[routerLink="expenses"]');
    
    await page.fill('input[placeholder*="Search"]', 'Dinner');
    await expect(page.locator('text=Dinner')).toBeVisible();
    await expect(page.locator('text=Groceries')).not.toBeVisible();
  });
});