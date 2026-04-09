# Dependency Injection (DI) Cheat Sheet

> **One-page quick reference for awilix-modular DI patterns**
> See full guide: `packages/frameworks/src/di/README.md`

---

## 🚀 Quick Start (New Repository in 4 Steps)

```typescript
// Step 1: Create repository (packages/adapters/src/gateways/)
export class PrismaXRepository implements XRepository {
  constructor(private prisma: PrismaClient) {} // Auto-injected
}

// Step 2: Add to RepositoryModule (packages/adapters/src/modules/RepositoryModule.ts)
export const REPOSITORY_TOKENS = {
  XRepository: "xRepository", // camelCase token
} as const;

export const RepositoryModule = createStaticModule({
  providers: {
    [REPOSITORY_TOKENS.XRepository]: {
      factory: (cradle) => new PrismaXRepository(cradle.prisma),
      lifetime: Lifetime.SINGLETON,
    },
  },
  exports: [REPOSITORY_TOKENS.XRepository],
});

// Step 3: Update interface
export interface RepositoryModuleDeps {
  [REPOSITORY_TOKENS.XRepository]: XRepository;
}

// Step 4: Use in router (apps/backend-server/src/routers/x.ts)
const controller = ctx.container.resolve("xController");
```

---

## 📦 Module Pattern

```typescript
// packages/adapters/src/modules/XxxModule.ts
import { createStaticModule, type StaticModule } from "awilix-modular";
import { Lifetime } from "awilix";

export const XXX_TOKENS = {
  XService: "xService", // Use camelCase for tokens
} as const;

export const XxxModule: StaticModule = createStaticModule({
  name: "XxxModule",
  imports: [DependencyModule], // Import other modules here
  providers: {
    [XXX_TOKENS.XService]: {
      factory: (cradle) => new XService(cradle.dependency),
      lifetime: Lifetime.SINGLETON, // or SCOPED, TRANSIENT
    },
  },
  exports: [XXX_TOKENS.XService], // MUST export to make available
});

export interface XxxModuleDeps {
  [XXX_TOKENS.XService]: XService;
}
```

---

## 🔧 Container Resolution

| Where        | Code Pattern                     | Scope             |
| ------------ | -------------------------------- | ----------------- |
| **Router**   | `ctx.container.resolve("token")` | Request-scoped    |
| **Test**     | `container.resolve("token")`     | Isolated          |
| **Use Case** | Auto-injected via constructor    | Depends on config |

```typescript
// Router usage
export const userRouter = createTRPCRouter({
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const controller = ctx.container.resolve("userController");
      return controller.getById(input);
    }),
});
```

---

## 🧪 Testing with Container

```typescript
import { describe, it, expect, beforeEach } from "bun:test";
import { createContainer, asClass } from "awilix";
import { InMemoryXRepository } from "./mocks/InMemoryXRepository";

describe("XUseCase", () => {
  let container: AwilixContainer;

  beforeEach(() => {
    container = createContainer();
    // Override with mock
    container.register({
      xRepository: asClass(InMemoryXRepository).singleton(),
    });
  });

  it("should work", async () => {
    const useCase = container.resolve(CreateXUseCase);
    const result = await useCase.execute({ name: "Test" });
    expect(result.isSuccess()).toBe(true);
  });
});
```

---

## ⚡ Lifetime Scopes

| Scope         | Use For                                       | Example                |
| ------------- | --------------------------------------------- | ---------------------- |
| **SINGLETON** | Stateless services, repos, DB connections     | `PrismaUserRepository` |
| **SCOPED**    | Request-scoped logic (controllers, use cases) | `UserController`       |
| **TRANSIENT** | Factories, utilities                          | `IdGenerator`          |

```typescript
// Repository: Singleton (stateless, expensive to create)
providers: {
  userRepository: {
    factory: (cradle) => new PrismaUserRepository(cradle.prisma),
    lifetime: Lifetime.SINGLETON,
  },
}

// Controller: Scoped (per-request)
providers: {
  userController: {
    factory: (cradle) => new UserController(cradle.userRepository),
    lifetime: Lifetime.SCOPED,
  },
}
```

---

## ❓ When to Use @Module() vs Manual

| Scenario                               | Pattern                              | Example            |
| -------------------------------------- | ------------------------------------ | ------------------ |
| **New Repository/Controller/Use Case** | `@Module()` / `createStaticModule()` | Standard DI        |
| **One-off utility in test**            | Manual `container.register()`        | Mock injection     |
| **Temporary workaround**               | Manual instantiation                 | ⚠️ Deprecate after |

---

## 🆘 Troubleshooting Checklist

| Error                        | Solution                                                 |
| ---------------------------- | -------------------------------------------------------- |
| `Container not initialized`  | Call `initializeContainer([AppModule])` first            |
| `Service not found`          | Check `exports` array includes the token                 |
| `Dependency not found`       | Check parent module `imports` includes dependency module |
| `Type inference not working` | Use explicit type: `container.resolve<Repo>("token")`    |
| `Circular dependency`        | Redesign - ensure unidirectional flow                    |
| `Tests failing with DI`      | Use `asClass(MockRepo).singleton()` in test setup        |

---

## 🎯 Key Benefits (Remember These!)

1. **✅ No tsconfig changes needed** - Works with existing TypeScript config
2. **✅ No decorators required** - No `@injectable`, `@inject` annotations
3. **✅ Automatic type inference** - No manual service identifiers
4. **✅ Request-scoped support** - Clean transaction boundaries
5. **✅ Easy testing** - Swap implementations at module level

---

## 📚 Module Hierarchy

```
AppModule (root)
├── RepositoryModule (16 repos)
│   ├── PrismaUserRepository
│   ├── PrismaChallengeRepository
│   └── ...
├── UseCaseModule (73 use cases)
│   ├── GetUserUseCase
│   ├── CreateChallengeUseCase
│   └── ...
└── ControllerModule (17 controllers)
    ├── UserController
    ├── ChallengeController
    └── ...
```

---

## 📝 Token Naming Convention

| Component  | Token Format    | Example               |
| ---------- | --------------- | --------------------- |
| Repository | `xxxRepository` | `userRepository`      |
| Use Case   | `xxxUseCase`    | `getUserUseCase`      |
| Controller | `xxxController` | `userController`      |
| Service    | `xxxService`    | `notificationService` |

**Rule:** Use camelCase, descriptive, suffix matches component type.

---

## 🔄 Migration Pattern (Before → After)

```typescript
// BEFORE: Manual instantiation
.query(async ({ ctx, input }) => {
  const repo = new PrismaUserRepository(ctx.db);
  const controller = new UserController(repo);
  return controller.getById(input);
})

// AFTER: Container resolution
.query(async ({ ctx, input }) => {
  const controller = ctx.container.resolve("userController");
  return controller.getById(input);
})
```

**Result:** -3 lines per procedure, consistent pattern, easier testing.

---

## 🆘 Need Help?

- 📖 Full Guide: `packages/frameworks/src/di/README.md`
- ❓ FAQ: `.specs/templates/di-faq.md`
- 🧪 Exercise: `.specs/templates/di-exercise.md`
- 🔧 Support: See `.specs/templates/di-support-guide.md`

---

_Last Updated: 2026-04-09 | awilix-modular v1.x_
