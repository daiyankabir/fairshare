import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should display login form', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Sign in');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.fill('input[type="email"]', 'wrong@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    await expect(page.locator('.mat-mdc-snack-bar-container')).toBeVisible();
    await expect(page.locator('.mat-mdc-snack-bar-container')).toContainText('Invalid credentials');
  });

  test('should navigate to register page', async ({ page }) => {
    await page.click('a[routerLink="/register"]');
    await expect(page).toHaveURL(/\/register/);
    await expect(page.locator('h1')).toContainText('Create account');
  });

  test('should register a new user', async ({ page }) => {
    await page.goto('/register');
    
    const email = `test-${Date.now()}@example.com`;
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', 'password123');
    await page.fill('input[formControlName="name"]', 'Test User');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL(/\/groups/);
    await expect(page.locator('text=Groups')).toBeVisible();
  });
});