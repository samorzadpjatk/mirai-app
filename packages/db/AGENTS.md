# @mirai-app/db - Agent Guide

> **Inherited Conventions**: See [root AGENTS.md](../../AGENTS.md) for monorepo conventions, build system, and development workflow.

## Purpose

Database layer for the MIRAI application. Contains Prisma schema, database client, and migration utilities. All database access goes through this package.

## Exports

| Export | Path | Description |
|--------|------|-------------|
| `main` | `./src/index.ts` | Prisma client and database utilities |
| `prisma` | `./prisma/schema.prisma` | Database schema |

## Tech Stack

- **ORM**: Prisma 7.3.0
- **Database**: PostgreSQL
- **Adapter**: @prisma/adapter-pg
- **Dependencies**: `@mirai-app/supabase`

## Key Files

```
packages/db/
├── prisma/
│   ├── schema.prisma     # Database schema
│   └── config.ts         # Prisma configuration
├── src/
│   ├── index.ts          # Client exports
│   └── client.ts         # Prisma client instance
├── package.json
└── AGENTS.md             # This file
```

## Development Commands

```bash
# TypeScript check
bun run typecheck

# Lint
bun run lint

# Migrations (run from apps/seed)
cd apps/seed
bun run db:migrate:dev
```

## Dependencies

### Internal

- `@mirai-app/supabase` - Supabase client configuration

### External

- `@prisma/client` - Prisma client
- `@prisma/adapter-pg` - PostgreSQL adapter
- `prisma` - Prisma CLI (dev)

## Schema Location

The Prisma schema is at `packages/db/prisma/schema.prisma`.

## Usage in Apps

```typescript
import { prisma } from '@mirai-app/db';

// Query example
const users = await prisma.user.findMany();

// Create example
const user = await prisma.user.create({
  data: { email: 'user@example.com' }
});
```

## Links

- [Prisma setup](../../docs/packages/db/prisma.md)
- [Migrations guide](../../docs/packages/db/migrations.md)
- [Schema conventions](../../docs/packages/db/schema.md)
- [Root AGENTS.md](../../AGENTS.md)
