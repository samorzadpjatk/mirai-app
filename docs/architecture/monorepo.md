# Monorepo Architecture

## Overview

MIRAI uses a monorepo architecture managed by **Nx** and **Bun workspaces**. This document explains the high-level architectural decisions and how they enable efficient development across multiple applications and shared packages.

## Why Nx + Bun?

### Nx

**Nx** provides:
- **Task orchestration**: Define task dependencies and run them in optimal order
- **Intelligent caching**: Skip work that's already been done with fine-grained input hashing
- **Parallel execution**: Run independent tasks simultaneously
- **Affected detection**: Run tasks only on projects changed since a git baseline
- **Plugin ecosystem**: Automatic task inference from project configuration

### Bun

**Bun** provides:
- **Fast package installation**: 2-3x faster than npm/yarn
- **Workspace support**: Native monorepo support via `workspaces` in package.json
- **TypeScript support**: First-class TypeScript support without transpilation
- **Unified toolchain**: Package manager, bundler, test runner, and runtime

## Monorepo Structure

### Apps (`apps/`)

Applications are deployable units:

- **native**: Expo React Native app for iOS/Android
- **backend-server**: Hono + oRPC API server
- **notification-sender**: Background worker for push notifications
- **seed**: CLI tool for database seeding

### Packages (`packages/`)

Packages are shared libraries:

- **auth**: Authentication utilities and state management
- **db**: Drizzle schema and database client
- **shared**: Shared utilities and design tokens
- **supabase**: Supabase client configuration
- **orpc**: oRPC routers and client utilities

## Dependency Flow

```
                    ┌─────────────────┐
                    │     shared      │
                    └────────┬────────┘
                             │
            ┌─────────────────┼─────────────────┐
            │                 │                 │
            ▼                 ▼                 ▼
     ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
     │    auth     │  │     db      │  │  supabase   │
     └──────┬──────┘  └──────┬──────┘  └─────────────┘
            │                │
            └────────────────┘
                    │
                    ▼
            ┌─────────────┐
            │    orpc     │ ◄───── Used by native (client)
            └──────┬──────┘
                   │
      ┌────────────┼────────────┐
      │            │            │
      ▼            ▼            ▼
┌─────────┐ ┌──────────┐ ┌─────────┐
│ backend │ │notification│ │  seed   │
│-server  │ │ -sender   │ │         │
└─────────┘ └──────────┘ └─────────┘
```

## Build Pipeline

```
┌─────────┐    ┌──────────┐    ┌─────────┐    ┌────────┐
│  build  │───▶│typecheck │───▶│  test   │───▶│ deploy │
└─────────┘    └──────────┘    └─────────┘    └────────┘
```

### Task Dependencies

Nx task dependencies are defined in `nx.json` via `targetDefaults`:

| Task | Depends on | Caching |
|------|-----------|---------|
| `build` | `^build`, `db:generate` | Output artifacts cached |
| `typecheck` | `^typecheck` | Cached |
| `lint` | `^lint` | Cached |
| `test` | `^build` | Coverage reports cached |
| `container` | `build` | Cached |
| `dev` | `db:generate` | Never cached |

The `^` prefix means "upstream dependencies must complete this task first." Nx computes the project graph automatically from Bun workspace links.

## Code Organization Principles

1. **Single Responsibility**: Each package has one clear purpose
2. **Dependency Direction**: Apps depend on packages, never the reverse
3. **Shared Code**: Common code goes in `packages/common/`
4. **No Circular Dependencies**: The dependency graph must be acyclic

## Performance Considerations

- **Affected builds**: `nx affected -t build` rebuilds only changed projects and their dependents
- **Parallel execution**: Independent tasks run simultaneously across the project graph
- **Local caching**: Task outputs are cached in `.nx/cache` and reused across runs
- **Hoisted dependencies**: Common dependencies are hoisted to root

## Further Reading

- [Nx Configuration](./nx.md)
- [Bun Workspaces](./bun-workspaces.md)
