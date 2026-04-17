# Domain Layer — Quick Reference

> **Pure business logic layer for the Mirai App monorepo**
>
> For full CEK conventions, see **CLAUDE.md §5.1** and **CLAUDE.md §5.2**.

---

## Domain Purity Checklist

Before committing domain code, verify:

- **✓ Zero imports** from `@mirai-app/adapters`, `@mirai-app/frameworks`, or external frameworks
- **✓ No side effects:** `Date.now()`, `Math.random()`, `crypto.randomUUID()` never called
- **✓ Effect-based errors:** Return `Effect<T,E,never>` instead of throwing exceptions
- **✓ Immutable state:** Entities return new instances; never mutate existing objects
- **✓ Branded IDs:** Use `createBrandedId()` factory for type-safe identifiers

---

## Universal Rules Reference

The following rules apply across all layers:

1. **TDD first:** Write the failing test before implementation
2. **Effect-based:** Domain uses `Effect<T,E,never>`; orchestration uses `Effect.gen` + `Context.Tag`
3. **Branded IDs:** Use branded types; never mix IDs across aggregates
4. **Never modify lint/type config:** Fix the actual code error, never disable rules or change ESLint, tsc, or other lint/type configuration to bypass errors
5. **No emojis in commits:** Use plain text for commit messages. No emoji prefixes
6. **GraphQL workflow:** Never edit generated GraphQL clients, types, or operations. Only edit Pothos schema files, then sync schema, then regenerate client

---

## Effect&lt;T,E,never&gt; Pattern

Domain layer uses pure Effects with **no dependencies** (`never` context):

```ts
// Domain: No external dependencies, no exceptions
Effect.Effect<Entity, ValidationError, never>;

// Use in Effect.gen without provide() in tests
const result = await Effect.runPromise(entityEffect);
```

**Key characteristics:**

- **Pure computation:** No I/O, no external services
- **Total functions:** All paths return `Effect.succeed()` or `Effect.fail()`
- **Deterministic:** Same input always produces same output
- **Testable:** No mocking required

---

## Entity Creation Template

```ts
// packages/domain/src/activity/entities/MyEntity.ts
import { Effect, Data } from "effect";

export class ValidationError extends Data.TaggedError("ValidationError")<{
  field: string;
  message: string;
}> {}

export class MyEntity {
  private constructor(
    readonly id: string,
    readonly name: string,
    readonly createdAt: Date,
  ) {}

  static create(props: {
    id: string;
    name: string;
    createdAt: Date;
  }): Effect.Effect<MyEntity, ValidationError, never> {
    if (props.name.trim().length === 0) {
      return Effect.fail(
        new ValidationError({ field: "name", message: "Name is required" }),
      );
    }
    return Effect.succeed(new MyEntity(props.id, props.name, props.createdAt));
  }
}
```

**Key rules:**

- Pass `id` and `createdAt` from outside (no UUID generation in domain)
- Use `Data.TaggedError` for error types (serializable, type-safe)
- Validate invariants in factory methods
- Co-locate tests: `MyEntity.ts` → `MyEntity.test.ts`

---

## Branded ID Factory Pattern

Create type-safe identifiers that prevent mixing IDs across aggregates:

```ts
// packages/domain/src/user/value-objects/UserId.ts
import {
  createBrandedId,
  isValidUUID,
  type BrandedId,
} from "../utils/branded-id";

export const UserId = createBrandedId("UserId", { validate: isValidUUID });
export type UserId = BrandedId<"UserId">;
```

**API:**

```ts
const id = UserId.create("valid-uuid-string"); // Validates and returns UserId
const id2 = UserId.unsafeCreate("any-string"); // No validation
const id3 = UserId.generate(); // New random UUID
const same = UserId.equals(id, id2); // Boolean comparison
const str = UserId.toString(id); // Convert to string
```

**Validation options:**

- `isValidUUID` — For UUID-based IDs
- `isValidCUID` — For CUID-based IDs (Prisma default)
- Custom function — For flexible validation

---

## Common Mistakes to Avoid

1. **Wrong imports:** Importing Prisma, GraphQL resolvers, or Effect runtime services into domain code breaks purity
2. **Hidden nondeterminism:** Using `Date.now()`, `Math.random()`, or `crypto.randomUUID()` inside entities
3. **Mutation:** Mutating entity state with setters instead of returning immutable updates
4. **Exceptions as control flow:** Throwing in domain; always return `Effect.fail(new TaggedError(...))`

---

## Testing Pattern

Domain tests use pure Effects without dependency injection:

```ts
import { describe, it, expect } from "bun:test";
import { Effect, Either } from "effect";
import { MyEntity, ValidationError } from "./MyEntity";

describe("[UNIT] MyEntity", () => {
  it("creates valid entity", async () => {
    const effect = MyEntity.create({
      id: "user-123",
      name: "Test User",
      createdAt: new Date("2024-01-01"),
    });

    const entity = await Effect.runPromise(effect);
    expect(entity.name).toBe("Test User");
  });

  it("fails for empty name", async () => {
    const effect = MyEntity.create({
      id: "user-123",
      name: "",
      createdAt: new Date(),
    });

    // Use Effect.either with Either.isLeft for type-safe error testing
    const either = await Effect.runPromise(Effect.either(effect));
    expect(Either.isLeft(either)).toBe(true);
    if (Either.isLeft(either)) {
      expect(either.left).toBeInstanceOf(ValidationError);
    }
  });
});
```

---

## Repository Port Definition Template (Inference-First Convention)

Define repository ports (interfaces) for domain entities using the **inference-first convention**:

```ts
// packages/domain/src/activity/ports/ActivityFeedPort.ts
import type { ActivityFeed } from "../entities/ActivityFeed";
import type { Effect } from "effect";
import type { IPortError } from "../../shared/errors/ports";

/**
 * ActivityFeed Port
 *
 * This interface defines what operations the application needs
 * from any ActivityFeed storage implementation.
 * Uses IPortError for natural error union composition in implementations.
 */
export interface IActivityFeedPort {
  /**
   * Find feed by ID
   * @returns Feed or null if not found
   */
  findById(id: string): Effect.Effect<ActivityFeed | null, IPortError, never>;

  /**
   * Find all feeds for a user
   */
  findByUserId(
    userId: string,
  ): Effect.Effect<ActivityFeed[], IPortError, never>;

  /**
   * Create new feed
   */
  create(feed: ActivityFeed): Effect.Effect<ActivityFeed, IPortError, never>;

  /**
   * Update existing feed
   */
  update(feed: ActivityFeed): Effect.Effect<ActivityFeed, IPortError, never>;

  /**
   * Delete feed by ID
   */
  delete(id: string): Effect.Effect<void, IPortError, never>;

  /**
   * Check if feed exists
   */
  exists(id: string): Effect.Effect<boolean, IPortError, never>;
}
```

**Naming conventions:**

- Interface name: `I` + `*Port` (e.g., `IActivityFeedPort`, `IUserProfilePort`)
- Methods: `findBy*`, `create`, `update`, `delete`, `exists`, `countBy*`
- Return type: Always `Effect<T, IPortError, never>` (use abstract error interface)
- Find methods: Return `T | null` for single items, `T[]` for collections

**Inference-First Convention:**

1. **Interfaces use explicit types with `IPortError`** - contracts must be clear
2. **Implementations use type inference** - let TypeScript infer from the interface
3. **Error unions form naturally** - `DatabaseError | NotFoundError` instead of locked single type

**Barrel exports (domain-based):**

Ports are now organized within their domain folders:

```ts
// packages/domain/src/activity/ports/index.ts
export type { IActivityFeedPort } from "./ActivityFeedPort";
export type { IActivityItemPort } from "./ActivityItemPort";

// packages/domain/src/user/ports/index.ts
export type { IUserProfilePort } from "./UserProfilePort";
export type { IUserPreferencesPort } from "./UserPreferencesPort";
```

Each domain manages its own ports barrel export. The main domain index then exports from each domain:

```ts
// packages/domain/src/index.ts
export * from "./activity/ports";
export * from "./user/ports";
```

**Key rules:**

- Import `Effect` as `type` only: `import type { Effect } from "effect"`
- Import `IPortError` for error types: `import type { IPortError } from "../../shared/errors/ports"`
- No implementation logic - pure interfaces only
- No imports from adapters or frameworks
- **Always use I-prefix** for domain port interfaces to avoid declaration merging
- Use `IPortError` (not concrete `DatabaseError`) for error returns

---

## IPortError and Error Classes

All repository ports use `IPortError` interface for consistent error handling:

```ts
// packages/domain/src/shared/errors/ports.ts
/**
 * Base interface for all port errors.
 * Enables concrete error implementations to compose naturally via union types.
 */
export interface IPortError {
  readonly _tag: string;
  readonly message: string;
}
```

Error classes implement `IPortError`:

```ts
// packages/domain/src/shared/errors/domain-errors.ts
import { Data } from "effect";
import type { IPortError } from "./ports";

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
    entity: string;
    id: string;
  }>
  implements IPortError
{
  readonly message = `${entity} not found`;
}
```

**Key points:**

- `IPortError` interface has `_tag: string` and `message: string` properties
- All error classes implement `IPortError` for natural union composition
- Port interfaces use `IPortError` (not concrete `DatabaseError`)
- Gateway implementations infer concrete error unions (e.g., `DatabaseError | NotFoundError`)
- Enables type-safe error matching with `Effect.catchTag` and `instanceof`

---

## Deep Reference

For comprehensive domain patterns, see **CLAUDE.md**:

- **§5.1 Domain Layer:** Effect&lt;T,E,never&gt; patterns, TaggedError usage
- **§5.2 Value Objects:** Branded ID factory detailed implementation
- **§10.5.1 Domain Testing:** Pure Effect testing patterns
- **§10.7 Effect Pattern Quick Reference**

### Ports and Adapters Pattern

- [Ports and Adapters Pattern Guide](../../docs/ports-and-adapters-pattern.md)
- **Pattern flow:** Domain (WHAT) → Use Cases (HOW + DI) → Adapters (IMPLEMENTATION)
- **Domain ports:** Pure interfaces in `@mirai-app/domain/ports`
- **Use cases ports:** Domain interface + Context.Tag for Effect DI
- **Adapter implementations:** Drizzle-based in `@mirai-app/adapters`

---

**Last Updated:** 2026-04-18  
**Version:** 1.4.0 (Updated with inference-first convention, IPortError interface, and Either testing patterns)
