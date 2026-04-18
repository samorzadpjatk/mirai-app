# Gateway Auth Protection Design

> Clean Architecture auth solution with SupabaseAuthGateway protecting gateway operations

## Overview

This design implements gateway-level authentication and authorization where `SupabaseAuthGateway` serves as the single source of truth for access control. All domain gateways validate access via Effect's dependency injection system before performing data operations.

## Architecture

### Core Pattern

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

### Benefits

- **Declarative**: Gateways specify what they need, not how to get it
- **Composable**: Different auth strategies via Effect Layers
- **Testable**: Mock auth port to bypass auth in tests
- **Clean Architecture**: Domain logic stays pure, infrastructure injected

## Port Interface

### IAuthPort (Domain Layer)

```typescript
// packages/domain/src/auth/ports/AuthPort.ts
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
  resourceType: "trip" | "group" | "challenge" | "user" | "activity" | "notification" | "reward" | "sponsor" | "coin" | "submission";
  resourceId: string;
  requiredPermission: "read" | "write" | "admin";
  requireOwnership?: boolean;
}
```

### Error Types

```typescript
// packages/domain/src/auth/errors/AuthErrors.ts
export class AuthSessionExpiredError extends Data.TaggedError("AuthSessionExpiredError")<{
  token: string;
}> implements IPortError {
  readonly message = "Session expired or invalid";
}

export class PermissionDeniedError extends Data.TaggedError("PermissionDeniedError")<{
  userId: string;
  resourceType: string;
  resourceId: string;
  requiredPermission: string;
}> implements IPortError {
  readonly message = "Permission denied for requested resource";
}
```

## Layer Composition

### Auth Layer

```typescript
// packages/frameworks/src/di/layer/auth.ts
export const makeAuthLayer = (supabase: SupabaseClient) => {
  return Layer.succeed(
    AuthPortTag,
    new SupabaseAuthGateway(supabase)
  );
};
```

### App Layer

```typescript
// packages/frameworks/src/di/layer/app.ts
export const makeAppLayer = (config: { db: DrizzleDB; supabase: SupabaseClient }) => {
  return Layer.mergeAll(
    makeAuthLayer(config.supabase),
    makeRepositoryLayers(config.db),
    makeServiceLayers(config.supabase),
  );
};
```

## Gateway Implementation

### Example: TripDrizzleGateway

```typescript
// packages/adapters/src/trip/gateways/drizzle/TripDrizzleGateway.ts
import { AuthPortTag } from "@mirai-app/use-cases/auth/ports";

export class TripDrizzleGateway implements ITripPort {
  findById(id: TripId, authToken: string) {
    return Effect.gen(function* () {
      // Get auth port from Effect context
      const authPort = yield* AuthPortTag;
      
      // Unified verification
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
}
```

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
});
```

## Error Handling

### Mapping to GraphQL

```typescript
// packages/frameworks/src/graphql/errors.ts
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

## Testing Patterns

### Bypass Auth in Tests

```typescript
const mockAuthLayer = Layer.succeed(
  AuthPortTag,
  {
    verifyAccess: () => Effect.succeed(void 0),
  } as IAuthPort
);

const testLayer = Layer.mergeAll(mockAuthLayer, mockRepositoryLayer);
```

### Integration Testing

```typescript
const result = await Effect.runPromise(
  tripGateway.findById(tripId, validToken).pipe(
    Effect.provide(realAppLayer)
  )
);
expect(result).toBeRight();
```

## Layer Responsibilities

| Layer | Responsibility |
|-------|---------------|
| GraphQL Resolver | Extract token from request, pass to gateway |
| Gateway | Declare auth dependency via `AuthPortTag`, call `verifyAccess()` before data operations |
| SupabaseAuthGateway | Single source of truth: validate JWT + check resource permissions against domain tables |
| Error Handling | Domain errors → GraphQL errors at boundary |
| Testing | Mock `AuthPortTag` to bypass, or use real layer for integration tests |

## Implementation Notes

1. **Port Naming**: Follow existing convention - `IAuthPort` (domain), `AuthPortTag` (use-cases)
2. **Type Inference**: Gateway implementations use inferred return types (no explicit annotations)
3. **No Declaration Merging**: Interface and Tag class have distinct names
4. **Supabase Integration**: Auth gateway queries both Supabase Auth (session) and domain tables (permissions)
5. **Realtime Sync**: Session changes via Supabase Realtime propagate to verification results

## Files to Create/Modify

### Domain Layer
- `packages/domain/src/auth/ports/AuthPort.ts` - Interface
- `packages/domain/src/auth/errors/AuthErrors.ts` - Error types

### Use-Cases Layer
- `packages/use-cases/src/auth/ports/AuthPort.ts` - Context.Tag

### Adapters Layer
- `packages/adapters/src/auth/gateways/supabase/SupabaseAuthGateway.ts` - Implementation

### Frameworks Layer
- `packages/frameworks/src/di/layer/auth.ts` - Layer factory
- Update `packages/frameworks/src/di/layer/app.ts` - Include auth layer

### Migration
- Update existing gateways to accept `authToken` parameter
- Add auth verification to gateway methods

---

**Status**: Design validated
**Next Step**: Implementation via `/sdd:implement`
