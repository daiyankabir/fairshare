import { test, expect } from '@playwright/test';

test.describe('Full User Flow', () => {
  test('register -> create group -> invite guest -> add expenses -> view balances -> simplify debts -> settle up', async ({ page, context }) => {
    // 1. Register
    await page.goto('/register');
    const email = `owner-${Date.now()}@example.com`;
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', 'password123');
    await page.fill('input[formControlName="name"]', 'Group Owner');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/groups/);
    
    // 2. Create group
    await page.click('button:has-text("Create group")');
    await page.fill('input[formControlName="name"]', 'Trip to Japan');
    await page.selectOption('select[formControlName="defaultCurrency"]', 'JPY');
    await page.fill('input[formControlName="coverEmoji"]', '🗾');
    await page.fill('input[formControlName="ownerName"]', 'Group Owner');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL(/\/groups\/[a-z0-9]+/);
    const groupUrl = page.url();
    const groupId = groupUrl.match(/\/groups\/([a-z0-9]+)/)?.[1];
    expect(groupId).toBeTruthy();
    
    // 3. Invite guest
    await page.click('a[routerLink="members"]');
    await page.click('button:has-text("Invite member")');
    await page.selectOption('select[formControlName="role"]', 'MEMBER');
    await page.click('button:has-text("Create invite")');
    
    await expect(page.locator('input[readonly]')).toBeVisible();
    const inviteUrl = await page.locator('input[readonly]').inputValue();
    const inviteToken = inviteUrl.split('/join/')[1];
    expect(inviteToken).toBeTruthy();
    
    // 4. Guest joins via invite link
    const guestContext = await context.browser()?.newContext();
    if (!guestContext) throw new Error('Failed to create guest context');
    
    const guestPage = await guestContext.newPage();
    await guestPage.goto(inviteUrl);
    
    await expect(guestPage.locator('h1')).toContainText('Join group');
    await guestPage.fill('input[formControlName="displayName"]', 'Guest Traveler');
    await guestPage.click('button[type="submit"]');
    
    await expect(guestPage).toHaveURL(new RegExp(`/groups/${groupId}`));
    await expect(guestPage.locator('text=Trip to Japan')).toBeVisible();
    
    // 5. Owner adds expenses with different split types
    // Equal split expense
    await page.click('a[routerLink="expenses"]');
    await page.click('button:has-text("Add expense")');
    await page.fill('input[formControlName="description"]', 'Sushi dinner');
    await page.fill('input[formControlName="amount"]', '15000');
    await page.selectOption('select[formControlName="currency"]', 'JPY');
    await page.selectOption('select[formControlName="splitType"]', 'equal');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Sushi dinner')).toBeVisible();
    
    // Percentage split expense
    await page.click('button:has-text("Add expense")');
    await page.fill('input[formControlName="description"]', 'Hotel');
    await page.fill('input[formControlName="amount"]', '50000');
    await page.selectOption('select[formControlName="currency"]', 'JPY');
    await page.selectOption('select[formControlName="splitType"]', 'percentage');
    // Add splits with percentages (50/50)
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Hotel')).toBeVisible();
    
    // Exact amount split expense
    await page.click('button:has-text("Add expense")');
    await page.fill('input[formControlName="description"]', 'Train tickets');
    await page.fill('input[formControlName="amount"]', '20000');
    await page.selectOption('select[formControlName="currency"]', 'JPY');
    await page.selectOption('select[formControlName="splitType"]', 'exact');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Train tickets')).toBeVisible();
    
    // Shares split expense
    await page.click('button:has-text("Add expense")');
    await page.fill('input[formControlName="description"]', 'Activities');
    await page.fill('input[formControlName="amount"]', '30000');
    await page.selectOption('select[formControlName="currency"]', 'JPY');
    await page.selectOption('select[formControlName="splitType"]', 'shares');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Activities')).toBeVisible();
    
    // Itemized expense
    await page.click('button:has-text("Add expense")');
    await page.fill('input[formControlName="description"]', 'Convenience store');
    await page.fill('input[formControlName="amount"]', '5000');
    await page.selectOption('select[formControlName="currency"]', 'JPY');
    await page.selectOption('select[formControlName="splitType"]', 'itemized');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Convenience store')).toBeVisible();
    
    // 6. View balances
    await page.click('a[routerLink="balances"]');
    await expect(page.locator('h1')).toContainText('Balances');
    await expect(page.locator('text=Who owes whom')).toBeVisible();
    
    // Check that balances are calculated
    await expect(page.locator('text=Guest Traveler')).toBeVisible();
    await expect(page.locator('text=Group Owner')).toBeVisible();
    
    // 7. Simplify debts
    await expect(page.locator('text=Simplify debts')).toBeVisible();
    const checkbox = page.locator('input[type="checkbox"]');
    const initialState = await checkbox.isChecked();
    
    await checkbox.click();
    await expect(checkbox).toBeChecked();
    
    // Should show simplified transfers
    await expect(page.locator('text=Simplified')).toBeVisible();
    
    // 8. Settle up
    await page.click('a[routerLink="settlements"]');
    await expect(page.locator('h1')).toContainText('Settlements');
    
    await page.click('button:has-text("Record settlement")');
    await expect(guestPage.locator('h1')).toContainText('Record settlement');
    
    // Fill settlement form
    await page.selectOption('select[formControlName="fromMemberId"]', 'Guest Traveler');
    await page.selectOption('select[formControlName="toMemberId"]', 'Group Owner');
    await page.fill('input[formControlName="amount"]', '10000');
    await page.selectOption('select[formControlName="currency"]', 'JPY');
    await page.click('button[type="submit"]');
    
    // Should show settlement in history
    await expect(page.locator('text=Recorded settlement')).toBeVisible();
    
    await guestContext.close();
  });

  test('offline expense creation and sync', async ({ page }) => {
    await page.goto('/register');
    const email = `offline-${Date.now()}@example.com`;
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', 'password123');
    await page.fill('input[formControlName="name"]', 'Offline User');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/groups/);
    
    await page.click('button:has-text("Create group")');
    await page.fill('input[formControlName="name"]', 'Offline Group');
    await page.click('button[type="submit"]');
    
    // Go online first to ensure data is loaded
    await page.click('a[routerLink="expenses"]');
    
    // Go offline
    await page.context().setOffline(true);
    
    // Create expense offline
    await page.click('button:has-text("Add expense")');
    await page.fill('input[formControlName="description"]', 'Offline expense');
    await page.fill('input[formControlName="amount"]', '2500');
    await page.selectOption('select[formControlName="currency"]', 'USD');
    await page.selectOption('select[formControlName="splitType"]', 'equal');
    await page.click('button[type="submit"]');
    
    // Should show offline indicator
    await expect(page.locator('text=Offline')).toBeVisible({ timeout: 5000 });
    
    // Go back online
    await page.context().setOffline(false);
    
    // Should sync automatically
    await page.click('button[matTooltip="Sync status"]');
    await expect(page.locator('text=Synced')).toBeVisible({ timeout: 10000 });
    
    // Expense should be visible
    await expect(page.locator('text=Offline expense')).toBeVisible();
  });

  test('multi-currency expense with exchange rate', async ({ page }) => {
    await page.goto('/register');
    const email = `currency-${Date.now()}@example.com`;
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', 'password123');
    await page.fill('input[formControlName="name"]', 'Currency User');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/groups/);
    
    await page.click('button:has-text("Create group")');
    await page.fill('input[formControlName="name"]', 'Currency Group');
    await page.selectOption('select[formControlName="defaultCurrency"]', 'EUR');
    await page.click('button[type="submit"]');
    
    // Add expense in USD
    await page.click('a[routerLink="expenses"]');
    await page.click('button:has-text("Add expense")');
    await page.fill('input[formControlName="description"]', 'US shopping');
    await page.fill('input[formControlName="amount"]', '10000');
    await page.selectOption('select[formControlName="currency"]', 'USD');
    await page.selectOption('select[formControlName="splitType"]', 'equal');
    await page.click('button[type="submit"]');
    
    await expect(page.locator('text=US shopping')).toBeVisible();
    await expect(page.locator('text=$100.00')).toBeVisible();
    
    // Add expense in EUR
    await page.click('button:has-text("Add expense")');
    await page.fill('input[formControlName="description"]', 'European dinner');
    await page.fill('input[formControlName="amount"]', '8000');
    await page.selectOption('select[formControlName="currency"]', 'EUR');
    await page.selectOption('select[formControlName="splitType"]', 'equal');
    await page.click('button[type="submit"]');
    
    await expect(page.locator('text=European dinner')).toBeVisible();
    await expect(page.locator('text=€80.00')).toBeVisible();
    
    // Check balances in group default currency (EUR)
    await page.click('a[routerLink="balances"]');
    await expect(page.locator('text=EUR')).toBeVisible();
  });
});