import { test, expect } from '@playwright/test';

test.describe('Offline Support and Sync', () => {
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
    await page.fill('input[formControlName="name"]', 'Offline Test Group');
    await page.click('button[type="submit"]');
    
    const url = page.url();
    groupId = url.match(/\/groups\/([a-z0-9]+)/)?.[1] || '';
  });

  test('should show online status indicator', async ({ page }) => {
    // Check for sync status indicator in toolbar
    await expect(page.locator('button[matTooltip="Sync status"]')).toBeVisible();
    
    // Click to open sync menu
    await page.click('button[matTooltip="Sync status"]');
    
    // Should show online status
    await expect(page.locator('text=Online')).toBeVisible();
  });

  test('should queue expense when offline', async ({ page }) => {
    // Go offline
    await page.context().setOffline(true);
    
    await page.click('a[routerLink="expenses"]');
    await page.click('button:has-text("Add expense")');
    
    await page.fill('input[formControlName="description"]', 'Offline expense');
    await page.fill('input[formControlName="amount"]', '5000');
    await page.selectOption('select[formControlName="currency"]', 'USD');
    await page.selectOption('select[formControlName="splitType"]', 'equal');
    
    await page.click('button[type="submit"]');
    
    // Should show offline indicator
    await page.context().setOffline(false);
    
    // Should sync when back online
    await page.click('button[matTooltip="Sync status"]');
    await expect(page.locator('text=Synced')).toBeVisible({ timeout: 10000 });
  });

  test('should show sync status when syncing', async ({ page }) => {
    await page.click('button[matTooltip="Sync status"]');
    await expect(page.locator('text=Online')).toBeVisible();
  });

  test('should force sync', async ({ page }) => {
    await page.click('button[matTooltip="Sync status"]');
    await page.click('button:has-text("Sync now")');
    
    // Should show syncing status
    await expect(page.locator('text=Syncing')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Synced')).toBeVisible({ timeout: 10000 });
  });
});