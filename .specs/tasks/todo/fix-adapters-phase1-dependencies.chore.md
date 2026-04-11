---
title: Fix adapters package missing dependencies and module exports (Phase 1)
depends_on: []
---

## Initial User Prompt

Fix Phase 1 of adapters package type errors - resolve missing dependencies and module exports (~38 errors)

## Description

This maintenance task resolves ~38 TypeScript compilation errors in the adapters package that are caused by missing dependency exports and module type mismatches. The errors primarily stem from:

1. **Missing exports**: Types like `UserRole` are imported from `@mirai-app/use-cases` but not exported from that package's index.ts
2. **Type mismatches**: Controller DTOs don't match expected use-case output types
3. **Missing re-exports**: Some domain types need to be re-exported through the use-cases layer

The fix involves adding the necessary exports to package index files and aligning type definitions without changing runtime behavior. This is Phase 1 of a multi-phase adapters package cleanup.

**Scope**:
- **Included**: Export fixes in use-cases and domain packages, type alignment in adapters controllers
- **Excluded**: Logic changes, test fixes, Phase 2+ errors (error classes, controllers, mappers, repositories, tests)

**User Scenarios**:
1. **Primary Flow**: Developer runs type check and it passes without errors
2. **Error Handling**: If type mismatches exist, they are fixed by aligning DTOs

## Acceptance Criteria

### Functional Requirements

- [ ] **Export UserRole**: `UserRole` enum is exported from `@mirai-app/use-cases` package index
  - Given: UserRole is defined in domain package
  - When: Checking use-cases exports
  - Then: UserRole is available from @mirai-app/use-cases

- [ ] **Type errors resolved**: Running `tsc --noEmit` in adapters package shows 0 errors
  - Given: Adapters package has ~38 TypeScript errors
  - When: Type check is run after fixes
  - Then: No TypeScript errors remain in Phase 1 scope

- [ ] **No circular dependencies**: Dependency graph remains valid
  - Given: Clean Architecture dependency rules
  - When: Dependencies are modified
  - Then: No circular dependencies introduced (validate with dependency-cruiser)

### Definition of Done

- [ ] All acceptance criteria pass
- [ ] Type check passes in adapters package
- [ ] No changes to runtime behavior (type-only fixes)
- [ ] Code reviewed

---

## Architecture Overview

### Solution Strategy

This is a mechanical type-fixing task that follows the Clean Architecture dependency flow:

1. **Domain Layer**: Ensure types are exported from `@mirai-app/domain`
2. **Use Cases Layer**: Re-export domain types needed by adapters from `@mirai-app/use-cases`
3. **Adapters Layer**: Align controller DTOs with use-case output types

### Key Decisions

- **Export Pattern**: Use `export { UserRole } from "@mirai-app/domain"` pattern for re-exporting
- **Type Alignment**: Update DTOs to match use-case outputs rather than changing use-cases
- **Scope Limitation**: Focus only on dependency/export errors, not logic errors

### Expected Changes

**Files to Modify:**
- `packages/use-cases/src/index.ts` - Add UserRole export
- `packages/adapters/src/controllers/challenge-submission.ts` - Fix Group DTO
- `packages/adapters/src/controllers/challenge-vote.ts` - Fix repository type
- `packages/adapters/src/controllers/coin-transaction.ts` - Fix CoinTransaction type
- `packages/adapters/src/controllers/coin.ts` - Fix string assignments
- `packages/adapters/src/controllers/notification-schedule.ts` - Fix filter types
- `packages/adapters/src/controllers/notification.ts` - Fix error/notification types

### References

- **Research**: See scratchpad at `.specs/scratchpad/a1b2c3d4e5f67890.md`
- **Codebase Analysis**: See `.specs/analysis/analysis-fix-adapters-phase1-dependencies.md`

---

## Implementation Process

### Phase 1A: Fix Missing Exports (Priority: HIGH)
**Goal**: Add missing exports to use-cases package index.ts
**Output**: Updated packages/use-cases/src/index.ts with UserRole export
**Success Criteria**:
- UserRole can be imported from @mirai-app/use-cases
- No new circular dependencies introduced

**Sub-tasks**:
1. [ ] Identify all missing domain type exports needed by adapters
2. [ ] Add `export { UserRole } from "@mirai-app/domain"` to use-cases index.ts
3. [ ] Add any other missing type exports
4. [ ] Verify with type check

**Blockers**: None
**Risks**: LOW - Export additions are mechanical and safe

### Phase 1B: Fix Type Mismatches in Controllers (Priority: HIGH)
**Goal**: Align controller DTOs with use-case output types
**Output**: Updated controller files with matching types
**Success Criteria**:
- All controller DTOs match use-case output types
- Type check passes in adapters package

**Sub-tasks**:
1. [ ] Fix Group DTO in challenge-submission.ts (add description field)
2. [ ] Fix ChallengeSubmissionRepository in challenge-vote.ts
3. [ ] Fix CoinTransaction type in coin-transaction.ts (reason field)
4. [ ] Fix string assignments in coin.ts
5. [ ] Fix NotificationScheduleFilter in notification-schedule.ts
6. [ ] Fix PaginationOptions in notification-schedule.ts
7. [ ] Fix error/notification types in notification.ts

**Blockers**: Phase 1A (exports must be available first)
**Risks**: LOW - Type alignment is mechanical, but verify no runtime changes

### Phase 1C: Verification (Priority: MEDIUM)
**Goal**: Verify all errors resolved and no regressions
**Output**: Type check passing, dependency-cruiser clean
**Success Criteria**:
- `tsc --noEmit` shows 0 errors in adapters package
- `dependency-cruiser` shows no new violations

**Sub-tasks**:
1. [ ] Run type check in adapters package
2. [ ] Run dependency-cruiser validation
3. [ ] Verify no runtime code changes (only types)

**Blockers**: Phase 1A and 1B complete
**Risks**: LOW - Verification only

---

## Parallelization Strategy

### Parallel Execution Groups

**Group 1: Export Fixes (Sequential)**
```
┌─────────────────┐
│ Phase 1A: Exports│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Phase 1B: Types │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Phase 1C: Verify│
└─────────────────┘
```

### Agent Assignments

| Phase | Agent | Rationale |
|-------|-------|-----------|
| 1A: Exports | sonnet | Simple, mechanical task |
| 1B: Type Fixes | sonnet | Pattern-matching, mechanical fixes |
| 1C: Verification | haiku | Simple validation commands |

### Dependencies

```
Phase 1A ──► Phase 1B ──► Phase 1C
(Exports)   (Types)      (Verify)
```

### Execution Notes

- Phases must execute sequentially due to dependencies
- Each phase's success criteria must pass before proceeding
- Type check at each phase provides immediate feedback

---

## Verification

### Phase 1A Verification

**Level**: Per-Item (each export checked)

**Rubric**:
1. Export Completeness (weight: 0.50)
   - All required types exported?
   - 1=Missing exports, 3=Adequate, 5=All required types exported

2. No Circular Dependencies (weight: 0.30)
   - dependency-cruiser passes?
   - 1=New violations, 3=No new violations, 5=Clean run

3. Type Check (weight: 0.20)
   - Use-cases package type-checks?
   - 1=Errors remain, 3=Some errors, 5=Clean

**Threshold**: 4.0/5.0

### Phase 1B Verification

**Level**: Per-Item (each controller file checked)

**Rubric**:
1. Type Alignment (weight: 0.50)
   - DTOs match use-case outputs?
   - 1=Mismatches remain, 3=Most fixed, 5=All aligned

2. No Runtime Changes (weight: 0.30)
   - Only type annotations changed?
   - 1=Logic changed, 3=Some risk, 5=Type-only changes

3. Error Resolution (weight: 0.20)
   - Type errors reduced?
   - 1=No improvement, 3=Partial, 5=All Phase 1 errors resolved

**Threshold**: 4.0/5.0

### Phase 1C Verification

**Level**: Single (overall verification)

**Rubric**:
1. Type Check Pass (weight: 0.40)
   - Zero TypeScript errors?
   - 1=Errors remain, 3=Some errors, 5=Zero errors

2. Dependency Graph Clean (weight: 0.30)
   - No new dependency violations?
   - 1=New violations, 3=No new violations, 5=Clean

3. Phase Scope (weight: 0.30)
   - Only Phase 1 errors addressed?
   - 1=Scope creep, 3=Mostly scoped, 5=Strictly Phase 1

**Threshold**: 4.0/5.0

---

## Implementation Summary

| Phase | Output | Agent | Estimated Effort |
|-------|--------|-------|------------------|
| 1A | Export fixes | sonnet | Small (30 min) |
| 1B | Type alignment | sonnet | Medium (1-2 hrs) |
| 1C | Verification | haiku | Small (15 min) |

**Total Estimated Effort**: 2-3 hours
**Critical Path**: 1A → 1B → 1C (sequential)
