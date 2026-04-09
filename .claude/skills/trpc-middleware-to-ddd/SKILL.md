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
- You're adopting DDD/Clean Architecture with Promise-based patterns (no Effect library)

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

## Result Type Pattern

This skill uses a lightweight Result type for error handling (no external libraries required):

```typescript
// packages/domain/src/types/Result.ts
export type Result<T, E> = { kind: "ok"; value: T } | { kind: "err"; error: E };

export const ok = <T>(value: T): Result<T, never> => ({ kind: "ok", value });
export const err = <E>(error: E): Result<never, E> => ({ kind: "err", error });
export const isOk = <T, E>(r: Result<T, E>): r is { kind: "ok"; value: T } =>
  r.kind === "ok";
export const isErr = <T, E>(r: Result<T, E>): r is { kind: "err"; error: E } =>
  r.kind === "err";
```

## Recommended Patterns

### Pattern 1: Ports for Cross-Cutting Concerns

Define authentication/authorization as ports in the Use Cases layer:

```typescript
// packages/use-cases/src/ports/AuthService.ts

export class AuthenticationError extends Error {
  readonly _tag = "AuthenticationError";
}
export class AuthorizationError extends Error {
  readonly _tag = "AuthorizationError";
}

export interface AuthService {
  /** Verify token and return authenticated user */
  verifyToken(
    token: string,
  ): Promise<Result<AuthenticatedUser, AuthenticationError>>;

  /** Check if user has permission for resource */
  checkPermission(
    user: AuthenticatedUser,
    resource: string,
    action: string,
  ): Promise<Result<void, AuthorizationError>>;
}
```

### Pattern 2: Adapter Implementation (tRPC-specific)

Implement the port in the Adapters layer:

```typescript
// packages/adapters/src/gateways/SupabaseAuthAdapter.ts
import { Result, ok, err } from "../../domain/src/types/Result";

export class SupabaseAuthAdapter implements AuthService {
  constructor(private supabase: SupabaseClient) {}

  async verifyToken(
    token: string,
  ): Promise<Result<AuthenticatedUser, AuthenticationError>> {
    try {
      const { data, error } = await this.supabase.auth.getUser(token);
      if (error || !data.user) {
        return err(new AuthenticationError());
      }
      return ok(data.user);
    } catch {
      return err(new AuthenticationError());
    }
  }

  async checkPermission(
    user,
    resource,
    action,
  ): Promise<Result<void, AuthorizationError>> {
    // Implementation using your permission system
    // Return ok(undefined) for success, err(new AuthorizationError()) for failure
    return ok(undefined);
  }
}
```

### Pattern 3: Use Case with Promise-Based Composition

Business logic composes authentication/authorization using Promises:

```typescript
// packages/use-cases/src/interactors/CreateOrder.ts
import { Result, ok, err, isOk, isErr } from "../../domain/src/types/Result";

export class CreateOrderUseCase {
  constructor(
    private authService: AuthService,
    private orderRepository: OrderRepository,
    private logger: Logger,
  ) {}

  async execute(
    input: CreateOrderInput,
    token: string,
  ): Promise<Result<OrderDTO, CreateOrderError>> {
    // Authentication
    const authResult = await this.authService.verifyToken(token);
    if (isErr(authResult)) {
      return err(new CreateOrderError("Authentication failed"));
    }
    const user = authResult.value;

    // Authorization (business rule!)
    const permResult = await this.authService.checkPermission(
      user,
      "order",
      "create",
    );
    if (isErr(permResult)) {
      return err(new CreateOrderError("Permission denied"));
    }

    // Business logic
    const orderResult = Order.create({
      userId: user.id,
      items: input.items,
    });
    if (isErr(orderResult)) {
      return err(new CreateOrderError(orderResult.error.message));
    }
    const order = orderResult.value;

    // Persist
    const saved = await this.orderRepository.save(order);

    await this.logger.log(`Order created: ${saved.id}`);

    return ok(OrderDTO.fromDomain(saved));
  }
}
```

### Pattern 4: Token Extraction in Controllers (No ctx)

Extract token from HTTP request headers in controllers, NOT from tRPC context:

```typescript
// packages/adapters/src/utils/TokenExtractor.ts
export const TokenExtractor = {
  extract(req: Request): string | null {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) return null;
    return authHeader.slice(7); // Remove "Bearer " prefix
  },
};

// packages/adapters/src/controllers/OrderController.ts
export class OrderController {
  constructor(
    private authUseCase: AuthenticateUserUseCase,
    private orderUseCase: CreateOrderUseCase,
  ) {}

  async create(input: CreateOrderInput, req: Request) {
    // Extract token from HTTP headers (NOT from ctx)
    const token = TokenExtractor.extract(req);
    if (!token) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    // Authenticate
    const authResult = await this.authUseCase.execute(token);
    if (isErr(authResult)) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    const authContext = authResult.value;

    // Pass AuthContext explicitly to business use case
    return this.orderUseCase.execute(input, authContext);
  }
}
```

**Key Points:**

- Token comes from `req.headers`, NOT from `ctx.token`
- Controller is responsible for auth orchestration
- AuthContext passed explicitly to downstream use cases
- No `ctx.user` or auth-related fields in tRPC context

### Pattern 5: Thin tRPC Procedures (No Auth Middleware)

tRPC procedures should be thin HTTP adapters only - auth happens in controllers:

```typescript
// apps/backend-server/src/routers/orderRouter.ts
export const orderRouter = createTRPCRouter({
  create: publicProcedure // ← No protectedProcedure!
    .input(CreateOrderSchema)
    .mutation(async ({ ctx, input }) => {
      // Only framework concerns: parse input, resolve controller
      const controller = ctx.container.resolve("orderController");
      // Pass raw request to controller - auth happens there (NO ctx.token!)
      return controller.create(input, ctx.req);
    }),
});
```

**Key Differences from Traditional tRPC:**

- Use `publicProcedure` everywhere (no `protectedProcedure`, `adminProcedure`)
- Pass `ctx.req` (raw request) to controllers, not `ctx.token`
- Controllers handle all auth orchestration
- tRPC layer is 100% auth-agnostic

## Testing Strategy

### Unit Test (No tRPC Required)

```typescript
describe("[UNIT] CreateOrderUseCase", () => {
  it("creates order when authorized", async () => {
    // Arrange
    const mockAuth = {
      verifyToken: () => Promise.resolve(ok(mockUser)),
      checkPermission: () => Promise.resolve(ok(undefined)),
    };
    const mockRepo = { save: (order) => Promise.resolve(order) };
    const useCase = new CreateOrderUseCase(mockAuth, mockRepo, mockLogger);

    // Act
    const result = await useCase.execute(input, "valid-token");

    // Assert
    expect(result).toBeDefined();
    expect(isOk(result)).toBe(true);
  });

  it("fails when not authorized", async () => {
    const mockAuth = {
      verifyToken: () => Promise.resolve(ok(mockUser)),
      checkPermission: () => Promise.resolve(err(new AuthorizationError())),
    };
    const useCase = new CreateOrderUseCase(mockAuth, mockRepo, mockLogger);

    const result = await useCase.execute(input, "valid-token");

    expect(isErr(result)).toBe(true);
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

| Concern              | Framework (tRPC) | Adapter (Controller) | Use Case | Domain |
| -------------------- | ---------------- | -------------------- | -------- | ------ |
| HTTP parsing         | ✅               | ❌                   | ❌       | ❌     |
| Request routing      | ✅               | ❌                   | ❌       | ❌     |
| **Token extraction** | ❌               | ✅                   | ❌       | ❌     |
| Token verification   | ❌               | ✅                   | ❌       | ❌     |
| Authorization        | ❌               | ❌                   | ✅       | ❌     |
| Business invariants  | ❌               | ❌                   | ❌       | ✅     |
| Input validation     | ❌               | ❌                   | ✅       | ✅     |
| Persistence          | ❌               | ✅                   | ❌       | ❌     |
| Error formatting     | ✅               | ❌                   | ❌       | ❌     |
| Auth middleware      | ❌ (DELETED)     | N/A                  | N/A      | N/A    |

**Key Principle:** Token extraction moved from tRPC context to Controller layer. No `ctx.token` anywhere.

## Migration Checklist

- [ ] Identify all tRPC middleware currently handling auth/validation
- [ ] **DELETE** `protectedProcedure`, `adminProcedure`, `moderatorProcedure` from tRPC
- [ ] Define `AuthService` port interface in Use Cases layer
- [ ] Create `TokenExtractor` utility to extract tokens from HTTP headers (not ctx)
- [ ] Create adapter implementation (Supabase/Clerk/etc.) in Adapters layer
- [ ] Move authorization checks into Use Cases using Result types
- [ ] Update all controllers to extract tokens and handle auth orchestration
- [ ] Make tRPC procedures thin using `publicProcedure` only (no auth middleware)
- [ ] Verify no `ctx.token` or `ctx.user` references remain in codebase
- [ ] Write unit tests for use cases without tRPC setup
- [ ] Write integration tests for adapter layer only
- [ ] Remove business logic from all tRPC middleware

## Related Skills

- `/skill effect-di-migration` - For Effect-based DI patterns
- `/skill awilix-modular` - For modular DI container setup
- `/skill ddd:setup-code-formating` - For DDD code structure
