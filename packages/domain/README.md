# @repo/domain - Domain Layer

> **Innermost layer of Clean Architecture - Pure business logic**
>
> ZERO external dependencies. Only pure TypeScript/JavaScript.

## Purpose

The domain layer contains:

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
│   └── .gitkeep
├── domain-services/      # Pure domain operations
│   └── .gitkeep
├── repositories/         # Repository INTERFACES only
│   └── .gitkeep
└── utils/                # Pure utilities
    ├── result.ts         # Result<T,E> type
    └── validation.ts     # Pure validation functions
```

## Example Usage

```typescript
// Creating an entity
import { User } from "@repo/domain";
import { Email } from "@repo/domain/value-objects/Email";

const result = User.create({ email: "user@example.com" });

if (result.isError()) {
  console.error(result.error);
} else {
  const user = result.value;
  console.log(user.id); // UUID
  console.log(user.email.value); // "user@example.com"
}
```

## Testing

All domain code must be tested with pure unit tests:

```typescript
import { describe, it, expect } from "bun:test";
import { User } from "./User";

describe("User", () => {
  it("should create with valid email", () => {
    const result = User.create({ email: "test@example.com" });
    expect(result.isSuccess()).toBe(true);
  });
});
```

## Error Handling

Always use `Result<T,E>` for operations that can fail:

```typescript
import { Result, ok, err } from "@repo/domain/utils/result";

function validateEmail(input: string): Result<Email, string> {
  if (!input.includes("@")) {
    return err("Invalid email format");
  }
  return ok(new Email(input));
}
```

## Branded Types

Use branded types to prevent mixing different kinds of IDs:

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

## References

- [CLAUDE.md](../../CLAUDE.md) - CEK Five Pillars (DDD section)
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Domain-Driven Design](https://www.domainlanguage.com/ddd/)
