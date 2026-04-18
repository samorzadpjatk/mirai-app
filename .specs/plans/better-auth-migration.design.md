# Better Auth Migration Design

> Clean Architecture migration from Supabase Auth to Better Auth

## Overview

This design replaces **Supabase Auth** with **Better Auth** while preserving all existing Clean Architecture boundaries. The domain's `IAuthPort` interface remains unchanged at its core—only the adapter implementation changes from `SupabaseAuthGateway` to `BetterAuthGateway`.

## Key Architectural Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Database Adapter** | Drizzle ORM | Consistent with existing database layer |
| **Deployment** | Embedded in backend-server | Simpler, shares database connection |
| **Session Strategy** | Cookie-based | Better Auth managed, native app uses cookie jar |
| **Route Mounting** | `/api/auth/*` | REST convention, GraphQL moves to `/api/graphql` |
| **Authorization** | Domain-level `verifyAccess()` | Better Auth handles auth, domain handles permissions |

## Architecture

### Layer Impacts

```
┌─────────────────────────────────────────────────────────────┐
│  Domain Layer (packages/domain/)                            │
│  ────────────────────────────                               │
│  • IAuthPort interface - extended with sendSignInOtp()     │
│  • New error types: AuthSessionExpiredError,                 │
│                   PermissionDeniedError                    │
│                   UserAlreadyExistsError                     │
│                   RateLimitError                             │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  Use-Cases Layer (packages/use-cases/)                      │
│  ───────────────────────────────                            │
│  • AuthPortTag - unchanged                                   │
│  • All interactors - unchanged (same interface)             │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  Adapters Layer (packages/adapters/)                        │
│  ─────────────────────────────                              │
│  • BetterAuthGateway - implements IAuthPort                │
│  • Replaces SupabaseAuthGateway                              │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  Frameworks Layer (packages/frameworks/)                    │
│  ─────────────────────────────────                          │
│  • createBetterAuth() - Better Auth configuration          │
│  • Updated DI wiring in service.ts                         │
└─────────────────────────────────────────────────────────────┘
```

### IAuthPort Interface

```typescript
// packages/domain/src/shared/services/index.ts
export interface IAuthPort {
  // Session management
  signInWithPassword(
    email: string, 
    password: string
  ): Effect.Effect<
    { user: { id: string; email: string }; session: { accessToken: string } },
    IPortError,
    never
  >;

  sendSignInOtp(email: string): Effect.Effect<void, IPortError, never>;

  signInWithOtp(
    email: string, 
    otp: string
  ): Effect.Effect<
    { user: { id: string; email: string }; session: { accessToken: string } },
    IPortError,
    never
  >;

  signUp(
    email: string, 
    password: string
  ): Effect.Effect<
    { user: { id: string; email: string } | null },
    IPortError,
    never
  >;

  signOut(): Effect.Effect<void, IPortError, never>;

  getSession(): Effect.Effect<
    { user: { id: string; email: string } | null; accessToken: string | null },
    IPortError,
    never
  >;

  refreshSession(): Effect.Effect<
    { session: { accessToken: string } | null },
    IPortError,
    never
  >;

  // Gateway-level resource authorization
  verifyAccess(request: AccessCheckRequest): Effect.Effect<void, AuthError, never>;
}

export interface AccessCheckRequest {
  token: string;
  resourceType: "trip" | "group" | "challenge" | "user" | "activity" | "notification" | "reward" | "sponsor" | "coin" | "submission";
  resourceId: string;
  requiredPermission: "read" | "write" | "admin";
  requireOwnership?: boolean;
}
```

## Better Auth Configuration

### Frameworks Layer Setup

```typescript
// packages/frameworks/src/better-auth/index.ts
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { emailOTP } from "better-auth/plugins";
import type { Database } from "../drizzle";

export const createBetterAuth = (db: Database) => betterAuth({
  database: drizzleAdapter(db, { provider: "pg" }),
  basePath: "/api/auth",
  emailAndPassword: { enabled: true },
  plugins: [
    emailOTP({
      async sendVerificationOTP({ email, otp, type }) {
        // Integrate with notification service
        await sendEmailNotification({ 
          to: email, 
          subject: "Your login code", 
          body: otp 
        });
      },
      expiresIn: 300, // 5 minutes
    }),
  ],
});

export type BetterAuthInstance = ReturnType<typeof createBetterAuth>;
```

### Backend-Server Mounting

```typescript
// apps/backend-server/src/server.ts
import { Hono } from "hono";
import { createBetterAuth } from "@mirai-app/frameworks/better-auth";
import { createYoga } from "graphql-yoga";

const app = new Hono();
const auth = createBetterAuth(db);

// Better Auth at /api/auth/*
app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

// GraphQL at /api/graphql
const yoga = createYoga({ schema, context: createContext });
app.post("/api/graphql", (c) => yoga.handle(c.req.raw));

export default app;
```

## Adapter Implementation

### BetterAuthGateway

```typescript
// packages/adapters/src/auth/gateways/better-auth/BetterAuthGateway.ts
import { Effect, Data } from "effect";
import type { IAuthPort, AccessCheckRequest } from "@mirai-app/domain";
import type { BetterAuthInstance } from "@mirai-app/frameworks/better-auth";
import { ApplicationError, AuthSessionExpiredError, PermissionDeniedError } from "@mirai-app/domain";

export class BetterAuthGateway implements IAuthPort {
  constructor(private auth: BetterAuthInstance) {}

  signInWithPassword(email: string, password: string) {
    return Effect.tryPromise({
      try: async () => {
        const result = await this.auth.api.signInEmail({
          body: { email, password },
        });
        return {
          user: { 
            id: result.user.id, 
            email: result.user.email ?? "" 
          },
          session: { 
            accessToken: result.token ?? "" 
          },
        };
      },
      catch: (error) => new ApplicationError({
        operation: "BetterAuthGateway.signInWithPassword",
        cause: error,
      }),
    });
  }

  sendSignInOtp(email: string) {
    return Effect.tryPromise({
      try: async () => {
        await this.auth.api.sendVerificationEmailOTP({
          body: { email, type: "sign-in" },
        });
      },
      catch: (error) => new ApplicationError({
        operation: "BetterAuthGateway.sendSignInOtp",
        cause: error,
      }),
    });
  }

  signInWithOtp(email: string, otp: string) {
    return Effect.tryPromise({
      try: async () => {
        const result = await this.auth.api.signInEmailOTP({
          body: { email, otp },
        });
        return {
          user: { 
            id: result.user.id, 
            email: result.user.email ?? "" 
          },
          session: { 
            accessToken: result.token ?? "" 
          },
        };
      },
      catch: (error) => new ApplicationError({
        operation: "BetterAuthGateway.signInWithOtp",
        cause: error,
      }),
    });
  }

  signUp(email: string, password: string) {
    return Effect.tryPromise({
      try: async () => {
        const result = await this.auth.api.signUpEmail({
          body: { email, password },
        });
        return {
          user: result.user
            ? { id: result.user.id, email: result.user.email ?? "" }
            : null,
        };
      },
      catch: (error) => new ApplicationError({
        operation: "BetterAuthGateway.signUp",
        cause: error,
      }),
    });
  }

  signOut() {
    return Effect.tryPromise({
      try: async () => {
        await this.auth.api.signOut();
      },
      catch: (error) => new ApplicationError({
        operation: "BetterAuthGateway.signOut",
        cause: error,
      }),
    });
  }

  getSession() {
    return Effect.tryPromise({
      try: async () => {
        const session = await this.auth.api.getSession();
        return {
          user: session?.user
            ? { id: session.user.id, email: session.user.email ?? "" }
            : null,
          accessToken: session?.token ?? null,
        };
      },
      catch: (error) => new ApplicationError({
        operation: "BetterAuthGateway.getSession",
        cause: error,
      }),
    });
  }

  refreshSession() {
    return Effect.tryPromise({
      try: async () => {
        const result = await this.auth.api.refreshToken();
        return {
          session: result?.token
            ? { accessToken: result.token }
            : null,
        };
      },
      catch: (error) => new ApplicationError({
        operation: "BetterAuthGateway.refreshSession",
        cause: error,
      }),
    });
  }

  verifyAccess(request: AccessCheckRequest) {
    return Effect.gen(function* () {
      // 1. Validate session with Better Auth
      const session = yield* Effect.tryPromise({
        try: () => this.auth.api.getSession({
          headers: new Headers({ Authorization: `Bearer ${request.token}` }),
        }),
        catch: (error) => new AuthSessionExpiredError({ token: request.token }),
      });

      if (!session) {
        return yield* Effect.fail(
          new AuthSessionExpiredError({ token: request.token })
        );
      }

      // 2. Check permissions via domain tables
      yield* this.checkDomainPermissions({
        userId: session.user.id,
        resourceType: request.resourceType,
        resourceId: request.resourceId,
        requiredPermission: request.requiredPermission,
        requireOwnership: request.requireOwnership,
      });
    });
  }

  private checkDomainPermissions(params: {
    userId: string;
    resourceType: string;
    resourceId: string;
    requiredPermission: string;
    requireOwnership?: boolean;
  }) {
    // Implementation queries domain tables for permissions
    // Based on existing gateway-auth-protection pattern
    return Effect.succeed(void 0); // Placeholder
  }
}
```

## Error Types

### New Domain Errors

```typescript
// packages/domain/src/shared/errors/auth-errors.ts
import { Data } from "effect";
import type { IPortError } from "./ports";

export class AuthSessionExpiredError
  extends Data.TaggedError("AuthSessionExpiredError")<{
    token: string;
  }>
  implements IPortError
{
  readonly message = "Session expired or invalid";
}

export class PermissionDeniedError
  extends Data.TaggedError("PermissionDeniedError")<{
    userId: string;
    resourceType: string;
    resourceId: string;
    requiredPermission: string;
  }>
  implements IPortError
{
  readonly message = "Permission denied for requested resource";
}

export class UserAlreadyExistsError
  extends Data.TaggedError("UserAlreadyExistsError")<{
    email: string;
  }>
  implements IPortError
{
  readonly message: string;
  constructor(props: { email: string }) {
    super(props);
    this.message = `User with email ${props.email} already exists`;
  }
}

export class RateLimitError
  extends Data.TaggedError("RateLimitError")<{
    retryAfter: number;
  }>
  implements IPortError
{
  readonly message = "Rate limit exceeded. Please try again later.";
}

export class AuthenticationError
  extends Data.TaggedError("AuthenticationError")<{
    message: string;
  }>
  implements IPortError
{
  readonly message: string;
  constructor(props: { message: string }) {
    super(props);
    this.message = props.message;
  }
}
```

## DI Layer Wiring

### Service Layer Update

```typescript
// packages/frameworks/src/di/layer/service.ts
import { Layer } from "effect";
import { AuthPortTag, StoragePortTag } from "@mirai-app/use-cases";
import { BetterAuthGateway, SupabaseStorageGateway } from "@mirai-app/adapters";
import { createBetterAuth } from "../../better-auth";

export interface ServiceLayerConfig {
  db: Database;
  supabase: SupabaseClient; // Still needed for Storage
}

export const makeServiceLayer = (config: ServiceLayerConfig) => {
  // Create Better Auth instance
  const betterAuth = createBetterAuth(config.db);

  const authLayer = Layer.succeed(
    AuthPortTag,
    new BetterAuthGateway(betterAuth),
  );

  // Storage still uses Supabase for now
  const storageLayer = Layer.succeed(
    StoragePortTag,
    new SupabaseStorageGateway(config.supabase),
  );

  return Layer.mergeAll(authLayer, storageLayer);
};

export { createBetterAuth } from "../../better-auth";
```

## Testing Strategy

### Unit Tests (Bypass Auth)

```typescript
import { Layer } from "effect";
import { AuthPortTag } from "@mirai-app/use-cases";

const mockAuthLayer = Layer.succeed(
  AuthPortTag,
  {
    signInWithPassword: () => Effect.succeed({ 
      user: { id: "test-id", email: "test@test.com" }, 
      session: { accessToken: "token" } 
    }),
    sendSignInOtp: () => Effect.succeed(void 0),
    signInWithOtp: () => Effect.succeed({ 
      user: { id: "test-id", email: "test@test.com" }, 
      session: { accessToken: "token" } 
    }),
    signUp: () => Effect.succeed({ user: { id: "test-id", email: "test@test.com" } }),
    signOut: () => Effect.succeed(void 0),
    getSession: () => Effect.succeed({ user: null, accessToken: null }),
    refreshSession: () => Effect.succeed({ session: { accessToken: "new-token" } }),
    verifyAccess: () => Effect.succeed(void 0),
  } as IAuthPort
);

const testLayer = Layer.mergeAll(mockAuthLayer, mockRepositoryLayer);
```

### Integration Tests (Real Better Auth)

```typescript
import { Effect } from "effect";
import { createBetterAuth } from "@mirai-app/frameworks/better-auth";
import { BetterAuthGateway } from "@mirai-app/adapters";

const testDb = setupTestDatabase();
const betterAuth = createBetterAuth(testDb);
const authGateway = new BetterAuthGateway(betterAuth);
const authLayer = Layer.succeed(AuthPortTag, authGateway);

// Test actual session flow
const result = await Effect.runPromise(
  program.pipe(Effect.provide(authLayer))
);
```

### Key Test Scenarios

| Scenario | Expected Result |
|----------|----------------|
| Valid session + valid permission | Success |
| Invalid/expired session | `AuthSessionExpiredError` |
| Valid session + missing permission | `PermissionDeniedError` |
| Ownership check failure | `PermissionDeniedError` |
| Rate limit exceeded | `RateLimitError` |

## Migration Steps

1. **Install dependencies:** `better-auth`, `@better-auth/drizzle-adapter`
2. **Create Better Auth configuration** in frameworks package
3. **Create BetterAuthGateway** implementing IAuthPort
4. **Update DI wiring** to use Better Auth instead of Supabase
5. **Mount Better Auth routes** in backend-server at `/api/auth`
6. **Move GraphQL** to `/api/graphql`
7. **Add new error types** to domain
8. **Update native app** to use cookie jar for session management
9. **Update tests** with mock auth layer
10. **Remove SupabaseAuthGateway** once migration complete

## Files to Create/Modify

### Create
- `packages/frameworks/src/better-auth/index.ts`
- `packages/adapters/src/auth/gateways/better-auth/BetterAuthGateway.ts`
- `packages/domain/src/shared/errors/auth-errors.ts`

### Modify
- `packages/frameworks/src/di/layer/service.ts`
- `apps/backend-server/src/server.ts`
- `packages/domain/src/shared/services/index.ts` (extend IAuthPort with sendSignInOtp)
- `packages/adapters/src/index.ts` (export BetterAuthGateway)

### Delete (after migration)
- `packages/adapters/src/auth/gateways/supabase/SupabaseAuthGateway.ts`
- `packages/frameworks/src/stores/auth/supabase.ts` (if no longer needed)

---

**Status**: Design validated
**Next Step**: Implementation via `/sdd:implement`
