# @mirai-app/db

Common package managing database schema and Prisma migrations for the MIRAI app monorepo.

## Structure

```
packages/db/
├── src/
│   ├── index.ts         # Exported Prisma client
│   ├── client.ts        # Prisma client configuration
│   ├── prisma/
│   │   ├── schema.prisma    # Database schema
│   │   ├── migrations/      # Migration history
│   │   └── lib/            # Generated Prisma client
├── prisma.config.ts      # Prisma configuration
└── Dockerfile.migrations # Migration container configuration
```

## Available Commands

All commands can be run from the package directory or using `cd`:

```bash
# From package directory
bun run <command>

# From repository root
cd packages/db && bun run <command>
```

### Basic Commands

#### `db:generate`

Generates Prisma client based on schema. Runs automatically after `bun install`.

```bash
cd packages/db && bun run db:generate
```

#### `db:push`

Pushes schema changes directly to database without creating migrations. **Useful in development environment**.

```bash
cd packages/db && bun run db:push
```

#### `db:studio`

Opens Prisma Studio - graphical interface for viewing and editing database data.

```bash
cd packages/db && bun run db:studio
```

### Migration Commands (Production)

#### `db:migrate:dev`

Creates new migration based on schema changes and applies it to development database.

```bash
cd packages/db && bun run db:migrate:dev
```

You'll be prompted for migration name after execution.

#### `db:migrate`

Applies pending migrations to database. **Used in production environment**.

```bash
cd packages/db && bun run db:migrate
```

#### `db:reset`

Resets database: removes all data, reapplies all migrations, and runs seed.

**⚠️ WARNING: Deletes all data from database! Use only in development environment!**

```bash
cd packages/db && bun run db:reset
```

## Development Workflow

### 1. Project Initialization

After cloning the repository:

```bash
# Install dependencies (automatically runs db:generate)
bun install

# Fill database with initial data
cd apps/seed && bun run start
```

### 2. Schema Modification

After changing `src/prisma/schema.prisma`:

```bash
# In development environment - quick prototyping
cd packages/db && bun run db:push

# OR with migrations - for changes going to production
cd packages/db && bun run db:migrate:dev
```

### 3. Data Viewing

```bash
cd packages/db && bun run db:studio
```

Opens in browser at `http://localhost:5555`

## Configuration

The package requires the `DATABASE_URL` environment variable defined in `.env` file in project root:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:54322/postgres"
```

## Usage in Applications

```typescript
import { prisma } from "@mirai-app/db";

// Example usage
const users = await prisma.user.findMany();
```

## Testing

This package follows an **integration-only testing approach**. We don't maintain unit tests here because:

- Database schema changes require a real database to validate properly
- Prisma client behavior depends on actual database state and responses
- The package contains no business logic, only schema definitions and generated client exports

Database commands serve as implicit integration tests:
- `db:generate` validates schema syntax and generates the type-safe client
- `db:push` and `db:migrate` verify migrations apply correctly
- `db:studio` provides manual verification of schema changes

For detailed testing rationale and patterns for consuming packages, see [TESTING.md](./TESTING.md). For general monorepo testing conventions, see the root [TESTING.md](../../TESTING.md).

## More Information

- [Prisma Documentation](https://www.prisma.io/docs)
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- [Prisma Migrate](https://www.prisma.io/docs/concepts/components/prisma-migrate)
