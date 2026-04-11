---
title: Fix adapters package error classes and DI modules (Phase 2)
depends_on: ["fix-adapters-phase1-dependencies.chore.md"]
---

## Initial User Prompt

Fix Phase 2 of adapters package type errors - add override modifiers to error classes and fix DI module exports (~15 errors)

## Description

Fix TypeScript compilation errors in the adapters package by adding explicit `override` modifiers to error class property declarations and ensuring DI module type exports are properly declared. The adapters package currently fails TypeScript's `noImplicitOverride` checks because error classes extending `Error` don't explicitly declare property overrides. Additionally, DI module interfaces may need `export type` declarations for compatibility with `isolatedModules`.

This is a purely type-level maintenance task—no runtime behavior changes, no logic modifications, and no breaking API changes. The goal is to enable strict TypeScript mode in the adapters package as part of a multi-phase codebase quality improvement effort.

**Scope**:

- **Included**: Adding `override` modifiers to error class properties (name, message where applicable), adding `export type` declarations to DI module interfaces
- **Excluded**: Logic changes, new error classes, error hierarchy refactoring, runtime behavior changes, other strict mode flags

**User Scenarios**:

1. **Primary Flow**: Developer runs `tsc --noEmit` on adapters package → all error classes properly declare overrides → compilation succeeds with zero errors
2. **DI Module Import**: External package imports UseCaseModule/ControllerModule/RepositoryModule → type information resolves without TS1205/TS4023 errors
3. **Error Handling**: Application code instantiates error classes at runtime → behavior remains identical to pre-fix state (verified by test passage)

## Acceptance Criteria

### Functional Requirements

- [ ] **[ApiError Override]**: `ApiError` class in `api/errors.ts` declares `override readonly name: string`
  - Given: ApiError extends Error
  - When: TypeScript compiler checks with `noImplicitOverride` enabled
  - Then: No TS4114 error is reported for the `name` property

- [ ] **[Auth Error Overrides]**: AuthenticationError and AuthorizationError in `controllers/auth/authServer.ts` declare `override readonly name: string`
  - Given: Error classes extend Error
  - When: TypeScript compiler checks with `noImplicitOverride` enabled
  - Then: No TS4114 errors are reported for either class

- [ ] **[Adapter Errors Verified]**: All error classes in `errors/adapter-errors.ts` that redeclare base class properties use `override` modifier
  - Given: Error classes extend Error or other base classes
  - When: TypeScript compiler checks the file
  - Then: No TS4114 errors for property overrides

- [ ] **[DI Module Type Exports]**: UseCaseModule, ControllerModule, and RepositoryModule export interfaces with `export type`
  - Given: DI module files define ModuleDeps and ModuleDef interfaces
  - When: External packages import these modules with `isolatedModules` enabled
  - Then: No TS1205 or TS4023 errors occur

### Non-Functional Requirements

- [ ] **Zero Regression**: All existing tests in adapters package pass without modification (`bun test` returns 0)
- [ ] **Compilation Success**: `tsc --noEmit` in packages/adapters returns exit code 0
- [ ] **Backward Compatibility**: No changes to error class public APIs or runtime behavior (verified by test passage)

### Definition of Done

- [ ] All error classes have proper `override` modifiers where required
- [ ] DI module exports use proper `export type` declarations
- [ ] TypeScript compilation passes (`bun tsc --noEmit`)
- [ ] All tests pass (`bun test` in adapters package)
- [ ] Dependent packages compile successfully
- [ ] Code reviewed and approved

## References

- **Skill**: `.claude/skills/typescript-error-fixes/SKILL.md`
- **Analysis**: `.specs/analysis/analysis-fix-adapters-phase2-error-classes.md`
- **Architecture**: `.specs/scratchpad/architecture-phase3-a6bbdf72f358c9b4.md`
- **Scratchpad**: `.specs/scratchpad/business-phase2c-e12dddfd522381e2.md`
- **TypeScript Override**: https://www.typescriptlang.org/docs/handbook/2/classes.html#overriding

## Implementation Process

### Phase 1: Error Class Property Fixes (Priority: HIGH)

#### Phase 1.1: ApiError Override Modifier

**Agent**: `sdd:typescript-specialist` | **Model**: `sonnet` | **Est. Time**: 10 min

**File**: `packages/adapters/src/api/errors.ts` (lines 14-27)

**Current State:**

- `ApiError` sets `this.name = this.constructor.name;` in constructor (line 21)
- No explicit property declaration with `override` modifier

**Subtasks:**

1. Add `override readonly name: string;` property declaration after class opening brace (line 15)
2. Preserve the `this.name = this.constructor.name;` assignment in constructor for runtime behavior
3. Verify 4 subclasses (UnauthorizedError, ForbiddenError, NotFoundError, BadRequestError) still compile correctly

**Success Criteria:**

- [ ] **TS4114 Eliminated**: GIVEN `ApiError` class WHEN running `tsc --noEmit` with `noImplicitOverride` THEN no TS4114 error for `name` property
- [ ] **Subclass Compatibility**: GIVEN `new UnauthorizedError().name` WHEN evaluated THEN returns `"UnauthorizedError"`

---

#### Verification: Phase 1.1 ApiError Override

**Verification Level**: Single  
**Threshold**: 4.0/5.0  
**Judge**: sadd:judge

| Criterion              | Weight   | Description                                                                                                 |
| ---------------------- | -------- | ----------------------------------------------------------------------------------------------------------- |
| Syntax Correctness     | 0.30     | `override readonly name: string;` declaration is syntactically correct and placed after class opening brace |
| Runtime Preservation   | 0.25     | Constructor still assigns `this.name = this.constructor.name;` for correct runtime behavior                 |
| Subclass Compatibility | 0.25     | All 4 subclasses (UnauthorizedError, ForbiddenError, NotFoundError, BadRequestError) compile without errors |
| TS4114 Resolution      | 0.20     | `tsc --noEmit` reports zero TS4114 errors for ApiError and its subclasses                                   |
| **Total**              | **1.00** |                                                                                                             |

**Rationale**: Single judge is sufficient for this focused error class modification. The criteria emphasize both compile-time correctness (override modifier) and runtime behavior preservation (constructor assignment).

---

#### Phase 1.2: Auth Error Override Modifiers

**Agent**: `sdd:typescript-specialist` | **Model**: `sonnet` | **Est. Time**: 10 min

**File**: `packages/adapters/src/controllers/auth/authServer.ts` (lines 97-109)

**Current State:**

- `AuthenticationError` sets `this.name = "AuthenticationError";` in constructor (line 100)
- `AuthorizationError` sets `this.name = "AuthorizationError";` in constructor (line 107)
- Neither has explicit property declaration with `override` modifier

**Subtasks:**

1. Add `override readonly name: string;` to `AuthenticationError` class (after line 97, before constructor)
2. Add `override readonly name: string;` to `AuthorizationError` class (after line 104, before constructor)
3. Verify no other error classes exist in this file by searching for `extends Error`

**Success Criteria:**

- [ ] **TS4114 Eliminated**: GIVEN `AuthenticationError` and `AuthorizationError` classes WHEN running `tsc --noEmit` with `noImplicitOverride` THEN no TS4114 errors
- [ ] **Runtime Behavior**: GIVEN `error.name` checks in catch blocks WHEN executed THEN still match expected values

---

#### Verification: Phase 1.2 Auth Error Overrides

**Verification Level**: Per-Item  
**Threshold**: 4.0/5.0  
**Judge**: sadd:judge

| Criterion                       | Weight   | Description                                                                                             |
| ------------------------------- | -------- | ------------------------------------------------------------------------------------------------------- |
| AuthenticationError Correctness | 0.25     | Class has `override readonly name: string;` declaration before constructor                              |
| AuthorizationError Correctness  | 0.25     | Class has `override readonly name: string;` declaration before constructor                              |
| Error Name Consistency          | 0.20     | Both classes maintain their specific name assignments (`"AuthenticationError"`, `"AuthorizationError"`) |
| Catch Block Compatibility       | 0.15     | Error.name checks in authServer.ts catch blocks still function correctly                                |
| TS4114 Resolution               | 0.15     | `tsc --noEmit` reports zero TS4114 errors for both classes                                              |
| **Total**                       | **1.00** |                                                                                                         |

**Rationale**: Per-Item verification is appropriate since there are two distinct error classes that each need individual verification. Both classes are in the same file and follow the same pattern.

---

#### Phase 1.3: Verify adapter-errors.ts Completeness

**Agent**: `sdd:typescript-specialist` | **Model**: `haiku` | **Est. Time**: 5 min

**File**: `packages/adapters/src/errors/adapter-errors.ts` (lines 54-331)

**Current State:**

- All error classes already have `override readonly message: string` declarations
- `DatabaseError`, `DatabaseConnectionError`, `DatabaseTransactionError`, `ExternalAPIError`, `StorageError`, `MappingError`, `ConfigurationError` all compliant
- `ExternalAPITimeoutError` and `StorageFileNotFoundError` don't override message (correct - use inherited via `super()`)

**Subtasks:**

1. Verify no additional classes need override (comprehensive check)
2. Run grep across adapters package to find any missed `extends Error` patterns

**Success Criteria:**

- [ ] **Zero TS4114**: GIVEN `adapter-errors.ts` WHEN running `tsc --noEmit` THEN zero TS4114 errors
- [ ] **Completeness**: GIVEN grep for `extends Error` in `packages/adapters/src` THEN all error classes accounted for in Phase 1

---

#### Verification: Phase 1.3 adapter-errors.ts Completeness

**Verification Level**: Single  
**Threshold**: 4.0/5.0  
**Judge**: sadd:judge

| Criterion                 | Weight   | Description                                                                                                                                          |
| ------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Override Completeness     | 0.30     | All error classes with redeclared properties have `override readonly message: string`                                                                |
| File Scan Coverage        | 0.25     | Grep for `extends Error` in packages/adapters/src finds no unverified error classes                                                                  |
| Existing Classes Verified | 0.25     | DatabaseError, DatabaseConnectionError, DatabaseTransactionError, ExternalAPIError, StorageError, MappingError, ConfigurationError are all compliant |
| Subclass Correctness      | 0.20     | ExternalAPITimeoutError and StorageFileNotFoundError correctly inherit message via `super()` without override                                        |
| **Total**                 | **1.00** |                                                                                                                                                      |

**Rationale**: This is a verification-only task to confirm existing compliance. Single judge is sufficient since no code changes are expected, only confirmation that all error classes are properly configured.

---

### Phase 2: DI Module Export Verification (Priority: MEDIUM)

#### Phase 2.1: UseCaseModule Type Exports

**Agent**: `sdd:typescript-specialist` | **Model**: `sonnet` | **Est. Time**: 10 min

**File**: `packages/adapters/src/modules/UseCaseModule.ts` (lines 411-441, 529-659)

**Current State:**

- `UseCaseModuleDeps` interface exported (line 411)
- `UseCaseModule` uses `StaticModule<any>` type parameter (line 529)
- `ProviderType` and `ProviderConfig` exported (lines 166-178)

**Subtasks:**

1. Verify `ProviderType` type export uses `export type` if needed for `isolatedModules`
2. Verify `ProviderConfig` interface export uses `export type` if needed
3. Verify `UseCaseModuleDeps` interface export uses `export type` if needed
4. Consider changing `createStaticModule<any>` to `createStaticModule<UseCaseModuleDef>` for consistency
5. Check `AuthUseCaseToken` and `PortToken` type exports (lines 275-281)

**Success Criteria:**

- [ ] **TS1205 Eliminated**: GIVEN `UseCaseModule.ts` WHEN compiling with `isolatedModules` THEN no TS1205 errors for type re-exports
- [ ] **Type Resolution**: GIVEN external import of `UseCaseModuleDeps` WHEN TypeScript resolves THEN no TS4023 "cannot be named" error

---

#### Verification: Phase 2.1 UseCaseModule Type Exports

**Verification Level**: Single  
**Threshold**: 4.0/5.0  
**Judge**: sadd:judge

| Criterion                | Weight   | Description                                                                               |
| ------------------------ | -------- | ----------------------------------------------------------------------------------------- |
| ProviderType Export      | 0.20     | Type uses `export type` declaration for isolatedModules compatibility                     |
| ProviderConfig Export    | 0.20     | Interface uses `export type` declaration for isolatedModules compatibility                |
| UseCaseModuleDeps Export | 0.20     | Interface uses `export type` declaration for isolatedModules compatibility                |
| Generic Consistency      | 0.20     | `createStaticModule<any>` changed to `createStaticModule<UseCaseModuleDef>` if applicable |
| Token Type Exports       | 0.20     | `AuthUseCaseToken` and `PortToken` have proper type exports                               |
| **Total**                | **1.00** |                                                                                           |

**Rationale**: Single judge is sufficient for type export declarations. This is a straightforward TypeScript configuration task with clear success criteria (no TS1205/TS4023 errors).

---

#### Phase 2.2: ControllerModule Type Exports

**Agent**: `sdd:typescript-specialist` | **Model**: `sonnet` | **Est. Time**: 8 min

**File**: `packages/adapters/src/modules/ControllerModule.ts` (lines 75-125, 133-236)

**Current State:**

- `ControllerModuleDeps` interface exported (line 75)
- `ControllerModuleDef` interface exported (line 121)
- `ControllerModule` uses proper generic `StaticModule<ControllerModuleDef>` (line 133)
- `ServiceToken` and `ControllerToken` types derived from consts (lines 51, 72-73)

**Subtasks:**

1. Verify `ServiceToken` type needs `export type` declaration
2. Verify `ControllerToken` type needs `export type` declaration
3. Verify `ControllerModuleDeps` and `ControllerModuleDef` interface exports
4. Test external import from another package

**Success Criteria:**

- [ ] **TS1205 Eliminated**: GIVEN `ControllerModule.ts` WHEN compiling with `isolatedModules` THEN no TS1205 errors
- [ ] **Token Types**: GIVEN usage of `ServiceToken` or `ControllerToken` in type annotations THEN types resolve correctly

---

#### Verification: Phase 2.2 ControllerModule Type Exports

**Verification Level**: Single  
**Threshold**: 4.0/5.0  
**Judge**: sadd:judge

| Criterion                  | Weight   | Description                                                           |
| -------------------------- | -------- | --------------------------------------------------------------------- |
| ServiceToken Export        | 0.25     | Type uses `export type` declaration for isolatedModules compatibility |
| ControllerToken Export     | 0.25     | Type uses `export type` declaration for isolatedModules compatibility |
| Interface Exports          | 0.25     | `ControllerModuleDeps` and `ControllerModuleDef` use `export type`    |
| External Import Test       | 0.15     | Test import from another package works without TS1205/TS4023 errors   |
| Type Annotation Resolution | 0.10     | Token types resolve correctly in type annotations                     |
| **Total**                  | **1.00** |                                                                       |

**Rationale**: Single judge is sufficient for this type export verification. ControllerModule has fewer moving parts than UseCaseModule, so the rubric is slightly simpler.

---

#### Phase 2.3: RepositoryModule Type Exports

**Agent**: `sdd:typescript-specialist` | **Model**: `sonnet` | **Est. Time**: 8 min

**File**: `packages/adapters/src/modules/RepositoryModule.ts` (lines 187-274, 302-374)

**Current State:**

- `RepositoryModuleDeps` interface exported (line 187)
- `RepositoryModuleDef` interface exported (line 252)
- `RepositoryModule` uses proper generic `StaticModule<RepositoryModuleDef>` (line 302)
- `RepositoryToken` type derived from const (lines 159-160)

**Subtasks:**

1. Verify `RepositoryToken` type needs `export type` declaration
2. Verify `RepositoryModuleDeps` and `RepositoryModuleDef` interface exports
3. Check repository re-exports at bottom (lines 380-398) for type issues
4. Test external import of `RepositoryModuleDeps` type

**Success Criteria:**

- [ ] **TS1205 Eliminated**: GIVEN `RepositoryModule.ts` WHEN compiling with `isolatedModules` THEN no TS1205 errors
- [ ] **Repository Types**: GIVEN external import of `RepositoryModuleDeps` WHEN resolving THEN all 17 repository types are accessible

---

#### Verification: Phase 2.3 RepositoryModule Type Exports

**Verification Level**: Single  
**Threshold**: 4.0/5.0  
**Judge**: sadd:judge

| Criterion              | Weight   | Description                                                                            |
| ---------------------- | -------- | -------------------------------------------------------------------------------------- |
| RepositoryToken Export | 0.25     | Type uses `export type` declaration for isolatedModules compatibility                  |
| Interface Exports      | 0.25     | `RepositoryModuleDeps` and `RepositoryModuleDef` use `export type`                     |
| Re-export Type Safety  | 0.20     | Repository re-exports at bottom (lines 380-398) have proper type annotations if needed |
| External Import Test   | 0.15     | Test import of `RepositoryModuleDeps` works with all 17 repository types accessible    |
| No TS1205 Errors       | 0.15     | Compiles with `isolatedModules` flag without TS1205 errors                             |
| **Total**              | **1.00** |                                                                                        |

**Rationale**: Single judge is sufficient. RepositoryModule is complex (17 repositories) but the type export pattern is consistent with other modules.

---

### Phase 3: Verification (Priority: HIGH)

#### Phase 3.1: TypeScript Compilation Verification

**Agent**: `sdd:qa-engineer` | **Model**: `sonnet` | **Est. Time**: 5 min

**Subtasks:**

1. Run `cd packages/adapters && tsc --noEmit` and verify exit code 0
2. Verify specific error codes eliminated (TS4114, TS1205, TS4023)
3. Run with `isolatedModules` flag: `tsc --noEmit --isolatedModules`

**Success Criteria:**

- [ ] **Zero Errors**: GIVEN adapters package WHEN running `tsc --noEmit` THEN exit code is 0
- [ ] **Error Code Check**: GIVEN compilation output WHEN searching for TS4114, TS1205, TS4023 THEN zero occurrences

---

#### Verification: Phase 3.1 TypeScript Compilation

**Verification Level**: Automated  
**Threshold**: Pass/Fail  
**Judge**: CI / `tsc --noEmit`

| Check             | Method                                 | Expected Result  |
| ----------------- | -------------------------------------- | ---------------- |
| Basic Compilation | `cd packages/adapters && tsc --noEmit` | Exit code 0      |
| Isolated Modules  | `tsc --noEmit --isolatedModules`       | Exit code 0      |
| TS4114 Check      | Search compilation output              | Zero occurrences |
| TS1205 Check      | Search compilation output              | Zero occurrences |
| TS4023 Check      | Search compilation output              | Zero occurrences |

**Rationale**: This is an automated verification since it's purely a compiler check with binary pass/fail outcome. No subjective judgment required.

---

#### Phase 3.2: Unit Test Verification

**Agent**: `sdd:qa-engineer` | **Model**: `sonnet` | **Est. Time**: 10 min

**Subtasks:**

1. Run `cd packages/adapters && bun test` and verify all tests pass
2. Verify specific error class tests (ApiError, AuthenticationError, AuthorizationError)
3. Verify DI module resolution tests

**Success Criteria:**

- [ ] **All Pass**: GIVEN adapters package test suite WHEN running `bun test` THEN exit code is 0
- [ ] **No Regressions**: GIVEN test output THEN zero test failures related to error classes or DI modules

---

#### Verification: Phase 3.2 Unit Test Verification

**Verification Level**: Automated  
**Threshold**: Pass/Fail  
**Judge**: CI / `bun test`

| Check            | Method                             | Expected Result                                    |
| ---------------- | ---------------------------------- | -------------------------------------------------- |
| Test Suite Pass  | `cd packages/adapters && bun test` | Exit code 0                                        |
| ApiError Tests   | Review test output                 | All pass                                           |
| Auth Error Tests | Review test output                 | All pass                                           |
| DI Module Tests  | Review test output                 | All pass                                           |
| Zero Regressions | Review test output                 | No failures related to error classes or DI modules |

**Rationale**: Automated verification since tests provide binary pass/fail outcomes. Test passage confirms no runtime behavior changes from the type-only modifications.

---

#### Phase 3.3: Integration Verification

**Agent**: `sdd:qa-engineer` | **Model**: `sonnet` | **Est. Time**: 8 min

**Subtasks:**

1. Run `tsc --noEmit` at root level to verify dependent packages compile
2. Verify cross-package imports work (apps/backend-server, etc.)
3. Run root-level tests if available

**Success Criteria:**

- [ ] **Root Compilation**: GIVEN root-level compilation WHEN running `tsc --noEmit` THEN zero errors from adapters package
- [ ] **Cross-Package**: GIVEN dependent packages importing from adapters THEN no TS1205 or TS4023 errors occur

---

#### Verification: Phase 3.3 Integration Verification

**Verification Level**: Single  
**Threshold**: 4.0/5.0  
**Judge**: sadd:judge

| Criterion             | Weight   | Description                                                                |
| --------------------- | -------- | -------------------------------------------------------------------------- |
| Root Compilation      | 0.30     | `tsc --noEmit` at root level passes with zero errors from adapters package |
| Cross-Package Imports | 0.30     | apps/backend-server and other consumers compile without TS1205/TS4023      |
| Dependent Packages    | 0.25     | All packages depending on adapters compile successfully                    |
| Root Tests            | 0.15     | Root-level tests pass if available                                         |
| **Total**             | **1.00** |                                                                            |

**Rationale**: Single judge is appropriate for integration verification. While important, this is primarily confirming that all upstream changes work together correctly. The rubric emphasizes cross-package compatibility.

---

## Risks and Blockers

### Phase 1 Risks

| Risk                                               | Likelihood | Impact | Mitigation                                                                                                                        |
| -------------------------------------------------- | ---------- | ------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Subclasses of ApiError may need updates            | Low        | Low    | Verify all 4 subclasses (UnauthorizedError, ForbiddenError, NotFoundError, BadRequestError) compile correctly after parent change |
| Runtime behavior change if name assignment removed | Low        | Medium | Keep the `this.name = this.constructor.name;` line to preserve runtime behavior                                                   |
| Missed error classes in other files                | Low        | Medium | Comprehensive grep of `packages/adapters/src` for `extends Error` pattern                                                         |
| Error.name checks in catch blocks may break        | Low        | Low    | Verify AuthServer catch blocks still work with explicit name property                                                             |

### Phase 2 Risks

| Risk                                                 | Likelihood | Impact | Mitigation                                                                                                              |
| ---------------------------------------------------- | ---------- | ------ | ----------------------------------------------------------------------------------------------------------------------- |
| Type inference issues with `createStaticModule<any>` | Medium     | Low    | Change to `createStaticModule<UseCaseModuleDef>` for consistency with other modules                                     |
| Token consts vs types confusion                      | Medium     | Low    | Use `export type` for derived types (`ServiceToken`, `ControllerToken`, `RepositoryToken`), regular `export` for consts |
| Breaking existing imports                            | Low        | Medium | Verify backward compatibility before changes; only add `export type`, don't rename                                      |
| Repository re-exports may need type annotations      | Medium     | Low    | Add explicit type exports for repository classes if TS4023 errors occur                                                 |
| Circular dependency if types reference each other    | Low        | Medium | Check imports before making changes to type exports                                                                     |

### Phase 3 Risks

| Risk                                 | Likelihood | Impact | Mitigation                                                                         |
| ------------------------------------ | ---------- | ------ | ---------------------------------------------------------------------------------- |
| Downstream packages fail compilation | Low        | High   | Test compilation in dependent packages before marking complete                     |
| Test dependencies on error structure | Low        | Low    | Run full test suite; override modifiers are compile-time only, no runtime change   |
| Integration test failures            | Low        | Medium | Run integration tests if available; verify DI container initialization still works |

### Blockers

| Blocker                                                   | Phase   | Resolution                                                | Fallback                                                         |
| --------------------------------------------------------- | ------- | --------------------------------------------------------- | ---------------------------------------------------------------- |
| Dependencies on adapters haven't compiled Phase 1 yet     | Phase 1 | Wait for Phase 1 completion per task dependencies         | Can analyze but not test integration until dependencies resolved |
| Need to understand awilix-modular patterns                | Phase 2 | Review ControllerModule and RepositoryModule for patterns | Document current working state before changes                    |
| Type errors in dependent packages masking adapters errors | Phase 3 | Fix adapters errors first, then verify downstream         | Isolate adapters package compilation to verify fixes             |

### Rollback Plan

If issues are discovered during verification:

1. **Git revert**: All changes are in tracked files, can revert via git
2. **Partial rollback**: Each subtask is independent, can revert specific files:
   - `git checkout packages/adapters/src/api/errors.ts`
   - `git checkout packages/adapters/src/controllers/auth/authServer.ts`
   - `git checkout packages/adapters/src/modules/UseCaseModule.ts`
   - `git checkout packages/adapters/src/modules/ControllerModule.ts`
   - `git checkout packages/adapters/src/modules/RepositoryModule.ts`
3. **Type-only rollback**: If only type exports need reversion:
   - Revert export type changes while keeping override modifiers

**Recovery time**: < 5 minutes per file via git checkout

## Implementation Summary Table

| Wave           | Phase | Subtask                  | Agent                     | Model  | Est. Time | Dependencies           | Verification Method               |
| -------------- | ----- | ------------------------ | ------------------------- | ------ | --------- | ---------------------- | --------------------------------- |
| 1-A            | 1.1   | ApiError override        | sdd:typescript-specialist | sonnet | 10 min    | None                   | `tsc --noEmit` + subclass compile |
| 1-A            | 1.2   | Auth errors override     | sdd:typescript-specialist | sonnet | 10 min    | None                   | `tsc --noEmit` + auth tests       |
| 1-A            | 1.3   | Verify adapter-errors    | sdd:typescript-specialist | haiku  | 5 min     | None                   | `tsc --noEmit` + grep             |
| 1-B            | 2.1   | UseCaseModule exports    | sdd:typescript-specialist | sonnet | 10 min    | Wave 1-A started       | `tsc --noEmit --isolatedModules`  |
| 1-B            | 2.2   | ControllerModule exports | sdd:typescript-specialist | sonnet | 8 min     | Wave 1-A started       | `tsc --noEmit --isolatedModules`  |
| 1-B            | 2.3   | RepositoryModule exports | sdd:typescript-specialist | sonnet | 8 min     | Wave 1-A started       | `tsc --noEmit --isolatedModules`  |
| 2-A            | 3.1   | TypeScript compilation   | sdd:qa-engineer           | sonnet | 5 min     | Waves 1-A,1-B complete | `tsc --noEmit` exit 0             |
| 2-A            | 3.2   | Unit test verification   | sdd:qa-engineer           | sonnet | 10 min    | Waves 1-A,1-B complete | `bun test` exit 0                 |
| 2-A            | 3.3   | Integration verification | sdd:qa-engineer           | sonnet | 8 min     | Waves 1-A,1-B complete | Root `tsc --noEmit`               |
| **Wall-Clock** |       | **~35-45 min**           |                           |        |           |                        |                                   |
| **Sequential** |       | **~85 min**              |                           |        |           |                        |                                   |

**Parallelization Savings**: ~40-50 minutes (47-59% reduction)

## Parallelization

This task has **high parallelization potential** with wave-based execution:

### Wave-Based Execution Model

**Wave 1-A** (Immediate parallel execution - 0-10 min):

```
├─ 1.1 ApiError [sdd:typescript-specialist/sonnet]
├─ 1.2 Auth errors [sdd:typescript-specialist/sonnet]
└─ 1.3 Verify adapter-errors [sdd:typescript-specialist/haiku]
```

**Wave 1-B** (Parallel with Wave 1-A completion - 0-15 min):

```
├─ 2.1 UseCaseModule type exports [sdd:typescript-specialist/sonnet]
├─ 2.2 ControllerModule type exports [sdd:typescript-specialist/sonnet]
└─ 2.3 RepositoryModule type exports [sdd:typescript-specialist/sonnet]
```

**Wave 2-A** (Parallel verification - 15-35 min):

```
├─ 3.1 TypeScript compilation [sdd:qa-engineer/sonnet]
├─ 3.2 Unit test verification [sdd:qa-engineer/sonnet]
└─ 3.3 Integration verification [sdd:qa-engineer/sonnet]
```

### Parallelization Rationale

**Phase 1 tasks** are truly independent (different files):

- 1.1: `api/errors.ts` - ApiError class modifications
- 1.2: `controllers/auth/authServer.ts` - Auth error classes
- 1.3: `errors/adapter-errors.ts` - Verification only

**Phase 2 tasks** can start immediately (Wave 1-B):

- DI module files don't import from Phase 1 files
- Type export declarations are independent work
- Only dependency: Both Wave 1-A and 1-B must complete before Phase 3

**Phase 3 tasks** can run in parallel:

- 3.1 (tsc check), 3.2 (unit tests), 3.3 (integration) are independent
- Fast-fail: If 3.1 fails, abort 3.2 and 3.3 to save time
- If 3.1 passes, 3.2 and 3.3 provide parallel feedback

### Critical Path Analysis

```
Wave 1-A (max 10 min) → Wave 1-B (max 10 min) → Wave 2-A (max 10 min)

Total Wall-Clock: ~30-45 minutes (vs. 85 min sequential estimate)
```

### Agent Assignment Summary

| Subtask              | Agent                     | Model  | Est. Time |
| -------------------- | ------------------------- | ------ | --------- |
| 1.1 ApiError         | sdd:typescript-specialist | sonnet | 10 min    |
| 1.2 Auth errors      | sdd:typescript-specialist | sonnet | 10 min    |
| 1.3 Verify           | sdd:typescript-specialist | haiku  | 5 min     |
| 2.1 UseCaseModule    | sdd:typescript-specialist | sonnet | 10 min    |
| 2.2 ControllerModule | sdd:typescript-specialist | sonnet | 8 min     |
| 2.3 RepositoryModule | sdd:typescript-specialist | sonnet | 8 min     |
| 3.1 tsc check        | sdd:qa-engineer           | sonnet | 5 min     |
| 3.2 Unit tests       | sdd:qa-engineer           | sonnet | 10 min    |
| 3.3 Integration      | sdd:qa-engineer           | sonnet | 8 min     |

**Detailed analysis**: See [scratchpad/parallelize-phase5-c269840d.md](../../scratchpad/parallelize-phase5-c269840d.md)

## Sub-agent Execution

This section provides directives for launching sub-agents to execute each phase in parallel. All sub-agents should be dispatched using the `sadd:launch-sub-agent` pattern.

### Wave 1-A: Error Class Fixes (Launch Immediately, Parallel)

```yaml
wave_1a:
  strategy: parallel
  trigger: immediate
  dependencies: []
  subtasks:
    - id: "1.1"
      name: "ApiError Override Modifier"
      agent: sdd:typescript-specialist
      model: sonnet
      prompt: |
        Add `override readonly name: string;` property declaration to the ApiError class 
        in packages/adapters/src/api/errors.ts (after line 15). 
        Preserve the `this.name = this.constructor.name;` assignment in constructor.
        Verify 4 subclasses (UnauthorizedError, ForbiddenError, NotFoundError, BadRequestError) 
        still compile correctly. Run tsc --noEmit on the file to confirm no TS4114 errors.
      estimated_time: "10 min"

    - id: "1.2"
      name: "Auth Error Override Modifiers"
      agent: sdd:typescript-specialist
      model: sonnet
      prompt: |
        Add `override readonly name: string;` to AuthenticationError and AuthorizationError 
        classes in packages/adapters/src/controllers/auth/authServer.ts (lines 97-109).
        Add the property declaration after the class opening brace, before the constructor.
        Run tsc --noEmit on the file and verify no TS4114 errors. 
        Ensure error.name checks in catch blocks still work correctly.
      estimated_time: "10 min"

    - id: "1.3"
      name: "Verify adapter-errors.ts"
      agent: sdd:typescript-specialist
      model: haiku
      prompt: |
        Verify all error classes in packages/adapters/src/errors/adapter-errors.ts 
        have proper override modifiers. Run grep for 'extends Error' in packages/adapters/src 
        to find any missed patterns. Confirm all error classes are accounted for in Phase 1.
        This is a verification-only task - no changes needed if already compliant.
      estimated_time: "5 min"
```

### Wave 1-B: DI Module Type Exports (Launch When Wave 1-A Starts, Parallel)

```yaml
wave_1b:
  strategy: parallel
  trigger: on_wave_1a_start # Can begin once Wave 1-A files are being modified
  dependencies: []
  subtasks:
    - id: "2.1"
      name: "UseCaseModule Type Exports"
      agent: sdd:typescript-specialist
      model: sonnet
      prompt: |
        Add `export type` declarations to UseCaseModule.ts interfaces as needed.
        Focus on: ProviderType, ProviderConfig, UseCaseModuleDeps (lines 411-441, 529-659).
        Also check AuthUseCaseToken and PortToken type exports (lines 275-281).
        Consider changing createStaticModule<any> to createStaticModule<UseCaseModuleDef>.
        Test external import to verify no TS1205 or TS4023 errors.
      estimated_time: "10 min"

    - id: "2.2"
      name: "ControllerModule Type Exports"
      agent: sdd:typescript-specialist
      model: sonnet
      prompt: |
        Add `export type` declarations to ControllerModule.ts as needed.
        Focus on: ServiceToken, ControllerToken types (lines 51, 72-73),
        ControllerModuleDeps and ControllerModuleDef interfaces (lines 75-125, 133-236).
        Test token type usage in type annotations to ensure types resolve correctly.
        Verify no TS1205 errors when compiling with isolatedModules.
      estimated_time: "8 min"

    - id: "2.3"
      name: "RepositoryModule Type Exports"
      agent: sdd:typescript-specialist
      model: sonnet
      prompt: |
        Add `export type` declarations to RepositoryModule.ts as needed.
        Focus on: RepositoryToken type (lines 159-160),
        RepositoryModuleDeps and RepositoryModuleDef interfaces (lines 187-274, 302-374),
        repository re-exports at bottom (lines 380-398).
        Test external import of RepositoryModuleDeps to verify all 17 repository types accessible.
      estimated_time: "8 min"
```

### Wave 2-A: Verification (Launch When ALL Wave 1 Complete, Parallel)

```yaml
wave_2a:
  strategy: parallel
  trigger: on_wave_1_complete # MUST wait for all Wave 1-A and 1-B subtasks
  dependencies: ["1.1", "1.2", "1.3", "2.1", "2.2", "2.3"]
  fast_fail: true # If 3.1 fails, abort 3.2 and 3.3
  subtasks:
    - id: "3.1"
      name: "TypeScript Compilation"
      agent: sdd:qa-engineer
      model: sonnet
      prompt: |
        Run `cd packages/adapters && tsc --noEmit` and verify exit code is 0.
        Check compilation output for TS4114, TS1205, TS4023 errors - should be zero occurrences.
        Run with isolatedModules flag: `tsc --noEmit --isolatedModules`.
        This is a gate check - if it fails, subsequent verification tasks should not run.
      estimated_time: "5 min"
      abort_on_fail: true

    - id: "3.2"
      name: "Unit Test Verification"
      agent: sdd:qa-engineer
      model: sonnet
      prompt: |
        Run `cd packages/adapters && bun test` and verify all tests pass (exit code 0).
        Specifically verify error class tests for ApiError, AuthenticationError, AuthorizationError.
        Verify DI module resolution tests pass.
        Check for zero test failures related to error classes or DI modules.
      estimated_time: "10 min"
      abort_on_fail: false # Continue even if fails (for diagnostic info)

    - id: "3.3"
      name: "Integration Verification"
      agent: sdd:qa-engineer
      model: sonnet
      prompt: |
        Run `tsc --noEmit` at root level and verify dependent packages compile successfully.
        Verify cross-package imports work in apps/backend-server and other consumers.
        Check for no TS1205 or TS4023 errors from adapters package.
        Run root-level tests if available.
      estimated_time: "8 min"
      abort_on_fail: false
```

### Execution Commands

Launch sub-agents using the following pattern:

```bash
# Wave 1-A: Error class fixes (parallel, immediate)
skill sadd:launch-sub-agent "sdd:typescript-specialist: Add override to ApiError in api/errors.ts lines 14-27" --model sonnet
skill sadd:launch-sub-agent "sdd:typescript-specialist: Add override to Auth errors in authServer.ts lines 97-109" --model sonnet
skill sadd:launch-sub-agent "sdd:typescript-specialist: Verify adapter-errors.ts has all override modifiers" --model haiku

# Wave 1-B: DI module exports (parallel, starts when Wave 1-A underway)
skill sadd:launch-sub-agent "sdd:typescript-specialist: Fix UseCaseModule type exports in UseCaseModule.ts" --model sonnet
skill sadd:launch-sub-agent "sdd:typescript-specialist: Fix ControllerModule type exports in ControllerModule.ts" --model sonnet
skill sadd:launch-sub-agent "sdd:typescript-specialist: Fix RepositoryModule type exports in RepositoryModule.ts" --model sonnet

# Wave 2-A: Verification (parallel, must wait for Wave 1 completion)
skill sadd:launch-sub-agent "sdd:qa-engineer: Run TypeScript compilation check in adapters package" --model sonnet
skill sadd:launch-sub-agent "sdd:qa-engineer: Run unit test verification in adapters package" --model sonnet
skill sadd:launch-sub-agent "sdd:qa-engineer: Run root-level integration check" --model sonnet
```

### Rollback per Sub-agent

If a specific sub-agent fails:

| Subtask | Rollback Command                                                    |
| ------- | ------------------------------------------------------------------- |
| 1.1     | `git checkout packages/adapters/src/api/errors.ts`                  |
| 1.2     | `git checkout packages/adapters/src/controllers/auth/authServer.ts` |
| 1.3     | N/A (verification only, no changes)                                 |
| 2.1     | `git checkout packages/adapters/src/modules/UseCaseModule.ts`       |
| 2.2     | `git checkout packages/adapters/src/modules/ControllerModule.ts`    |
| 2.3     | `git checkout packages/adapters/src/modules/RepositoryModule.ts`    |
| 3.x     | N/A (verification only, no changes)                                 |

## Verification Rubrics

### Phase 1: Error Class Fixes

**Verification Level**: Single Judge  
**Threshold**: 4.0/5.0

| Criterion           | Weight | Description                                      |
| ------------------- | ------ | ------------------------------------------------ |
| Correctness         | 0.40   | All error classes have `override` where required |
| Completeness        | 0.35   | No error classes missed in any file              |
| Pattern Consistency | 0.25   | Follows existing codebase patterns               |

### Phase 2: DI Module Exports

**Verification Level**: Single Judge  
**Threshold**: 4.0/5.0

| Criterion               | Weight | Description                     |
| ----------------------- | ------ | ------------------------------- |
| Type Export Correctness | 0.50   | Interfaces use `export type`    |
| Consumer Compatibility  | 0.30   | External imports work correctly |
| No Breaking Changes     | 0.20   | Existing code continues to work |

### Phase 3: Final Verification

**Verification Level**: Automated  
**Threshold**: Pass/Fail

| Check                  | Method                     |
| ---------------------- | -------------------------- |
| TypeScript Compilation | `tsc --noEmit` returns 0   |
| Unit Tests             | `bun test` passes          |
| Integration Check      | Dependent packages compile |

## Verification Summary

| Step                         | Verification Level | Threshold | Judge         |
| ---------------------------- | ------------------ | --------- | ------------- |
| 1.1 ApiError Override        | Single             | 4.0/5.0   | sadd:judge    |
| 1.2 Auth Error Overrides     | Per-Item           | 4.0/5.0   | sadd:judge    |
| 1.3 adapter-errors Verify    | Single             | 4.0/5.0   | sadd:judge    |
| 2.1 UseCaseModule Exports    | Single             | 4.0/5.0   | sadd:judge    |
| 2.2 ControllerModule Exports | Single             | 4.0/5.0   | sadd:judge    |
| 2.3 RepositoryModule Exports | Single             | 4.0/5.0   | sadd:judge    |
| 3.1 TypeScript Compilation   | Automated          | Pass/Fail | CI / tsc      |
| 3.2 Unit Tests               | Automated          | Pass/Fail | CI / bun test |
| 3.3 Integration Verification | Single             | 4.0/5.0   | sadd:judge    |

### Rubric Quick Reference

| Step                 | Criteria                                                                                    | Weight Focus            |
| -------------------- | ------------------------------------------------------------------------------------------- | ----------------------- |
| 1.1 ApiError         | Syntax correctness, runtime preservation, subclass compatibility, TS4114 resolution         | Compile-time + runtime  |
| 1.2 Auth Errors      | Per-class correctness, name consistency, catch block compatibility, TS4114 resolution       | Individual verification |
| 1.3 adapter-errors   | Override completeness, file scan coverage, existing classes verified, subclass correctness  | Verification-only       |
| 2.1 UseCaseModule    | ProviderType, ProviderConfig, UseCaseModuleDeps exports, generic consistency, token exports | Type exports            |
| 2.2 ControllerModule | ServiceToken, ControllerToken exports, interface exports, external import test              | Token types             |
| 2.3 RepositoryModule | RepositoryToken, interface exports, re-export safety, external import, TS1205               | Repository types        |
| 3.1 TypeScript       | Exit code 0, TS4114/TS1205/TS4023 elimination                                               | Automated               |
| 3.2 Unit Tests       | Exit code 0, specific test passage, zero regressions                                        | Automated               |
| 3.3 Integration      | Root compilation, cross-package imports, dependent packages, root tests                     | Cross-package           |
