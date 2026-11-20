# FairShare

A free, no-paywall expense-splitting web app (a Splitwise alternative) built as a production-quality Angular PWA.

## Features

- **No paywalls** - All core features free forever
- **Guest access** - Join groups via link without creating an account
- **Powerful filtering** - Filter by category, date, payer, participant, amount, currency
- **Clear debt view** - See exactly who owes whom
- **Multi-currency** - Live exchange rates with manual override
- **Offline-first** - Add expenses offline, sync when online
- **Real-time updates** - WebSocket updates for group changes
- **Simplify debts** - Minimize transactions with graph-based algorithm

## Tech Stack

- **Frontend**: Angular 19+ (standalone components, Signals, new control flow)
- **State**: NgRx SignalStore
- **UI**: Angular Material + SCSS (light/dark themes)
- **PWA**: @angular/service-worker + Dexie (IndexedDB)
- **Backend**: NestJS + PostgreSQL + Prisma
- **Testing**: Vitest (unit), Playwright (e2e)
- **Monorepo**: npm workspaces

## Project Structure

```
fairshare/
├── apps/
│   ├── web/          # Angular PWA
│   └── api/          # NestJS API
├── libs/
│   └── shared/       # Shared algorithms & types
├── docs/
└── .github/workflows/
```

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 15+
- npm 10+

### Installation

```bash
# Install all dependencies
npm install

# Set up environment variables
cp apps/api/.env.example apps/api/.env
# Edit apps/api/.env with your database URL and JWT secret

# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate

# Start development servers
npm run dev:web    # Angular on http://localhost:4200
npm run dev:api    # NestJS on http://localhost:3000
```

### Testing

```bash
# Run all tests
npm test

# Run shared library tests
npm run test:shared

# Run web app tests
npm run test:web

# Run e2e tests
npm run e2e
```

### Building

```bash
# Build all projects
npm run build

# Build for production
npm run build:prod
```

## Architecture

See [docs/architecture.md](docs/architecture.md) for detailed architecture documentation.

## Assumptions & Known Limitations

See [docs/assumptions.md](docs/assumptions.md).

## License

MIT