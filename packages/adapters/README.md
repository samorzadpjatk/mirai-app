# @mirai-app/adapters - Adapters Layer

> **Interface Adapters layer of Clean Architecture - Bridge to external frameworks**
>
> Depends on @mirai-app/domain and @mirai-app/use-cases

## Contents

- **Controllers**: GraphQL resolvers, API endpoints (thin controllers)
- **Gateways**: Repository implementations (Drizzle, etc.)
- **Presenters**: Response formatters
- **Mappers**: Data transformation between domain and external formats

## Rules

1. **Implement Inner Layer Interfaces**: Implement use-case ports
2. **Convert Data Only**: Convert formats, not business logic
3. **No Decisions**: Adapters adapt; they never decide
4. **Framework-Specific**: Contains framework-specific code (GraphQL, Hono, Drizzle)
5. **No Domain Logic**: Keep business rules in the domain layer

## Directory Structure

```
src/
├── index.ts              # Public exports
├── api/                  # API utilities
│   └── errors.ts        # Error handling utilities
├── controllers/          # GraphQL controllers/resolvers
├── utils/               # Utility functions
│   ├── TokenExtractor.ts    # Extract Bearer tokens from headers
│   ├── controller-helpers.ts # Auth helpers
│   └── effect-executor.ts   # Effect execution utilities
├── gateways/            # Repository implementations
│   ├── drizzle/         # Drizzle ORM implementations
│   └── in-memory/       # In-memory test implementations
├── modules/             # DI modules
├── services/            # External service integrations
├── errors/              # Adapter-specific errors
└── mappers/             # Domain <-> DTO <-> DB mapping
```

## Examples

### Repository Implementation (Gateway)

#### Option 1: BasePrismaRepository (Recommended)

Extend the base class for standard CRUD operations:

```typescript
// gateways/PrismaUserRepository.ts
import type { UserRepository } from "@mirai-app/use-cases";
import type { User, UserRole } from "@mirai-app/domain";
import type { PrismaClient } from "@mirai-app/frameworks/prisma/client";
import {
  BasePrismaRepository,
  type EntityMapper,
} from "./BasePrismaRepository";
import { UserMapper } from "../mappers/UserMapper";

// Adapter for static Mapper to interface
const UserMapperAdapter: EntityMapper<
  User,
  PrismaUser,
  CreateInput,
  UpdateInput
> = {
  toDomain: UserMapper.toDomain,
  toPrismaCreate: UserMapper.toPrismaCreate,
  toPrismaUpdate: UserMapper.toPrismaUpdate,
};

export class PrismaUserRepository
  extends BasePrismaRepository<User, PrismaUser, CreateInput, UpdateInput>
  implements UserRepository
{
  constructor(prisma: PrismaClient) {
    super(prisma.user, UserMapperAdapter);
  }

  // Add custom query methods only
  async findByAuthUserId(authUserId: string): Promise<User | null> {
    const record = await this.model.findUnique({ where: { authUserId } });
    return record ? this.mapper.toDomain(record) : null;
  }

  async findByRole(role: UserRole): Promise<User[]> {
    const records = await this.model.findMany({ where: { role } });
    return records.map((r) => this.mapper.toDomain(r));
  }
}
```

**Benefits:**

- ~70% less code per repository
- Consistent error handling
- One place for bug fixes

#### Option 2: Manual Implementation (Legacy/Complex Cases)

Implement manually for highly custom needs:

```typescript
// gateways/PrismaCustomRepository.ts
import type { CustomRepository } from "@mirai-app/use-cases";
import type { Custom } from "@mirai-app/domain";
import { CustomMapper } from "../mappers/CustomMapper";

export class PrismaCustomRepository implements CustomRepository {
  constructor(private prisma: PrismaClient) {}

  async create(entity: Custom): Promise<Custom> {
    const record = await this.prisma.custom.create({
      data: CustomMapper.toPrismaCreate(entity),
    });
    return CustomMapper.toDomain(record);
  }

  // ... implement all methods manually
}
```

Use this only when the base class doesn't fit.

### Mapper

```typescript
// mappers/UserMapper.ts
import { User } from "@mirai-app/domain";
import type { PrismaUser } from "@prisma/client";

export class UserMapper {
  static toDomain(record: PrismaUser): User {
    // Create domain entity from database record
    const result = User.create({
      id: record.id,
      email: record.email,
      createdAt: record.createdAt,
    });

    if (result.isError()) {
      throw new Error(`Invalid user record: ${result.error}`);
    }

    return result.value;
  }

  static toDTO(user: User): UserDTO {
    return {
      id: user.id,
      email: user.email.value,
      createdAt: user.createdAt.toISOString(),
    };
  }
}
```

### Controller (GraphQL/Hono) - Auth Pattern

Controllers handle authentication explicitly using Effect-based patterns.

```typescript
// controllers/user.ts
import { requireAuth, requireAdmin } from "../utils/controller-helpers";
import type { CreateUserUseCase } from "@mirai-app/use-cases";
import type { DIContext } from "@mirai-app/frameworks/di";
import { Effect } from "effect";

export class UserController {
  constructor(private createUserUseCase: CreateUserUseCase) {}

  // Public endpoint - no auth required
  async getPublicData() {
    return { data: "public" };
  }

  // Protected endpoint - requires authentication
  async getById(input: { id: string }, di: DIContext) {
    // 1. Extract and validate auth at controller level
    const authContext = await requireAuth(di.headers, di);

    // 2. Execute use case with Effect
    const effect = this.createUserUseCase.execute({
      ...input,
      authContext, // Pass auth downstream
    });

    // 3. Run Effect and handle errors
    return await Effect.runPromise(
      effect.pipe(Effect.catchTag("NotFoundError", () => Effect.succeed(null))),
    );
  }
}
```

### Effect-Based Error Handling

Controllers use Effect for composable error handling:

```typescript
import { Effect } from "effect";
import { requireAuth } from "../utils/controller-helpers";

async function handleRequest(input: Input, di: DIContext) {
  const program = Effect.gen(function* () {
    const authContext = yield* requireAuthEffect(di.headers, di);
    const result = yield* useCase.execute({ ...input, authContext });
    return result;
  });

  return await Effect.runPromise(program);
}
```

// Admin-only endpoint
adminAction: publicProcedure.mutation(async ({ ctx }) => {
// Throws TRPCError FORBIDDEN if not admin
const authContext = await requireAdmin(ctx.headers, ctx.di);

    // Execute admin-only logic...
    return { success: true };

}),
});

````

### TokenExtractor Utility

Extracts Bearer tokens from HTTP Authorization headers:

```typescript
import { TokenExtractor } from "../utils/TokenExtractor";

// In controller or helper:
const authHeader = ctx.headers.get("authorization");
const token = TokenExtractor.extract(authHeader); // Returns string | null

if (!token) {
  throw new TRPCError({ code: "UNAUTHORIZED", message: "No token" });
}
````

The TokenExtractor validates the Bearer scheme and handles various header formats.

### Controller Helpers (controller-helpers.ts)

Standard functions for authentication and authorization:

```typescript
import {
  requireAuth, // Requires valid authentication
  requireAdmin, // Requires ADMIN role
  requireModerator, // Requires MODERATOR or ADMIN role
  getOptionalAuth, // Returns null if not authenticated
} from "../controller-helpers";

// Usage examples:

// 1. Require authentication
const authContext = await requireAuth(ctx.headers, ctx.di);
// Throws TRPCError UNAUTHORIZED if missing/invalid

// 2. Require admin role
const authContext = await requireAdmin(ctx.headers, ctx.di);
// Throws TRPCError FORBIDDEN if not admin

// 3. Require moderator (includes admins)
const authContext = await requireModerator(ctx.headers, ctx.di);
// Throws TRPCError FORBIDDEN if not moderator/admin

// 4. Optional authentication
const authContext = await getOptionalAuth(ctx.headers, ctx.di);
// Returns AuthContext | null - doesn't throw
```

All helpers return `AuthContext` with:

- `userId`: Branded UserId type
- `role`: UserRole (ADMIN, MODERATOR, USER)
- `email`: User email
- Helper methods: `isAdmin()`, `isModerator()`, `hasRoleAtLeast()`

## Testing

Adapter tests use real dependencies (integration tests):

```typescript
import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { PrismaUserRepository } from "./PrismaUserRepository";

describe("PrismaUserRepository", () => {
  let repo: PrismaUserRepository;
  let testDb: TestPrismaClient;

  beforeAll(async () => {
    testDb = await createTestDatabase();
    repo = new PrismaUserRepository(testDb);
  });

  it("should persist user", async () => {
    const user = User.create({ email: "test@example.com" });
    const saved = await repo.create(user.value);

    expect(saved.id).toBeDefined();

    // Verify in database
    const fromDb = await testDb.user.findUnique({ where: { id: saved.id } });
    expect(fromDb).not.toBeNull();
  });

  afterAll(async () => {
    await testDb.cleanUp();
  });
});
```

## Anti-Patterns to Avoid

### ❌ Business Logic in Controllers

```typescript
// BAD: Business logic in controller
export const badController = createTRPCRouter({
  create: procedure.mutation(async ({ input }) => {
    // ❌ Validation (should be in domain)
    if (!input.email.includes("@")) {
      throw new Error("Invalid email");
    }

    // ❌ Business logic (should be in use case)
    if (input.email.endsWith("@blocked.com")) {
      throw new Error("Domain blocked");
    }

    // Direct database access mixed with logic
    const user = await prisma.user.create({ data: input });
    return user;
  }),
});
```

### ❌ Auth Logic in tRPC Middleware

```typescript
// BAD: Using deleted auth-aware procedures
export const badController = createTRPCRouter({
  action: protectedProcedure // ❌ DELETED - doesn't exist
    .mutation(async ({ ctx, input }) => {
      // ❌ Old pattern no longer works
      const userId = ctx.user.id; // ❌ ctx.user removed
    }),
});
```

### ✅ Clean Controller

```typescript
// GOOD: Thin controller with DI
export const goodController = createTRPCRouter({
  create: publicProcedure
    .input(createUserInput)
    .mutation(async ({ ctx, input }) => {
      // Only: Input validation (zod)
      // Only: Auth extraction via helpers
      const authContext = await requireAuth(ctx.headers, ctx.di);

      // Only: DI resolution
      const controller = ctx.di.resolve("userController");

      // Only: Execute and handle result
      return controller.create(input, authContext);
    }),
});
```

### ✅ Auth in Controllers

```typescript
// GOOD: Auth at controller level
export const goodController = createTRPCRouter({
  action: publicProcedure // ✅ Only publicProcedure exists
    .mutation(async ({ ctx, input }) => {
      // Controller handles auth
      const authContext = await requireAuth(ctx.headers, ctx.di);
      const controller = ctx.di.resolve("myController");
      return controller.action(input, authContext);
    }),
});
```

## References

- [CLAUDE.md](../../CLAUDE.md) - CEK Five Pillars (DDD section)
- [Repository Pattern](https://martinfowler.com/eaaCatalog/repository.html)
- [Data Mapper Pattern](https://martinfowler.com/eaaCatalog/dataMapper.html)
