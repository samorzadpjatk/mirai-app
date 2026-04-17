# Explicit Return Type Annotations Design

**Status:** Draft  
**Date:** 2026-04-17  
**Version:** 1.1.0  
**Topic:** TypeScript return type annotation conventions for Effect-based codebase

---

## Summary

This design establishes **inference-first** approach for return type annotations in the Effect-based monorepo. Explicit annotations are only required when TypeScript cannot infer types correctly or for public interface definitions.

**Key Principles:**

1. **Abstract error interfaces** allow concrete error implementations to compose naturally
2. **Inference for implementations** — classes implementing interfaces use type inference
3. **Explicit for contracts** — interface definitions remain explicit
4. **ESLint guards** — automated checks catch unsafe inference (`any`, `unknown`)

---

## Problem Statement

### Current State

All class methods have explicit return type annotations:

```typescript
class GroupDrizzleGateway implements IGroupPort {
  findById(id: string): Effect.Effect<Group | null, DatabaseError, never> {
    return this.tryPromise(...);
  }

  findByTripId(tripId: string): Effect.Effect<Group[], DatabaseError, never> {
    return this.tryPromise(...);
  }
  // ... 20+ methods, all explicitly typed
}
```

**Issues:**

- Verbose and repetitive
- Error types are locked to single type, preventing natural union composition
- Maintenance burden when error types evolve
- Reduced readability with long type signatures

### Desired State

Use inference where possible, with abstract error types enabling composition:

```typescript
class GroupDrizzleGateway implements IGroupPort {
  // Inferred: Effect<Group | null, DatabaseError | NotFoundError, never>
  findById(id: string) {
    return Effect.gen(function* () {
      const result = yield* this.tryPromise(...);
      if (!result) return yield* Effect.fail(new NotFoundError());
      return result;
    });
  }
}
```

---

## Solution Design

### 1. Abstract Error Interface

Create `IPortError` interface in domain layer:

```typescript
// packages/domain/src/shared/errors/ports.ts

export interface IPortError {
  readonly _tag: string;
  readonly message: string;
}

// Concrete implementations implement the interface
export class DatabaseError
  extends Data.TaggedError("DatabaseError")<{
    cause: unknown;
  }>
  implements IPortError
{
  readonly message = "Database operation failed";
}

export class NotFoundError
  extends Data.TaggedError("NotFoundError")<{
    readonly entity: string;
    readonly id: string;
  }>
  implements IPortError
{
  get message(): string {
    return `${this.entity} with id ${this.id} not found`;
  }
}
```

### 2. Interface Definitions (Explicit)

Port interfaces use abstract error type:

```typescript
// packages/domain/src/user/ports/UserPort.ts
export interface IUserPort {
  findById(id: UserId): Effect.Effect<User | null, IPortError, never>;
  create(user: User): Effect.Effect<User, IPortError, never>;
  update(user: User): Effect.Effect<User, IPortError, never>;
}
```

### 3. Implementation (Inference)

Gateway implementations use inference:

```typescript
// packages/adapters/src/user/gateways/drizzle/UserDrizzleGateway.ts
export class UserDrizzleGateway implements IUserPort {
  // Inferred: Effect<User | null, DatabaseError | NotFoundError, never>
  findById(id: UserId) {
    return Effect.gen(function* () {
      const result = yield* Effect.tryPromise({
        try: () => this.db.query.users.findFirst({ where: eq(users.id, id) }),
        catch: (error) => new DatabaseError({ cause: error }),
      });

      if (!result) {
        return yield* Effect.fail(new NotFoundError({ entity: "User", id }));
      }

      return this.mapper.toDomain(result);
    });
  }

  // Inferred: Effect<User, DatabaseError, never>
  create(user: User) {
    return Effect.tryPromise({
      try: () => this.db.insert(users).values(this.mapper.toInsert(user)),
      catch: (error) => new DatabaseError({ cause: error }),
    }).pipe(Effect.map(() => user));
  }
}
```

### 4. ESLint Configuration

Add rule to catch unsafe inference while allowing interface implementations:

```javascript
// eslint.config.mjs
export default [
  // General rule: require explicit for exported functions
  {
    files: ["packages/*/src/**/*.ts"],
    rules: {
      "@typescript-eslint/explicit-function-return-type": [
        "error",
        {
          allowExpressions: true,
          allowTypedFunctionExpressions: true,
          allowHigherOrderFunctions: true,
          allowDirectConstAssertionInArrowFunctions: true,
          allowedNames: [],
        },
      ],
      "@typescript-eslint/explicit-module-boundary-types": "error",
    },
  },

  // Override for interface implementations: allow inference
  {
    files: ["packages/adapters/src/**/*.ts", "packages/use-cases/src/**/*.ts"],
    rules: {
      "@typescript-eslint/explicit-function-return-type": [
        "error",
        {
          allowExpressions: true,
          allowTypedFunctionExpressions: true,
          allowHigherOrderFunctions: true,
          // Key: allows inference for interface implementations
          allowOverrideWithoutType: true,
        },
      ],
    },
  },
];
```

### 5. Testing Patterns with Either

Use `Effect.either` and `Either.isLeft()`/`Either.isRight()` for error testing:

```typescript
import { Effect, Either } from "effect";

// Pattern 1: Testing errors with Either.isLeft and instanceof
it("should return error when user not found", async () => {
  const gateway = new UserDrizzleGateway(db);

  const either = await Effect.runPromise(
    Effect.either(gateway.findById("nonexistent-id")),
  );

  expect(Either.isLeft(either)).toBe(true);
  if (Either.isLeft(either)) {
    // Use instanceof for type-safe error checking
    expect(either.left).toBeInstanceOf(NotFoundError);
  }
});

// Pattern 2: Testing success with Either.isRight
it("should return user when found", async () => {
  const gateway = new UserDrizzleGateway(db);

  const either = await Effect.runPromise(
    Effect.either(gateway.findById("valid-id")),
  );

  expect(Either.isRight(either)).toBe(true);
  if (Either.isRight(either)) {
    expect(either.right.id).toBe("valid-id");
  }
});

// Pattern 3: Using Either.match for cleaner handling
it("should handle both cases", async () => {
  const gateway = new UserDrizzleGateway(db);

  const result = await Effect.runPromise(
    Effect.gen(function* () {
      const either = yield* Effect.either(gateway.findById("id"));

      return Either.match(either, {
        onLeft: (error) => `Error: ${error._tag}`,
        onRight: (user) => `User: ${user.id}`,
      });
    }),
  );

  expect(result).toMatch(/^Error:|User:/);
});
```

---

## Migration Strategy

### Phase 1: Setup (1-2 days)

1. Create `IPortError` interface in `packages/domain/src/shared/errors/ports.ts`
2. Update existing error classes to implement `IPortError`
3. Add ESLint configuration with override for interface implementations

### Phase 2: Pilot Domain (2-3 days)

1. Pick one domain (e.g., `user`) as pilot
2. Update `IUserPort` to use `IPortError`
3. Convert `UserDrizzleGateway` to use inference
4. Run full test suite to verify type safety

### Phase 3: Gradual Rollout (2-3 weeks)

1. Domain-by-domain migration
2. Each domain: update interface → convert implementations → verify tests
3. No big-bang rewrites — migrate as you touch files

### Phase 4: Enforcement (after rollout)

1. Enable strict lint rules
2. Code review checklist: "Does this method need explicit return type?"

---

## Benefits

1. **Better Error Composition** — Error unions form naturally: `DatabaseError | NotFoundError | ValidationError`
2. **Reduced Boilerplate** — No repetitive `Effect.Effect<T, E, never>` annotations
3. **Maintainability** — Changing error types doesn't require updating all method signatures
4. **Type Safety Preserved** — Interfaces enforce contracts; implementations get inference benefits
5. **IDE Support** — Hover shows inferred types clearly

---

## Guidelines by Layer

| Layer                                | Pattern                                   | Reasoning                                           |
| ------------------------------------ | ----------------------------------------- | --------------------------------------------------- |
| **Domain** (`packages/domain`)       | Explicit in interfaces                    | Contract definition must be clear                   |
| **Domain** (`packages/domain`)       | Abstract error types (`IPortError`)       | Enable concrete error composition                   |
| **Use-Cases** (`packages/use-cases`) | Inference preferred                       | Complex error composition in workflows              |
| **Adapters** (`packages/adapters`)   | Inference for interface impls             | Implementation details, interface enforces contract |
| **Tests**                            | `Effect.either` + `Either.isLeft/isRight` | Type-safe error testing without try/catch           |

---

## Decision Log

| Date       | Decision                            | Rationale                                                                 |
| ---------- | ----------------------------------- | ------------------------------------------------------------------------- |
| 2026-04-17 | Use abstract error interface        | Allows concrete errors to compose naturally via union types               |
| 2026-04-17 | Inference for implementations       | Reduces boilerplate while maintaining type safety through interfaces      |
| 2026-04-17 | ESLint `allowOverrideWithoutType`   | TypeScript checks interface compliance; no need for redundant annotations |
| 2026-04-17 | `Either.isLeft/isRight` for testing | Standard Effect pattern for type-safe error handling in tests             |
| 2026-04-17 | `instanceof` for error verification | Runtime type checking with full TypeScript inference                      |

---

## Changelog

### 2026-04-17 (Update)

- **Testing:** Updated patterns to use `instanceof` instead of `either.left._tag` for error type verification
- **Rationale:** `instanceof` provides both runtime verification and full TypeScript type narrowing

---

## References

- [Effect Error Management - Either](https://effect.website/docs/error-management/expected-errors/#either)
- [Effect Either Data Type](https://effect.website/docs/data-types/either/)
- [TypeScript ESLint - explicit-function-return-type](https://typescript-eslint.io/rules/explicit-function-return-type/)
