# awilix-modular Dependency Injection Guide

> **Quick start guide for implementing DI in Mirai App**
>
> With awilix-modular, you can implement dependency injection in **under 15 minutes** with **zero tsconfig changes**.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Why awilix-modular?](#why-awilix-modular)
3. [Core Concepts](#core-concepts)
4. [Creating Modules](#creating-modules)
5. [Using the Container](#using-the-container)
6. [Scope Strategy](#scope-strategy)
7. [Testing with DI](#testing-with-di)
8. [Troubleshooting](#troubleshooting)
9. [Best Practices](#best-practices)

---

## Quick Start

### 1. Create a Module (2 minutes)

```typescript
// packages/adapters/src/modules/MyFeatureModule.ts
import { createStaticModule } from "awilix-modular";
import { MyRepository } from "../gateways/MyRepository";
import { MyController } from "../controllers/my-controller";

export const MyFeatureModule = createStaticModule({
  name: "MyFeatureModule",
  providers: {
    myRepository: MyRepository,
    myController: {
      factory: (cradle) => new MyController(cradle.myRepository),
      lifetime: Lifetime.SCOPED,
    },
  },
  exports: ["myRepository", "myController"],
});
```

### 2. Register in AppModule (2 minutes)

```typescript
// packages/frameworks/src/di/AppModule.ts
import { MyFeatureModule } from "@mirai-app/adapters/modules/MyFeatureModule";

export const AppModule = createStaticModule({
  name: "AppModule",
  imports: [
    RepositoryModule,
    // ... other modules
    MyFeatureModule, // Add your module
  ],
  providers: {},
  exports: [],
});
```

### 3. Use in Router (1 minute)

```typescript
// apps/backend-server/src/routers/myFeature.ts
export const myFeatureRouter = createTRPCRouter({
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      // Resolve controller from container
      const controller = ctx.container.resolve("myController");
      return controller.getById(input);
    }),
});
```

**Done!** Constructor-based DI, no DI-specific tsconfig changes.

---

## Why awilix-modular?

### Historical Migration Note

The repository now standardizes on awilix-modular with constructor-based DI and static module registration via `createStaticModule()`.

### Key Benefits

1. **No DI-Specific TypeScript Configuration Changes**

   ```json
   // Your existing tsconfig.json works as-is
   {
     "compilerOptions": {
       // No DI-specific compiler flags needed
     }
   }
   ```

2. **Automatic Type Inference**

   ```typescript
   // No manual service identifiers needed
   const repo = container.resolve("userRepository"); // TypeScript knows the type!
   ```

3. **Module-Based Organization**
   ```typescript
   // NestJS-like module structure
   createStaticModule({
     name: "MyModule",
     imports: [OtherModule], // Import other modules
     providers: {
       /* ... */
     }, // Define providers
     exports: ["serviceName"], // Export for other modules
   });
   ```

---

## Core Concepts

### Container Hierarchy

```
┌─────────────────────────────────────┐
│         Root Container              │
│  - Singleton services               │
│  - Shared configuration             │
└──────────────┬──────────────────────┘
               │
       ┌───────┴───────┐
       │               │
┌──────▼──────┐ ┌──────▼──────┐
│  Request 1  │ │  Request 2  │
│   Scope     │ │   Scope     │
│ (Prisma)    │ │ (Prisma)    │
└─────────────┘ └─────────────┘
```

### The Cradle

Awilix uses a "cradle" pattern for dependency resolution:

```typescript
// Container provides a "cradle" with all registered dependencies
function createMyController(cradle: Cradle): MyController {
  // Access any registered dependency by name
  return new MyController(
    cradle.userRepository,
    cradle.logger, // Other dependencies auto-available
  );
}
```

### Module Structure

```typescript
export const MyModule = createStaticModule({
  // Module identifier
  name: "MyModule",

  // Import other modules (their exports become available)
  imports: [RepositoryModule, OtherModule],

  // Define providers
  providers: {
    // Class provider (auto-injected)
    myRepository: MyRepository,

    // Factory provider (custom construction)
    myController: {
      factory: (cradle) => new MyController(cradle.myRepository),
      lifetime: Lifetime.SCOPED,
    },

    // Value provider (static value)
    config: {
      useValue: { apiUrl: "https://api.example.com" },
    },
  },

  // Export these providers for other modules to use
  exports: ["myRepository", "myController"],
});
```

---

## Creating Modules

### Repository Module Pattern

```typescript
// packages/adapters/src/modules/RepositoryModule.ts
import { createStaticModule, type StaticModule } from "awilix-modular";
import { PrismaUserRepository } from "../gateways/PrismaUserRepository";

// Define injection tokens
export const REPOSITORY_TOKENS = {
  UserRepository: "userRepository",
  TripRepository: "tripRepository",
} as const;

// Create module
export const RepositoryModule: StaticModule = createStaticModule({
  name: "RepositoryModule",

  providers: {
    // Direct class registration (simplest)
    [REPOSITORY_TOKENS.UserRepository]: PrismaUserRepository,

    // Factory registration (when you need custom construction)
    [REPOSITORY_TOKENS.TripRepository]: {
      factory: (cradle) => new PrismaTripRepository(cradle.prisma),
      lifetime: Lifetime.SINGLETON,
    },
  },

  exports: [REPOSITORY_TOKENS.UserRepository, REPOSITORY_TOKENS.TripRepository],
});

// Export type for dependency injection
export interface RepositoryModuleDeps {
  [REPOSITORY_TOKENS.UserRepository]: UserRepository;
  [REPOSITORY_TOKENS.TripRepository]: TripRepository;
  prisma: PrismaClient;
}
```

### Controller Module Pattern

```typescript
// packages/adapters/src/modules/ControllerModule.ts
import { createStaticModule, type StaticModule } from "awilix-modular";
import { Lifetime } from "awilix";
import { UserController } from "../controllers/user-controller";

export const CONTROLLER_TOKENS = {
  UserController: "userController",
} as const;

export const ControllerModule: StaticModule = createStaticModule({
  name: "ControllerModule",

  imports: [RepositoryModule], // Repositories available via cradle

  providers: {
    [CONTROLLER_TOKENS.UserController]: {
      // Factory pattern for complex construction
      factory: (cradle) => new UserController(cradle.userRepository),
      lifetime: Lifetime.SCOPED, // New instance per request
    },
  },

  exports: [CONTROLLER_TOKENS.UserController],
});
```

---

## Using the Container

### In tRPC Context

```typescript
// packages/frameworks/src/trpc/server.ts
export const createTRPCContext = async (opts: CreateNextContextOptions) => {
  const { db, supabase } = await createContextData(opts);

  // Create request-scoped container
  const scope = createRequestScope({
    prisma: db,
    requestId: generateRequestId(),
    userContext: opts.user,
  });

  return {
    db,
    supabase,
    container: scope.container, // Available in all procedures
  };
};
```

### In tRPC Procedures

```typescript
// apps/backend-server/src/routers/user.ts
export const userRouter = createTRPCRouter({
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      // Resolve controller from request-scoped container
      const controller = ctx.container.resolve("userController");
      return controller.getById(input);
    }),

  create: protectedProcedure
    .input(CreateUserInput.schema)
    .mutation(async ({ ctx, input }) => {
      const controller = ctx.container.resolve("userController");
      const result = await controller.create(input);

      if (result.isError()) {
        throw new TRPCError({ code: "BAD_REQUEST", message: result.error });
      }

      return result.value;
    }),
});
```

### Direct Container Access

```typescript
import { container } from "@mirai-app/frameworks/di";

// Only use in non-request contexts (background jobs, etc.)
const userRepo = container.resolve("userRepository");
```

---

## Scope Strategy

### Lifetime Scopes

| Scope         | Use For                   | Example                |
| ------------- | ------------------------- | ---------------------- |
| **SINGLETON** | Shared stateless services | Repositories, services |
| **SCOPED**    | Request-scoped instances  | Controllers, use cases |
| **TRANSIENT** | New instance every time   | Factories, utilities   |

### Singleton (Default for Repositories)

```typescript
// Repositories are stateless and thread-safe
export const RepositoryModule = createStaticModule({
  name: "RepositoryModule",
  providers: {
    userRepository: {
      factory: (cradle) => new PrismaUserRepository(cradle.prisma),
      lifetime: Lifetime.SINGLETON, // One instance for entire app
    },
  },
});
```

**Why singleton?**

- Repositories are stateless
- PrismaClient handles connection pooling internally
- Thread-safe for concurrent requests
- No per-request state

### Scoped (Default for Controllers)

```typescript
// Controllers may have request-specific state
export const ControllerModule = createStaticModule({
  name: "ControllerModule",
  providers: {
    userController: {
      factory: (cradle) => new UserController(cradle.userRepository),
      lifetime: Lifetime.SCOPED, // New instance per request
    },
  },
});
```

**Why scoped?**

- Controllers can access request context
- Isolation between requests
- Resource cleanup per request

### Request Scope Creation

```typescript
import { createRequestScope } from "@mirai-app/frameworks/di";

// In tRPC context creation
const scope = createRequestScope({
  prisma: db, // Request-scoped PrismaClient
  requestId: "req-123", // Request tracking
  userContext: { userId: "u1" }, // Authenticated user
});

// All resolved services get the request context
const controller = scope.container.resolve("userController");
```

---

## Testing with DI

### Unit Test with Container

```typescript
import { describe, it, expect, beforeEach } from "bun:test";
import { createTestContainer } from "@mirai-app/frameworks/di";
import { asClass } from "awilix";
import { InMemoryUserRepository } from "./mocks/InMemoryUserRepository";
import { GetUserUseCase } from "@mirai-app/use-cases";

describe("GetUserUseCase", () => {
  let container: AwilixContainer;

  beforeEach(() => {
    container = createTestContainer();

    // Override with mock implementation
    container.register({
      userRepository: asClass(InMemoryUserRepository).singleton(),
    });
  });

  it("should return user when exists", async () => {
    // Arrange: Seed mock data
    const mockRepo = container.resolve("userRepository");
    await mockRepo.seed({ id: "123", email: "test@example.com" });

    // Act: Resolve use case with mocked dependencies
    const useCase = container.resolve(GetUserUseCase);
    const result = await useCase.execute({ userId: "123" });

    // Assert
    expect(result.isSuccess()).toBe(true);
    expect(result.value.id).toBe("123");
  });
});
```

### Integration Test with Real Module

```typescript
import { describe, it, expect } from "bun:test";
import { createTestContainerFromModule } from "@mirai-app/frameworks/di";
import { RepositoryModule } from "@mirai-app/adapters/modules/RepositoryModule";
import { mockPrisma } from "./mocks/mockPrisma";

describe("RepositoryModule Integration", () => {
  it("should resolve all repositories", () => {
    const container = createTestContainerFromModule(RepositoryModule);

    // Override PrismaClient with mock
    container.register({
      prisma: asValue(mockPrisma),
    });

    // Resolve repositories - all should work
    const userRepo = container.resolve("userRepository");
    const tripRepo = container.resolve("tripRepository");

    expect(userRepo).toBeDefined();
    expect(tripRepo).toBeDefined();
  });
});
```

### Mock Repository Pattern

```typescript
// test/mocks/InMemoryUserRepository.ts
export class InMemoryUserRepository implements UserRepository {
  private users: User[] = [];

  async seed(user: User): Promise<void> {
    this.users.push(user);
  }

  async findById(id: string): Promise<User | null> {
    return this.users.find((u) => u.id === id) ?? null;
  }

  // ... other methods
}
```

---

## Troubleshooting

### Issue 1: "Container not initialized" Error

**Symptom:**

```
Error: Container not initialized. Call initializeContainer() first.
```

**Solution:**

```typescript
// Before using container, ensure initialization
import { initializeContainer, AppModule } from "@mirai-app/frameworks/di";

// In your app entry point
initializeContainer([AppModule]);

// Now container is ready
const service = container.resolve("myService");
```

### Issue 2: "Cannot find module" When Importing awilix-modular

**Symptom:**

```
Module not found: Cannot find module 'awilix-modular'
```

**Solution:**

```bash
# Install dependencies
bun add awilix awilix-modular

# Verify in package.json
{
  "dependencies": {
    "awilix": "^12.0.0",
    "awilix-modular": "^1.0.0"
  }
}
```

### Issue 3: Repository Not Receiving PrismaClient

**Symptom:** Repository methods fail because `this.prisma` is undefined

**Solution:**

```typescript
// Check your module factory function
function createUserRepository(cradle: Cradle) {
  // Must access 'prisma' from cradle
  return new PrismaUserRepository(cradle.prisma);
}

// Ensure prisma is registered in parent container
const scope = createRequestScope({
  prisma: db, // This registers 'prisma' in the container
});
```

### Issue 4: TypeScript Can't Infer Resolved Type

**Symptom:**

```typescript
const repo = container.resolve("userRepository"); // Type is 'any'
```

**Solution:**

```typescript
// Use explicit type annotation
import type { UserRepository } from "@mirai-app/use-cases";

const repo = container.resolve<UserRepository>("userRepository");

// Or use the ModuleDeps interface
import type { RepositoryModuleDeps } from "@mirai-app/adapters/modules/RepositoryModule";

class MyService {
  constructor(private deps: RepositoryModuleDeps) {}
  // deps.userRepository is fully typed!
}
```

### Issue 5: Circular Dependency Error

**Symptom:**

```
Error: Circular dependency detected: A -> B -> A
```

**Solution:**

```typescript
// Break circularity with forward reference
import { createStaticModule } from "awilix-modular";

export const ModuleA = createStaticModule({
  name: "ModuleA",
  imports: [
    // Use lazy loading for circular deps
    () => ModuleB,
  ],
});

export const ModuleB = createStaticModule({
  name: "ModuleB",
  imports: [ModuleA], // Direct import is fine
});
```

### Issue 6: Service Not Found Despite Being Registered

**Symptom:**

```
Error: Could not resolve 'myService'
```

**Solution:**

```typescript
// Check exports array
export const MyModule = createStaticModule({
  name: "MyModule",
  providers: {
    myService: MyService, // Registered
  },
  exports: ["myService"], // Must be exported to be accessible!
});

// Check parent module imports
export const AppModule = createStaticModule({
  name: "AppModule",
  imports: [
    MyModule, // Must import the module
  ],
});
```

---

## Best Practices

### 1. Use Consistent Naming

```typescript
// Use camelCase for tokens
export const REPOSITORY_TOKENS = {
  UserRepository: "userRepository",
  TripRepository: "tripRepository",
};

// Match class name but lowercase first letter
// UserRepository -> userRepository
```

### 2. Export Module Dependencies Types

```typescript
// Always export the Deps interface for injection
export interface RepositoryModuleDeps {
  [REPOSITORY_TOKENS.UserRepository]: UserRepository;
  prisma: PrismaClient;
}

// Usage in service
class MyService {
  constructor(private deps: RepositoryModuleDeps) {}
}
```

### 3. Use Factory Pattern for Complex Dependencies

```typescript
// Good: Factory with explicit dependencies
providers: {
  rewardController: {
    factory: (cradle) => new RewardController(
      cradle.rewardRepository,
      cradle.purchaseRepository,
      cradle.pointsCalculator,
    ),
    lifetime: Lifetime.SCOPED,
  },
}

// Avoid: Direct class registration with many deps
providers: {
  // Don't do this for complex constructors
  rewardController: RewardController, // Auto-injection might fail
}
```

### 4. Prefer Request Scope for HTTP Context

```typescript
// Good: Request-scoped with context
const scope = createRequestScope({
  prisma: db,
  requestId,
  userContext,
});

const controller = scope.container.resolve("userController");

// Avoid: Using root container directly in requests
const controller = container.resolve("userController"); // May not have request context
```

### 5. Document Module Dependencies

```typescript
/**
 * ControllerModule - API Layer Module
 *
 * ## Dependencies
 * - RepositoryModule (userRepository, tripRepository, etc.)
 * - FrameworkModule (supabase)
 *
 * ## Controllers (17 total)
 * | Token | Class | Dependencies |
 * |-------|-------|--------------|
 * | userController | UserController | userRepository |
 * | tripController | TripController | tripRepository |
 */
export const ControllerModule = createStaticModule({
  // ...
});
```

---

## Summary

awilix-modular provides a clean, annotation-free approach to dependency injection that:

1. ✅ **Requires no tsconfig changes**
2. ✅ **Has automatic type inference**
3. ✅ **Supports modular organization**
4. ✅ **Enables easy testing**
5. ✅ **Is framework-agnostic**

### Historical Comparison

The Mirai App previously evaluated decorator-based DI patterns. The current awilix-modular approach was chosen specifically to eliminate:

- **No decorators needed** - `@injectable`, `@inject`, `@provide` not required
- **No reflect-metadata** - No runtime metadata emission
- **No tsconfig changes** - No `experimentalDecorators` or `emitDecoratorMetadata`
- **No decorator compiler flags** - Works with standard TypeScript configuration

**Next Steps:**

- See [DI Quick Start Cheat Sheet](../../.specs/templates/di-quick-start.md)
- See [DI Migration Guide](../../.specs/templates/di-migration-guide.md)
- Review [AGENTS.md](../../AGENTS.md) for DI patterns
- Review [CLAUDE.md](../../CLAUDE.md) for container conventions

---

**Last Updated:** 2026-04-09
**Version:** 1.0.0
