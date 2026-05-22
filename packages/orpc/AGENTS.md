# @mirai-app/orpc - Agent Guide

> **Inherited Conventions**: See [root AGENTS.md](../../AGENTS.md) for monorepo conventions, build system, and development workflow.

## Purpose

Shared oRPC routers and utilities for the MIRAI application. Provides type-safe API procedures for both server and client usage across all apps.

## Exports

| Export | Path | Description |
|--------|------|-------------|
| `main` | `./src/index.ts` | oRPC router and server utilities |
| `client` | `./src/client/index.ts` | Client initialization |
| `client/query` | `./src/client/query/index.ts` | Query utilities |
| `hooks` | `./src/hooks/index.ts` | React hooks |

## Tech Stack

- **oRPC**: ^1.14.2 (server, client, tanstack-query)
- **Validation**: Zod 4.3.4
- **Serialization**: built-in
- **State**: Zustand 5.0.11

## Key Files

```
packages/orpc/
├── src/
│   ├── routers/          # oRPC routers
│   │   ├── index.ts      # Root router
│   │   ├── user.ts       # User procedures
│   │   └── ...
│   ├── procedures/       # Shared procedures
│   ├── middleware/       # oRPC middleware
│   ├── client/           # Client setup
│   │   ├── index.ts
│   │   └── query/
│   ├── hooks/            # React hooks
│   ├── index.ts          # Server exports
│   └── server.ts         # Server-only exports
├── package.json
└── AGENTS.md             # This file
```

## Development Commands

```bash
# Build package
bun run build

# TypeScript check
bun run typecheck

# Lint
bun run lint

# Test
bun run test
bun run test:watch
```

## Dependencies

### Internal

- `@mirai-app/auth` - Authentication utilities
- `@mirai-app/db` - Database client
- `@mirai-app/shared` - Shared utilities
- `@mirai-app/supabase` - Supabase client

### External

- `@orpc/client` - oRPC client
- `@orpc/server` - oRPC server
- `@orpc/tanstack-query` - React Query integration
- `@tanstack/react-query` - React Query
- `zod` - Schema validation
- `superjson` - JSON serialization
- `zustand` - State management

### Peer Dependencies

- `react` ^19.1.0
- `react-dom` ^19.1.0

## Usage in Apps

Server: `import { appRouter } from '@mirai-app/orpc'`  
Client: `import { orpc } from '@mirai-app/orpc/client'`

## Code Quality Rules

### Router File Size Limits

- **Rule**: Router files >1000 lines violate SRP. Split into directory-based modules: `{router}/types.ts`, `{router}/utils.ts`, `{router}/queries.ts`, `{router}/mutations.ts`, `{router}/index.ts`.
- **Import path fix when moving deeper**: `../../api/trpc` → `../../trpc`, `../../utils/` → `../../../utils/`.
- **Verification after split**: Run `tsc --noEmit` in the package, then `bun run test`.
- **Never add new code to files >1000 lines** without first extracting into smaller modules.

### Transaction Testing Requirements

- **Critical**: The `$transaction` mock in router tests is a pass-through. No rollback/atomicity is ever tested.
- **Rule**: Add at least one failure-path transaction test per router. Create `MockTransactionDB` that simulates rollback.

### Error Handling Standards

- **Pattern**: Use `ORPCError` with specific codes (`NOT_FOUND`, `FORBIDDEN`, `BAD_REQUEST`, etc.).
- **Logging standard**: Use the shared Pino logger from `@mirai-app/orpc`. Never use `console.*` in production code.

## Architecture Decisions

**Verdict**: Do NOT introduce Effect, fp-ts, or similar FP libraries. See [Best Practices](../../docs/conventions/best-practices.md) for full analysis.

## Links

- [Router structure](../../docs/packages/orpc/router-structure.md)
- [Procedures](../../docs/packages/orpc/procedures.md)
- [Middleware](../../docs/packages/orpc/middleware.md)
- [Error handling](../../docs/packages/orpc/error-handling.md)
- [Root AGENTS.md](../../AGENTS.md)
