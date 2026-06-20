# MIRAI Monorepo - Agent Guide

> **AI Assistant Context:** Base instructions for the MIRAI/PJApp monorepo. Files concatenate from root downward; later files override earlier ones.

## Project Overview

MIRAI (PJApp) is a TypeScript monorepo for event management:

- **Frontend**: Expo React Native (iOS/Android)
- **Backend**: Hono + oRPC server with WebSocket support
- **Database**: PostgreSQL via Drizzle ORM + Supabase
- **Tooling**: NX + Bun workspaces

## Monorepo Structure

```
MIRAI/
├── apps/
│   ├── native/              # Expo React Native app (iOS/Android)
│   ├── backend-server/      # Hono + oRPC API server
│   ├── notification-sender/ # Notification service worker
│   └── seed/                # Database seeding CLI
├── packages/
│   ├── auth/                # Authentication utilities
│   ├── db/                  # Drizzle schema and client
│   ├── shared/              # Shared utilities, design tokens
│   ├── supabase/            # Supabase client configuration
│   └── orpc/                # oRPC routers and utilities
├── docs/                    # Detailed documentation
├── nx.json                  # NX monorepo configuration
├── package.json             # Bun workspaces configuration
└── AGENTS.md                # This file
```

## Build System

### NX Pipeline

| Command | Description |
|---------|-------------|
| `nx run-many -t build` | Build all apps and packages |
| `nx run-many -t dev` | Start development mode for all apps |
| `nx run-many -t lint` | Run ESLint across all packages |
| `nx run-many -t typecheck` | Type-check all packages |
| `nx run-many -t test` | Run test suites |
| `nx run-many -t clean` | Clean build artifacts |

### Bun Workspaces

- **Workspace protocol**: Use `workspace:*` for internal dependencies
- **Lockfile**: `bun.lock` tracks all dependencies
- **Install**: `bun install` at root installs workspace dependencies

### Standard Scripts

| Script | Purpose |
|--------|---------|
| `dev` | Start development server |
| `build` | Production build |
| `lint` | Code quality checks |
| `typecheck` | TypeScript validation |
| `test` | Run tests |
| `clean` | Remove build artifacts |

## Development Environment

### Prerequisites

- Bun 1.3.6+ (package manager)
- Node.js 24+ (for tooling)
- Docker (optional, for local PostgreSQL)

### Quick Start

```bash
# Install dependencies
bun install

# Start all apps in dev mode
nx run-many -t dev
nx run @mirai-app/backend-server:dev
nx run @mirai-app/native:dev
```

### Environment Variables

Copy `.env.example` files in `environment/` and fill in values:

```bash
cp environment/.env.dev.example environment/.env.dev
```

## How AGENTS.md Works

This project uses OpenAI's layered AGENTS.md discovery pattern. Files concatenate from root down; later files override earlier guidance. Temporary overrides use `AGENTS.override.md`. See [docs/conventions/agents-md.md](./docs/conventions/agents-md.md) for size guidelines and templates.

## App & Package AGENTS.md Files

- [apps/native/AGENTS.md](./apps/native/AGENTS.md) - Expo React Native app
- [apps/backend-server/AGENTS.md](./apps/backend-server/AGENTS.md) - Hono + oRPC server
- [apps/notification-sender/AGENTS.md](./apps/notification-sender/AGENTS.md) - Notification service
- [apps/seed/AGENTS.md](./apps/seed/AGENTS.md) - Database seeding CLI
- [packages/auth/AGENTS.md](./packages/auth/AGENTS.md) - Authentication utilities
- [packages/db/AGENTS.md](./packages/db/AGENTS.md) - Drizzle database client
- [packages/common/AGENTS.md](./packages/common/AGENTS.md) - Shared utilities
- [packages/supabase/AGENTS.md](./packages/supabase/AGENTS.md) - Supabase client
- [packages/orpc/AGENTS.md](./packages/orpc/AGENTS.md) - oRPC routers

## Documentation Structure

Detailed documentation lives in `docs/` folder:

| Path | Contents |
|------|----------|
| [docs/architecture/](./docs/architecture/) | Monorepo, NX, Bun workspace docs |
| [docs/development/](./docs/development/) | Setup guides, environment, scripts |
| [docs/apps/](./docs/apps/) | Per-app detailed documentation |
| [docs/packages/](./docs/packages/) | Per-package detailed documentation |
| [docs/conventions/](./docs/conventions/) | Coding standards and best practices |
| [docs/workflows/](./docs/workflows/) | AI-driven workflow documentation |

## Code Quality & Testing

See [Testing Conventions](./docs/conventions/testing.md) and [Best Practices](./docs/conventions/best-practices.md) for detailed standards.

Key rules:
- **Test behavior, not implementation.** Extract pure domain logic to `@mirai-app/common` for real-data testing.
- **File size limits**: Router files >1000 lines must split into `queries.ts`, `mutations.ts`, `utils.ts`.
- **No module-level side effects**: Use explicit `init()` functions.
- **No `console.*` in production**: Use Pino (backend) or Sentry (native).
- **Transaction tests**: Use real PGLite with `BEGIN...ROLLBACK` per router.
- **Nulls at the boundary**: Database nulls are normalized to defaults before reaching shared types, router outputs, or UI components. See [docs/conventions/null-safety.md](./docs/conventions/null-safety.md).
- **No `.default()` for user data**: Database columns holding user-provided content (descriptions, titles, names) must be `.notNull()` **without** `.default()`. System fields (timestamps, booleans, counters) may use `.default()`.

## Data Retention

All data retention policies are documented in [docs/conventions/data-retention.md](./docs/conventions/data-retention.md). Key rules for agents:

- **Application-level cleanup only**: Retention jobs are scheduled functions in `apps/backend-server`, never PostgreSQL triggers or DB-level cron.
- **Financial data is permanent**: `coin_transactions` and `audit_logs` (cold storage) are never deleted. Hard-deleting financial rows is a bug.
- **Soft-delete users**: When a user requests deletion, anonymize the `users` row (set `email = NULL`, `name = 'Deleted User'`, `deleted_at = NOW()`) instead of hard-deleting. Preserve the UUID for referential integrity in financial and audit tables.
- **GDPR erasure bypasses retention schedules**: If a user requests deletion under GDPR Article 17, delete their data immediately regardless of the standard retention period. Financial data is exempt under Article 17(3)(b).
- **Batch cleanup**: Delete or archive in batches of 1,000 rows with a 100ms sleep between batches. Use a stable cutoff time, not `NOW()` per row.

## Architecture Decisions

**Verdict**: Do NOT introduce Effect, fp-ts, or similar FP libraries. See [Best Practices](./docs/conventions/best-practices.md) for full analysis.

## License

AGPL-3.0 - See [LICENSE](./LICENSE) for details.


<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

## General Guidelines for working with Nx

- For navigating/exploring the workspace, invoke the `nx-workspace` skill first
- When running tasks, always prefer running the task through `nx` (i.e., `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- Prefix nx commands with the workspace's package manager (e.g., `pnpm nx build`, `npm exec nx test`) - avoids using globally installed CLI
- You have access to the Nx MCP server and its tools, use them to help the user
- NEVER guess CLI flags - always check nx_docs or `--help` first when unsure

## Scaffolding & Generators

- For scaffolding tasks (creating apps, libs, project structure, setup), ALWAYS invoke the `nx-generate` skill FIRST before exploring or calling MCP tools

<!-- nx configuration end-->