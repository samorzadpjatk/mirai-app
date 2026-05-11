# MIRAI Monorepo - Agent Guide

> **AI Assistant Context:** Base instructions for the MIRAI/PJApp monorepo. Files concatenate from root downward; later files override earlier ones.

## Project Overview

MIRAI (PJApp) is a TypeScript monorepo for an event management platform:

- **Frontend**: Expo React Native (iOS/Android)
- **Backend**: Fastify + oRPC server with WebSocket support
- **Database**: PostgreSQL via Prisma ORM + Supabase
- **Tooling**: Turborepo + Bun workspaces

## Monorepo Structure

```
MIRAI/
├── apps/
│   ├── native/              # Expo React Native app (iOS/Android)
│   ├── backend-server/      # Fastify + oRPC API server
│   ├── notification-sender/ # Notification service worker
│   └── seed/                # Database seeding CLI
├── packages/
│   ├── auth/                # Authentication utilities
│   ├── db/                  # Prisma schema and client
│   ├── shared/              # Shared utilities, design tokens
│   ├── supabase/            # Supabase client configuration
│   └── trpc/                # oRPC routers and utilities
├── docs/                    # Detailed documentation
├── turbo.json               # Turborepo configuration
├── package.json             # Bun workspaces configuration
└── AGENTS.md                # This file (base instructions)
```

## Build System

### Turborepo Pipeline

| Command | Description |
|---------|-------------|
| `turbo run build` | Build all apps and packages |
| `turbo run dev` | Start development mode for all apps |
| `turbo run lint` | Run ESLint across all packages |
| `turbo run typecheck` | Type-check all packages |
| `turbo run test` | Run test suites |
| `turbo run clean` | Clean build artifacts |

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
- Node.js 20+ (for tooling)
- Docker (optional, for local PostgreSQL)

### Quick Start

```bash
# Install dependencies
bun install

# Start all apps in dev mode
turbo run dev

# Or start specific apps
turbo run dev --filter=@mirai-app/backend-server
turbo run dev --filter=@mirai-app/native
```

### Environment Variables

Copy `.env.example` files in `environment/` and fill in values:

```bash
cp environment/.env.dev.example environment/.env.dev
```

## Package Dependency Graph

```
auth ──────┐
           ├──→ trpc ────→ backend-server, notification-sender
db ────────┤      └──→ native (via client)
           │
supabase ──┤      └──→ native (via client)
           │
shared ────┘
```

## How AGENTS.md Works

This project uses OpenAI's layered AGENTS.md discovery pattern:

1. **Discovery order**: Root AGENTS.md → apps/packages → nested directories
2. **Merge order**: Files concatenate from root down, separated by blank lines
3. **Override mechanism**: Files closer to your working directory override earlier guidance
4. **Override files**: `AGENTS.override.md` provides temporary team-specific rules

### Example Layering

```
Root AGENTS.md                    # Base monorepo conventions
├── apps/native/AGENTS.md         # Native app rules
│   └── screens/AGENTS.override.md # Temporary overrides
├── packages/db/AGENTS.md         # Database rules
└── ...
```

### Override Files

Create `AGENTS.override.md` in your working directory for temporary rules. Remove it when done.

**Important**: Keep all AGENTS.md files concise. Combined total must stay under 32 KiB.

## Instruction Size Guidelines

To stay within OpenAI's default 32 KiB combined instruction limit:

| File Type | Target Size |
|-----------|-------------|
| Root AGENTS.md | 5-8 KiB |
| Per-app/package AGENTS.md | 2-4 KiB |
| AGENTS.override.md | < 1 KiB (temporary only) |

**Tips for keeping files small:**
- Focus on high-level guidance and conventions
- Put detailed technical content in `docs/`
- Use relative links from AGENTS.md to docs/
- Keep AGENTS.md scannable in 2-3 minutes

## App & Package AGENTS.md Files

- [apps/native/AGENTS.md](./apps/native/AGENTS.md) - Expo React Native app
- [apps/backend-server/AGENTS.md](./apps/backend-server/AGENTS.md) - Fastify + oRPC server
- [apps/notification-sender/AGENTS.md](./apps/notification-sender/AGENTS.md) - Notification service
- [apps/seed/AGENTS.md](./apps/seed/AGENTS.md) - Database seeding CLI
- [packages/auth/AGENTS.md](./packages/auth/AGENTS.md) - Authentication utilities
- [packages/db/AGENTS.md](./packages/db/AGENTS.md) - Prisma database client
- [packages/shared/AGENTS.md](./packages/shared/AGENTS.md) - Shared utilities
- [packages/supabase/AGENTS.md](./packages/supabase/AGENTS.md) - Supabase client
- [packages/orpc/AGENTS.md](./packages/orpc/AGENTS.md) - oRPC routers

## Documentation Structure

Detailed documentation lives in `docs/` folder:

| Path | Contents |
|------|----------|
| [docs/architecture/](./docs/architecture/) | Monorepo, Turborepo, Bun workspace docs |
| [docs/development/](./docs/development/) | Setup guides, environment, scripts |
| [docs/apps/](./docs/apps/) | Per-app detailed documentation |
| [docs/packages/](./docs/packages/) | Per-package detailed documentation |
| [docs/conventions/](./docs/conventions/) | Coding standards and best practices |
| [docs/workflows/](./docs/workflows/) | AI-driven workflow documentation |

## AI-Driven Change Workflow

This project combines OpenSpec (change management) with CEK (Context Engineering Kit).

```
Discovery (OpenSpec) → Specification (OpenSpec) → Planning (CEK SDD) →
Implementation with TDD (CEK SDD) → Verification (Both) → Reflection & Docs (CEK) → Archive (OpenSpec)
```

**TDD Integration**: All implementation uses test-first methodology. TDD is inherited in `/sdd:implement-task` and explicit in `/tdd:test-driven-development`.

**Quick Reference:**
- `/opsx:explore "idea"` - Exploring ideas
- `/opsx:propose` → `/sdd:plan-task` → `/sdd:implement-task` - Complex feature (TDD inherited)
- `/tdd:test-driven-development "feature"` - Direct TDD implementation
- `/sadd:do-and-judge "Fix validation"` - Quick bug fix
- `/review-local-changes` - Pre-commit review

**See full documentation:**
- [AI Change Workflow](./docs/workflows/ai-change-workflow.md) - Complete workflow phases
- [Best Practices & Patterns](./docs/conventions/best-practices.md) - Task sizing, delta specs
- [TDD Best Practices](./docs/conventions/tdd.md) - Test-driven development
- [Documentation Best Practices](./docs/conventions/documentation.md) - Reflection & memorization

## AGENTS.md Template

Use the template when creating new AGENTS.md files:

**[→ View Template](./docs/templates/AGENTS.md.template)**

## Instruction Chain Verification

### Discovery Order

Files are discovered in this order (root → apps/packages → nested):

1. `/AGENTS.md` (~7 KiB) - Base monorepo conventions
2. `/apps/[app]/AGENTS.md` (~2.5 KiB avg) - App-specific rules
3. `/packages/[package]/AGENTS.md` (~2.5 KiB avg) - Package-specific rules
4. `/*/AGENTS.override.md` (< 1 KiB) - Temporary overrides

### Current Size Summary

| Category | Files | Total Size |
|----------|-------|------------|
| Root | 1 | ~7 KiB |
| Apps | 4 | ~10 KiB |
| Packages | 5 | ~12.5 KiB |
| **Combined** | **10** | **~29.5 KiB** |

**Status**: ✓ Under 32 KiB limit

### Verification

To verify concatenation:

```bash
# Test root + one app
cat AGENTS.md apps/native/AGENTS.md

# Test root + one package
cat AGENTS.md packages/trpc/AGENTS.md

# Test full chain (simulated)
cat AGENTS.md apps/*/AGENTS.md packages/*/AGENTS.md
```

## License

AGPL-3.0 - See [LICENSE](./LICENSE) for details.
