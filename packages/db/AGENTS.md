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

## Testing

This package follows an **integration-only testing approach**. We don't maintain unit tests here because:

- Database schema changes require a real database to validate properly
- Drizzle ORM behavior depends on actual database state and responses
- The package contains no business logic, only schema definitions and client exports

**However**, consuming packages MUST test transaction rollback:
- The `$transaction` mock in router tests is currently a pass-through (no rollback/atomicity tested)
- Create `MockTransactionDB` that simulates rollback on failure
- Add at least one failure-path transaction test per router in `packages/orpc`

Database commands serve as implicit integration tests:
- `db:generate` validates schema syntax and generates migration SQL
- `db:push` and `db:migrate` verify migrations apply correctly
- `db:studio` provides manual verification of schema changes

For detailed testing rationale and patterns for consuming packages, see the root [TESTING.md](../../TESTING.md). For general monorepo testing conventions, see the root [AGENTS.md](../../AGENTS.md).

## Links

- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [Drizzle Kit Documentation](https://orm.drizzle.team/kit-docs/overview)
- [Root AGENTS.md](../../AGENTS.md)
