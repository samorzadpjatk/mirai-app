---
title: Reverse Effect migration - Keep Effect everywhere with RunPromise for external libraries
status: draft
issue_type: refactor
complexity: L
---

## Initial User Prompt

/implement EFFECT_MIGRATION_AUDIT.md; I want Effect used everywhere - only RunPromise with external libraries

## Description

**Reverse the Effect migration direction - Keep Effect everywhere in use-cases layer**

The EFFECT_MIGRATION_AUDIT.md recommended migrating FROM Effect TO async/await patterns. This task reverses that direction: we will keep Effect everywhere in the use-cases layer, using Effect.runPromise only as a boundary wrapper for external library calls.

This decision maintains a consistent functional programming approach across the codebase, leveraging Effect's compositional capabilities for error handling and effect management. All 155 interactor files will continue using Effect.gen patterns with Effect.Effect return types, while external calls to Prisma, Supabase, and other libraries are wrapped with Effect.tryPromise or Effect.runPromise.

**Key requirements**:

- Interactor functions use Effect.gen with Context.Tag dependency injection
- Port interfaces define methods returning Effect.Effect<A, E, R>
- No async/await patterns in use-cases layer (except for external library wrappers)
- Controllers run Effects with Effect.runPromise at the boundary
- All tests use Effect patterns for assertions

**Scope**:

- **Included**: All use-case interactor files (155 files), port interface definitions, adapter compatibility updates, test files
- **Excluded**: Domain layer (keeps Result types), framework layer configuration, new feature development

**User Scenarios**:

1. **Primary Flow**: Developer creates interactor using Effect.gen → composes repositories via Context.Tag → returns Effect.Effect → controller runs with Effect.runPromise
2. **Error Handling**: Effect.fail for domain errors → Effect.tryPromise for external errors → consistent error propagation
3. **Complex Operations**: Multiple Effects composed with Effect.all or Effect.forEach for batch operations

---

## Acceptance Criteria

### Functional Requirements

- [ ] **AC1: All interactors use Effect.gen**: Every interactor file in `packages/use-cases/src/interactors/` uses `Effect.gen(function* () { ... })` pattern
  - **Given**: An interactor file exists in the use-cases layer
  - **When**: I examine the file content
  - **Then**: The file uses Effect.gen pattern with Effect.Effect return type

- [ ] **AC2: Port interfaces return Effect**: All port interface methods return `Effect.Effect<A, E, R>` types
  - **Given**: A port interface file exists in `packages/use-cases/src/ports/`
  - **When**: I check the method signatures
  - **Then**: All methods return Effect.Effect with proper type parameters

- [ ] **AC3: External calls wrapped**: All Prisma, Supabase, and external API calls are wrapped with `Effect.tryPromise` or `Effect.runPromise`
  - **Given**: An external library call exists in the codebase
  - **When**: The call is executed
  - **Then**: It's wrapped with Effect.tryPromise or Effect.runPromise to maintain Effect composition

- [ ] **AC4: No async/await in use-cases**: Zero `async/await` patterns exist in use-cases layer (except for external library wrappers)
  - **Given**: A use-case file is analyzed
  - **When**: Checking for async function declarations
  - **Then**: No async/await patterns are found (excluding adapter layer)

- [ ] **AC5: Tests use Effect**: All interactor test files use `Effect.runPromise` for assertions
  - **Given**: A test file exists for an interactor
  - **When**: Tests are executed
  - **Then**: Tests use Effect.runPromise and Effect patterns for assertions

- [ ] **AC6: Type safety maintained**: Full TypeScript type inference maintained across all Effect chains
  - **Given**: An Effect composition exists in the codebase
  - **When**: TypeScript compilation runs
  - **Then**: No type errors in Effect compositions; types properly inferred

### Non-Functional Requirements

- [ ] **NFR1: Performance**: No measurable performance regression compared to current state
- [ ] **NFR2: Maintainability**: Single, consistent pattern throughout use-cases layer
- [ ] **NFR3: Developer Experience**: Clear, documented pattern with examples in AGENTS.md

### Definition of Done

- [ ] All 155 interactor files use Effect.gen pattern (AC1)
- [ ] All port interfaces return Effect.Effect types (AC2)
- [ ] All external library calls properly wrapped (AC3)
- [ ] Zero async/await in use-cases layer verified via automated check (AC4)
- [ ] All tests pass using Effect patterns (AC5)
- [ ] TypeScript compilation passes with no errors (AC6)
- [ ] No performance regression measured (NFR1)
- [ ] AGENTS.md updated with Effect pattern examples (NFR3)
- [ ] Code review completed
- [ ] All CI checks pass

---

## Architecture Overview

### Current State

- Some use cases use async/await (GetUser, GetGroup, GetLocation)
- Some use cases already use Effect (most of the 155 interactors)
- 3 port interfaces (UserRepository, GroupRepository, LocationRepository) return `Promise<T>`
- 15+ other ports already return `Effect.Effect<A, E, R>`
- In-memory repositories have mixed implementation state

### Target State

- All 155+ interactor use cases use `Effect.gen` with `Effect.Effect<T, E, never>` return types
- All port interfaces define methods returning `Effect.Effect<A, E, R>` for composability
- External libraries wrapped with `Effect.tryPromise` in adapters
- Controllers use `Effect.runPromise` at system boundaries
- Zero async/await patterns in use-cases layer (except external library wrappers)

### Layer Responsibility Patterns

| Layer          | Return Type                   | Pattern               | Responsibility               |
| -------------- | ----------------------------- | --------------------- | ---------------------------- |
| **Domain**     | `Either<E, T>` or plain types | Pure functions        | Business rules, validation   |
| **Use Cases**  | `Effect.Effect<T, E, never>`  | `Effect.gen`          | Business logic orchestration |
| **Ports**      | `Effect.Effect<T, E, R>`      | Interface definitions | Repository contracts         |
| **Adapters**   | `Effect.Effect<T, E, never>`  | `Effect.tryPromise`   | External service wrappers    |
| **Frameworks** | `Promise<T>`                  | `Effect.runPromise`   | System boundary              |

---

## Solution Strategy

### Migration Approach: Bottom-up, Layer by Layer

1. **Phase 1: Port Interfaces** (Foundation)
   - Update 3 port files to return `Effect.Effect<T, DatabaseError, never>`
   - Define `DatabaseError` as `Data.TaggedError` in domain or use-cases
   - Remove "Migrated from Effect to Promise" comments

2. **Phase 2: Adapter Repositories** (Implementation)
   - Update in-memory repositories to match new port signatures
   - Add `Effect.tryPromise` wrapping to Drizzle repository calls
   - Maintain `Effect.Effect` return types throughout

3. **Phase 3: Use Cases** (Business Logic)
   - Convert 3 async use cases (`GetUser`, `GetGroup`, `GetLocation`) to `Effect.gen`
   - Keep `Result<T,E>` as the success channel value type (minimize controller changes)
   - Use constructor injection for repositories

4. **Phase 4: Tests** (Verification)
   - Update test files to use `Effect.runPromise` for execution
   - Update mock repositories to return `Effect.Effect` instead of `Promise`
   - Convert `GetUser.test.ts` from legacy `provideService` pattern to constructor injection

### Key Pattern: Constructor Injection with Effect.gen

```typescript
// Use constructor injection (not Context.Tag)
export class GetUserUseCase {
  constructor(private readonly userRepo: UserRepository) {}

  execute(
    input: GetUserInput,
  ): Effect.Effect<Result<GetUserOutput, Error>, never, never> {
    return Effect.gen(function* () {
      // yield* composes Effects without await
      const user = yield* this.userRepo.findById(input.userId);

      if (!user) {
        return yield* Effect.succeed(
          err(new GetUserNotFoundError({ userId: input.userId })),
        );
      }

      return ok(toOutput(user));
    });
  }
}
```

---

## Key Decisions

### Decision 1: Keep `Result<T,E>` as Success Channel Value

- **Context:** Use cases currently return `Result<T,E>` in success channel
- **Decision:** Keep `Result<T,E>` as the success value type; do not unwrap
- **Rationale:** Minimizes changes to controllers and calling code; maintains backward compatibility
- **Trade-off:** Double wrapping (`Effect<never, never, Result<T,E>>`) but explicit and consistent

### Decision 2: Use `Effect.tryPromise` (Not `runPromise`) in Adapters

- **Context:** Need to wrap external library calls (Prisma, Supabase, etc.)
- **Decision:** Use `Effect.tryPromise` for external async operations
- **Rationale:** Maintains error type safety across the adapter boundary; errors become typed `DatabaseError`
- **Implementation:** Catch errors, convert to tagged errors; defects use `Effect.die`

### Decision 3: Constructor Injection Over Context.Tag

- **Context:** Codebase has two DI patterns: constructor injection and `Context.Tag`
- **Decision:** Use constructor injection for repository dependencies
- **Rationale:** Simpler, more explicit, easier to test; aligns with most existing code
- **Migration:** `GetUser.test.ts` uses legacy `Effect.provideService()` pattern - update to match others

### Decision 4: `DatabaseError` as Tagged Error for Repositories

- **Context:** Repository operations can fail (network, constraint violations, etc.)
- **Decision:** Define `DatabaseError` as `Data.TaggedError("DatabaseError")` for repository operations
- **Rationale:** Consistent error handling; type-safe error matching with `Effect.catchTag`
- **Note:** Unexpected errors are defects - use `Effect.die` to crash fast

---

## Expected Changes

### Must Change (10 files)

| #   | File Path                                                | Layer    | Change Description                                                                   |
| --- | -------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------ |
| 1   | `packages/use-cases/src/ports/UserRepository.ts`         | Port     | Change return types from `Promise<T>` to `Effect.Effect<T, DatabaseError, never>`    |
| 2   | `packages/use-cases/src/ports/GroupRepository.ts`        | Port     | Change return types from `Promise<T>` to `Effect.Effect<T, DatabaseError, never>`    |
| 3   | `packages/use-cases/src/ports/LocationRepository.ts`     | Port     | Change return types from `Promise<T>` to `Effect.Effect<T, DatabaseError, never>`    |
| 4   | `packages/adapters/src/gateways/in-memory/user.ts`       | Adapter  | Remove `Effect.runPromise()` wrapper; return `Effect.Effect` directly                |
| 5   | `packages/use-cases/src/interactors/GetUser.ts`          | Use Case | Remove `async` keyword; use `Effect.gen`; return `Effect.Effect`                     |
| 6   | `packages/use-cases/src/interactors/GetGroup.ts`         | Use Case | Remove `async` keyword; use `Effect.gen`; return `Effect.Effect`                     |
| 7   | `packages/use-cases/src/interactors/GetLocation.ts`      | Use Case | Remove `async` keyword; use `Effect.gen`; return `Effect.Effect`                     |
| 8   | `packages/use-cases/src/interactors/GetUser.test.ts`     | Test     | Replace `provideService` pattern with constructor injection; use `Effect.runPromise` |
| 9   | `packages/use-cases/src/interactors/GetGroup.test.ts`    | Test     | Update mock to return `Effect.Effect`; use `Effect.runPromise` for assertions        |
| 10  | `packages/use-cases/src/interactors/GetLocation.test.ts` | Test     | Update mock to return `Effect.Effect`; use `Effect.runPromise` for assertions        |

### May Need Change (Inspection Required)

| #   | File Path                                            | Layer   | Check Required                                          |
| --- | ---------------------------------------------------- | ------- | ------------------------------------------------------- |
| 11  | `packages/adapters/src/gateways/drizzle/user.ts`     | Adapter | Add `Effect.tryPromise` wrapping if not already present |
| 12  | `packages/adapters/src/gateways/drizzle/group.ts`    | Adapter | Add `Effect.tryPromise` wrapping if not already present |
| 13  | `packages/adapters/src/gateways/drizzle/location.ts` | Adapter | Add `Effect.tryPromise` wrapping if not already present |

### No Changes Needed ✅

- `packages/use-cases/src/interactors/AuthorizeAdmin.ts` - Already pure synchronous
- `packages/use-cases/src/interactors/AuthorizeModerator.ts` - Already pure synchronous
- `packages/adapters/src/gateways/in-memory/group.ts` - Already returns `Effect.Effect`
- 15+ other port interfaces - Already use `Effect.Effect` return types
- Domain layer - No Effect usage (pure by design, uses `Either<E,T>` or plain types)

---

## References

- **Skill File:** [`.claude/skills/effect-patterns/SKILL.md`](../../../.claude/skills/effect-patterns/SKILL.md) - Comprehensive Effect patterns and migration guide
- **Analysis File:** [`.specs/analysis/analysis-effect-migration.md`](../../analysis/analysis-effect-migration.md) - Detailed codebase impact analysis
- **Scratchpad:** [`.specs/scratchpad/architecture-77f85797ce4bdcab.md`](../../scratchpad/architecture-77f85797ce4bdcab.md) - Phase 3 synthesis notes

---

## Implementation Process

### Implementation Summary

| Step | Component            | Files Changed   | Dependencies | Estimated Effort | Risk Level |
| ---- | -------------------- | --------------- | ------------ | ---------------- | ---------- |
| 1    | Port Interfaces      | 3 port files    | None         | 1-2 hours        | Low        |
| 2    | In-Memory Repos      | 1-2 files       | Step 1       | 1-2 hours        | Low        |
| 3    | GetUser Use Case     | GetUser.ts      | Steps 1-2    | 1 hour           | Medium     |
| 4    | GetGroup Use Case    | GetGroup.ts     | Steps 1-2    | 1 hour           | Medium     |
| 5    | GetLocation Use Case | GetLocation.ts  | Steps 1-2    | 1 hour           | Medium     |
| 6    | Test Updates         | 3 test files    | Steps 3-5    | 2-3 hours        | Medium     |
| 7    | Verification         | Full test suite | Steps 1-6    | 1 hour           | Low        |

---

### Step 1: Convert Port Interfaces (UserRepository, GroupRepository, LocationRepository)

**Goal:** Convert the 3 remaining Promise-based port interfaces to Effect.Effect return types, establishing the foundation for all downstream changes.

**Expected Output:**

- `packages/use-cases/src/ports/UserRepository.ts` - All methods return `Effect.Effect<T, DatabaseError, never>`
- `packages/use-cases/src/ports/GroupRepository.ts` - All methods return `Effect.Effect<T, DatabaseError, never>`
- `packages/use-cases/src/ports/LocationRepository.ts` - All methods return `Effect.Effect<T, DatabaseError, never>`
- `DatabaseError` tagged error class defined in domain or shared location

**Success Criteria:**

- [ ] TypeScript compilation passes with no errors in port files
- [ ] All port methods return `Effect.Effect<A, E, R>` instead of `Promise<A>`
- [ ] Error types are properly branded/tagged for type-safe matching
- [ ] No breaking changes to method signatures beyond return type

**Subtasks:**

1. Define `DatabaseError` as `Data.TaggedError("DatabaseError")` with fields for operation, cause, and message
2. Update `UserRepository` interface - change all method return types from `Promise<T>` to `Effect.Effect<T, DatabaseError, never>`
3. Update `GroupRepository` interface - change all method return types from `Promise<T>` to `Effect.Effect<T, DatabaseError, never>`
4. Update `LocationRepository` interface - change all method return types from `Promise<T>` to `Effect.Effect<T, DatabaseError, never>`
5. Remove any "Migrated from Effect to Promise" comments
6. Run TypeScript check to verify no type errors

**Risks and Blockers:**
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Missing repository methods not accounted for | Low | Medium | Full file inspection before starting |
| DatabaseError type conflicts with existing errors | Medium | Low | Check existing error types in domain package |
| Circular dependency if DatabaseError in wrong layer | Low | Medium | Keep DatabaseError in shared/types or domain |

**Dependencies:**

- **Requires:** None (this is the foundation step)
- **Blocks:** Steps 2, 3, 4, 5, 6, 7

#### Verification

| Aspect        | Value      |
| ------------- | ---------- |
| **Level**     | Panel of 2 |
| **Threshold** | 4.0/5.0    |

**Rubric:**

1. **Type Safety (25%)**: All port methods return `Effect.Effect<T, DatabaseError, never>` with proper type parameters
2. **Error Handling (25%)**: `DatabaseError` properly defined as `Data.TaggedError` with operation, cause, message fields
3. **Backward Compatibility (25%)**: Method signatures unchanged except return type; no breaking parameter changes
4. **Completeness (25%)**: All 3 port files updated (UserRepository, GroupRepository, LocationRepository)

---

### Step 2: Update In-Memory Repositories (user.ts - group.ts already uses Effect!)

**Goal:** Update in-memory repository implementations to match new Effect-based port signatures. Note: `group.ts` already uses Effect, only `user.ts` needs migration.

**Expected Output:**

- `packages/adapters/src/gateways/in-memory/user.ts` - Returns `Effect.Effect` instead of `Effect.runPromise` wrapped values
- All in-memory repositories aligned with port interface types

**Success Criteria:**

- [ ] In-memory repositories compile without type errors
- [ ] All methods return `Effect.Effect<T, DatabaseError, never>` matching ports
- [ ] No `Effect.runPromise` usage in in-memory repositories (they should be pure)
- [ ] Tests using in-memory repositories still pass (after Step 6)

**Subtasks:**

1. Read current `user.ts` in-memory implementation
2. Replace `Effect.runPromise` wrapper with direct `Effect.Effect` returns
3. Convert async operations to Effect.gen or Effect.succeed/Effect.fail patterns
4. Ensure all error cases return properly tagged DatabaseError instances
5. Verify `group.ts` is already aligned (no changes needed)
6. Check `location.ts` in-memory if exists (may need updates)

**Risks and Blockers:**
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Complex async logic in in-memory repos hard to convert | Low | Medium | Use Effect.gen for complex flows, Effect.sync for sync ops |
| Test data fixtures may need adjustment | Medium | Low | Review test setup after changes |

**Dependencies:**

- **Requires:** Step 1 (Port interfaces must be Effect-based)
- **Blocks:** Step 6 (Test updates)

#### Verification

| Aspect        | Value   |
| ------------- | ------- |
| **Level**     | Single  |
| **Threshold** | 4.0/5.0 |

**Rubric:**

1. **Effect Purity (30%)**: No `Effect.runPromise` usage in in-memory repositories
2. **Type Alignment (30%)**: All methods match port interface signatures exactly
3. **Error Handling (20%)**: Proper `DatabaseError` creation for all error cases
4. **Implementation Quality (20%)**: Clean `Effect.gen` or `Effect.succeed`/`Effect.fail` patterns

---

### Step 3: Migrate GetUser Use Case to Effect

**Goal:** Convert the `GetUser` use case from async/await to Effect.gen pattern with Effect.Effect return type.

**Expected Output:**

- `packages/use-cases/src/interactors/GetUser.ts` - Uses `Effect.gen`, returns `Effect.Effect`, no async keyword
- Constructor injection of `UserRepository`

**Success Criteria:**

- [ ] No `async` keyword in GetUser use case
- [ ] Returns `Effect.Effect<Result<GetUserOutput, Error>, never, never>`
- [ ] Uses `Effect.gen(function* () { ... })` for composition
- [ ] Repository calls use `yield*` instead of `await`
- [ ] `Result<T,E>` type preserved as success channel value

**Subtasks:**

1. Remove `async` keyword from `execute` method
2. Wrap method body in `Effect.gen(function* () { ... })`
3. Replace `await this.userRepo.findById()` with `yield* this.userRepo.findById()`
4. Ensure error handling returns `Effect.succeed(err(...))` for error cases
5. Ensure success returns `ok(...)` (plain Result, not wrapped in Effect.succeed)
6. Add proper TypeScript return type annotation

**Risks and Blockers:**
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Repository not yet converted (dependency order) | Low | High | Ensure Step 1 and 2 complete first |
| Complex error handling logic | Medium | Low | Map domain errors to Effect.fail, use Result for business errors |
| Type inference issues | Low | Medium | Explicit type annotations on Effect.gen |

**Dependencies:**

- **Requires:** Steps 1, 2 (Ports and in-memory repos must be Effect-based)
- **Blocks:** Step 6 (GetUser.test.ts updates)

#### Verification

| Aspect        | Value   |
| ------------- | ------- |
| **Level**     | Single  |
| **Threshold** | 4.0/5.0 |

**Rubric:**

1. **Effect.gen Pattern (30%)**: Proper use of `Effect.gen` with `yield*` for composition
2. **No Async/Await (25%)**: Zero `async` keywords in the file
3. **Return Type (25%)**: Returns `Effect.Effect<Result<T,E>, never, never>`
4. **Error Handling (20%)**: Proper error propagation via `Effect.fail` or `Result.err`

---

### Step 4: Migrate GetGroup Use Case to Effect

**Goal:** Convert the `GetGroup` use case from async/await to Effect.gen pattern.

**Expected Output:**

- `packages/use-cases/src/interactors/GetGroup.ts` - Uses `Effect.gen`, returns `Effect.Effect`

**Success Criteria:**

- [ ] Same as Step 3 success criteria, applied to GetGroup

**Subtasks:**

1. Same pattern as Step 3, applied to GetGroup.ts
2. Update constructor injection for GroupRepository
3. Convert all async calls to yield\* composition

**Risks and Blockers:**
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Group use case has unique patterns | Low | Medium | Review file before applying pattern |

**Dependencies:**

- **Requires:** Steps 1, 2
- **Blocks:** Step 6

#### Verification

| Aspect        | Value   |
| ------------- | ------- |
| **Level**     | Single  |
| **Threshold** | 4.0/5.0 |

**Rubric:**

1. **Effect.gen Pattern (30%)**: Proper use of `Effect.gen` with `yield*` for composition
2. **No Async/Await (25%)**: Zero `async` keywords in the file
3. **Return Type (25%)**: Returns `Effect.Effect<Result<T,E>, never, never>`
4. **Error Handling (20%)**: Proper error propagation via `Effect.fail` or `Result.err`

---

### Step 5: Migrate GetLocation Use Case to Effect

**Goal:** Convert the `GetLocation` use case from async/await to Effect.gen pattern.

**Expected Output:**

- `packages/use-cases/src/interactors/GetLocation.ts` - Uses `Effect.gen`, returns `Effect.Effect`

**Success Criteria:**

- [ ] Same as Step 3 success criteria, applied to GetLocation

**Subtasks:**

1. Same pattern as Step 3, applied to GetLocation.ts
2. Update constructor injection for LocationRepository
3. Convert all async calls to yield\* composition

**Risks and Blockers:**
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Location use case may have geo-specific logic | Low | Low | Standard Effect migration applies |

**Dependencies:**

- **Requires:** Steps 1, 2
- **Blocks:** Step 6

#### Verification

| Aspect        | Value   |
| ------------- | ------- |
| **Level**     | Single  |
| **Threshold** | 4.0/5.0 |

**Rubric:**

1. **Effect.gen Pattern (30%)**: Proper use of `Effect.gen` with `yield*` for composition
2. **No Async/Await (25%)**: Zero `async` keywords in the file
3. **Return Type (25%)**: Returns `Effect.Effect<Result<T,E>, never, never>`
4. **Error Handling (20%)**: Proper error propagation via `Effect.fail` or `Result.err`

---

### Step 6: Update Test Files

**Goal:** Update all three test files to work with Effect-based use cases and repositories.

**Expected Output:**

- `packages/use-cases/src/interactors/GetUser.test.ts` - Uses constructor injection, Effect.runPromise
- `packages/use-cases/src/interactors/GetGroup.test.ts` - Updated mocks, Effect assertions
- `packages/use-cases/src/interactors/GetLocation.test.ts` - Updated mocks, Effect assertions

**Success Criteria:**

- [ ] All tests pass (`bun test`)
- [ ] No `provideService` pattern (legacy Context.Tag DI)
- [ ] Mock repositories return `Effect.Effect` values
- [ ] Test assertions use `Effect.runPromise` to extract results
- [ ] Tests verify both success and error paths

**Subtasks:**

1. Update `GetUser.test.ts`:
   - Replace `provideService` pattern with constructor injection
   - Create mock repository returning `Effect.Effect` values
   - Use `Effect.runPromise(useCase.execute(input))` in assertions
2. Update `GetGroup.test.ts`:
   - Update mock repository to return `Effect.Effect`
   - Convert async test assertions to Effect.runPromise pattern
3. Update `GetLocation.test.ts`:
   - Same pattern as GetGroup.test.ts
4. Run all three test files to verify pass

**Risks and Blockers:**
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| GetUser.test.ts uses legacy patterns | High | Medium | Full rewrite of test setup needed |
| Mock data inconsistencies | Medium | Medium | Review mock data matches repository types |
| Async test timing issues | Low | Low | Use Effect.runPromise for proper sequencing |

**Dependencies:**

- **Requires:** Steps 3, 4, 5 (Use cases must be migrated first)
- **Blocks:** Step 7

#### Verification

| Aspect        | Value      |
| ------------- | ---------- |
| **Level**     | Panel of 2 |
| **Threshold** | 4.0/5.0    |

**Rubric:**

1. **Constructor Injection (25%)**: Tests use constructor injection, not `provideService`
2. **Effect.runPromise (25%)**: Tests use `Effect.runPromise` for assertions
3. **Mock Repository (25%)**: Mock repositories return `Effect.Effect` values
4. **Test Coverage (25%)**: Both success and error paths tested

---

### Step 7: Verify All Tests Pass

**Goal:** Run complete test suite to ensure no regressions and all Effect migrations work correctly.

**Expected Output:**

- All unit tests pass
- All integration tests pass (if applicable)
- No TypeScript compilation errors
- No lint errors

**Success Criteria:**

- [ ] `bun test` passes (unit tests)
- [ ] `bun test:integration` passes (if exists)
- [ ] `bun run typecheck` passes with no errors
- [ ] No async/await patterns in use-cases layer (verified via grep)
- [ ] Code coverage maintained or improved

**Subtasks:**

1. Run full test suite: `bun test`
2. Run TypeScript type checking
3. Run linting if configured
4. Verify no Promise return types in use-cases layer ports
5. Check for any remaining `async` keywords in use-cases interactors
6. Document any test failures and create fix subtasks if needed

**Risks and Blockers:**
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Unexpected test failures | Medium | High | Fix individual tests, may need Step 6 revisit |
| Integration test failures | Low | High | Drizzle adapters may need Effect.tryPromise updates |
| Performance regression | Low | Medium | Benchmark if tests run slower |

**Dependencies:**

- **Requires:** Steps 1-6 (All implementation steps)
- **Blocks:** Task completion

#### Verification

| Aspect        | Value      |
| ------------- | ---------- |
| **Level**     | Panel of 2 |
| **Threshold** | 4.0/5.0    |

**Rubric:**

1. **Unit Tests Pass (30%)**: All `bun test` passes
2. **TypeScript Compilation (25%)**: No type errors across all packages
3. **No Regressions (25%)**: No async/await patterns in use-cases layer
4. **Code Quality (20%)**: No lint errors, consistent patterns

---

## Verification Summary

| Step | Component            | Level      | Threshold | Key Criteria                                       |
| ---- | -------------------- | ---------- | --------- | -------------------------------------------------- |
| 1    | Port Interfaces      | Panel of 2 | 4.0/5.0   | Type safety, Error tagging, Backward compatibility |
| 2    | In-Memory Repos      | Single     | 4.0/5.0   | Effect purity, Type alignment                      |
| 3    | GetUser Use Case     | Single     | 4.0/5.0   | Effect.gen pattern, No async/await                 |
| 4    | GetGroup Use Case    | Single     | 4.0/5.0   | Effect.gen pattern, No async/await                 |
| 5    | GetLocation Use Case | Single     | 4.0/5.0   | Effect.gen pattern, No async/await                 |
| 6    | Test Updates         | Panel of 2 | 4.0/5.0   | Constructor injection, Effect.runPromise           |
| 7    | Full Verification    | Panel of 2 | 4.0/5.0   | All tests pass, No regressions                     |

**Scratchpad:** `.specs/scratchpad/verifications-ceeed0e64a28136f.md`

---

## Decomposition Scratchpad

**File:** [`.specs/scratchpad/decomposition-215532cd98d1e7bd.md`](../../scratchpad/decomposition-215532cd98d1e7bd.md)

Contains detailed breakdown of all steps, patterns, and reference code examples.
