# Prisma to Drizzle ORM Migration Design

## Overview

Migrate the Mirai App monorepo from Prisma ORM to Drizzle ORM to achieve comprehensive performance improvements across cold start time, query execution, bundle size, and memory usage. The migration uses the Repository Adapter Pattern to minimize risk and enable zero-downtime deployment.

## Goals

- Reduce cold start time (Prisma client initialization overhead)
- Decrease bundle size for edge/serverless deployments
- Lower memory consumption
- Improve query execution performance
- Maintain zero downtime during migration
- Preserve existing DDD architecture (domain layer untouched)

## Architecture

### Core Strategy

Create Drizzle repository implementations that conform to existing port interfaces. The domain layer and use cases remain unchanged. Only adapters (repositories) and frameworks (database configuration) change.

### Layer Impact

| Layer      | Changes Required                                    |
| ---------- | --------------------------------------------------- |
| Domain     | None - entities, value objects unchanged            |
| Use Cases  | None - ports stay stable                            |
| Adapters   | New `DrizzleXRepository` classes, mapper extensions |
| Frameworks | New Drizzle configuration, schema definitions       |

### Dual-ORM Coexistence (Temporary)

Both ORMs run against the same PostgreSQL database during migration:

```
packages/adapters/src/gateways/
├── DrizzleUserRepository.ts     ← new (replaces Prisma)
├── PrismaUserRepository.ts      ← existing (removed after migration)
├── BaseDrizzleRepository.ts     ← new base class
└── BasePrismaRepository.ts      ← existing base class
```

Rollback requires only DI container reconfiguration. No database changes needed.

## Infrastructure Setup

### New Package Structure

```
packages/frameworks/src/drizzle/
├── index.ts              # Public exports
├── schema/
│   ├── index.ts          # Schema registry
│   ├── users.ts          # User table (TypeScript-native)
│   ├── groups.ts         # Group table
│   └── ...               # One file per entity
├── migrations/           # Drizzle migration files
├── config.ts             # Database connection
└── client.ts             # Drizzle client singleton
```

### Schema Definition Example

```typescript
// packages/frameworks/src/drizzle/schema/users.ts
import {
  pgTable,
  uuid,
  varchar,
  boolean,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", [
  "USER",
  "ADMIN",
  "MODERATOR",
  "SERVICE",
]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  authUserId: varchar("auth_user_id", { length: 255 }).notNull().unique(),
  firstName: varchar("first_name", { length: 255 }).notNull(),
  lastName: varchar("last_name", { length: 255 }).notNull(),
  role: roleEnum("role").notNull().default("USER"),
  hasAvatar: boolean("has_avatar").notNull().default(false),
  lastSeenOn: timestamp("last_seen_on", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type UserSelect = typeof users.$inferSelect;
export type UserInsert = typeof users.$inferInsert;
```

### Database Client

```typescript
// packages/frameworks/src/drizzle/client.ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString, {
  max: 10,
  prepare: false, // Supabase compatibility
});

export const db = drizzle(client, { schema });
export type Database = typeof db;
```

## Repository Implementation

### BaseDrizzleRepository

```typescript
// packages/adapters/src/gateways/BaseDrizzleRepository.ts
import { eq } from "drizzle-orm";
import type { Database } from "@mirai-app/frameworks/drizzle";

export interface EntityMapper<TDomain, TDb, TInsert, TUpdate> {
  toDomain(record: TDb): TDomain;
  toDrizzleCreate(entity: TDomain): TInsert;
  toDrizzleUpdate(entity: TDomain): TUpdate;
}

export abstract class BaseDrizzleRepository<
  TDomain,
  TDb,
  TInsert,
  TUpdate,
  TTable extends { id: string },
> {
  constructor(
    protected db: Database,
    protected table: TTable,
    protected mapper: EntityMapper<TDomain, TDb, TInsert, TUpdate>,
  ) {}

  async create(entity: TDomain): Promise<TDomain> {
    const data = this.mapper.toDrizzleCreate(entity);
    const [record] = await this.db
      .insert(this.table)
      .values(data as TInsert)
      .returning();
    return this.mapper.toDomain(record as TDb);
  }

  async findById(id: string): Promise<TDomain | null> {
    const [record] = await this.db
      .select()
      .from(this.table)
      .where(eq(this.table.id, id))
      .limit(1);
    return record ? this.mapper.toDomain(record as TDb) : null;
  }

  async findAll(options?: {
    limit?: number;
    offset?: number;
  }): Promise<TDomain[]> {
    let query = this.db.select().from(this.table);
    if (options?.limit) query = query.limit(options.limit);
    if (options?.offset) query = query.offset(options.offset);
    const records = await query;
    return records.map((r) => this.mapper.toDomain(r as TDb));
  }

  async update(entity: TDomain & { id: string }): Promise<TDomain> {
    const data = this.mapper.toDrizzleUpdate(entity);
    const [record] = await this.db
      .update(this.table)
      .set(data as TUpdate)
      .where(eq(this.table.id, entity.id))
      .returning();
    return this.mapper.toDomain(record as TDb);
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(this.table).where(eq(this.table.id, id));
  }

  async exists(id: string): Promise<boolean> {
    const [record] = await this.db
      .select({ id: this.table.id })
      .from(this.table)
      .where(eq(this.table.id, id))
      .limit(1);
    return record !== undefined;
  }
}
```

### Concrete Repository Example

```typescript
// packages/adapters/src/gateways/DrizzleUserRepository.ts
import { eq } from "drizzle-orm";
import type { UserRepository } from "@mirai-app/use-cases";
import type { User, UserRole } from "@mirai-app/domain";
import type { Database } from "@mirai-app/frameworks/drizzle";
import { users, type UserSelect } from "@mirai-app/frameworks/drizzle/schema";
import { BaseDrizzleRepository } from "./BaseDrizzleRepository";
import { UserMapper } from "../mappers/UserMapper";

const UserMapperAdapter = {
  toDomain: UserMapper.toDomain,
  toDrizzleCreate: (user: User) => ({
    id: user.id,
    authUserId: user.authUserId,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    hasAvatar: user.hasAvatar,
    lastSeenOn: user.lastSeenOn,
    createdAt: user.createdAt,
    updatedAt: new Date(),
  }),
  toDrizzleUpdate: (user: User) => ({
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    hasAvatar: user.hasAvatar,
    lastSeenOn: user.lastSeenOn,
    updatedAt: new Date(),
  }),
};

export class DrizzleUserRepository
  extends BaseDrizzleRepository<
    User,
    UserSelect,
    unknown,
    unknown,
    typeof users
  >
  implements UserRepository
{
  constructor(db: Database) {
    super(db, users, UserMapperAdapter);
  }

  async findByAuthUserId(authUserId: string): Promise<User | null> {
    const [record] = await this.db
      .select()
      .from(users)
      .where(eq(users.authUserId, authUserId))
      .limit(1);
    return record ? this.mapper.toDomain(record) : null;
  }

  async findByRole(role: UserRole): Promise<User[]> {
    const records = await this.db
      .select()
      .from(users)
      .where(eq(users.role, role));
    return records.map((r) => this.mapper.toDomain(r));
  }

  async existsByAuthUserId(authUserId: string): Promise<boolean> {
    const user = await this.findByAuthUserId(authUserId);
    return user !== null;
  }
}
```

### DI Container Registration

```typescript
// packages/adapters/src/modules/RepositoryModule.ts
export const RepositoryModule = createStaticModule({
  providers: {
    // Drizzle repositories (gradually replacing Prisma)
    userRepository: {
      factory: (cradle) => new DrizzleUserRepository(cradle.drizzleDb),
      lifetime: Lifetime.SINGLETON,
    },

    // Prisma repositories (to migrate)
    tripRepository: {
      factory: (cradle) => new PrismaTripRepository(cradle.prismaClient),
      lifetime: Lifetime.SINGLETON,
    },

    // Database clients
    prismaClient: {
      /* existing */
    },
    drizzleDb: {
      factory: () => createDrizzleClient(),
      lifetime: Lifetime.SINGLETON,
    },
  },
});
```

## Testing Strategy

### Unit Tests

Each Drizzle repository gets tests mirroring Prisma tests:

```typescript
// packages/adapters/src/__tests__/DrizzleUserRepository.test.ts
describe("[UNIT] DrizzleUserRepository", () => {
  let container: any;

  beforeEach(() => {
    container = createTestContainer();
    container.register({
      drizzleDb: asFunction(() => createTestDrizzleClient()).singleton(),
      userRepository: asClass(DrizzleUserRepository).singleton(),
    });
  });

  it("finds user by ID", async () => {
    const repo = container.resolve("userRepository");
    // Same assertions as Prisma tests
  });
});
```

### Integration Tests

Use testcontainers for PostgreSQL integration:

```typescript
const postgres = await new PostgreSqlContainer().start();
const drizzleDb = drizzle(postgres.getConnectionUri());
// Run migrations, execute tests, verify results
```

### Validation Strategy

1. **Parallel reads:** Run Drizzle queries alongside Prisma in production, compare results, return Prisma data
2. **Shadow testing:** Execute Drizzle queries without affecting responses, log discrepancies
3. **Gradual writes:** Switch writes to Drizzle after read validation

## Migration Timeline

### Phase 1: Infrastructure (Week 1-2)

- Install Drizzle dependencies
- Create drizzle package structure
- Build BaseDrizzleRepository
- Convert schema.prisma to Drizzle TypeScript schemas
- Setup drizzle-kit configuration
- Add Drizzle client to DI container
- Write infrastructure tests

### Phase 2: Entity Migration (Week 3-10)

| Priority | Entity              | Relations | Complexity   | Effort |
| -------- | ------------------- | --------- | ------------ | ------ |
| 1        | User                | Low       | Simple       | 2 days |
| 2        | Group               | Low       | Simple       | 2 days |
| 3        | Trip                | Medium    | Medium       | 3 days |
| 4        | Event               | Medium    | Medium       | 2 days |
| 5        | Location            | Low       | Simple       | 2 days |
| 6        | Challenge           | High      | Complex      | 4 days |
| 7        | ChallengeSubmission | High      | Complex      | 4 days |
| 8        | ActivityFeed        | Very High | Very Complex | 5 days |
| 9        | Notification        | High      | Complex      | 3 days |
| 10       | Remaining entities  | -         | -            | 5 days |

**Per-entity workflow:**

1. Create Drizzle schema file
2. Create DrizzleXRepository
3. Extend mapper with Drizzle methods
4. Write unit tests (mirror Prisma tests)
5. Write integration tests
6. Register in RepositoryModule (feature flag initially)
7. Deploy to staging, run parallel validation
8. Enable in production
9. Monitor for 48 hours
10. Remove Prisma repository

### Phase 3: Cleanup (Week 11-12)

- Remove all Prisma repositories
- Remove BasePrismaRepository
- Remove Prisma client from DI container
- Delete generated Prisma client
- Archive old migrations
- Update documentation

## Rollback Plan

Instant rollback via DI container:

```typescript
userRepository: {
  // factory: (cradle) => new DrizzleUserRepository(cradle.drizzleDb),
  factory: (cradle) => new PrismaUserRepository(cradle.prismaClient),
  lifetime: Lifetime.SINGLETON,
}
```

No database rollback required. Both ORMs use identical PostgreSQL schema.

## Schema Verification

Before each entity migration, verify schema equivalence:

```bash
# Dump Prisma schema as SQL
bun prisma migrate diff --from-empty --to-schema-datamodel schema.prisma --script > prisma_schema.sql

# Generate Drizzle schema SQL
bun drizzle-kit generate --sql

# Compare (must be identical for migrated tables)
diff prisma_schema.sql drizzle_schema.sql
```

## Success Criteria

- All 30+ entities migrated to Drizzle
- Zero production incidents during migration
- Test coverage maintained at current levels
- Performance metrics improved:
  - Cold start time reduced
  - Bundle size decreased
  - Memory usage lowered
  - Query performance maintained or improved
- Clean rollback capability demonstrated

## Dependencies

```json
{
  "dependencies": {
    "drizzle-orm": "^0.30.0",
    "postgres": "^3.4.0"
  },
  "devDependencies": {
    "drizzle-kit": "^0.20.0",
    "@testcontainers/postgresql": "^10.0.0"
  }
}
```

## References

- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [Drizzle Kit Migrations](https://orm.drizzle.team/kit-docs/overview)
- Existing codebase: `packages/frameworks/src/prisma/`, `packages/adapters/src/gateways/`
