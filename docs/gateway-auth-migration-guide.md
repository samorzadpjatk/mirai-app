# Gateway Auth Migration Guide

This guide documents how to add authentication and authorization protection to existing gateways using the Effect-based auth patterns.

## Overview

The auth system uses a layered approach with Effect's Context.Tag for dependency injection. Gateways can optionally accept an auth token parameter and verify access before executing protected operations.

## Migration Steps

### Step 1: Update Domain Port Interface

Add optional `authToken` parameter to protected methods in the domain port interface:

```typescript
// packages/domain/src/{domain}/ports/{Domain}Port.ts

export interface I{Domain}Port {
  // Before
  findById(id: {Domain}Id): Effect.Effect<{Domain} | null, IPortError, never>;
  create({domain}: {Domain}): Effect.Effect<{Domain}, IPortError, never>;
  update({domain}: {Domain}): Effect.Effect<{Domain}, IPortError, never>;
  delete(id: {Domain}Id): Effect.Effect<void, IPortError, never>;
  
  // After - add optional authToken parameter
  findById(id: {Domain}Id, authToken?: string): Effect.Effect<{Domain} | null, IPortError, never>;
  create({domain}: {Domain}, authToken?: string): Effect.Effect<{Domain}, IPortError, never>;
  update({domain}: {Domain}, authToken?: string): Effect.Effect<{Domain}, IPortError, never>;
  delete(id: {Domain}Id, authToken?: string): Effect.Effect<void, IPortError, never>;
}
```

### Step 2: Update Use-Cases Port (if explicit interface exists)

Most use-cases ports use `Context.Tag` pattern which doesn't require interface updates. However, if there's an explicit interface definition, update it:

```typescript
// packages/use-cases/src/{domain}/ports/{Domain}Port.ts
// Usually no changes needed - the Context.Tag pattern automatically infers from domain interface
```

### Step 3: Update Gateway Implementation

Add auth verification to the gateway implementation using `Effect.gen` and `AuthPortTag`:

```typescript
// packages/adapters/src/{domain}/gateways/drizzle/{Domain}DrizzleGateway.ts

import { Effect } from "effect";
import { AuthPortTag } from "@mirai-app/use-cases";
import type { I{Domain}Port } from "@mirai-app/domain";

export class {Domain}DrizzleGateway implements I{Domain}Port {
  findById(id: {Domain}Id, authToken?: string) {
    return Effect.gen(function* () {
      // Verify access if token provided
      if (authToken) {
        const authPort = yield* AuthPortTag;
        yield* authPort.verifyAccess({
          token: authToken,
          resourceType: "{resourceType}", // e.g., "trip", "group", "challenge"
          resourceId: {Domain}Id.toString(id),
          requiredPermission: "read",
        });
      }
      
      // Proceed with database operation
      const result = yield* Effect.tryPromise({
        try: () => this.db.query.{domains}.findFirst({ where: eq({domains}.id, id) }),
        catch: (error) => new DatabaseError({ cause: error }),
      });
      
      if (!result) {
        return yield* Effect.fail(new NotFoundError({ entity: "{Domain}", id }));
      }
      
      return this.mapper.toDomain(result);
    });
  }

  create({domain}: {Domain}, authToken?: string) {
    return Effect.gen(function* () {
      // Verify write access if token provided
      if (authToken) {
        const authPort = yield* AuthPortTag;
        yield* authPort.verifyAccess({
          token: authToken,
          resourceType: "{resourceType}",
          resourceId: {Domain}Id.toString({domain}.id),
          requiredPermission: "write",
        });
      }
      
      // Proceed with create operation
      return yield* Effect.tryPromise({
        try: () => this.db.insert({domains}).values(this.mapper.toInsert({domain})),
        catch: (error) => new DatabaseError({ cause: error }),
      }).pipe(Effect.map(() => {domain}));
    });
  }

  update({domain}: {Domain}, authToken?: string) {
    return Effect.gen(function* () {
      if (authToken) {
        const authPort = yield* AuthPortTag;
        yield* authPort.verifyAccess({
          token: authToken,
          resourceType: "{resourceType}",
          resourceId: {Domain}Id.toString({domain}.id),
          requiredPermission: "write",
        });
      }
      
      const updateData = this.mapper.toUpdate({domain});
      return yield* Effect.tryPromise({
        try: () => this.db.update({domains})
          .set(updateData)
          .where(eq({domains}.id, {domain}.id))
          .returning(),
        catch: (error) => new DatabaseError({ cause: error }),
      }).pipe(
        Effect.flatMap((results) => {
          if (results.length === 0) {
            return Effect.fail(new NotFoundError({ entity: "{Domain}", id: {domain}.id }));
          }
          return Effect.succeed(this.mapper.toDomain(results[0]));
        })
      );
    });
  }

  delete(id: {Domain}Id, authToken?: string) {
    return Effect.gen(function* () {
      if (authToken) {
        const authPort = yield* AuthPortTag;
        yield* authPort.verifyAccess({
          token: authToken,
          resourceType: "{resourceType}",
          resourceId: {Domain}Id.toString(id),
          requiredPermission: "admin", // Delete requires admin permission
        });
      }
      
      return yield* Effect.tryPromise({
        try: () => this.db.delete({domains}).where(eq({domains}.id, id)),
        catch: (error) => new DatabaseError({ cause: error }),
      });
    });
  }
}
```

### Step 4: Add Resource Type to SupabaseAuthGateway

If the resource type is new, add it to the `verifyResourceOwnership` function:

```typescript
// packages/adapters/src/auth/gateways/supabase/SupabaseAuthGateway.ts

async function checkResourceAccess(
  supabase: SupabaseClient,
  userId: string,
  request: AccessCheckRequest,
): Promise<boolean> {
  switch (request.resourceType) {
    // ... existing cases
    
    case "{resourceType}": {
      // Query your domain table to check ownership/access
      const result = await (supabase.from as any)("{Domain}")
        .select("userId") // or "ownerId", "createdBy", etc.
        .eq("id", request.resourceId)
        .maybeSingle();
      
      if (result.error) return false;
      
      // Check if user owns the resource or has required permissions
      return result.data?.userId === userId;
    }
  }
}
```

### Step 5: Update GraphQL Resolvers (if applicable)

Pass the auth token from context to gateway methods:

```typescript
// apps/backend-server/src/graphql/resolvers/{domain}Resolvers.ts

export const {domain}Resolvers = {
  Query: {
    {domain}: async (_parent: unknown, args: { id: string }, ctx: GraphQLContext) => {
      const controller = ctx.controllers.{domain}Controller;
      // Pass accessToken from context
      const result = await controller.getById({ 
        id: args.id, 
        accessToken: ctx.accessToken // Add this
      });
      // ...
    },
  },
  Mutation: {
    create{Domain}: async (_parent: unknown, args: { input: Create{Domain}Input }, ctx: GraphQLContext) => {
      const controller = ctx.controllers.{domain}Controller;
      const result = await controller.create({ 
        input: args.input,
        accessToken: ctx.accessToken // Add this
      });
      // ...
    },
  },
};
```

## Supported Resource Types

The following resource types are already supported in `SupabaseAuthGateway`:

| Resource Type | Table(s) Queried | Permission Check |
|--------------|------------------|------------------|
| `trip` | `TripParticipant` | Role-based (OWNER/ADMIN for admin ops) |
| `group` | `Group`, `TripParticipant` | Organizer or member check |
| `challenge` | `Challenge`, `TripParticipant` | Trip membership |
| `user` | `User` | Self-access or public lookup |
| `activity` | `ActivityFeed`, `TripParticipant` | Trip membership |
| `notification` | `Notification` | User ownership |
| `reward` | `Reward`, `TripParticipant` | Trip membership |
| `sponsor` | `TripSponsor`, `TripParticipant` | Trip membership |
| `coin` | `CoinTransaction` | User ownership |
| `challengeSubmission` | `ChallengeSubmission`, `Challenge`, `TripParticipant` | Ownership or challenge access |

## Testing

Use the mock auth utilities for testing:

```typescript
import { describe, it, expect } from "bun:test";
import { Effect, Either } from "effect";
import { 
  createTestLayer,
  createAlwaysAllowMockAuth,
  createAlwaysDenyMockAuth,
  MockPermissionDeniedError 
} from "@mirai-app/frameworks/di";
import { {Domain}DrizzleGateway } from "@mirai-app/adapters";

describe("[UNIT] {Domain}DrizzleGateway with Auth", () => {
  it("should allow access with valid token", async () => {
    const gateway = new {Domain}DrizzleGateway(mockDb);
    const testLayer = createTestLayer();
    
    const effect = gateway.findById("domain-123", "valid-token");
    const either = await Effect.runPromise(
      Effect.either(effect.pipe(Effect.provide(testLayer)))
    );
    
    expect(Either.isRight(either)).toBe(true);
  });

  it("should deny access with invalid permissions", async () => {
    const gateway = new {Domain}DrizzleGateway(mockDb);
    const denyLayer = createTestLayer({
      authPort: createAlwaysDenyMockAuth(
        new MockPermissionDeniedError({ resourceType: "{resourceType}" })
      )
    });
    
    const effect = gateway.findById("domain-123", "invalid-token");
    const either = await Effect.runPromise(
      Effect.either(effect.pipe(Effect.provide(denyLayer)))
    );
    
    expect(Either.isLeft(either)).toBe(true);
    if (Either.isLeft(either)) {
      expect(either.left).toBeInstanceOf(MockPermissionDeniedError);
    }
  });

  it("should skip auth when token not provided", async () => {
    const gateway = new {Domain}DrizzleGateway(mockDb);
    const testLayer = createTestLayer();
    
    // No token = public operation
    const effect = gateway.findById("domain-123");
    const either = await Effect.runPromise(
      Effect.either(effect.pipe(Effect.provide(testLayer)))
    );
    
    expect(Either.isRight(either)).toBe(true);
  });
});
```

## Backward Compatibility

The auth token parameter is optional, ensuring backward compatibility:

```typescript
// Old code (without auth) continues to work
const trip = await tripRepo.findById("trip-123");

// New code (with auth) adds protection
const trip = await tripRepo.findById("trip-123", accessToken);
```

## Common Patterns

### Pattern 1: Optional Auth for Public Operations

```typescript
findById(id: {Domain}Id, authToken?: string) {
  return Effect.gen(function* () {
    // Only verify if token provided
    if (authToken) {
      const authPort = yield* AuthPortTag;
      yield* authPort.verifyAccess({ token: authToken, ... });
    }
    // ... proceed
  });
}
```

### Pattern 2: Required Auth for Protected Operations

```typescript
delete(id: {Domain}Id, authToken: string) { // Note: not optional
  return Effect.gen(function* () {
    // Auth is mandatory - will fail without token
    const authPort = yield* AuthPortTag;
    yield* authPort.verifyAccess({ 
      token: authToken, 
      requiredPermission: "admin" 
    });
    // ... proceed
  });
}
```

### Pattern 3: Different Permission Levels per Operation

```typescript
findById(id: {Domain}Id, authToken?: string) {
  // read permission
  yield* authPort.verifyAccess({ ..., requiredPermission: "read" });
}

create({domain}: {Domain}, authToken?: string) {
  // write permission
  yield* authPort.verifyAccess({ ..., requiredPermission: "write" });
}

delete(id: {Domain}Id, authToken?: string) {
  // admin permission
  yield* authPort.verifyAccess({ ..., requiredPermission: "admin" });
}
```

## Security Best Practices

1. **Never log tokens**: The `verifyAccess` implementation redacts tokens in logs
2. **Fail secure**: If auth check fails, deny access by default
3. **Use permission levels**: `read` < `write` < `admin`
4. **Test both paths**: Always test with and without auth tokens
5. **Keep token optional**: Maintain backward compatibility during migration

## Troubleshooting

### "Cannot find AuthPortTag"

Ensure you're importing from the correct location:
```typescript
import { AuthPortTag } from "@mirai-app/use-cases";
```

### "verifyAccess is not a function"

Ensure `makeAuthLayer()` is included in your app layer composition:
```typescript
// packages/frameworks/src/di/layer/app.ts
const appLayer = Layer.mergeAll(authLayer, repoLayer, serviceLayer);
```

### Type errors with Effect.gen

Ensure you're using `function*` (generator function) and `yield*` (with asterisk):
```typescript
Effect.gen(function* () {  // function* not function
  const authPort = yield* AuthPortTag;  // yield* not yield
});
```

## References

- Root `AGENTS.md` - Gateway-Level Auth Protection section
- `packages/frameworks/src/di/layer/test.ts` - Mock auth testing patterns
- `packages/adapters/src/auth/gateways/supabase/SupabaseAuthGateway.ts` - Auth implementation reference
