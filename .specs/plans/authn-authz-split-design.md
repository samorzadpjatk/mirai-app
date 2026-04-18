# AuthN/AuthZ Split Design

> Clean Architecture separation of Authentication (AuthN) and Authorization (AuthZ) responsibilities

## Overview

This design splits the existing `IAuthPort` into two distinct interfaces following the **Single Responsibility Principle**:

- **IAuthNPort**: Authentication (Who are you?) - JWT validation, sessions, sign-in/out
- **IAuthZPort**: Authorization (What can you do?) - Role-based permissions, resource access

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  IAuthNPort (Infrastructure Layer)                          │
│  ├── signInWithPassword/email/otp                            │
│  ├── signOut()                                               │
│  ├── getSession()                                            │
│  └── refreshSession()                                        │
│                                                              │
│  Implemented by: SupabaseAuthGateway (or Better Auth)        │
│  DI Tag: AuthNPortTag                                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  IAuthZPort (Domain Layer)                                │
│  ├── verifyAccess(request: AccessCheckRequest)             │
│  └── checkRolePermission(userId, role, resource, action)  │
│                                                              │
│  Implemented by: UserDrizzleGateway                          │
│  (has User entity with Role enum + trip_participants)      │
│  DI Tag: AuthZPortTag                                        │
└─────────────────────────────────────────────────────────────┘
```

## Key Benefits

1. **Single Responsibility**: AuthN and AuthZ are separate concerns
2. **Role-Aware**: UserDrizzleGateway already has Role enum and user data
3. **Pluggable AuthN**: Can swap Supabase for Better Auth without touching AuthZ
4. **Testability**: Mock AuthN and AuthZ independently
5. **Clean Architecture**: Domain logic (AuthZ) separate from infrastructure (AuthN)

## Interface Definitions

### IAuthNPort (Domain Layer)

```typescript
// packages/domain/src/auth/ports/AuthNPort.ts
export interface IAuthNPort {
  // Session management
  signInWithPassword(email: string, password: string): Effect.Effect<AuthSession, IPortError, never>;
  signInWithOtp(email: string, otp: string): Effect.Effect<AuthSession, IPortError, never>;
  signUp(email: string, password: string): Effect.Effect<AuthUser, IPortError, never>;
  signOut(): Effect.Effect<void, IPortError, never>;
  
  // Session validation
  getSession(): Effect.Effect<AuthSession | null, IPortError, never>;
  refreshSession(): Effect.Effect<AuthSession, IPortError, never>;
}

export interface AuthSession {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

export interface AuthUser {
  id: string;
  email: string;
  emailConfirmed: boolean;
}
```

### IAuthZPort (Domain Layer) with Role Integration

```typescript
// packages/domain/src/auth/ports/AuthZPort.ts
export interface IAuthZPort {
  // Main authorization check
  verifyAccess(request: AccessCheckRequest): Effect.Effect<void, IPortError, never>;
  
  // Role-aware permission checking
  checkRolePermission(
    userId: string, 
    role: Role, 
    resourceType: ResourceType, 
    requiredPermission: PermissionLevel
  ): Effect.Effect<boolean, IPortError, never>;
}

// AccessCheckRequest (existing, moved to shared types)
export interface AccessCheckRequest {
  token: string;
  resourceType: ResourceType;
  resourceId: string;
  requiredPermission: PermissionLevel;
  requireOwnership?: boolean;
}

// Role enum (existing in User domain)
export enum Role {
  ADMIN = "admin",
  ORGANIZER = "organizer",
  PARTICIPANT = "participant",
  USER = "user"
}

export type ResourceType = 
  | "trip" | "group" | "challenge" | "user" | "activity"
  | "notification" | "reward" | "sponsor" | "coin" | "challengeSubmission";

export type PermissionLevel = "read" | "write" | "admin";
```

## Implementation Strategy

### Phase 1: Create New Interfaces (No Breaking Changes)

1. **Create IAuthNPort interface** - Extract AuthN methods from existing IAuthPort
2. **Create IAuthZPort interface** - Keep AuthZ methods, add Role integration
3. **Mark IAuthPort as deprecated** - For backward compatibility during migration

### Phase 2: Update Implementations

| File | Responsibility |
|------|--------------|
| `SupabaseAuthGateway` | Implements **IAuthNPort** only (JWT, sessions) |
| `UserDrizzleGateway` | Implements **IAuthZPort** (Role-based permissions) |
| `SupabaseAuthGateway` | Remove verifyAccess (moved to UserDrizzleGateway) |

### Phase 3: Update DI Layer

```typescript
// packages/frameworks/src/di/layer/auth.ts

// AuthN Layer - Infrastructure
export const makeAuthNLayer = ({ supabase }: AuthNLayerConfig) =>
  Layer.succeed(AuthNPortTag, new SupabaseAuthGateway(supabase));

// AuthZ Layer - Domain (requires database for Role checks)
export const makeAuthZLayer = ({ db }: AuthZLayerConfig) =>
  Layer.succeed(AuthZPortTag, new UserDrizzleGateway(db));

// Combined for convenience
export const makeAuthLayer = ({ supabase, db }: AuthLayerConfig) =>
  Layer.mergeAll(makeAuthNLayer({ supabase }), makeAuthZLayer({ db }));
```

### Phase 4: Migrate All Gateways

**Gateway Migration Pattern:**
```typescript
// Example: GroupDrizzleGateway.findById
findById(id: GroupId, _authToken?: string) {
  return Effect.gen(function* () {
    // Optional auth for public groups
    if (_authToken) {
      const authNPort = yield* AuthNPortTag;
      const authZPort = yield* AuthZPortTag;
      
      // Step 1: Validate JWT (AuthN)
      const session = yield* authNPort.getSession();
      if (!session) {
        return yield* Effect.fail(new AuthSessionExpiredError());
      }
      
      // Step 2: Check Role-based permissions (AuthZ)
      yield* authZPort.verifyAccess({
        token: _authToken,
        resourceType: "group",
        resourceId: GroupId.toString(id),
        requiredPermission: "read"
      });
    }
    
    return yield* this.performFindById(id);
  });
}
```

## Gateway Migration Priority

**HIGH Priority (sensitive data):**
1. **GroupDrizzleGateway** - group membership, private data
2. **ChallengeDrizzleGateway** - trip-specific challenges
3. **RewardDrizzleGateway** - coins/rewards (financial)
4. **CoinTransactionDrizzleGateway** - financial transactions

**MEDIUM Priority:**
5. ActivityFeedDrizzleGateway - privacy settings dependent
6. NotificationDrizzleGateway - user-scoped
7. SponsorDrizzleGateway - mixed public/private
8. ChallengeSubmissionDrizzleGateway - user content

## Error Handling

### AuthN Errors (IAuthNPort)
```typescript
export class AuthSessionExpiredError extends Data.TaggedError("AuthSessionExpiredError")<{
  expiredAt?: Date;
}> implements IPortError {
  override readonly message = "Authentication session has expired";
}

export class TokenMissingError extends Data.TaggedError("TokenMissingError")<{
  operation: string;
}> implements IPortError {
  override readonly message = "Authentication token is required";
}
```

### AuthZ Errors (IAuthZPort)
```typescript
export class PermissionDeniedError extends Data.TaggedError("PermissionDeniedError")<{
  action: string;
  resource: string;
  userId?: string;
}> implements IPortError {
  override readonly message = "Permission denied for this action";
}

export class ForbiddenError extends Data.TaggedError("ForbiddenError")<{
  resource: string;
  reason?: string;
}> implements IPortError {
  override readonly message = "Access to this resource is forbidden";
}
```

## Testing Strategy

### AuthN Testing (Mock Supabase)
```typescript
const mockAuthNLayer = Layer.succeed(AuthNPortTag, {
  getSession: () => Effect.succeed({ user: mockUser, accessToken: "token" }),
  signInWithPassword: () => Effect.succeed(mockSession),
  // ... other methods
});
```

### AuthZ Testing (Mock with Role data)
```typescript
const mockAuthZLayer = Layer.succeed(AuthZPortTag, {
  verifyAccess: (request) => {
    // Mock role-based permission logic
    if (request.resourceType === "trip" && request.requiredPermission === "read") {
      return Effect.succeed(void 0); // Allow
    }
    return Effect.fail(new PermissionDeniedError({ ... }));
  },
  checkRolePermission: () => Effect.succeed(true)
});
```

## Migration Guide for Existing Code

### Before (Mixed IAuthPort)
```typescript
// Old pattern
const authPort = yield* AuthPortTag;
yield* authPort.verifyAccess({ token, resourceType, resourceId, permission });
```

### After (Split AuthN/AuthZ)
```typescript
// New pattern - both may be needed
const authNPort = yield* AuthNPortTag;
const authZPort = yield* AuthZPortTag;

// Validate session first (AuthN)
const session = yield* authNPort.getSession();

// Then check permissions (AuthZ)
yield* authZPort.verifyAccess({ token, resourceType, resourceId, permission });
```

## Backward Compatibility

During migration period:
1. Keep `IAuthPort` as alias: `type IAuthPort = IAuthNPort & IAuthZPort`
2. Keep `AuthPortTag` as alias for both
3. Mark as `@deprecated` with migration instructions
4. Remove in next major version

## Files to Create/Modify

### Domain Layer
- `packages/domain/src/auth/ports/AuthNPort.ts` - New
- `packages/domain/src/auth/ports/AuthZPort.ts` - New
- `packages/domain/src/auth/index.ts` - Update exports

### Use-Cases Layer
- `packages/use-cases/src/auth/ports/AuthNPort.ts` - AuthNPortTag
- `packages/use-cases/src/auth/ports/AuthZPort.ts` - AuthZPortTag
- `packages/use-cases/src/auth/index.ts` - Update exports

### Adapters Layer
- `SupabaseAuthGateway.ts` - Implement IAuthNPort only
- `UserDrizzleGateway.ts` - Implement IAuthZPort

### Frameworks Layer
- `di/layer/auth.ts` - Separate makeAuthNLayer/makeAuthZLayer
- `di/index.ts` - Export new layers

### All Gateways
- Add `authToken?: string` to protected methods
- Use both AuthNPort and AuthZPort in Effect.gen

## Performance Considerations

1. **AuthN calls** (JWT validation) should be cached when possible
2. **AuthZ calls** (Role checks) can leverage existing User cache
3. **Optional auth** pattern for public resources - skip both ports
4. **Fail-fast**: Check AuthN before AuthZ to avoid unnecessary DB queries

## Security Best Practices

1. Never expose full tokens in error messages or logs
2. Use token redaction utilities: `sanitizeAccessCheckRequest()`
3. Fail-secure: Deny access on any error
4. Role checks in UserGateway (closest to user data)
5. JWT validation in SupabaseAuthGateway (infrastructure)

---

**Status**: Design validated
**Next Step**: Implementation via sdd:implement
