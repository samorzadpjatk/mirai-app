# @mirai-app/seed - Agent Guide

> **Inherited Conventions**: See [root AGENTS.md](../../AGENTS.md) for monorepo conventions, build system, and development workflow.

## Purpose

Database seeding CLI tool. Populates the database with initial data for development, testing, and demo purposes.

## Tech Stack

- **Runtime**: Bun
- **ORM**: Drizzle
- **Data Formats**: CSV, YAML, JSON
- **Dependencies**: `@mirai-app/db`, `@mirai-app/supabase`

## Key Files

```
apps/seed/
├── data/                 # Seed data files
│   ├── users.csv
│   ├── events.yaml
│   └── fixtures/
├── src/
│   ├── index.ts          # CLI entry
│   ├── seed.ts           # Seed logic
│   └── utils.ts          # Utilities
├── package.json
└── AGENTS.md             # This file
```

## Development Commands

```bash
# Seed development database
bun run db:seed:dev

# Seed production database
bun run db:seed:prod

# Run migrations
bun run db:migrate:dev
bun run db:migrate:prod

# Reset database
bun run db:reset:dev
bun run db:reset:prod

# Open Drizzle Studio
bun run db:studio:dev
bun run db:studio:prod

# Format schema
bun run db:format
```

## Database Commands

All database operations are run from this app:

| Command | Purpose |
|---------|---------|
| `db:generate` | Generate Drizzle migrations |
| `db:migrate:dev` | Create and apply dev migrations |
| `db:migrate:prod` | Deploy migrations to production |
| `db:push:dev` | Push schema directly (dev) |
| `db:push:prod` | Push schema directly (prod) |
| `db:reset:dev` | Reset dev database |
| `db:reset:prod` | Reset prod database |
| `db:studio:dev` | Open Drizzle Studio (dev) |

## Dependencies

- `@mirai-app/db` - Drizzle client
- `@mirai-app/supabase` - Supabase client
- `csv-parse` - CSV parsing
- `yaml` - YAML parsing

## Links

- [Database seeding guide](../../docs/apps/seed/database-seeding.md)
- [Root AGENTS.md](../../AGENTS.md)
