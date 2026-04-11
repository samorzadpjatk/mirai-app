---
title: Fix adapters package error classes and DI modules (Phase 2)
depends_on: ["fix-adapters-phase1-dependencies.chore.md"]
---

## Initial User Prompt

Fix Phase 2 of adapters package type errors - add override modifiers to error classes and fix DI module exports (~15 errors)

## Description

Fix TypeScript compilation errors in the adapters package by adding `override` modifiers to error class properties and verifying DI module exports are properly typed.

The adapters package contains error classes that extend the base `Error` class but don't properly declare property overrides with the `override` keyword required by TypeScript strict mode. This causes TypeScript compilation errors when `noImplicitOverride` is enabled. Additionally, the DI module exports may need type declaration adjustments for proper external consumption.

**What is being fixed:**
1. Error classes in `packages/adapters/src/errors/adapter-errors.ts` - ensure `override` modifier is present on properties
2. Error classes in `packages/adapters/src/api/errors.ts` - add `override` modifier to `name` property in ApiError base class
3. Error classes in `packages/adapters/src/controllers/auth/authServer.ts` - add `override` modifier to `name` properties
4. Verify and fix DI module type exports in `packages/adapters/src/modules/*.ts`

**Scope:**
- **Included**: Adding `override` modifiers, fixing type export declarations
- **Excluded**: Logic changes, new error classes, refactoring error hierarchies, runtime behavior changes

**User Scenarios**:
1. **Primary Flow**: TypeScript compiler runs on adapters package with strict mode - all error classes properly declare overrides, compilation succeeds
2. **Error Handling**: Error classes maintain identical runtime behavior while satisfying type checker
3. **DI Module Consumption**: External packages import DI modules with full type information

## Acceptance Criteria

### Functional Requirements

- [ ] **[Error Class Fixes]**: All error classes extending Error have `override` modifier on properties that override base class
  - **Given**: Error classes in adapters package
  - **When**: TypeScript compiler checks with strict mode enabled
  - **Then**: No TS4114 errors (property overrides without `override` modifier)

- [ ] **[ApiError Base Class]**: `ApiError` class in `api/errors.ts` has `override readonly name: string` property
  - **Given**: ApiError extends Error
  - **When**: Constructor sets `this.name = this.constructor.name`
  - **Then**: Property is declared with `override` modifier

- [ ] **[Auth Error Classes]**: AuthenticationError and AuthorizationError in `auth/authServer.ts` have `override` on `name` property
  - **Given**: Error classes extending Error
  - **When**: Constructor sets `this.name = "..."`
  - **Then**: Property is declared with `override readonly name: string`

- [ ] **[DI Module Exports]**: All DI module files export types properly
  - **Given**: UseCaseModule, ControllerModule, RepositoryModule
  - **When**: External packages import these modules
  - **Then**: Type information is available without isolatedModules errors

### Non-Functional Requirements

- [ ] **Zero Regression**: All existing tests pass without modification
- [ ] **Compilation**: `tsc --noEmit` in packages/adapters returns exit code 0
- [ ] **Backward Compatibility**: No changes to error class public APIs or runtime behavior

### Definition of Done

- [ ] All error classes have proper `override` modifiers where required
- [ ] DI module exports are properly typed
- [ ] TypeScript compilation passes (`bun tsc --noEmit` or `tsc --noEmit`)
- [ ] All tests pass (`bun test` in adapters package)
- [ ] Dependent packages compile successfully
- [ ] Code reviewed and approved

## References

- **Skill**: `.claude/skills/typescript-error-fixes/SKILL.md`
- **Analysis**: `.specs/analysis/analysis-fix-adapters-phase2-error-classes.md`
- **Scratchpad**: `.specs/scratchpad/ba-phase2-error-classes.md`
- **TypeScript Override**: https://www.typescriptlang.org/docs/handbook/2/classes.html#overriding

## Implementation Process

### Phase 1: Error Class Property Fixes (Priority: HIGH)

**Files to modify:**

1. `packages/adapters/src/api/errors.ts` (lines 14-27)
   - Add `override readonly name: string` property declaration
   - Ensure subclasses inherit correctly

2. `packages/adapters/src/controllers/auth/authServer.ts` (lines 97-109)
   - Add `override readonly name: string` to AuthenticationError
   - Add `override readonly name: string` to AuthorizationError

3. `packages/adapters/src/errors/adapter-errors.ts` (verify lines 54-331)
   - Verify all error classes have `override` on `message` where redeclared
   - Most already have it, just confirm completeness

**Success Criteria:**
- [ ] TypeScript compiles error class files without override errors

### Phase 2: DI Module Export Verification (Priority: MEDIUM)

**Files to verify:**

1. `packages/adapters/src/modules/UseCaseModule.ts`
   - Check interface exports (ModuleDeps, ModuleDef)
   - Verify token types are exported
   - Add `export type` for interface definitions if needed

2. `packages/adapters/src/modules/ControllerModule.ts`
   - Same verification pattern

3. `packages/adapters/src/modules/RepositoryModule.ts`
   - Same verification pattern

**Success Criteria:**
- [ ] No TS1205 or TS4023 export-related errors
- [ ] External imports have full type information

### Phase 3: Verification (Priority: HIGH)

**Steps:**

1. Run TypeScript compiler: `cd packages/adapters && tsc --noEmit`
2. Run tests: `bun test` in adapters package
3. Verify dependent packages: `cd ../.. && tsc --noEmit` (root level)

**Success Criteria:**
- [ ] Zero TypeScript errors
- [ ] All tests pass
- [ ] No downstream compilation failures

## Risks and Blockers

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Missed error classes | Low | Medium | Comprehensive file grep for `extends Error` |
| DI export cascade issues | Low | Low | Test compilation in dependent packages |
| Test dependencies on error structure | Low | Low | Run full test suite |

## Parallelization

This task has **no parallelization potential** - it's a sequential maintenance task:

```
Phase 1 (Error Classes) → Phase 2 (DI Exports) → Phase 3 (Verification)
```

All phases must complete in order.

## Verification Rubrics

### Phase 1: Error Class Fixes

**Verification Level**: Single Judge  
**Threshold**: 4.0/5.0

| Criterion | Weight | Description |
|-----------|--------|-------------|
| Correctness | 0.40 | All error classes have `override` where required |
| Completeness | 0.35 | No error classes missed in any file |
| Pattern Consistency | 0.25 | Follows existing codebase patterns |

### Phase 2: DI Module Exports

**Verification Level**: Single Judge  
**Threshold**: 4.0/5.0

| Criterion | Weight | Description |
|-----------|--------|-------------|
| Type Export Correctness | 0.50 | Interfaces use `export type` |
| Consumer Compatibility | 0.30 | External imports work correctly |
| No Breaking Changes | 0.20 | Existing code continues to work |

### Phase 3: Final Verification

**Verification Level**: Automated  
**Threshold**: Pass/Fail

| Check | Method |
|-------|--------|
| TypeScript Compilation | `tsc --noEmit` returns 0 |
| Unit Tests | `bun test` passes |
| Integration Check | Dependent packages compile |

## Verification Summary

| Step | Verification Type | Threshold | Judge |
|------|------------------|-----------|-------|
| Error Class Fixes | Single | 4.0/5.0 | sadd:judge |
| DI Module Exports | Single | 4.0/5.0 | sadd:judge |
| Final Verification | Automated | Pass | CI |
