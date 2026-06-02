# @mirai-app/supabase - Agent Guide

> **Inherited Conventions**: See [root AGENTS.md](../../AGENTS.md) for monorepo conventions, build system, and development workflow.

## Purpose

Supabase client configuration for the MIRAI application. Provides typed Supabase client instances for both server and client-side usage.

## Exports

| Export | Path | Description |
|--------|------|-------------|
| `main` | `./src/index.ts` | Supabase client factory |
| `react` | `./src/react.tsx` | React integration |
| `types` | `./src/types.ts` | Database types |

## Tech Stack

- **Client**: @supabase/supabase-js
- **Version**: ^2.89.0
- **Dependencies**: None (internal)

## Key Files

```
packages/supabase/
├── src/
│   ├── index.ts          # Client factory
│   ├── react.tsx         # React provider/hooks
│   ├── types.ts          # Database types
│   └── client.ts         # Client implementation
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

### External

- `@supabase/supabase-js` - Supabase JavaScript client

### Peer Dependencies

- `react` ^19.1.0

## Usage in Apps

Server: `import { createClient } from '@mirai-app/supabase'`  
Client: `import { SupabaseProvider, useSupabase } from '@mirai-app/supabase/react'`

## Environment Variables

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Anonymous client key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (server only) |

## Testing

This package uses [Vitest](https://vitest.dev/) for testing. See [Testing Conventions](./../../docs/conventions/testing.md) for repo-wide testing standards.

### Client Factory Testing

Tests focus on the Supabase client factory and React integration:

- **Client factory** - `createClient` produces correctly configured instances for server and client environments
- **React provider** - `SupabaseProvider` initializes context and passes client to children
- **Environment detection** - Server vs client configuration differences (service role vs anon key)
- **Type exports** - Database types are correctly generated and exported

Mock `@supabase/supabase-js` for unit tests. Verify real client behavior in integration tests.

## Links

- [Client documentation](../../docs/packages/supabase/client.md)
- [Root AGENTS.md](../../AGENTS.md)
