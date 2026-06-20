# @mirai-app/auth - Agent Guide

> **Inherited Conventions**: See [root AGENTS.md](../../AGENTS.md) for monorepo conventions, build system, and development workflow.

## Purpose

Authentication utilities and state management for the MIRAI application. Provides authentication flows, user state management, and auth-related utilities shared across apps.

## Exports

| Export | Path | Description |
|--------|------|-------------|
| `main` | `./src/index.ts` | Client-side authentication utilities |
| `server` | `./src/server.ts` | Server-side authentication helpers |
| `client` | `./src/client.ts` | Client initialization and hooks |

## Tech Stack

- **State Management**: Zustand + Jotai
- **Validation**: Zod
- **Dependencies**: `@mirai-app/db`, `@mirai-app/supabase`, `@mirai-app/common`

## Development Commands

```bash
# Build package
bun run build

# Run typecheck
bun run typecheck

# Run lint
bun run lint

# Testing
bun run test
bun run test:coverage
bun run test:watch

# Watch mode
cd packages/auth && bun run dev
```

## Dependencies

### Internal

- `@mirai-app/db` - Database client for user data
- `@mirai-app/supabase` - Supabase client for auth
- `@mirai-app/common` - Shared utilities

### External

- `zustand` - State management
- `jotai` - Atomic state management
- `zod` - Schema validation

## Peer Dependencies

- `react` ^19.1.0

## Code Quality Rules

### Auth Error Handling

- **Pattern**: Use custom `AuthenticationError` / `AuthorizationError` classes with typed messages.
- **Avoid**: Generic `Error` throws without context. Backend should map these to `ORPCError` codes (`UNAUTHORIZED`, `FORBIDDEN`).

### Test Quality

- **Rating**: Auth logic tests (`auth.test.ts`) are 4/5 — they verify real auth branches (token, roles, bans, invalid tokens).
- **Rule**: Focus tests on domain behavior ("user with banned_until is rejected") not implementation details ("mock was called").

See [Testing Conventions](./../../docs/conventions/testing.md) for full testing standards.

## Links

- [Detailed setup guide](../../docs/packages/auth/setup.md)
- [Root AGENTS.md](../../AGENTS.md)
