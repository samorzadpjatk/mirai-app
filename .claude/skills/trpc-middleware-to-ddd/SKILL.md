---
name: trpc-middleware-to-ddd
---

# Moving tRPC Middleware to Higher DDD Layers

## Overview

This skill provides patterns and best practices for migrating tRPC-specific middleware logic into higher-level Domain-Driven Design (DDD) layers, making business logic framework-agnostic and more testable.

## When to Use This Skill

- You're using tRPC with middleware for auth, validation, or logging
- You want to decouple business logic from tRPC framework specifics
- You need to make authentication/authorization testable without tRPC setup
- You're adopting DDD/Clean Architecture with Effect TS

## Anti-Patterns to Avoid

❌ **Don't put business logic in tRPC middleware:**

```typescript
// ❌ BAD: Authorization in tRPC middleware
const protectedProcedure = publicProcedure.use(async (opts) => {
  const { ctx } = opts;
  // ❌ Business rule (authorization) in framework layer
  if (!ctx.user.hasPermission("orders:create")) {
    throw new TRPCError({ code: "FORBIDDEN" });
  }
  return opts.next();
});
```

❌ **Don't access tRPC context directly in use cases:**

```typescript
// ❌ BAD: Use case depends on tRPC context
class CreateOrderUseCase {
  constructor(private ctx: TRPCContext) {} // ❌ Framework coupling

  execute(input) {
    // Business logic reading from tRPC context
    if (!this.ctx.user) throw new Error("Unauthorized");
  }
}
```

## Recommended Patterns

### Pattern 1: Ports for Cross-Cutting Concerns

Define authentication/authorization as ports in the Use Cases layer:

```typescript
// packages/use-cases/src/ports/AuthService.ts
import { Effect } from "effect";

export class AuthenticationError extends Data.TaggedError(
  "AuthenticationError",
)<{}> {}
export class AuthorizationError extends Data.TaggedError(
  "AuthorizationError",
)<{}> {}

export interface AuthService {
  /** Verify token and return authenticated user */
  verifyToken(
    token: string,
  ): Effect.Effect<AuthenticatedUser, AuthenticationError>;

  /** Check if user has permission for resource */
  checkPermission(
    user: AuthenticatedUser,
    resource: string,
    action: string,
  ): Effect.Effect<void, AuthorizationError>;
}
```

### Pattern 2: Adapter Implementation (tRPC-specific)

Implement the port in the Adapters layer:

```typescript
// packages/adapters/src/gateways/SupabaseAuthAdapter.ts
import { Effect } from "effect";

export class SupabaseAuthAdapter implements AuthService {
  constructor(private supabase: SupabaseClient) {}

  verifyToken(token: string) {
    return Effect.tryPromise({
      try: () => this.supabase.auth.getUser(token),
      catch: () => new AuthenticationError(),
    }).pipe(
      Effect.map(({ data }) => data.user),
      Effect.mapError(() => new AuthenticationError()),
    );
  }

  checkPermission(user, resource, action) {
    // Implementation using your permission system
    return Effect.succeed(undefined); // or fail with AuthorizationError
  }
}
```

### Pattern 3: Use Case with Effect Composition

Business logic composes authentication/authorization using Effect:

```typescript
// packages/use-cases/src/interactors/CreateOrder.ts
import { Effect, pipe } from "effect";

export class CreateOrderUseCase {
  constructor(
    private authService: AuthService,
    private orderRepository: OrderRepository,
    private logger: Logger,
  ) {}

  execute(input: CreateOrderInput, token: string) {
    return Effect.gen(
      function* (_) {
        // Authentication
        const user = yield* _(this.authService.verifyToken(token));

        // Authorization (business rule!)
        yield* _(this.authService.checkPermission(user, "order", "create"));

        // Business logic
        const order = yield* _(
          Order.create({
            userId: user.id,
            items: input.items,
          }),
        );

        // Persist
        const saved = yield* _(this.orderRepository.save(order));

        yield* _(this.logger.log(`Order created: ${saved.id}`));

        return OrderDTO.fromDomain(saved);
      }.bind(this),
    );
  }
}
```

### Pattern 4: Request Context via Scoped DI

Instead of tRPC context, use scoped container registration:

```typescript
// packages/frameworks/trpc/context.ts
export const createTRPCContext = async (opts: { req: Request }) => {
  const token = extractToken(opts.req);

  // Create request-scoped container
  const scope = container.createScope();

  // Register request-specific values
  scope.register({
    authToken: asValue(token),
    requestId: asValue(generateRequestId()),
    requestTime: asValue(new Date()),
  });

  return { scope, token };
};

// packages/adapters/src/controllers/OrderController.ts
export class OrderController {
  constructor(private useCase: CreateOrderUseCase) {}

  async create(input: CreateOrderInput, token: string) {
    // Use case receives dependencies via DI, not context
    return Effect.runPromise(this.useCase.execute(input, token));
  }
}
```

### Pattern 5: Thin tRPC Procedures

tRPC procedures should be thin HTTP adapters only:

```typescript
// apps/backend-server/src/routers/orderRouter.ts
export const orderRouter = createTRPCRouter({
  create: protectedProcedure
    .input(CreateOrderSchema)
    .mutation(async ({ ctx, input }) => {
      // Only framework concerns: parse input, extract token
      const controller = ctx.container.resolve("orderController");
      return controller.create(input, ctx.token);
    }),
});
```

## Testing Strategy

### Unit Test (No tRPC Required)

```typescript
describe("[UNIT] CreateOrderUseCase", () => {
  it("creates order when authorized", async () => {
    // Arrange
    const mockAuth = {
      verifyToken: () => Effect.succeed(mockUser),
      checkPermission: () => Effect.succeed(undefined),
    };
    const mockRepo = { save: () => Effect.succeed(mockOrder) };
    const useCase = new CreateOrderUseCase(mockAuth, mockRepo, mockLogger);

    // Act
    const result = await Effect.runPromise(
      useCase.execute(input, "valid-token"),
    );

    // Assert
    expect(result).toBeDefined();
  });

  it("fails when not authorized", async () => {
    const mockAuth = {
      verifyToken: () => Effect.succeed(mockUser),
      checkPermission: () => Effect.fail(new AuthorizationError()),
    };
    const useCase = new CreateOrderUseCase(mockAuth, mockRepo, mockLogger);

    await expect(
      Effect.runPromise(useCase.execute(input, "valid-token")),
    ).rejects.toThrow(AuthorizationError);
  });
});
```

### Adapter Test (tRPC integration)

```typescript
describe("[INTEGRATION] OrderRouter", () => {
  it("returns 401 for invalid token", async () => {
    const caller = appRouter.createCaller({
      container: testContainer,
      token: "invalid",
    });

    await expect(caller.order.create({ items: [] })).rejects.toThrow(
      "UNAUTHORIZED",
    );
  });
});
```

## Layer Responsibilities

| Concern             | Framework (tRPC) | Adapter | Use Case | Domain |
| ------------------- | ---------------- | ------- | -------- | ------ |
| HTTP parsing        | ✅               | ❌      | ❌       | ❌     |
| Request routing     | ✅               | ❌      | ❌       | ❌     |
| Token extraction    | ✅               | ❌      | ❌       | ❌     |
| Token verification  | ❌               | ✅      | ❌       | ❌     |
| Authorization       | ❌               | ❌      | ✅       | ❌     |
| Business invariants | ❌               | ❌      | ❌       | ✅     |
| Input validation    | ❌               | ❌      | ✅       | ✅     |
| Persistence         | ❌               | ✅      | ❌       | ❌     |
| Error formatting    | ✅               | ❌      | ❌       | ❌     |

## Migration Checklist

- [ ] Identify all tRPC middleware currently handling auth/validation
- [ ] Define `AuthService` port interface in Use Cases layer
- [ ] Create adapter implementation (Supabase/Clerk/etc.) in Adapters layer
- [ ] Move authorization checks into Use Cases using Effect
- [ ] Replace tRPC context with scoped DI container registration
- [ ] Make tRPC procedures thin (just parse input and call controller)
- [ ] Write unit tests for use cases without tRPC setup
- [ ] Write integration tests for adapter layer only
- [ ] Remove business logic from all tRPC middleware

## Related Skills

- `/skill effect-di-migration` - For Effect-based DI patterns
- `/skill awilix-modular` - For modular DI container setup
- `/skill ddd:setup-code-formating` - For DDD code structure
