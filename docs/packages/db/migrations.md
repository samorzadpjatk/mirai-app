# Database Migrations

## Overview

Database migrations are managed through Prisma Migrate. All migration commands are run from the `apps/seed` directory.

## Migration Workflow

### Development Workflow

```bash
cd apps/seed

# After modifying schema.prisma
bun run db:migrate:dev

# Or push schema directly (for prototyping)
bun run db:push:dev
```

### Production Workflow

```bash
cd apps/seed

# Deploy pending migrations
bun run db:migrate:deploy

# Or push changes
bun run db:push:prod
```

## Migration Commands

| Command | Purpose | Environment |
|---------|---------|-------------|
| `db:migrate:dev` | Create and apply migrations | Development |
| `db:migrate:prod` | Create and apply migrations | Production |
| `db:migrate:deploy` | Deploy pending migrations | Any |
| `db:push:dev` | Push schema directly | Development |
| `db:push:prod` | Push schema directly | Production |
| `db:reset:dev` | Reset database | Development |
| `db:reset:prod` | Reset database | Production |
| `db:studio:dev` | Open Prisma Studio | Development |
| `db:studio:prod` | Open Prisma Studio | Production |
| `db:generate` | Generate Prisma client | Any |

## Creating a Migration

1. **Modify the schema**:
   ```prisma
   // packages/db/prisma/schema.prisma
   model User {
     id    Int     @id @default(autoincrement())
     email String  @unique
     name  String?
   }
   ```

2. **Create migration**:
   ```bash
   cd apps/seed
   bun run db:migrate:dev
   # Enter migration name when prompted
   ```

3. **Migration file created**:
   ```
   packages/db/prisma/migrations/
   └── 20250101120000_add_user_profile/
       └── migration.sql
   ```

## Migration Best Practices

### DO

- **Use descriptive names**: `add_user_profile`, `create_posts_table`
- **Review migration files** before committing
- **Test migrations** on a copy of production data
- **Deploy incrementally** in production

### DON'T

- **Don't edit existing migrations** that have been applied
- **Don't delete migrations** from the migrations folder
- **Don't mix schema changes** with data migrations in one PR

## Migration File Structure

```sql
-- Example migration.sql
-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "name" TEXT,
    CONSTRAINT "User_email_key" UNIQUE("email")
);

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");
```

## Data Migrations

For data transformations during migration:

```typescript
// In a separate script
import { prisma } from '@mirai-app/db';

async function migrateData() {
  const users = await prisma.user.findMany();
  
  for (const user of users) {
    await prisma.user.update({
      where: { id: user.id },
      data: { 
        // Transform data
      }
    });
  }
}
```

## Rollback Strategy

Prisma doesn't support automatic rollbacks. Plan carefully:

1. **Before migration**: Backup database
2. **Test migrations** on staging environment
3. **Have a recovery plan** ready

## Troubleshooting

### "Migration already applied"

```bash
# Mark migration as rolled back
bunx prisma migrate resolve --rolled-back migration_name

# Mark migration as applied
bunx prisma migrate resolve --applied migration_name
```

### Migration fails in production

1. Check database logs
2. Verify migration SQL is valid
3. Consider running fix manually

## Prisma Studio

Visual database management:

```bash
cd apps/seed
bun run db:studio:dev
```

Access at http://localhost:5555
