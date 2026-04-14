# CLAUDE.md — Mirai App Conventions

> **CEK Five Pillars Compliance Document**  
> Clean Architecture + SDD + TDD + SADD + Kaizen + Effect
>
> **Quick Reference:** See @AGENTS.md for detailed per-pillar guides

---

# Core Architecture

## Dependency Rule

```
Frameworks → Adapters → Use Cases → Domain
```

## Effect Framework

All error handling and async operations use **Effect**:

| Layer      | Pattern                                 | Reference                     |
| ---------- | --------------------------------------- | ----------------------------- |
| Domain     | `Effect<T, E, never>`                   | @AGENTS.md Domain section     |
| Use Cases  | `Effect.gen` + `yield*` + `Context.Tag` | @AGENTS.md Use Cases section  |
| Adapters   | `Effect.tryPromise`                     | @AGENTS.md Adapters section   |
| Frameworks | `Layer.mergeAll` + `Effect.runPromise`  | @AGENTS.md Frameworks section |

**Quick Reference:** @AGENTS.md §10: Effect Framework Quick Reference

---

# 3 Universal Rules

1. **TDD first:** Write failing test before implementation
2. **Effect-based:** Domain uses `Effect<T,E,never>`; orchestration uses `Effect.gen` + `Context.Tag`
3. **Branded IDs:** Use branded types; never mix IDs across aggregates

---

# Code Style

## Effect Patterns

```typescript
// Domain: Pure Effects
static create(props: Props): Effect.Effect<Entity, ValidationError, never> {
  if (invalid) {
    return Effect.fail(new ValidationError({ field, message }));
  }
  return Effect.succeed(new Entity(...));
}

// Use Cases: Orchestration with Context
execute(input: Input): Effect.Effect<Output, Errors, RepositoryTag> {
  return Effect.gen(function* () {
    const repo = yield* RepositoryTag;
    // orchestration logic
    return result;
  });
}

// Adapters: Wrapping external APIs
findById(id: string): Effect.Effect<User | null, DatabaseError, never> {
  return Effect.tryPromise({
    try: () => this.db.query.users.findFirst({ where: eq(users.id, id) }),
    catch: (error) => new DatabaseError({ operation: "findById", id, cause: error }),
  }).pipe(Effect.map((u) => u ? toDomain(u) : null));
}
```

## Logging in Effect

Use `EffectLogger` from `@mirai-app/shared` for all Effect-based logging:

```typescript
import { EffectLogger } from "@mirai-app/shared";

// In Effect.gen blocks
const program = Effect.gen(function* () {
  yield* EffectLogger.info("Operation started", { userId: "123" });
  // ... logic
  yield* EffectLogger.error("Failed", error, { operation: "save" });
});

// With context annotation
yield *
  EffectLogger.withContext({ requestId: "abc" })(
    Effect.gen(function* () {
      yield* EffectLogger.info("This log includes requestId");
    }),
  );
```

**Note:** Legacy `serverLogger`/`clientLogger` are deprecated for Effect code. See @docs/EFFECT_LOGGER_MIGRATION.md.

## Error Handling with Data.TaggedError

```typescript
// Define specific errors
export class ValidationError extends Data.TaggedError("ValidationError")<{
  field: string;
  message: string;
}>()

// Compose in use case signatures
execute(input: Input): Effect.Effect<
  User,
  ValidationError | UserAlreadyExistsError,
  UserRepository
> { ... }

// Catch and convert at boundaries
async handle(input: Input, di: DIContext) {
  const program = this.useCase.execute(input).pipe(
    Effect.catchTag("NotFoundError", () => {
      throw new TRPCError({ code: "NOT_FOUND" });
    }),
  );
  return await Effect.runPromise(program);
}
```

---

# Development Workflow

## TDD: Red-Green-Refactor

```
RED:    Write failing test → watch it fail for right reason
GREEN:  Minimal code to pass → tests green
REFACTOR: Clean up → tests stay green
```

**Effect Testing:** @AGENTS.md §10.5: Testing with Effect

## SDD: Specification-Driven Development

1. **Create spec:** Use `/sdd:add-task` with Given–When–Then acceptance criteria
2. **Plan:** Use `/sdd:plan` to refine and parallelize tasks
3. **Execute:** Use `/sdd:implement` with automated quality gates

See @.specs/README.md for task structure conventions.

---

# Essential Commands

## Testing

```bash
bun test                 # Run all tests
bun test:unit            # Unit tests only
bun test:integration     # Integration tests
bun test --coverage      # With coverage
ENABLE_TEST_LOGS=1 bun test  # Enable console output
```

**Test tags:** `[UNIT]` for pure logic, `[INTEGRATION]` for DB/APIs

## Build & Typecheck

```bash
bun run build            # Build all packages
bun run typecheck        # TypeScript type check
bun run lint             # ESLint check
```

## Package Management

```bash
bun install              # Install dependencies
bun run clean            # Clean build artifacts
```

---

# Per-Package Guides

| Package                | Guide                          | Focus                     |
| ---------------------- | ------------------------------ | ------------------------- |
| `packages/domain/`     | @packages/domain/AGENTS.md     | Entities, value objects   |
| `packages/use-cases/`  | @packages/use-cases/AGENTS.md  | Effect orchestration      |
| `packages/adapters/`   | @packages/adapters/AGENTS.md   | DI, controllers, gateways |
| `packages/frameworks/` | @packages/frameworks/AGENTS.md | Layer composition         |
| `apps/backend-server/` | @apps/backend-server/AGENTS.md | tRPC routes, auth         |
| `apps/native/`         | @apps/native/AGENTS.md         | Mobile testing            |
| `apps/web/`            | @apps/web/AGENTS.md            | Frontend patterns         |

---

# Skills Reference

| Command                  | Purpose                              | Path                                   |
| ------------------------ | ------------------------------------ | -------------------------------------- |
| `/sdd:add-task`          | Create spec with acceptance criteria | @.agents/skills/sdd-add-task/          |
| `/sdd:plan`              | Refine and parallelize tasks         | @.agents/skills/sdd-plan/              |
| `/sdd:implement`         | Execute with quality gates           | @.agents/skills/sdd-implement/         |
| `/sadd:launch-sub-agent` | Launch specialized subagent          | @.agents/skills/sadd-launch-sub-agent/ |
| `/kaizen:why`            | Root cause analysis                  | @.agents/skills/kaizen-why/            |

---

# Layer Decision Tree

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
            ├─ Effect Layers → effect/
            └─ Supabase config → supabase/
```

---

# Poka-Yoke Rules (Hard Constraints)

- Branded types required for all IDs
- No UUID generation in domain layer
- No DI in domain layer
- `Effect<T,E,never>` for all domain operations
- `Data.TaggedError` for all error types

---

**Last Updated:** 2026-04-14  
**Version:** 3.0.0 (Anthropic Best Practices Aligned)
