# @mirai-app/adapters - Adapters Layer

> **Interface Adapters layer of Clean Architecture - Bridge to external frameworks**
>
> Depends on @mirai-app/domain and @mirai-app/use-cases

## Contents

- **Controllers**: tRPC routers, API endpoints (thin controllers)
- **Gateways**: Repository implementations (Prisma, etc.)
- **Presenters**: Response formatters
- **Mappers**: Data transformation between domain and external formats

## Rules

1. **Implement Inner Layer Interfaces**: Implement use-case ports
2. **Convert Data Only**: Convert formats, not business logic
3. **No Decisions**: Adapters adapt; they never decide
4. **Framework-Specific**: Contains framework-specific code (tRPC, Prisma)
5. **No Domain Logic**: Keep business rules in the domain layer

## Directory Structure

```
src/
├── index.ts              # Public exports
├── api/                  # tRPC routers and controllers
│   ├── trpc.ts          # tRPC setup (publicProcedure only)
│   ├── controller-helpers.ts  # Auth helpers
│   └── controllers/      # tRPC routers
├── utils/               # Utility functions
│   └── TokenExtractor.ts    # Extract Bearer tokens from headers
├── gateways/            # Repository implementations
├── presenters/          # Response formatters
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

### Controller (tRPC Router) - New Auth Pattern

Controllers handle authentication explicitly. The tRPC layer provides only transport.

```typescript
// controllers/user-controller.ts
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure, createTRPCRouter } from "../trpc";
import { requireAuth, requireAdmin } from "../controller-helpers";
import { CreateUserUseCase } from "@mirai-app/use-cases";

export const userController = createTRPCRouter({
  // Public endpoint - no auth required
  getPublicData: publicProcedure.query(async ({ ctx }) => {
    // No auth needed
    return { data: "public" };
  }),

  // Protected endpoint - requires authentication
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      // 1. Extract and validate auth at controller level
      const authContext = await requireAuth(ctx.headers, ctx.di);

      // 2. Resolve use case from DI
      const useCase = ctx.di.resolve<CreateUserUseCase>("createUserUseCase");

      // 3. Execute with explicit auth context
      const result = await useCase.execute({
        ...input,
        authContext, // Pass auth downstream
      });

      // 4. Handle Result type
      if (result.kind === "err") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: result.error.message,
        });
      }

      return result.value;
    }),

  // Admin-only endpoint
  adminAction: publicProcedure.mutation(async ({ ctx }) => {
    // Throws TRPCError FORBIDDEN if not admin
    const authContext = await requireAdmin(ctx.headers, ctx.di);

    // Execute admin-only logic...
    return { success: true };
  }),
});
```

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
```

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
