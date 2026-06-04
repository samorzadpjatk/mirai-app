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

# Testing
bun run test
bun run test:coverage
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

## Testing

This package follows an **integration-only testing approach**. We don't maintain unit tests here because:

- Database schema changes require a real database to validate properly
- Drizzle ORM behavior depends on actual database state and responses
- The package contains no business logic, only schema definitions and client exports

### PGLite Test Helper

This package provides `createPgliteTestDb()` for real database integration testing in other packages. It creates an in-memory PostgreSQL database with the production schema.

**Usage pattern:** `beforeAll` create DB, `beforeEach` reset tables, `afterAll` cleanup.

**Reset behavior:** `reset()` truncates all schema tables with `RESTART IDENTITY CASCADE`.

Database commands serve as implicit integration tests:
- `db:generate` validates schema syntax and generates migration SQL
- `db:push` and `db:migrate` verify migrations apply correctly
- `db:studio` provides manual verification of schema changes

For detailed testing patterns, see [Testing Conventions](./../../docs/conventions/testing.md).

## Links

- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [Drizzle Kit Documentation](https://orm.drizzle.team/kit-docs/overview)
- [Root AGENTS.md](../../AGENTS.md)
