# Database Migrations

## Overview

Database migrations are managed through Drizzle Kit. All migration commands are run from the `apps/seed` directory or `packages/db`.

## Migration Workflow

### Development Workflow

```bash
cd packages/db

# After modifying schema files in src/schema/
bun run db:generate

# Or push schema directly (for prototyping)
bun run db:push
```

### Production Workflow

```bash
cd packages/db

# Apply pending migrations
bun run db:migrate

# Or push changes (not recommended for production)
bun run db:push
```

## Migration Commands

| Command | Purpose | Environment |
|---------|---------|-------------|
| `db:generate` | Generate migration SQL from schema | Development |
| `db:migrate` | Apply pending migrations | Production |
| `db:push` | Push schema directly | Development |
| `db:studio` | Open Drizzle Studio | Development |
| `db:reset` | Reset database | Development |

## Creating a Migration

1. **Modify the schema**:
   ```typescript
   // packages/db/src/schema/users.ts
   import { pgTable, varchar, text } from "drizzle-orm/pg-core";

   export const users = pgTable("users", {
     id: varchar("id", { length: 36 }).primaryKey(),
     email: text("email").unique(),
     name: text("name"),
   });
   ```

2. **Generate migration**:
   ```bash
   cd packages/db
   bun run db:generate
   ```

3. **Migration file created**:
   ```
   packages/db/drizzle/
   └── 0000_add_user_profile.sql
   └── meta/
       └── 0000_snapshot.json
       └── _journal.json
   ```

## Migration Best Practices

### DO

- **Use descriptive names**: Drizzle Kit generates timestamped filenames automatically
- **Review migration files** before committing
- **Test migrations** on a copy of production data
- **Deploy incrementally** in production

### DON'T

- **Don't edit existing migrations** that have been applied
- **Don't delete migrations** from the drizzle folder
- **Don't mix schema changes** with data migrations in one PR

## Migration File Structure

```sql
-- Example migration.sql
CREATE TABLE IF NOT EXISTS "users" (
    "id" varchar(36) PRIMARY KEY NOT NULL,
    "email" text NOT NULL,
    "name" text,
    CONSTRAINT "users_email_unique" UNIQUE("email")
);

CREATE INDEX IF NOT EXISTS "users_email_idx" ON "users" ("email");
```

## Data Migrations

For data transformations during migration:

```typescript
// In a separate script
import { createDb, users } from '@mirai-app/db';
import { eq } from 'drizzle-orm';

const db = createDb(process.env.DATABASE_URL!);

async function migrateData() {
  const allUsers = await db.query.users.findMany();

  for (const user of allUsers) {
    await db.update(users)
      .set({ name: user.name?.trim() })
      .where(eq(users.id, user.id));
  }
}
```

## Rollback Strategy

Drizzle Kit doesn't support automatic rollbacks. Plan carefully:

1. **Before migration**: Backup database
2. **Test migrations** on staging environment
3. **Have a recovery plan** ready

## Troubleshooting

### Migration fails in production

1. Check database logs
2. Verify migration SQL is valid
3. Consider running fix manually

### "Migration already applied"

Check the `__drizzle_migrations__` table in your database and compare with the local drizzle meta folder.

## Drizzle Studio

Visual database management:

```bash
cd packages/db
bun run db:studio
```

Access at http://localhost:4983

## Further Reading

- [Drizzle Kit Documentation](https://orm.drizzle.team/kit-docs/overview)
- [Schema Conventions](./schema.md)
- [Drizzle Setup](./drizzle.md)
