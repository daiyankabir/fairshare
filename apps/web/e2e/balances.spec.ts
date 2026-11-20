import { test, expect } from '@playwright/test';

test.describe('Balances and Settlements', () => {
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
    await page.fill('input[formControlName="name"]', 'Balances Test Group');
    await page.click('button[type="submit"]');
    
    const url = page.url();
    groupId = url.match(/\/groups\/([a-z0-9]+)/)?.[1] || '';
  });

  test('should show balances view', async ({ page }) => {
    await page.click('a[routerLink="balances"]');
    await expect(page.locator('h1')).toContainText('Balances');
    await expect(page.locator('text=Who owes whom')).toBeVisible();
  });

  test('should show simplify debts toggle', async ({ page }) => {
    await page.click('a[routerLink="balances"]');
    
    await expect(page.locator('text=Simplify debts')).toBeVisible();
    await expect(page.locator('input[type="checkbox"]')).toBeVisible();
  });

  test('should toggle simplify debts', async ({ page }) => {
    await page.click('a[routerLink="balances"]');
    
    const checkbox = page.locator('input[type="checkbox"]');
    const initialState = await checkbox.isChecked();
    
    await checkbox.click();
    await expect(checkbox).toBeChecked();
    
    await checkbox.click();
    await expect(checkbox).not.toBeChecked();
  });

  test('should record a settlement', async ({ page }) => {
    await page.click('a[routerLink="settlements"]');
    await expect(page.locator('h1')).toContainText('Settlements');
    
    await page.click('button:has-text("Record settlement")');
    await expect(page.locator('h1')).toContainText('Record settlement');
    
    // Fill settlement form
    // This depends on the UI implementation
    await page.click('button[type="submit"]');
  });

  test('should show settlement history', async ({ page }) => {
    await page.click('a[routerLink="settlements"]');
    await expect(page.locator('text=No settlements yet')).toBeVisible();
  });
});