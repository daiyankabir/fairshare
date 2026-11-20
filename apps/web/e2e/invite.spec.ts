import { test, expect } from '@playwright/test';

test.describe('Invite and Guest Access', () => {
  let groupId: string;
  let inviteToken: string;
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/register');
    const email = `owner-${Date.now()}@example.com`;
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', 'password123');
    await page.fill('input[formControlName="name"]', 'Group Owner');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/groups/);
    
    await page.click('button:has-text("Create group")');
    await page.fill('input[formControlName="name"]', 'Invite Test Group');
    await page.click('button[type="submit"]');
    
    const url = page.url();
    groupId = url.match(/\/groups\/([a-z0-9]+)/)?.[1] || '';
  });

  test('should create an invite link', async ({ page }) => {
    await page.click('a[routerLink="members"]');
    await expect(page.locator('h1')).toContainText('Members');
    
    await page.click('button:has-text("Invite member")');
    await expect(page.locator('text=Invite member')).toBeVisible();
    
    await page.selectOption('select[formControlName="role"]', 'MEMBER');
    await page.click('button:has-text("Create invite")');
    
    // Should show the invite link
    await expect(page.locator('input[readonly]')).toBeVisible();
    
    const inviteInput = page.locator('input[readonly]');
    const inviteUrl = await inviteInput.inputValue();
    inviteToken = inviteUrl.split('/join/')[1];
    
    expect(inviteToken).toBeTruthy();
  });

  test('should allow guest to join via invite link', async ({ page, context }) => {
    // First create an invite
    await page.click('a[routerLink="members"]');
    await page.click('button:has-text("Invite member")');
    await page.selectOption('select[formControlName="role"]', 'MEMBER');
    await page.click('button:has-text("Create invite")');
    
    const inviteInput = page.locator('input[readonly]');
    const inviteUrl = await inviteInput.inputValue();
    
    // Open new context for guest
    const guestContext = await context.browser()?.newContext();
    if (!guestContext) throw new Error('Failed to create guest context');
    
    const guestPage = await guestContext.newPage();
    await guestPage.goto(inviteUrl);
    
    await expect(guestPage.locator('h1')).toContainText('Join group');
    await guestPage.fill('input[formControlName="displayName"]', 'Guest User');
    await guestPage.click('button[type="submit"]');
    
    await expect(guestPage).toHaveURL(new RegExp(`/groups/${groupId}`));
    await expect(guestPage.locator('text=Invite Test Group')).toBeVisible();
    
    await guestContext.close();
  });

  test('should show member list with guest', async ({ page }) => {
    await page.click('a[routerLink="members"]');
    await expect(page.locator('text=Group Owner')).toBeVisible();
    await expect(page.locator('text=OWNER')).toBeVisible();
  });

  test('should revoke invite', async ({ page }) => {
    await page.click('a[routerLink="members"]');
    await page.click('button:has-text("Invite member")');
    await page.selectOption('select[formControlName="role"]', 'MEMBER');
    await page.click('button:has-text("Create invite")');
    
    // Wait for invite to appear
    await expect(page.locator('input[readonly]')).toBeVisible();
    
    // Click revoke
    await page.click('button:has-text("Revoke")');
    
    // Invite should be removed
    await expect(page.locator('input[readonly]')).not.toBeVisible();
  });
});