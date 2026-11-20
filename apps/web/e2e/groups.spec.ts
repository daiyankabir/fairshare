import { test, expect } from '@playwright/test';

test.describe('Group Management', () => {
  test.beforeEach(async ({ page }) => {
    // Register and login a new user
    await page.goto('/register');
    const email = `test-${Date.now()}@example.com`;
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', 'password123');
    await page.fill('input[formControlName="name"]', 'Test User');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/groups/);
  });

  test('should display empty groups list initially', async ({ page }) => {
    await expect(page.locator('text=No groups yet')).toBeVisible();
    await expect(page.locator('button:has-text("Create group")')).toBeVisible();
  });

  test('should create a new group', async ({ page }) => {
    await page.click('button:has-text("Create group")');
    
    await expect(page.locator('h1')).toContainText('Create group');
    await page.fill('input[formControlName="name"]', 'Test Group');
    await page.fill('input[formControlName="ownerName"]', 'Test User');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL(/\/groups\/[a-z0-9]+/);
    await expect(page.locator('text=Test Group')).toBeVisible();
  });

  test('should navigate to group dashboard after creation', async ({ page }) => {
    await page.click('button:has-text("Create group")');
    await page.fill('input[formControlName="name"]', 'Dashboard Test Group');
    await page.click('button[type="submit"]');
    
    await expect(page.locator('text=Dashboard Test Group')).toBeVisible();
    await expect(page.locator('text=Balances')).toBeVisible();
    await expect(page.locator('text=Expenses')).toBeVisible();
  });

  test('should show group settings', async ({ page }) => {
    await page.click('button:has-text("Create group")');
    await page.fill('input[formControlName="name"]', 'Settings Test Group');
    await page.click('button[type="submit"]');
    
    await page.click('a[routerLink="settings"]');
    await expect(page.locator('h1')).toContainText('Settings Test Group');
    await expect(page.locator('input[formControlName="name"]')).toHaveValue('Settings Test Group');
  });

  test('should update group name', async ({ page }) => {
    await page.click('button:has-text("Create group")');
    await page.fill('input[formControlName="name"]', 'Original Name');
    await page.click('button[type="submit"]');
    
    await page.click('a[routerLink="settings"]');
    await page.fill('input[formControlName="name"]', 'Updated Name');
    await page.click('button[type="submit"]');
    
    await expect(page.locator('text=Updated Name')).toBeVisible();
  });
});