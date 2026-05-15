# @mirai-app/db - Agent Guide

> **Inherited Conventions**: See [root AGENTS.md](../../AGENTS.md) for monorepo conventions, build system, and development workflow.

## Purpose

Database layer for the MIRAI application. Contains Drizzle schema, database client, and migration utilities. All database access goes through this package.

## Exports

| Export | Path | Description |
|--------|------|-------------|
| `main` | `./src/index.ts` | Drizzle client, schema, `runMigrations`, and inferred model types |

## Tech Stack

- **ORM**: Drizzle ORM 0.45.2
- **Database**: PostgreSQL
- **Driver**: postgres-js 3.4.9
- **Dependencies**: `@mirai-app/supabase`

## Key Files

```
packages/db/
├── drizzle/
│   └── meta/           # Drizzle migration metadata
├── src/
│   ├── schema/         # Drizzle schema definitions
│   ├── utils/
│   │   └── uuid.ts     # Cross-platform UUID helper
│   │   ├── index.ts        # Schema and type exports
│   ├── client.ts       # Drizzle client factory
│   └── migrate.ts      # Programmatic migration runner (`runMigrations`)
├── drizzle.config.ts   # Drizzle Kit configuration
├── package.json
└── AGENTS.md           # This file
```

## Development Commands

```bash
# TypeScript check
bun run typecheck

# Lint
bun run lint

# Generate migration SQL from schema changes
bun run db:generate

# Push schema directly (development only)
bun run db:push
```

> **Production migrations** are handled automatically by the backend server on startup
> via `runMigrations()`. The separate `db-migrations` Docker service has been removed.

## Dependencies

### Internal

- `@mirai-app/supabase` - Supabase client configuration

### External

- `drizzle-orm` - TypeScript ORM
- `postgres` - PostgreSQL driver
- `drizzle-kit` - Schema management CLI (dev)

## Schema Location

The Drizzle schema is at `packages/db/src/schema/`.

## Usage in Apps

```typescript
import { createDb, users, eq } from "@mirai-app/db";
import { drizzle } from "drizzle-orm/postgres-js";

// Create client
const db = createDb(databaseUrl);

// Query example
const allUsers = await db.query.users.findMany();

// Insert example
const newUser = await db.insert(users).values({ email: "user@example.com" }).returning();
```

## Links

- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [Drizzle Kit Documentation](https://orm.drizzle.team/kit-docs/overview)
- [Root AGENTS.md](../../AGENTS.md)
