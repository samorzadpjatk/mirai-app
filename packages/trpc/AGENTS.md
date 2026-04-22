# @mirai-app/trpc - Agent Guide

> **Inherited Conventions**: See [root AGENTS.md](../../AGENTS.md) for monorepo conventions, build system, and development workflow.

## Purpose

Shared tRPC routers and utilities for the MIRAI application. Provides type-safe API procedures for both server and client usage across all apps.

## Exports

| Export | Path | Description |
|--------|------|-------------|
| `main` | `./src/index.ts` | tRPC router and server utilities |
| `client` | `./src/client/index.ts` | Client initialization |
| `client/query` | `./src/client/query/index.ts` | Query utilities |
| `hooks` | `./src/hooks/index.ts` | React hooks |

## Tech Stack

- **tRPC**: ^11.10.0 (client, server, tanstack-react-query)
- **Validation**: Zod 4.3.4
- **Serialization**: SuperJSON 2.2.6
- **State**: Zustand 5.0.11

## Key Files

```
packages/trpc/
├── src/
│   ├── routers/          # tRPC routers
│   │   ├── index.ts      # Root router
│   │   ├── user.ts       # User procedures
│   │   └── ...
│   ├── procedures/       # Shared procedures
│   ├── middleware/       # tRPC middleware
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

- `@trpc/client` - tRPC client
- `@trpc/server` - tRPC server
- `@trpc/tanstack-react-query` - React Query integration
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
import { appRouter } from '@mirai-app/trpc';
import { createContext } from '@mirai-app/trpc/server';

// Create tRPC handler
const handler = trpcFastifyPlugin(appRouter, { createContext });
```

### Client (native)

```typescript
import { trpc } from '@mirai-app/trpc/client';

// In React component
function UserList() {
  const { data, isLoading } = trpc.user.list.useQuery();
  
  if (isLoading) return <Loading />;
  return <List users={data} />;
}
```

## Links

- [Router structure](../../docs/packages/trpc/router-structure.md)
- [Procedures](../../docs/packages/trpc/procedures.md)
- [Middleware](../../docs/packages/trpc/middleware.md)
- [Error handling](../../docs/packages/trpc/error-handling.md)
- [Root AGENTS.md](../../AGENTS.md)
