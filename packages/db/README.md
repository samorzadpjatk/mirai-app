# @mirai-app/db

Common package managing database schema and Drizzle migrations for the MIRAI app monorepo.

## Structure

```
packages/db/
├── drizzle/
│   └── meta/              # Drizzle migration metadata
├── src/
│   ├── schema/            # Drizzle schema definitions
│   ├── utils/
│   │   └── uuid.ts        # Cross-platform UUID helper
│   ├── index.ts           # Exported Drizzle client, schema, and types
│   └── client.ts          # Drizzle client configuration
├── drizzle.config.ts      # Drizzle Kit configuration
└── Dockerfile.migrations  # Migration container configuration
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

Generates Drizzle migration SQL based on schema changes.

```bash
cd packages/db && bun run db:generate
```

#### `db:push`

Pushes schema changes directly to database without creating migrations. **Useful in development environment**.

```bash
cd packages/db && bun run db:push
```

#### `db:studio`

Opens Drizzle Studio - graphical interface for viewing and editing database data.

```bash
cd packages/db && bun run db:studio
```

### Migration Commands (Production)

#### `db:migrate`

Applies pending migrations to database. **Used in production environment**.

```bash
cd packages/db && bun run db:migrate
```

## Development Workflow

### 1. Project Initialization

After cloning the repository:

```bash
# Install dependencies
bun install

# Fill database with initial data
cd apps/seed && bun run start
```

### 2. Schema Modification

After changing files in `src/schema/`:

```bash
# In development environment - quick prototyping
cd packages/db && bun run db:push

# OR with migrations - for changes going to production
cd packages/db && bun run db:generate
```

### 3. Data Viewing

```bash
cd packages/db && bun run db:studio
```

Opens in browser at `http://localhost:4983`

## Configuration

The package requires the `DATABASE_URL` environment variable defined in `.env` file in project root:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:54322/postgres"
```

## Usage in Applications

```typescript
import { createDb, users } from "@mirai-app/db";

// Create client
const db = createDb(process.env.DATABASE_URL);

// Example usage
const allUsers = await db.query.users.findMany();
```

## Testing

This package follows an **integration-only testing approach**. We don't maintain unit tests here because:

- Database schema changes require a real database to validate properly
- Drizzle ORM behavior depends on actual database state and responses
- The package contains no business logic, only schema definitions and client exports

Database commands serve as implicit integration tests:
- `db:generate` validates schema syntax and generates migration SQL
- `db:push` and `db:migrate` verify migrations apply correctly
- `db:studio` provides manual verification of schema changes

For detailed testing rationale and patterns for consuming packages, see [TESTING.md](./TESTING.md). For general monorepo testing conventions, see the root [TESTING.md](../../TESTING.md).

## More Information

- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [Drizzle Kit Documentation](https://orm.drizzle.team/kit-docs/overview)
