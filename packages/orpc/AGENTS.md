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

### Server (backend-server)

```typescript
import { appRouter } from '@mirai-app/orpc';
import { createContext } from '@mirai-app/orpc/server';

// Create oRPC handler
const handler = new RPCHandler(appRouter, { interceptors: [] });
```

### Client (native)

```typescript
import { orpc } from '@mirai-app/orpc/client';
import { useQuery } from '@tanstack/react-query';

// In React component
function UserList() {
  const { data, isLoading } = useQuery(orpc.user.list.queryOptions());
  
  if (isLoading) return <Loading />;
  return <List users={data} />;
}
```

## Links

- [Router structure](../../docs/packages/orpc/router-structure.md)
- [Procedures](../../docs/packages/orpc/procedures.md)
- [Middleware](../../docs/packages/orpc/middleware.md)
- [Error handling](../../docs/packages/orpc/error-handling.md)
- [Root AGENTS.md](../../AGENTS.md)
