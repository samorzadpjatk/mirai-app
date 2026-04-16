---
title: Deduplicate error types and migrate gateways to use base error interface and DTOs
---

## References

- **Skill:** `.claude/skills/error-handling-patterns/SKILL.md` - Error handling patterns and migration guidelines
- **Analysis:** `.specs/analysis/analysis-deduplicate-error-types.md` - Structured codebase analysis with error inventory
- **Architecture:** `.specs/scratchpad/architecture-7d4e8f2a9b1c.md` - Architectural decisions and integration points

## Initial User Prompt

Deduplicate error types
Start with the base error interface
Migrate all gateways at once

## Description

### WHAT

Consolidate and deduplicate error types across the codebase to use a single, consistent error hierarchy based on the existing `GatewayError` and `DatabaseGatewayError` interfaces. Migrate all gateway implementations (both Drizzle and in-memory) to use unified error types from the domain layer and ensure consistent DTO patterns.

### WHY

Currently, error types are duplicated and inconsistent across layers:

- **Domain layer** has unified errors using `Data.TaggedError` (20+ error classes)
- **Adapters layer** has adapter-errors.ts with mixed patterns (some use plain `Error`, some use `Data.TaggedError`)
- **Interfaces** exist in `gateway-error.ts` but aren't fully utilized

This inconsistency causes:

1. **Unreliable error handling** - Cannot reliably catch errors by type across layers
2. **Code duplication** - Same error concepts defined multiple times
3. **Testing friction** - In-memory gateways may behave differently from Drizzle gateways
4. **Type safety gaps** - Not all errors conform to the `GatewayError` interface

### Approach

1. **Start with base error interface** (`GatewayError`, `DatabaseGatewayError` in `packages/domain/src/ports/gateway-error.ts`)
2. **Migrate all gateways at once** to ensure consistency across all 12+ domains
3. **Update adapter-specific errors** to use `Data.TaggedError` pattern and conform to interfaces
4. **Ensure DTO compliance** - All gateways return DTOs, not domain entities

## Architecture Overview

### Solution Strategy

**Consolidation over Proliferation:** Replace 40+ nearly identical `*RepositoryError` types and 6 plain `Error` classes with unified, context-rich `Data.TaggedError` types. Use operation/entity/entityId context fields instead of creating new error classes for each use case.

**All-at-Once Migration:** Migrate all 32 gateways (16 Drizzle + 16 in-memory) across 12 domains simultaneously rather than incrementally. This ensures consistency and avoids partial migration confusion.

### Key Architectural Decisions

| Decision                                     | Rationale                                                                                                            |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| **Single GatewayError base type**            | 40+ RepositoryErrors differ only in operation name; context fields provide same granularity with less cognitive load |
| **Retain DatabaseError as distinct type**    | Database operations have unique recovery strategies (retry, fallback); enables `Effect.catchTag("DatabaseError")`    |
| **Migrate plain Errors to Data.TaggedError** | Required for Effect compatibility, type guards, and `Effect.catchTag()` usage                                        |
| **Remove duplicate ConfigurationError**      | Use domain version only; eliminates confusion and ensures single source of truth                                     |
| **No changes to use-case interactor errors** | Out of scope per requirements; business logic errors remain separate from gateway errors                             |
| **DTO compliance verification**              | Clean Architecture boundary requires gateways to return DTOs, not entities                                           |

### Expected Changes

**Files to Create (3):**

- `packages/use-cases/src/system/errors/gateway-error.ts` - Re-export for use cases layer
- `packages/adapters/src/system/errors/gateway-error.ts` - Re-export for adapters layer

**Files to Modify (53):**
| Category | Count | Files |
|----------|-------|-------|
| Domain layer | 2 | `gateway-error.ts`, `unified-errors.ts` |
| Adapter base | 3 | `adapter-errors.ts`, `drizzle-base.ts`, `in-memory-base.ts` |
| Drizzle gateways | 16 | All `packages/adapters/src/*/gateways/drizzle/*.ts` |
| In-memory gateways | 16 | All `packages/adapters/src/*/gateways/in-memory/*.ts` |
| Gateway ports | 16 | All `packages/use-cases/src/*/ports/gateway.ts` |

### Integration Points

**Layer Flow:**

```
Domain (GatewayError, DatabaseError)
    ↑ Effect<DTO, GatewayError>
Use Cases (Gateway ports with unified error types)
    ↑ Effect<DTO, GatewayError>
Adapters (Drizzle/InMemory gateways return unified errors)
    ↑ Error → DTO conversion at boundary
Framework (GraphQL error mapping uses _tag discriminator)
```

**Error Type Integration:**

- All gateway errors must satisfy `GatewayError` interface: `{ _tag: string, message: string }`
- All errors must work with `Effect.catchTag()` for type narrowing
- Type guards (`instanceof`) must work correctly across all error types
- DTO conversion must filter internal `cause` fields before API response

**Backward Compatibility:**

- Type aliases will maintain compatibility during transition: `type ChallengeRepositoryError = GatewayError`
- GraphQL error mapper will handle both old and new `_tag` values temporarily

## Acceptance Criteria

### AC1: Error Interface Compliance

**Given** an error is thrown from any gateway  
**When** the error is caught and inspected  
**Then** it must conform to the `GatewayError` interface with `_tag` and `message` properties

### AC2: Database Error Consistency

**Given** a database operation fails in any gateway  
**When** the error is returned  
**Then** it must be a `DatabaseError` from unified-errors conforming to `DatabaseGatewayError` interface

### AC3: Adapter Error Migration

**Given** adapter-specific errors (ExternalAPIError, StorageError, MappingError, ConfigurationError, ServiceError, DatabaseConnectionError, DatabaseTransactionError)  
**When** they are used in the codebase  
**Then** they must use `Data.TaggedError` pattern with proper `_tag` discriminator

### AC4: Duplicate Error Elimination

**Given** the error type definitions across domain and adapters layers  
**When** analyzed for duplication  
**Then** no duplicate error types should exist (e.g., ConfigurationError should exist in only one location)

### AC5: Gateway DTO Compliance

**Given** any gateway method returns data  
**When** the data is returned to the use-case layer  
**Then** it must be in DTO format matching the port interface definition

### AC6: In-Memory Gateway Parity

**Given** in-memory gateway implementations exist for testing  
**When** they are used as substitutes for Drizzle gateways  
**Then** they must return the same error types and DTO structures with identical method signatures

### AC7: Type Guard Consistency

**Given** type guard functions for error checking  
**When** used to identify error types  
**Then** they must work consistently across all error types (using `_tag` discriminator or `instanceof`)

## Scope

### In Scope

- **Error Types:**
  - `packages/adapters/src/system/errors/adapter-errors.ts` (all error classes)
  - `packages/domain/src/system/errors/unified-errors.ts` (consolidation target)
  - `packages/domain/src/ports/gateway-error.ts` (base interfaces)
- **Gateways (30+ files):**
  - All Drizzle gateways: `packages/adapters/src/*/gateways/drizzle/*.ts`
  - All in-memory gateways: `packages/adapters/src/*/gateways/in-memory/*.ts`
  - All port interfaces: `packages/use-cases/src/*/ports/gateway.ts`
- **DTOs:**
  - Ensure all gateway return types use DTOs from `packages/use-cases/src/*/dto.ts`
  - Verify mapper consistency in `packages/adapters/src/*/mappers/`

### Out of Scope

- Use-case interactor errors (business logic errors remain separate)
- Domain entity validation errors (entity-level concerns)
- GraphQL resolver error mapping (presentation layer)
- Error logging/monitoring infrastructure
- Framework-level error handling (Effect runtime)

## Error Scenarios

### ES1: Database Connection Failure

**Given** a database connection is lost  
**When** any gateway operation is attempted  
**Then** a `DatabaseError` is returned with operation name and original cause

### ES2: External API Timeout

**Given** an external API call exceeds timeout  
**When** the gateway operation fails  
**Then** an `ExternalAPITimeoutError` (using Data.TaggedError) is returned

### ES3: Storage Operation Failure

**Given** a file storage operation fails  
**When** the storage gateway returns an error  
**Then** a `StorageError` (using Data.TaggedError) is returned with operation and path details

### ES4: Data Mapping Failure

**Given** database data cannot be mapped to DTO  
**When** the mapper encounters invalid data  
**Then** a `MappingError` (using Data.TaggedError) is returned with source/target context

### ES5: Configuration Missing

**Given** a required configuration value is missing  
**When** the adapter attempts to use the configuration  
**Then** a `ConfigurationError` (unified version) is returned

## User Scenarios

### US1: Developer Error Handling

**As** a developer  
**When** I catch errors from any gateway  
**I want** consistent error types with reliable `_tag` discriminators  
**So that** I can handle errors by type without checking multiple patterns

### US2: Testing with In-Memory Gateways

**As** a QA engineer  
**When** I run tests with in-memory gateways  
**I want** identical error behavior to production Drizzle gateways  
**So that** tests are reliable predictors of production behavior

### US3: Type-Safe Error Matching

**As** a developer  
**When** I use `Effect.catchTag` or type guards  
**I want** all errors to have proper `_tag` strings  
**So that** type narrowing works correctly in Effect pipelines

## Definition of Done

- [ ] All adapter errors use `Data.TaggedError` pattern (no plain Error classes)
- [ ] All adapter errors conform to `GatewayError` interface (`_tag`, `message`)
- [ ] `DatabaseError` is the only database error type used across all gateways
- [ ] No duplicate error types exist between domain and adapters layers
- [ ] All 12+ domains' gateways return unified error types consistently
- [ ] All gateways return DTOs (verified by TypeScript compilation)
- [ ] In-memory gateways have identical signatures to Drizzle gateways
- [ ] All existing tests pass with new error types
- [ ] TypeScript compilation succeeds with zero errors
- [ ] Linter passes without error-related rule violations

## Technical Notes

### Error Type Mapping

| Current Adapter Error      | Target Pattern                  | Notes                            |
| -------------------------- | ------------------------------- | -------------------------------- |
| `ServiceError`             | Keep (already Data.TaggedError) | Ensure conforms to GatewayError  |
| `DatabaseConnectionError`  | Data.TaggedError                | Currently correct pattern        |
| `DatabaseTransactionError` | Data.TaggedError                | Currently correct pattern        |
| `ExternalAPIError`         | Convert to Data.TaggedError     | Currently plain Error            |
| `ExternalAPITimeoutError`  | Convert to Data.TaggedError     | Currently plain Error            |
| `StorageError`             | Convert to Data.TaggedError     | Currently plain Error            |
| `StorageFileNotFoundError` | Convert to Data.TaggedError     | Currently plain Error            |
| `MappingError`             | Convert to Data.TaggedError     | Currently plain Error            |
| `ConfigurationError`       | Use unified version             | Remove from adapters, use domain |

### Domains with Gateways to Migrate

1. activity
2. challenge (includes submission, vote)
3. coin
4. event
5. group
6. location
7. notification (includes delivery, schedule, push-subscription)
8. reward
9. sponsor
10. submission (report)
11. trip
12. user

### Key Files to Modify

- `packages/adapters/src/system/errors/adapter-errors.ts`
- `packages/domain/src/system/errors/unified-errors.ts` (if adding new error types)
- All `packages/adapters/src/*/gateways/drizzle/*.ts`
- All `packages/adapters/src/*/gateways/in-memory/*.ts`
- Base class: `packages/adapters/src/system/shared/gateways/drizzle-base.ts`

## Implementation Process

### Phase 1: Setup

#### Step 1: Error Type Consolidation

**Goal:** Convert all plain Error classes in adapter-errors.ts to Data.TaggedError pattern and remove duplicates

**Agent:** sdd:tech-lead (opus)

**Output:** Updated `packages/adapters/src/system/errors/adapter-errors.ts`

**Success Criteria:**

- [ ] No plain `Error` classes remain in adapter-errors.ts
- [ ] All errors use `Data.TaggedError` with `_tag` discriminator
- [ ] `ConfigurationError` removed (use domain version only)
- [ ] TypeScript compiles with zero errors

**Subtasks:**

1. Analyze current adapter-errors.ts and identify plain Error classes
2. Convert `ExternalAPIError` to `Data.TaggedError`
3. Convert `ExternalAPITimeoutError` to `Data.TaggedError`
4. Convert `StorageError` to `Data.TaggedError`
5. Convert `StorageFileNotFoundError` to `Data.TaggedError`
6. Convert `MappingError` to `Data.TaggedError`
7. Remove duplicate `ConfigurationError` from adapters
8. Verify `ServiceError`, `DatabaseConnectionError`, `DatabaseTransactionError` conform to GatewayError
9. Run TypeScript compiler to verify no type errors

**Blockers and Dependencies:**

- Depends on: None (first step)
- Blocks: Step 2, Step 3, Step 4

**Risks and Mitigations:**
| Risk | Impact | Mitigation |
|------|--------|------------|
| Some errors may be used in unexpected places | High | Global search for each error class name before modifying |
| Domain ConfigurationError may have different API | Medium | Compare both versions and unify APIs if needed |

**Verification:**
| Attribute | Value |
|-----------|-------|
| **Verification Level** | Panel |
| **Threshold** | 4.0/5.0 |
| **Evaluation Method** | LLM-as-Judge |

| Criteria                          | Weight | Description                                                                        |
| --------------------------------- | ------ | ---------------------------------------------------------------------------------- |
| Data.TaggedError Pattern          | 0.30   | All errors converted from plain Error to Data.TaggedError with \_tag discriminator |
| GatewayError Interface Compliance | 0.25   | All errors have \_tag and message properties conforming to GatewayError            |
| Duplicate Removal                 | 0.25   | ConfigurationError removed from adapters; no duplicate error types remain          |
| TypeScript Compilation            | 0.20   | Zero type errors after conversion                                                  |

---

#### Step 2: Layer Re-exports Setup

**Goal:** Create re-export files for use-cases and adapters layers to provide clean import paths

**Agent:** sdd:tech-lead (opus)

**Output:**

- `packages/use-cases/src/system/errors/gateway-error.ts`
- `packages/adapters/src/system/errors/gateway-error.ts`

**Success Criteria:**

- [ ] Both re-export files exist and export `GatewayError`, `DatabaseGatewayError`, `DatabaseError`
- [ ] TypeScript can resolve imports from new paths
- [ ] No circular dependency issues introduced

**Subtasks:**

1. Create `packages/use-cases/src/system/errors/gateway-error.ts` re-exporting from domain
2. Create `packages/adapters/src/system/errors/gateway-error.ts` re-exporting from domain
3. Verify imports work correctly in test files
4. Update any existing imports to use new paths (optional, can be done later)

**Blockers and Dependencies:**

- Depends on: Step 1 (error types stabilized)
- Blocks: Step 3, Step 4
- Parallel with: None (sequential after Step 1)

**Risks and Mitigations:**
| Risk | Impact | Mitigation |
|------|--------|------------|
| Circular dependencies between layers | Medium | Keep re-exports simple, only re-export from domain |

**Verification:**
| Attribute | Value |
|-----------|-------|
| **Verification Level** | Single |
| **Threshold** | 4.0/5.0 |
| **Evaluation Method** | Automated + LLM-as-Judge |

| Criteria              | Weight | Description                                                                 |
| --------------------- | ------ | --------------------------------------------------------------------------- |
| File Existence        | 0.25   | Both re-export files exist at specified paths                               |
| Export Correctness    | 0.35   | Files correctly re-export GatewayError, DatabaseGatewayError, DatabaseError |
| TypeScript Resolution | 0.25   | Imports resolve without errors; no circular dependencies                    |
| Import Path Validity  | 0.15   | New import paths work in test files                                         |

---

### Phase 2: Foundational

#### Step 3: Base Class Updates

**Goal:** Update drizzle-base.ts and in-memory-base.ts to use unified error types consistently

**Agent:** sdd:tech-lead (opus)

**Output:**

- Updated `packages/adapters/src/system/shared/gateways/drizzle-base.ts`
- Updated `packages/adapters/src/system/shared/gateways/in-memory-base.ts`

**Success Criteria:**

- [ ] Base classes use `DatabaseError` for all database failures
- [ ] Base classes catch and wrap errors with proper context (operation name, entity)
- [ ] Base class error types conform to `GatewayError` interface
- [ ] All existing tests for base classes pass

**Subtasks:**

1. Update `drizzle-base.ts` to import `DatabaseError` from domain
2. Modify error wrapping logic to use `DatabaseError` with context fields
3. Update `in-memory-base.ts` with same error patterns
4. Ensure both base classes have identical error handling behavior
5. Run base class tests to verify changes
6. Verify TypeScript compilation

**Blockers and Dependencies:**

- Depends on: Step 1, Step 2
- Blocks: Step 5 (Gateway Migration)
- Parallel with: Step 4 (after Step 2 complete)

**Risks and Mitigations:**
| Risk | Impact | Mitigation |
|------|--------|------------|
| Base class changes affect all gateways | High | Thorough testing of base classes before proceeding |
| Error context may be lost in wrapping | Medium | Ensure `cause` field preserves original error |

**Verification:**
| Attribute | Value |
|-----------|-------|
| **Verification Level** | Panel |
| **Threshold** | 4.0/5.0 |
| **Evaluation Method** | LLM-as-Judge |

| Criteria             | Weight | Description                                               |
| -------------------- | ------ | --------------------------------------------------------- |
| DatabaseError Usage  | 0.30   | Base classes use DatabaseError for all database failures  |
| Context Preservation | 0.25   | Error wrapping includes operation name and entity context |
| Interface Compliance | 0.25   | Error types conform to GatewayError interface             |
| Test Passage         | 0.20   | All existing base class tests pass                        |

---

#### Step 4: Port Interface Updates (PARALLEL - 4 Shards)

**Goal:** Update all 16 gateway port files to use unified `GatewayError` type

**Agent:** sdd:developer × 4 (sonnet) - sharded by domain group

**Sharding Strategy:**

- **Shard A (4 ports):** user, trip, location, activity → Agent 4A
- **Shard B (4 ports):** challenge (main), challenge/submission, challenge/vote, event → Agent 4B
- **Shard C (4 ports):** group, coin, reward, sponsor → Agent 4C
- **Shard D (4 ports):** notification (main, delivery, schedule, push-subscription), submission/report → Agent 4D

**Output:** Updated port files in `packages/use-cases/src/*/ports/gateway.ts`

**Success Criteria:**

- [ ] All 16 port files import `GatewayError` from new re-export path
- [ ] All method signatures use `Effect<DTO, GatewayError, never>`
- [ ] No repository-specific error types remain in port definitions
- [ ] TypeScript compiles use-cases package

**Subtasks (per shard):**

**Shard A:**

1. Update `user/ports/gateway.ts` to use unified error types
2. Update `trip/ports/gateway.ts` to use unified error types
3. Update `location/ports/gateway.ts` to use unified error types
4. Update `activity/ports/gateway.ts` to use unified error types

**Shard B:**

1. Update `challenge/ports/gateway.ts` (main) to use unified error types
2. Update `challenge/ports/submission.ts` to use unified error types
3. Update `challenge/ports/vote.ts` to use unified error types
4. Update `event/ports/gateway.ts` to use unified error types

**Shard C:**

1. Update `group/ports/gateway.ts` to use unified error types
2. Update `coin/ports/gateway.ts` to use unified error types
3. Update `reward/ports/gateway.ts` to use unified error types
4. Update `sponsor/ports/gateway.ts` to use unified error types

**Shard D:**

1. Update `notification/ports/gateway.ts` (main) to use unified error types
2. Update `notification/ports/delivery.ts` to use unified error types
3. Update `notification/ports/schedule.ts` to use unified error types
4. Update `notification/ports/push-subscription.ts` to use unified error types
5. Update `submission/ports/report.ts` to use unified error types

**Shared verification (after all shards):**

- Run TypeScript compiler on use-cases package
- Verify no breaking changes to interactor signatures (should be transparent)

**Blockers and Dependencies:**

- Depends on: Step 2 (re-exports available)
- Parallel with: Step 3 (base class updates)
- Blocks: Step 5 (Gateway Migration)
- Synchronization: All shards must complete before Step 5 begins

**Risks and Mitigations:**
| Risk | Impact | Mitigation |
|------|--------|------------|
| Interactors may need updates | Medium | Verify interactors only use `_tag` for matching, not specific types |
| Missing port files in sub-domains | Low | Check notification sub-domains (delivery, schedule, push-subscription) |

**Verification:**
| Attribute | Value |
|-----------|-------|
| **Verification Level** | Per-Item |
| **Threshold** | 4.0/5.0 |
| **Evaluation Method** | LLM-as-Judge |

| Criteria                 | Weight | Description                                                   |
| ------------------------ | ------ | ------------------------------------------------------------- |
| Import Path Update       | 0.25   | Port files import GatewayError from new re-export path        |
| Signature Correctness    | 0.30   | All method signatures use Effect<DTO, GatewayError, never>    |
| Repository Error Removal | 0.25   | No repository-specific error types remain in port definitions |
| TypeScript Compilation   | 0.20   | Use-cases package compiles without errors                     |

---

### Phase 3: Feature (Major)

#### Step 5: Gateway Migration (PARALLEL - 6 Batches, 32 Gateways)

**Goal:** Migrate all 16 Drizzle and 16 In-Memory gateways to use unified error types and DTO patterns

**Agent:** sdd:developer × 6 (sonnet) - one agent per domain batch

**Parallelization Strategy:** 6 independent domain batches running simultaneously
Each agent handles both Drizzle and In-Memory gateways for their assigned domains to ensure parity.

**Output:** Updated gateway implementations across 12 domains

**Success Criteria:**

- [ ] All 32 gateways use `DatabaseError` from unified errors
- [ ] All 32 gateways use `GatewayError` type for returns
- [ ] All gateways return DTOs (not entities)
- [ ] All in-memory gateways match Drizzle gateway signatures exactly
- [ ] All existing tests pass

**Subtasks by Agent/Batch:**

**Agent 5A - Domain Batch 1 (Core):** 6 gateways

- Depends on: Step 3, Step 4 (shards A)
- Migrate `user/gateways/drizzle/gateway.ts` + `user/gateways/in-memory/gateway.ts`
- Migrate `trip/gateways/drizzle/gateway.ts` + `trip/gateways/in-memory/gateway.ts`
- Migrate `location/gateways/drizzle/gateway.ts` + `location/gateways/in-memory/gateway.ts`
- Run domain tests after migration
- Report: user, trip, location domains complete

**Agent 5B - Domain Batch 2 (Challenge & Activity):** 8 gateways

- Depends on: Step 3, Step 4 (shard B)
- Migrate `challenge/gateways/drizzle/gateway.ts` + `challenge/gateways/in-memory/gateway.ts`
- Migrate `challenge/gateways/drizzle/submission.ts` + `challenge/gateways/in-memory/submission.ts`
- Migrate `challenge/gateways/drizzle/vote.ts` + `challenge/gateways/in-memory/vote.ts`
- Migrate `activity/gateways/drizzle/gateway.ts` + `activity/gateways/in-memory/gateway.ts`
- Run domain tests after migration
- Report: challenge, activity domains complete

**Agent 5C - Domain Batch 3 (Social & Events):** 4 gateways

- Depends on: Step 3, Step 4 (shards B, C)
- Migrate `group/gateways/drizzle/gateway.ts` + `group/gateways/in-memory/gateway.ts`
- Migrate `event/gateways/drizzle/gateway.ts` + `event/gateways/in-memory/gateway.ts`
- Run domain tests after migration
- Report: group, event domains complete

**Agent 5D - Domain Batch 4 (Rewards & Economy):** 6 gateways

- Depends on: Step 3, Step 4 (shard C)
- Migrate `coin/gateways/drizzle/gateway.ts` + `coin/gateways/in-memory/gateway.ts`
- Migrate `reward/gateways/drizzle/gateway.ts` + `reward/gateways/in-memory/gateway.ts`
- Migrate `sponsor/gateways/drizzle/gateway.ts` + `sponsor/gateways/in-memory/gateway.ts`
- Run domain tests after migration
- Report: coin, reward, sponsor domains complete

**Agent 5E - Domain Batch 5 (Notifications):** 8 gateways

- Depends on: Step 3, Step 4 (shard D)
- Migrate `notification/gateways/drizzle/gateway.ts` + `notification/gateways/in-memory/gateway.ts`
- Migrate `notification/gateways/drizzle/delivery.ts` + `notification/gateways/in-memory/delivery.ts`
- Migrate `notification/gateways/drizzle/schedule.ts` + `notification/gateways/in-memory/schedule.ts`
- Migrate `notification/gateways/drizzle/push-subscription.ts` + `notification/gateways/in-memory/push-subscription.ts`
- Run domain tests after migration
- Report: notification domain complete

**Agent 5F - Domain Batch 6 (Reports):** 2 gateways

- Depends on: Step 3, Step 4 (shard D)
- Migrate `submission/gateways/drizzle/report.ts` + `submission/gateways/in-memory/report.ts`
- Run domain tests after migration
- Report: submission/report domain complete
- **Note:** After completing, can assist other agents or begin cross-domain verification

**Shared Verification (after all batches complete):**

- Synchronization point: All agents must report completion
- Run all gateway tests across all domains
- Verify TypeScript compilation
- Compare Drizzle and In-Memory method signatures for parity

**Blockers and Dependencies:**

- Depends on: Step 3 (base classes), Step 4 (port interfaces) - ALL must complete
- Parallel with: Other domain batches (all 6 run simultaneously)
- Blocks: Step 6 (verification)
- Synchronization: All batches must complete and report success before Step 6

**Risks and Mitigations:**
| Risk | Impact | Mitigation |
|------|--------|------------|
| High blast radius (32 files) | Critical | Compile after each batch, run tests incrementally |
| In-Memory parity issues | High | Same agent handles both gateways per domain |
| DTO compliance gaps | Medium | Verify mappers return DTOs, not entities |
| Test failures due to error changes | Medium | Update test assertions to use `_tag` matching |
| Cross-domain test dependencies | Medium | Each agent runs tests for their domains only |

**Verification (Per-Batch):**
| Attribute | Value |
|-----------|-------|
| **Verification Level** | Per-Item |
| **Threshold** | 4.5/5.0 |
| **Evaluation Method** | LLM-as-Judge |

| Criteria             | Weight | Description                                                 |
| -------------------- | ------ | ----------------------------------------------------------- |
| DatabaseError Usage  | 0.25   | All gateways in batch use DatabaseError from unified errors |
| GatewayError Returns | 0.25   | All gateways use GatewayError type for return effects       |
| DTO Compliance       | 0.20   | All gateways return DTOs, not entities                      |
| In-Memory Parity     | 0.20   | In-memory gateways match Drizzle signatures exactly         |
| Test Passage         | 0.10   | All domain tests pass for the batch                         |

**Verification (Final Cross-Batch):**
| Attribute | Value |
|-----------|-------|
| **Verification Level** | Panel |
| **Threshold** | 4.5/5.0 |
| **Evaluation Method** | LLM-as-Judge |

| Criteria                 | Weight | Description                                           |
| ------------------------ | ------ | ----------------------------------------------------- |
| Cross-Domain Consistency | 0.30   | All 32 gateways use consistent error patterns         |
| TypeScript Compilation   | 0.25   | Full codebase compiles with zero errors               |
| Test Suite Passage       | 0.25   | Full test suite passes (bun test)                     |
| Signature Parity         | 0.20   | All Drizzle/In-Memory pairs have identical signatures |

---

### Phase 4: Polish

#### Step 6: Verification and Cleanup

**Goal:** Full verification that all acceptance criteria are met and codebase is clean

**Agent:** sdd:qa-engineer (sonnet)

**Output:** Clean codebase meeting all Definition of Done criteria

**Success Criteria:**

- [ ] All adapter errors use `Data.TaggedError` pattern
- [ ] All adapter errors conform to `GatewayError` interface
- [ ] `DatabaseError` is the only database error type used
- [ ] No duplicate error types exist
- [ ] All 12+ domains' gateways return unified error types
- [ ] All gateways return DTOs (verified by TypeScript)
- [ ] In-memory gateways have identical signatures to Drizzle gateways
- [ ] All existing tests pass
- [ ] TypeScript compilation succeeds with zero errors
- [ ] Linter passes without error-related violations

**Subtasks:**

1. Verify all 6 domain batches from Step 5 have reported completion
2. Run full TypeScript compilation across all packages
3. Run full test suite (`bun test`)
4. Run linter (`bun lint`)
5. Search for any remaining plain Error usages in adapters
6. Search for any duplicate error type definitions
7. Verify no repository-specific error types remain
8. Run integration tests if available
9. Update any documentation referencing old error types
10. Create migration notes for developers

**Blockers and Dependencies:**

- Depends on: Step 5 (all gateways migrated) - ALL 6 batches must complete
- Blocks: None (final step)
- Parallel with: None (sequential final verification)

**Risks and Mitigations:**
| Risk | Impact | Mitigation |
|------|--------|------------|
| Integration test failures | Medium | Run integration tests separately to isolate issues |
| Performance regression | Low | No expected performance impact from error type changes |

**Verification:**
| Attribute | Value |
|-----------|-------|
| **Verification Level** | Single |
| **Threshold** | 4.0/5.0 |
| **Evaluation Method** | Automated + LLM-as-Judge |

| Criteria                  | Weight | Description                                          |
| ------------------------- | ------ | ---------------------------------------------------- |
| Data.TaggedError Pattern  | 0.20   | All adapter errors use Data.TaggedError pattern      |
| GatewayError Compliance   | 0.20   | All adapter errors conform to GatewayError interface |
| DatabaseError Unification | 0.20   | DatabaseError is the only database error type used   |
| Duplicate Elimination     | 0.15   | No duplicate error types exist between layers        |
| Quality Gates             | 0.25   | All tests pass, TypeScript compiles, linter passes   |

---

### Implementation Summary Table

| Step ID | Name                     | Priority | Estimate | Agent Type           | Parallelization | Output Files                       |
| ------- | ------------------------ | -------- | -------- | -------------------- | --------------- | ---------------------------------- |
| 1       | Error Type Consolidation | P0       | 3h       | sdd:tech-lead (opus) | Sequential      | adapter-errors.ts                  |
| 2       | Layer Re-exports Setup   | P0       | 0.5h     | sdd:tech-lead (opus) | Sequential      | 2 re-export files                  |
| 3       | Base Class Updates       | P0       | 4h       | sdd:tech-lead (opus) | Parallel (2)    | drizzle-base.ts, in-memory-base.ts |
| 4       | Port Interface Updates   | P0       | 3h       | sdd:developer ×4     | Parallel (4)    | 16 port gateway.ts files           |
| 5       | Gateway Migration        | P0       | 12h      | sdd:developer ×6     | Parallel (6)    | 32 gateway files                   |
| 6       | Verification & Testing   | P0       | 3h       | sdd:qa-engineer      | Sequential      | Clean codebase                     |

**Maximum Parallelization Depth:** 6 agents (during Step 5)
**Total Estimated Effort:** 25.5 engineering hours (wall-clock: ~16h with parallelization)
**Critical Path:** Step 1 → Step 2 → [Step 3 || Step 4] → Step 5 → Step 6

---

### Verification Summary Table

| Step | Name                          | Verification Level | Threshold | Evaluation Method        | Criteria Count |
| ---- | ----------------------------- | ------------------ | --------- | ------------------------ | -------------- |
| 1    | Error Type Consolidation      | Panel              | 4.0/5.0   | LLM-as-Judge             | 4              |
| 2    | Layer Re-exports Setup        | Single             | 4.0/5.0   | Automated + LLM-as-Judge | 4              |
| 3    | Base Class Updates            | Panel              | 4.0/5.0   | LLM-as-Judge             | 4              |
| 4    | Port Interface Updates        | Per-Item           | 4.0/5.0   | LLM-as-Judge             | 4              |
| 5a   | Gateway Migration (Per-Batch) | Per-Item           | 4.5/5.0   | LLM-as-Judge             | 5              |
| 5b   | Gateway Migration (Final)     | Panel              | 4.5/5.0   | LLM-as-Judge             | 4              |
| 6    | Verification and Cleanup      | Single             | 4.0/5.0   | Automated + LLM-as-Judge | 5              |

**Notes:**

- Step 5 has two verification entries: per-batch (5a) and final cross-batch (5b)
- Total verification points: 7
- Average threshold: 4.07/5.0
- Panel verifications: 3 (Steps 1, 3, 5b)
- Per-Item verifications: 2 (Steps 4, 5a)
- Single verifications: 2 (Steps 2, 6)

---

### Parallelization Execution Diagram

```
TIME → (sequential phases run left to right, parallel work runs vertically stacked)

┌─────────────────────────────────────────────────────────────────────────────────────┐
│ PHASE 1: SETUP (Sequential)                                                         │
│ ┌───────────────────────────────────────────────────────────────────────────────┐   │
│ │ Step 1: Error Type Consolidation                                              │   │
│ │ Agent: sdd:tech-lead (opus)                                                   │   │
│ │ Duration: 3h                                                                  │   │
│ │ Output: adapter-errors.ts with unified Data.TaggedError pattern               │   │
│ └───────────────────────────────────────────────────────────────────────────────┘   │
│                                    ↓                                                │
│ ┌───────────────────────────────────────────────────────────────────────────────┐   │
│ │ Step 2: Layer Re-exports Setup                                                │   │
│ │ Agent: sdd:tech-lead (opus)                                                   │   │
│ │ Duration: 0.5h                                                                │   │
│ │ Output: 2 re-export files for clean layer imports                             │   │
│ └───────────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────────────┐
│ PHASE 2: FOUNDATION (Parallel - 5 agents)                                           │
│                                                                                     │
│  ┌─────────────────────────────────────────┐  ┌─────────────────────────────────┐  │
│  │ Step 3: Base Class Updates              │  │ Step 4: Port Interface Updates  │  │
│  │ Agent: sdd:tech-lead (opus)             │  │ Agents: sdd:developer ×4        │  │
│  │ Duration: 4h                            │  │ Duration: 3h                    │  │
│  │                                         │  │ Shards: A(4), B(4), C(4), D(5)  │  │
│  │ Output: Updated base classes with       │  │                                 │  │
│  │ unified DatabaseError handling          │  │ Output: 16 port files updated   │  │
│  └─────────────────────────────────────────┘  └─────────────────────────────────┘  │
│                                                                                     │
│  Parallel with: Each other (both need Step 2 complete)                              │
│  Sync point: Both must finish before Step 5                                         │
│                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────────────┐
│ PHASE 3: GATEWAY MIGRATION (MAX PARALLEL: 6 agents)                                 │
│                                                                                     │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌─────────────┐│
│  │ Agent 5A     │ │ Agent 5B     │ │ Agent 5C     │ │ Agent 5D     │ │ Agent 5E    ││
│  │ Core         │ │ Challenge    │ │ Social       │ │ Economy      │ │ Notification││
│  │ (6 gates)    │ │ (8 gates)    │ │ (4 gates)    │ │ (6 gates)    │ │ (8 gates)   ││
│  │ user,trip,   │ │ challenge    │ │ group,event  │ │ coin,reward  │ │ notification││
│  │ location     │ │ sub,vote,act │ │              │ │ sponsor      │ │ del,sched,ps││
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘ └─────────────┘│
│                                                                                     │
│  ┌──────────────┐                                                                   │
│  │ Agent 5F     │                                                                   │
│  │ Reports      │                                                                   │
│  │ (2 gates)    │  Note: Can assist others after completion                          │
│  │ submission   │                                                                   │
│  └──────────────┘                                                                   │
│                                                                                     │
│  All agents: sdd:developer (sonnet)                                                 │
│  Duration: 12h (parallel wall-clock)                                                │
│  Total: 32 gateways migrated (16 drizzle + 16 in-memory)                            │
│                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────────────┐
│ PHASE 4: POLISH (Sequential)                                                        │
│ ┌───────────────────────────────────────────────────────────────────────────────┐   │
│ │ Step 6: Verification and Cleanup                                                │   │
│ │ Agent: sdd:qa-engineer (sonnet)                                                 │   │
│ │ Duration: 3h                                                                    │   │
│ │ Output: Verified clean codebase meeting all AC                                  │   │
│ └───────────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

### Sub-agent Execution Directive

#### Launch Prerequisites (MUST VERIFY BEFORE DISPATCH)

Before launching any sub-agents, the parent agent MUST verify:

- [ ] Step 1 is committed and TypeScript compiles with zero errors
- [ ] Step 2 is committed and both re-export files resolve correctly
- [ ] Base error types are stabilized (no further changes allowed during parallel work)
- [ ] A template port interface update is completed and validated (for Step 4 pattern)
- [ ] Git branch is clean with all prerequisite work committed

#### Per-Sub-Agent Requirements (MUST)

Each sub-agent dispatched MUST adhere to:

1. **Scope Isolation:**
   - Work ONLY on assigned shard/batch files
   - Never modify files outside assigned domain
   - Never modify shared base classes (already updated in Step 3)

2. **Error Type Compliance:**
   - MUST use `DatabaseError` from `packages/domain/src/system/errors/unified-errors.ts`
   - MUST use `GatewayError` interface for all return types
   - MUST use `Data.TaggedError` pattern for any new adapter errors

3. **Parity Requirement:**
   - Each agent handles BOTH drizzle and in-memory gateways for their domains
   - In-memory MUST match Drizzle signatures exactly
   - Run tests for both implementations

4. **Testing Mandate:**
   - Run `bun test` for assigned domains only
   - All tests MUST pass before reporting completion
   - Update test assertions to use `_tag` matching if needed

5. **Report Format:**
   Each agent MUST report on completion:
   ```
   Domain/Batch: [name]
   Files Modified: [count]
   Gateways: [drizzle count] + [in-memory count]
   Tests: [passed/total]
   Status: [COMPLETE|BLOCKED|FAILED]
   Notes: [any issues]
   ```

#### Synchronization Points (MUST)

1. **Pre-Parallel Sync:** After Step 2, ALL changes must be committed
2. **Phase 2 Sync:** Step 3 and Step 4 can run in parallel, but both must complete before Step 5
3. **Pre-Step-5 Sync:** ALL port interface updates (Step 4 shards) must be committed
4. **Pre-Step-6 Sync:** ALL domain batches (Step 5) must report COMPLETE status

#### Rollback Strategy

- **Individual Domain Rollback:** If a single batch fails, only that domain's changes are rolled back
- **Full Rollback Trigger:** If Step 3 (base classes) needs changes during Step 5, ALL parallel work must stop and restart
- **Checkpoint:** Commit after each domain batch completes for granular recovery

#### Communication Protocol

Sub-agents communicate through:

1. Git commits (primary state)
2. Status reports in task comments
3. Blocking issues escalate to parent (sdd:tech-lead)

---

### Definition of Done Checklist

#### Error Type Compliance

- [ ] All adapter errors use `Data.TaggedError` pattern (no plain Error classes)
- [ ] All adapter errors conform to `GatewayError` interface (`_tag`, `message`)
- [ ] `DatabaseError` is the only database error type used across all gateways
- [ ] No duplicate error types exist between domain and adapters layers

#### Gateway Consistency

- [ ] All 12+ domains' gateways return unified error types consistently
- [ ] All gateways return DTOs (verified by TypeScript compilation)
- [ ] In-memory gateways have identical signatures to Drizzle gateways

#### Quality Gates

- [ ] All existing tests pass with new error types
- [ ] TypeScript compilation succeeds with zero errors
- [ ] Linter passes without error-related rule violations
- [ ] Integration tests pass (if available)

---

**Decomposition Scratchpad:** `.specs/scratchpad/decomposition-a3f8e2d1b9c4.md`
**Parallelization Scratchpad:** `.specs/scratchpad/parallelize-a7f3e9d2c1b8.md`
