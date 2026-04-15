---
title: Fix 997 TypeScript errors from GraphQL migration and package restructuring
depends_on: []
---

## References

- **Analysis File**: `.specs/analysis/analysis-typescript-errors.md` - Contains detailed error distribution by package, error categories (TS2322, TS2307, TS2339, TS7006), affected file inventory with exact error counts per file, risk assessment, and recommended fix strategy.
- **Skill File**: `.claude/skills/typescript-error-fixes/SKILL.md` - Contains reusable patterns for fixing TS2307 (module resolution), TS2339 (urql API migration), TS2322 (Effect type mismatches), TS7006 (implicit any), and other common TypeScript errors.
- **Decomposition Scratchpad**: `.specs/scratchpad/decomposition-typescript-fixes.md` - Documents decomposition decisions and tracks implementation progress.

## Initial User Prompt

"Group those errors and fix them"

Found 997 errors in 206 files from:

- A: GraphQL client migration (urql API changes)
- B: Package restructuring (module path changes)
- C: TypeScript configuration updates

# Description

This task addresses a critical blocker: **997 TypeScript compilation errors across 206 files are preventing the monorepo from building**. These errors resulted from three concurrent migration efforts: (A) GraphQL client migration with urql API changes, (B) package restructuring causing module path changes, and (C) TypeScript configuration updates.

The fix requires systematic categorization of errors by root cause, followed by targeted fixes for each category: updating urql API usage to match the new version, correcting module import paths from the package restructuring, and resolving any TypeScript configuration compatibility issues. The goal is to restore type safety and build capability without changing runtime functionality.

**Scope:**

- **Included**: Categorizing 997 TypeScript errors by root cause (urql, paths, config); Fixing all urql API migration type errors; Fixing all module path resolution errors; Fixing all TypeScript configuration related errors; Verifying build succeeds with zero errors; Ensuring all tests pass after fixes
- **Excluded**: Runtime functionality changes beyond type fixes; Performance optimization; Code refactoring for quality (unless required for types); Modifying TypeScript/ESLint configuration to suppress errors; Adding new features or capabilities; Changes to test logic (unless tests are incorrect)

**User Scenarios:**

1. **Primary Flow**: Developer categorizes 997 errors by root cause, fixes systematically by category (urql → paths → config), verifies build (0 errors), confirms all tests pass
2. **Alternative Flow**: Developer identifies auto-fixable errors first (some path issues), applies automated fixes, then handles remaining manual fixes
3. **Error Handling**: If fixing reveals new errors or test failures, developer evaluates and addresses without expanding scope beyond type fixes

---

## Acceptance Criteria

### Functional Requirements

- [ ] **[Criterion 1]**: All 997 TypeScript errors are categorized by root cause
  - Given: TypeScript compiler output shows 997 errors in 206 files
  - When: Developer analyzes error patterns
  - Then: Errors are grouped into three categories (urql migration, module paths, TS config) with counts per category

- [ ] **[Criterion 2]**: All urql API migration errors are fixed
  - Given: Categorization identifies urql-related type errors
  - When: Developer updates urql API usage (hooks, clients, types)
  - Then: Zero urql-related TypeScript errors remain

- [ ] **[Criterion 3]**: All module path resolution errors are fixed
  - Given: Categorization identifies path-related errors (TS2307, etc.)
  - When: Developer updates import paths from package restructuring
  - Then: Zero module resolution TypeScript errors remain

- [ ] **[Criterion 4]**: All TypeScript configuration errors are fixed
  - Given: Categorization identifies TS config-related errors
  - When: Developer resolves configuration compatibility issues
  - Then: Zero configuration-related TypeScript errors remain

- [ ] **[Criterion 5]**: Zero TypeScript compilation errors
  - Given: All error categories have been addressed
  - When: Developer runs `tsc --noEmit`
  - Then: Command exits with code 0 and reports 0 errors

### Non-Functional Requirements

- [ ] **[Criterion 6]**: No functional regressions
  - Given: Type fixes are complete
  - When: Test suite runs
  - Then: All existing tests continue to pass (same pass rate as before fixes)

### Definition of Done

- [ ] All 6 acceptance criteria pass
- [ ] Build succeeds (`tsc --noEmit` exits 0)
- [ ] No modifications to TypeScript or ESLint configuration to suppress errors
- [ ] Code reviewed and approved
- [ ] Changes documented (migration patterns if applicable)

---

## Architecture Overview

### Solution Strategy

The fix follows a **bottom-up dependency order** to prevent cascade failures. Each layer must compile before dependent layers can be fixed. The circular dependency between `use-cases` and `adapters` requires special handling via interface extraction.

**Fix Order by Error Category:**

Based on analysis in `.specs/analysis/analysis-typescript-errors.md`:

1. **Module Resolution (TS2307 - 454 errors)**: Fix first to unblock imports
   - Add missing `package.json` exports
   - Create barrel `index.ts` files (critical: `packages/ui/src/components/index.ts`, `packages/ui/src/index.ts`)
   - Update tsconfig path mappings
   - Fix missing exports: `@mirai-app/ui` (Image, LoadingSpinner, ErrorMessage), `@mirai-app/graphql-client` operations
2. **GraphQL API Migration (TS2339 - 374 errors)**: Fix in parallel with module issues
   - Transform TanStack Query patterns to urql tuple responses
   - Update `useQuery` from `{ data, isLoading }` to `[{ data, fetching }]`
   - Update `useMutation` from object properties to result tuple destructuring
   - Replace `invalidateQueries` with `reexecuteOperation`
   - Fix missing: `GetGroupJoinRequestDocument`, `LeaveGroupDocument`, `invalidate` method
3. **Type Assignability (TS2322 - 579 errors)**: Fix after module resolution
   - Align Effect error hierarchies in adapters
   - Update repository mocks with missing methods (critical: `packages/use-cases/src/test/repository-mocks.ts` - 146 errors)
   - Fix branded ID constructors in tests
   - Resolve schema validator date/string mismatches
4. **Implicit Any (TS7006 - 335 errors)**: Fix last as they unblock when types resolve
   - Add explicit parameter types to array callbacks
   - Annotate GraphQL response data structures
   - Type event handler parameters
5. **Additional Error Categories** (from analysis):
   - TS2345: ~300 (Argument type not assignable)
   - TS2416: 196 (Method override mismatch)
   - TS2741: 82 (Missing properties)
   - TS2532: 67 (Object possibly undefined)
   - TS2304: ~50 (Cannot find name)
   - TS2305: ~47 (Module has no exported member)

### Key Decisions

| Decision                                               | Rationale                                               | Impact                                                                  |
| ------------------------------------------------------ | ------------------------------------------------------- | ----------------------------------------------------------------------- |
| **Bottom-up fix order**                                | Prevents cascade errors from unresolved dependencies    | domain → graphql-client → use-cases → adapters → frameworks → ui → apps |
| **Break circular dependency via interface extraction** | `use-cases` ↔ `adapters` circular reference blocks both | Extract repository interfaces to `packages/ports` or `packages/domain`  |
| **Phase 1: Module resolution first**                   | TS2307 errors block all other analysis                  | 454 path errors must resolve before type errors can be validated        |
| **Repository mocks co-located with fixes**             | 146 errors in `repository-mocks.ts` block tests         | Update mocks in same PR as interface changes                            |
| **No TypeScript config changes**                       | AGENTS.md Rule 4 prohibits config workarounds           | Fix actual code errors, never disable rules                             |
| **GraphQL operations generated before hook fixes**     | URQL types depend on generated documents                | Ensure `graphql-client` generates all operation types first             |

### Expected Changes

**By Package (in fix order):**

| Package                   | Files      | Changes                                                                            |
| ------------------------- | ---------- | ---------------------------------------------------------------------------------- |
| `packages/domain`         | ~6 files   | Branded ID exports, missing type exports                                           |
| `packages/graphql-client` | ~15 files  | Add missing operation documents, fix URQL type exports                             |
| `packages/use-cases`      | ~50 files  | Fix repository mock methods (146 errors), Effect error types, branded IDs in tests |
| `packages/adapters`       | ~40 files  | Fix Effect error hierarchies, method overrides, schema validators                  |
| `packages/frameworks`     | ~30 files  | Fix Supabase type exports, resolve inherited adapter errors                        |
| `packages/ui`             | ~25 files  | Add missing component exports, fix Tamagui theme types                             |
| `apps/backend-server`     | ~60 files  | Fix Pothos type registration, resolver return types, context types                 |
| `apps/native`             | ~80 files  | Fix URQL hook patterns (25 files), `~/styles` module, missing GraphQL operations   |
| `apps/web`                | ~100 files | Fix UI imports, URQL patterns, admin dashboard types                               |

**Critical Files (high error density - from analysis):**

```
packages/use-cases/src/test/repository-mocks.ts                              (146 errors)
apps/backend-server/src/graphql/resolvers/activityFeed.ts                    (~150 errors)
packages/adapters/src/utils/effect-executor.ts                               (50 errors)
packages/adapters/src/gateways/drizzle/event.ts                              (27 errors)
packages/adapters/src/gateways/drizzle/notification-schedule.ts              (19 errors)
packages/adapters/src/controllers/storage.ts                                 (12 errors)
```

**Specific File Paths Requiring Changes:**

- **Barrel Exports**: `packages/ui/src/index.ts`, `packages/ui/src/components/index.ts`
- **Module Path Fixes**: `apps/native/src/app/**/*.tsx` (~/styles module), `apps/web/src/components/**/*.tsx` (UI imports)
- **GraphQL Operations**: `packages/graphql-client/src/generated/urql.ts`
- **Repository Mocks**: `packages/use-cases/src/test/repository-mocks.ts` (missing: findParticipantByUserIdAndTripId, findParticipantsByGroupId, assignUserToGroup, removeUserFromGroup, findAll)
- **Effect Types**: `packages/adapters/src/gateways/drizzle/*.ts`
- **Pothos Resolvers**: `apps/backend-server/src/graphql/resolvers/activityFeed.ts`, `apps/backend-server/src/graphql/context.ts`
- **URQL Hooks**: `apps/native/src/app/(tabs)/trips/**/*.tsx`, `apps/native/src/app/(tabs)/notifications/index.tsx`
- **Admin Dashboard**: `apps/web/src/components/admin/**/*.tsx`

### Dependency Graph

```
                    ┌──────────────────────────────────────┐
                    │           apps layer                 │
                    │  native / web / backend-server       │
                    │  (~650 errors - fix LAST)            │
                    └──────────────────┬─────────────────┘
                                        │
          ┌─────────────────────────────┼─────────────────────────────┐
          │                             │                             │
          ▼                             ▼                             ▼
┌──────────────────┐          ┌──────────────────┐          ┌──────────────────┐
│   packages/ui    │          │ packages/graphql-│          │packages/frameworks│
│  (~107 errors)   │          │    client        │          │   (~294 errors)  │
│  fix: exports,  │          │  (~40 errors)    │          │ fix: re-export  │
│  theme types    │          │  fix: generate   │          │ adapter fixes   │
└──────────────────┘          │ operations first │          └────────┬─────────┘
                               └──────────────────┘                   │
                                                                      │
                                               ┌──────────────────────┘
                                               │
                                               ▼
                                     ┌──────────────────┐
                                     │ packages/adapters│
                                     │  (~254 errors)   │◄──────────────────┐
                                     │  fix: Effect     │                   │
                                     │  error types     │                   │
                                     └────────┬─────────┘                   │
                                              │                              │
                                              │ CIRCULAR DEPENDENCY          │
                                              ▼                              │
                                     ┌──────────────────┐                   │
                                     │ packages/use-    │───────────────────┘
                                     │    cases         │   (break via
                                     │  (~676 errors)   │    interface
                                     │  fix: mocks,     │    extraction)
                                     │  error types     │
                                     └────────┬─────────┘
                                              │
                                              ▼
                                     ┌──────────────────┐
                                     │ packages/domain  │
                                     │   (~6 errors)    │
                                     │  fix: branded    │
                                     │  ID exports      │
                                     └──────────────────┘

                                     FIX ORDER: bottom to top
                                     (domain first, apps last)
```

**Circular Dependency Break Strategy:**

1. Extract repository interfaces from `packages/use-cases/src/ports/repositories.ts`
2. Move to `packages/domain/src/ports/` (or create `packages/ports/`)
3. Update `use-cases` to import from domain
4. Update `adapters` to import from domain
5. Both packages now depend on domain, not each other

---

## Implementation Process

### Overview

This implementation follows the **CEK Five Pillars** methodology (SDD, TDD, SADD, Kaizen, DDD). The work is decomposed into **4 major phases** with **14 implementation steps** and **47 subtasks**. Each step has testable success criteria and explicit risk mitigations.

**Critical Path**: Steps 1-2-3-7-8-11-14 (foundation → circular dependency break → repository mocks → apps layer)

---

### Phase 1: Foundation (Steps 1-3)

**Goal**: Establish baseline, resolve module paths, and generate GraphQL operations to unblock downstream work.

---

#### Step 1: Setup and Baseline [DONE]

**Goal**: Establish error tracking baseline and validate environment  
**Output**: Documented error count per category, working build command  
**Dependencies**: None  
**Parallel with**: None (sequential - foundation step)  
**Assigned Agent**: `sdd:code-explorer`  
**Duration**: 1 hour

**Success Criteria**:

- [ ] Run `tsc --noEmit` completes (with expected errors) in `packages/domain`, `packages/graphql-client`
- [ ] Error categorization matches analysis file (997 total, ~454 TS2307, ~374 TS2339, ~579 TS2322, etc.)
- [ ] Scratchpad updated with actual error counts per package

**Subtasks**:

1. Run baseline TypeScript check: `cd packages/domain && tsc --noEmit 2>&1 | head -50`
2. Run baseline in `packages/graphql-client`: `tsc --noEmit 2>&1 | wc -l`
3. Verify error categorization matches `.specs/analysis/analysis-typescript-errors.md`
4. Create error tracking spreadsheet in scratchpad
5. Validate `bun install` produces clean node_modules

**Sub-Agent Execution Directive** (MUST requirements):

- **MUST** read `.specs/analysis/analysis-typescript-errors.md` and CLAUDE.md §10 before starting
- **MUST** document actual error counts per package in scratchpad at `.specs/scratchpad/parallelization-typescript-fixes.md`
- **MUST** report: baseline error count, categorization accuracy, and any discrepancies from analysis file
- **MUST** complete before Steps 2 and 3 can begin (blocks Wave 2)
- **MUST NOT** proceed without documenting baseline metrics

**Verification**:

- **Level**: Panel (HIGH)
- **Threshold**: 4.5/5.0
- **Rubric**:
  - Accuracy of baseline error count matching analysis file (0.30)
  - Completeness of error categorization per package (0.25)
  - Quality of scratchpad documentation with actual counts (0.25)
  - Verification that baseline metrics are properly recorded (0.20)

---

#### Step 2: Fix Module Resolution (TS2307) - Part 1

**Goal**: Resolve critical path module resolution errors that block all other work  
**Output**: Zero TS2307 errors in domain and graphql-client packages  
**Dependencies**: 1  
**Parallel with**: None (sequential - blocks Step 4, but Step 3 can run parallel to this)  
**Assigned Agent**: `sdd:developer`  
**Duration**: 3 hours  
**Critical Path**: Yes

**Success Criteria**:

- [ ] `packages/domain/src/index.ts` exports all branded IDs and value objects
- [ ] `packages/domain/src/ports/repositories.ts` created with extracted interfaces
- [ ] `packages/domain/tsconfig.json` properly exports types
- [ ] `tsc --noEmit` in `packages/domain` shows 0 TS2307 errors

**Subtasks**:

1. Create/verify `packages/domain/src/index.ts` exports all branded types (UserId, TripId, GroupId, etc.)
2. Extract repository interfaces from `packages/use-cases/src/ports/repositories.ts` to `packages/domain/src/ports/repositories.ts`
3. Update `packages/domain/package.json` exports field
4. Add missing type exports in `packages/domain/src/entities/index.ts`
5. Fix any TS2307 errors in `packages/graphql-client` exports

**Sub-Agent Execution Directive** (MUST requirements):

- **MUST** read `packages/domain/AGENTS.md` and CLAUDE.md §5 (Domain Layer)
- **MUST** follow branded ID patterns from CLAUDE.md §10
- **MUST** verify circular dependency break strategy: extract interfaces to domain
- **MUST NOT** start Step 4 consumers until this completes
- **MUST** report: TS2307 error count delta, exports added, and circular dep break status
- **MUST** complete before Step 4 can begin (critical path blocker)

**Verification**:

- **Level**: Panel (HIGH)
- **Threshold**: 4.5/5.0
- **Rubric**:
  - Zero TS2307 errors in packages/domain (0.30)
  - Correct repository interface extraction (0.25)
  - Proper branded ID exports (0.25)
  - Circular dependency break verified (0.20)

---

#### Step 3: Generate GraphQL Operations

**Goal**: Generate all missing GraphQL operation types to unblock urql fixes  
**Output**: Complete generated types in `packages/graphql-client/src/generated/`  
**Dependencies**: 1  
**Parallel with**: 2 (independent of Step 2's domain work)  
**Assigned Agent**: `sdd:developer`  
**Duration**: 2 hours

**Success Criteria**:

- [ ] `packages/graphql-client/src/generated/urql.ts` contains all operation documents
- [ ] `GetGroupJoinRequestDocument`, `LeaveGroupDocument`, and other missing operations present
- [ ] Codegen script runs successfully: `bun graphql:generate` or equivalent
- [ ] Zero TS2307 errors in `packages/graphql-client`

**Subtasks**:

1. Run GraphQL code generation: `bun graphql:generate`
2. Verify generated file contains `GetGroupJoinRequestDocument`
3. Verify generated file contains `LeaveGroupDocument`
4. Verify `invalidate` method types are generated for cache operations
5. Fix any generation errors or missing schema definitions
6. Export all generated types from `packages/graphql-client/src/index.ts`

**Sub-Agent Execution Directive** (MUST requirements):

- **MUST** verify graphql-client can import from domain (Step 2 may run concurrently)
- **MUST** follow patterns from `.claude/skills/graphql-subscriptions-urql/SKILL.md`
- **MUST** report: operations generated count, missing operations list, and generation errors resolved
- **MUST** complete before Steps 11 and 12 can begin
- **MUST** verify Step 1 completed before starting

**Verification**:

- **Level**: Single (MEDIUM)
- **Threshold**: 4.0/5.0
- **Rubric**:
  - All required GraphQL operations generated (0.30)
  - Zero TS2307 errors in graphql-client (0.25)
  - Proper export from index.ts (0.25)
  - Codegen script runs successfully (0.20)

---

### Phase 2: Core Logic (Steps 4-8)

**Goal**: Break circular dependency and fix repository mocks to unblock adapter work.

---

#### Step 4: Fix Module Resolution (TS2307) - Part 2

**Goal**: Resolve remaining path errors in use-cases and adapters  
**Output**: Clean imports between use-cases and domain, zero path errors  
**Dependencies**: 2  
**Parallel with**: None (critical path - blocks Steps 5, 6, 7)  
**Assigned Agent**: `sdd:developer`  
**Duration**: 3 hours  
**Critical Path**: Yes

**Success Criteria**:

- [ ] `packages/use-cases` imports from `@mirai-app/domain` without TS2307 errors
- [ ] `packages/use-cases/src/ports/repositories.ts` removed (moved to domain)
- [ ] `packages/adapters` imports from `@mirai-app/domain` without TS2307 errors
- [ ] Circular dependency broken: both packages import from domain

**Subtasks**:

1. Update `packages/use-cases/src/**` to import repository interfaces from `@mirai-app/domain`
2. Update `packages/adapters/src/**` to import repository interfaces from `@mirai-app/domain`
3. Remove old `packages/use-cases/src/ports/repositories.ts` (or make it re-export)
4. Update `packages/use-cases/package.json` dependencies if needed
5. Update `packages/adapters/package.json` dependencies if needed
6. Verify `tsc --noEmit` in both packages shows 0 TS2307 errors

**Sub-Agent Execution Directive** (MUST requirements):

- **MUST** verify Step 2 completed successfully (domain exports available)
- **MUST** read `packages/use-cases/AGENTS.md` and `packages/adapters/AGENTS.md`
- **MUST** verify circular dependency is broken: use-cases and adapters should NOT import from each other - both import from domain only
- **MUST** report: TS2307 error count delta, files updated, and circular dependency verification result
- **MUST** complete before Steps 5, 6 can begin (enables Wave 4 parallelization)
- **CRITICAL PATH**: Accuracy is paramount - blocks 60% of remaining work

**Verification**:

- **Level**: Panel (HIGH)
- **Threshold**: 4.5/5.0
- **Rubric**:
  - Zero TS2307 errors in both use-cases and adapters (0.30)
  - Circular dependency properly broken (0.25)
  - Repository interfaces accessible from both packages (0.25)
  - No cross-imports between use-cases and adapters (0.20)

---

#### Step 5: Fix Effect Error Types (use-cases)

**Goal**: Align Effect error hierarchies in use-cases package  
**Output**: All use-case errors properly extend base error types  
**Dependencies**: 4  
**Parallel with**: 6 (independent - touches different files: src/errors/ vs test/)  
**Assigned Agent**: `sdd:developer`  
**Duration**: 2 hours

**Success Criteria**:

- [ ] All use-case errors in `packages/use-cases/src/**` use `Data.TaggedError` pattern
- [ ] Error types match expected interfaces from domain
- [ ] `tsc --noEmit` in `packages/use-cases` shows 0 TS2322 errors related to errors

**Subtasks**:

1. Identify all error classes in `packages/use-cases/src/errors/`
2. Update errors to use `Data.TaggedError("ErrorName")<Props>()` pattern
3. Fix error type mismatches in use case interactors
4. Update error handling in Effect.gen workflows
5. Verify error types align with repository interface error types

**Sub-Agent Execution Directive** (MUST requirements):

- **MUST** read CLAUDE.md §10 (Effect Framework Patterns)
- **MUST** follow `Data.TaggedError` pattern exactly
- **MUST** verify Step 4 completed (can import from domain)
- **MUST** run `tsc --noEmit` after each subtask
- **MUST** report: TS2322 error count delta, errors converted to TaggedError pattern, and any error hierarchy alignment issues
- **MUST** complete before Step 7 can begin
- **PARALLEL SAFE**: Can run simultaneously with Step 6 (touches different directories)

**Verification**:

- **Level**: Single (MEDIUM)
- **Threshold**: 4.0/5.0
- **Rubric**:
  - All errors use Data.TaggedError pattern (0.30)
  - Zero TS2322 errors related to error types (0.25)
  - Error types align with domain interfaces (0.25)
  - Effect.gen workflows handle errors correctly (0.20)

---

#### Step 6: Fix Branded IDs in use-cases Tests

**Goal**: Resolve branded ID constructor errors in use-cases tests  
**Output**: All test files compile with proper branded ID usage  
**Dependencies**: 4  
**Parallel with**: 5 (independent - touches test files only, Step 5 touches src/errors/)  
**Assigned Agent**: `sdd:developer`  
**Duration**: 2 hours

**Success Criteria**:

- [ ] Test files use branded ID constructors correctly
- [ ] No TS2345 (argument type) errors in test files
- [ ] `packages/use-cases/src/test/**` compiles without branded ID errors

**Subtasks**:

1. Fix `UserId.create()` vs `UserId` type usages in tests
2. Fix `TripId.create()` vs `TripId` type usages in tests
3. Fix `GroupId.create()` vs `GroupId` type usages in tests
4. Update test fixtures to use proper branded ID construction
5. Run `tsc --noEmit` in test directory

**Sub-Agent Execution Directive** (MUST requirements):

- **MUST** read CLAUDE.md §10 for branded ID patterns
- **MUST** verify Step 4 completed
- **MUST** use `UserId.create()` constructors, not direct assignment
- **MUST NOT** modify Step 5 files (src/errors/\*\*)
- **MUST** report: TS2345 error count delta, branded ID fix patterns applied, and test file compilation status
- **PARALLEL SAFE**: Can run simultaneously with Step 5 (touches different directories)

**Verification**:

- **Level**: Per-Item (MEDIUM)
- **Threshold**: 4.0/5.0
- **Rubric**:
  - All branded ID constructors used correctly (0.30)
  - Zero TS2345 errors in test files (0.25)
  - Test fixtures properly updated (0.25)
  - Tests compile without branded ID errors (0.20)

---

#### Step 7: CRITICAL - Fix Repository Mocks

**Goal**: Fix all 146 errors in repository-mocks.ts to unblock test execution  
**Output**: `repository-mocks.ts` compiles with zero errors  
**Dependencies**: 4, 5  
**Parallel with**: None (critical path - blocks Step 8)  
**Assigned Agent**: `sdd:developer`  
**Duration**: 4 hours  
**Critical Path**: Yes

**Success Criteria**:

- [ ] `packages/use-cases/src/test/repository-mocks.ts` has 0 TypeScript errors
- [ ] All missing methods implemented: `findParticipantByUserIdAndTripId`, `findParticipantsByGroupId`, `assignUserToGroup`, `removeUserFromGroup`, `findAll`
- [ ] Mock methods return proper Effect types
- [ ] Tests can import and use repository mocks

**Subtasks**:

1. Add missing `findParticipantByUserIdAndTripId` mock method
2. Add missing `findParticipantsByGroupId` mock method
3. Add missing `assignUserToGroup` mock method
4. Add missing `removeUserFromGroup` mock method
5. Add missing `findAll` mock method to base mock class
6. Fix Effect return type signatures on all mock methods
7. Fix any TS2416 (method override) errors in mock implementations
8. Verify `tsc --noEmit` shows 0 errors in the file

**Sub-Agent Execution Directive** (MUST requirements):

- **MUST** verify Steps 4 and 5 completed successfully
- **MUST** read CLAUDE.md §4.5 (Effect Testing Patterns)
- **MUST** run `bun test` after fixes to verify mocks work
- **MUST** report: error count delta (target: 146→0), methods added, and test execution status
- **CRITICAL PATH**: Blocks Step 8 (adapters) - accuracy is paramount
- **MUST** complete before Step 8 can begin

**Verification**:

- **Level**: Panel (HIGH)
- **Threshold**: 4.5/5.0
- **Rubric**:
  - Zero TypeScript errors in repository-mocks.ts (0.30)
  - All missing methods properly implemented (0.25)
  - Effect return types correct on all methods (0.25)
  - Tests execute successfully with mocks (0.20)

---

#### Step 8: Fix Effect Error Types and Method Overrides (adapters)

**Goal**: Resolve Effect error hierarchies and method override mismatches  
**Output**: All adapter gateways implement repository interfaces correctly  
**Dependencies**: 4, 7  
**Parallel with**: 9 (UI work is independent of adapters)  
**Assigned Agent**: `sdd:developer`  
**Duration**: 4 hours  
**Critical Path**: Yes

**Success Criteria**:

- [ ] `packages/adapters/src/gateways/drizzle/*.ts` files have 0 TS2416 errors
- [ ] All gateway methods properly override repository interface methods
- [ ] Effect error types align between adapters and domain interfaces
- [ ] `packages/adapters/src/utils/effect-executor.ts` has 0 errors

**Subtasks**:

1. Fix `packages/adapters/src/utils/effect-executor.ts` (50 errors)
2. Fix `packages/adapters/src/gateways/drizzle/event.ts` (27 errors)
3. Fix `packages/adapters/src/gateways/drizzle/notification-schedule.ts` (19 errors)
4. Fix `packages/adapters/src/controllers/storage.ts` (12 errors)
5. Fix method signature mismatches in all drizzle gateways
6. Align Effect error types with domain interface expectations
7. Fix return type annotations on all gateway methods

**Sub-Agent Execution Directive** (MUST requirements):

- **MUST** verify Steps 4 and 7 completed
- **MUST** read `packages/adapters/AGENTS.md` and CLAUDE.md §5.4 (Adapter Layer)
- **MUST** fix TS2416 errors by matching interface signatures exactly
- **MUST** report: TS2416 error count delta (target: ~108→0), gateway files fixed, and adapter compilation status
- **CRITICAL PATH**: Blocks Steps 10 and 11
- **MUST** complete before Steps 10 and 11 can begin
- **PARALLEL SAFE**: Can run simultaneously with Step 9 (UI is independent)

**Verification**:

- **Level**: Panel (HIGH)
- **Threshold**: 4.5/5.0
- **Rubric**:
  - Zero TS2416 errors in all drizzle gateways (0.30)
  - Effect error types properly aligned (0.25)
  - All gateway methods override interfaces correctly (0.25)
  - Critical files fixed (effect-executor, event, notification-schedule) (0.20)

---

### Phase 3: Presentation (Steps 9-11)

**Goal**: Fix UI package exports and framework re-exports.

---

#### Step 9: Fix UI Package Exports

**Goal**: Create barrel exports and fix missing component exports  
**Output**: All UI components exportable via `@mirai-app/ui`  
**Dependencies**: 2  
**Parallel with**: 5, 6, 8 (independent work - UI doesn't touch core packages)  
**Assigned Agent**: `sdd:developer`  
**Duration**: 2 hours

**Success Criteria**:

- [ ] `packages/ui/src/index.ts` exists and exports all components
- [ ] `packages/ui/src/components/index.ts` exists and exports Image, LoadingSpinner, ErrorMessage
- [ ] `packages/ui/package.json` exports field configured correctly
- [ ] Zero TS2307 errors when importing from `@mirai-app/ui`

**Subtasks**:

1. Create `packages/ui/src/components/index.ts` with exports:
   - `export { Image } from './Image'`
   - `export { LoadingSpinner } from './LoadingSpinner'`
   - `export { ErrorMessage } from './ErrorMessage'`
2. Create `packages/ui/src/index.ts` re-exporting from components
3. Update `packages/ui/package.json` exports field
4. Fix Tamagui theme type errors
5. Fix any component prop type mismatches
6. Verify imports work in test file

**Sub-Agent Execution Directive** (MUST requirements):

- **MUST** read `packages/ui/AGENTS.md` if available
- **MUST** verify Step 2 completed
- **MUST** create barrel exports following Tamagui patterns
- **MUST NOT** modify any files outside packages/ui/
- **MUST** report: exports added, TS2307 error count delta (target: ~107→0), and import verification result
- **PARALLEL SAFE**: Can run simultaneously with Steps 5, 6, 8 (isolated to packages/ui/)

**Verification**:

- **Level**: Single (MEDIUM)
- **Threshold**: 4.0/5.0
- **Rubric**:
  - Barrel exports properly created (0.30)
  - All components exported from @mirai-app/ui (0.25)
  - Zero TS2307 errors on UI imports (0.25)
  - Tamagui theme types fixed (0.20)

---

#### Step 10: Fix Framework Package

**Goal**: Fix Supabase type exports and re-export adapter fixes  
**Output**: frameworks package compiles cleanly  
**Dependencies**: 8  
**Parallel with**: None (depends on adapter completion)  
**Assigned Agent**: `sdd:developer`  
**Duration**: 2 hours

**Success Criteria**:

- [ ] `packages/frameworks` re-exports from adapters without errors
- [ ] Supabase type exports are complete
- [ ] Zero TS2307 and TS2322 errors in frameworks

**Subtasks**:

1. Fix Supabase type export configurations
2. Update re-exports from `packages/adapters` after adapter fixes
3. Fix any inherited type errors from adapters
4. Verify `Layer` composition types are correct
5. Run `tsc --noEmit` and verify 0 errors

**Sub-Agent Execution Directive** (MUST requirements):

- **MUST** verify Step 8 completed successfully
- **MUST** read `packages/frameworks/AGENTS.md`
- **MUST** follow CLAUDE.md §5.5 (Frameworks Layer) for Layer composition
- **MUST** run `tsc --noEmit` after each re-export update
- **MUST** report: TS2307/TS2322 error count delta (target: ~294→0), Supabase exports fixed, and Layer composition status
- **MUST** complete before Step 11 can begin (Step 11 depends on stable adapters/frameworks)

**Verification**:

- **Level**: Single (MEDIUM)
- **Threshold**: 4.0/5.0
- **Rubric**:
  - Supabase types exported correctly (0.30)
  - Re-exports from adapters work without errors (0.25)
  - Zero TS2307 and TS2322 errors (0.25)
  - Layer composition types correct (0.20)

---

#### Step 11: Fix GraphQL Client Integration

**Goal**: Fix urql hook patterns and missing operations  
**Output**: All urql hooks use correct tuple destructuring  
**Dependencies**: 3, 8  
**Parallel with**: 12 (backend resolvers can run parallel - both need GQL ops)  
**Assigned Agent**: `sdd:developer`  
**Duration**: 3 hours  
**Critical Path**: Yes

**Success Criteria**:

- [ ] All `useQuery` calls use tuple destructuring: `[{ data, fetching }, reexecute]`
- [ ] All `useMutation` calls use tuple destructuring: `[result, executeMutation]`
- [ ] No TS2339 errors from `invalidate` method (use `reexecuteOperation`)
- [ ] All missing GraphQL operations are imported from generated types

**Subtasks**:

1. Update `useQuery` patterns in hook files (apps/native, apps/web)
2. Update `useMutation` patterns in hook files
3. Replace `invalidateQueries` with `reexecuteOperation` calls
4. Import missing operations: `GetGroupJoinRequestDocument`, `LeaveGroupDocument`
5. Fix TS2339 errors from accessing `isLoading` (change to `fetching`)
6. Verify all urql hooks compile

**Sub-Agent Execution Directive** (MUST requirements):

- **MUST** verify Steps 3 and 8 completed
- **MUST** read `.claude/skills/graphql-subscriptions-urql/SKILL.md` for urql patterns
- **MUST** replace TanStack Query patterns with urql tuple patterns
- **MUST** report: TS2339 error count delta (target: ~374→0), hooks converted count, and urql pattern verification status
- **CRITICAL PATH**: Blocks Steps 13 and 14
- **MUST** complete before Steps 13 and 14 can begin
- **PARALLEL SAFE**: Can run simultaneously with Step 12 (backend uses Pothos, not urql)

**Verification**:

- **Level**: Panel (HIGH)
- **Threshold**: 4.5/5.0
- **Rubric**:
  - All useQuery/useMutation use tuple destructuring (0.30)
  - Zero TS2339 errors from urql migration (0.25)
  - invalidateQueries replaced correctly (0.25)
  - All missing operations imported (0.20)

---

### Phase 4: Application (Steps 12-14)

**Goal**: Fix all application layer TypeScript errors.

---

#### Step 12: Fix Backend Server Resolvers

**Goal**: Fix Pothos type registration and resolver return types  
**Output**: `activityFeed.ts` and other resolvers compile cleanly  
**Dependencies**: 3, 8  
**Parallel with**: 11 (independent of urql hook fixes - both use GQL ops)  
**Assigned Agent**: `sdd:developer`  
**Duration**: 4 hours

**Success Criteria**:

- [ ] `apps/backend-server/src/graphql/resolvers/activityFeed.ts` has 0 errors (currently ~150)
- [ ] `apps/backend-server/src/graphql/context.ts` has 0 errors
- [ ] All Pothos type registrations match schema
- [ ] Resolver return types align with generated GraphQL types

**Subtasks**:

1. Fix `activityFeed.ts` Pothos type registration errors
2. Fix resolver return type annotations
3. Fix context type definitions
4. Update any mismatched field resolvers
5. Fix `builder.queryType` and `builder.mutationType` definitions
6. Verify all resolver files compile

**Sub-Agent Execution Directive** (MUST requirements):

- **MUST** verify Steps 3 and 8 completed
- **MUST** read `apps/backend-server/AGENTS.md`
- **MUST** follow Pothos type registration patterns
- **MUST** report: error count delta (target: ~150→0), resolvers fixed, and Pothos type alignment status
- **MUST** complete before Step 14 final verification (which includes backend)
- **PARALLEL SAFE**: Can run simultaneously with Step 11 (backend uses Pothos, native/web use urql)

**Verification**:

- **Level**: Per-Item (MEDIUM)
- **Threshold**: 4.0/5.0
- **Rubric**:
  - Zero errors in activityFeed.ts (0.30)
  - Context types properly defined (0.25)
  - Pothos type registrations match schema (0.25)
  - All resolvers compile (0.20)

---

#### Step 13: Fix Native App

**Goal**: Fix all TypeScript errors in native app  
**Output**: `apps/native` compiles with zero errors  
**Dependencies**: 9, 11  
**Parallel with**: None (follows Step 11 for urql patterns)  
**Assigned Agent**: `sdd:developer`  
**Duration**: 4 hours

**Success Criteria**:

- [ ] `~/styles` module resolution fixed
- [ ] All urql hooks in `apps/native/src/app/(tabs)/**` use tuple patterns
- [ ] All imports from `@mirai-app/ui` resolve
- [ ] `tsc --noEmit` in `apps/native` shows 0 errors

**Subtasks**:

1. Fix `~/styles` module path (add tsconfig path or move file)
2. Fix urql hooks in `apps/native/src/app/(tabs)/trips/**/*.tsx`
3. Fix urql hooks in `apps/native/src/app/(tabs)/notifications/index.tsx`
4. Update all TanStack Query patterns to urql tuple patterns
5. Fix imports from `@mirai-app/graphql-client`
6. Fix component prop types
7. Run `tsc --noEmit` and fix remaining errors

**Sub-Agent Execution Directive** (MUST requirements):

- **MUST** verify Steps 9 and 11 completed
- **MUST** read `apps/native/AGENTS.md`
- **MUST** follow urql tuple patterns from Step 11
- **MUST** verify UI imports work from Step 9
- **MUST** report: error count delta (target: ~200→0), urql hooks fixed, and native app compilation status
- **MUST** run `tsc --noEmit` in `apps/native` before completion
- **MUST** complete before Step 14 can begin (sequential dependency)

**Verification**:

- **Level**: Per-Item (MEDIUM)
- **Threshold**: 4.0/5.0
- **Rubric**:
  - `~/styles` module resolved (0.25)
  - All urql hooks use tuple patterns (0.30)
  - UI imports from @mirai-app/ui resolve (0.25)
  - Zero TypeScript errors in apps/native (0.20)

---

#### Step 14: Fix Web App (FINAL)

**Goal**: Fix all TypeScript errors in web app and verify entire monorepo  
**Output**: `apps/web` compiles with zero errors, root `tsc --noEmit` passes  
**Dependencies**: 9, 11, 13  
**Parallel with**: 13 (late stage - can overlap partially)  
**Assigned Agent**: `sdd:developer`  
**Duration**: 4 hours  
**Critical Path**: Yes - FINAL STEP

**Success Criteria**:

- [ ] `apps/web` has 0 TypeScript errors
- [ ] All admin dashboard components compile
- [ ] All urql patterns match native app fixes
- [ ] `tsc --noEmit` in `apps/web` shows 0 errors
- [ ] **FINAL**: Root `tsc --noEmit` shows 0 errors across all packages

**Subtasks**:

1. Fix admin dashboard components in `apps/web/src/components/admin/**`
2. Fix UI imports from `@mirai-app/ui`
3. Fix urql patterns to match tuple destructuring
4. Fix any remaining component prop type mismatches
5. Run `tsc --noEmit` in `apps/web`
6. **FINAL VERIFICATION**: Run `tsc --noEmit` from root, verify 0 errors
7. Run `bun test` and verify all tests pass

**Sub-Agent Execution Directive** (MUST requirements):

- **MUST** verify Steps 9, 11, and 13 completed
- **MUST** read `apps/web/AGENTS.md`
- **MUST** follow urql tuple patterns from Step 11
- **MUST** verify UI imports work from Step 9
- **MUST** run root `tsc --noEmit` and verify 0 errors
- **MUST** run `bun test` and verify all tests pass
- **MUST** report: error count delta (target: ~250→0), web app compilation status, final verification results
- **CRITICAL PATH - FINAL STEP**: This step completes the entire task
- **PARALLEL NOTE**: Can start when Step 13 is partially complete (late-stage web fixes)

**Verification**:

- **Level**: Panel (HIGH)
- **Threshold**: 4.5/5.0
- **Rubric**:
  - Zero TypeScript errors in apps/web (0.30)
  - Root tsc --noEmit shows 0 errors (0.30)
  - All tests pass (0.20)
  - Admin dashboard components compile (0.20)

---

### Blockers with Resolutions

| Blocker                                                                | Step | Resolution                                                               | Contingency                                                                                           |
| ---------------------------------------------------------------------- | ---- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| **B1**: `packages/use-cases` ↔ `packages/adapters` circular dependency | 2, 4 | Extract repository interfaces to `packages/domain/src/ports/`            | If domain export issues persist, create temporary `packages/ports/` package                           |
| **B2**: `repository-mocks.ts` (146 errors) blocks test execution       | 7    | Fix all missing mock methods and Effect types first                      | If mocking is too complex, temporarily skip test compilation and fix mocks in parallel with app fixes |
| **B3**: GraphQL operations not generated                               | 3    | Run codegen to generate missing operations                               | If codegen fails, manually add operation documents to graphql-client                                  |
| **B4**: `~/styles` path unresolvable                                   | 13   | Add path alias in `apps/native/tsconfig.json` or move to shared location | Create `packages/native-styles/` package if native-specific                                           |
| **B5**: UI package exports missing                                     | 9    | Create barrel exports in `packages/ui/src/index.ts`                      | Export components individually from `package.json` exports field if barrel fails                      |

---

### Risks with Mitigations

| Risk                                                                      | Likelihood | Impact | Mitigation                                                                                               |
| ------------------------------------------------------------------------- | ---------- | ------ | -------------------------------------------------------------------------------------------------------- |
| **R1**: Fixing errors reveals new cascading errors                        | High       | High   | Follow bottom-up order strictly; re-run `tsc` after each step; document new error patterns in scratchpad |
| **R2**: Repository mock fixes break existing tests                        | Medium     | High   | Run tests after mock changes; fix test assertions to match new mock behavior; use TDD pattern            |
| **R3**: Urql API migration incomplete (some hooks still use old patterns) | Medium     | Medium | Search for all `useQuery` and `useMutation` usages; create codemod script if needed; test in native app  |
| **R4**: Circular dependency extraction causes runtime errors              | Low        | High   | Run integration tests after extraction; verify awilix DI container resolves correctly                    |
| **R5**: Type fixes require runtime logic changes                          | Medium     | High   | Isolate runtime changes in separate commits; get code review for any runtime logic modifications         |
| **R6**: Test suite fails after type fixes (test logic incorrect)          | Medium     | Medium | Fix test assertions that were based on wrong types; do not change actual test scenarios                  |
| **R7**: Scope creep into refactoring                                      | High       | Medium | Enforce "type fixes only" rule; document refactoring needs in separate technical debt task               |

---

### Verification Summary

| Step | Goal                              | Verification Level | Threshold | Evaluation Type |
| ---- | --------------------------------- | ------------------ | --------- | --------------- |
| 1    | Setup & Baseline                  | Panel (HIGH)       | 4.5/5.0   | Comprehensive   |
| 2    | Module Resolution - Part 1        | Panel (HIGH)       | 4.5/5.0   | Comprehensive   |
| 3    | Generate GraphQL Operations       | Single (MEDIUM)    | 4.0/5.0   | Standard        |
| 4    | Module Resolution - Part 2        | Panel (HIGH)       | 4.5/5.0   | Comprehensive   |
| 5    | Effect Error Types (use-cases)    | Single (MEDIUM)    | 4.0/5.0   | Standard        |
| 6    | Branded IDs in Tests              | Per-Item (MEDIUM)  | 4.0/5.0   | Itemized        |
| 7    | Repository Mocks (CRITICAL)       | Panel (HIGH)       | 4.5/5.0   | Comprehensive   |
| 8    | Effect Types (adapters) (CRIT)    | Panel (HIGH)       | 4.5/5.0   | Comprehensive   |
| 9    | UI Package Exports                | Single (MEDIUM)    | 4.0/5.0   | Standard        |
| 10   | Framework Package                 | Single (MEDIUM)    | 4.0/5.0   | Standard        |
| 11   | GraphQL Client Integration (CRIT) | Panel (HIGH)       | 4.5/5.0   | Comprehensive   |
| 12   | Backend Resolvers                 | Per-Item (MEDIUM)  | 4.0/5.0   | Itemized        |
| 13   | Native App                        | Per-Item (MEDIUM)  | 4.0/5.0   | Itemized        |
| 14   | Web App (FINAL) (CRITICAL)        | Panel (HIGH)       | 4.5/5.0   | Comprehensive   |

**Verification Statistics**:

- **Total Steps**: 14
- **Steps with Verification**: 14 (100%)
- **Panel (HIGH)**: 6 steps (1, 2, 4, 7, 8, 11, 14)
- **Single/Per-Item (MEDIUM)**: 8 steps (3, 5, 6, 9, 10, 12, 13)
- **None (LOW)**: 0 steps
- **Total Evaluations**: 14 (one per step)

---

### Implementation Summary Table

| Phase | Step | Goal                            | Package(s)             | Files Est. | Error Target    | Dependencies | Parallel With | Agent             |
| ----- | ---- | ------------------------------- | ---------------------- | ---------- | --------------- | ------------ | ------------- | ----------------- |
| 1     | 1    | Setup & Baseline                | All                    | -          | -               | None         | None          | sdd:code-explorer |
| 1     | 2    | Module Resolution - Part 1      | domain, graphql-client | ~10        | ~20 TS2307      | 1            | None          | sdd:developer     |
| 1     | 3    | Generate GraphQL Operations     | graphql-client         | ~5         | ~10 errors      | 1            | 2             | sdd:developer     |
| 2     | 4    | Module Resolution - Part 2      | use-cases, adapters    | ~15        | ~40 TS2307      | 2            | None          | sdd:developer     |
| 2     | 5    | Effect Error Types (use-cases)  | use-cases              | ~20        | ~50 TS2322      | 4            | 6             | sdd:developer     |
| 2     | 6    | Branded IDs in Tests            | use-cases              | ~10        | ~30 TS2345      | 4            | 5             | sdd:developer     |
| 2     | 7    | **CRITICAL** - Repository Mocks | use-cases              | 1          | **146 errors**  | 4, 5         | None          | sdd:developer     |
| 2     | 8    | Effect Types (adapters)         | adapters               | ~8         | **~108 errors** | 4, 7         | 9             | sdd:developer     |
| 3     | 9    | UI Package Exports              | ui                     | ~5         | ~107 TS2307     | 2            | 5, 6, 8       | sdd:developer     |
| 3     | 10   | Framework Package               | frameworks             | ~10        | ~294 errors     | 8            | None          | sdd:developer     |
| 3     | 11   | GraphQL Client Integration      | native, web            | ~25        | ~374 TS2339     | 3, 8         | 12            | sdd:developer     |
| 4     | 12   | Backend Resolvers               | backend-server         | ~5         | **~150 errors** | 3, 8         | 11            | sdd:developer     |
| 4     | 13   | Native App                      | native                 | ~40        | ~200 errors     | 9, 11        | None          | sdd:developer     |
| 4     | 14   | Web App (FINAL)                 | web                    | ~50        | ~250 errors     | 9, 11, 13    | 13 (late)     | sdd:developer     |

**Total Steps**: 14  
**Total Subtasks**: 47  
**Critical Path Steps**: 7 (steps 1→2→4→7→8→11→14)  
**Estimated Total Effort**: 25 hours (with parallelization) / 35 hours (sequential)  
**Maximum Parallelization Depth**: 3-4 concurrent agents  
**Time Savings from Parallelization**: ~10 hours (29% reduction)

---

### Parallelization Execution Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                EXECUTION TIMELINE                                        │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                         │
│  Hour:   1    2    3    4    5    6    7    8    9   10   11   12   13   14   15+      │
│          │    │    │    │    │    │    │    │    │    │    │    │    │    │    │       │
│  Wave 1  [1: Setup/Baseline - sdd:code-explorer]                                       │
│               │                                                                          │
│  Wave 2       [2: Module Part 1 - sdd:developer]─────┐                                 │
│               [3: GraphQL Ops - sdd:developer]───────┤                                 │
│                                                      │                                 │
│  Wave 3                                              [4: Circular Dep - CRITICAL]     │
│                                                                   │                    │
│  Wave 4 (PEAK)                                                    ├─[5: Effect UC]     │
│                                                                   ├─[6: Branded IDs]   │
│                                                                   └─[9: UI Package]    │
│                                                                                        │
│  Wave 5                                                           │                    │
│                                                                   ▼                    │
│                                                              [7: Repository Mocks]     │
│                                                              CRITICAL - 146 errors     │
│                                                                   │                    │
│  Wave 6                                                           ▼                    │
│                                                              [8: Adapters - CRITICAL]  │
│                                                              [10: Frameworks]          │
│                                                                   │                    │
│  Wave 7                                                           ├─[11: URQL - CRIT]  │
│                                                                   └─[12: Backend]      │
│                                                                                        │
│  Wave 8                                                              │                 │
│                                                                      ▼                 │
│                                                              [13: Native App]           │
│                                                                   │                    │
│  Wave 9                                                           ▼                    │
│                                                              [14: Web App - FINAL]     │
│                                                              CRITICAL - Final verify   │
│                                                                                        │
│  Legend: [Step Description - Agent Type]                                                │
│  Critical Path: Bold steps (1→2→4→7→8→11→14) must complete sequentially                │
│  Parallel Waves: Steps at same horizontal level can run concurrently                  │
│  Maximum Agents: 3-4 during Waves 4 and 7                                                │
│                                                                                        │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

### Dependency Graph with Parallel Groups

```
                           ┌──────────────────────────────────────┐
                           │           PHASE 4: APPLICATION       │
                           │  ┌─────────────┐  ┌────────────────┐ │
                           │  │ Step 13     │  │ Step 14 (FINAL)│ │
                           │  │ Native App  │──│ Web App        │ │
                           │  │ Agent: dev  │  │ Agent: dev     │ │
                           │  │ Dur: 4h     │  │ Dur: 4h        │ │
                           │  │ Deps: 9,11  │  │ Deps: 9,11,13  │ │
                           │  └─────────────┘  │ Parallel: 13   │ │
                           │                   └────────────────┘ │
                           │                    CRITICAL PATH     │
                           └──────────────────┬───────────────────┘
                                              │
                           ┌──────────────────┴───────────────────┐
                           │           PHASE 3: PRESENTATION      │
                           │  ┌───────────┐  ┌─────────────────┐ │
                           │  │ Step 11   │  │ Step 12         │ │
                           │  │ URQL Int  │  │ Backend         │ │
                           │  │ Agent: dev│  │ Agent: dev      │ │
                           │  │ Dur: 3h   │  │ Dur: 4h         │ │
                           │  │ Deps:3,8  │  │ Deps: 3,8       │ │
                           │  │ Parallel:12│  │ Parallel: 11    │ │
                           │  │ CRITICAL │  │                 │ │
                           │  └─────┬─────┘  └─────────────────┘ │
                           │        │                            │
                           │  ┌─────┴─────────┐  ┌────────────┐  │
                           │  │ Step 10       │  │ Step 9     │  │
                           │  │ Frameworks    │  │ UI Package │  │
                           │  │ Agent: dev    │  │ Agent: dev │  │
                           │  │ Dur: 2h       │  │ Dur: 2h    │  │
                           │  │ Deps: 8       │  │ Deps: 2    │  │
                           │  │               │  │ Parallel:  │  │
                           │  │               │  │ 5,6,8      │  │
                           │  └───────────────┘  └────────────┘  │
                           └──────────────────┬───────────────────┘
                                              │
                           ┌──────────────────┴───────────────────┐
                           │           PHASE 2: CORE LOGIC        │
                           │  ┌─────────────┐  ┌────────────────┐ │
                           │  │ Step 8      │  │ Step 7       │   │
                           │  │ Adapters    │  │ Repository   │   │
                           │  │ Agent: dev  │  │ Mocks        │   │
                           │  │ Dur: 4h     │  │ Agent: dev   │   │
                           │  │ Deps: 4,7   │  │ Dur: 4h      │   │
                           │  │ Parallel: 9 │  │ Deps: 4,5    │   │
                           │  │ CRITICAL  │  │ CRITICAL     │   │
                           │  └──────┬──────┘  └──────────────┘   │
                           │         │                            │
                           │  ┌──────┴──────┐                     │
                           │  │ Step 5 + 6  │                     │
                           │  │ ┌───┐ ┌───┐ │                     │
                           │  │ │ 5 │ │ 6 │ │ PARALLEL GROUP      │
                           │  │ │Effect│ │Branded│               │
                           │  │ │Types │ │IDs    │               │
                           │  │ │Dev  │ │Dev   │               │
                           │  │ │2h  │ │2h    │               │
                           │  │ │Deps:4│ │Deps:4│               │
                           │  │ │Par:6│ │Par:5│                │
                           │  │ └───┘ └───┘ │                     │
                           │  └──────┬──────┘                     │
                           │         │                            │
                           │  ┌──────┴──────┐                     │
                           │  │ Step 4      │                     │
                           │  │ Circular Dep│                     │
                           │  │ Agent: dev  │                     │
                           │  │ Dur: 3h     │                     │
                           │  │ Deps: 2     │                     │
                           │  │ CRITICAL  │                     │
                           │  └─────────────┘                     │
                           └──────────────────────────────────────┘
                                              │
                           ┌──────────────────┴───────────────────┐
                           │           PHASE 1: FOUNDATION        │
                           │  ┌───────────┐  ┌─────────────────┐ │
                           │  │ Step 2    │  │ Step 3          │ │
                           │  │ Module P1 │  │ GraphQL Gen     │ │
                           │  │ Agent: dev│  │ Agent: dev      │ │
                           │  │ Dur: 3h   │  │ Dur: 2h         │ │
                           │  │ Deps: 1   │  │ Deps: 1         │ │
                           │  │ Parallel: │  │ Parallel: 2     │ │
                           │  │ None      │  │                 │ │
                           │  │ CRITICAL  │  │                 │ │
                           │  └─────┬─────┘  └─────────────────┘ │
                           │        │                            │
                           │  ┌─────┴────────────────────────┐   │
                           │  │ Step 1                        │   │
                           │  │ Setup/Baseline                │   │
                           │  │ Agent: sdd:code-explorer      │   │
                           │  │ Dur: 1h                       │   │
                           │  │ Deps: None                    │   │
                           │  │ CRITICAL START                │   │
                           │  └──────────────────────────────┘   │
                           └──────────────────────────────────────┘
```

### Parallelization Rules

1. **Critical Path Priority**: Steps 1→2→4→7→8→11→14 must run with highest priority
2. **Dependency Satisfaction**: No step starts before all dependencies complete
3. **Package Isolation**: Steps touching same package cannot run in parallel (except designated pairs)
4. **Interface Contract**: Steps producing interfaces must complete before consumers start
5. **Test Safety**: Steps modifying tests cannot run parallel to steps modifying tested code

### SADD Sub-Agent Execution Requirements

Each sub-agent MUST adhere to the following:

1. **MUST read CLAUDE.md §10** (Effect Framework Patterns) before starting any implementation work
2. **MUST read AGENTS.md** for the specific layer being modified (domain/, use-cases/, adapters/, etc.)
3. **MUST verify dependencies completed** by checking scratchpad or parent agent confirmation
4. **MUST follow TDD pattern**: Write failing test → implement fix → verify pass
5. **MUST NEVER modify tsconfig.json, .eslintrc, or lint rules** (AGENTS.md Rule 4 compliance)
6. **MUST run `tsc --noEmit`** after each significant change and report error count delta
7. **MUST update scratchpad** at `.specs/scratchpad/parallelization-typescript-fixes.md` with actual effort
8. **MUST report on completion**: error count delta, files changed, tests status, blockers found
9. **MUST verify no new circular dependencies** introduced (especially Steps 2, 4, 7, 8)
10. **MUST document any runtime logic changes** discovered during type fixes

---

### Definition of Done (Reiterated)

**Hard Requirements**:

1. `tsc --noEmit` from repository root exits with code 0
2. All 997 original TypeScript errors resolved (no hiding/suppressing)
3. `bun test` passes with same or better pass rate than baseline
4. No modifications to `tsconfig.json`, `.eslintrc`, or other config files to suppress errors
5. Repository mocks (`repository-mocks.ts`) compile with 0 errors
6. All barrel exports (`packages/ui/src/index.ts`) resolve correctly

**Verification Steps**:

1. Run `tsc --noEmit` and confirm 0 errors
2. Run `bun test` and document pass rate
3. Spot-check 5 random files from error analysis to confirm fixes applied
4. Verify circular dependency broken: `use-cases` and `adapters` both import from `domain`
5. Verify no new circular dependencies introduced

**Documentation Requirements**:

1. Update `.specs/scratchpad/decomposition-typescript-fixes.md` with actual vs planned effort
2. Document any patterns discovered during implementation
3. Record any runtime logic changes made (should be minimal)

---

## Notes

- This implementation follows AGENTS.md Rule 4: Never modify lint/type config
- TDD approach: For each subtask, write test (if applicable), watch fail, fix, verify pass
- SADD pattern: Steps 5-6 and steps 11-12 can be executed in parallel with sub-agents
- Kaizen: Document refactoring opportunities found during type fixes for future work

### Parallelization Reference

For complete parallelization details, execution waves, and agent coordination:
**See**: `.specs/scratchpad/parallelization-typescript-fixes.md`

This scratchpad documents:

- Dependency matrix for all 14 steps
- Execution waves and timeline
- Maximum parallelization depth (3-4 concurrent agents)
- Risk mitigation for parallel execution
- Verification gates between waves
- Agent distribution summary
