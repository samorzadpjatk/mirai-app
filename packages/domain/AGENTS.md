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
// packages/domain/src/entities/MyEntity.ts
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
// packages/domain/src/value-objects/UserId.ts
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

1. **Wrong imports:** Importing Prisma, tRPC, or Effect runtime services into domain code breaks purity
2. **Hidden nondeterminism:** Using `Date.now()`, `Math.random()`, or `crypto.randomUUID()` inside entities
3. **Mutation:** Mutating entity state with setters instead of returning immutable updates
4. **Exceptions as control flow:** Throwing in domain; always return `Effect.fail(new TaggedError(...))`

---

## Testing Pattern

Domain tests use pure Effects without dependency injection:

```ts
import { describe, it, expect } from "bun:test";
import { Effect } from "effect";
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

    const result = await Effect.runPromise(Effect.either(effect));
    expect(result._tag).toBe("Left");
    if (result._tag === "Left") {
      expect(result.left._tag).toBe("ValidationError");
    }
  });
});
```

---

## Deep Reference

For comprehensive domain patterns, see **CLAUDE.md**:

- **§5.1 Domain Layer:** Effect&lt;T,E,never&gt; patterns, TaggedError usage
- **§5.2 Value Objects:** Branded ID factory detailed implementation
- **§10.5.1 Domain Testing:** Pure Effect testing patterns
- **§10.7 Effect Pattern Quick Reference**

---

**Last Updated:** 2026-04-14  
**Version:** 1.0.0
