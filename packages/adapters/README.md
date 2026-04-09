# @repo/adapters - Adapters Layer

> **Interface Adapters layer of Clean Architecture - Bridge to external frameworks**
>
> Depends on @repo/domain and @repo/use-cases

## Purpose

The adapters layer contains:

- **Controllers**: tRPC routers, API endpoints (thin controllers)
- **Gateways**: Repository implementations (Prisma, etc.)
- **Presenters**: Response formatters
- **Mappers**: Data transformation between domain and external formats

## Rules

1. **Implements Inner Layer Interfaces**: Implements ports from use-cases layer
2. **Data Conversion Only**: Converts between formats, no business logic
3. **No Decisions**: Adapters adapt, they don't decide
4. **Framework-Specific**: Contains framework-specific code (tRPC, Prisma)
5. **No Domain Logic**: Business rules stay in domain layer

## Directory Structure

```
src/
├── index.ts              # Public exports
├── controllers/          # tRPC routers, API controllers
│   └── .gitkeep
├── gateways/             # Repository implementations
│   └── .gitkeep
├── presenters/           # Response formatters
│   └── .gitkeep
└── mappers/              # Domain <-> DTO <-> DB mapping
    └── .gitkeep
```

## Example Usage

### Repository Implementation (Gateway)

#### Option 1: Using BasePrismaRepository (Recommended)

For repositories with standard CRUD operations, extend the base class:

```typescript
// gateways/PrismaUserRepository.ts
import type { UserRepository } from "@repo/use-cases";
import type { User, UserRole } from "@repo/domain";
import type { PrismaClient } from "@repo/frameworks/prisma/client";
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

  // Add only custom query methods
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
- Consistent error handling across all repositories
- Bug fixes apply to one place (base class)

#### Option 2: Manual Implementation (Legacy/Complex Cases)

For repositories with highly custom needs, implement manually:

```typescript
// gateways/PrismaCustomRepository.ts
import type { CustomRepository } from "@repo/use-cases";
import type { Custom } from "@repo/domain";
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

Use this only when the base class doesn't fit your needs.

````

### Mapper

```typescript
// mappers/UserMapper.ts
import { User } from "@repo/domain";
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
````

### Controller (tRPC Router)

```typescript
// controllers/user-controller.ts
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, createTRPCRouter } from "@repo/frameworks/trpc";
import { CreateUserUseCase } from "@repo/use-cases";
import { PrismaUserRepository } from "../gateways/PrismaUserRepository";

// Input validation schema
const createUserInput = z.object({
  email: z.string().email(),
});

export const userController = createTRPCRouter({
  create: protectedProcedure
    .input(createUserInput)
    .mutation(async ({ ctx, input }) => {
      // Create use case with repository
      const userRepo = new PrismaUserRepository(ctx.prisma);
      const useCase = new CreateUserUseCase(userRepo);

      // Execute use case
      const result = await useCase.execute(input);

      // Handle error
      if (result.isError()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: result.error,
        });
      }

      // Return success
      return result.value;
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const userRepo = new PrismaUserRepository(ctx.prisma);
      const user = await userRepo.findById(input.id);

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      return {
        id: user.id,
        email: user.email.value,
      };
    }),
});
```

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

### ✅ Clean Controller

```typescript
// GOOD: Thin controller delegates to use case
export const goodController = createTRPCRouter({
  create: procedure.mutation(async ({ ctx, input }) => {
    // Only: Input validation (zod)
    // Only: Dependency injection
    const userRepo = new PrismaUserRepository(ctx.prisma);
    const useCase = new CreateUserUseCase(userRepo);

    // Only: Execute and handle result
    const result = await useCase.execute(input);

    if (result.isError()) {
      throw new TRPCError({ code: "BAD_REQUEST", message: result.error });
    }

    return result.value;
  }),
});
```

## References

- [CLAUDE.md](../../CLAUDE.md) - CEK Five Pillars (DDD section)
- [Repository Pattern](https://martinfowler.com/eaaCatalog/repository.html)
- [Data Mapper Pattern](https://martinfowler.com/eaaCatalog/dataMapper.html)
