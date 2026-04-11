---
title: Fix adapters package controller DTO alignment (Phase 3)
depends_on: ["fix-adapters-phase2-error-classes.chore.md"]
---

## Initial User Prompt

Fix Phase 3 of adapters package type errors - align controller DTOs with use-case outputs (~20 errors)

## Description

This task fixes TypeScript type mismatches between controller return types and use-case output types in the adapters package. Controllers currently define their own return types that don't align with what use-cases actually return, causing approximately 20 TypeScript compilation errors.

**Business Value**: 
- Enables TypeScript strict mode compilation
- Prevents runtime type errors through compile-time checking
- Ensures data contract consistency between Clean Architecture layers
- Unblocks CI/CD build pipeline

**Scope**:
- **Included**: Fix all TypeScript type errors in controller files (packages/adapters/src/controllers/)
- **Excluded**: Changes to use-case implementations, domain logic, repository implementations, or test files

**User Scenarios**:
1. **Primary Flow**: Developer runs `tsc --noEmit` and sees zero type errors
2. **Error Handling**: Controller properly unwraps Result<T,E> types and converts errors to strings for tRPC responses
3. **Type Alignment**: Controller DTOs import and use use-case output types directly

## Acceptance Criteria

### Functional Requirements

- [ ] **Type Alignment**: Controller return types match use-case output types
  - Given: Controllers use use-case outputs
  - When: TypeScript compiler checks types
  - Then: No TS2322 errors (type not assignable)

- [ ] **Result Unwrapping**: Controllers properly handle Result<T,E> types
  - Given: Use-case returns Result<T, Error>
  - When: Controller processes the result
  - Then: Code checks `result.kind` before accessing `value` or `error`

- [ ] **Error Conversion**: Error objects converted to strings for tRPC
  - Given: Error types (ValidationError, StateTransitionError) exist
  - When: Controller throws TRPCError
  - Then: Error message is a string (not the Error object itself)

- [ ] **Nullable Normalization**: undefined converted to null at boundaries
  - Given: Field may be `string | null | undefined`
  - When: Controller returns data
  - Then: Field is `string | null` (undefined normalized to null)

- [ ] **Import Fixes**: Broken imports resolved
  - Given: Missing exports (e.g., UserRole)
  - When: Imports are checked
  - Then: All imports resolve correctly (no TS2305/TS2307 errors)

### Non-Functional Requirements

- [ ] **Zero Type Errors**: `bun tsc --noEmit` in packages/adapters returns zero errors
- [ ] **No Runtime Changes**: No changes to actual runtime behavior or business logic
- [ ] **Pattern Consistency**: Fixes follow established DTO alignment patterns

### Definition of Done

- [ ] All acceptance criteria pass
- [ ] `bun tsc --noEmit` shows zero errors in adapters package
- [ ] No new test failures introduced
- [ ] Code follows Clean Architecture dependency rules
- [ ] Changes reviewed and approved

## Architecture Overview

### Solution Strategy

1. **Import Use-Case Types**: Import output types directly from `@mirai-app/use-cases` instead of redefining
2. **Result Pattern Handling**: Add proper `if (result.kind === "ok")` checks before accessing values
3. **Error Message Extraction**: Use `error.message` when throwing TRPCError
4. **Boundary Normalization**: Convert `undefined` to `null` for nullable fields

### Key Decisions

- **Type Reuse**: Import types from use-cases rather than duplicating definitions
- **Error Handling**: Consistent pattern for Result<T,E> unwrapping
- **Nullable Strategy**: Normalize at controller boundaries to match tRPC expectations

### Expected Changes

**Files to Modify** (9 files, ~23 errors):
1. `challenge-submission.ts` - 3 output type mismatches
2. `challenge-vote.ts` - 1 repository interface mismatch
3. `coin-transaction.ts` - 1 output type mismatch
4. `coin.ts` - 2 nullable field fixes
5. `notification-schedule.ts` - 2 filter type fixes
6. `notification.ts` - 6 error/result fixes
7. `reward.ts` - 2 import/status fixes
8. `storage.ts` - 1 dependency fix
9. `trip.ts` - 5 error/result fixes

### References

- Skill: `.claude/skills/controller-dto-alignment/SKILL.md`
- Analysis: `.specs/analysis/analysis-fix-adapters-phase3-controllers.md`

## Implementation Process

### Phase 1: Fix Import/Export Issues
**Goal**: Resolve module resolution and missing export errors  
**Output**: Working imports in reward.ts and storage.ts  
**Success Criteria**: TS2305 and TS2307 errors resolved  
**Subtasks**:
- [ ] Update UserRole import path in reward.ts
- [ ] Check/fix supabase dependency in storage.ts
**Risks**: Low - import path changes only

### Phase 2: Fix Nullable Field Normalization  
**Goal**: Normalize undefined to null at controller boundaries  
**Output**: coin.ts with proper nullable types  
**Success Criteria**: TS2322 errors (lines 79, 127) resolved  
**Subtasks**:
- [ ] Identify nullable fields in coin.ts
- [ ] Apply `value ?? null` normalization pattern
**Risks**: Low - type-only change
**Depends on**: Phase 1

### Phase 3: Fix Result<T,E> Unwrapping
**Goal**: Properly unwrap Result types before accessing properties  
**Output**: notification.ts and trip.ts with correct Result handling  
**Success Criteria**: All TS2339 and TS2322 errors resolved (11 total)  
**Subtasks**:
- [ ] Fix notification.ts Result unwrapping (6 errors)
- [ ] Fix trip.ts error type conversions (5 errors)
**Risks**: Medium - logic flow changes, requires testing
**Depends on**: Phase 2

### Phase 4: Fix Output Type Mismatches
**Goal**: Align controller return types with use-case outputs  
**Output**: challenge-submission.ts, challenge-vote.ts, coin-transaction.ts aligned  
**Success Criteria**: All TS2322 errors resolved (5 total)  
**Subtasks**:
- [ ] Fix challenge-submission.ts output types (3 errors)
- [ ] Fix challenge-vote.ts repository interface (1 error)
- [ ] Fix coin-transaction.ts output type (1 error)
**Risks**: Medium - signature changes may affect tests
**Depends on**: Phase 3

### Phase 5: Fix Filter/Pagination Types
**Goal**: Align filter types with use-case filter interfaces  
**Output**: notification-schedule.ts with correct filter types  
**Success Criteria**: TS2322 errors for NotificationScheduleFilter and PaginationOptions resolved  
**Subtasks**:
- [ ] Import filter types from use-cases
- [ ] Apply to notification-schedule.ts (2 errors)
**Risks**: Low - type-only change
**Depends on**: Phase 4

### Implementation Summary

| Phase | File(s) | Errors | Effort | Priority |
|-------|---------|--------|--------|----------|
| 1 | reward.ts, storage.ts | 3 | Small | High |
| 2 | coin.ts | 2 | Small | High |
| 3 | notification.ts, trip.ts | 11 | Medium | High |
| 4 | challenge-*.ts, coin-transaction.ts | 5 | Medium | Medium |
| 5 | notification-schedule.ts | 2 | Small | Medium |

**Total**: 9 files, ~23 errors

**Critical Path**: Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5

### Definition of Done

- [ ] All 23 TypeScript errors resolved
- [ ] `bun tsc --noEmit` shows zero errors in adapters package
- [ ] No new test failures
- [ ] All controller DTOs aligned with use-case outputs

## Parallelized Implementation

### Execution Strategy

All 9 files can be fixed **in parallel** as they touch different code paths:

#### Wave 1: Import/Nullable/Filter Fixes (4 files)
**Agent**: sonnet  
**Parallel execution**: All 4 files simultaneously

| File | Errors | Pattern | Agent |
|------|--------|---------|-------|
| reward.ts | 2 | Import fix | sonnet |
| storage.ts | 1 | Dependency | sonnet |
| coin.ts | 2 | Nullable normalization | sonnet |
| notification-schedule.ts | 2 | Filter types | sonnet |

#### Wave 2: Result Pattern Fixes (2 files)
**Agent**: sonnet  
**Parallel execution**: Both files simultaneously

| File | Errors | Pattern | Agent |
|------|--------|---------|-------|
| notification.ts | 6 | Result unwrapping | sonnet |
| trip.ts | 5 | Result unwrapping | sonnet |

#### Wave 3: Output Type Fixes (3 files)
**Agent**: sonnet  
**Parallel execution**: All 3 files simultaneously

| File | Errors | Pattern | Agent |
|------|--------|---------|-------|
| challenge-submission.ts | 3 | Output alignment | sonnet |
| challenge-vote.ts | 1 | Repository interface | sonnet |
| coin-transaction.ts | 1 | Output alignment | sonnet |

### Parallelization Diagram

```
Wave 1 ─┬─ reward.ts ───────────┐
        ├─ storage.ts ────────┤
        ├─ coin.ts ────────────┤ All waves run in parallel
        └─ notification-schedule.ts ┘

Wave 2 ─┬─ notification.ts ────┐
        └─ trip.ts ────────────┘

Wave 3 ─┬─ challenge-submission.ts ┐
        ├─ challenge-vote.ts ────┤
        └─ coin-transaction.ts ──┘
```

### Sub-Agent Execution Directive

When executing with `/sadd:do-in-parallel`:

1. **Dispatch 9 parallel sub-agents** (one per file)
2. **Each sub-agent**:
   - Reads the specific file
   - Applies the appropriate pattern from SKILL.md
   - Fixes all TypeScript errors in that file
   - Verifies with `bun tsc --noEmit`
3. **After all complete**: Run full TypeScript check
4. **Judge verification**: Each fix reviewed by dedicated judge

**MUST Requirements**:
- Each agent fixes ONLY their assigned file
- All agents run in parallel for maximum efficiency
- Final verification confirms zero errors across all files
