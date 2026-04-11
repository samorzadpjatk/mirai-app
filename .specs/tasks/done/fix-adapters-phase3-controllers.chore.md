---
title: Fix adapters package controller DTO alignment (Phase 3)
depends_on: ["fix-adapters-phase2-error-classes.chore.md"]
---

## Initial User Prompt

Fix Phase 3 of adapters package type errors - align controller DTOs with use-case outputs (~20 errors)

## Description

This task fixes TypeScript type mismatches between controller return types and use-case output types in the adapters package. Controllers currently define their own return types that don't align with what use-cases actually return, causing approximately 23 TypeScript compilation errors across 9 controller files.

**Business Value**:

- Enables TypeScript strict mode compilation
- Prevents runtime type errors through compile-time checking
- Ensures data contract consistency between Clean Architecture layers
- Unblocks CI/CD build pipeline

**Scope**:

- **Included**: Fix all TypeScript type errors in 9 controller files (packages/adapters/src/controllers/)
- **Excluded**: Changes to use-case implementations, domain logic, repository implementations, or test files; no runtime behavior changes

**User Scenarios**:

1. **Primary Flow**: Developer runs `bun tsc --noEmit` and sees zero type errors
2. **Error Handling**: Controller properly unwraps Result<T,E> types and converts errors to strings for tRPC responses
3. **Type Alignment**: Controller DTOs import and use use-case output types directly

## Acceptance Criteria

### Functional Requirements (8 Criteria)

- [ ] **Criterion 1 - Type Alignment**: Controller return types match use-case output types
  - Given: Controllers use use-case outputs
  - When: TypeScript compiler checks types
  - Then: No TS2322 errors (type not assignable)

- [ ] **Criterion 2 - Result Unwrapping**: Controllers properly handle Result<T,E> types
  - Given: Use-case returns Result<T, Error>
  - When: Controller processes the result
  - Then: Code checks `result.kind` before accessing `value` or `error`

- [ ] **Criterion 3 - Error Conversion**: Error objects converted to strings for tRPC
  - Given: Error types (ValidationError, StateTransitionError) exist
  - When: Controller throws TRPCError
  - Then: Error message is a string (not the Error object itself)

- [ ] **Criterion 4 - Nullable Normalization**: undefined converted to null at boundaries
  - Given: Field may be `string | null | undefined`
  - When: Controller returns data
  - Then: Field is `string | null` (undefined normalized to null)

- [ ] **Criterion 5 - Import Fixes**: Broken imports resolved
  - Given: Missing exports (e.g., UserRole)
  - When: Imports are checked
  - Then: All imports resolve correctly (no TS2305/TS2307 errors)

### Non-Functional Requirements (3 Criteria)

- [ ] **Criterion 6 - Zero Type Errors**: `bun tsc --noEmit` in packages/adapters returns zero errors
- [ ] **Criterion 7 - No Runtime Changes**: No changes to actual runtime behavior or business logic
- [ ] **Criterion 8 - Pattern Consistency**: Fixes follow established DTO alignment patterns from SKILL.md

### Definition of Done

- [ ] All 8 acceptance criteria pass
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

### Phase 1: Fix Import/Export Issues (Wave 1)

**Goal**: Resolve module resolution and missing export errors  
**Files**: reward.ts, storage.ts  
**Errors**: 3 (Line 20 in reward.ts, Line 2 in storage.ts)  
**Success Criteria**: TS2305 and TS2307 errors resolved

**Subtasks**:

- [ ] **Step 1.1**: Fix reward.ts Line 20 - Change UserRole import
  - **Action**: Replace `import { UserRole } from "@mirai-app/use-cases";` with `import { UserRole } from "@mirai-app/domain";`
  - **Verify**: `bun tsc --noEmit` shows no TS2305 error for line 20
  - **Pattern**: Pattern 5 - Fix broken imports

- [ ] **Step 1.2**: Fix reward.ts error handlers - Convert errors to strings
  - **Action**: Change all 12 instances of `error: result.error` to `error: result.error.message` (lines 152, 186, 219, 259, 294, 327, 356, 395, 435, 472, 526)
  - **Verify**: Error handlers return string type, not Error object
  - **Pattern**: Pattern 4 - Error to String Conversion

- [ ] **Step 1.3**: Fix storage.ts Line 2 - Resolve SupabaseClient import
  - **Action**: Either import from `@mirai-app/frameworks/supabase` or create local interface
  - **Verify**: `bun tsc --noEmit` shows no TS2307 error for line 2
  - **Pattern**: Pattern 5 - Fix broken imports

**Risks**: Low - import path changes only
**Parallelizable**: Yes - Steps 1.1-1.3 independent
**Estimated Time**: 30 minutes

#### Verification

| Property          | Value                 |
| ----------------- | --------------------- |
| **Level**         | LOW                   |
| **Judge Type**    | Per-Item (file-level) |
| **Threshold**     | 3.5/5.0               |
| **Evaluation ID** | EVAL-1                |

**Rubric**:

| Criterion                                 | Weight | Verification Method                                          |
| ----------------------------------------- | ------ | ------------------------------------------------------------ |
| TS2305 resolved (UserRole import)         | 25%    | Check `import { UserRole } from "@mirai-app/domain"` present |
| TS2307 resolved (SupabaseClient)          | 25%    | Verify import resolves or local interface exists             |
| Error to string conversion (12 instances) | 40%    | Count `error: result.error.message` patterns                 |
| Type check passes                         | 10%    | `bun tsc --noEmit` shows no TS2305/TS2307 errors             |

**LLM-as-Judge Prompt**:

```
Evaluate import/export fixes in Phase 1 (reward.ts, storage.ts).
Check: 1) UserRole import from @mirai-app/domain, 2) SupabaseClient resolved,
3) All 12 error handlers use .message, 4) No TS2305/TS2307 errors.
Score 1-5 per criterion, weighted average must be ≥3.5.
```

---

### Phase 2: Fix Nullable Field Normalization (Wave 1)

**Goal**: Normalize undefined to null at controller boundaries  
**File**: coin.ts  
**Errors**: 2 (Lines 79, 127)  
**Success Criteria**: TS2322 errors resolved

**Subtasks**:

- [ ] **Step 2.1**: Fix coin.ts Line 79 - Normalize nullable reason field
  - **Action**: Change `reason: result.value.transaction.reason` to `reason: result.value.transaction.reason ?? null`
  - **Verify**: Type 'string | null | undefined' assignable to 'string | null'
  - **Pattern**: Pattern 2 - Nullable Field Alignment

- [ ] **Step 2.2**: Fix coin.ts Line 127 - Normalize nullable reason field
  - **Action**: Change `reason: result.value.transaction.reason` to `reason: result.value.transaction.reason ?? null`
  - **Verify**: Type 'string | null | undefined' assignable to 'string | null'
  - **Pattern**: Pattern 2 - Nullable Field Alignment

- [ ] **Step 2.3**: Fix coin.ts error handlers
  - **Action**: Change `error: result.error` to `error: result.error.message` on lines 71, 119
  - **Verify**: Error handlers return string type
  - **Pattern**: Pattern 4 - Error to String Conversion

**Risks**: Low - type-only change
**Parallelizable**: Yes - All steps independent
**Depends on**: Phase 1 (import fixes)
**Estimated Time**: 20 minutes

#### Verification

| Property          | Value                 |
| ----------------- | --------------------- |
| **Level**         | LOW                   |
| **Judge Type**    | Per-Item (file-level) |
| **Threshold**     | 3.5/5.0               |
| **Evaluation ID** | EVAL-2                |

**Rubric**:

| Criterion                         | Weight | Verification Method                                     |
| --------------------------------- | ------ | ------------------------------------------------------- |
| Nullable normalization (line 79)  | 25%    | Check `reason: result.value.transaction.reason ?? null` |
| Nullable normalization (line 127) | 25%    | Check `reason: result.value.transaction.reason ?? null` |
| Error to string conversion        | 30%    | Count 2 instances of `.message` usage                   |
| Type check passes                 | 20%    | `bun tsc --noEmit` shows no TS2322 errors               |

**LLM-as-Judge Prompt**:

```
Evaluate nullable normalization in coin.ts.
Check: 1) Line 79 uses ?? null, 2) Line 127 uses ?? null,
3) Error handlers use .message (2 instances), 4) No TS2322 type errors.
Score 1-5 per criterion, weighted average must be ≥3.5.
```

---

### Phase 3: Fix Filter/Pagination Types (Wave 1)

**Goal**: Align filter types with use-case filter interfaces  
**File**: notification-schedule.ts  
**Errors**: 2 (Lines 196, 197)  
**Success Criteria**: TS2322 errors for filter and pagination types resolved

**Subtasks**:

- [ ] **Step 3.1**: Import filter types from use-cases
  - **Action**: Add `import type { NotificationScheduleFilters, PaginationOptions } from "@mirai-app/use-cases";`
  - **Verify**: Types are available from use-cases package
  - **Pattern**: Pattern 4 - Filter/Pagination Options

- [ ] **Step 3.2**: Fix notification-schedule.ts Line 196 - Filter type
  - **Action**: Cast or type the filter parameter to match use-case expectations
  - **Verify**: Filter type matches NotificationScheduleFilters interface
  - **Pattern**: Pattern 4 - Filter/Pagination Options

- [ ] **Step 3.3**: Fix notification-schedule.ts Line 197 - Pagination type
  - **Action**: Cast or type the pagination parameter to match use-case expectations
  - **Verify**: Pagination type matches PaginationOptions interface
  - **Pattern**: Pattern 4 - Filter/Pagination Options

- [ ] **Step 3.4**: Fix notification-schedule.ts error handlers
  - **Action**: Change all `error: result.error` to `error: result.error.message` (12 instances)
  - **Verify**: All error handlers return string type
  - **Pattern**: Pattern 4 - Error to String Conversion

**Risks**: Low - type-only change
**Parallelizable**: Yes - All steps independent
**Depends on**: Phase 1 (import capability)
**Estimated Time**: 25 minutes

#### Verification

| Property          | Value   |
| ----------------- | ------- |
| **Level**         | MEDIUM  |
| **Judge Type**    | Single  |
| **Threshold**     | 3.5/5.0 |
| **Evaluation ID** | EVAL-3  |

**Rubric**:

| Criterion                        | Weight | Verification Method                                                     |
| -------------------------------- | ------ | ----------------------------------------------------------------------- |
| Filter types imported            | 25%    | Verify `NotificationScheduleFilters` imported from @mirai-app/use-cases |
| Pagination types imported        | 25%    | Verify `PaginationOptions` imported from @mirai-app/use-cases           |
| Filter type alignment (line 196) | 20%    | Check filter parameter matches NotificationScheduleFilters              |
| Pagination alignment (line 197)  | 20%    | Check pagination parameter matches PaginationOptions                    |
| Error to string conversion       | 10%    | Count all 12 instances use `.message`                                   |

**LLM-as-Judge Prompt**:

```
Evaluate filter/pagination type fixes in notification-schedule.ts.
Check: 1) NotificationScheduleFilters imported, 2) PaginationOptions imported,
3) Line 196 properly typed, 4) Line 197 properly typed, 5) All errors use .message.
Score 1-5 per criterion, weighted average must be ≥3.5.
```

---

### Phase 4: Fix Result<T,E> Unwrapping - notification.ts (Wave 2)

**Goal**: Properly unwrap Result types and convert errors to strings  
**File**: notification.ts  
**Errors**: 6 (Lines 223, 300, 311-319, 400)  
**Success Criteria**: All TS2339 and TS2345 errors resolved

**Subtasks**:

- [ ] **Step 4.1**: Fix notification.ts error handlers
  - **Action**: Change `error: result.error` to `error: result.error.message` on line 126
  - **Verify**: Error is string type

- [ ] **Step 4.2**: Fix notification.ts Line 223 - Create notification error
  - **Action**: Change `error: notificationResult.error` to `error: notificationResult.error.message`
  - **Verify**: Error is string type
  - **Pattern**: Pattern 4 - Error to String Conversion

- [ ] **Step 4.3**: Fix notification.ts Lines 293-304 - updateContent Result
  - **Action**: Change `error: contentResult.error` to `error: contentResult.error.message` on line 300
  - **Verify**: Proper Result unwrapping with kind check on line 299
  - **Pattern**: Pattern 3 - Result Type Handling

- [ ] **Step 4.4**: Fix notification.ts Lines 307-316 - updatePriority Result
  - **Action**: Change `error: priorityResult.error` to `error: priorityResult.error.message` on line 312
  - **Verify**: Proper Result unwrapping with kind check
  - **Pattern**: Pattern 3 - Result Type Handling

- [ ] **Step 4.5**: Fix notification.ts Lines 318-328 - updateSchedule Result
  - **Action**: Change `error: scheduleResult.error` to `error: scheduleResult.error.message` on line 324
  - **Verify**: Proper Result unwrapping with kind check
  - **Pattern**: Pattern 3 - Result Type Handling

- [ ] **Step 4.6**: Fix notification.ts Line 400 - updateStatus Result handling
  - **Action**: Verify `updateStatus` returns `Notification` or `Result<Notification, StateTransitionError>`. If Result, add kind check
  - **Verify**: Proper type handling before persisting
  - **Pattern**: Pattern 3 - Result Type Handling

**Risks**: Medium - logic flow changes
**Parallelizable**: Yes - Steps 4.1-4.5 independent (4.6 depends on 4.3-4.5)
**Depends on**: Phase 1-3 (general patterns established)
**Estimated Time**: 45 minutes

#### Verification

| Property           | Value             |
| ------------------ | ----------------- |
| **Level**          | **HIGH**          |
| **Judge Type**     | **2-Panel Judge** |
| **Threshold**      | **4.0/5.0**       |
| **Evaluation IDs** | EVAL-4A, EVAL-4B  |

**Panel A - Error Conversion (EVAL-4A)**:

| Criterion                 | Weight | Verification Method                             |
| ------------------------- | ------ | ----------------------------------------------- |
| Line 126 error conversion | 15%    | Check `error: result.error.message`             |
| Line 223 error conversion | 15%    | Check `error: notificationResult.error.message` |
| Line 300 error conversion | 15%    | Check `error: contentResult.error.message`      |
| Line 312 error conversion | 15%    | Check `error: priorityResult.error.message`     |
| Line 324 error conversion | 15%    | Check `error: scheduleResult.error.message`     |
| Consistent pattern        | 25%    | All error conversions follow same pattern       |

**Panel B - Result Unwrapping (EVAL-4B)**:

| Criterion           | Weight | Verification Method                                            |
| ------------------- | ------ | -------------------------------------------------------------- |
| Line 299 kind check | 20%    | Verify `if (contentResult.kind === "ok")` before value access  |
| Line 307 kind check | 20%    | Verify `if (priorityResult.kind === "ok")` before value access |
| Line 318 kind check | 20%    | Verify `if (scheduleResult.kind === "ok")` before value access |
| Line 400 kind check | 20%    | Verify proper updateStatus Result handling                     |
| Proper error flow   | 20%    | Error cases throw TRPCError with string message                |

**LLM-as-Judge Prompt (Panel A)**:

```
Evaluate error-to-string conversion in notification.ts (Part A).
Focus: Lines 126, 223, 300, 312, 324.
Check: 1) Each uses `.message` property, 2) No raw Error objects,
3) Consistent pattern, 4) Conversion before TRPCError.
Score 1-5 per criterion, weighted average must be ≥4.0.
```

**LLM-as-Judge Prompt (Panel B)**:

```
Evaluate Result<T,E> unwrapping in notification.ts (Part B).
Focus: Lines 293-304, 307-316, 318-328, 400.
Check: 1) All Results checked with .kind === "ok", 2) Error branches handled,
3) No direct .value without check, 4) Matches Pattern 3 from SKILL.md.
Score 1-5 per criterion, weighted average must be ≥4.0.
```

---

### Phase 5: Fix Result<T,E> Unwrapping - trip.ts (Wave 2)

**Goal**: Properly unwrap Result types and convert errors to strings  
**File**: trip.ts  
**Errors**: 5 (Lines 185, 264, 281, 338, 347)  
**Success Criteria**: All error and property access errors resolved

**Subtasks**:

- [ ] **Step 5.1**: Fix trip.ts Line 185 - Create trip error
  - **Action**: Change `error: tripResult.error` to `error: tripResult.error.message`
  - **Verify**: Error is string type
  - **Pattern**: Pattern 4 - Error to String Conversion

- [ ] **Step 5.2**: Fix trip.ts Line 264 - Update details error
  - **Action**: Change `error: detailsResult.error` to `error: detailsResult.error.message`
  - **Verify**: Error is string type with proper Result unwrapping
  - **Pattern**: Pattern 3 - Result Type Handling

- [ ] **Step 5.3**: Fix trip.ts Line 281 - Update dates error
  - **Action**: Change `error: datesResult.error` to `error: datesResult.error.message`
  - **Verify**: Error is string type with proper Result unwrapping
  - **Pattern**: Pattern 3 - Result Type Handling

- [ ] **Step 5.4**: Fix trip.ts Line 338 - canTransitionTo property access
  - **Action**: Verify `canTransitionTo` exists on Trip entity and returns correct type (boolean)
  - **Verify**: No type mismatch when calling method
  - **Pattern**: Pattern 3 - Result Type Handling (if method returns Result)

- [ ] **Step 5.5**: Fix trip.ts Line 347 - updateStatus Result handling
  - **Action**: Verify `updateStatus` returns `Trip` or `Result<Trip, Error>`. If Result, add kind check
  - **Verify**: Proper type handling before persisting
  - **Pattern**: Pattern 3 - Result Type Handling

**Risks**: Medium - logic flow changes
**Parallelizable**: Yes - Steps 5.1-5.3 independent (5.4-5.5 may depend)
**Depends on**: Phase 4 (same patterns)
**Estimated Time**: 40 minutes

#### Verification

| Property           | Value             |
| ------------------ | ----------------- |
| **Level**          | **HIGH**          |
| **Judge Type**     | **2-Panel Judge** |
| **Threshold**      | **4.0/5.0**       |
| **Evaluation IDs** | EVAL-5A, EVAL-5B  |

**Panel A - Error Conversion (EVAL-5A)**:

| Criterion                 | Weight | Verification Method                        |
| ------------------------- | ------ | ------------------------------------------ |
| Line 185 error conversion | 25%    | Check `error: tripResult.error.message`    |
| Line 264 error conversion | 25%    | Check `error: detailsResult.error.message` |
| Line 281 error conversion | 25%    | Check `error: datesResult.error.message`   |
| Consistent pattern        | 25%    | All 3 conversions follow same pattern      |

**Panel B - Entity Method Handling (EVAL-5B)**:

| Criterion                | Weight | Verification Method                                  |
| ------------------------ | ------ | ---------------------------------------------------- |
| Line 338 canTransitionTo | 35%    | Verify method exists on Trip entity, returns boolean |
| Line 347 updateStatus    | 35%    | Verify proper Result<Trip, Error> handling           |
| Result unwrapping        | 30%    | If Result returned, proper kind check before use     |

**LLM-as-Judge Prompt (Panel A)**:

```
Evaluate error-to-string conversion in trip.ts (Part A).
Focus: Lines 185, 264, 281.
Check: 1) Each uses `.message` property, 2) No raw Error objects,
3) Consistent pattern across all sites.
Score 1-5 per criterion, weighted average must be ≥4.0.
```

**LLM-as-Judge Prompt (Panel B)**:

```
Evaluate entity method handling in trip.ts (Part B).
Focus: Lines 338 (canTransitionTo), 347 (updateStatus).
Check: 1) canTransitionTo properly typed and accessible,
2) updateStatus return type correctly handled,
3) If Result, proper kind check before value access.
Score 1-5 per criterion, weighted average must be ≥4.0.
```

---

### Phase 6: Fix Output Type Mismatches (Wave 3)

**Goal**: Align controller return types with use-case outputs  
**Files**: challenge-submission.ts, challenge-vote.ts, coin-transaction.ts  
**Errors**: 5 (3 in challenge-submission.ts, 1 in challenge-vote.ts, 1 in coin-transaction.ts)  
**Success Criteria**: All TS2322 output type errors resolved

**Subtasks**:

- [ ] **Step 6.1**: Fix challenge-submission.ts - Import output types
  - **Action**: Add imports for `GetSubmissionOutput`, `GetSubmissionByChallengeAndGroupOutput`, `ListSubmissionsByChallengeOutput`
  - **Verify**: Types resolve from `@mirai-app/use-cases`
  - **Pattern**: Pattern 1 - Output Type Mismatch

- [ ] **Step 6.2**: Fix challenge-submission.ts Line 137 - getById return type
  - **Action**: Update return type annotation to use `GetSubmissionOutput` directly
  - **Verify**: Controller return type matches use-case output type
  - **Pattern**: Pattern 1 - Output Type Mismatch

- [ ] **Step 6.3**: Fix challenge-submission.ts Line 202 - getByChallengeAndGroup return type
  - **Action**: Update return type annotation to use `GetSubmissionByChallengeAndGroupOutput` directly
  - **Verify**: Controller return type matches use-case output type
  - **Pattern**: Pattern 1 - Output Type Mismatch

- [ ] **Step 6.4**: Fix challenge-submission.ts Line 273 - listByChallenge return type
  - **Action**: Update return type annotation to use `ListSubmissionsByChallengeOutput` directly
  - **Verify**: Controller return type matches use-case output type
  - **Pattern**: Pattern 1 - Output Type Mismatch

- [ ] **Step 6.5**: Fix challenge-submission.ts error handlers
  - **Action**: Change all 6 instances of `error: result.error` to `error: result.error.message`
  - **Verify**: Error handlers return string type

- [ ] **Step 6.6**: Fix challenge-vote.ts Line 360 - Repository interface
  - **Action**: Import `ChallengeSubmissionRepository` from `@mirai-app/use-cases` and replace inline interface (lines 88-100)
  - **Verify**: Repository interface matches use-case expectations
  - **Pattern**: Pattern 1 - Output Type Mismatch (interface alignment)

- [ ] **Step 6.7**: Fix challenge-vote.ts error handlers
  - **Action**: Change all 7 instances of `error: result.error` to `error: result.error.message`
  - **Verify**: Error handlers return string type

- [ ] **Step 6.8**: Fix coin-transaction.ts Line 236 - Output type alignment
  - **Action**: Import `GetCoinAdditionalInsightsOutput` and update return type on lines 212-225
  - **Verify**: Controller return type matches use-case output type
  - **Pattern**: Pattern 1 - Output Type Mismatch

- [ ] **Step 6.9**: Fix coin-transaction.ts error handlers
  - **Action**: Change all 6 instances of `error: result.error` to `error: result.error.message`
  - **Verify**: Error handlers return string type

**Risks**: Medium - signature changes may affect tests
**Parallelizable**: Yes - All 9 steps independent across 3 files
**Depends on**: Phase 1 (import capability)
**Estimated Time**: 60 minutes (20 per file)

#### Verification

| Property           | Value                     |
| ------------------ | ------------------------- |
| **Level**          | MEDIUM                    |
| **Judge Type**     | Single (per file)         |
| **Threshold**      | 3.5/5.0                   |
| **Evaluation IDs** | EVAL-6A, EVAL-6B, EVAL-6C |

**EVAL-6A: challenge-submission.ts**:

| Criterion             | Weight | Verification Method                               |
| --------------------- | ------ | ------------------------------------------------- |
| Output types imported | 25%    | Verify 3 types from @mirai-app/use-cases          |
| Line 137 return type  | 20%    | Check uses GetSubmissionOutput                    |
| Line 202 return type  | 20%    | Check uses GetSubmissionByChallengeAndGroupOutput |
| Line 273 return type  | 20%    | Check uses ListSubmissionsByChallengeOutput       |
| Error conversion      | 15%    | Count 6 instances use `.message`                  |

**EVAL-6B: challenge-vote.ts**:

| Criterion                     | Weight | Verification Method                                |
| ----------------------------- | ------ | -------------------------------------------------- |
| Repository interface imported | 30%    | Verify ChallengeSubmissionRepository imported      |
| Inline interface removed      | 30%    | Check lines 88-100 replaced with import            |
| Line 360 type usage           | 20%    | Verify uses imported ChallengeSubmissionRepository |
| Error conversion              | 20%    | Count 7 instances use `.message`                   |

**EVAL-6C: coin-transaction.ts**:

| Criterion               | Weight | Verification Method                             |
| ----------------------- | ------ | ----------------------------------------------- |
| Output type imported    | 30%    | Verify GetCoinAdditionalInsightsOutput imported |
| Lines 212-225 alignment | 35%    | Check return type updated                       |
| Line 236 type check     | 20%    | Verify no TS2322 error                          |
| Error conversion        | 15%    | Count 6 instances use `.message`                |

**LLM-as-Judge Prompts**:

```
EVAL-6A: Evaluate challenge-submission.ts.
Check: 1) 3 output types imported, 2) Lines 137/202/273 use correct types,
3) All 6 errors use .message. Score 1-5, weighted avg ≥3.5.

EVAL-6B: Evaluate challenge-vote.ts.
Check: 1) Repository interface imported, 2) Lines 88-100 replaced,
3) Line 360 uses imported type, 4) All 7 errors use .message. Score 1-5, weighted avg ≥3.5.

EVAL-6C: Evaluate coin-transaction.ts.
Check: 1) Output type imported, 2) Lines 212-225 aligned,
3) Line 236 no TS2322, 4) All 6 errors use .message. Score 1-5, weighted avg ≥3.5.
```

---

### Verification Summary

| Phase | File(s)                              | Level    | Judge Type  | Threshold   | Eval ID       |
| ----- | ------------------------------------ | -------- | ----------- | ----------- | ------------- |
| 1     | reward.ts, storage.ts                | LOW      | Per-Item    | 3.5/5.0     | EVAL-1        |
| 2     | coin.ts                              | LOW      | Per-Item    | 3.5/5.0     | EVAL-2        |
| 3     | notification-schedule.ts             | MEDIUM   | Single      | 3.5/5.0     | EVAL-3        |
| 4     | notification.ts                      | **HIGH** | **2-Panel** | **4.0/5.0** | EVAL-4A, 4B   |
| 5     | trip.ts                              | **HIGH** | **2-Panel** | **4.0/5.0** | EVAL-5A, 5B   |
| 6     | challenge-\*.ts, coin-transaction.ts | MEDIUM   | Single (×3) | 3.5/5.0     | EVAL-6A,6B,6C |

**Total Evaluations**: 14 (2 Panel + 8 Single + 4 Per-Item)
**Critical Phases**: 2 (notification.ts, trip.ts) requiring 4.0/5.0 threshold
**Standard Phases**: 4 requiring 3.5/5.0 threshold

**Verification Breakdown by Level**:

| Level  | Count | Judge Type | Files                                                                                     |
| ------ | ----- | ---------- | ----------------------------------------------------------------------------------------- |
| HIGH   | 2     | 2-Panel    | notification.ts, trip.ts                                                                  |
| MEDIUM | 4     | Single     | notification-schedule.ts, challenge-submission.ts, challenge-vote.ts, coin-transaction.ts |
| LOW    | 2     | Per-Item   | reward.ts, storage.ts, coin.ts                                                            |

---

### Implementation Summary

| Phase | File(s)                              | Errors | Effort | Priority | Est. Time | Parallelizable     |
| ----- | ------------------------------------ | ------ | ------ | -------- | --------- | ------------------ |
| 1     | reward.ts, storage.ts                | 3      | Small  | High     | 30m       | Yes                |
| 2     | coin.ts                              | 2      | Small  | High     | 20m       | Yes                |
| 3     | notification-schedule.ts             | 2      | Small  | Medium   | 25m       | Yes                |
| 4     | notification.ts                      | 6      | Medium | High     | 45m       | Yes (internal)     |
| 5     | trip.ts                              | 5      | Medium | High     | 40m       | Yes (internal)     |
| 6     | challenge-\*.ts, coin-transaction.ts | 5      | Medium | Medium   | 60m       | Yes (across files) |

**Total**: 9 files, ~23 errors, ~220 minutes estimated

**Critical Path**: No strict dependencies - all 9 files can be fixed in parallel once import capability is established

**Parallel Execution Waves**:

- **Wave 1**: Phases 1-3 (reward.ts, storage.ts, coin.ts, notification-schedule.ts) - 4 files
- **Wave 2**: Phases 4-5 (notification.ts, trip.ts) - 2 files
- **Wave 3**: Phase 6 (challenge-submission.ts, challenge-vote.ts, coin-transaction.ts) - 3 files

All waves can run simultaneously with 9 parallel agents (one per file).

## Parallelized Implementation

### Execution Strategy

All 9 files can be fixed **in parallel** as they touch different code paths. The phases have been restructured into 3 waves for optimal parallel execution:

#### Wave 1: Import/Nullable/Filter Fixes (4 files)

**Corresponds to**: Phases 1, 2, 3  
**Total Errors**: 7 (3 + 2 + 2)  
**Agent**: sonnet  
**Parallel execution**: All 4 files simultaneously

| File                     | Lines | Errors | Fix Pattern                | Agent  | Phase   |
| ------------------------ | ----- | ------ | -------------------------- | ------ | ------- |
| reward.ts                | 531   | 3      | Import fix + error.message | sonnet | Phase 1 |
| storage.ts               | 304   | 1      | Dependency resolution      | sonnet | Phase 1 |
| coin.ts                  | 134   | 2      | Nullable normalization     | sonnet | Phase 2 |
| notification-schedule.ts | 554   | 2      | Filter types               | sonnet | Phase 3 |

**Key Actions per File**:

- **reward.ts**: Change UserRole import source (line 20), convert 12 error handlers to `.message`
- **storage.ts**: Fix SupabaseClient import or create local interface (line 2)
- **coin.ts**: Add `?? null` on lines 79, 127; convert 2 error handlers to `.message`
- **notification-schedule.ts**: Import filter types, apply on lines 196-197; convert 12 error handlers to `.message`

#### Wave 2: Result Pattern Fixes (2 files)

**Corresponds to**: Phases 4, 5  
**Total Errors**: 11 (6 + 5)  
**Agent**: sonnet  
**Parallel execution**: Both files simultaneously

| File            | Lines | Errors | Fix Pattern       | Agent  | Phase   |
| --------------- | ----- | ------ | ----------------- | ------ | ------- |
| notification.ts | 678   | 6      | Result unwrapping | sonnet | Phase 4 |
| trip.ts         | 528   | 5      | Result unwrapping | sonnet | Phase 5 |

**Key Actions per File**:

- **notification.ts**: Fix 6 error conversions (lines 126, 223, 300, 312, 324, 400), verify Result unwrapping
- **trip.ts**: Fix 5 error conversions (lines 185, 264, 281), verify entity methods (lines 338, 347)

#### Wave 3: Output Type Fixes (3 files)

**Corresponds to**: Phase 6  
**Total Errors**: 5 (3 + 1 + 1)  
**Agent**: sonnet  
**Parallel execution**: All 3 files simultaneously

| File                    | Lines | Errors | Fix Pattern          | Agent  | Phase   |
| ----------------------- | ----- | ------ | -------------------- | ------ | ------- |
| challenge-submission.ts | 422   | 3      | Output alignment     | sonnet | Phase 6 |
| challenge-vote.ts       | 376   | 1      | Repository interface | sonnet | Phase 6 |
| coin-transaction.ts     | 302   | 1      | Output alignment     | sonnet | Phase 6 |

**Key Actions per File**:

- **challenge-submission.ts**: Import 3 output types, apply on lines 137, 202, 273; convert 6 error handlers
- **challenge-vote.ts**: Import repository interface (line 360), replace inline definition; convert 7 error handlers
- **coin-transaction.ts**: Import output type, apply on line 236; convert 6 error handlers

### Parallelization Diagram

```
Wave 1 (4 files) ─┬─ reward.ts ────────────────┐
                  ├─ storage.ts ───────────────┤
                  ├─ coin.ts ──────────────────┤ Can all run in parallel
                  └─ notification-schedule.ts ─┘

Wave 2 (2 files) ─┬─ notification.ts ──────────┐ Can all run in parallel
                  └─ trip.ts ──────────────────┘

Wave 3 (3 files) ─┬─ challenge-submission.ts ──┐
                  ├─ challenge-vote.ts ────────┤ Can all run in parallel
                  └─ coin-transaction.ts ──────┘
```

### Sub-Agent Execution Directive

When executing with `/sadd:do-in-parallel`:

1. **Dispatch 9 parallel sub-agents** (one per file)
2. **Each sub-agent receives**:
   - Target file path (e.g., `packages/adapters/src/controllers/reward.ts`)
   - Specific lines to fix (from scratchpad)
   - Pattern to apply (from SKILL.md)
   - Success criteria
3. **Each sub-agent executes**:
   - Read the specific file
   - Apply the appropriate pattern from SKILL.md
   - Fix all TypeScript errors in that file
   - Run `bun tsc --noEmit` to verify
4. **After all complete**: Run full TypeScript check across adapters package
5. **Judge verification**: Each fix reviewed by dedicated judge

**MUST Requirements**:

- Each agent fixes ONLY their assigned file
- All agents run in parallel for maximum efficiency
- Final verification confirms zero errors across all files
- Scratchpad reference: `.specs/tasks/draft/fix-adapters-phase3-controllers.scratchpad.md`

**LLM-as-Judge Verification Requirements**:

| Phase | Post-Implementation Verification                                        |
| ----- | ----------------------------------------------------------------------- |
| 1     | Run EVAL-1 (Per-Item) on reward.ts, storage.ts - Threshold: 3.5/5.0     |
| 2     | Run EVAL-2 (Per-Item) on coin.ts - Threshold: 3.5/5.0                   |
| 3     | Run EVAL-3 (Single) on notification-schedule.ts - Threshold: 3.5/5.0    |
| 4     | Run EVAL-4A + EVAL-4B (2-Panel) on notification.ts - Threshold: 4.0/5.0 |
| 5     | Run EVAL-5A + EVAL-5B (2-Panel) on trip.ts - Threshold: 4.0/5.0         |
| 6     | Run EVAL-6A, 6B, 6C (Single ×3) on challenge files - Threshold: 3.5/5.0 |

**Verification Command**:

```bash
# After all phases complete, verify zero type errors
bun tsc --noEmit --project packages/adapters/tsconfig.json
```

**Judge Invocation Pattern**:

```
# For HIGH level (2-Panel)
/sadd:judge-with-debate file_content="notification.ts" prompt="EVAL-4A rubric..."

# For MEDIUM/LOW level (Single)
/sadd:judge file_content="coin.ts" prompt="EVAL-2 rubric..."
```
