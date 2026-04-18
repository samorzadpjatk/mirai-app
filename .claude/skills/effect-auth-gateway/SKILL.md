# Effect Auth Gateway Patterns

> Clean Architecture authentication patterns with Effect DI for gateway-level auth protection

## Overview

This skill provides patterns for implementing authentication and authorization at the gateway level using Effect's dependency injection system. The approach separates concerns across Clean Architecture layers while maintaining type safety and testability.

## Core Pattern

```
┌─────────────────────────────────────────────────────────────┐
│                    Gateway Method                           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Effect.gen(function* () {                           │   │
│  │   // 1. Get auth verification port from context    │   │
│  │   const authPort = yield* AuthPortTag;             │   │
│  │                                                    │   │
│  │   // 2. Verify access before data operation        │   │
│  │   yield* authPort.verifyAccess({                   │   │
│  │     token: authToken,                              │   │
│  │     resourceType: "trip",                          │   │
│  │     resourceId: tripId,                            │   │
│  │     requiredPermission: "read"                   │   │
│  │   });                                              │   │
│  │                                                    │   │
│  │   // 3. Only proceed if auth succeeds             │   │
│  │   return yield* this.performDataAccess(...);        │   │
│  │ });                                                │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Key Benefits

- **Declarative**: Gateways specify what they need, not how to get it
- **Composable**: Different auth strategies via Effect Layers
- **Testable**: Mock auth port to bypass auth in tests
- **Type-safe**: Effect's type system ensures auth is always provided
- **Clean Architecture**: Domain logic stays pure, infrastructure injected

---

## Architecture

### Layer Responsibilities

| Layer | Responsibility |
|-------|---------------|
| Domain (`packages/domain/`) | Define `IAuthPort` interface and auth errors |
| Use-Cases (`packages/use-cases/`) | Define `AuthPortTag` Context.Tag for DI |
| Adapters (`packages/adapters/`) | Implement `SupabaseAuthGateway` |
| Frameworks (`packages/frameworks/`) | Compose Layers in DI wiring |
| GraphQL Resolvers | Extract token, pass to gateway methods |

---

## Implementation Patterns

### 1. Domain Layer - IAuthPort Interface

```typescript
// packages/domain/src/auth/ports/AuthPort.ts
import type { Effect } from "effect";
import type { IPortError } from "../../shared/errors/ports";

export interface IAuthPort {
  // Session management
  signIn(credentials: Credentials): Effect.Effect<AuthSession, AuthError, never>;
  signOut(sessionId: string): Effect.Effect<void, AuthError, never>;
  getSession(token: string): Effect.Effect<AuthSession | null, AuthError, never>;
  
  // Unified verification (session + resource)
  verifyAccess(request: AccessCheckRequest): Effect.Effect<void, AuthError, never>;
}

export interface AccessCheckRequest {
  token: string;
  resourceType: "trip" | "group" | "challenge" | "user" | "activity" | 
                "notification" | "reward" | "sponsor" | "coin" | "submission";
  resourceId: string;
  requiredPermission: "read" | "write" | "admin";
  requireOwnership?: boolean;
}
```

### 2. Domain Layer - Auth Errors

```typescript
// packages/domain/src/auth/errors/AuthErrors.ts
import { Data } from "effect";
import type { IPortError } from "../../shared/errors/ports";

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

export class TokenMissingError 
  extends Data.TaggedError("TokenMissingError")<{}> 
  implements IPortError 
{
  readonly message = "Authentication token is required";
}
```

### 3. Use-Cases Layer - AuthPortTag

```typescript
// packages/use-cases/src/auth/ports/AuthPort.ts
import { Context } from "effect";
import type { IAuthPort } from "@mirai-app/domain";

export class AuthPortTag extends Context.Tag("AuthPort")<
  AuthPortTag,
  IAuthPort
>() {}
```

### 4. Adapters Layer - SupabaseAuthGateway

```typescript
// packages/adapters/src/auth/gateways/supabase/SupabaseAuthGateway.ts
import { Effect } from "effect";
import type { SupabaseClient } from "@mirai-app/frameworks/supabase";
import type { IAuthPort, AccessCheckRequest } from "@mirai-app/domain";
import { 
  AuthSessionExpiredError, 
  PermissionDeniedError,
  DatabaseError 
} from "@mirai-app/domain";

export class SupabaseAuthGateway implements IAuthPort {
  constructor(private readonly supabase: SupabaseClient) {}

  verifyAccess(request: AccessCheckRequest) {
    return Effect.gen(function* () {
      // Step 1: Validate JWT session with Supabase Auth
      const { data: { user }, error: sessionError } = yield* Effect.tryPromise({
        try: () => this.supabase.auth.getUser(request.token),
        catch: (error) => new AuthSessionExpiredError({ token: request.token }),
      });

      if (sessionError || !user) {
        return yield* Effect.fail(
          new AuthSessionExpiredError({ token: request.token })
        );
      }

      // Step 2: Check resource permissions against domain tables
      const hasPermission = yield* this.checkResourcePermission({
        userId: user.id,
        resourceType: request.resourceType,
        resourceId: request.resourceId,
        requiredPermission: request.requiredPermission,
      });

      if (!hasPermission) {
        return yield* Effect.fail(
          new PermissionDeniedError({
            userId: user.id,
            resourceType: request.resourceType,
            resourceId: request.resourceId,
            requiredPermission: request.requiredPermission,
          })
        );
      }

      return yield* Effect.succeed(void 0);
    });
  }

  private checkResourcePermission(params: {
    userId: string;
    resourceType: string;
    resourceId: string;
    requiredPermission: string;
  }) {
    return Effect.tryPromise({
      try: async () => {
        // Query domain tables for permissions
        // Example: check if user is participant in trip
        const { data } = await this.supabase
          .from("trip_participants")
          .select("role")
          .eq("trip_id", params.resourceId)
          .eq("user_id", params.userId)
          .single();
        
        return !!data;
      },
      catch: (error) => new DatabaseError({ operation: "checkResourcePermission", cause: error }),
    });
  }

  // ... other IAuthPort methods (signIn, signOut, getSession)
}
```

### 5. Frameworks Layer - Auth Layer Composition

```typescript
// packages/frameworks/src/di/layer/auth.ts
import { Layer } from "effect";
import type { SupabaseClient } from "@mirai-app/frameworks/supabase";
import { AuthPortTag } from "@mirai-app/use-cases/auth/ports/AuthPort";
import { SupabaseAuthGateway } from "@mirai-app/adapters";

export const makeAuthLayer = (supabase: SupabaseClient) => {
  return Layer.succeed(
    AuthPortTag,
    new SupabaseAuthGateway(supabase)
  );
};
```

### 6. Frameworks Layer - App Layer Integration

```typescript
// packages/frameworks/src/di/layer/app.ts
export const makeAppLayer = (config: { db: DrizzleDb; supabase: SupabaseClient }) => {
  return Layer.mergeAll(
    makeAuthLayer(config.supabase),      // Add auth layer
    makeRepositoryLayers(config.db),
    makeServiceLayers(config.supabase),
  );
};
```

### 7. Gateway Integration Pattern

```typescript
// packages/adapters/src/trip/gateways/drizzle/TripDrizzleGateway.ts
import { Effect } from "effect";
import type { ITripPort } from "@mirai-app/domain";
import { AuthPortTag } from "@mirai-app/use-cases/auth/ports/AuthPort";

export class TripDrizzleGateway implements ITripPort {
  findById(id: TripId, authToken: string) {
    return Effect.gen(function* () {
      // Get auth port from Effect context
      const authPort = yield* AuthPortTag;
      
      // Unified verification: validates session + checks permissions
      yield* authPort.verifyAccess({
        token: authToken,
        resourceType: "trip",
        resourceId: TripId.toString(id),
        requiredPermission: "read",
      });
      
      // Only proceed if authorized
      return yield* this.performFindById(id);
    });
  }

  update(trip: Trip, authToken: string) {
    return Effect.gen(function* () {
      const authPort = yield* AuthPortTag;
      
      // Require write permission for updates
      yield* authPort.verifyAccess({
        token: authToken,
        resourceType: "trip",
        resourceId: TripId.toString(trip.id),
        requiredPermission: "write",
      });
      
      return yield* this.performUpdate(trip);
    });
  }
}
```

---

## GraphQL Integration

### Context Setup

```typescript
// apps/backend-server/src/server/graphql.ts
const createGraphQLContext = ({ request, appLayer }) => {
  const authHeader = request.headers.get("authorization");
  const accessToken = authHeader?.split(" ")[1];
  
  return {
    request,
    accessToken,
    runWithAppLayer: (effect) => 
      Effect.runPromise(effect.pipe(Effect.provide(appLayer))),
  };
};
```

### Resolver Pattern

```typescript
// packages/frameworks/src/graphql/types/trip/queries.ts
trip: t.field({
  type: TripType,
  args: { id: t.arg.id({ required: true }) },
  resolve: async (_parent, args, ctx) => {
    const tripId = TripId.unsafeCreate(args.id);
    
    const result = await ctx.runWithAppLayer(
      Effect.gen(function* () {
        const tripPort = yield* TripPortTag;
        return yield* tripPort.findById(tripId, ctx.accessToken);
      })
    );
    
    return result;
  },
}),
```

---

## Error Handling Patterns

### Mapping Domain Errors to GraphQL

```typescript
// packages/frameworks/src/graphql/errors.ts
import { match } from "ts-pattern";

export function mapAuthErrorToGraphQL(error: AuthError): GraphQLError {
  return match(error)
    .with({ _tag: "AuthSessionExpiredError" }, () => 
      new GraphQLError("Authentication required", { 
        extensions: { code: "UNAUTHENTICATED" } 
      }))
    .with({ _tag: "PermissionDeniedError" }, (e) => 
      new GraphQLError(`Access denied: ${e.message}`, { 
        extensions: { code: "FORBIDDEN" } 
      }))
    .otherwise(() => new GraphQLError("Auth error"));
}
```

### Error Recovery

```typescript
// In resolvers: handle auth errors gracefully
const result = await ctx.runWithAppLayer(
  Effect.gen(function* () {
    const tripPort = yield* TripPortTag;
    return yield* tripPort.findById(tripId, ctx.accessToken);
  }).pipe(
    Effect.catchTag("AuthSessionExpiredError", (error) => 
      Effect.succeed(null) // Return null for unauthenticated requests
    )
  )
);
```

---

## Testing Patterns

### Mock Auth Layer (Unit Tests)

```typescript
// Bypass auth in unit tests
const mockAuthLayer = Layer.succeed(
  AuthPortTag,
  {
    verifyAccess: () => Effect.succeed(void 0),
    signIn: () => Effect.fail(new Error("Not implemented in mock")),
    signOut: () => Effect.succeed(void 0),
    getSession: () => Effect.succeed(null),
  } as IAuthPort
);

const testLayer = Layer.mergeAll(mockAuthLayer, mockRepositoryLayer);
```

### Integration Testing

```typescript
// Test with real auth layer
const result = await Effect.runPromise(
  tripGateway.findById(tripId, validToken).pipe(
    Effect.provide(realAppLayer)
  )
);
expect(result).toBeRight();
```

### Testing Auth Failures

```typescript
const result = await Effect.runPromise(
  Effect.either(
    tripGateway.findById(tripId, expiredToken).pipe(
      Effect.provide(realAppLayer)
    )
  )
);

expect(Either.isLeft(result)).toBe(true);
if (Either.isLeft(result)) {
  expect(result.left).toBeInstanceOf(AuthSessionExpiredError);
}
```

---

## Port Naming Conventions

| Layer | Pattern | Example |
|-------|---------|---------|
| Domain | `I` + `XxxPort` | `IAuthPort`, `ITripPort` |
| Use-Cases | `XxxPortTag` | `AuthPortTag`, `TripPortTag` |
| Gateways | Implement `IXxxPort` | `implements IAuthPort` |

---

## Common Pitfalls and Solutions

### Pitfall 1: Declaration Merging

```typescript
// Wrong - triggers ESLint no-unsafe-declaration-merging
export interface AuthPort { ... }
export class AuthPort { ... }

// Correct - use I-prefix for interfaces
export interface IAuthPort { ... }
export class AuthPortTag extends Context.Tag(...) { }
```

### Pitfall 2: Auth in Middleware

```typescript
// Wrong - auth in GraphQL middleware loses Effect composition
const middleware = (req, res, next) => {
  if (!req.headers.authorization) return res.status(401);
  next();
};

// Correct - auth in gateway via Effect context
const result = await Effect.runPromise(
  Effect.gen(function* () {
    const authPort = yield* AuthPortTag;
    yield* authPort.verifyAccess({ token, ... });
    // ... proceed with operation
  }).pipe(Effect.provide(appLayer))
);
```

### Pitfall 3: Explicit Return Types on Gateways

```typescript
// Wrong - explicit return types break inference
verifyAccess(req: AccessCheckRequest): Effect.Effect<void, AuthError, never> {
  return Effect.gen(...);  
}

// Correct - let TypeScript infer from IAuthPort interface
verifyAccess(req: AccessCheckRequest) {
  return Effect.gen(...);
}
```

### Pitfall 4: Forgetting to Add Auth Layer

```typescript
// Wrong - missing auth layer causes runtime error
const appLayer = Layer.mergeAll(
  makeRepositoryLayers(db),
  // Missing: makeAuthLayer(supabase)
);

// Correct - include auth layer
const appLayer = Layer.mergeAll(
  makeAuthLayer(supabase),
  makeRepositoryLayers(db),
  makeServiceLayers(supabase),
);
```

---

## Migration Guide

### Adding Auth to Existing Gateway

1. **Add auth token parameter** to gateway methods:
```typescript
// Before
findById(id: TripId): Effect.Effect<Trip | null, Error, never>

// After
findById(id: TripId, authToken: string): Effect.Effect<Trip | null, Error, never>
```

2. **Add auth verification** in method body:
```typescript
findById(id: TripId, authToken: string) {
  return Effect.gen(function* () {
    const authPort = yield* AuthPortTag;
    yield* authPort.verifyAccess({ token: authToken, ... });
    return yield* this.performFindById(id);
  });
}
```

3. **Update resolvers** to pass access token:
```typescript
resolve: async (_parent, args, ctx) => {
  const result = await ctx.runWithAppLayer(
    Effect.gen(function* () {
      const tripPort = yield* TripPortTag;
      return yield* tripPort.findById(id, ctx.accessToken); // Pass token
    })
  );
}
```

4. **Update tests** with mock auth layer or real tokens:
```typescript
const testLayer = Layer.mergeAll(
  mockAuthLayer,  // Add this
  mockRepositoryLayer,
);
```

---

## References

- [Effect Documentation](https://effect.website/)
- [Pothos Scope Auth Plugin](https://pothos-graphql.dev/docs/plugins/scope-auth)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- Project AGENTS.md - Effect patterns
- Project CLAUDE.md - Clean Architecture conventions
