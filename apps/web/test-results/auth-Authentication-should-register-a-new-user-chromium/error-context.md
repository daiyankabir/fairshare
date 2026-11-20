# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.ts >> Authentication >> should register a new user
- Location: e2e\auth.spec.ts:30:7

# Error details

```
Test timeout of 30000ms exceeded.
```

# Page snapshot

```yaml
- generic [ref=f1e6]:
  - banner [ref=f1e7]:
    - generic [ref=f1e8]:
      - link "FairShare Home" [ref=f1e9] [cursor=pointer]:
        - /url: /groups
        - img [aria-hidden] [ref=f1e10]: account_balance_wallet
        - generic [ref=f1e11]: FairShare
      - generic [ref=f1e12]:
        - link "Sign in" [ref=f1e13] [cursor=pointer]:
          - /url: /login
        - link "Get started" [ref=f1e17] [cursor=pointer]:
          - /url: /register
  - main [ref=f1e21]:
    - generic [ref=f1e24]:
      - generic [ref=f1e26]:
        - generic [ref=f1e27]: Create your account
        - generic [ref=f1e28]: Free expense splitting, forever
      - generic [ref=f1e30]:
        - generic [ref=f1e33]:
          - generic [ref=f1e34]:
            - text: Name
            - generic [aria-hidden] [ref=f1e35]: "*"
          - img [aria-hidden] [ref=f1e37]: person
          - textbox "Name" [active] [ref=f1e39]: Test User
        - generic [ref=f1e42]:
          - generic [ref=f1e43]:
            - text: Email
            - generic [aria-hidden] [ref=f1e44]: "*"
          - img [aria-hidden] [ref=f1e46]: email
          - textbox "Email" [ref=f1e48]: test-1795204700648@example.com
        - generic [ref=f1e51]:
          - generic [ref=f1e52]:
            - text: Password
            - generic [aria-hidden] [ref=f1e53]: "*"
          - img [aria-hidden] [ref=f1e55]: lock
          - textbox "Password" [ref=f1e57]: password123
          - button "Toggle password visibility" [ref=f1e59] [cursor=pointer]:
            - img [aria-hidden] [ref=f1e60]: visibility_off
        - generic [ref=f1e65]:
          - generic [ref=f1e66]:
            - text: Confirm Password
            - generic [aria-hidden] [ref=f1e67]: "*"
          - img [aria-hidden] [ref=f1e69]: lock
          - textbox "Confirm Password" [ref=f1e71]
        - generic [ref=f1e74] [cursor=pointer]:
          - generic [ref=f1e75]:
            - text: Default Currency
            - generic [aria-hidden] [ref=f1e76]: "*"
          - img [aria-hidden] [ref=f1e78]: attach_money
          - combobox "Default Currency" [ref=f1e80]:
            - generic [ref=f1e81]: USD
        - button "Create account" [disabled]
      - paragraph [ref=f1e89]:
        - text: Already have an account?
        - link "Sign in" [ref=f1e90] [cursor=pointer]:
          - /url: /login
```