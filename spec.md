You are a senior Angular engineer. Build "FairShare", a free, no-paywall expense-splitting web app (a Splitwise alternative), as a production-quality Angular PWA. Work step by step, and ask no questions unless something is truly blocking. Make reasonable assumptions and list them at the end.

## 1. Product goals

FairShare fixes the common complaints about Splitwise:
- No daily expense limits and no paid tier for core features
- Group members can join via a link without creating an account (guest access)
- Powerful filtering and sorting of expenses (Splitwise lacks this)
- A clear "who owes whom" view
- Proper multi-currency handling with a visible exchange rate per expense
- Offline-first: expenses can be added offline and synced later
- Fast, uncluttered UI

## 2. Tech stack

- Angular 19+ (standalone components, no NgModules, new control flow @if/@for, Signals for all local state)
- TypeScript strict mode
- State: NgRx SignalStore (or signal-based services if simpler)
- UI: Angular Material + SCSS, with light and dark themes
- Routing: lazy-loaded feature routes, route guards, resolvers
- Forms: Typed Reactive Forms
- PWA: @angular/service-worker, IndexedDB via Dexie for offline storage
- Backend: NestJS + PostgreSQL + Prisma, REST API with OpenAPI docs, JWT auth, WebSocket gateway for real-time group updates
- Testing: Jest or Vitest for unit tests, Playwright for e2e
- Tooling: ESLint, Prettier, Husky pre-commit, GitHub Actions CI
- Monorepo layout: /apps/web (Angular), /apps/api (NestJS), /libs/shared (shared types and the split/debt algorithms)

## 3. Core features (MVP)

### Auth and users
- Register/login with email + password
- Guest mode: a group invite link (/join/:token) lets someone enter a display name and participate without an account; a guest can later claim their identity by registering
- Profile: name, default currency

### Groups
- Create, edit and archive groups (name, default currency, optional cover emoji)
- Invite via shareable link with a revocable token
- Member list with roles (owner, member, guest)

### Expenses
- Fields: description, amount, currency, date, category, payer(s), notes, optional receipt image
- Split types: equal, exact amounts, percentages, shares, and itemized (receipt line items assigned to people)
- Multiple payers per expense
- Edit and delete with an activity log showing who changed what
- Rounding must be exact: the sum of all splits always equals the total, and leftover cents are distributed deterministically

### Balances and settling
- Per-group balance view: who owes whom
- "Simplify debts" toggle that minimizes the number of transactions (graph-based algorithm), showing original vs simplified side by side
- Record a settlement (payment) between two members
- Settle-up helper: generate a PayPal.me link and show IBAN with a payment reference

### Filtering and search
- Filter by category, date range, payer, participant, amount range, and currency
- Sort by date, amount, or description
- Full-text search on description
- Saved filters per group
- Virtual scrolling for long lists

### Multi-currency
- Each group has a default currency
- An expense can be in any currency; the user chooses a live rate (fetched from a public rates API and cached) or a manual fixed rate
- The rate used is stored and displayed on each expense
- Balances are shown in the group's default currency, with an option to view per-currency

### Offline-first and sync
- All reads come from IndexedDB first; writes are queued when offline
- Sync queue with retry and exponential backoff
- Conflict handling: last-write-wins by default, but if the same expense was edited on two devices, show a conflict dialog with both versions
- Visible online/offline/sync status indicator

### Real-time
- WebSocket updates when another member adds or edits an expense

## 4. Non-functional requirements

- Accessibility: WCAG 2.1 AA, keyboard navigation, ARIA labels, sufficient contrast
- i18n: English and German using Angular's i18n or Transloco, with currency and date formatting by locale
- Performance: lazy loading, OnPush change detection everywhere, Lighthouse score above 90 on PWA, performance and accessibility
- Security: input validation (class-validator on the API), XSS-safe rendering, rate limiting on auth endpoints, secure password hashing (argon2), CORS configured, invite tokens are unguessable
- Error handling: global HTTP interceptor, user-friendly error messages, loading and empty states on every screen

## 5. Data model (PostgreSQL via Prisma)

User, Group, Membership (role, guest flag), Expense, ExpensePayer, ExpenseSplit, ExpenseItem (for itemized), Settlement, Category, SavedFilter, ActivityLog, InviteToken, ExchangeRateSnapshot. Money is stored as integer minor units, never floats. Include indexes for group + date and group + category queries.

## 6. Shared algorithms (in /libs/shared, fully unit-tested)

1. splitEqual / splitByPercent / splitByShares / splitExact, with deterministic cent distribution
2. simplifyDebts(balances) that returns the minimal set of transfers
3. convertAmount(amount, from, to, rate) with correct rounding
Write property-based tests (fast-check) proving that splits always sum to the total and that simplified debts leave every member's net balance unchanged.

## 7. UI and UX

- Mobile-first, responsive; bottom nav on mobile, side nav on desktop
- Screens: Landing, Login/Register, Join via link, Group list, Group dashboard (balances + recent activity), Expense list (with filter panel), Add/Edit expense (multi-step on mobile), Settle up, Group settings and members, Profile
- Add-expense flow completes in under 5 taps for an equal split
- Clean, minimal design with no upsell prompts anywhere

## 8. Testing requirements

- Unit tests for all shared algorithms and store logic (target 90%+ on /libs/shared)
- Component tests for the expense form and filter panel
- Playwright e2e covering: register → create group → invite guest → add expenses with each split type → view balances → simplify debts → settle up; offline add → reconnect → sync; filter and search; multi-currency expense
- CI pipeline runs lint, unit tests and e2e on every pull request

## 9. Deliverables and process

Work in this order, and show the full code for each step:
1. Monorepo setup and folder structure
2. Shared library with algorithms and tests
3. Prisma schema and NestJS API (auth, groups, expenses, settlements, WebSocket)
4. Angular app shell, routing, theming, auth
5. Feature modules: groups, expenses, balances, filtering
6. Offline sync layer and PWA config
7. Multi-currency and settle-up helpers
8. i18n, accessibility pass, performance pass
9. Tests and CI
10. README with setup instructions, architecture diagram (Mermaid), and a list of assumptions and known limitations

Code quality rules: small focused components, no business logic in templates, typed everything, no `any`, meaningful names, and comments only where the logic is non-obvious.

