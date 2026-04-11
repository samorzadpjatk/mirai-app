---
title: Fix adapters package mapper type alignment (Phase 4)
depends_on: ["fix-adapters-phase3-controllers.chore.md"]
---

## Initial User Prompt

Fix Phase 4 of adapters package type errors - align mapper outputs with controller DTO expectations (~45 errors)

## Description

This maintenance task resolves approximately 45 TypeScript type errors in the adapters package where mapper function outputs don't align with DTO type expectations. Mappers serve as the transformation layer between domain entities and DTOs consumed by controllers. When these type contracts are misaligned, TypeScript compilation fails, CI/CD pipelines break, and type safety guarantees are lost.

The goal is to achieve complete type alignment between mapper outputs and DTO definitions through type-only fixes. This work maintains zero runtime behavior changes while restoring build integrity and type safety. As part of a phased adapters package cleanup, this Phase 4 work depends on Phase 3 controller DTO fixes being complete.

Key considerations include following CEK Five Pillars architecture patterns, maintaining strict TypeScript compliance, and ensuring all existing tests pass without modification. The fixes are strictly type-level with no logic changes.

**Scope**:

- **Included**: All mapper type alignment fixes in adapters package (~45 errors), type-only corrections, alignment with use-cases DTO definitions
- **Excluded**: Runtime logic changes, new features, controller modifications (Phase 3), changes outside adapters package mappers

**User Scenarios**:

1. **Primary Flow**: Developer runs TypeScript compiler → Zero type errors in mappers → Build succeeds → All tests pass
2. **Error Handling**: Compiler reports type error → Developer aligns mapper type with DTO → Compiler verifies fix

**Business Value**: Type safety prevents runtime errors, provides clear contracts between layers, improves developer experience with proper IntelliSense, and enables successful CI/CD builds.

## Acceptance Criteria

### Functional Requirements

- [ ] **Type Error Resolution**: All ~45 TypeScript type errors in adapters mappers are resolved
  - Given: Adapters package has mapper type mismatches (~45 errors)
  - When: TypeScript compiler runs
  - Then: Zero type errors reported in mapper files

- [ ] **Mapper-DTO Alignment**: Mapper function return types match DTO definitions exactly
  - Given: A mapper function returns a DTO
  - When: Type checking occurs
  - Then: Return type matches the DTO type definition from use-cases package

- [ ] **Build Success**: Project builds successfully with strict TypeScript settings
  - Given: Strict TypeScript configuration is enabled
  - When: Build command executes
  - Then: Compilation completes with exit code 0 and no type errors

### Non-Functional Requirements

- [ ] **Zero Runtime Changes**: No behavioral changes to runtime code
  - Given: Existing runtime behavior and test suite
  - When: Type fixes are applied
  - Then: All existing tests pass without modification

- [ ] **Architecture Compliance**: Follows CEK Five Pillars patterns
  - Given: CEK architecture conventions
  - When: Type alignment is implemented
  - Then: Patterns align with established conventions (layer boundaries, DTO contracts)

### Definition of Done

- [ ] All acceptance criteria pass
- [ ] TypeScript compiler reports zero errors in adapters package mappers
- [ ] All existing tests pass
- [ ] Code reviewed and approved
- [ ] Build succeeds in CI/CD

## Architecture Overview

### Solution Strategy

The solution aligns mapper outputs with controller DTO expectations through **type-only corrections** following 8 established patterns. The approach prioritizes:

1. **Explicit Return Types**: Add explicit type annotations to all mapper functions to catch mismatches at definition site (Pattern 1 from skill)
2. **DTO Import Strategy**: Controllers import DTO types from `@mirai-app/use-cases` instead of redefining inline (primary issue identified in analysis)
3. **Boundary Normalization**: Convert branded IDs to strings and normalize errors at layer boundaries (Patterns 2, 3, 5)
4. **Zero Runtime Changes**: All fixes are type annotations, import corrections, and return type declarations

**Phased Execution**:

- **Phase 4a**: Export all DTO types from use-cases package
- **Phase 4b**: Fix high-priority controllers (challenge-submission, coin-transaction, notification, trip)
- **Phase 4c**: Fix remaining controllers (reward, coin, notification-schedule, etc.)
- **Phase 4d**: Add explicit return type annotations to mapper functions

### Key Decisions

| Decision                                      | Rationale                                                                                                 |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| **Use use-case DTOs as source of truth**      | Analysis shows controllers redefine DTOs inline causing drift. Use-case DTOs are authoritative contracts. |
| **Explicit return type annotations**          | Skill Pattern 1 - catches mismatches at mapper definition, not at controller call site                    |
| **Normalize errors to strings at controller** | Controllers are API boundary; `DomainError` objects don't serialize, strings do                           |
| **Convert branded IDs in use-case output**    | Domain uses branded types for safety; DTOs need strings for serialization                                 |
| **Type-only changes, no logic changes**       | Acceptance criteria requires zero runtime behavior changes                                                |
| **Use `satisfies` for verification**          | Skill Pattern 7 - compile-time type checking without widening                                             |

### Component Interactions

```
Database (Drizzle) → Mapper → Repository → Use Case → Controller
     ↑                                              ↑
     │                                              │
$inferSelect/Insert                        DTO Types (source of truth)
                                          Imported by controller
```

**Data Flow**:

1. **Mapper Layer** (`packages/adapters/src/mappers/drizzle/`): Converts between Drizzle records and domain entities. Implements `DrizzleEntityMapper<TDomain, TDrizzle, TInsert>`.
2. **Repository Layer** (`packages/adapters/src/gateways/drizzle/`): Uses `mapper.toDomain()` for reads, returns domain entities.
3. **Use Case Layer** (`packages/use-cases/src/interactors/`): Orchestrates domain logic, returns `Result<DTO, DomainError>`. **DTOs exported as public API**.
4. **Controller Layer** (`packages/adapters/src/controllers/`): Imports DTO types from use-cases, normalizes errors to strings, returns API response shape.

**Critical Integration Points**:

- ChallengeSubmission: Complex nested DTO with branded `SubmissionId` → requires string conversion
- CoinTransaction: Optional nested objects require null/undefined normalization
- Notification/Trip: Error type normalization from `DomainError` to `string`

### Expected Changes

**Use-Cases Package (Export DTOs)**:

- `packages/use-cases/src/index.ts` - Add exports for all use-case DTO types
- ~10 interactor files - Add `export type` for DTO interfaces

**Controllers (Import DTOs + Error Normalization)**:
| File | Primary Changes |
|------|-----------------|
| `challenge-submission.ts` | Import `GetSubmissionOutput`, align return type, fix branded ID handling |
| `coin-transaction.ts` | Import `GetCoinAdditionalInsightsOutput`, align return type |
| `notification.ts` | Normalize error types (ValidationError → string), fix Result handling |
| `trip.ts` | Normalize error types, fix property access patterns |
| `reward.ts` | Fix `UserRole` import (domain not use-cases), fix enum usage |
| `coin.ts` | Normalize `reason` field null/undefined handling |
| `notification-schedule.ts` | Filter type alignment |
| `challenge-vote.ts` | Repository interface alignment |
| `storage.ts` | Module resolution fix |

**Mappers (Explicit Return Types)**:

- All 17 mapper files - Add explicit return type annotations to `toDomain()`, `toDrizzleInsert()`, `toDrizzleUpdate()`
- `challenge-submission.ts` & `coin-transaction.ts` - Consider standardizing method names (non-standard `toDrizzleCreate`)

## Implementation Process

### Parallelization Diagram

```
                                    ┌─────────────────────┐
                                    │     START TASK      │
                                    └──────────┬──────────┘
                                               │
                                               ▼
                                    ┌─────────────────────┐
                                    │   PHASE 1: Setup    │
                                    │  (Sequential, 15m)  │
                                    │  sonnet + haiku     │
                                    └──────────┬──────────┘
                                               │
                                               ▼
                    ┌──────────────────────────┴──────────────────────────┐
                    │                    PARALLEL BLOCK                     │
                    │              Phases 2 + 3 (simultaneous)              │
                    │                    9 tasks total                    │
                    │                                                       │
                    ▼                                                       ▼
       ┌────────────────────────┐                        ┌────────────────────────┐
       │   PHASE 2: Complex     │                        │   PHASE 3: Simple      │
       │     Controllers        │                        │     Controllers        │
       │   (Parallel, 45m)      │                        │   (Parallel, 30m)      │
       │                       │                        │                       │
       │  2.1: ch-sub (opus)   │                        │  3.1: reward (sonnet)  │
       │  2.2: coin-trx (opus) │                        │  3.2: coin (haiku)     │
       │  2.3: notify (sonnet) │                        │  3.3: notif-sch (haiku)│
       │  2.4: trip (sonnet)   │                        │  3.4: ch-vote (haiku)  │
       │                       │                        │  3.5: storage (haiku)  │
       └────────────┬───────────┘                        └────────────┬───────────┘
                    │                                               │
                    │         ┌─────────────────────────────┐       │
                    │         │    BARRIER: Wait for ALL    │       │
                    └────────►│        9 controllers         │◄──────┘
                              └──────────────┬───────────────┘
                                             │
                                             ▼
                              ┌─────────────────────────────┐
                              │  PHASE 4: Mapper Annotations │
                              │   (Parallel, 60m)            │
                              │    17 tasks simultaneously  │
                              │                             │
                              │  Complex (opus): 2 files     │
                              │  • challenge-submission.ts  │
                              │  • coin-transaction.ts      │
                              │                             │
                              │  Medium (sonnet): 6 files    │
                              │  • audit, stats, trip, user │
                              │  • notify, challenge-vote   │
                              │                             │
                              │  Simple (haiku): 9 files    │
                              │  • coin, contact, partner  │
                              │  • reward, storage, events │
                              │  • vip, welcome, notif-sch  │
                              └──────────────┬───────────────┘
                                             │
                                             ▼
                              ┌─────────────────────────────┐
                              │  BARRIER: All 17 complete   │
                              └──────────────┬───────────────┘
                                             │
                                             ▼
                              ┌─────────────────────────────┐
                              │  PHASE 5: Type Check        │
                              │   (Sequential Gate, 5m)     │
                              │   sonnet + haiku            │
                              └──────────────┬───────────────┘
                                             │
                                             ▼
                              ┌─────────────────────────────┐
                              │  PHASE 6: Test Verification │
                              │   (Sequential Gate, 10m)    │
                              │   haiku + sonnet            │
                              └──────────────┬───────────────┘
                                             │
                                             ▼
                                    ┌─────────────────────┐
                                    │      COMPLETE       │
                                    └─────────────────────┘

CRITICAL PATH: Phase 1 (15m) → Phase 2/3 parallel (45m) → Phase 4 (60m) → Phase 5 (5m) → Phase 6 (10m)
OPTIMAL WALL TIME: ~2h 15m (vs 2h 45m sequential)
PEAK PARALLELISM: 17 concurrent tasks (Phase 4)
TIME SAVINGS: 30 minutes (18% reduction)
```

### Overview

This implementation follows a **phased dependency approach** (Setup → Foundational → Core Fixes → Verification) to align mapper outputs with controller DTO expectations. The work is strictly type-only with zero runtime changes, verified through TypeScript compilation and existing test suites.

**Execution Strategy:**

- **Sequential Dependencies:** DTO exports must precede controller fixes, which must precede mapper annotations
- **Parallelizable Work:** Within each phase, independent files can be processed in parallel
- **Verification Gates:** TypeScript compiler acts as primary quality gate; test suite as secondary

---

### Phase 1: Setup — Export DTO Types from Use-Cases

**Goal:** Make all use-case DTO types available for import by controllers and establish the type contract foundation.

**Output:**

- `packages/use-cases/src/index.ts` updated with comprehensive DTO exports
- ~10 interactor files updated with explicit `export type` declarations
- Controllers can import: `import type { SomeDto } from "@mirai-app/use-cases"`

**Success Criteria:**

- [ ] All DTO types from interactors are re-exported from use-cases index
- [ ] No TypeScript errors in use-cases package after export additions
- [ ] Import statement `import type { GetSubmissionOutput } from "@mirai-app/use-cases"` resolves correctly

**Subtasks:**

| #   | Task                                                                              | Agent  | Parallel With     |
| --- | --------------------------------------------------------------------------------- | ------ | ----------------- |
| 1.1 | Audit all interactors in `packages/use-cases/src/interactors/` for DTO interfaces | sonnet | None (sequential) |
| 1.2 | Add `export type` to each DTO interface not already exported                      | haiku  | None (sequential) |
| 1.3 | Update `packages/use-cases/src/index.ts` to re-export all DTO types               | sonnet | None (sequential) |
| 1.4 | Verify imports work by checking controller import resolution                      | haiku  | None (sequential) |

**Dependencies:** None (can start immediately)
**Blockers:** None
**Parallel with:** Nothing (sequential phase)
**Agent Notes:** sonnet for orchestration tasks, haiku for mechanical exports
**Estimated Time:** 15 minutes
**Risk Level:** Low

#### Verification

**Verification Level:** Single Judge (MEDIUM)  
**Threshold:** 4.0/5.0

| Criterion           | Weight | Description                                              |
| ------------------- | ------ | -------------------------------------------------------- |
| Export Completeness | 0.40   | All DTO types from interactors are re-exported           |
| Import Resolution   | 0.35   | `import type { X } from "@mirai-app/use-cases"` resolves |
| No Breaking Changes | 0.25   | No existing exports removed or modified                  |

---

### Phase 2: Foundational — Fix High-Priority Controllers

**Goal:** Align 4 complex controllers with DTO type expectations, establishing patterns for remaining work.

**Output:**

- `challenge-submission.ts` — Branded `SubmissionId` converted to string, nested DTOs aligned
- `coin-transaction.ts` — Optional nested objects normalized, return type aligned
- `notification.ts` — Error types normalized (`DomainError` → string)
- `trip.ts` — Error types normalized, property access patterns fixed

**Success Criteria:**

- [ ] Each controller imports DTO types from `@mirai-app/use-cases` (not inline definitions)
- [ ] `challenge-submission.ts`: `SubmissionId` branded type converted to string in return shape
- [ ] `coin-transaction.ts`: Optional nested fields use consistent null/undefined handling
- [ ] `notification.ts`: Error handling returns `string[]` not `DomainError[]`
- [ ] `trip.ts`: Error normalization matches notification pattern

**Subtasks:**

| #   | Task                                                                                                              | Agent  | Parallel With              |
| --- | ----------------------------------------------------------------------------------------------------------------- | ------ | -------------------------- |
| 2.1 | **challenge-submission.ts**: Replace inline DTO with imported `GetSubmissionOutput`, handle branded ID conversion | opus   | 2.2, 2.3, 2.4, Phase 3 all |
| 2.2 | **coin-transaction.ts**: Import `GetCoinAdditionalInsightsOutput`, normalize optional nested objects              | opus   | 2.1, 2.3, 2.4, Phase 3 all |
| 2.3 | notification.ts: Normalize error types from `DomainError` to `string` at boundary                                 | sonnet | 2.1, 2.2, 2.4, Phase 3 all |
| 2.4 | trip.ts: Apply same error normalization pattern as notification                                                   | sonnet | 2.1, 2.2, 2.3, Phase 3 all |

**Dependencies:** Phase 1 (DTO exports must be available)
**Blockers:** None
**Parallel with:** Phase 3 (all 5 controller subtasks)
**Agent Notes:** opus for branded ID complexity (2.1, 2.2); sonnet for pattern replication (2.3, 2.4)
**Estimated Time:** 45 minutes (wall time, parallel)
**Risk Level:** High (complex DTOs, branded IDs require careful handling)

**Mitigation Strategies:**

- Use `satisfies` operator (Pattern 7) to verify type alignment without widening
- Review domain type definitions for branded ID structures before modifying
- Test compilation after each controller to catch issues early

#### Verification

**Verification Level:** Single Judge Per Item (MEDIUM)  
**Threshold:** 4.0/5.0 per file

| Criterion              | Weight | Description                                                 |
| ---------------------- | ------ | ----------------------------------------------------------- |
| DTO Import Correctness | 0.35   | Uses `@mirai-app/use-cases` imports, not inline definitions |
| Branded ID Handling    | 0.30   | Branded types converted to strings at boundary              |
| Error Normalization    | 0.20   | DomainError → string conversion complete                    |
| Type Alignment         | 0.15   | Return types satisfy DTO contracts                          |

**Files to Verify:**

- 2.1: challenge-submission.ts (branded ID complexity)
- 2.2: coin-transaction.ts (optional nested objects)
- 2.3: notification.ts (error normalization)
- 2.4: trip.ts (error normalization)

---

### Phase 3: Core Fixes — Fix Remaining Controllers

**Goal:** Align 5 remaining controllers with simpler type alignment needs.

**Output:**

- `reward.ts` — `UserRole` import fixed (domain, not use-cases), enum usage corrected
- `coin.ts` — `reason` field null/undefined handling normalized
- `notification-schedule.ts` — Filter type alignment completed
- `challenge-vote.ts` — Repository interface alignment fixed
- `storage.ts` — Module resolution fix applied

**Success Criteria:**

- [ ] `reward.ts`: Correctly imports `UserRole` from `@mirai-app/domain` not use-cases
- [ ] `coin.ts`: `reason` field consistently uses `string | null` pattern
- [ ] All 5 controllers compile without type errors
- [ ] Controllers follow same DTO import pattern as Phase 2

**Subtasks:**

| #   | Task                                                                          | Agent  | Parallel With                           |
| --- | ----------------------------------------------------------------------------- | ------ | --------------------------------------- | ----------------------------------- |
| 3.1 | reward.ts: Fix `UserRole` import source, correct enum type usage              | sonnet | All Phase 2 (2.1-2.4), 3.2-3.5          |
| 3.2 | coin.ts: Standardize `reason` field type to `string                           | null`  | haiku                                   | All Phase 2 (2.1-2.4), 3.1, 3.3-3.5 |
| 3.3 | notification-schedule.ts: Align filter input types with use-case expectations | haiku  | All Phase 2 (2.1-2.4), 3.1-3.2, 3.4-3.5 |
| 3.4 | challenge-vote.ts: Align repository interface with use-case port              | haiku  | All Phase 2 (2.1-2.4), 3.1-3.3, 3.5     |
| 3.5 | storage.ts: Resolve module path issues                                        | haiku  | All Phase 2 (2.1-2.4), 3.1-3.4          |

**Dependencies:** Phase 1 (DTO exports); Phase 2 optional (pattern reference)
**Blockers:** None
**Parallel with:** Phase 2 (all 4 controller subtasks) — 9 total parallel tasks
**Agent Notes:** sonnet for medium complexity (3.1); haiku for simple mechanical fixes (3.2-3.5)
**Estimated Time:** 30 minutes (wall time, parallel with Phase 2)
**Risk Level:** Medium

#### Verification

**Verification Level:** Single Judge Per Item (MEDIUM)  
**Threshold:** 4.0/5.0 per file

| Criterion                 | Weight | Description                                   |
| ------------------------- | ------ | --------------------------------------------- |
| Import Source Correctness | 0.40   | Correct package imports (domain vs use-cases) |
| Type Alignment            | 0.35   | Return types match DTO expectations           |
| Null/Undefined Handling   | 0.25   | Consistent optional field patterns            |

**Files to Verify:**

- 3.1: reward.ts (UserRole import)
- 3.2: coin.ts (reason field)
- 3.3: notification-schedule.ts (filter types)
- 3.4: challenge-vote.ts (repository interface)
- 3.5: storage.ts (module resolution)

---

### Phase 4: Core Fixes — Add Explicit Return Types to All Mappers

**Goal:** Add explicit return type annotations to all 17 mapper functions to catch type mismatches at definition site.

**Output:**

- 17 mapper files in `packages/adapters/src/mappers/drizzle/` updated with explicit return types
- `toDomain()` methods have explicit return type annotations
- `toDrizzleInsert()` methods have explicit return type annotations
- `toDrizzleUpdate()` methods have explicit return type annotations
- Non-standard `toDrizzleCreate()` in challenge-submission and coin-transaction considered for standardization

**Success Criteria:**

- [ ] All mapper functions declare explicit return types (not inferred)
- [ ] `toDomain()` return types align with domain entity constructors
- [ ] `toDrizzleInsert()` return types align with Drizzle insert schemas
- [ ] `toDrizzleUpdate()` return types align with Drizzle update schemas
- [ ] Zero type errors in all mapper files after annotations added

**Subtasks (Complex Tier - opus):**

| #   | Task                                                                                          | Agent | Parallel With        |
| --- | --------------------------------------------------------------------------------------------- | ----- | -------------------- |
| 4.3 | **challenge-submission.ts**: Add types, evaluate `toDrizzleCreate` → `toDrizzleInsert` rename | opus  | All Phase 4 subtasks |
| 4.5 | **coin-transaction.ts**: Add types, evaluate `toDrizzleCreate` → `toDrizzleInsert` rename     | opus  | All Phase 4 subtasks |

**Subtasks (Medium Tier - sonnet):**

| #    | Task                                                                         | Agent  | Parallel With        |
| ---- | ---------------------------------------------------------------------------- | ------ | -------------------- |
| 4.1  | audit-mappers.ts: Add explicit `toDomain(): DomainEntity` return type        | sonnet | All Phase 4 subtasks |
| 4.2  | audit-mappers-stats.ts: Add explicit return types for all conversion methods | sonnet | All Phase 4 subtasks |
| 4.4  | challenge-vote.ts: Add explicit return types                                 | sonnet | All Phase 4 subtasks |
| 4.9  | notification.ts: Add explicit return types                                   | sonnet | All Phase 4 subtasks |
| 4.14 | trip.ts: Add explicit return types                                           | sonnet | All Phase 4 subtasks |
| 4.15 | user.ts: Add explicit return types                                           | sonnet | All Phase 4 subtasks |

**Subtasks (Simple Tier - haiku):**

| #    | Task                                                | Agent | Parallel With        |
| ---- | --------------------------------------------------- | ----- | -------------------- |
| 4.6  | coin.ts: Add explicit return types                  | haiku | All Phase 4 subtasks |
| 4.7  | contact-message.ts: Add explicit return types       | haiku | All Phase 4 subtasks |
| 4.8  | notification-schedule.ts: Add explicit return types | haiku | All Phase 4 subtasks |
| 4.10 | partner.ts: Add explicit return types               | haiku | All Phase 4 subtasks |
| 4.11 | reward.ts: Add explicit return types                | haiku | All Phase 4 subtasks |
| 4.12 | storage.ts: Add explicit return types               | haiku | All Phase 4 subtasks |
| 4.13 | trip-event.ts: Add explicit return types            | haiku | All Phase 4 subtasks |
| 4.16 | vip-status.ts: Add explicit return types            | haiku | All Phase 4 subtasks |
| 4.17 | welcome-funnel.ts: Add explicit return types        | haiku | All Phase 4 subtasks |

**Dependencies:** Phases 2-3 (controller DTOs establish expected types)
**Blockers:** Must wait for Phases 2 AND 3 complete
**Parallel with:** All 17 mappers run in parallel (2 opus + 6 sonnet + 9 haiku)
**Agent Notes:** opus for non-standard naming + complexity; sonnet for medium complexity; haiku for simple entities
**Estimated Time:** 60 minutes (wall time, 17 parallel tasks)
**Risk Level:** Medium
**Max Parallel Workers:** 17

**Note on Standardization:**

- Most mappers use `toDrizzleInsert()` naming
- `challenge-submission.ts` and `coin-transaction.ts` use non-standard `toDrizzleCreate()`
- Decision: If type-only rename doesn't affect runtime, consider standardizing; otherwise leave for future refactor

#### Verification

**Verification Level:** Panel (HIGH) — **Most Critical Phase**  
**Judges:** 2 per file  
**Threshold:** 4.0/5.0 per judge, consensus required

| Criterion             | Weight | Description                                                          |
| --------------------- | ------ | -------------------------------------------------------------------- |
| Explicit Return Types | 0.35   | All `toDomain()`, `toDrizzleInsert()`, `toDrizzleUpdate()` annotated |
| Domain Alignment      | 0.30   | `toDomain()` returns types matching entity constructors              |
| Drizzle Alignment     | 0.20   | `toDrizzle*()` types align with Drizzle schemas                      |
| Zero Type Errors      | 0.15   | No TypeScript errors after annotations                               |

**Files to Verify (17 total, all with PANEL review):**

**Complex Tier (opus) - 2 files:**

- 4.3: challenge-submission.ts (non-standard `toDrizzleCreate`)
- 4.5: coin-transaction.ts (non-standard `toDrizzleCreate`)

**Medium Tier (sonnet) - 6 files:**

- 4.1: audit-mappers.ts
- 4.2: audit-mappers-stats.ts
- 4.4: challenge-vote.ts
- 4.9: notification.ts
- 4.14: trip.ts
- 4.15: user.ts

**Simple Tier (haiku) - 9 files:**

- 4.6: coin.ts
- 4.7: contact-message.ts
- 4.8: notification-schedule.ts
- 4.10: partner.ts
- 4.11: reward.ts
- 4.12: storage.ts
- 4.13: trip-event.ts
- 4.16: vip-status.ts
- 4.17: welcome-funnel.ts

---

### Phase 5: Verification — TypeScript Compilation

**Goal:** Verify all ~45 type errors are resolved through successful compilation.

**Output:**

- TypeScript compiler reports zero errors in adapters package
- CI/CD build command completes with exit code 0

**Success Criteria:**

- [ ] `tsc --noEmit` in adapters package reports zero type errors
- [ ] No errors in mapper files specifically
- [ ] No errors in controller files specifically
- [ ] Build command (`bun run build` or equivalent) completes successfully

**Subtasks:**

| #   | Task                                                                              | Agent  | Parallel With            |
| --- | --------------------------------------------------------------------------------- | ------ | ------------------------ |
| 5.1 | Run `tsc --noEmit` focused on adapters package                                    | sonnet | None (verification gate) |
| 5.2 | If errors remain, categorize by pattern (branded IDs, nulls, nested DTOs, errors) | sonnet | None (sequential)        |
| 5.3 | Fix any remaining issues (should be minimal if prior phases complete)             | sonnet | None (sequential)        |
| 5.4 | Verify build command succeeds                                                     | haiku  | None (verification gate) |

**Dependencies:** Phases 1-4 (all fixes applied)
**Blockers:** Must wait for Phase 4 complete (all mappers annotated)
**Parallel with:** Nothing (verification gate — must be sequential)
**Agent Notes:** sonnet for error analysis; haiku for command execution
**Estimated Time:** 5 minutes
**Risk Level:** Low

#### Verification

**Verification Level:** Single Judge (MEDIUM)  
**Threshold:** 4.0/5.0

| Criterion             | Weight | Description                        |
| --------------------- | ------ | ---------------------------------- |
| Zero Compiler Errors  | 0.50   | `tsc --noEmit` reports zero errors |
| Mapper File Clean     | 0.25   | No errors in `src/mappers/`        |
| Controller File Clean | 0.25   | No errors in `src/controllers/`    |

---

### Phase 6: Verification — Test Suite Validation

**Goal:** Confirm zero runtime behavior changes by verifying all existing tests pass.

**Output:**

- Test suite executes without failures
- No test modifications required to pass

**Success Criteria:**

- [ ] `bun test` completes with 100% of existing tests passing
- [ ] No test files modified during this task
- [ ] Unit tests pass (domain logic unchanged)
- [ ] Integration tests pass (adapter wiring unchanged)

**Subtasks:**

| #   | Task                                                              | Agent  | Parallel With            |
| --- | ----------------------------------------------------------------- | ------ | ------------------------ |
| 6.1 | Run `bun test` to establish baseline                              | haiku  | None (verification gate) |
| 6.2 | Document any test failures (should be none for type-only changes) | sonnet | None (sequential)        |
| 6.3 | If tests fail, verify no runtime logic was inadvertently changed  | opus   | None (critical analysis) |
| 6.4 | Confirm test count matches pre-change baseline                    | haiku  | None (verification gate) |

**Dependencies:** Phases 1-5 (all type fixes complete and compiling)
**Blockers:** Must wait for Phase 5 complete (TypeScript compilation passes)
**Parallel with:** Nothing (verification gate — must be sequential)
**Agent Notes:** haiku for command execution; sonnet for documentation; opus for critical failure analysis
**Estimated Time:** 10 minutes
**Risk Level:** Low

#### Verification

**Verification Level:** Single Judge (MEDIUM)  
**Threshold:** 4.0/5.0

| Criterion             | Weight | Description                |
| --------------------- | ------ | -------------------------- |
| 100% Test Pass Rate   | 0.45   | All existing tests pass    |
| No Test Modifications | 0.35   | Zero test files changed    |
| Zero Runtime Changes  | 0.20   | Type-only changes verified |

---

### Implementation Summary

| Phase            | Step | Goal                      | Files/Scope           | Est. Time   | Risk   | Agent Mix         | Parallel With               | Verification         |
| ---------------- | ---- | ------------------------- | --------------------- | ----------- | ------ | ----------------- | --------------------------- | -------------------- |
| **Setup**        | 1    | Export DTO types          | 1 index + ~10 exports | 15m         | Low    | sonnet + haiku    | Nothing (sequential)        | **MEDIUM (1)**       |
| **Foundational** | 2    | Fix complex controllers   | 4 controllers         | 45m         | High   | opus(2) + sonnet  | Phase 3 (all 5 tasks)       | **MEDIUM (1×4)**     |
| **Core Fixes**   | 3    | Fix remaining controllers | 5 controllers         | 30m         | Medium | sonnet + haiku(4) | Phase 2 (all 4 tasks)       | **MEDIUM (1×5)**     |
| **Core Fixes**   | 4    | Annotate all mappers      | 17 mapper files       | 60m         | Medium | opus(2)+sonnet(6) | All 17 mappers parallel     | **PANEL (2×17)**     |
| **Verification** | 5    | TypeScript compile        | 1 command             | 5m          | Low    | sonnet + haiku    | Nothing (verification gate) | **MEDIUM (1)**       |
| **Verification** | 6    | Test suite                | 1 command             | 10m         | Low    | haiku + sonnet    | Nothing (verification gate) | **MEDIUM (1)**       |
| **TOTAL**        |      |                           | **28 files + 2 cmds** | **~2h 45m** |        | **40 subtasks**   | **Peak: 17 parallel**       | **43 verifications** |

**Critical Path:** 1 → 2/3 → 4 → 5 → 6 (sequential phases, parallel within)
**Wall Clock Optimized:** ~2h 15m (saves 30m through parallelization)
**Peak Parallel Workers:** 17 (Phase 4: all mappers simultaneously)
**Agent Distribution:** opus(4) + sonnet(16) + haiku(20) = 40 subtasks
**Total Verifications:** 43 (1 + 4 + 5 + 34 + 1 + 1 = 43) — Phase 4 requires 2 judges per file

---

### Sub-Agent Execution Directive

**MUST Requirements for Parallel Execution:**

1. **MUST use `sadd:launch-sub-agent` for all implementation subtasks** — Each subtask in Phases 2, 3, and 4 MUST be executed via sub-agent launch
2. **MUST assign correct agent per subtask table** — Complex tasks (branded IDs, non-standard patterns) → opus; Implementation tasks → sonnet; Mechanical tasks → haiku
3. **MUST wait for all parallel tasks in a phase before proceeding** — Use barrier synchronization: all Phase 2/3 tasks complete before Phase 4 starts
4. **MUST run verification phases (5, 6) sequentially** — No parallelization during verification gates
5. **MUST include phase completion checkpoint** — After each phase, verify success criteria before launching next phase sub-agents

**Agent Selection Criteria:**

| Agent      | Use For                                                                                | Capabilities                                                      |
| ---------- | -------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| **opus**   | Complex analysis, branded ID conversion, non-standard patterns, architecture decisions | Deep type analysis, edge case handling, pattern design            |
| **sonnet** | Implementation tasks, pattern replication, orchestration, medium complexity            | Fast implementation, consistent patterns, multi-file coordination |
| **haiku**  | Mechanical tasks, simple fixes, verification commands, documentation                   | Speed, reliability, command execution                             |

**Launch Pattern by Phase:**

```
PHASE 1 (Sequential):
  subagent → 1.1 (sonnet)
  subagent → 1.2 (haiku)
  subagent → 1.3 (sonnet)
  subagent → 1.4 (haiku)
  [BARRIER: All 4 complete]

PHASE 2+3 (Parallel Block - 9 tasks simultaneously):
  ├─ subagent → 2.1 (opus)    ├─ subagent → 3.1 (sonnet)
  ├─ subagent → 2.2 (opus)    ├─ subagent → 3.2 (haiku)
  ├─ subagent → 2.3 (sonnet)  ├─ subagent → 3.3 (haiku)
  └─ subagent → 2.4 (sonnet)  ├─ subagent → 3.4 (haiku)
                              └─ subagent → 3.5 (haiku)
  [BARRIER: All 9 complete]

PHASE 4 (Parallel Block - 17 tasks simultaneously):
  ├─ subagent → 4.1 (sonnet)   ├─ subagent → 4.6 (haiku)
  ├─ subagent → 4.2 (sonnet)   ├─ subagent → 4.7 (haiku)
  ├─ subagent → 4.3 (opus)     ├─ subagent → 4.8 (haiku)
  ├─ subagent → 4.4 (sonnet)   ├─ subagent → 4.9 (sonnet)
  ├─ subagent → 4.5 (opus)     ├─ subagent → 4.10 (haiku)
  │                            ├─ subagent → 4.11 (haiku)
  │                            ├─ subagent → 4.12 (haiku)
  │                            ├─ subagent → 4.13 (haiku)
  │                            ├─ subagent → 4.14 (sonnet)
  │                            ├─ subagent → 4.15 (sonnet)
  │                            ├─ subagent → 4.16 (haiku)
  │                            └─ subagent → 4.17 (haiku)
  [BARRIER: All 17 complete]

PHASE 5 (Sequential Gate):
  subagent → 5.1 (sonnet)
  subagent → 5.2 (sonnet) [if errors]
  subagent → 5.3 (sonnet) [if errors]
  subagent → 5.4 (haiku)
  [BARRIER: TypeScript clean]

PHASE 6 (Sequential Gate):
  subagent → 6.1 (haiku)
  subagent → 6.2 (sonnet) [if failures]
  subagent → 6.3 (opus)   [if runtime issues]
  subagent → 6.4 (haiku)
  [COMPLETE]
```

**Quality Gates (MUST verify before proceeding):**

| Gate | Checkpoint          | Verification Command                                         |
| ---- | ------------------- | ------------------------------------------------------------ | ---------------------- |
| G1   | Phase 1 complete    | `grep "export type" packages/use-cases/src/index.ts`         |
| G2   | Phases 2+3 complete | `cd packages/adapters && tsc --noEmit 2>&1                   | grep -c "controllers"` |
| G3   | Phase 4 complete    | `cd packages/adapters && tsc --noEmit 2>&1                   | grep -c "mappers"`     |
| G4   | Phase 5 complete    | `cd packages/adapters && tsc --noEmit && echo $?` (expect 0) |
| G5   | Phase 6 complete    | `bun test && echo "All tests pass"`                          |

---

### Dependencies and Blockers

**Dependency Graph:**

```
Phase 1 (DTO Exports)
    ↓
┌──────────────────────────────────────────┐
│  PARALLEL EXECUTION BLOCK               │
│  ┌────────────────────────────────┐      │
│  │ Phase 2 (Complex Controllers) │      │
│  │ • challenge-submission (opus) │      │
│  │ • coin-transaction (opus)     │      │
│  │ • notification (sonnet)         │      │
│  │ • trip (sonnet)                 │      │
│  └────────────────────────────────┘      │
│              ║                           │
│              ║ PARALLEL                  │
│              ▼                           │
│  ┌────────────────────────────────┐      │
│  │ Phase 3 (Simple Controllers)    │      │
│  │ • reward (sonnet)               │      │
│  │ • coin (haiku)                  │      │
│  │ • notification-schedule (haiku) │      │
│  │ • challenge-vote (haiku)        │      │
│  │ • storage (haiku)               │      │
│  └────────────────────────────────┘      │
└──────────────────────────────────────────┘
    ↓ (wait for ALL 9 controllers)
Phase 4 (Mappers - 17 parallel tasks)
    ↓
Phase 5 (Type Check - Sequential Gate)
    ↓
Phase 6 (Test Verification - Sequential Gate)
```

**External Blockers:**

- Phase 3 controller DTO fixes must be complete per `depends_on` in frontmatter

**Internal Blockers:**

- Phase 1 blocks all other phases (no DTO exports = no imports possible)
- Phases 2-3 block Phase 4 (controllers define DTO contracts that mappers must satisfy)
- Phase 4 blocks Phase 5 (must have all fixes before type checking)

**Parallel Execution Rules:**

| Rule   | Description                                                                                            |
| ------ | ------------------------------------------------------------------------------------------------------ |
| **P1** | Phases 2 and 3 are PARALLEL — launch all 9 controller tasks simultaneously                             |
| **P2** | Phase 4 mappers are ALL PARALLEL — launch all 17 mapper tasks simultaneously after Phases 2+3 complete |
| **P3** | Phases 5 and 6 are SEQUENTIAL GATES — wait for full completion of prior phases                         |
| **P4** | Agent selection is MANDATORY — use assigned agents (opus/sonnet/haiku) per subtask                     |

---

### Risk Register

| Risk                                           | Likelihood | Impact | Mitigation Strategy                                                                   |
| ---------------------------------------------- | ---------- | ------ | ------------------------------------------------------------------------------------- |
| Branded ID conversion causes type mismatches   | Medium     | High   | Review domain branded types first; use explicit string conversion at boundaries       |
| Optional field null vs undefined inconsistency | Medium     | Medium | Standardize on `null` for optional fields; verify with `satisfies`                    |
| Error normalization misses edge cases          | Low        | Medium | Use `satisfies` operator for compile-time verification; review all error return paths |
| Test failures from type changes                | Low        | High   | Zero runtime logic changes constraint; compiler verifies no logic changes             |
| Phase 3 dependencies incomplete                | Low        | High   | Verify `depends_on` task completion before starting; coordinate with Phase 3 owner    |
| Mapper standardization breaks imports          | Low        | Medium | If renaming `toDrizzleCreate`, verify all callers updated; prefer type-only fixes     |

**High-Risk Areas Requiring Extra Attention:**

1. **challenge-submission.ts**: Branded `SubmissionId` conversion pattern must be correct
2. **coin-transaction.ts**: Optional nested DTOs need consistent null handling
3. **notification.ts/trip.ts**: Error normalization must preserve all error messages

---

### Definition of Done

**For Each Phase:**

- [ ] All subtasks in the phase completed
- [ ] Phase success criteria met and verified
- [ ] No compiler errors introduced
- [ ] Code follows CEK Five Pillars patterns

**For Overall Task:**

- [ ] All ~45 TypeScript type errors in adapters mappers resolved
- [ ] TypeScript compiler reports zero errors (`tsc --noEmit` passes)
- [ ] Build succeeds with exit code 0
- [ ] All existing tests pass without modification
- [ ] No runtime logic changes (verified by test suite)
- [ ] Architecture compliance verified (layer boundaries respected)
- [ ] Code reviewed (if required by team process)
- [ ] CI/CD pipeline passes

**Verification Commands:**

```bash
# Type check adapters package
cd packages/adapters && tsc --noEmit

# Full build
bun run build

# Test suite
bun test

# Specific to this task: Check mapper errors zero
cd packages/adapters && tsc --noEmit 2>&1 | grep -c "mappers" || echo "0 mapper errors"
```

**Acceptance Verification:**

- [ ] Run verification commands above, all pass
- [ ] Compare error count: before ~45 → after 0
- [ ] Confirm no test files were modified in git diff

## Verification

### Verification Summary Table

| Phase     | Description         | Level     | Judges         | Threshold   | Files/Items                                               |
| --------- | ------------------- | --------- | -------------- | ----------- | --------------------------------------------------------- |
| **1**     | DTO Exports         | MEDIUM    | 1              | 4.0/5.0     | index.ts + ~10 exports                                    |
| **2**     | Complex Controllers | MEDIUM    | 1 per file     | 4.0/5.0     | 4 controllers (ch-sub, coin-trx, notify, trip)            |
| **3**     | Simple Controllers  | MEDIUM    | 1 per file     | 4.0/5.0     | 5 controllers (reward, coin, notif-sch, ch-vote, storage) |
| **4**     | **Mappers**         | **PANEL** | **2 per file** | **4.0/5.0** | **17 mapper files**                                       |
| **5**     | Type Check          | MEDIUM    | 1              | 4.0/5.0     | tsc --noEmit output                                       |
| **6**     | Test Verification   | MEDIUM    | 1              | 4.0/5.0     | bun test output                                           |
| **TOTAL** | —                   | —         | **43**         | —           | **40 subtasks**                                           |

**Critical Phase:** Phase 4 (Mappers) requires Panel verification with 2 judges per file because mappers are the transformation layer between database and domain — type misalignment here propagates to all upstream layers.

### Primary Verification (Automated)

| Phase                | Method         | Threshold   | Judge Type  |
| -------------------- | -------------- | ----------- | ----------- |
| Phase 5 (Type Check) | `tsc --noEmit` | Zero errors | Compiler    |
| Phase 6 (Test Suite) | `bun test`     | 100% pass   | Test Runner |

### LLM-as-Judge Verification by Phase

All phases include LLM-as-Judge verification with custom rubrics:

- **Phase 1 (MEDIUM):** Export completeness, import resolution, no breaking changes
- **Phase 2-3 (MEDIUM):** Per-file verification of DTO imports, type alignment, branded ID handling
- **Phase 4 (PANEL):** Per-file verification with 2 judges for explicit return types, domain/drizzle alignment
- **Phase 5-6 (MEDIUM):** Verification of compiler output and test results

See individual phase sections above for detailed rubrics.
