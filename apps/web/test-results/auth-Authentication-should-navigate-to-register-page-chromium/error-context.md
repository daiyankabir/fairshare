# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.ts >> Authentication >> should navigate to register page
- Location: e2e\auth.spec.ts:24:7

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: locator('h1')
Expected substring: "Create account"
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toContainText" locator('h1') with timeout 5000ms
  - waiting for locator('h1')

```

```yaml
- banner:
  - link "FairShare Home":
    - /url: /groups
    - text: FairShare
  - link "Sign in":
    - /url: /login
  - link "Get started":
    - /url: /register
- main:
  - text: Create your account Free expense splitting, forever Name
  - textbox "Name"
  - text: Email
  - textbox "Email"
  - text: Password
  - textbox "Password"
  - button "Toggle password visibility"
  - text: Confirm Password
  - textbox "Confirm Password"
  - text: Default Currency
  - combobox "Default Currency": USD
  - button "Create account" [disabled]
  - paragraph:
    - text: Already have an account?
    - link "Sign in":
      - /url: /login
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Authentication', () => {
  4  |   test.beforeEach(async ({ page }) => {
  5  |     await page.goto('/login');
  6  |   });
  7  | 
  8  |   test('should display login form', async ({ page }) => {
  9  |     await expect(page.locator('h1')).toContainText('Sign in');
  10 |     await expect(page.locator('input[type="email"]')).toBeVisible();
  11 |     await expect(page.locator('input[type="password"]')).toBeVisible();
  12 |     await expect(page.locator('button[type="submit"]')).toBeVisible();
  13 |   });
  14 | 
  15 |   test('should show error for invalid credentials', async ({ page }) => {
  16 |     await page.fill('input[type="email"]', 'wrong@example.com');
  17 |     await page.fill('input[type="password"]', 'wrongpassword');
  18 |     await page.click('button[type="submit"]');
  19 |     
  20 |     await expect(page.locator('.mat-mdc-snack-bar-container')).toBeVisible();
  21 |     await expect(page.locator('.mat-mdc-snack-bar-container')).toContainText('Invalid credentials');
  22 |   });
  23 | 
  24 |   test('should navigate to register page', async ({ page }) => {
  25 |     await page.click('a[routerLink="/register"]');
  26 |     await expect(page).toHaveURL(/\/register/);
> 27 |     await expect(page.locator('h1')).toContainText('Create account');
     |                                      ^ Error: expect(locator).toContainText(expected) failed
  28 |   });
  29 | 
  30 |   test('should register a new user', async ({ page }) => {
  31 |     await page.goto('/register');
  32 |     
  33 |     const email = `test-${Date.now()}@example.com`;
  34 |     await page.fill('input[type="email"]', email);
  35 |     await page.fill('input[type="password"]', 'password123');
  36 |     await page.fill('input[formControlName="name"]', 'Test User');
  37 |     await page.click('button[type="submit"]');
  38 |     
  39 |     await expect(page).toHaveURL(/\/groups/);
  40 |     await expect(page.locator('text=Groups')).toBeVisible();
  41 |   });
  42 | });
```