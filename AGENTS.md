# AGENTS.md — Quick Reference

> **Quick reference for AI agents working with this codebase**
>
> This document complements **CLAUDE.md** with practical, actionable instructions.
> For full CEK Five Pillars conventions, see **CLAUDE.md**.

---

## Quick start checklist

- **Read conventions:** Open CLAUDE.md and the pillar section relevant to your task.
- **Check active work:** Review `.specs/tasks/in-progress/` for ongoing tasks.
- **Verify spec exists:** Ensure your task has a spec in `.specs/tasks/*/`. Use `/sdd:add-task`.
- **Baseline green:** Run `bun test` before changing anything.
- **TDD first:** Write the failing test before implementation.

**Test output:** `ENABLE_TEST_LOGS=1 bun test` enables console output.

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
            ├─ Effect Layers → effect/
            └─ Supabase config → supabase/
```

---

## Per-pillar summaries

### SDD: Specification-driven development

- **Create spec:** Use `/sdd:add-task` with Given–When–Then acceptance criteria.
- **Plan:** Use `/sdd:plan` to refine and parallelize tasks.
- **Execute:** Use `/sdd:implement` with automated quality gates.

### TDD: Test-driven development

- **RED:** Write failing test first; watch it fail for the right reason.
- **GREEN:** Minimal code to pass the test.
- **REFACTOR:** Clean up while tests stay green.
- **Effect Testing:** See TESTING.md and CLAUDE.md §10.5 for Effect-based testing patterns.

### SADD: Subagent-driven development

- **When:** Parallel work, complex tasks, quality gates (threshold: 4.5/5.0).
- **Commands:** `/sadd:do-in-parallel`, `/sadd:do-and-judge`, `/sadd:judge`.
- **Patterns:** Independent entities in parallel; Domain → Use Case → Adapter sequentially.

### Kaizen: Continuous improvement

- **YAGNI:** Need now? Simplify? Refactor while fresh?
- **Red flags:** "Later" refactor, speculative features, untested "simple" code.
- **Action:** Apply PDCA cycles for systematic improvement.

---

## Navigation: Per-package guides

| Package                                                                      | Focus                     | Key Patterns                                                   |
| ---------------------------------------------------------------------------- | ------------------------- | -------------------------------------------------------------- |
| [`packages/domain/AGENTS.md`](./packages/domain/AGENTS.md)                   | Entities, value objects   | Branded IDs, `Effect<T,E,never>`, `Data.TaggedError`           |
| [`packages/use-cases/AGENTS.md`](./packages/use-cases/AGENTS.md)             | Effect orchestration      | `Effect.gen`, `yield*`, `Context.Tag`, `Layer.provide` testing |
| [`packages/adapters/AGENTS.md`](./packages/adapters/AGENTS.md)               | DI, controllers, gateways | awilix-modular, `Effect.tryPromise`, auth helpers              |
| [`packages/frameworks/AGENTS.md`](./packages/frameworks/AGENTS.md)           | Layer composition         | `Layer.mergeAll`, `Layer.toRuntime`, Effect Runtime            |
| [`apps/backend-server/AGENTS.md`](./apps/backend-server/AGENTS.md)           | tRPC routes, auth         | Container resolution, `Effect.runPromise` at boundaries        |
| [`apps/native/AGENTS.md`](./apps/native/AGENTS.md)                           | Mobile testing            | Jest patterns, spike cleanup                                   |
| [`apps/web/AGENTS.md`](./apps/web/AGENTS.md)                                 | Frontend patterns         | Component testing, Effect patterns                             |
| [`apps/notification-sender/AGENTS.md`](./apps/notification-sender/AGENTS.md) | Background jobs           | Parallel workflows, PDCA                                       |

---

## 4 Universal rules

1. **TDD first:** Write the failing test before implementation.
2. **Effect-based:** Domain uses `Effect<T,E,never>`; orchestration uses `Effect.gen` + `Context.Tag`.
3. **Branded IDs:** Use branded types; never mix IDs across aggregates.
4. **Never modify lint/type config:** Fix the actual code error, never disable rules or change ESLint, tsc, or other lint/type configuration to bypass errors.

---

## Effect Framework Quick Reference

### Core Patterns

| Pattern           | Syntax                               | Use Case                          |
| ----------------- | ------------------------------------ | --------------------------------- |
| Pure domain       | `Effect<T, E, never>`                | Entity validation, value objects  |
| Orchestration     | `Effect.gen(function* () { ... })`   | Use case workflows                |
| Dependency access | `yield* ContextTag`                  | Repository access in use cases    |
| Error creation    | `new Data.TaggedError("Name")<{}>()` | Domain/use case errors            |
| Error raising     | `yield* Effect.fail(error)`          | Short-circuit on error            |
| Success           | `yield* Effect.succeed(value)`       | Wrap success values               |
| Parallel ops      | `yield* Effect.all([e1, e2])`        | Concurrent execution              |
| External calls    | `Effect.tryPromise({ try, catch })`  | Wrap external APIs                |
| Error recovery    | `Effect.catchTag("Error", handler)`  | Handle specific errors            |
| Provide deps      | `Effect.provide(Layer)`              | Inject dependencies               |
| Run Effect        | `Effect.runPromise(effect)`          | Execute at boundaries             |
| **Logging**       | `yield* EffectLogger.info(msg, ctx)` | Observability in Effect workflows |

### Layer Composition

```typescript
// Define service
const MyService = Context.Tag<MyService>("MyService");

// Create layer
const MyLayer = Layer.succeed(MyService, implementation);

// Compose layers
const AppLayer = Layer.mergeAll(Layer1, Layer2, Layer3);

// Build runtime
const runtime = await Effect.runPromise(Layer.toRuntime(AppLayer));

// Run with runtime
await Runtime.runPromise(runtime)(program);
```

---

## Test execution

| Command                | Purpose           |
| ---------------------- | ----------------- |
| `bun test`             | Run all tests     |
| `bun test:unit`        | Unit tests only   |
| `bun test:integration` | Integration tests |
| `bun test --coverage`  | With coverage     |

**Tagging:** `[UNIT]` for pure logic, `[INTEGRATION]` for DB/APIs.

**Effect Testing:** See TESTING.md for comprehensive Effect testing patterns including:

- Testing with `Effect.runSync` and `Effect.runPromise`
- Error testing with `Effect.either`
- Mock layers with `Layer.succeed`
- Dependency injection with `Effect.provide`

---

## Skill reference

| Skill                      | Path                                       | Use case            |
| -------------------------- | ------------------------------------------ | ------------------- |
| `sdd:add-task`             | `.agents/skills/sdd-add-task/`             | Create spec         |
| `sdd:plan`                 | `.agents/skills/sdd-plan/`                 | Refine plan         |
| `sdd:implement`            | `.agents/skills/sdd-implement/`            | Execute             |
| `sadd:launch-sub-agent`    | `.agents/skills/sadd-launch-sub-agent/`    | Launch subagent     |
| `sadd:do-and-judge`        | `.agents/skills/sadd-do-and-judge/`        | Execute + verify    |
| `sadd:judge`               | `.agents/skills/sadd-judge/`               | Evaluate work       |
| `kaizen:why`               | `.agents/skills/kaizen-why/`               | Root cause analysis |
| `kaizen:plan-do-check-act` | `.agents/skills/kaizen-plan-do-check-act/` | PDCA cycle          |

---

## Deep reference

For comprehensive conventions, see **CLAUDE.md**:

- §1: CEK Five Pillars Overview
- §2: Clean Architecture (Effect Edition)
- §3: SDD Conventions
- §4: TDD Conventions (Effect Edition)
- §5: Layer Patterns (Domain, Use Cases, Adapters, Frameworks)
- §7: SADD Conventions
- §8: Kaizen Conventions
- §10: Effect Framework Patterns & Migration Guide

---

**Last Updated:** 2026-04-14  
**Version:** 2.1.0 (Effect Update)
