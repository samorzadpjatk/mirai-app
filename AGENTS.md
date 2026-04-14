# AGENTS.md — Agent Instructions for Mirai App Monorepo

> **Quick reference for AI agents working with this codebase**
>
> This document complements **CLAUDE.md** with practical, actionable instructions.
> For full CEK Five Pillars conventions, see **CLAUDE.md**.

---

## Quick start checklist

- **Read conventions:** Open CLAUDE.md and the pillar section relevant to your task.
- **Check active work:** Review `.specs/tasks/in-progress/` for ongoing tasks.
- **Verify spec exists:** Ensure your task has a spec in `.specs/tasks/*/`.
- **Baseline green:** Run `bun test` before changing anything.
- **TDD first:** Write the failing test before implementation.

### Test output

Console output is **suppressed by default** during tests. To enable logs for debugging:

```bash
ENABLE_TEST_LOGS=1 bun test
```

- **Suppressed:** `console.log`, `console.info`, `console.debug`, `console.warn`
- **Preserved:** `console.error`

---

## Layer decision tree

```
Is it pure business logic?
├─ YES → Domain Layer (packages/domain/)
│   ├─ Core entities → entities/
│   ├─ Immutable concepts → value-objects/
│   └─ Business rules → domain-services/
│
└─ NO → Does it orchestrate domain objects?
    ├─ YES → Use Case Layer (packages/use-cases/)
    │   ├─ Business workflow → interactors/
    │   ├─ External interfaces → ports/
    │   └─ Data transfer → dto/
    │
    └─ NO → Does it connect to frameworks?
        ├─ YES → Adapter Layer (packages/adapters/)
        │   ├─ tRPC routes → controllers/
        │   ├─ DB implementations → gateways/
        │   └─ Format conversions → mappers/
        │
        └─ NO → Framework Layer (packages/frameworks/)
            ├─ tRPC config → trpc/
            ├─ Prisma config → prisma/
            └─ Supabase config → supabase/
```

---

## Per-pillar agent instructions

### SDD: Specification-driven development

**When to use:** Every feature, refactor, or significant change.

- **Create spec:** Use `/sdd:add-task`.
- **Refine:** Ensure acceptance criteria are clear (Given–When–Then).
- **Plan:** Use `/sdd:plan`.
- **Execute:** Use `/sdd:implement`.

**File locations:**

- **Draft:** `.specs/tasks/draft/`
- **Ready:** `.specs/tasks/todo/`
- **Active:** `.specs/tasks/in-progress/`
- **Done:** `.specs/tasks/done/`

**Template:** `.specs/templates/feature-spec.md`

---

### TDD: Test-driven development

**When to use:** ALL code implementation.

- **RED:** Write failing test first.
- **GREEN:** Minimal code to pass.
- **REFACTOR:** Clean up while tests stay green.

**Test locations by layer:**

| Layer     | Pattern      | Example                                                |
| --------- | ------------ | ------------------------------------------------------ |
| Domain    | Co-located   | `src/entities/User.ts` → `User.test.ts`                |
| Use Cases | Co-located   | `src/interactors/CreateUser.ts` → `CreateUser.test.ts` |
| Adapters  | `__tests__/` | `src/gateways/*.ts` → `__tests__/*.test.ts`            |
| Apps      | `__tests__/` | `src/components/*.tsx` → `__tests__/*.test.tsx`        |

**Test running:**

```bash
bun test
cd packages/domain && bun test
bun test --coverage
```

#### Testing rules

- **Domain tests:** Use `Effect<T,E,never>` (pure Effects, no DI required).
- **Use case tests:** Use `Effect.gen` + mock ports via `Layer.succeed` + `Effect.provide`.
- **Adapter tests:** Integration tests; wrap external calls with `Effect.tryPromise(...)`, convert errors at boundaries.

---

### DDD: Domain-driven design

**Key rules:**

- **Domain purity:** ZERO external dependencies in domain.
- **Dependency direction:** Always inward (Frameworks → Adapters → Use Cases → Domain).
- **Error handling model:** Domain uses `Effect<T,E,never>`; use-cases use `Effect.gen` with Context.Tags for dependencies.
- **ID types:** Use branded types; do not mix IDs across aggregates.
- **No UUID/time randomness in domain:** Pass `id` and `createdAt` in.

#### Creating a new entity (Domain)

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

#### Common mistakes to avoid

- **Wrong imports:** Importing Prisma/tRPC/Effect runtime services into domain.
- **Hidden nondeterminism:** Using `Date.now()`, `Math.random()`, `crypto.randomUUID()` in domain.
- **Mutation:** Mutating entity state instead of returning new instances.
- **Exceptions as control flow:** Throwing in domain instead of returning `Effect<T,E,never>`.

---

### SADD: Subagent-driven development

**When to use:** Parallel work, quality gates, complex tasks.

**Quality gates:**

| Component         | Threshold | Judges    |
| ----------------- | --------- | --------- |
| Documentation     | 4.0/5.0   | 1         |
| Package scaffold  | 4.0/5.0   | 1         |
| Entity extraction | 4.5/5.0   | 2 (panel) |
| Use case          | 4.5/5.0   | 2 (panel) |
| Critical logic    | 4.5/5.0   | 2 (panel) |

**Parallel vs sequential:**

```
Parallel (independent):
┌─────────┐ ┌─────────┐
│ EntityA │ │ EntityB │
└────┬────┘ └────┬────┘
     │           │
     └─────┬─────┘
           ▼
     ┌─────────┐
     │ Combine │
     └─────────┘

Sequential (dependent):
┌─────────┐   ┌─────────┐   ┌─────────┐
│ Domain  │──>│Use Case │──>│ Adapter │
└─────────┘   └─────────┘   └─────────┘
```

**Subagent commands:**

- **Launch:** `/sadd:launch-sub-agent`
- **Do + judge:** `/sadd:do-and-judge`
- **Parallel:** `/sadd:do-in-parallel`
- **Judge only:** `/sadd:judge`

---

### Kaizen: Continuous improvement

**When to use:** Every code interaction.

**YAGNI checklist:**

- **Need now:** Is this required for current acceptance criteria?
- **Simplify:** Can this be simpler without losing clarity?
- **Refactor now:** Is there duplication you can remove while context is fresh?

**Red flags:**

- **“Later” refactor:** Refactor now.
- **Speculative features:** Don’t build “maybe” features.
- **Untested “simple” code:** Test it anyway.

---

## Dependency injection patterns (awilix-modular)

The monorepo uses **awilix-modular** for DI. **It is the only DI system.**  
**Resolution is string-token based only.**

### Quick reference

```ts
// In router: resolve controller from request-scoped container
const controller = ctx.container.resolve("userController");

// In test: create isolated container and override providers
const container = createTestContainer();
container.register({
  userRepository: asClass(InMemoryUserRepository).singleton(),
});
```

### Container resolution in routers

```ts
export const userRouter = createTRPCRouter({
  getById: publicProcedure // ✅ Only procedure type
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      // Auth happens in controller, not middleware
      const controller = ctx.container.resolve("userController");
      return controller.getById(input, ctx.container);
    }),
});
```

### Module structure pattern

```ts
import { createStaticModule } from "awilix-modular";
import { Lifetime } from "awilix";

export const ControllerModule = createStaticModule({
  name: "ControllerModule",
  imports: [RepositoryModule],
  providers: {
    userController: {
      factory: (cradle) => new UserController(cradle.userRepository),
      lifetime: Lifetime.SCOPED,
    },
  },
  exports: ["userController"],
});
```

### Scope strategy

| Scope     | Use for                          | Lifetime         |
| --------- | -------------------------------- | ---------------- |
| SINGLETON | Repositories, stateless services | One per app      |
| SCOPED    | Controllers, use cases           | One per request  |
| TRANSIENT | Utilities, factories             | New each resolve |

---

## Common patterns

### Creating a new feature end-to-end (DDD flow)

1. **Domain:** `packages/domain/src/entities/MyEntity.ts` + `MyEntity.test.ts`
2. **Port:** `packages/use-cases/src/ports/MyEntityRepository.ts`
3. **Use case:** `packages/use-cases/src/interactors/CreateMyEntity.ts` + test
4. **Adapter:** `packages/adapters/src/gateways/PrismaMyEntityRepository.ts` + mapper
5. **Controller:** `packages/adapters/src/controllers/my-entity-controller.ts`
6. **Wire:** `apps/backend-server/src/routers/myEntity.ts`

---

### Authentication in Controllers

Controllers handle authentication using helper functions from `controller-helpers.ts`:

```typescript
import { requireAuth, requireAdmin, requireModerator, getOptionalAuth }
  from "@mirai-app/adapters";

// In controller method:
async getById(input: GetByIdInput, di: DIContext) {
  // Require authentication (throws TRPCError if missing/invalid)
  const authContext = await requireAuth(di.headers, di);

  // Now authContext.userId, authContext.role available
  return await this.useCase.execute({ ...input, authContext });
}

// For admin-only endpoints:
async adminAction(input: AdminInput, di: DIContext) {
  // Throws if not admin
  const authContext = await requireAdmin(di.headers, di);
  // ...
}
```

AuthContext is passed explicitly to use cases. No auth in tRPC middleware.

---

## Use case template (Effect-based)

```ts
// packages/use-cases/src/interactors/DoSomething.ts
import { Effect, Data } from "effect";
import { MyEntityRepository } from "../ports/MyEntityRepository";

export class EntityNotFoundError extends Data.TaggedError(
  "EntityNotFoundError",
)<{
  entityId: string;
}> {}

export class DoSomethingUseCase {
  execute(
    input: DoSomethingInput,
  ): Effect.Effect<
    SomethingResultDTO,
    EntityNotFoundError,
    MyEntityRepository
  > {
    return Effect.gen(function* () {
      const repo = yield* MyEntityRepository;

      const entity = yield* repo.findById(input.entityId);
      if (!entity) {
        return yield* Effect.fail(
          new EntityNotFoundError({ entityId: input.entityId }),
        );
      }

      const updated = yield* repo.save(entity);
      return SomethingResultDTO.fromDomain(updated);
    });
  }
}
```

### Use case test template (Effect with Layer)

```ts
import { describe, it, expect } from "bun:test";
import { Effect, Layer } from "effect";
import { DoSomethingUseCase } from "./DoSomething";
import { MyEntityRepository } from "../ports/MyEntityRepository";

// Create mock repository layer
const createMockRepoLayer = () =>
  Layer.succeed(MyEntityRepository, {
    findById: (id: string) => Effect.succeed(null),
    save: (entity: MyEntity) => Effect.succeed(entity),
  });

describe("[UNIT] DoSomethingUseCase", () => {
  it("returns DTO on success", async () => {
    const useCase = new DoSomethingUseCase();
    const mockLayer = createMockRepoLayer();

    const program = useCase
      .execute({ entityId: "1" })
      .pipe(Effect.provide(mockLayer));

    const result = await Effect.runPromise(program);
    expect(result).toBeDefined();
  });

  it("fails with EntityNotFoundError", async () => {
    const useCase = new DoSomethingUseCase();
    const failingLayer = Layer.succeed(MyEntityRepository, {
      findById: () => Effect.succeed(null), // Returns null
      save: (e: MyEntity) => Effect.succeed(e),
    });

    const program = useCase
      .execute({ entityId: "nonexistent" })
      .pipe(Effect.provide(failingLayer));

    const either = await Effect.runPromise(Effect.either(program));
    expect(either._tag).toBe("Left");
  });
});
```

### Use case test template (Effect with container)

```ts
import { describe, it, expect, beforeEach } from "bun:test";
import { Effect } from "effect";
import { createTestContainer } from "@mirai-app/frameworks/di";
import { asClass } from "awilix";

describe("[UNIT] DoSomethingUseCase", () => {
  let container: any;

  beforeEach(() => {
    container = createTestContainer();
    container.register({
      myEntityRepository: asClass(InMemoryMyEntityRepository).singleton(),
      doSomethingUseCase: asClass(DoSomethingUseCase).scoped(),
    });
  });

  it("returns DTO on success", async () => {
    const useCase = container.resolve("doSomethingUseCase");
    const dto = await Effect.runPromise(useCase.execute({ entityId: "1" }));
    expect(dto).toBeDefined();
  });
});
```

---

## Adapter repository rules (including BasePrismaRepository)

If you use a shared base repository (e.g., `BasePrismaRepository`), it must remain **mechanical**.

- **Allowed:** CRUD boilerplate, query helpers, pagination helpers, transaction plumbing.
- **Not allowed:** business rules, invariants, authorization, domain decisions.
- **Mapping rule:** persistence ↔ domain mapping stays in **mappers**.
- **Invariant rule:** invariants live in **domain/use-cases**, not adapters.

---

## Test execution

### Commands

| Command                | Purpose                | When to use       |
| ---------------------- | ---------------------- | ----------------- |
| `bun test`             | Run all tests          | Full validation   |
| `bun test:unit`        | Unit tests only        | Fast feedback     |
| `bun test:integration` | Integration tests only | External services |

### Test tagging convention

- **[UNIT]:** Pure logic, no external services.
- **[INTEGRATION]:** Requires DB/APIs.

```ts
describe("[UNIT] User entity", () => {});
describe("[INTEGRATION] PrismaUserRepository", () => {});
```

### CI order

1. **Unit tests**
2. **Integration tests** (only if unit passes)
3. **Native tests** (Jest) for `apps/native`

---

## Troubleshooting

### dependency-cruiser violations

- **Validate:** `bunx dependency-cruiser --validate .dependency-cruiser.mjs .`
- **Fix:** move code to correct layer; do not add exceptions for domain violations.

### Coverage failures

- **Run:** `bun test --coverage`
- **Fix:** add tests for new/changed code; document legacy gaps as tech debt.

### Layer boundary confusion

- **Domain:** pure business logic (`Effect<T,E,never>` - no exceptions, no async, no dependencies)
- **Use cases:** orchestration (`Effect.gen` + `Context.Tags` for composable workflows)
- **Adapters:** framework integration (`Effect.tryPromise` for external calls, convert errors at boundaries)
- **Frameworks:** configuration + DI wiring (Layer composition for Effect, awilix-modular for framework)

---

## Common Patterns

### Pattern 1: Branded ID Value Objects

**When to use:** Creating type-safe identifiers that can't be mixed up (e.g., `UserId` vs `ChallengeId`).

**Implementation:**

```typescript
// File: packages/domain/src/value-objects/UserId.ts
import {
  createBrandedId,
  isValidUUID,
  type BrandedId,
} from "../utils/branded-id";

export const UserId = createBrandedId("UserId", { validate: isValidUUID });
export type UserId = BrandedId<"UserId">;
```

**API:**

```typescript
const id = UserId.create("valid-uuid-string"); // Validates and returns UserId
const id2 = UserId.unsafeCreate("any-string"); // No validation
const id3 = UserId.generate(); // New random UUID
const same = UserId.equals(id, id2); // Boolean comparison
const str = UserId.toString(id); // Convert to string
```

**Validation Options:**

- `isValidUUID` - For UUID-based IDs
- `isValidCUID` - For CUID-based IDs (Prisma default)
- Custom function - For flexible validation

**Benefits:**

- Compile-time prevention of ID mix-ups
- Consistent API across all ID types
- 80% code reduction vs copy-paste approach

---

### Pattern 2: Spike/Exploratory Test Cleanup

**When to use:** After investigating framework behavior or debugging issues.

**Problem:** Temporary test files accumulate in `__tests__/` directories.

**Solution:**

1. **Create spike directory (gitignored):**

   ```bash
   mkdir __spikes__
   echo "**/__spikes__/" >> .gitignore
   ```

2. **Move exploratory code there:**

   ```bash
   mv debug-headers.test.ts __spikes__/
   ```

3. **Delete when done:**
   ```bash
   rm -rf __spikes__/
   ```

**Identification:**

- Tests with `[DEBUG]`, `[SPIKE]`, `exploratory` in names
- Single assertions testing library behavior
- Files testing cookie headers, Request behavior, etc.

---

### Pattern 3: Waste Identification Checklist

**Before refactoring, ask:**

| Question                                     | Action if Yes                      |
| -------------------------------------------- | ---------------------------------- |
| Is this code copy-pasted in 3+ places?       | Create generic factory/abstraction |
| Are there test files with `[DEBUG]` in name? | Delete or move to `__spikes__/`    |
| Are specs in `done/` older than 1 week?      | Archive to `.specs/archive/`       |
| Are plans in `plans/` older than 90 days?    | Review and delete if stale         |
| Does this duplicate validation logic?        | Centralize in domain utilities     |

---

## Skill reference

| Skill                    | Path                                       | Use case                  |
| ------------------------ | ------------------------------------------ | ------------------------- |
| sdd:add-task             | `.agents/skills/sdd-add-task/`             | Create new specification  |
| sdd:plan                 | `.agents/skills/sdd-plan/`                 | Refine task specification |
| sdd:implement            | `.agents/skills/sdd-implement/`            | Execute implementation    |
| sadd:launch-sub-agent    | `.agents/skills/sadd-launch-sub-agent/`    | Execute with subagent     |
| sadd:do-and-judge        | `.agents/skills/sadd-do-and-judge/`        | Execute with retry        |
| sadd:judge               | `.agents/skills/sadd-judge/`               | Evaluate work             |
| kaizen:why               | `.agents/skills/kaizen-why/`               | Root cause analysis       |
| kaizen:plan-do-check-act | `.agents/skills/kaizen-plan-do-check-act/` | PDCA cycle                |

---

**Last Updated:** 2026-04-14  
**Version:** 1.2.0
