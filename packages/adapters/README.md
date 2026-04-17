# @mirai-app/adapters - Adapters Layer

> **Interface Adapters layer of Clean Architecture - Bridge to external frameworks**
>
> Depends on @mirai-app/domain and @mirai-app/use-cases
>
> **Effect-based DI**: Uses Effect Layers for dependency injection (migrated from awilix-modular)

## Contents

- **Controllers**: GraphQL resolvers, API endpoints using Effect-based controller factory pattern
- **Gateways**: Gateway implementations (Drizzle ORM with Effect)
- **Presenters**: Response formatters
- **Mappers**: Data transformation between domain and external formats
- **Utils**: Token extraction, Effect execution helpers, controller utilities

## Rules

1. **Implement Inner Layer Interfaces**: Implement use-case ports
2. **Convert Data Only**: Convert formats, not business logic
3. **No Decisions**: Adapters adapt; they never decide
4. **Framework-Specific**: Contains framework-specific code (GraphQL, Hono, Drizzle)
5. **No Domain Logic**: Keep business rules in the domain layer

## Directory Structure

```
src/
├── index.ts              # Public exports (barrel)
├── activity/             # Activity domain adapters
│   ├── controllers/      # Activity controllers
│   ├── gateways/         # Activity gateways (Drizzle, in-memory)
│   └── mappers/          # Activity mappers
├── challenge/            # Challenge domain
├── coin/                 # Coin domain
├── event/                # Event domain
├── group/                # Group domain
├── location/             # Location domain
├── notification/         # Notification domain
├── ranking/              # Ranking domain
├── reward/               # Reward domain
├── sponsor/              # Sponsor domain
├── storage/              # Storage domain
├── submission/           # Submission domain
├── trip/                 # Trip domain
├── user/                 # User domain
└── system/               # Shared utilities
    ├── controllers/      # Shared controller utilities
    ├── gateways/         # Shared gateway base classes
    ├── mappers/          # Shared mapper utilities
    ├── errors/           # Common adapter errors
    └── utils/            # General utilities
```

## Controller Factory Pattern

The adapters package uses a **controller factory pattern** with **Effect Layer-based dependency injection**. All 17 controllers are created via `createControllers()` which injects dependencies via Effect Layers.

### Overview

```typescript
// 17 Controllers total
const controllers = createControllers({
  appLayer, // Effect Layer with all repos + services
  supabase, // Supabase client (for StorageController)
  onChallengeCompleted, // Event callback
});

// Access via context.controllers.* in resolvers
const user = await context.controllers.userController.getById({ id: "123" });
```

### Controller Types

| Type                   | Description                 | Use Case           |
| ---------------------- | --------------------------- | ------------------ |
| `Controllers`          | All 17 controllers          | Full system access |
| `BaseControllers`      | 16 controllers (no storage) | Most use cases     |
| `ControllerFactory<K>` | Selective access            | Partial mocking    |

### Creating Controllers

```typescript
import { createControllers } from "@mirai-app/adapters/controllers";
import { makeAppLayer } from "@mirai-app/frameworks/di";

// 1. Create the Effect Layer (24 bindings: 19 repos + 5 services)
const appLayer = makeAppLayer({ supabase, db });

// 2. Create all 17 controllers
const controllers = createControllers({
  appLayer,
  supabase,
  onChallengeCompleted: async (event) => {
    // Handle challenge completion event
  },
});
```

### Using Controllers in GraphQL Resolvers

```typescript
// GraphQL context includes controllers
interface GraphQLContext {
  controllers: Controllers;
  // ... other context
}

// Resolver accesses controller via context
export const resolvers = {
  Query: {
    user: async (_: unknown, args: { id: string }, context: GraphQLContext) => {
      const result = await context.controllers.userController.getById(args);

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    },
  },
};
```

### Selective Controller Access

Use `ControllerFactory<K>` for partial controller access:

```typescript
import type { ControllerFactory } from "@mirai-app/adapters/controllers";

// Only user and group controllers
type UserGroupOnly = ControllerFactory<"userController" | "groupController">;

function processUserGroup(
  controllers: UserGroupOnly,
  userId: string,
  groupId: string,
) {
  // Type-safe: only userController and groupController available
  return {
    user: controllers.userController.getById({ id: userId }),
    group: controllers.groupController.getById({ id: groupId }),
  };
}
```

### Package Exports

Controllers are available via subpath exports:

```typescript
// All controllers + factory
import {
  createControllers,
  Controllers,
} from "@mirai-app/adapters/controllers";

// Individual controllers
import { UserController } from "@mirai-app/adapters/controllers/user";
import { GroupController } from "@mirai-app/adapters/controllers/group";
```

## Gateway Implementation

### BaseDrizzleGateway (Recommended)

Extend the base class for standard CRUD operations with Effect:

```typescript
// user/gateways/drizzle/gateway.ts
import { Effect } from "effect";
import { BaseDrizzleGateway } from "../../system/gateways/base";
import { UserDrizzleMapper } from "../mappers/drizzle";
import {
  users,
  type UserSelect,
  type UserInsert,
} from "@mirai-app/frameworks/drizzle/schema";
import type { DrizzleDb } from "@mirai-app/frameworks/drizzle/client";
import type { UserGateway } from "@mirai-app/use-cases";
import { User } from "@mirai-app/domain";

export class DrizzleUserGateway
  extends BaseDrizzleGateway<User, UserSelect, UserInsert, typeof users>
  implements UserGateway
{
  constructor(db: DrizzleDb) {
    super(db, {
      table: users,
      mapper: UserDrizzleMapper.instance,
    });
  }

  // Add custom query methods with Effect.tryPromise
  findByAuthUserId(
    authUserId: string,
  ): Effect.Effect<User | null, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        const records = await this.db
          .select()
          .from(this.table)
          .where(eq(this.table.authUserId, authUserId))
          .limit(1);

        return records[0] ? this.mapper.toDomain(records[0]) : null;
      },
      catch: (error) =>
        new DatabaseError({
          operation: "findByAuthUserId",
          message: "Failed to find user",
          cause: error,
        }),
    });
  }
}
```

**Benefits:**

- ~70% less code per gateway
- Consistent Effect-based error handling
- Automatic CRUD operations
- Type-safe with Drizzle

### Manual Implementation (Complex Cases)

For highly custom needs, implement manually:

```typescript
// user/gateways/drizzle/custom.ts
import { Effect } from "effect";
import type { CustomGateway } from "@mirai-app/use-cases";

export class CustomDrizzleGateway implements CustomGateway {
  constructor(private db: DrizzleDb) {}

  customQuery(): Effect.Effect<Result, DatabaseError, never> {
    return Effect.tryPromise({
      try: async () => {
        // Custom complex query
        return result;
      },
      catch: (error) => new DatabaseError({ cause: error }),
    });
  }
}
```

## Mapper

```typescript
// user/mappers/drizzle.ts
import { User } from "@mirai-app/domain";
import type { UserSelect } from "@mirai-app/frameworks/drizzle/schema";

export class UserDrizzleMapper {
  static instance = new UserDrizzleMapper();

  toDomain(record: UserSelect): User {
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

  toDrizzleInsert(entity: User): UserInsert {
    return {
      id: entity.id,
      email: entity.email.value,
      createdAt: entity.createdAt,
    };
  }

  toDrizzleUpdate(entity: User): Partial<UserInsert> {
    return {
      email: entity.email.value,
      updatedAt: new Date(),
    };
  }
}
```

## Controller Implementation

Controllers are thin layers that:

1. Validate input
2. Access gateways via `yield* GatewayTag`
3. Execute use cases
4. Handle errors

```typescript
// group/controllers/index.ts
import { Effect, type Layer } from "effect";
import { GroupGatewayTag, getGroupUseCase } from "@mirai-app/use-cases";

export class GroupController {
  constructor(private appLayer: Layer.Layer<unknown>) {}

  async getById(input: unknown) {
    // 1. Validate input
    const parsed = validateGetByIdInput(input);
    if (!parsed.success) {
      return { success: false, error: "Invalid input" };
    }

    // 2. Create Effect program
    const effect = getGroupUseCase({ groupId: parsed.data.id });

    // 3. Run with Layer DI
    const provided = effect.pipe(Effect.provide(this.appLayer));
    const result = await Effect.runPromise(Effect.either(provided));

    // 4. Return controller result
    if (result._tag === "Left") {
      return { success: false, error: result.left.message };
    }
    return { success: true, data: result.right };
  }

  async assignUser(input: unknown) {
    const parsed = validateAssignUserToGroupInput(input);
    if (!parsed.success) {
      return { success: false, error: "Invalid input" };
    }

    // Access gateway directly via Context.Tag
    const effect = Effect.gen(function* () {
      const gateway = yield* GroupGatewayTag;
      const input: AssignUserToGroupInput = {
        groupId: parsed.data.groupId,
        userId: UserId.create(parsed.data.userId),
      };
      return yield* assignUserToGroupUseCase(input);
    });

    const result = await Effect.runPromise(
      Effect.either(effect.pipe(Effect.provide(this.appLayer))),
    );

    // Map specific errors for backward compatibility
    if (!result.success) {
      if (result.error.includes("GroupNotFoundError")) {
        return { success: false, error: "Group not found" };
      }
    }

    return result;
  }
}
```

## Effect-Based Error Handling

Controllers use Effect for composable error handling:

```typescript
import { Effect } from "effect";
import { runEffect, runEffectGraphQL } from "../utils/effect-executor";

// HTTP endpoint
async function handleRequest(input: Input) {
  const effect = useCase.execute(input);
  return await runEffect(effect); // Throws HTTP errors
}

// GraphQL resolver
async function resolveUser(parent: unknown, args: { id: string }) {
  const effect = useCase.execute({ id: args.id });
  return await runEffectGraphQL(effect); // Throws GraphQLError
}

// With custom handlers
async function handleWithFallback(input: Input) {
  return await runEffectWithHandler(useCase.execute(input), {
    onNotFound: () => null, // Return null instead of throwing
    onUnauthorized: (err) => ({ error: err.message }),
  });
}
```

### Error Mapping

| Domain Error        | HTTP Status | GraphQL Code      |
| ------------------- | ----------- | ----------------- |
| `ValidationError`   | 400         | `BAD_USER_INPUT`  |
| `NotFoundError`     | 404         | `NOT_FOUND`       |
| `UnauthorizedError` | 401         | `UNAUTHENTICATED` |
| `ConflictError`     | 409         | `CONFLICT`        |
| `InvariantError`    | 400         | `BAD_USER_INPUT`  |

## TokenExtractor Utility

Extracts Bearer tokens from HTTP Authorization headers:

```typescript
import { TokenExtractor } from "@mirai-app/adapters/utils/TokenExtractor";

// In controller or helper:
const authHeader = request.headers.get("authorization");
const token = TokenExtractor.extract(authHeader); // Returns string | null

if (!token) {
  throw new UnauthorizedError("No token provided");
}
```

The TokenExtractor validates the Bearer scheme and handles various header formats.

## Controller Helpers

Standard functions for result handling and Effect integration:

```typescript
import {
  handleResult, // Convert ControllerResult to value or throw
  handleEffect, // Run Effect and throw HTTP errors
  handleEffectGraphQL, // Run Effect and throw GraphQLError
  effectToControllerResult, // Effect → ControllerResult
} from "@mirai-app/adapters/utils/controller-helpers";

// Usage examples:

// 1. Handle controller result
const result = await controller.getById(input);
const data = handleResult(result); // Throws if success: false

// 2. Handle Effect directly
const data = await handleEffect(useCase.execute(input));

// 3. Convert Effect to controller result
const result = await effectToControllerResult(useCase.execute(input));
```

## Testing

Adapter tests use Effect Layer-based test utilities:

```typescript
import { describe, it, expect } from "bun:test";
import { Layer, Effect } from "effect";
import { DrizzleUserGateway } from "../user/gateways/drizzle";
import {
  runWithTestLayer,
  createServiceLayer,
  mergeTestLayers,
} from "@mirai-app/adapters/system/test";

describe("DrizzleUserGateway", () => {
  it("should find user by authUserId", async () => {
    // Create test layer with mock database
    const testDb = createTestDatabase();
    const dbLayer = createServiceLayer(DrizzleDbTag, testDb);

    const gateway = new DrizzleUserGateway(testDb);

    const user = await runWithTestLayer(
      gateway.findByAuthUserId("auth-123"),
      dbLayer,
    );

    expect(user).not.toBeNull();
  });
});
```

### Controller Testing

```typescript
import { makeAppLayer } from "@mirai-app/frameworks/di";
import { createControllers } from "@mirai-app/adapters/controllers";

describe("GroupController", () => {
  it("should get group by id", async () => {
    // Create test layer with in-memory repos
    const testLayer = makeAppLayer({
      supabase: mockSupabase,
      db: testDb,
    }).pipe(
      Layer.merge(mockGatewayLayer), // Override with mocks
    );

    const controllers = createControllers({
      appLayer: testLayer,
      supabase: mockSupabase,
      onChallengeCompleted: jest.fn(),
    });

    const result = await controllers.groupController.getById({ id: "123" });

    expect(result.success).toBe(true);
  });
});
```

## Anti-Patterns to Avoid

### ❌ Business Logic in Controllers

```typescript
// BAD: Business logic in controller
export class BadController {
  async create(input: CreateInput) {
    // ❌ Validation (should be in domain)
    if (!input.email.includes("@")) {
      throw new Error("Invalid email");
    }

    // ❌ Business logic (should be in use case)
    if (input.email.endsWith("@blocked.com")) {
      throw new Error("Domain blocked");
    }

    // ❌ Direct database access (should use gateway)
    const user = await prisma.user.create({ data: input });
    return user;
  }
}
```

### ❌ Manual Dependency Resolution

```typescript
// BAD: Manual container resolution (old awilix pattern)
async getById(input: GetByIdInput, container: DIContainer) {
  // ❌ OLD: String-based resolution
  const gateway = container.resolve("userGateway");

  // ✅ NEW: Use Effect Context.Tag
  const effect = Effect.gen(function* () {
    const gateway = yield* UserGatewayTag;
    return yield* gateway.findById(input.id);
  });
}
```

### ❌ Auth in Middleware

```typescript
// BAD: Using deleted auth-aware middleware
export const badRouter = {
  action: protectedProcedure // ❌ DELETED - doesn't exist
    .mutation(async ({ ctx, input }) => {
      // ❌ Old pattern no longer works
      const userId = ctx.user.id; // ❌ ctx.user removed
    }),
};
```

### ✅ Clean Controller

```typescript
// GOOD: Thin controller with Effect Layer DI
export class GoodController {
  constructor(private appLayer: Layer.Layer<unknown>) {}

  async create(input: CreateInput) {
    // Only: Input validation (zod)
    const parsed = createUserSchema.parse(input);

    // Only: Execute use case via Effect
    const effect = createUserUseCase(parsed);

    // Only: Run and handle result
    return await runEffect(effect);
  }
}
```

### ✅ Auth in Controllers

```typescript
// GOOD: Auth at controller level using Effect
export class GoodController {
  async action(input: ActionInput, headers: Headers) {
    // Extract token
    const token = TokenExtractor.extract(headers.get("authorization"));
    if (!token) throw new UnauthorizedError("No token");

    // Auth happens via AuthPort in the Layer
    const effect = Effect.gen(function* () {
      const auth = yield* AuthPortTag;
      const user = yield* auth.verifyToken(token);
      return yield* useCase.execute({ ...input, userId: user.id });
    });

    return await runEffect(effect.pipe(Effect.provide(this.appLayer)));
  }
}
```

## References

- [CLAUDE.md](../../CLAUDE.md) - CEK Five Pillars (Effect Edition)
- [AGENTS.md](./AGENTS.md) - Adapter layer quick reference
- [Effect Documentation](https://effect.website/) - Effect framework patterns
- [Repository Pattern](https://martinfowler.com/eaaCatalog/repository.html)
- [Data Mapper Pattern](https://martinfowler.com/eaaCatalog/dataMapper.html)
