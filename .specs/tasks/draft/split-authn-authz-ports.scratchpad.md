# Research: Role Enum and IAuthPort Structure

## Task Context
Split IAuthPort into IAuthNPort (authentication) and IAuthZPort (authorization) - UserDrizzleGateway will implement IAuthZPort because it has Role data.

---

## Findings

### 1. Role Enum Location and Values

**File:** `packages/domain/src/user/entities/User.ts`

```typescript
export type Role = "USER" | "ADMIN" | "MODERATOR" | "SERVICE";
```

Note: This is a **type alias**, not an enum. Values:
- USER (default)
- ADMIN
- MODERATOR
- SERVICE

Also defined in Drizzle schema:
**File:** `packages/frameworks/src/drizzle/schema/user.ts` (line 14-19)

```typescript
export const roleEnum = pgEnum("Role", [
  "USER",
  "ADMIN",
  "MODERATOR",
  "SERVICE",
]);
```

### 2. Role Relation to User Entity

**File:** `packages/domain/src/user/entities/User.ts`

Role is a **property on the User entity** (line 22):

```typescript
export class User {
  private constructor(
    readonly id: UserId,
    readonly authUserId: AuthUserId,
    readonly firstName: string,
    readonly lastName: string,
    readonly hasAvatar: boolean,
    readonly role: Role,  // <-- Role is a direct property
    readonly lastSeenOn: Date | null,
    readonly createdAt: Date,
    readonly updatedAt: Date,
  ) {}
```

Methods on User that use role (lines 114-123):
- `hasRole(role: Role): boolean` - Check if user has specific role
- `isAdmin(): boolean` - Check if role is ADMIN or MODERATOR
- `withRole(role: Role): User` - Immutable role update

### 3. Trip Participants Role Column

**File:** `packages/frameworks/src/drizzle/schema/trip.ts` (line 94)

```typescript
export const tripParticipants = pgTable(
  "TripParticipant",
  {
    // ... other fields
    role: varchar("role", { length: 20 }).notNull().default("MEMBER"),
    // ...
  },
);
```

Note: trip_participants has its own role column with values like "MEMBER", "ADMIN", "OWNER" (per SupabaseAuthGateway line 293), which is **separate from User.role**.

### 4. UserDrizzleGateway Role Data Access

**File:** `packages/adapters/src/user/gateways/drizzle/UserDrizzleGateway.ts`

UserDrizzleGateway accesses user.role from the users table in these queries:
- `findByTripId()` (lines 52-62) - Selects users.role via JOIN with tripParticipants
- `search()` (lines 126-169) - Selects users.role in search queries

The gateway gets role data from the database and maps it via UserMapper to create User entities.

### 5. Current IAuthPort Interface Methods

**File:** `packages/domain/src/shared/services/index.ts`

Current IAuthPort combines AuthN and AuthZ:

```typescript
export interface IAuthPort {
  // AUTHENTICATION methods (AuthN):
  signInWithPassword(email: string, password: string): Effect<...>
  signInWithOtp(email: string, otp: string): Effect<...>
  signUp(email: string, password: string): Effect<...>
  signOut(): Effect<void, ...>
  getSession(): Effect<...>
  refreshSession(): Effect<...>
  
  // AUTHORIZATION method (AuthZ):
  verifyAccess(request: AccessCheckRequest): Effect<void, ...>
}
```

**File:** `packages/domain/src/auth/types.ts` (lines 85-103)

Alternative IAuthPort location (duplicate definition in auth/types.ts - only has verifyAccess method).

The verifyAccess method checks:
1. Token validation (AuthN) - Supabase JWT validation
2. Resource ownership/permissions (AuthZ) - Database checks

### 6. AccessCheckRequest Structure

**File:** `packages/domain/src/auth/types.ts` (lines 30-45)

```typescript
export interface AccessCheckRequest {
  token: string;
  resourceType: ResourceType;  // "trip" | "group" | "challenge" | ...
  resourceId: string;
  requiredPermission: PermissionLevel;  // "read" | "write" | "admin"
  requireOwnership?: boolean;
}
```

### 7. Other Role-Related Structures

**AuthUserInfo interface** (packages/domain/src/shared/services/index.ts, line 149-156):
```typescript
export interface AuthUserInfo {
  id: string;
  email: string | null;
  bannedUntil: string | null;
  banReason: string | null;
  isBanned: boolean;
  role: string | null;  // Role from external auth service
}
```

**IAuthServicePort** (lines 171-199): Interface for admin operations with auth service including getUserInfoByAuthId() that returns role.

---

## Summary for Split Design

1. **IAuthNPort** should contain: signInWithPassword, signInWithOtp, signUp, signOut, getSession, refreshSession
   - Implemented by SupabaseAuthGateway (existing)

2. **IAuthZPort** should contain: verifyAccess (with role-based checks)
   - Will be implemented by UserDrizzleGateway (has access to User.role)
   - Can also check trip_participants.role for trip-specific permissions

3. **Role data location:**
   - User.role: stored in users table (USER, ADMIN, MODERATOR, SERVICE)
   - trip_participants.role: stored in TripParticipant table (MEMBER, ADMIN, OWNER)
</content>