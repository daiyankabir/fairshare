import { test, expect } from '@playwright/test';

test.describe('Multi-currency Support', () => {
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
    await page.fill('input[formControlName="name"]', 'Multi-currency Group');
    await page.selectOption('select[formControlName="defaultCurrency"]', 'EUR');
    await page.click('button[type="submit"]');
    
    const url = page.url();
    groupId = url.match(/\/groups\/([a-z0-9]+)/)?.[1] || '';
  });

  test('should create expense in different currency', async ({ page }) => {
    await page.click('a[routerLink="expenses"]');
    await page.click('button:has-text("Add expense")');
    
    await page.fill('input[formControlName="description"]', 'Paris dinner');
    await page.fill('input[formControlName="amount"]', '8000');
    await page.selectOption('select[formControlName="currency"]', 'EUR');
    await page.selectOption('select[formControlName="splitType"]', 'equal');
    
    await page.click('button[type="submit"]');
    
    await expect(page.locator('text=Paris dinner')).toBeVisible();
    await expect(page.locator('text=€80.00')).toBeVisible();
  });

  test('should create expense in USD with EUR group default', async ({ page }) => {
    await page.click('a[routerLink="expenses"]');
    await page.click('button:has-text("Add expense")');
    
    await page.fill('input[formControlName="description"]', 'Online purchase');
    await page.fill('input[formControlName="amount"]', '5000');
    await page.selectOption('select[formControlName="currency"]', 'USD');
    await page.selectOption('select[formControlName="splitType"]', 'equal');
    
    await page.click('button[type="submit"]');
    
    await expect(page.locator('text=Online purchase')).toBeVisible();
    await expect(page.locator('text=$50.00')).toBeVisible();
  });

  test('should show exchange rate on expense detail', async ({ page }) => {
    await page.click('a[routerLink="expenses"]');
    await page.click('button:has-text("Add expense")');
    
    await page.fill('input[formControlName="description"]', 'Tokyo shopping');
    await page.fill('input[formControlName="amount"]', '10000');
    await page.selectOption('select[formControlName="currency"]', 'JPY');
    await page.selectOption('select[formControlName="splitType"]', 'equal');
    
    await page.click('button[type="submit"]');
    
    // Click on expense to see detail
    await page.click('text=Tokyo shopping');
    
    await expect(page.locator('text=Exchange rate')).toBeVisible();
  });

  test('should convert balances to group default currency', async ({ page }) => {
    // Add expenses in different currencies
    await page.click('a[routerLink="expenses"]');
    await page.click('button:has-text("Add expense")');
    await page.fill('input[formControlName="description"]', 'Expense 1');
    await page.fill('input[formControlName="amount"]', '10000');
    await page.selectOption('select[formControlName="currency"]', 'EUR');
    await page.selectOption('select[formControlName="splitType"]', 'equal');
    await page.click('button[type="submit"]');
    
    await page.click('button:has-text("Add expense")');
    await page.fill('input[formControlName="description"]', 'Expense 2');
    await page.fill('input[formControlName="amount"]', '10000');
    await page.selectOption('select[formControlName="currency"]', 'USD');
    await page.selectOption('select[formControlName="splitType"]', 'equal');
    await page.click('button[type="submit"]');
    
    await page.click('a[routerLink="balances"]');
    
    // Should show balances in EUR (group default)
    await expect(page.locator('text=EUR')).toBeVisible();
  });
});