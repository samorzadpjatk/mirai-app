# awilix-modular Skill

> Comprehensive guide for implementing dependency injection with awilix-modular in Clean Architecture/DDD projects

## Executive Summary

**awilix-modular** is a framework-agnostic wrapper over [awilix](https://github.com/jeffijoe/awilix) that brings NestJS-like modular architecture with strict type safety to any Node.js application. It enables:

- **Type-safe module system** - Complete type inference for all providers
- **HTTP framework agnostic** - Works with Express, Fastify, Hono, Koa, or any framework
- **NestJS-inspired patterns** - Familiar module/controller/provider architecture
- **Reduced boilerplate** - Define dependencies once per module, not repeatedly
- **Native ES decorators** (Stage 3) for routing - no `reflect-metadata` required

## awilix-modular vs InversifyJS Comparison

| Aspect                | awilix-modular                                | InversifyJS                                                 |
| --------------------- | --------------------------------------------- | ----------------------------------------------------------- |
| **Core Philosophy**   | Programmatic registration, minimal decorators | Decorator-heavy, annotation-based                           |
| **TypeScript Config** | No special config needed                      | Requires `experimentalDecorators` + `emitDecoratorMetadata` |
| **Metadata**          | No `reflect-metadata` needed                  | Requires `reflect-metadata` polyfill                        |
| **Modularity**        | Built-in modular system with imports/exports  | Manual container modules                                    |
| **Type Safety**       | `ModuleDef['deps']` for full inference        | Manual type annotations                                     |
| **Boilerplate**       | Less - define once in module                  | More - repeat in every constructor                          |
| **Testing**           | Easy mocking at module level                  | Container rebind patterns                                   |
| **Bundle Size**       | Lightweight (awilix base)                     | Larger with metadata overhead                               |
| **Migration Path**    | Progressive - works alongside existing code   | Requires full decorator adoption                            |

### Why Choose awilix-modular Over InversifyJS

1. **No experimental features** - Uses native ES Stage 3 decorators, not experimental TypeScript decorators
2. **Single source of truth** - Define dependencies once in `ModuleDef`, reuse across all services
3. **Framework agnostic** - No coupling to specific framework patterns
4. **Better for Clean Architecture** - Keeps domain code free of DI framework annotations
5. **Type inference** - Automatic type inference from module definitions

## Core Concepts

### 1. Awilix Foundation

Awilix provides the underlying DI container:

- **`createContainer()`** - Creates root container
- **`asClass()`** - Register classes
- **`asFunction()`** - Register factory functions
- **`asValue()`** - Register plain values
- **`Lifetime`** - SINGLETON, SCOPED, TRANSIENT
- **`InjectionMode`** - PROXY (default), CLASSIC

### 2. awilix-modular Layer

Adds module system on top of awilix:

- **`createStaticModule()`** - Define a module with providers
- **`createDynamicModule()`** - Module with configuration (`forRoot` pattern)
- **`ModuleDef`** - Type definition for module structure
- **`DIContext`** - Initialize modules with framework

## Integration Patterns for Clean Architecture

### Layer Mapping

```
┌─────────────────────────────────────────────────────────────┐
│ Framework Layer (packages/frameworks/)                      │
│ ├─ DIContext initialization                                 │
│ ├─ Framework adapters (Express/Fastify/tRPC)               │
│ └─ Root provider registration                               │
├─────────────────────────────────────────────────────────────┤
│ Adapter Layer (packages/adapters/)                          │
│ ├─ Module definitions per domain                           │
│ ├─ Controllers with route registration                     │
│ └─ Repository implementations                              │
├─────────────────────────────────────────────────────────────┤
│ Use Case Layer (packages/use-cases/)                        │
│ ├─ Interactors as module providers                          │
│ └─ Input/output DTOs                                        │
├─────────────────────────────────────────────────────────────┤
│ Domain Layer (packages/domain/)                             │
│ └─ Pure entities/value objects (no DI coupling)           │
└─────────────────────────────────────────────────────────────┘
```

### Module Organization Pattern

```typescript
// packages/adapters/src/modules/UserModule.ts
import { createStaticModule, type ModuleDef } from "awilix-modular";
import { UserController } from "../controllers/UserController";
import { PrismaUserRepository } from "../gateways/PrismaUserRepository";
import { GetUserUseCase } from "@mirai/use-cases";

// Define all providers in the module
type UserModuleDef = ModuleDef<{
  providers: {
    userController: UserController;
    userRepository: PrismaUserRepository;
    getUserUseCase: GetUserUseCase;
  };
  exportKeys: "userController" | "getUserUseCase";
}>;

// Export deps type for use in constructors
export type UserModuleDeps = UserModuleDef["deps"];

export const UserModule = createStaticModule<UserModuleDef>({
  name: "UserModule",
  providers: {
    userController: UserController,
    userRepository: PrismaUserRepository,
    getUserUseCase: GetUserUseCase,
  },
  exports: {
    userController: UserController,
    getUserUseCase: GetUserUseCase,
  },
});
```

### Service with Type-Safe Dependencies

```typescript
// packages/adapters/src/controllers/UserController.ts
import { Controller } from "awilix-modular";
import type { UserModuleDeps } from "../modules/UserModule";
import type { Express, Request, Response } from "express";

export class UserController implements Controller {
  constructor(
    private readonly getUserUseCase: UserModuleDeps["getUserUseCase"],
    private readonly logger: UserModuleDeps["logger"],
  ) {}

  registerRoutes(app: Express) {
    app.get("/users/:id", async (req: Request, res: Response) => {
      const result = await this.getUserUseCase.execute({
        userId: req.params.id,
      });

      if (result.isError()) {
        return res.status(404).json({ error: result.error });
      }

      res.json(result.value);
    });
  }
}
```

### Root Application Setup

```typescript
// packages/frameworks/src/di/AppModule.ts
import { createStaticModule, DIContext } from "awilix-modular";
import { UserModule } from "@mirai/adapters";
import { PrismaClient } from "@mirai/db";

// Define common dependencies available to all modules
type CommonDeps = {
  prisma: PrismaClient;
  logger: Logger;
};

type AppModuleDef = ModuleDef<{
  imports: [typeof UserModule];
}>;

export const AppModule = createStaticModule<AppModuleDef>({
  name: "AppModule",
  imports: [UserModule],
});

// Make common deps available globally
declare module "awilix-modular" {
  interface CommonDependencies extends CommonDeps {}
}

// Initialize in application bootstrap
export function initializeDI(app: Express, prisma: PrismaClient) {
  return DIContext.create(AppModule, {
    framework: app,
    rootProviders: {
      prisma,
      logger: new Logger(),
    },
  });
}
```

### tRPC Integration Pattern

```typescript
// apps/backend-server/src/trpc/context.ts
import { DIContext } from "awilix-modular";
import type { AppModule } from "@mirai/frameworks";

type DIContextType = ReturnType<typeof DIContext.create<typeof AppModule>>;

export interface TRPCContext {
  di: DIContextType;
  db: PrismaClient;
  // ... other context properties
}

// Create context with request-scoped DI
export async function createTRPCContext(opts: {
  req: Request;
}): Promise<TRPCContext> {
  const db = getPrismaClient();

  // Create request-scoped DI context
  const di = DIContext.create(AppModule, {
    rootProviders: {
      prisma: db,
      requestId: opts.req.id,
    },
  });

  return { di, db };
}
```

### Using in tRPC Routers

```typescript
// apps/backend-server/src/routers/user.ts
export const userRouter = createTRPCRouter({
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      // Resolve controller from DI context
      const controller = ctx.di.cradle.userController;
      return controller.getById(input);
    }),
});
```

## Provider Types

### Class Providers (Most Common)

```typescript
export const UserModule = createStaticModule<UserModuleDef>({
  name: "UserModule",
  providers: {
    // Simple class registration
    userService: UserService,
    emailService: EmailService,

    // With DI options
    cacheService: {
      useClass: CacheService,
      lifetime: Lifetime.SINGLETON,
    },
  },
});
```

### Factory Providers

```typescript
import { createFactoryProvider } from "awilix-modular";

// Create typed factory helper
const factory = createFactoryProvider<UserModuleDef["deps"]>();

export const UserModule = createStaticModule<UserModuleDef>({
  name: "UserModule",
  providers: {
    apiKey: "sendgrid_key_123",

    emailService: factory({
      provide: EmailService,
      inject: ["apiKey"],
      useFactory: (apiKey) => {
        return new EmailService({ apiKey });
      },
    }),
  },
});
```

### Primitive Providers

```typescript
export const ConfigModule = createStaticModule<ConfigModuleDef>({
  name: "ConfigModule",
  providers: {
    apiUrl: "https://api.example.com",
    port: 3000,
    isDevelopment: process.env.NODE_ENV === "development",
  },
});
```

## Lifetime Management

### Lifetime Scopes

```typescript
import { Lifetime } from "awilix";

export const OrderModule = createStaticModule<OrderModuleDef>({
  name: "OrderModule",
  providers: {
    // SINGLETON: One instance per module (default)
    orderRepository: {
      useClass: OrderRepository,
      lifetime: Lifetime.SINGLETON,
    },

    // SCOPED: One instance per request scope
    orderService: {
      useClass: OrderService,
      lifetime: Lifetime.SCOPED,
    },

    // TRANSIENT: New instance every resolution
    orderController: {
      useClass: OrderController,
      lifetime: Lifetime.TRANSIENT,
    },
  },
});
```

### Configuration Hierarchy

Options can be set at 3 levels (more specific overrides general):

1. **DiContext level** - Default for all providers
2. **Module level** (`providerOptions`) - Default for module
3. **Provider level** - Specific to one provider

```typescript
// 1. DiContext level
DIContext.create(AppModule, {
  providerOptions: { lifetime: Lifetime.SINGLETON },
});

// 2. Module level
export const OrderModule = createStaticModule<OrderModuleDef>({
  name: "OrderModule",
  providerOptions: { lifetime: Lifetime.SCOPED },
  providers: {
    orderService: OrderService, // uses SCOPED
  },
});

// 3. Provider level
export const OrderModule = createStaticModule<OrderModuleDef>({
  name: "OrderModule",
  providers: {
    cacheService: {
      useClass: CacheService,
      lifetime: Lifetime.SINGLETON, // overrides module default
    },
  },
});
```

## Migration Guide from Manual DI

### Current State (Manual DI)

```typescript
// Current pattern - manual instantiation
.query(async ({ ctx, input }) => {
  const repo = new PrismaUserRepository(ctx.db);
  const controller = new UserController(repo);
  return controller.getById(input);
})
```

### Step-by-Step Migration

#### Step 1: Create Module Definition

```typescript
// packages/adapters/src/modules/UserModule.ts
import { createStaticModule, type ModuleDef } from "awilix-modular";

// Define the module structure
type UserModuleDef = ModuleDef<{
  providers: {
    userController: UserController;
    userRepository: PrismaUserRepository;
  };
  exportKeys: "userController";
}>;

export type UserModuleDeps = UserModuleDef["deps"];

export const UserModule = createStaticModule<UserModuleDef>({
  name: "UserModule",
  providers: {
    userController: UserController,
    userRepository: PrismaUserRepository,
  },
  exports: {
    userController: UserController,
  },
});
```

#### Step 2: Update Controllers for DI

```typescript
// Before
export class UserController {
  constructor(private repo: PrismaUserRepository) {}
}

// After - type-safe DI
export class UserController implements Controller {
  constructor(
    private readonly userRepository: UserModuleDeps["userRepository"],
  ) {}

  registerRoutes(app: Express) {
    app.get("/users/:id", async (req, res) => {
      const user = await this.userRepository.findById(req.params.id);
      res.json(user);
    });
  }
}
```

#### Step 3: Initialize DI Context

```typescript
// packages/frameworks/src/di/index.ts
import { DIContext } from "awilix-modular";
import { UserModule } from "@mirai/adapters";
import { PrismaClient } from "@mirai/db";

type CommonDeps = {
  prisma: PrismaClient;
  logger: Logger;
};

const AppModule = createStaticModule({
  name: "AppModule",
  imports: [UserModule],
});

declare module "awilix-modular" {
  interface CommonDependencies extends CommonDeps {}
}

export function createDIContext(app: Express, prisma: PrismaClient) {
  return DIContext.create(AppModule, {
    framework: app,
    rootProviders: {
      prisma,
      logger: new Logger(),
    },
  });
}
```

#### Step 4: Update tRPC Context

```typescript
// Before
export interface TRPCContext {
  db: PrismaClient;
  user: User | null;
}

// After
export interface TRPCContext {
  db: PrismaClient;
  user: User | null;
  di: ReturnType<typeof createDIContext>;
}

export async function createTRPCContext(opts: { req: Request }) {
  const db = getPrismaClient();
  const di = createDIContext(opts.req, db);

  return { db, di, user: null };
}
```

#### Step 5: Migrate Router Procedures

```typescript
// Before
.query(async ({ ctx, input }) => {
  const repo = new PrismaUserRepository(ctx.db);
  const controller = new UserController(repo);
  return controller.getById(input);
})

// After
.query(async ({ ctx, input }) => {
  // Single line - resolve from DI
  return ctx.di.cradle.userController.getById(input);
})
```

## Testing Patterns

### Unit Testing with DI

```typescript
import { describe, it, expect, beforeEach } from "bun:test";
import { createTestContainer } from "../test-utils";
import { UserController } from "./UserController";
import { UserModule } from "./UserModule";

describe("UserController", () => {
  let container: ReturnType<typeof createTestContainer>;

  beforeEach(() => {
    container = createTestContainer({
      imports: [UserModule],
    });
  });

  it("should get user by id", async () => {
    const controller = container.cradle.userController;

    // Mock the repository at container level
    const mockRepo = {
      findById: mock(() => Promise.resolve({ id: "1", name: "Test" })),
    };

    // Override repository in container
    container.register({
      userRepository: asValue(mockRepo),
    });

    const result = await controller.getById({ id: "1" });
    expect(result).toEqual({ id: "1", name: "Test" });
  });
});
```

### Integration Testing with Test Database

```typescript
import { createStaticModule, DIContext } from "awilix-modular";
import { PrismaClient } from "@prisma/client";

describe("User API Integration", () => {
  let testPrisma: PrismaClient;
  let diContext: ReturnType<typeof DIContext.create>;

  beforeAll(async () => {
    testPrisma = new PrismaClient({
      datasourceUrl: process.env.TEST_DATABASE_URL,
    });
  });

  beforeEach(async () => {
    diContext = DIContext.create(TestAppModule, {
      rootProviders: {
        prisma: testPrisma,
      },
    });
  });

  afterEach(async () => {
    // Clean up test data
    await testPrisma.user.deleteMany();
  });

  it("should create user", async () => {
    const controller = diContext.cradle.userController;

    const result = await controller.create({
      email: "test@example.com",
      name: "Test User",
    });

    expect(result.id).toBeDefined();
  });
});
```

### Mocking at Module Level

```typescript
// test-utils/createTestContainer.ts
import { createContainer, asValue } from "awilix";
import { createStaticModule } from "awilix-modular";

export function createMockUserModule() {
  return createStaticModule({
    name: "MockUserModule",
    providers: {
      userRepository: asValue({
        findById: mock(() => Promise.resolve(null)),
        create: mock(() => Promise.resolve({ id: "1" })),
      }),
      userController: UserController,
    },
    exports: {
      userController: UserController,
    },
  });
}
```

## Common Pitfalls and Best Practices

### ✅ DO

1. **Define modules by domain/feature**

   ```typescript
   // Good - one module per domain
   (UserModule, ChallengeModule, TripModule);
   ```

2. **Use `exportKeys` for public API**

   ```typescript
   // Only export what other modules need
   exportKeys: "userController" | "getUserUseCase";
   ```

3. **Keep domain layer pure**

   ```typescript
   // Domain entities should NOT depend on awilix
   // Use cases can be registered as providers
   ```

4. **Use `ModuleDef['deps']` for type safety**

   ```typescript
   constructor(
     private readonly userService: UserModuleDeps["userService"]
   ) {}
   ```

5. **Set appropriate lifetimes**
   ```typescript
   // Repositories: Singleton
   // Services: Scoped or Singleton
   // Controllers: Scoped (for request-scoped data)
   ```

### ❌ DON'T

1. **Don't use decorators in domain code**

   ```typescript
   // Bad - domain should be framework-agnostic
   // Historical: Decorator pattern not used in this codebase
   @provide(TYPES.UserService)  // Not applicable - we use awilix-modular
   class User { ... }
   ```

2. **Don't create circular dependencies**

   ```typescript
   // Use forwardRef if absolutely necessary
   // Better: Refactor to break the cycle
   ```

3. **Don't resolve directly in domain layer**

   ```typescript
   // Bad - domain shouldn't know about DI
   const repo = container.resolve("userRepository");
   ```

4. **Don't use shorter lifetimes than dependencies**
   ```typescript
   // This will error in strict mode
   singletonService: {
     useClass: MyService,
     lifetime: Lifetime.SINGLETON,
   },
   transientDependency: {
     useClass: MyDep,
     lifetime: Lifetime.TRANSIENT,
   }
   // MyService depends on MyDep -> ERROR
   ```

## Advanced Patterns

### Dynamic Modules (Configuration)

```typescript
export const DatabaseModule = createDynamicModule<DatabaseModuleDef>((config) =>
  createStaticModule({
    name: "DatabaseModule",
    providers: {
      connectionString: config.connectionString,
      databaseService: DatabaseService,
    },
    exports: {
      databaseService: DatabaseService,
    },
  }),
);

// Usage
import { DatabaseModule } from "./DatabaseModule";

export const AppModule = createStaticModule({
  name: "AppModule",
  imports: [
    DatabaseModule.forRoot({
      connectionString: "postgresql://localhost:5432/myapp",
    }),
  ],
});
```

### Circular Dependencies (When Unavoidable)

```typescript
// Within same module
export const AnimalModule = createStaticModule<AnimalModuleDef>({
  name: "AnimalModule",
  providers: {
    dogsService: DogsService,
    catsService: {
      useClass: CatsService,
      allowCircular: true, // Enable circular resolution
    },
  },
});

// Between modules
import { forwardRef, type ModuleRef } from "awilix-modular";

export const OwnersModule: StaticModule<OwnersModuleDef> =
  createStaticModule<OwnersModuleDef>({
    name: "OwnersModule",
    imports: [forwardRef(() => CatsModule)],
    providers: { ownersService: OwnersService },
  });
```

## Resources

- **awilix-modular**: https://github.com/wildstyles/awilix-modular
- **awilix core**: https://github.com/jeffijoe/awilix
- **Effect.ts**: https://effect.website/docs

## References

1. awilix-modular README - https://github.com/wildstyles/awilix-modular
2. awilix Documentation - https://github.com/jeffijoe/awilix
3. Effect.ts Documentation - https://effect.website/docs
