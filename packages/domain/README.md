# @mirai-app/domain

> **Innermost layer of Clean Architecture - Pure business logic**
>
> Zero external dependencies. Only pure TypeScript/JavaScript.

## What this package exports

- **Entities**: Business objects with identity (User, Challenge, etc.)
- **Value Objects**: Immutable concepts without identity (Email, Money, DateRange)
- **Domain Services**: Pure business operations
- **Repository Interfaces**: Port definitions (implemented by adapters)
- **Utilities**: Pure functions (Result<T,E>, validation, etc.)

## Rules

1. **Zero External Dependencies**: No imports from outside this package
2. **No I/O Operations**: No database, network, or file system access
3. **Pure Functions**: Same input → same output, no side effects
4. **Immutable Entities**: State changes create new instances
5. **Result<T,E>**: All operations return Result for error handling

## Directory Structure

```
src/
├── index.ts              # Public exports
├── entities/             # Domain entities
│   └── .gitkeep
├── value-objects/        # Value objects
│   ├── AuthContext.ts    # 🔴 NEW: Auth context VO
│   └── .gitkeep
├── enums/                # 🔴 NEW: Enumeration types
│   └── UserRole.ts       # User roles (ADMIN, MODERATOR, USER)
├── types/                # 🔴 NEW: Core types
│   └── Result.ts         # Result<T,E> type
├── domain-services/      # Pure domain operations
│   └── .gitkeep
└── utils/                # Pure utilities
    ├── result.ts         # Result utilities (legacy)
    └── validation.ts     # Validation functions
```

## Creating an Entity

```typescript
import { User } from "@mirai-app/domain";
import { isOk, isErr } from "@mirai-app/domain";

const result = User.create({ email: "user@example.com" });

if (isErr(result)) {
  console.error(result.error);
} else {
  const user = result.value;
  console.log(user.id);
  console.log(user.email.value);
}
```

## Testing

Test domain code with pure unit tests:

```typescript
import { describe, it, expect } from "bun:test";
import { isOk, isErr } from "@mirai-app/domain";
import { User } from "./User";

describe("User", () => {
  it("creates with valid email", () => {
    const result = User.create({ email: "test@example.com" });
    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value.email.value).toBe("test@example.com");
    }
  });

  it("rejects invalid email", () => {
    const result = User.create({ email: "invalid" });
    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.message).toContain("Invalid");
    }
  });
});
```

## Error Handling with Result<T,E>

The domain uses `Result<T, E>` for operations that fail:

```typescript
import { Result, ok, err, isOk, isErr } from "./types/Result";

function validateEmail(input: string): Result<Email, string> {
  if (!input.includes("@")) {
    return err("Invalid email format");
  }
  return ok(new Email(input));
}

// Usage with type guards:
const result = validateEmail("user@example.com");
if (isOk(result)) {
  console.log(result.value); // Email
} else {
  console.error(result.error); // string
}

// Usage with discriminated unions:
if (result.kind === "ok") {
  console.log(result.value); // Email
} else {
  console.error(result.error); // string
}
```

### Result<T,E> Type

```typescript
type Result<T, E> = { kind: "ok"; value: T } | { kind: "err"; error: E };
```

**Helpers:**

- `ok(value)` - Create success result
- `err(error)` - Create error result
- `isOk(result)` - Type guard for success
- `isErr(result)` - Type guard for error

## AuthContext

`AuthContext` holds authentication state as an immutable value object:

```typescript
import { AuthContext, UserRole, UserId } from "@mirai-app/domain";
import { isOk } from "@mirai-app/domain";

// Create AuthContext
const result = AuthContext.create({
  userId: createUserId("uuid-123"),
  role: UserRole.USER,
  email: "user@example.com",
  authenticatedAt: new Date(),
});

if (isOk(result)) {
  const auth = result.value;

  // Access properties
  console.log(auth.userId); // Branded UserId
  console.log(auth.role); // UserRole.USER
  console.log(auth.email); // "user@example.com"
  console.log(auth.isAdmin()); // false

  // Check permissions
  if (auth.hasRoleAtLeast(UserRole.MODERATOR)) {
    // User is moderator or admin
  }

  // Immutable updates
  const adminAuth = auth.withRole(UserRole.ADMIN);
}
```

### UserRole Enum

```typescript
import { UserRole, isAdminRole, isModeratorRole } from "@mirai-app/domain";

// Values
UserRole.USER; // "USER"
UserRole.MODERATOR; // "MODERATOR"
UserRole.ADMIN; // "ADMIN"

// Type guard
const role: string = getRoleFromSomewhere();
if (isAdminRole(role)) {
  // role is typed as UserRole.ADMIN
}

// Hierarchy check
isModeratorOrBetter(UserRole.MODERATOR); // true
isModeratorOrBetter(UserRole.ADMIN); // true
isModeratorOrBetter(UserRole.USER); // false
```

## Branded Types

Branded types prevent mixing different kinds of IDs:

```typescript
type UserId = string & { readonly brand: unique symbol };

function createUserId(id: string): UserId {
  return id as UserId;
}

const userId = createUserId("uuid-123");
const challengeId = createChallengeId("uuid-456");

// TypeScript prevents accidental mixing:
// userId === challengeId  // Compile error!
```

AuthContext uses branded `UserId` to distinguish user identifiers from other IDs.

## References

- [CLAUDE.md](../../CLAUDE.md) - CEK Five Pillars (DDD section)
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Domain-Driven Design](https://www.domainlanguage.com/ddd/)
