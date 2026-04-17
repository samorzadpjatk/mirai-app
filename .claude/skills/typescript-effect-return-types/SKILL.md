# TypeScript Effect Return Type Annotations

Guidelines for implementing explicit return type annotations convention with TypeScript and Effect framework, using an inference-first approach.

## Overview

This skill establishes **inference-first** conventions for return type annotations in Effect-based TypeScript codebases. Explicit annotations are only required when TypeScript cannot infer types correctly or for public interface definitions.

## Key Principles

1. **Abstract error interfaces** — Allow concrete error implementations to compose naturally via union types
2. **Inference for implementations** — Classes implementing interfaces use type inference
3. **Explicit for contracts** — Interface definitions remain explicit with abstract error types
4. **ESLint guards** — Automated checks catch unsafe inference (`any`, `unknown`)

## Abstract Error Interface Pattern

### IPortError Interface

Create a base error interface in the domain layer:

```typescript
// packages/domain/src/shared/errors/ports.ts

export interface IPortError {
  readonly _tag: string;
  readonly message: string;
}
```

### Concrete Error Implementations

All error classes implement `IPortError`:

```typescript
// packages/domain/src/shared/errors/ports.ts

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

export class ValidationError
  extends Data.TaggedError("ValidationError")<{
    field: string;
    message: string;
  }>
  implements IPortError
{
  get message(): string {
    return `${this.field}: ${this.message}`;
  }
}
```

## Layer Patterns

### Domain Layer: Explicit Interface Contracts

Port interfaces use abstract error types:

```typescript
// packages/domain/src/user/ports/UserPort.ts
import type { IPortError } from "../../shared/errors/ports";

export interface IUserPort {
  findById(id: UserId): Effect.Effect<User | null, IPortError, never>;
  create(user: User): Effect.Effect<User, IPortError, never>;
  update(user: User): Effect.Effect<User, IPortError, never>;
  delete(id: UserId): Effect.Effect<void, IPortError, never>;
}
```

### Adapter Layer: Inferred Implementation

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

  // Inferred: Effect<User, DatabaseError | NotFoundError | ValidationError, never>
  update(user: User) {
    return Effect.gen(function* () {
      const existing = yield* this.findById(user.id);
      if (!existing) {
        return yield* Effect.fail(
          new NotFoundError({ entity: "User", id: user.id }),
        );
      }

      if (!user.validate().valid) {
        return yield* Effect.fail(
          new ValidationError({ field: "user", message: "Invalid user data" }),
        );
      }

      yield* Effect.tryPromise({
        try: () => this.db.update(users).set(this.mapper.toUpdate(user)),
        catch: (error) => new DatabaseError({ cause: error }),
      });

      return user;
    });
  }

  // Inferred: Effect<void, DatabaseError, never>
  delete(id: UserId) {
    return Effect.tryPromise({
      try: () => this.db.delete(users).where(eq(users.id, id)),
      catch: (error) => new DatabaseError({ cause: error }),
    }).pipe(Effect.map(() => undefined));
  }
}
```

### Use-Case Layer: Orchestration with Inference

```typescript
// packages/use-cases/src/user/interactors/GetUserById.ts
export const GetUserById = ({ id }: GetUserByIdInput) =>
  Effect.gen(function* () {
    const userPort = yield* UserPortTag;
    const user = yield* userPort.findById(id);

    if (!user) {
      return yield* Effect.fail(new NotFoundError({ entity: "User", id }));
    }

    return user;
  });
```

## ESLint Configuration

### Base Configuration

```javascript
// eslint.config.base.js
export default defineConfig({
  files: ["packages/*/src/**/*.ts"],
  rules: {
    "@typescript-eslint/explicit-function-return-type": [
      "error",
      {
        allowExpressions: true,
        allowTypedFunctionExpressions: true,
        allowHigherOrderFunctions: true,
        allowDirectConstAssertionInArrowFunctions: true,
      },
    ],
    "@typescript-eslint/explicit-module-boundary-types": "error",
  },
});
```

### Adapter/Use-Case Override

```javascript
// packages/adapters/eslint.config.js or packages/use-cases/eslint.config.js
export default tseslint.config(
  // ... other config
  {
    files: ["src/**/*.ts"],
    rules: {
      "@typescript-eslint/explicit-function-return-type": [
        "error",
        {
          allowExpressions: true,
          allowTypedFunctionExpressions: true,
          allowHigherOrderFunctions: true,
          allowOverrideWithoutType: true, // Key: allows inference for interface impls
        },
      ],
    },
  },
);
```

## Testing Patterns with Either

### Error Testing with Either.isLeft

```typescript
import { Effect, Either } from "effect";

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
```

### Success Testing with Either.isRight

```typescript
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
```

### Pattern Matching with Either.match

```typescript
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

## Benefits

1. **Better Error Composition** — Error unions form naturally: `DatabaseError | NotFoundError | ValidationError`
2. **Reduced Boilerplate** — No repetitive `Effect.Effect<T, E, never>` annotations
3. **Maintainability** — Changing error types doesn't require updating all method signatures
4. **Type Safety Preserved** — Interfaces enforce contracts; implementations get inference benefits
5. **IDE Support** — Hover shows inferred types clearly

## Guidelines by Layer

| Layer                                | Pattern                                   | Reasoning                                           |
| ------------------------------------ | ----------------------------------------- | --------------------------------------------------- |
| **Domain** (`packages/domain`)       | Explicit in interfaces                    | Contract definition must be clear                   |
| **Domain** (`packages/domain`)       | Abstract error types (`IPortError`)       | Enable concrete error composition                   |
| **Use-Cases** (`packages/use-cases`) | Inference preferred                       | Complex error composition in workflows              |
| **Adapters** (`packages/adapters`)   | Inference for interface impls             | Implementation details, interface enforces contract |
| **Tests**                            | `Effect.either` + `Either.isLeft/isRight` | Type-safe error testing without try/catch           |

## Migration Strategy

### Phase 1: Setup

1. Create `IPortError` interface in `packages/domain/src/shared/errors/ports.ts`
2. Update existing error classes to implement `IPortError`
3. Add ESLint configuration with `allowOverrideWithoutType: true`

### Phase 2: Pilot Domain

1. Pick one domain (e.g., `user`) as pilot
2. Update `IUserPort` to use `IPortError`
3. Convert `UserDrizzleGateway` to use inference
4. Run full test suite to verify type safety

### Phase 3: Gradual Rollout

1. Domain-by-domain migration
2. Each domain: update interface → convert implementations → verify tests
3. No big-bang rewrites — migrate as you touch files

## When to Use Explicit Types

Use explicit return type annotations when:

- Defining interface/port contracts
- Inference produces `any`, `unknown`, or overly broad types
- Public API boundaries where clarity is critical
- Complex conditional return types that inference struggles with

Use inference when:

- Implementing interface methods (interface enforces contract)
- Return type can be clearly inferred from implementation
- Error types naturally compose via union types
- Working within internal methods of a class

## References

- [Effect Error Management - Either](https://effect.website/docs/error-management/expected-errors/#either)
- [Effect Either Data Type](https://effect.website/docs/data-types/either/)
- [TypeScript ESLint - explicit-function-return-type](https://typescript-eslint.io/rules/explicit-function-return-type/)
- [Effect Data.TaggedError](https://effect.website/docs/data/data/#taggederror)

## Version

**Version:** 1.0.0  
**Last Updated:** 2026-04-17
