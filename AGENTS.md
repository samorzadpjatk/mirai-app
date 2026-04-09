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

| Layer | Pattern | Example |
| --- | --- | --- |
| Domain | Co-located | `src/entities/User.ts` → `User.test.ts` |
| Use Cases | Co-located | `src/interactors/CreateUser.ts` → `CreateUser.test.ts` |
| Adapters | `__tests__/` | `src/gateways/*.ts` → `__tests__/*.test.ts` |
| Apps | `__tests__/` | `src/components/*.tsx` → `__tests__/*.test.tsx` |

**Test running:**

```bash
bun test
cd packages/domain && bun test
bun test --coverage
```

#### Effect-aware testing rules

- **Domain tests:** Use `Either` (pure, no async, no DI).
- **Use case tests:** Use `Effect.runPromise(...)` and mock ports via DI container.
- **Adapter tests:** Integration tests; wrap external calls with `Effect.tryPromise(...)`.

---

### DDD: Domain-driven design (Effect TS edition)

**Key rules:**
- **Domain purity:** ZERO external dependencies in domain.
- **Dependency direction:** Always inward (Frameworks → Adapters → Use Cases → Domain).
- **Error handling model:** Domain uses `Either`; use-cases/adapters use `Effect`.
- **ID types:** Use branded types; do not mix IDs across aggregates.
- **No UUID/time randomness in domain:** Pass `id` and `createdAt` in.

#### Creating a new entity (Domain)

```ts
// packages/domain/src/entities/MyEntity.ts
import { Either, left, right } from "effect/Either";

export class ValidationError extends Error {
  readonly _tag = "ValidationError";
}

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
  }): Either<ValidationError, MyEntity> {
    if (props.name.trim().length === 0) return left(new ValidationError("Name is required"));
    return right(new MyEntity(props.id, props.name, props.createdAt));
  }
}
```

#### Common mistakes to avoid

- **Wrong imports:** Importing Prisma/tRPC/Effect runtime services into domain.
- **Hidden nondeterminism:** Using `Date.now()`, `Math.random()`, `crypto.randomUUID()` in domain.
- **Mutation:** Mutating entity state instead of returning new instances.
- **Exceptions as control flow:** Throwing in domain instead of returning `Either`.

---

### SADD: Subagent-driven development

**When to use:** Parallel work, quality gates, complex tasks.

**Quality gates:**

| Component | Threshold | Judges |
| --- | --- | --- |
| Documentation | 4.0/5.0 | 1 |
| Package scaffold | 4.0/5.0 | 1 |
| Entity extraction | 4.5/5.0 | 2 (panel) |
| Use case | 4.5/5.0 | 2 (panel) |
| Critical logic | 4.5/5.0 | 2 (panel) |

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
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const controller = ctx.container.resolve("userController");
      return controller.getById(input);
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

| Scope | Use for | Lifetime |
| --- | --- | --- |
| SINGLETON | Repositories, stateless services | One per app |
| SCOPED | Controllers, use cases | One per request |
| TRANSIENT | Utilities, factories | New each resolve |

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

## Use case template (Effect + ports)

```ts
// packages/use-cases/src/interactors/DoSomething.ts
import { Effect } from "effect";

export class EntityNotFoundError extends Error {
  readonly _tag = "EntityNotFoundError";
}

export class DoSomethingUseCase {
  constructor(private readonly repo: MyEntityRepository) {}

  execute(input: DoSomethingInput) {
    return Effect.gen(function* (_) {
      const entity = yield* _(this.repo.findById(input.entityId));
      if (!entity) return yield* _(Effect.fail(new EntityNotFoundError()));

      const updated = yield* _(this.repo.save(entity));
      return SomethingResultDTO.fromDomain(updated);
    }.bind(this));
  }
}
```

### Use case test template (Effect.runPromise)

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

| Command | Purpose | When to use |
| --- | --- | --- |
| `bun test` | Run all tests | Full validation |
| `bun test:unit` | Unit tests only | Fast feedback |
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

- **Domain:** pure business logic (`Either`)
- **Use cases:** orchestration (`Effect`)
- **Adapters:** framework integration (`Effect.tryPromise`)
- **Frameworks:** configuration + DI wiring

---

## Skill reference

| Skill | Path | Use case |
| --- | --- | --- |
| sdd:add-task | `.agents/skills/sdd-add-task/` | Create new specification |
| sdd:plan | `.agents/skills/sdd-plan/` | Refine task specification |
| sdd:implement | `.agents/skills/sdd-implement/` | Execute implementation |
| sadd:launch-sub-agent | `.agents/skills/sadd-launch-sub-agent/` | Execute with subagent |
| sadd:do-and-judge | `.agents/skills/sadd-do-and-judge/` | Execute with retry |
| sadd:judge | `.agents/skills/sadd-judge/` | Evaluate work |
| kaizen:why | `.agents/skills/kaizen-why/` | Root cause analysis |
| kaizen:plan-do-check-act | `.agents/skills/kaizen-plan-do-check-act/` | PDCA cycle |

---

**Last Updated:** 2026-04-09  
**Version:** 1.0.3