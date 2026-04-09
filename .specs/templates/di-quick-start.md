# DI Quick Start Cheat Sheet

> **15-minute DI implementation guide for Mirai App**
>
> Copy-paste ready snippets for common scenarios.

---

## 🚀 New Repository in 5 Steps

### Step 1: Create Repository

```typescript
// packages/adapters/src/gateways/PrismaMyEntityRepository.ts
import type { MyEntityRepository } from "@mirai-app/use-cases";

export class PrismaMyEntityRepository implements MyEntityRepository {
  constructor(private prisma: PrismaClient) {}
  // ... implement interface
}
```

### Step 2: Add to RepositoryModule

```typescript
// packages/adapters/src/modules/RepositoryModule.ts

// 1. Add token
export const REPOSITORY_TOKENS = {
  // ... existing tokens
  MyEntityRepository: "myEntityRepository",
} as const;

// 2. Import class
import { PrismaMyEntityRepository } from "../gateways/PrismaMyEntityRepository";

// 3. Register provider
export const RepositoryModule = createStaticModule({
  providers: {
    // ... existing providers
    [REPOSITORY_TOKENS.MyEntityRepository]: PrismaMyEntityRepository,
  },
  exports: [
    // ... existing exports
    REPOSITORY_TOKENS.MyEntityRepository,
  ],
});

// 4. Add to Deps interface
export interface RepositoryModuleDeps {
  // ... existing deps
  [REPOSITORY_TOKENS.MyEntityRepository]: MyEntityRepository;
}

// 5. Re-export
export { PrismaMyEntityRepository } from "../gateways/PrismaMyEntityRepository";
```

### Step 3: Use in Router

```typescript
// apps/backend-server/src/routers/myEntity.ts
export const myEntityRouter = createTRPCRouter({
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const repo =
        ctx.container.resolve<MyEntityRepository>("myEntityRepository");
      return repo.findById(input.id);
    }),
});
```

---

## 🎯 Common Patterns

### Pattern 1: Simple Class Provider

```typescript
providers: {
  myService: MyService, // Auto-injected, singleton by default
}
```

### Pattern 2: Factory Provider

```typescript
providers: {
  myController: {
    factory: (cradle) => new MyController(cradle.myRepository),
    lifetime: Lifetime.SCOPED,
  },
}
```

### Pattern 3: Value Provider

```typescript
providers: {
  config: {
    useValue: { apiUrl: "https://api.example.com" },
  },
}
```

### Pattern 4: Class with Lifetime

```typescript
providers: {
  myRepository: {
    useClass: MyRepository,
    lifetime: Lifetime.SINGLETON,
  },
}
```

---

## 🧪 Testing Patterns

### Mock Repository Test

```typescript
describe("MyUseCase", () => {
  let container: AwilixContainer;

  beforeEach(() => {
    container = createTestContainer();
    container.register({
      myRepository: asClass(InMemoryMyRepository).singleton(),
    });
  });

  it("should work", async () => {
    const useCase = container.resolve(MyUseCase);
    const result = await useCase.execute(input);
    expect(result.isSuccess()).toBe(true);
  });
});
```

### Integration Test with Module

```typescript
describe("Module Integration", () => {
  it("should resolve all services", () => {
    const container = createTestContainerFromModule(MyModule);
    container.register({ prisma: asValue(mockPrisma) });

    const service = container.resolve("myService");
    expect(service).toBeDefined();
  });
});
```

---

## 🔧 Container Operations

### Initialize Container

```typescript
import { initializeContainer, AppModule } from "@mirai-app/frameworks/di";

const container = initializeContainer([AppModule]);
```

### Create Request Scope

```typescript
import { createRequestScope } from "@mirai-app/frameworks/di";

const scope = createRequestScope({
  prisma: db,
  requestId: "req-123",
  userContext: { userId: "u1" },
});
```

### Resolve Services

```typescript
// By string token
const repo = container.resolve<UserRepository>("userRepository");

// By class (if registered as class)
const useCase = container.resolve(GetUserUseCase);
```

### Register Services Manually

```typescript
import { asClass, asValue } from "awilix";

container.register({
  myService: asClass(MyService).singleton(),
  myConfig: asValue({ timeout: 5000 }),
});
```

---

## 📦 Module Template

```typescript
// packages/adapters/src/modules/MyModule.ts
import { createStaticModule, type StaticModule } from "awilix-modular";
import { Lifetime } from "awilix";

// Tokens
export const MY_TOKENS = {
  MyService: "myService",
  MyController: "myController",
} as const;

// Types
export interface MyModuleDeps {
  [MY_TOKENS.MyService]: MyService;
  [MY_TOKENS.MyController]: MyController;
}

// Module
export const MyModule: StaticModule = createStaticModule({
  name: "MyModule",
  imports: [RepositoryModule], // Dependencies
  providers: {
    [MY_TOKENS.MyService]: MyService,
    [MY_TOKENS.MyController]: {
      factory: (cradle) => new MyController(cradle.myService),
      lifetime: Lifetime.SCOPED,
    },
  },
  exports: Object.values(MY_TOKENS),
});

// Re-exports
export { MyService } from "../services/MyService";
export { MyController } from "../controllers/my-controller";
```

---

## ⚡ Quick Fixes

### Fix: "Container not initialized"

```typescript
// Ensure initialization before use
initializeContainer([AppModule]);
```

### Fix: "Service not found"

```typescript
// Check exports
exports: ["myService"]; // Must export!

// Check imports in parent module
imports: [MyModule]; // Must import!
```

### Fix: Type inference not working

```typescript
// Use explicit type
const repo = container.resolve<UserRepository>("userRepository");

// Or use ModuleDeps
class MyService {
  constructor(private deps: RepositoryModuleDeps) {}
}
```

---

## 🔗 Related Documentation

- [Full DI Guide](../../packages/frameworks/src/di/README.md)
- [Migration Guide](./di-migration-guide.md)
- [AGENTS.md](../../AGENTS.md) - DI patterns section
- [CLAUDE.md](../../CLAUDE.md) - Container conventions

---

**Print this page** for quick reference while coding!
