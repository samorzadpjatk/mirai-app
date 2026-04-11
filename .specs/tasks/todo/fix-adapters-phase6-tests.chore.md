---
title: Fix adapters package test file types (Phase 6)
depends_on: ["fix-adapters-phase5-repositories.chore.md"]
---

## Initial User Prompt

Fix Phase 6 of adapters package type errors - update test files for proper Result type handling and error narrowing (~40 errors)

## Description

This chore task fixes TypeScript type errors in the adapters package test files. The errors are related to:
1. **Result type handling** - Accessing `.value` or `.error` without proper type guards
2. **Error narrowing** - Accessing error-specific properties without discriminant narrowing

The task involves updating 12 test files with approximately 40 type errors. All fixes are type-level only with no changes to runtime behavior or test logic.

### Scope

**In Scope:**
- Fix TypeScript type errors in adapters package test files
- Add proper error type narrowing using `_tag` discriminant
- Add Result type guards (`isOk`, `isErr`) where missing

**Out of Scope:**
- Changes to source/production code
- Changes to test logic or assertions
- Fixing errors in other packages

## Acceptance Criteria

### Primary Criteria

1. **Given** the adapters package test files have TypeScript errors related to Result types
   **When** the type checker runs
   **Then** all ~40 errors should be resolved

2. **Given** a test accesses error-specific properties like `sessionId`, `expiredAt`, `channel`, `bucket`, or `path`
   **When** the test code is type-checked
   **Then** proper `_tag` discriminant narrowing should be present

3. **Given** a test accesses Result `.value` or `.error` properties
   **When** the test code is type-checked
   **Then** proper `isOk()` or `isErr()` guards should be present

### Secondary Criteria

4. **All test suites pass** after type fixes (no test behavior changes)
5. **TypeScript compilation succeeds** with zero errors in adapters test files
6. **No new dependencies** required (uses existing patterns)

## Architecture Overview

### Solution Strategy

Apply consistent type narrowing patterns across all affected test files:

1. **Result Value Access** - Always wrap with `if (isOk(result))` guard
2. **Error Property Access** - Always narrow by `_tag` discriminant first
3. **Array Access** - Check length before accessing array elements

### Key Decisions

- **Use `_tag` narrowing** - Follows existing error type discriminant pattern
- **Keep `isOk`/`isErr` guards** - Standard Result type handling pattern
- **Minimal changes** - Only add type narrowing, don't modify test logic

### Reference Files

- **Skill:** `.claude/skills/test-result-patterns/SKILL.md` - Testing patterns guide
- **Analysis:** `.specs/analysis/analysis-fix-adapters-phase6-tests.md` - Detailed error inventory
- **Scratchpad:** `.specs/scratchpad/phase6-test-types.md` - Working notes

### Expected Changes

| File | Errors | Pattern |
|------|--------|---------|
| `InMemoryAdapters.contract.test.ts` | ~13 | Error narrowing, Result guards |
| `InMemoryAuthAdapter.test.ts` | ~6 | Error narrowing, Result guards |
| `PortImplementations.contract.test.ts` | ~1 | Type compatibility |

## Implementation Process

### Phase 1: Fix InMemoryAdapters.contract.test.ts

**Goal:** Fix ~13 TypeScript errors in contract tests

**Success Criteria:**
- [ ] `bun tsc --noEmit` shows no errors for this file
- [ ] All tests in file pass

**Subtasks:**
1. Fix `sessionId`/`expiredAt` access on lines 78-79 (Auth error union)
2. Fix `sessionId`/`expiredAt` access on lines 172, 186 (Session error union)
3. Fix `channel` access on line 259 (Realtime error union)
4. Fix object undefined errors on lines 324-325
5. Fix `bucket`/`path` access on lines 588-589 (Storage error union)
6. Fix `bucket`/`path` access on lines 663-664 (Storage error union)

**Blockers:** None
**Risks:** Low - type-only changes

### Phase 2: Fix InMemoryAuthAdapter.test.ts

**Goal:** Fix ~6 TypeScript errors in unit tests

**Success Criteria:**
- [ ] `bun tsc --noEmit` shows no errors for this file
- [ ] All tests in file pass

**Subtasks:**
1. Fix `token` access on line 126 (Auth error union)
2. Fix `sessionId` access on line 167 (Auth error union)
3. Fix `sessionId` access on line 244 (Auth error union)
4. Fix `sessionId` access on line 262 (Auth error union)
5. Fix `.value` access on line 689 (missing Result guard)

**Blockers:** None
**Risks:** Low - type-only changes

### Phase 3: Fix PortImplementations.contract.test.ts

**Goal:** Fix ~1 TypeScript error in contract tests

**Success Criteria:**
- [ ] `bun tsc --noEmit` shows no errors for this file
- [ ] All tests in file pass

**Subtasks:**
1. Fix type incompatibility on line 343 (InMemoryStorageAdapter vs StoragePort)

**Blockers:** None
**Risks:** Low - type-only changes

### Phase 4: Verification

**Goal:** Verify all fixes and ensure no regressions

**Success Criteria:**
- [ ] All adapters package tests pass
- [ ] TypeScript compilation succeeds for entire adapters package

**Subtasks:**
1. Run `bun tsc --noEmit -p packages/adapters/tsconfig.json`
2. Run `bun test packages/adapters/src/gateways/__tests__/`
3. Verify no test behavior changes

**Definition of Done:**
- Zero TypeScript errors in adapters package test files
- All tests pass
- No changes to production code
- Pattern documented for future reference

## Parallel Execution

### Parallelization Plan

All three main test files can be fixed in parallel:

```
┌─────────────────────────────────────────────────────────────┐
│  Phase 1: Fix InMemoryAdapters.contract.test.ts              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Agent: sdd:developer                                 │   │
│  │ Model: sonnet                                        │   │
│  │ Task: Apply error narrowing patterns                 │   │
│  └─────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│  Phase 2: Fix InMemoryAuthAdapter.test.ts                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Agent: sdd:developer                                 │   │
│  │ Model: sonnet                                        │   │
│  │ Task: Apply error narrowing patterns                 │   │
│  └─────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│  Phase 3: Fix PortImplementations.contract.test.ts          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Agent: sdd:developer                                 │   │
│  │ Model: sonnet                                        │   │
│  │ Task: Fix type compatibility                         │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  Phase 4: Verification (Sequential - after all Phase 1-3)   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Agent: sdd:qa-engineer                               │   │
│  │ Model: sonnet                                        │   │
│  │ Task: Run type check and tests                       │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Dependencies

- **Phase 1, 2, 3:** Independent - can run in parallel
- **Phase 4:** Depends on Phase 1, 2, 3 completion

### Agent Selection

| Phase | Agent | Model | Rationale |
|-------|-------|-------|-----------|
| 1-3 | `sdd:developer` | `sonnet` | Pattern application, not complex architecture |
| 4 | `sdd:qa-engineer` | `sonnet` | Verification tasks |

### Sub-Agent Execution Directive

When implementing this task:
1. **MUST** read the analysis file for specific line numbers and error details
2. **MUST** read the skill file for correct patterns
3. **MUST** apply `_tag` narrowing for error property access
4. **MUST** use `isOk()`/`isErr()` guards for Result access
5. **MUST NOT** change test logic or assertions
6. **MUST** verify TypeScript compiles after changes

## Verification

### Phase 1: InMemoryAdapters.contract.test.ts Verification

**Level:** Per-Item

**Rubric:**
1. Type Compilation (weight: 0.40)
   - `bun tsc --noEmit` shows 0 errors for this file
   - Score: 1=Errors remain, 5=All errors fixed

2. Pattern Consistency (weight: 0.30)
   - Uses `_tag` narrowing for all error property access
   - Uses `isOk()`/`isErr()` for Result access
   - Score: 1=Inconsistent, 5=Perfect pattern application

3. Test Preservation (weight: 0.30)
   - All existing tests pass
   - No test logic changed
   - Score: 1=Tests broken, 5=All tests pass unchanged

### Phase 2: InMemoryAuthAdapter.test.ts Verification

**Level:** Per-Item

**Rubric:**
1. Type Compilation (weight: 0.40)
   - `bun tsc --noEmit` shows 0 errors for this file

2. Pattern Consistency (weight: 0.30)
   - Uses `_tag` narrowing for all error property access
   - Uses `isOk()`/`isErr()` for Result access

3. Test Preservation (weight: 0.30)
   - All existing tests pass
   - No test logic changed

### Phase 3: PortImplementations.contract.test.ts Verification

**Level:** Per-Item

**Rubric:**
1. Type Compilation (weight: 0.50)
   - `bun tsc --noEmit` shows 0 errors for this file

2. Test Preservation (weight: 0.50)
   - All existing tests pass
   - No test logic changed

### Phase 4: Final Verification

**Level:** Panel (comprehensive review)

**Rubric:**
1. Package Compilation (weight: 0.30)
   - Entire adapters package compiles without errors
   - Score: 1=Errors remain, 5=Clean build

2. Test Suite Pass (weight: 0.40)
   - All tests in `packages/adapters/src/gateways/__tests__/` pass
   - Score: 1=Tests failing, 5=All pass

3. Pattern Documentation (weight: 0.30)
   - Changes follow documented patterns
   - No new anti-patterns introduced
   - Score: 1=Deviations found, 5=Perfect adherence

### Verification Summary Table

| Phase | Level | Threshold | Agent |
|-------|-------|-----------|-------|
| 1 | Per-Item | 4.0/5.0 | `sdd:qa-engineer` |
| 2 | Per-Item | 4.0/5.0 | `sdd:qa-engineer` |
| 3 | Per-Item | 4.0/5.0 | `sdd:qa-engineer` |
| 4 | Panel | 4.0/5.0 | `sdd:qa-engineer` |

## Reference

- **Skill:** `.claude/skills/test-result-patterns/SKILL.md`
- **Analysis:** `.specs/analysis/analysis-fix-adapters-phase6-tests.md`
- **Scratchpad:** `.specs/scratchpad/phase6-test-types.md`
