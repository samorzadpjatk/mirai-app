# MIRAI Monorepo - Agent Guide

> **AI Assistant Context:** Base instructions for the MIRAI/PJApp monorepo. Files concatenate from root downward; later files override earlier ones.

## Project Overview

MIRAI (PJApp) is a TypeScript monorepo for an event management platform:

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
└── AGENTS.md                # This file (base instructions)
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

**Pipeline order:** `build` → `typecheck` → `test` → `deploy`

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

## Package Dependency Graph

```
auth ──────┐
           ├──→ orpc ────→ backend-server, notification-sender
db ────────┤      └──→ native (via client)
           │
supabase ──┤      └──→ native (via client)
           │
shared ────┘
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
- [packages/shared/AGENTS.md](./packages/shared/AGENTS.md) - Shared utilities
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

## AI-Driven Change Workflow

This project uses CEK SDD. All implementation uses test-first methodology.

**Quick Reference:** `/sdd:brainstorm`, `/sdd:add-task`, `/sdd:plan`, `/sdd:implement`, `/tdd:test-driven-development`, `/review-local-changes`

**Full docs:** [AI Change Workflow](./docs/workflows/ai-change-workflow.md) · [Best Practices](./docs/conventions/best-practices.md) · [TDD](./docs/conventions/tdd.md) · [Docs](./docs/conventions/documentation.md)

## AGENTS.md Template

Use the template when creating new AGENTS.md files:

**[→ View Template](./docs/templates/AGENTS.md.template)**



## License

AGPL-3.0 - See [LICENSE](./LICENSE) for details.


<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

## General Guidelines for working with Nx

- For navigating/exploring the workspace, invoke the `nx-workspace` skill first - it has patterns for querying projects, targets, and dependencies
- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- Prefix nx commands with the workspace's package manager (e.g., `pnpm nx build`, `npm exec nx test`) - avoids using globally installed CLI
- You have access to the Nx MCP server and its tools, use them to help the user
- For Nx plugin best practices, check `node_modules/@nx/<plugin>/PLUGIN.md`. Not all plugins have this file - proceed without it if unavailable.
- NEVER guess CLI flags - always check nx_docs or `--help` first when unsure

## Scaffolding & Generators

- For scaffolding tasks (creating apps, libs, project structure, setup), ALWAYS invoke the `nx-generate` skill FIRST before exploring or calling MCP tools

## When to use nx_docs

- USE for: advanced config options, unfamiliar flags, migration guides, plugin configuration, edge cases
- DON'T USE for: basic generator syntax (`nx g @nx/react:app`), standard commands, things you already know
- The `nx-generate` skill handles generator discovery internally - don't call nx_docs just to look up generator syntax


<!-- nx configuration end-->