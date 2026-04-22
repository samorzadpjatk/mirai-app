# Monorepo Architecture

## Overview

MIRAI uses a monorepo architecture managed by **Turborepo** and **Bun workspaces**. This document explains the high-level architectural decisions and how they enable efficient development across multiple applications and shared packages.

## Why Turborepo + Bun?

### Turborepo

**Turborepo** provides:
- **Task orchestration**: Define task dependencies and run them in optimal order
- **Intelligent caching**: Skip work that's already been done
- **Parallel execution**: Run independent tasks simultaneously
- **Remote caching** (optional): Share build artifacts across team members

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
- **backend-server**: Fastify + tRPC API server
- **notification-sender**: Background worker for push notifications
- **seed**: CLI tool for database seeding

### Packages (`packages/`)

Packages are shared libraries:

- **auth**: Authentication utilities and state management
- **db**: Prisma schema and database client
- **shared**: Shared utilities and design tokens
- **supabase**: Supabase client configuration
- **trpc**: tRPC routers and client utilities

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
            │    trpc     │ ◄───── Used by native (client)
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

```
build: depends on ^build (upstream builds)
typecheck: depends on ^typecheck
lint: depends on ^lint
test: runs after build
```

## Code Organization Principles

1. **Single Responsibility**: Each package has one clear purpose
2. **Dependency Direction**: Apps depend on packages, never the reverse
3. **Shared Code**: Common code goes in `packages/shared/`
4. **No Circular Dependencies**: The dependency graph must be acyclic

## Performance Considerations

- **Incremental builds**: Only changed packages are rebuilt
- **Parallel testing**: Tests run in parallel across packages
- **Hoisted dependencies**: Common dependencies are hoisted to root

## Further Reading

- [Turborepo Configuration](./turborepo.md)
- [Bun Workspaces](./bun-workspaces.md)
