# Migration Guide: tRPC Middleware to DDD Layers

> **Note on Current Migration Status:** This guide documents the completed migration from tRPC middleware to DDD layers using `Result<T,E>` patterns. The codebase is currently migrating **TO Effect** for improved type safety and composability. See [CLAUDE.md Section 10](./CLAUDE.md#10-effect-framework-patterns--migration-guide) for the current Effect patterns.

## Overview

This guide documents the migration of authentication and authorization logic from tRPC middleware to proper DDD layers (Domain, Use Cases, Adapters).

## What Changed

### Before: tRPC Middleware Pattern

```typescript
// apps/backend-server/src/trpc/middleware/auth.ts
export const authMiddleware = middleware(async ({ ctx, next }) => {
  const authHeader = ctx.headers.get("authorization");
  const token = extractToken(authHeader);

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);
  if (error || !user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  // Fetch role from database
  const dbUser = await prisma.user.findUnique({
    where: { email: user.email },
  });

  return next({
    ctx: {
      ...ctx,
      userId: user.id,
      userRole: dbUser?.role,
    },
  });
});

// In router
export const userRouter = createTRPCRouter({
  getById: protectedProcedure // ← middleware-based auth
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      // ctx.userId available via middleware magic
      return await controller.getById(input, ctx);
    }),
});
```

**Problems:**

- Hidden dependencies (ctx injected by middleware)
- Hard to test (must mock tRPC context)
- Business logic scattered in middleware
- Violates DDD (auth is domain concern)
- Magic strings/implicit context

### After: DDD Layer Pattern

```typescript
// packages/domain/src/value-objects/AuthContext.ts
export class AuthContext {
  private constructor(
    readonly userId: UserId,
    readonly email: Email,
    readonly role: UserRole,
  ) {}

  static create(props: {
    userId: string;
    email: string;
    role: string;
  }): Result<AuthContext, ValidationError> {
    // Pure validation - no side effects
    const userIdResult = UserId.create(props.userId);
    if (isErr(userIdResult)) return err(userIdResult.error);

    const emailResult = Email.create(props.email);
    if (isErr(emailResult)) return err(emailResult.error);

    const roleResult = UserRole.create(props.role);
    if (isErr(roleResult)) return err(roleResult.error);

    return ok(
      new AuthContext(userIdResult.value, emailResult.value, roleResult.value),
    );
  }

  isAdmin(): boolean {
    return this.role === UserRole.ADMIN;
  }
}

// packages/use-cases/src/interactors/AuthenticateUser.ts
export class AuthenticateUserUseCase {
  constructor(
    private authPort: AuthPort,
    private userRepo: UserRepository,
  ) {}

  async execute(input: {
    token: string;
  }): Promise<Result<AuthContext, AuthenticationError>> {
    // 1. Validate token with external auth service
    const authResult = await this.authPort.validateToken(input.token);
    if (isErr(authResult)) return err(authResult.error);

    // 2. Fetch user role from database
    const user = await this.userRepo.findByEmail(authResult.value.email);
    if (!user) return err(new UserNotFoundError());

    // 3. Create AuthContext value object
    const contextResult = AuthContext.create({
      userId: authResult.value.userId,
      email: authResult.value.email,
      role: user.role,
    });

    if (isErr(contextResult)) return err(contextResult.error);
    return ok(contextResult.value);
  }
}

// packages/adapters/src/controllers/controller-helpers.ts
export async function requireAuth(
  headers: Headers,
  di: DIContext,
): Promise<AuthContext> {
  const token = TokenExtractor.extract(headers);
  if (!token) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "No token provided" });
  }

  const useCase = di.container.resolve("authenticateUserUseCase");
  const result = await useCase.execute({ token });

  if (isErr(result)) {
    const message = getErrorMessage(result.error);
    throw new TRPCError({ code: "UNAUTHORIZED", message });
  }

  return result.value;
}

// In router - explicit auth
export const userRouter = createTRPCRouter({
  getById: publicProcedure // ← always publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const controller = ctx.container.resolve("userController");
      return await controller.getById(input, ctx);
    }),
});

// In controller - explicit auth check
export class UserController {
  async getById(input: GetByIdInput, ctx: DIContext) {
    // Auth explicitly requested when needed
    const authContext = await requireAuth(ctx.headers, ctx);

    // Pass auth context explicitly to use cases
    return await this.useCase.execute({
      id: input.id,
      authContext,
    });
  }
}
```

**Benefits:**

- Explicit dependencies (DI via awilix)
- Easy to test (mock ports)
- Auth logic properly layered
- Follows DDD principles
- Clear error handling with Result<T,E>

## Migration Steps

### Step 1: Identify Middleware Usage

Find all procedures using middleware-based auth:

```bash
grep -r "protectedProcedure\|adminProcedure\|moderatorProcedure" apps/backend-server/src/routers/
```

### Step 2: Convert Router Procedures

Change from:

```typescript
getById: protectedProcedure;
```

To:

```typescript
getById: publicProcedure; // Auth handled in controller
```

### Step 3: Add Auth to Controllers

Inject `requireAuth` or `requireAdmin` where needed:

```typescript
import {
  requireAuth,
  requireAdmin,
} from "@mirai-app/adapters/controller-helpers";

export class MyController {
  constructor(private useCase: MyUseCase) {}

  async publicMethod(input: Input, ctx: DIContext) {
    // No auth needed
    return await this.useCase.execute(input);
  }

  async protectedMethod(input: Input, ctx: DIContext) {
    const authContext = await requireAuth(ctx.headers, ctx);
    return await this.useCase.execute({ ...input, authContext });
  }

  async adminMethod(input: Input, ctx: DIContext) {
    const authContext = await requireAdmin(ctx.headers, ctx);
    return await this.useCase.execute({ ...input, authContext });
  }
}
```

### Step 4: Update Use Cases

Add `AuthContext` to use case inputs:

```typescript
export interface DoSomethingInput {
  // ... other fields
  authContext: AuthContext; // ← add this
}

export class DoSomethingUseCase {
  async execute(input: DoSomethingInput): Promise<Result<Output, Error>> {
    // Use authContext for authorization decisions
    if (!input.authContext.isAdmin()) {
      return err(new PermissionDeniedError());
    }

    // Proceed with operation
  }
}
```

### Step 5: Update Tests

Change middleware-based tests to explicit auth:

```typescript
// Before: Mock tRPC context with magic userId
const ctx = { userId: "user-123", userRole: "ADMIN" };

// After: Pass AuthContext explicitly
const authContext = AuthContext.create({
  userId: "user-123",
  email: "test@example.com",
  role: "ADMIN",
}).value!;

const result = await useCase.execute({
  id: "entity-1",
  authContext, // ← explicit
});
```

## Files Modified

### New Files Created

| File                                                                      | Purpose                          |
| ------------------------------------------------------------------------- | -------------------------------- |
| `packages/domain/src/value-objects/AuthContext.ts`                        | Immutable auth context VO        |
| `packages/domain/src/value-objects/AuthContext.test.ts`                   | Tests for AuthContext            |
| `packages/use-cases/src/ports/AuthPort.ts`                                | Interface for auth service       |
| `packages/use-cases/src/interactors/AuthenticateUser.ts`                  | Token validation use case        |
| `packages/use-cases/src/interactors/AuthenticateUser.test.ts`             | Tests for auth use case          |
| `packages/use-cases/src/interactors/AuthorizeAdmin.ts`                    | Admin authorization use case     |
| `packages/use-cases/src/interactors/AuthorizeModerator.ts`                | Moderator authorization use case |
| `packages/adapters/src/controllers/controller-helpers.ts`                 | Helper functions for controllers |
| `packages/use-cases/src/interactors/__tests__/controller-helpers.test.ts` | Tests for controller helpers     |

### Modified Files

| File                                              | Change                               |
| ------------------------------------------------- | ------------------------------------ |
| `apps/backend-server/src/trpc/middleware/auth.ts` | Converted to TokenExtractor          |
| `apps/backend-server/src/trpc/context.ts`         | Removed userId/userRole from context |
| `apps/backend-server/src/routers/*`               | Changed to publicProcedure           |
| Various controllers                               | Added explicit auth calls            |

## Error Handling

### Old Pattern

```typescript
// Middleware throws TRPCError
throw new TRPCError({ code: "UNAUTHORIZED" });
```

### New Pattern

```typescript
// Use case returns Result<T,E>
const result = await authenticateUseCase.execute({ token });
if (isErr(result)) {
  // Controller translates to TRPCError
  throw new TRPCError({
    code: getTRPCErrorCode(result.error),
    message: result.error.message,
  });
}
```

## Testing

### Unit Test Example

```typescript
describe("[UNIT] AuthenticateUserUseCase", () => {
  let container: any;

  beforeEach(() => {
    container = createTestContainer();
    container.register({
      authPort: asClass(MockAuthPort).singleton(),
      userRepository: asClass(InMemoryUserRepository).singleton(),
      authenticateUserUseCase: asClass(AuthenticateUserUseCase).scoped(),
    });
  });

  it("returns AuthContext on valid token", async () => {
    const useCase = container.resolve("authenticateUserUseCase");
    const result = await useCase.execute({ token: "valid-token" });

    expect(result.kind).toBe("ok");
    if (isOk(result)) {
      expect(result.value.userId).toBeDefined();
      expect(result.value.email).toBe("test@example.com");
    }
  });

  it("returns error on invalid token", async () => {
    const useCase = container.resolve("authenticateUserUseCase");
    const result = await useCase.execute({ token: "invalid-token" });

    expect(result.kind).toBe("err");
    if (isErr(result)) {
      expect(result.error._tag).toBe("InvalidTokenError");
    }
  });
});
```

## Troubleshooting

### Issue: "Cannot resolve authenticateUserUseCase"

**Cause:** DI container not properly configured

**Solution:**

```typescript
// Ensure modules are imported in your container setup
import { UseCaseModule } from "@mirai-app/use-cases";
import { ControllerModule } from "@mirai-app/adapters";

export const container = createContainer()
  .register(UseCaseModule)
  .register(ControllerModule);
```

### Issue: "AuthContext validation fails"

**Cause:** Missing or invalid role/userId/email

**Solution:**

```typescript
// Ensure your user repository returns proper role strings
const roleResult = UserRole.create(user.role);
if (isErr(roleResult)) {
  // Handle invalid role - maybe default to USER
  return err(new InvalidRoleError(user.role));
}
```

### Issue: "Token not found in headers"

**Cause:** Headers not properly passed to controller

**Solution:**

```typescript
// In router, ensure ctx is passed correctly
.query(async ({ ctx, input }) => {
  const controller = ctx.container.resolve("myController");
  return await controller.method(input, ctx);  // ← pass full ctx
})
```

## Verification Checklist

- [ ] All routers use `publicProcedure`
- [ ] Controllers call `requireAuth` where needed
- [ ] Use cases receive `AuthContext` in inputs
- [ ] Tests updated to pass `AuthContext` explicitly
- [ ] No middleware-based auth remains
- [ ] All new code has unit tests
- [ ] TypeScript compiles without errors

## References

- See `CLAUDE.md` section "5.5 Authentication & Authorization Patterns" for full documentation
- See `packages/domain/src/value-objects/AuthContext.ts` for AuthContext implementation
- See `packages/use-cases/src/interactors/AuthenticateUser.ts` for authentication use case
- See `packages/adapters/src/controllers/controller-helpers.ts` for controller helpers

## Migration Status

**Completed:** All tRPC middleware-based authentication has been migrated to DDD layers.

**Date:** 2026-04-09  
**Refactoring Task:** move-trpc-middleware-to-ddd-layers.refactor.md
