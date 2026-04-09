# DI Migration Guide

> **Migrate from manual instantiation to container-based DI**
>
> Step-by-step guide for migrating existing code to use awilix-modular.

---

## Migration Overview

### Before (Manual Instantiation)

```typescript
// apps/backend-server/src/routers/user.ts
export const userRouter = createTRPCRouter({
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      // Manual instantiation in every procedure
      const repo = new PrismaUserRepository(ctx.db);
      const controller = new UserController(repo);
      const useCase = new GetUserUseCase(repo);
      const result = await useCase.execute(input);
      return result;
    }),

  create: protectedProcedure
    .input(CreateUserInput.schema)
    .mutation(async ({ ctx, input }) => {
      // Repeated boilerplate
      const repo = new PrismaUserRepository(ctx.db);
      const controller = new UserController(repo);
      // ... more code
    }),
});
```

**Problems:**

- ❌ Boilerplate repeated in every procedure
- ❌ Hard to test (must mock constructor calls)
- ❌ No centralized dependency management
- ❌ Repository lifecycle not controlled

### After (Container-Based DI)

```typescript
// apps/backend-server/src/routers/user.ts
export const userRouter = createTRPCRouter({
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      // Single line to resolve controller with all dependencies
      const controller = ctx.container.resolve("userController");
      return controller.getById(input);
    }),

  create: protectedProcedure
    .input(CreateUserInput.schema)
    .mutation(async ({ ctx, input }) => {
      const controller = ctx.container.resolve("userController");
      const result = await controller.create(input);
      // ... handle result
    }),
});
```

**Benefits:**

- ✅ No boilerplate
- ✅ Easy to test (swap implementations at module level)
- ✅ Centralized dependency management
- ✅ Proper lifecycle control (singleton/scoped/transient)

---

## Migration Steps

### Step 1: Prepare the Container (Done Once)

If not already done, ensure container setup exists:

```typescript
// packages/frameworks/src/di/container.ts
import { createContainer, asClass, asValue, Lifetime } from "awilix";
import { createStaticModule } from "awilix-modular";

export function initializeContainer(modules: StaticModule[]) {
  const container = createContainer({ injectionMode: "PROXY" });

  for (const mod of modules) {
    // Register module providers
    for (const [key, provider] of Object.entries(mod.providers || {})) {
      if (typeof provider === "function") {
        container.register(key, asClass(provider).singleton());
      }
    }
  }

  return container;
}
```

### Step 2: Create or Update RepositoryModule

```typescript
// packages/adapters/src/modules/RepositoryModule.ts
import { createStaticModule, type StaticModule } from "awilix-modular";
import { PrismaUserRepository } from "../gateways/PrismaUserRepository";

export const REPOSITORY_TOKENS = {
  UserRepository: "userRepository",
} as const;

export const RepositoryModule: StaticModule = createStaticModule({
  name: "RepositoryModule",
  providers: {
    [REPOSITORY_TOKENS.UserRepository]: PrismaUserRepository,
  },
  exports: [REPOSITORY_TOKENS.UserRepository],
});

export interface RepositoryModuleDeps {
  [REPOSITORY_TOKENS.UserRepository]: UserRepository;
  prisma: PrismaClient;
}
```

### Step 3: Update Repository Constructor (if needed)

Ensure repository accepts `PrismaClient` via constructor:

```typescript
// packages/adapters/src/gateways/PrismaUserRepository.ts
export class PrismaUserRepository implements UserRepository {
  // Constructor must accept prisma as parameter
  constructor(private prisma: PrismaClient) {}

  // Methods use this.prisma
  async findById(id: string): Promise<User | null> {
    const record = await this.prisma.user.findUnique({ where: { id } });
    return record ? UserMapper.toDomain(record) : null;
  }
}
```

### Step 4: Create or Update ControllerModule

```typescript
// packages/adapters/src/modules/ControllerModule.ts
import { createStaticModule, type StaticModule } from "awilix-modular";
import { Lifetime } from "awilix";
import { UserController } from "../controllers/user-controller";
import { RepositoryModule } from "./RepositoryModule";

export const CONTROLLER_TOKENS = {
  UserController: "userController",
} as const;

export const ControllerModule: StaticModule = createStaticModule({
  name: "ControllerModule",
  imports: [RepositoryModule], // Repositories available via cradle
  providers: {
    [CONTROLLER_TOKENS.UserController]: {
      factory: (cradle) => new UserController(cradle.userRepository),
      lifetime: Lifetime.SCOPED,
    },
  },
  exports: [CONTROLLER_TOKENS.UserController],
});
```

### Step 5: Register Modules in AppModule

```typescript
// packages/frameworks/src/di/AppModule.ts
import { createStaticModule } from "awilix-modular";
import { RepositoryModule } from "@mirai-app/adapters/modules/RepositoryModule";
import { ControllerModule } from "@mirai-app/adapters/modules/ControllerModule";

export const AppModule = createStaticModule({
  name: "AppModule",
  imports: [
    RepositoryModule, // Step 2
    ControllerModule, // Step 4
  ],
  providers: {},
  exports: [],
});
```

### Step 6: Update tRPC Context

```typescript
// packages/frameworks/src/trpc/server.ts
import { createRequestScope } from "@mirai-app/frameworks/di";

export const createTRPCContext = async (opts: CreateNextContextOptions) => {
  const { db, supabase } = await createContextData(opts);

  // Create request-scoped container
  const scope = createRequestScope({
    prisma: db,
    requestId: generateRequestId(),
  });

  return {
    db,
    supabase,
    container: scope.container, // Now available in all procedures
  };
};
```

### Step 7: Migrate Router Procedures

**Before:**

```typescript
.query(async ({ ctx, input }) => {
  const repo = new PrismaUserRepository(ctx.db);
  const controller = new UserController(repo);
  return controller.getById(input);
})
```

**After:**

```typescript
.query(async ({ ctx, input }) => {
  const controller = ctx.container.resolve("userController");
  return controller.getById(input);
})
```

---

## Migration Examples by Component Type

### Example 1: Simple Router (3 procedures)

**Before:**

```typescript
export const userRouter = createTRPCRouter({
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const repo = new PrismaUserRepository(ctx.db);
      return repo.findById(input.id);
    }),

  getByEmail: protectedProcedure
    .input(z.object({ email: z.string() }))
    .query(async ({ ctx, input }) => {
      const repo = new PrismaUserRepository(ctx.db);
      return repo.findByEmail(input.email);
    }),

  create: protectedProcedure
    .input(CreateUserInput.schema)
    .mutation(async ({ ctx, input }) => {
      const repo = new PrismaUserRepository(ctx.db);
      const useCase = new CreateUserUseCase(repo);
      return useCase.execute(input);
    }),
});
```

**After:**

```typescript
export const userRouter = createTRPCRouter({
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const repo = ctx.container.resolve<UserRepository>("userRepository");
      return repo.findById(input.id);
    }),

  getByEmail: protectedProcedure
    .input(z.object({ email: z.string() }))
    .query(async ({ ctx, input }) => {
      const repo = ctx.container.resolve<UserRepository>("userRepository");
      return repo.findByEmail(input.email);
    }),

  create: protectedProcedure
    .input(CreateUserInput.schema)
    .mutation(async ({ ctx, input }) => {
      const controller = ctx.container.resolve("userController");
      return controller.create(input);
    }),
});
```

**Lines of boilerplate removed:** 6 (2 lines per procedure × 3 procedures)

### Example 2: Complex Controller with Multiple Dependencies

**Before:**

```typescript
// Controller creates its own dependencies
class RewardController {
  constructor(private prisma: PrismaClient) {}

  async createReward(input: CreateRewardInput) {
    const repo = new PrismaRewardRepository(this.prisma);
    const purchaseRepo = new PrismaRewardPurchaseRepository(this.prisma);
    const pointsCalc = new TripPointsCalculator();
    const coinsService = new GroupCoinsService();
    const accessChecker = new TripAccessChecker();

    const useCase = new CreateRewardUseCase(
      repo,
      purchaseRepo,
      pointsCalc,
      coinsService,
      accessChecker,
    );

    return useCase.execute(input);
  }
}
```

**After:**

```typescript
// Controller receives pre-configured dependencies
class RewardController {
  constructor(
    private rewardRepository: RewardRepository,
    private purchaseRepository: RewardPurchaseRepository,
    private pointsCalculator: TripPointsCalculator,
    private coinsService: GroupCoinsService,
    private accessChecker: TripAccessChecker,
  ) {}

  async createReward(input: CreateRewardInput) {
    // Dependencies already injected
    const useCase = new CreateRewardUseCase(
      this.rewardRepository,
      this.purchaseRepository,
      this.pointsCalculator,
      this.coinsService,
      this.accessChecker,
    );

    return useCase.execute(input);
  }
}

// In ControllerModule
providers: {
  rewardController: {
    factory: (cradle) => new RewardController(
      cradle.rewardRepository,
      cradle.rewardPurchaseRepository,
      cradle.tripPointsCalculator,
      cradle.groupCoinsService,
      cradle.tripAccessChecker,
    ),
    lifetime: Lifetime.SCOPED,
  },
}
```

### Example 3: Test Migration

**Before:**

```typescript
describe("GetUserUseCase", () => {
  it("should return user", async () => {
    // Manual mocking
    const mockRepo: UserRepository = {
      findById: mock(() => Promise.resolve(mockUser)),
      findByEmail: mock(() => Promise.resolve(null)),
      create: mock(() => Promise.resolve(mockUser)),
      // ... must mock ALL methods
    };

    const useCase = new GetUserUseCase(mockRepo);
    const result = await useCase.execute({ userId: "123" });

    expect(result.isSuccess()).toBe(true);
  });
});
```

**After:**

```typescript
describe("GetUserUseCase", () => {
  let container: AwilixContainer;

  beforeEach(() => {
    container = createTestContainer();
    container.register({
      userRepository: asClass(InMemoryUserRepository).singleton(),
    });
  });

  it("should return user", async () => {
    // Seed mock data
    const mockRepo = container.resolve<UserRepository>("userRepository");
    await mockRepo.seed(mockUser);

    // Use case resolves with dependencies auto-wired
    const useCase = container.resolve(GetUserUseCase);
    const result = await useCase.execute({ userId: "123" });

    expect(result.isSuccess()).toBe(true);
  });
});
```

---

## Testing Migrated Code

### Strategy 1: Keep Existing Tests (Backward Compatibility)

Existing tests using manual instantiation continue to work:

```typescript
// Old test still works
const repo = new PrismaUserRepository(mockPrisma);
const useCase = new GetUserUseCase(repo);
```

### Strategy 2: Migrate Tests to Container

```typescript
// New test with container
const container = createTestContainer();
container.register({
  prisma: asValue(mockPrisma),
  userRepository: asClass(PrismaUserRepository).singleton(),
});

const useCase = container.resolve(GetUserUseCase);
```

### Strategy 3: Hybrid Approach

Use container for integration tests, manual instantiation for unit tests:

```typescript
// Unit test - manual (fast, isolated)
describe("[UNIT] User entity", () => {
  /* ... */
});

// Integration test - container (real wiring)
describe("[INTEGRATION] User repository", () => {
  /* ... */
});
```

---

## Common Migration Issues & Solutions

### Issue 1: Constructor Signature Changes

**Problem:** Repository previously created PrismaClient internally

```typescript
// Before
class PrismaUserRepository {
  private prisma = new PrismaClient(); // Internal creation
}
```

**Solution:** Accept via constructor

```typescript
// After
class PrismaUserRepository {
  constructor(private prisma: PrismaClient) {}
}
```

### Issue 2: Static Methods vs Instance Methods

**Problem:** Controller methods are static

```typescript
// Before
class UserController {
  static async getById(id: string) {
    const repo = new PrismaUserRepository(prisma);
    return repo.findById(id);
  }
}
```

**Solution:** Convert to instance methods with injected dependencies

```typescript
// After
class UserController {
  constructor(private userRepository: UserRepository) {}

  async getById(id: string) {
    return this.userRepository.findById(id);
  }
}
```

### Issue 3: Circular Dependencies

**Problem:** Module A depends on B, B depends on A

**Solution:** Use lazy loading with function

```typescript
export const ModuleA = createStaticModule({
  name: "ModuleA",
  imports: [
    () => ModuleB, // Lazy reference
  ],
});

export const ModuleB = createStaticModule({
  name: "ModuleB",
  imports: [ModuleA], // Direct is fine
});
```

### Issue 4: Type Errors After Migration

**Problem:** TypeScript errors when resolving from container

**Solution:** Add explicit types

```typescript
// Add type annotation
const repo = container.resolve<UserRepository>("userRepository");

// Or use ModuleDeps interface
class MyService {
  constructor(private deps: RepositoryModuleDeps) {}
}
```

---

## Migration Checklist

Use this checklist when migrating each router:

- [ ] RepositoryModule updated with new repository
- [ ] ControllerModule updated with new controller
- [ ] AppModule imports both modules
- [ ] Repository constructor accepts PrismaClient
- [ ] Controller constructor accepts dependencies
- [ ] tRPC context includes container
- [ ] Router procedures use `ctx.container.resolve()`
- [ ] Tests updated (or still work with manual instantiation)
- [ ] Manual instantiation code removed from router
- [ ] Verify all endpoints work
- [ ] Run test suite

---

## Migration Timeline Estimates

| Component Type                           | Files to Update | Time Estimate |
| ---------------------------------------- | --------------- | ------------- |
| Simple Router (1-2 deps)                 | 3-4 files       | 15-30 min     |
| Medium Router (3-5 deps)                 | 4-6 files       | 30-60 min     |
| Complex Router (6+ deps)                 | 6-8 files       | 1-2 hours     |
| Repository only                          | 2-3 files       | 10-15 min     |
| Full domain (repo + controller + router) | 6-10 files      | 1-3 hours     |

---

## Success Metrics

After migration, you should see:

| Metric                          | Before   | After   | Target |
| ------------------------------- | -------- | ------- | ------ |
| Boilerplate lines per procedure | 2-5      | 1       | ✅     |
| Time to add new dependency      | 5-10 min | 2-3 min | ✅     |
| Test setup complexity           | High     | Low     | ✅     |
| Dependency lifecycle control    | None     | Full    | ✅     |

---

## Rollback Plan

If issues arise:

1. **Revert to manual instantiation** in router (keep modules)
2. **Debug module configuration** separately
3. **Re-enable** container resolution when ready

```typescript
// Temporary rollback
.query(async ({ ctx, input }) => {
  // Comment out container resolution
  // const controller = ctx.container.resolve("userController");

  // Use manual instantiation temporarily
  const repo = new PrismaUserRepository(ctx.db);
  const controller = new UserController(repo);
  return controller.getById(input);
})
```

---

## Summary

Migrating to awilix-modular:

1. **Setup:** Create/update RepositoryModule and ControllerModule
2. **Register:** Add modules to AppModule
3. **Context:** Update tRPC context with container
4. **Migrate:** Replace manual instantiation with `ctx.container.resolve()`
5. **Test:** Verify existing tests pass, add container-based tests

**No tsconfig changes required. No breaking API changes. Gradual migration supported.**

---

**Related Documentation:**

- [DI Quick Start](./di-quick-start.md)
- [Full DI Guide](../../packages/frameworks/src/di/README.md)
- [AGENTS.md](../../AGENTS.md)
- [CLAUDE.md](../../CLAUDE.md)

---

**Last Updated:** 2026-04-09
**Version:** 1.0.0
