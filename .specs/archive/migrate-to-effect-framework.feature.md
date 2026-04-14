---
title: Migrate codebase to Effect framework with comprehensive test coverage
status: draft
issue_type: feature
complexity: XL
---

## Initial User Prompt

Research full migration of packages and apps into usage of Effect framework: https://effect.website/docs#docs-for-llMs. Also remove any redundant libraries in the process of migrating into Effect. Remove any file related to tRPC - it is deprecated.

## Description

The Mirai App monorepo currently uses a custom `Result<T,E>` type for error handling and `async/await` with `Promise<Result<T,E>>` patterns for asynchronous operations. While functional, these patterns lack the composability, type inference, and advanced features (structured concurrency, resource management, observability) of modern effect systems.

This migration will standardize the entire codebase on the Effect framework (https://effect.website), a production-grade TypeScript library for building composable, type-safe applications. Effect provides a unified abstraction for synchronous and asynchronous effects, explicit error handling, dependency injection through layers, and built-in observability.

The business value of this migration includes: (1) **Reduced bug rates** through type-safe error handling that prevents unhandled exceptions, (2) **Improved developer velocity** through better composability and a single abstraction for all effectful operations, and (3) **Enhanced scalability** through structured concurrency and resource management capabilities.

All packages (domain, use-cases, adapters, frameworks) and applications (backend-server, web, native, notification-sender, seed) will be migrated incrementally. The migration is a pure refactoring - no feature additions, behavior changes, or external API modifications are in scope.

**Scope**:

- **Included**:
  - Domain layer: Replace `Result<T,E>` with `Effect<T, E, never>`
  - Use cases: Convert `Promise<Result<T,E>>` to `Effect<T, E, R>`
  - Adapters: Update controllers to handle Effects at boundaries
  - Frameworks: Integrate Effect with DI container and provide Runtimes
  - Apps: Wire Effect at application entry points
  - Tests: Migrate all tests to Effect patterns
  - Dependencies: Remove redundant libraries (neverthrow, fp-ts alternatives)
  - Cleanup: Remove any remaining tRPC-related files

- **Excluded**:
  - Feature additions or behavioral changes
  - Database schema modifications
  - GraphQL schema changes (unless required for error handling)
  - UI/UX redesigns
  - Authentication mechanism changes
  - Infrastructure or deployment changes

**User Scenarios**:

1. **Primary Flow**: Developer adds Effect dependency to a package, replaces Result types with Effect, updates entity methods to return Effects, verifies tests pass, and proceeds to the next package.
2. **Alternative Flow**: Team migrates domain layer first, temporarily bridges old and new patterns in adapters, then completes use case and adapter migration.
3. **Error Handling**: When an Effect returns an error in a controller, it maps to the appropriate HTTP status code or GraphQL error format, maintaining the same external contract as before.

## Acceptance Criteria

### Functional Requirements

- [ ] **FC-01 Domain Effect Types**: Domain package exports Effect-based utilities instead of Result<T,E>
  - Given: The @mirai-app/domain package
  - When: Inspecting utils/result.ts exports
  - Then: Provides Effect<T, E, never> patterns instead of custom Result type

- [ ] **FC-02 Entity Creation**: All entity static factory methods return Effect
  - Given: A domain entity with a create method
  - When: Calling Entity.create(validProps)
  - Then: Returns Effect<Entity, ValidationError> instead of Result<Entity, ValidationError>

- [ ] **FC-03 Use Case Effects**: All use case interactors return Effect
  - Given: A use case interactor class
  - When: Calling execute() method
  - Then: Returns Effect<OutputDTO, DomainError> instead of Promise<Result<OutputDTO, DomainError>>

- [ ] **FC-04 Controller Integration**: Controllers properly handle Effects at boundaries
  - Given: A controller method receiving a request
  - When: Calling a method that returns Effect
  - Then: Properly runs Effect (via Effect.runPromise or similar) and returns result

- [ ] **FC-05 Error Mapping**: Errors are correctly mapped to HTTP/GraphQL responses
  - Given: An Effect that returns an error in a controller
  - When: The controller processes the error
  - Then: Returns the appropriate HTTP status code or GraphQL error format (preserving existing contracts)

- [ ] **FC-06 Layer Integration**: Effect integrates with DI container
  - Given: The awilix-modular DI container
  - When: Resolving dependencies in a controller
  - Then: Effect layers can be built from container dependencies and provided to use cases

- [ ] **FC-07 Application Boundary**: Apps properly run Effects at system boundary
  - Given: An application entry point (e.g., backend-server)
  - When: Starting the application
  - Then: Effects are run at the outermost layer with proper error handling

### Library Consolidation Requirements

- [ ] **LC-01 Remove Redundant Libraries**: No neverthrow, fp-ts, or similar libraries remain
  - Given: Any package.json in the monorepo
  - When: Checking dependencies
  - Then: Contains no neverthrow, fp-ts, true-myth, or other functional error-handling libraries

- [ ] **LC-02 Custom Result Removal**: No Result<T,E> type usage remains
  - Given: The entire codebase
  - When: Searching for Result type imports
  - Then: Zero imports of the custom Result type from @mirai-app/domain (only Effect)

- [ ] **LC-03 tRPC Cleanup**: All tRPC files removed
  - Given: The codebase
  - When: Searching for tRPC-related files
  - Then: No files containing "trpc" in name or @trpc/ imports exist

### Quality Requirements

- [ ] **QC-01 Test Coverage**: All tests pass with Effect
  - Given: The test suite
  - When: Running `bun test`
  - Then: All tests pass (unit and integration)

- [ ] **QC-02 Coverage Maintained**: Test coverage stays above threshold
  - Given: The coverage report
  - When: Running `bun test --coverage`
  - Then: Coverage is 80% or higher across all packages

- [ ] **QC-03 Type Safety**: No TypeScript errors
  - Given: The TypeScript compiler
  - When: Running `tsc --noEmit` in each package
  - Then: Zero type errors across all packages

- [ ] **QC-04 No Any Types**: No explicit any types introduced
  - Given: The codebase
  - When: Running linter or type check
  - Then: No new explicit `any` type annotations (compared to pre-migration baseline)

### Non-Functional Requirements

- [ ] **NFC-01 Performance**: Response times maintained
  - Given: Key API endpoints under load
  - When: Comparing to pre-migration baseline
  - Then: Response times are within 10% of baseline

- [ ] **NFC-02 Bundle Size**: Effect dependencies reasonable
  - Given: Production build
  - When: Analyzing bundle
  - Then: Effect adds no more than 40KB gzipped total

- [ ] **NFC-03 Documentation**: Effect patterns documented
  - Given: CLAUDE.md
  - When: Reviewing documentation
  - Then: Contains Effect patterns, examples, and migration guidance for developers

### Definition of Done

- [ ] All functional acceptance criteria pass
- [ ] All library consolidation criteria pass
- [ ] All quality criteria pass
- [ ] All non-functional criteria pass (or have documented exceptions)
- [ ] CLAUDE.md updated with Effect patterns and examples
- [ ] Code reviewed by at least one other developer
- [ ] No critical or high priority security vulnerabilities introduced

---

## Architecture Overview

### Solution Strategy

The migration follows an **inside-out approach**, starting with the purest layer (Domain) and working outward to application boundaries. This ensures type safety and composability are established at the core before handling effects at boundaries.

**Migration Approach:**

1. **Domain First**: Migrate `Result<T,E>` to `Effect<A,E,never>` in the pure domain layer
2. **Sequential Layer Migration**: Domain → Use Cases → Adapters → Frameworks → Apps
3. **Bridge Pattern**: Temporary adapters between Effect and non-Effect code during transition
4. **Test-Driven**: Each phase requires updating all corresponding tests

**Core Pattern Mapping:**

| Current Pattern                      | Effect Pattern                   | Notes                                           |
| ------------------------------------ | -------------------------------- | ----------------------------------------------- |
| `Result<T,E>`                        | `Effect<A,E,never>`              | Domain layer remains pure                       |
| `async/await + Promise<Result<T,E>>` | `Effect.gen` with Context        | Use cases gain Requirements type                |
| `ok(value)` / `err(error)`           | `Effect.succeed` / `Effect.fail` | Direct mapping                                  |
| `map`, `flatMap`, `match`            | Effect combinators               | `Effect.map`, `Effect.flatMap`, `Effect.either` |
| awilix DI                            | Context.Tag + Layer              | Type-safe dependency injection                  |
| Custom error classes                 | Data.TaggedError                 | Enables pattern matching                        |

### Key Architectural Decisions

#### KAD-1: Effect Adoption Per Layer

Each layer adopts Effect at different integration points:

| Layer          | Effect Integration                                         | Rationale                                     |
| -------------- | ---------------------------------------------------------- | --------------------------------------------- |
| **Domain**     | Pure `Effect<A,E,never>` - no dependencies                 | Domain should remain dependency-free          |
| **Use Cases**  | `Effect<A,E,R>` with Context.Tags for ports                | Orchestration requires dependencies           |
| **Adapters**   | `Effect.tryPromise` for external calls                     | Bridge between Effect world and external APIs |
| **Frameworks** | Layer composition and runtime configuration                | DI container integration; runtime setup       |
| **Apps**       | `Effect.runPromise` / `Runtime.runPromise` at entry points | System boundaries execute Effects             |

#### KAD-2: Dependency Injection Evolution

Gradually transition from awilix to Effect's Context/Layer system:

- awilix-modular works but lacks compile-time type safety
- Effect's Context provides type-safe dependency tracking
- Hybrid approach: Use Effect for business logic, awilix for framework wiring

#### KAD-3: Error Handling Strategy

Adopt `Data.TaggedError` for all domain/use case errors:

- Type-safe error matching via `Effect.catchTag`
- Distinguishes recoverable errors from defects
- Enables rich error information with structured data

**Pattern:**

```typescript
class ValidationError extends Data.TaggedError("ValidationError")<{
  field: string;
  message: string;
}> {}
```

#### KAD-4: tRPC Removal Status

**Decision:** No tRPC removal required.

**Rationale:** Analysis shows tRPC already eliminated from production code. Only defensive test assertions remain (verifying tRPC doesn't leak into layers). GraphQL + Hono is the current architecture.

#### KAD-5: Library Consolidation

| Remove                   | Keep                         | Reason                    |
| ------------------------ | ---------------------------- | ------------------------- |
| Custom Result utils      | effect/Either                | Native Effect replacement |
| Manual promise utilities | Effect.gen                   | Composable async          |
| p-retry, p-timeout       | Effect.retry, Effect.timeout | Built-in scheduling       |
| neverthrow, fp-ts        | Effect                       | Unified ecosystem         |

**Keep:** Zod (validation), awilix (framework DI), Hono (HTTP), GraphQL Yoga, Drizzle ORM

### Expected Changes

#### Domain Layer (37 files)

- **Modify:** `packages/domain/src/utils/result.ts`, `packages/domain/src/types/Result.ts`, 18 entities, 19 value objects
- **Create:** `packages/domain/src/effect-utils.ts`, `packages/domain/src/errors/*.ts`
- **Delete:** `packages/domain/src/types/Result.ts` (duplicate), `packages/domain/src/utils/result.ts`

#### Use Cases Layer (110 files)

- **Modify:** 93 interactors, 17 port interfaces
- **Create:** `packages/use-cases/src/context/*.ts`, `packages/use-cases/src/layers/*.ts`

#### Adapters Layer (76 files)

- **Modify:** 30 controllers, 17 Drizzle gateways, 17 in-memory gateways, 12 services
- **Create:** `packages/adapters/src/utils/effect-executor.ts`

#### Frameworks Layer (11 files)

- **Modify:** DI files, auth system
- **Create:** `packages/frameworks/src/effect-runtime/*.ts`

#### Apps Layer (48 files)

- **Modify:** Server files, GraphQL context, 24 type files, 19 resolver files

#### Tests (219 files)

- All test files need updates to use Effect test patterns

**Total:** ~720 files (501 implementation + 219 tests)

### Migration Strategy

#### Phase 1: Foundation (Week 1)

- Install `effect` dependency across monorepo
- Create `packages/domain/src/effect-utils.ts`
- Create base error classes with `Data.TaggedError`
- Update domain package exports

#### Phase 2: Domain Migration (Weeks 2-3)

- Batch 1: Core entities (User, Group, Trip)
- Batch 2: Challenge entities (Challenge, Submission, Vote)
- Batch 3: Supporting entities (Location, Notification, Reward, etc.)
- Update all entity tests

#### Phase 3: Use Cases - Core (Weeks 4-5)

- Define Context.Tags for repositories
- Migrate CRUD use cases
- Migrate Authentication use case (most complex)
- Create Layer implementations

#### Phase 4: Use Cases - Features (Weeks 6-8)

Migrate feature-by-feature:

1. Challenge operations (voting, submissions)
2. Reward operations (purchases, inventory)
3. Notification operations (schedules, deliveries)
4. Coin operations (transactions, stats)
5. Admin operations (reports, telemetry)

#### Phase 5: Adapters (Weeks 9-10)

- Update controller-helpers.ts with Effect execution
- Convert controllers to execute Effects
- Update gateways with `Effect.tryPromise`
- Update services

#### Phase 6: Frameworks & Apps (Weeks 11-12)

- Update DI container to provide Effect Layers
- Update GraphQL context with Effect runtime
- Update resolvers to run Effects
- Full integration testing

#### Phase 7: Cleanup (Week 13)

- Remove `result.ts` and `Result.ts`
- Remove redundant library dependencies
- Update CLAUDE.md with Effect patterns
- Final test sweep

### Integration Points

#### Package Interactions During Migration

```
┌─────────────────────────────────────────────────────────────────┐
│                         APP LAYER                               │
│   ┌─────────────────────────────────────────────────────────┐    │
│   │ Effect.runPromise(runtime)(effect)                     │    │
│   └─────────────────────────────────────────────────────────┘    │
│                          │                                      │
│                          ▼                                      │
│   ┌─────────────────────────────────────────────────────────┐    │
│   │                   FRAMEWORKS LAYER                      │    │
│   │  Layer.mergeAll(Config, Logger, RepositoryLayers)      │    │
│   │  Layer.toRuntime → Runtime                             │    │
│   └─────────────────────────────────────────────────────────┘    │
│                          │                                      │
│                          ▼                                      │
│   ┌─────────────────────────────────────────────────────────┐    │
│   │                    ADAPTERS LAYER                       │    │
│   │  Controllers: Effect.runPromise(effect)                │    │
│   │  Gateways: Effect.tryPromise(externalCall)            │    │
│   └─────────────────────────────────────────────────────────┘    │
│                          │                                      │
│                          ▼                                      │
│   ┌─────────────────────────────────────────────────────────┐    │
│   │                   USE CASES LAYER                       │    │
│   │  Effect.gen(function* () {                             │    │
│   │    const repo = yield* Repository;                     │    │
│   │    // orchestration logic                              │    │
│   │  })                                                    │    │
│   └─────────────────────────────────────────────────────────┘    │
│                          │                                      │
│                          ▼                                      │
│   ┌─────────────────────────────────────────────────────────┐    │
│   │                    DOMAIN LAYER                       │    │
│   │  Effect<A, E, never> - Pure, no dependencies         │    │
│   │  Data.TaggedError for errors                         │    │
│   └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

#### Critical Integration Files

| Integration Point     | Files                      | Responsibility                   |
| --------------------- | -------------------------- | -------------------------------- |
| Domain → Use Cases    | Entities, Value Objects    | `Effect<A,E,never>` return types |
| Use Cases → Adapters  | Port interfaces (17 files) | Context.Tag definitions          |
| Adapters → Frameworks | DI module                  | Layer composition                |
| Frameworks → Apps     | Runtime setup              | Effect execution at boundary     |

#### Boundary Handling

**At System Entry (Apps):**

```typescript
const program = Effect.gen(function* () {
  const server = yield* HttpServer;
  yield* server.start();
});
Effect.runPromise(program.pipe(Effect.provide(AppLayer)));
```

**At HTTP Boundary (Controllers):**

```typescript
const result = await Effect.runPromise(
  useCase
    .execute(input)
    .pipe(Effect.catchTag("NotFoundError", () => Effect.succeed(null))),
);
```

**At Database Boundary (Gateways):**

```typescript
findById = (id): Effect<User | null, never, never> =>
  Effect.tryPromise({
    try: () => this.db.query.users.findFirst({ where: eq(users.id, id) }),
    catch: () => new DatabaseError(),
  }).pipe(Effect.map((u) => (u ? toDomain(u) : null)));
```

---

## Implementation Process

### Architecture Decomposition

This section breaks down the 7 migration phases into ordered implementation steps with success criteria, subtasks, blockers, risk mitigations, agent assignments, and parallelization annotations.

---

## Sub-Agent Execution Directive

### MUST Requirements

1. **Foundation First (1.1) MUST complete before ANY domain work**
   - Effect types must be available
   - Blocking: All 2.x steps

2. **Core Domain (2.1) MUST complete before parallel work starts**
   - User, Group, Trip are most referenced entities
   - Blocking: 3.1 (Tags can START but not complete), 2.2

3. **Port Tags (3.1) MUST complete before ANY use case implementation**
   - Dependencies must be typed before use
   - Blocking: 3.2, 3.3, 3.4, 3.5, 3.6

4. **Use Cases (3.x) MUST complete in order**
   - Each layer depends on previous
   - 3.2 → 3.3 → 3.4 → 3.5 → 3.6
   - Blocking: 4.2, 5.1

5. **Effect Utilities (4.1) MUST complete before Controllers (4.2)**
   - Execution helpers required for controllers
   - Blocking: 4.2

6. **Use Cases + Adapters MUST complete before Framework (5.1)**
   - DI integration needs both layers
   - Blocking: 5.1

7. **Framework (5.x) MUST complete in order**
   - 5.1 → 5.2 → 5.3
   - Blocking: 6.1

8. **Auth Use Case (3.3) AND Framework Auth (5.3) synchronization**
   - 5.3 requires both 5.2 AND 3.3
   - Coordinate between these tracks

9. **Applications (6.x) MUST complete in order**
   - 6.1 → 6.2 → 6.3
   - Blocking: 7.x

10. **Cleanup (7.x) can run FULLY PARALLEL**
    - All three steps independent after 6.3
    - 7.3 (Documentation) can run throughout all phases

### Parallelization Diagram

```
LEGEND:
[Step]    = Sequential step
[Step]→   = Step with parallel execution
[Step]*   = Long-running/background step

PHASE 1: FOUNDATION
┌─────────────┐
│   [1.1]   │  sonnet - Effect Installation
└──────┬──────┘
       │
       ▼

PHASE 2: DOMAIN
┌─────────────┐
│   [2.1]   │  opus - Core Entities
└──────┬──────┘
       │
       ▼
┌─────────────┐     ┌─────────────────────────────┐
│   [2.2]   │────→│         [3.1]*              │
│   Domain    │     │  Port Tags (sonnet)         │
└──────┬──────┘     │  STARTS: After 2.1          │
       │            │  RUNS: Through 2.3          │
       ▼            └─────────────────────────────┘
┌─────────────┐     ┌─────────────────────────────┐
│   [2.3]   │←───→│         [7.3]*              │
│   Domain    │     │  Documentation (sonnet)     │
└─────────────┘     │  STARTS: After 1.1          │
                    │  RUNS: All phases           │
                    └─────────────────────────────┘

PHASE 3: USE CASES
┌─────────────┐     ┌─────────────────────────────┐
│ [3.1] FINAL │←───→│         [3.2]             │
└──────┬──────┘     │  CRUD Use Cases (sonnet)    │
       │            └─────────────────────────────┘
       ▼
┌─────────────┐
│   [3.3]   │  opus - Authentication
└──────┬──────┘
       │
       ▼
┌─────────────┐     ┌─────────────────────────────┐
│   [3.4]   │────→│         [4.1]*              │
│ Challenges  │     │  Effect Utilities (sonnet)  │
└──────┬──────┘     │  STARTS: After 3.1          │
       │            │  REFINES: Through 3.6       │
       ▼            └─────────────────────────────┘
┌─────────────┐
│   [3.5]   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   [3.6]   │
└─────────────┘

PHASE 4: ADAPTERS
┌─────────────┐
│ [4.1] FINAL │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   [4.2]   │
└──────┬──────┘
       │
       ▼
┌─────────────┐     ┌─────────────────────────────┐
│   [4.3]   │←───→│         [4.4]             │
│  Drizzle    │     │  In-Memory (sonnet)         │
│  Gateways   │     │  OVERLAPS: Late 4.3         │
│    opus     │     └─────────────────────────────┘
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   [4.5]   │
└─────────────┘

PHASE 5: FRAMEWORK
┌─────────────┐
│   [5.1]   │  opus - DI Integration
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   [5.2]   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   [5.3]   │  sonnet - Auth Integration
└─────────────┘  NEEDS: 5.2 AND 3.3

PHASE 6: APPLICATIONS
┌─────────────┐
│   [6.1]   │  opus - Backend Server
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   [6.2]   │  opus - GraphQL
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   [6.3]   │
└─────────────┘

PHASE 7: CLEANUP (ALL PARALLEL)
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   [7.1]   │←───→│   [7.2]   │←───→│   [7.3]   │
│   Library   │     │    tRPC     │     │   FINAL     │
│   Removal   │     │   Cleanup   │     │    Docs     │
│   haiku     │     │   haiku     │     │   sonnet    │
└─────────────┘     └─────────────┘     └─────────────┘
```

---

### Phase 1: Foundation & Utilities

#### Step 1.1: Effect Installation and Configuration

**Agent:** `sdd:developer` (sonnet) - Foundation setup, standard complexity  
**Parallel with:** None (foundation phase)  
**Duration:** 2-3 days

**Goal:** Install Effect dependency and establish utility layer in domain package.

**Implementation Details:**

- Add `effect` dependency to root package.json with pinned version
- Install Effect across all packages (domain, use-cases, adapters, frameworks, apps)
- Configure TypeScript for Effect (strict mode, lib settings)
- Create effect-utils.ts with Result ↔ Effect conversion utilities
- Create base error classes using Data.TaggedError pattern
- Update domain package exports to expose Effect patterns

**Success Criteria:**

- [ ] Effect package installed in all 9 package.json files
- [ ] `packages/domain/src/effect-utils.ts` created with utility functions
- [ ] 3+ base error classes migrated to Data.TaggedError
- [ ] Zero TypeScript errors after installation
- [ ] Conversion utilities support backward compatibility

**Subtasks:**

1. Add effect ^3.x.x to root package.json dependencies
2. Install effect in each workspace package
3. Create effect-utils.ts with Result→Effect and Effect→Result bridges
4. Create base error classes (ValidationError, NotFoundError, DomainError)
5. Update domain package exports in index.ts
6. Write unit tests for utility functions
7. Verify all packages compile without errors

**Dependencies:** None (foundation phase)

**Blockers:** None

**Risk Mitigations:**
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Package version conflicts | Medium | High | Pin specific Effect version; test all packages after each install |
| TypeScript configuration issues | Low | Medium | Use Effect's recommended tsconfig settings |

**Verification:**

- **Level:** MEDIUM (Single Judge)
- **Threshold:** 3.5/5.0
- **Rubric:** Utility Creation
  - Effect utilities provide correct Result↔Effect bridges (30%)
  - TypeScript configuration compatible with Effect requirements (25%)
  - Base error classes properly use Data.TaggedError pattern (25%)
  - Package exports correctly expose Effect patterns (20%)
- **Evaluation Method:** Per-item checklist verification
- **Checklist:**
  - [ ] effect-utils.ts provides Result→Effect conversion
  - [ ] effect-utils.ts provides Effect→Result conversion for backward compatibility
  - [ ] At least 3 base error classes use Data.TaggedError
  - [ ] Zero TypeScript compilation errors across all packages
  - [ ] Package exports properly expose Effect utilities

---

### Phase 2: Domain Layer Migration

#### Step 2.1: Core Entity Batch (User, Group, Trip)

**Agent:** `sdd:developer` (opus) - Critical foundation, most referenced entities  
**Parallel with:** None (first domain step)  
**Duration:** 3-4 days

**Goal:** Migrate primary entities to Effect<A,E,never>.

**Implementation Details:**

- Update User entity static factory to return Effect<User, ValidationError, never>
- Update Group entity create method with Effect pattern
- Update Trip entity create method with Effect pattern
- Replace ok(value)/err(error) with Effect.succeed/Effect.fail
- Update entity test files for new return types

**Success Criteria:**

- [ ] User.create returns Effect
- [ ] Group.create returns Effect
- [ ] Trip.create returns Effect
- [ ] All tests for these 3 entities pass

**Subtasks:**

1. Migrate User entity and User.test.ts
2. Migrate Group entity and Group.test.ts
3. Migrate Trip entity and Trip.test.ts
4. Verify backward compatibility bridges work

**Dependencies:** Step 1.1 complete

**Blockers:** Entity tests must pass before migration starts

**Risk Mitigations:**
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Complex validation logic conversion | Medium | High | Pair review; maintain test coverage |
| Breaking entity interface changes | High | High | Use effect-utils.ts bridges during transition |

**Verification:**

- **Level:** HIGH (Panel of 2 Judges)
- **Threshold:** 4.0/5.0
- **Rubric:** Code Migration
  - Pattern correctness: Result<T,E> → Effect<User|Group|Trip, ValidationError, never> (30%)
  - Type safety: No `any` types, proper never dependencies (25%)
  - Error handling: Data.TaggedError usage, Effect.succeed/fail correct (25%)
  - Business logic preservation: Same validation rules, no behavioral changes (20%)
- **Evaluation Method:** Panel evaluation with code review
- **Checklist:**
  - [ ] User.create returns Effect<User, ValidationError, never>
  - [ ] Group.create returns Effect<Group, ValidationError, never>
  - [ ] Trip.create returns Effect<Trip, ValidationError, never>
  - [ ] All 3 entity test files pass with new Effect patterns
  - [ ] No ok()/err() usage remains in these entities

---

#### Step 2.2: Challenge Entity Batch (Challenge, Submission, Vote)

**Agent:** `sdd:developer` (opus) - Critical entities, complex validation  
**Parallel with:** Step 3.1 (Port Tags for Core entities - START 3.1 here)  
**Duration:** 2-3 days

**Goal:** Migrate challenge-related entities.

**Success Criteria:**

- [ ] Challenge.create returns Effect
- [ ] Submission.create returns Effect
- [ ] Vote.create returns Effect
- [ ] All related tests pass

**Subtasks:**

1. Migrate Challenge entity and tests
2. Migrate Submission entity and tests
3. Migrate Vote entity and tests

**Dependencies:** Step 2.1 complete

**Verification:**

- **Level:** HIGH (Panel of 2 Judges)
- **Threshold:** 4.0/5.0
- **Rubric:** Code Migration
  - Pattern correctness: Effect<A,E,never> with proper error types (30%)
  - Type safety: No `any` types, proper generics (25%)
  - Error handling: Validation errors use Data.TaggedError (25%)
  - Business logic preservation: Challenge-specific validations intact (20%)
- **Evaluation Method:** Panel evaluation with code review
- **Checklist:**
  - [ ] Challenge.create returns Effect<Challenge, ValidationError, never>
  - [ ] Submission.create returns Effect<Submission, ValidationError, never>
  - [ ] Vote.create returns Effect<Vote, ValidationError, never>
  - [ ] All related tests pass
  - [ ] Complex challenge validation logic correctly converted

---

#### Step 2.3: Supporting Entity Batch

**Agent:** `sdd:developer` (sonnet) - Standard entity migration  
**Parallel with:** Step 3.1 (continues), Step 3.2 (CRUD for Core starts after 3.1 core)  
**Duration:** 4-5 days

**Goal:** Migrate remaining 12 entities.

**Success Criteria:**

- [ ] All 18 entities migrated
- [ ] All 19 value objects migrated
- [ ] Zero Result type usage in domain layer

**Subtasks:**

1. Batch migration: Location, Notification, Reward entities
2. Batch migration: Coin, Transaction, Achievement entities
3. Batch migration: Admin-related entities
4. Final cleanup of result.ts

**Dependencies:** Step 2.2 complete

**Verification:**

- **Level:** MEDIUM (Single Judge)
- **Threshold:** 3.5/5.0
- **Rubric:** Code Migration
  - Pattern correctness: All 12 entities return Effect<A,E,never> (30%)
  - Type safety: Consistent error typing across entities (25%)
  - Completeness: All 19 value objects migrated (25%)
  - Zero Result type usage in domain layer (20%)
- **Evaluation Method:** Automated check + sample review
- **Checklist:**
  - [ ] All 12 supporting entities migrated
  - [ ] All 19 value objects migrated
  - [ ] Zero imports of Result type from @mirai-app/domain
  - [ ] All entity tests pass
  - [ ] result.ts utilities no longer used in domain

---

### Phase 3: Use Cases Layer Migration

#### Step 3.1: Port Interface Definitions

**Agent:** `sdd:software-architect` (sonnet) - Interface definitions, contracts  
**Parallel with:** Step 2.2, Step 2.3, Step 4.1 (early prep), Step 7.3 (documentation)  
**Duration:** 2-3 days (spreads across domain migration)

**Goal:** Define Context.Tags for all repository and service ports.

**Implementation Details:**

- Create Context.Tag for each of 17 repository port interfaces
- Create Context.Tag for service interfaces
- Define types for Effect<A,E,R> requirements
- Update port interface files to export Tags

**Success Criteria:**

- [ ] All 17 repository ports have Context.Tag
- [ ] All service ports have Context.Tag
- [ ] Tags properly typed with R parameter
- [ ] Zero circular dependencies introduced

**Subtasks:**

1. Define Tags for User, Group, Trip repositories
2. Define Tags for Challenge, Submission repositories
3. Define Tags for Notification, Reward repositories
4. Define Tags for remaining repositories
5. Define Tags for services
6. Verify all Tags compile correctly

**Dependencies:** Step 2.1 (can START), Step 2.3 (for complete coverage)

**Blockers:** Repository interface definitions needed

**Risk Mitigations:**
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Type inference complexity | Medium | High | Thorough testing; provide explicit type annotations |
| Circular dependency creation | Low | Medium | Use dependency-cruiser to validate |

**Verification:**

- **Level:** HIGH (Panel of 2 Judges)
- **Threshold:** 4.0/5.0
- **Rubric:** Port Interfaces
  - Contract completeness: All 17 repository ports have Context.Tag (35%)
  - Effect type usage: Proper Effect<A,E,R> typing with R parameter (30%)
  - Backward compatibility: Existing port interfaces preserved (20%)
  - No circular dependencies: dependency-cruiser validation (15%)
- **Evaluation Method:** Panel evaluation with interface review
- **Checklist:**
  - [ ] All 17 repository ports export Context.Tag
  - [ ] All service ports export Context.Tag
  - [ ] Tags properly typed with R parameter
  - [ ] dependency-cruiser shows no circular dependencies
  - [ ] Zero compilation errors in use-cases package

---

#### Step 3.2: CRUD Use Cases

**Agent:** `sdd:developer` (sonnet) - Standard CRUD patterns  
**Parallel with:** Step 2.3 (late stage), Step 4.1 (early utilities)  
**Duration:** 4-5 days

**Goal:** Migrate basic CRUD interactors to Effect.

**Implementation Details:**

- Convert CRUD interactors to use Effect.gen
- Replace Promise<Result<T,E>> with Effect<A,E,R>
- Inject dependencies via yield\* Context.Tag patterns
- Update tests for Effect patterns

**Success Criteria:**

- [ ] CreateX use cases return Effect
- [ ] GetX use cases return Effect
- [ ] UpdateX use cases return Effect
- [ ] DeleteX use cases return Effect
- [ ] All CRUD tests pass

**Subtasks:**

1. Migrate User CRUD use cases
2. Migrate Group CRUD use cases
3. Migrate Trip CRUD use cases
4. Migrate Challenge CRUD use cases
5. Update all CRUD use case tests

**Dependencies:** Step 3.1 (Tags defined)

**Verification:**

- **Level:** MEDIUM (Single Judge)
- **Threshold:** 3.5/5.0
- **Rubric:** Code Migration + Test Conversion
  - Pattern correctness: Promise<Result<T,E>> → Effect<A,E,R> (25%)
  - Type safety: Context.Tag properly yielded via Effect.gen (25%)
  - Test coverage: Same scenarios covered with Effect patterns (25%)
  - Effect test patterns: Effect.runPromise usage correct (25%)
- **Evaluation Method:** Sample code review + test execution
- **Checklist:**
  - [ ] CreateX use cases return Effect with proper R type
  - [ ] GetX use cases return Effect with proper R type
  - [ ] UpdateX use cases return Effect with proper R type
  - [ ] DeleteX use cases return Effect with proper R type
  - [ ] All CRUD tests pass with Effect patterns

---

#### Step 3.3: Complex Use Cases - Authentication

**Agent:** `sdd:software-architect` (opus) - Most complex use case, critical auth logic  
**Parallel with:** None (focus required)  
**Duration:** 3-4 days

**Goal:** Migrate authentication use case (most complex).

**Success Criteria:**

- [ ] Authentication use case returns Effect
- [ ] All auth flows work correctly
- [ ] Auth-related tests pass

**Subtasks:**

1. Analyze current auth flow complexity
2. Design Effect composition for auth
3. Implement auth use case with Effect
4. Write comprehensive tests

**Dependencies:** Step 3.2 complete

**Risk Mitigations:**
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Complex flow conversion | High | High | Pair programming; thorough review |
| Async state management | Medium | High | Use Effect's structured concurrency |

**Verification:**

- **Level:** HIGH (Panel of 2 Judges)
- **Threshold:** 4.0/5.0
- **Rubric:** Code Migration (Complex)
  - Pattern correctness: Complex auth flows use Effect composition (30%)
  - Type safety: All auth dependencies properly typed in R (25%)
  - Error handling: Auth-specific errors use Data.TaggedError (25%)
  - Business logic preservation: All auth flows work identically (20%)
- **Evaluation Method:** Panel evaluation with full auth flow review
- **Checklist:**
  - [ ] Authentication use case returns Effect with proper error types
  - [ ] All auth flows (login, logout, refresh) work correctly
  - [ ] Effect.gen used for complex async composition
  - [ ] Auth-related tests pass with comprehensive coverage
  - [ ] Structured concurrency used for parallel auth operations

---

#### Step 3.4: Feature Use Cases - Challenges

**Agent:** `sdd:developer` (sonnet) - Feature implementation  
**Parallel with:** Step 5.3 prep (auth integration planning)  
**Duration:** 3-4 days

**Goal:** Migrate challenge operations.

**Success Criteria:**

- [ ] Voting use cases return Effect
- [ ] Submission use cases return Effect
- [ ] All challenge tests pass

**Subtasks:**

1. Migrate voting-related use cases
2. Migrate submission-related use cases
3. Update challenge service tests

**Dependencies:** Step 3.3 complete

**Verification:**

- **Level:** MEDIUM (Single Judge)
- **Threshold:** 3.5/5.0
- **Rubric:** Code Migration
  - Pattern correctness: Effect<A,E,R> with proper dependencies (30%)
  - Type safety: Challenge-specific types preserved (25%)
  - Test coverage: Voting and submission scenarios covered (25%)
  - Error handling: Challenge errors properly typed (20%)
- **Evaluation Method:** Sample code review + test execution
- **Checklist:**
  - [ ] Voting use cases return Effect
  - [ ] Submission use cases return Effect
  - [ ] All challenge-related tests pass
  - [ ] Challenge operations work with Effect patterns

---

#### Step 3.5: Feature Use Cases - Rewards & Coins

**Agent:** `sdd:developer` (sonnet) - Feature implementation  
**Parallel with:** None  
**Duration:** 3-4 days

**Goal:** Migrate reward and coin operations.

**Success Criteria:**

- [ ] Reward purchase use cases return Effect
- [ ] Coin transaction use cases return Effect
- [ ] All reward/coin tests pass

**Subtasks:**

1. Migrate reward purchase use cases
2. Migrate coin transaction use cases
3. Update inventory-related tests

**Dependencies:** Step 3.4 complete

**Verification:**

- **Level:** MEDIUM (Single Judge)
- **Threshold:** 3.5/5.0
- **Rubric:** Code Migration
  - Pattern correctness: Effect<A,E,R> for reward/coin operations (30%)
  - Type safety: Transaction-related types preserved (25%)
  - Test coverage: Purchase and transaction scenarios covered (25%)
  - Error handling: Transaction errors properly typed (20%)
- **Evaluation Method:** Sample code review + test execution
- **Checklist:**
  - [ ] Reward purchase use cases return Effect
  - [ ] Coin transaction use cases return Effect
  - [ ] All reward/coin tests pass
  - [ ] Inventory operations work correctly

---

#### Step 3.6: Feature Use Cases - Notifications & Admin

**Agent:** `sdd:developer` (sonnet) - Feature implementation  
**Parallel with:** Step 4.1 (completion), Step 5.1 (prep)  
**Duration:** 3-4 days

**Goal:** Migrate remaining feature use cases.

**Success Criteria:**

- [ ] Notification use cases return Effect
- [ ] Admin use cases return Effect
- [ ] All remaining tests pass

**Subtasks:**

1. Migrate notification use cases
2. Migrate admin use cases
3. Final use case cleanup

**Dependencies:** Step 3.5 complete

**Verification:**

- **Level:** MEDIUM (Single Judge)
- **Threshold:** 3.5/5.0
- **Rubric:** Code Migration
  - Pattern correctness: All remaining use cases return Effect (30%)
  - Type safety: Admin/notification types preserved (25%)
  - Test coverage: All scenarios covered (25%)
  - Completeness: Zero Promise<Result<T,E>> remaining (20%)
- **Evaluation Method:** Automated check + sample review
- **Checklist:**
  - [ ] Notification use cases return Effect
  - [ ] Admin use cases return Effect
  - [ ] All remaining tests pass
  - [ ] No Promise<Result<T,E>> usage in use-cases layer

---

### Phase 4: Adapters Layer Migration

#### Step 4.1: Effect Execution Utilities

**Agent:** `sdd:developer` (sonnet) - Utility creation  
**Parallel with:** Step 3.2, Step 3.3, Step 3.4, Step 3.5, Step 3.6 (runs throughout use cases)  
**Duration:** 2-3 days (spreads across use cases)

**Goal:** Create utilities for executing Effects at boundaries.

**Implementation Details:**

- Create effect-executor.ts with helper functions
- Implement Effect.runPromise wrappers for controllers
- Create error mapping utilities for HTTP/GraphQL
- Update controller-helpers.ts with Effect patterns

**Success Criteria:**

- [ ] effect-executor.ts provides boundary execution helpers
- [ ] Error mapping preserves existing HTTP status codes
- [ ] Error mapping preserves GraphQL error formats

**Subtasks:**

1. Create effect-executor.ts module
2. Implement runPromise wrappers
3. Create error-to-HTTP mapper
4. Create error-to-GraphQL mapper
5. Update controller-helpers.ts
6. Write unit tests for utilities

**Dependencies:** Step 3.1 (Tags defined), Step 3.2 (basic use cases for testing)

**Blockers:** Need to understand current error mapping patterns

**Verification:**

- **Level:** MEDIUM (Single Judge)
- **Threshold:** 3.5/5.0
- **Rubric:** Utility Creation
  - Boundary execution: Effect.runPromise wrappers work correctly (30%)
  - Error mapping: HTTP status codes preserved (25%)
  - Error mapping: GraphQL error formats preserved (25%)
  - Controller integration: effect-executor.ts integrates cleanly (20%)
- **Evaluation Method:** Code review + integration test
- **Checklist:**
  - [ ] effect-executor.ts provides boundary execution helpers
  - [ ] Error mapping preserves existing HTTP status codes
  - [ ] Error mapping preserves GraphQL error formats
  - [ ] Unit tests for utility functions pass
  - [ ] controller-helpers.ts updated with Effect patterns

---

#### Step 4.2: Controller Migration

**Agent:** `sdd:developer` (sonnet) - Controller updates  
**Parallel with:** None (focused migration)  
**Duration:** 4-5 days

**Goal:** Update 30 controllers to execute Effects.

**Success Criteria:**

- [ ] All controllers properly run Effects
- [ ] Error handling maintains existing contracts
- [ ] All controller tests pass

**Subtasks:**

1. Migrate User controllers
2. Migrate Group controllers
3. Migrate Trip controllers
4. Migrate Challenge controllers
5. Migrate remaining controllers
6. Update controller tests

**Dependencies:** Step 4.1 complete, Step 3.6 (complete use cases)

**Verification:**

- **Level:** HIGH (Panel of 2 Judges)
- **Threshold:** 4.0/5.0
- **Rubric:** System Boundary/Integration
  - Runtime correctness: All 30 controllers properly execute Effects (30%)
  - Error mapping: Errors correctly map to HTTP/GraphQL responses (25%)
  - Type safety: Controller types preserved, no `any` (25%)
  - Integration tests: All controller tests pass (20%)
- **Evaluation Method:** Panel evaluation with boundary testing
- **Checklist:**
  - [ ] All 30 controllers properly run Effects at boundaries
  - [ ] Error handling maintains existing HTTP contracts
  - [ ] Error handling maintains existing GraphQL contracts
  - [ ] All controller tests pass
  - [ ] No Promise<Result<T,E>> handling in controllers

---

#### Step 4.3: Gateway Migration - Drizzle

**Agent:** `sdd:developer` (opus) - Database critical, complex gateway patterns  
**Parallel with:** Step 4.4 (late stage overlap)  
**Duration:** 4-5 days

**Goal:** Update 17 Drizzle gateways with Effect.tryPromise.

**Implementation Details:**

- Wrap Drizzle queries with Effect.tryPromise
- Convert gateway methods to return Effect
- Handle database errors with Data.TaggedError
- Maintain mapper integration

**Success Criteria:**

- [ ] All Drizzle gateways use Effect.tryPromise
- [ ] Database errors properly wrapped
- [ ] All gateway tests pass

**Subtasks:**

1. Batch 1: User, Group, Trip gateways
2. Batch 2: Challenge, Submission gateways
3. Batch 3: Notification, Reward gateways
4. Batch 4: Remaining gateways
5. Update Drizzle gateway tests

**Dependencies:** Step 4.2 complete

**Risk Mitigations:**
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Database error handling gaps | Medium | High | Test all error scenarios |
| tryPromise catch mapping | Low | Medium | Document all error patterns |

**Verification:**

- **Level:** HIGH (Panel of 2 Judges)
- **Threshold:** 4.0/5.0
- **Rubric:** Code Migration + External Integration
  - Pattern correctness: Effect.tryPromise used for all Drizzle calls (30%)
  - Error handling: Database errors wrapped with Data.TaggedError (25%)
  - Type safety: Gateway return types correct (25%)
  - Test coverage: All gateway tests pass (20%)
- **Evaluation Method:** Panel evaluation with database testing
- **Checklist:**
  - [ ] All 17 Drizzle gateways use Effect.tryPromise
  - [ ] Database errors properly wrapped with Data.TaggedError
  - [ ] Mapper integration maintained
  - [ ] All Drizzle gateway tests pass
  - [ ] No direct Promise handling in gateways

---

#### Step 4.4: Gateway Migration - In-Memory

**Agent:** `sdd:developer` (sonnet) - Follows Drizzle patterns  
**Parallel with:** Step 4.3 (late stage overlap for independent gateways)  
**Duration:** 3-4 days

**Goal:** Update 17 in-memory gateways.

**Success Criteria:**

- [ ] All in-memory gateways return Effect
- [ ] Parity with Drizzle gateways maintained
- [ ] All tests pass

**Subtasks:**

1. Update in-memory User gateway
2. Update in-memory Group gateway
3. Update remaining in-memory gateways
4. Update in-memory gateway tests

**Dependencies:** Step 4.3 complete (follows pattern)

**Verification:**

- **Level:** MEDIUM (Single Judge)
- **Threshold:** 3.5/5.0
- **Rubric:** Code Migration
  - Pattern correctness: All 17 in-memory gateways return Effect (30%)
  - Parity: Behavior matches Drizzle gateways (30%)
  - Type safety: Consistent with Drizzle gateway types (20%)
  - Test coverage: All tests pass (20%)
- **Evaluation Method:** Sample review + test execution
- **Checklist:**
  - [ ] All 17 in-memory gateways return Effect
  - [ ] Parity with Drizzle gateways maintained
  - [ ] All in-memory gateway tests pass
  - [ ] No Promise<Result<T,E>> in in-memory gateways

---

#### Step 4.5: Service Migration

**Agent:** `sdd:developer` (sonnet) - Service updates  
**Parallel with:** Step 5.1 (prep)  
**Duration:** 2-3 days

**Goal:** Update 12 services to return Effects.

**Success Criteria:**

- [ ] All services return Effect
- [ ] Service tests pass

**Subtasks:**

1. Migrate notification services
2. Migrate image services
3. Migrate remaining services
4. Update service tests

**Dependencies:** Step 4.4 complete

**Verification:**

- **Level:** MEDIUM (Single Judge)
- **Threshold:** 3.5/5.0
- **Rubric:** Code Migration
  - Pattern correctness: All 12 services return Effect (35%)
  - Type safety: Service interfaces preserved (25%)
  - External integration: Third-party calls use Effect.tryPromise (20%)
  - Test coverage: All service tests pass (20%)
- **Evaluation Method:** Sample review + test execution
- **Checklist:**
  - [ ] All 12 services return Effect
  - [ ] Service tests pass
  - [ ] External service calls use Effect.tryPromise
  - [ ] No Promise<Result<T,E>> in services

---

### Phase 5: Framework Layer Integration

#### Step 5.1: DI Container Integration

**Agent:** `sdd:software-architect` (opus) - Complex integration, critical architecture  
**Parallel with:** None (critical integration)  
**Duration:** 3-4 days

**Goal:** Integrate Effect with awilix-modular DI.

**Implementation Details:**

- Update DI container to provide Effect Layers
- Create Layer composition utilities
- Map awilix cradle to Effect Context
- Maintain backward compatibility

**Success Criteria:**

- [ ] DI container provides Effect Layers
- [ ] Layer composition works correctly
- [ ] All DI tests pass

**Subtasks:**

1. Analyze current awilix-modular setup
2. Design Layer composition strategy
3. Implement DI + Effect integration
4. Create Layer composition utilities
5. Update DI tests

**Dependencies:** Step 3.6 complete, Step 4.5 complete

**Blockers:** Complex integration decisions needed

**Risk Mitigations:**
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| DI integration complexity | High | High | Prototype first; incremental rollout; thorough testing |
| awilix + Effect impedance mismatch | Medium | High | Document integration patterns |

**Verification:**

- **Level:** HIGH (Panel of 2 Judges)
- **Threshold:** 4.0/5.0
- **Rubric:** Complex Integration
  - Layer composition: DI container provides proper Effect Layers (30%)
  - Runtime correctness: Layer composition works correctly (30%)
  - Backward compatibility: awilix cradle maps to Effect Context (20%)
  - Integration tests: All DI tests pass (20%)
- **Evaluation Method:** Panel evaluation with integration testing
- **Checklist:**
  - [ ] DI container provides Effect Layers
  - [ ] Layer composition works correctly
  - [ ] awilix cradle properly maps to Effect Context
  - [ ] All DI tests pass
  - [ ] Hybrid approach (awilix + Effect) documented

---

#### Step 5.2: Runtime Configuration

**Agent:** `sdd:developer` (sonnet) - Runtime setup  
**Parallel with:** Step 5.3 prep (design phase)  
**Duration:** 2-3 days

**Goal:** Create Effect Runtime setup.

**Success Criteria:**

- [ ] Runtime configuration modules created
- [ ] Runtime can be composed from Layers
- [ ] Framework tests pass

**Subtasks:**

1. Create runtime configuration modules
2. Implement Layer.toRuntime composition
3. Create runtime utilities
4. Update framework tests

**Dependencies:** Step 5.1 complete

**Verification:**

- **Level:** MEDIUM (Single Judge)
- **Threshold:** 3.5/5.0
- **Rubric:** Code Migration
  - Runtime configuration: Modules properly create Runtimes (30%)
  - Layer composition: Layer.toRuntime composition works (30%)
  - Type safety: Runtime types correctly inferred (20%)
  - Test coverage: All framework tests pass (20%)
- **Evaluation Method:** Code review + test execution
- **Checklist:**
  - [ ] Runtime configuration modules created
  - [ ] Runtime can be composed from Layers
  - [ ] Layer.toRuntime composition functional
  - [ ] All framework tests pass

---

#### Step 5.3: Auth System Integration

**Agent:** `sdd:developer` (sonnet) - Auth integration  
**Parallel with:** None  
**Duration:** 2-3 days

**Goal:** Update auth system to use Effect.

**Success Criteria:**

- [ ] Auth system integrated with Effect
- [ ] Auth flows work correctly
- [ ] Auth tests pass

**Subtasks:**

1. Update auth middleware/controllers
2. Integrate with Effect runtime
3. Update auth tests

**Dependencies:** Step 5.2 complete, Step 3.3 (auth use case) - REQUIRES BOTH

**Verification:**

- **Level:** MEDIUM (Single Judge)
- **Threshold:** 3.5/5.0
- **Rubric:** Integration
  - Integration correctness: Auth system uses Effect runtime (30%)
  - Flow preservation: All auth flows work correctly (30%)
  - Error handling: Auth errors properly mapped (20%)
  - Test coverage: All auth tests pass (20%)
- **Evaluation Method:** Integration test + flow verification
- **Checklist:**
  - [ ] Auth system integrated with Effect runtime
  - [ ] All auth flows work correctly
  - [ ] Auth middleware handles Effects properly
  - [ ] All auth tests pass

---

### Phase 6: Application Layer Integration

#### Step 6.1: Backend Server Integration

**Agent:** `sdd:software-architect` (opus) - Critical system boundary, server lifecycle  
**Parallel with:** None  
**Duration:** 3-4 days

**Goal:** Wire Effect at backend-server entry point.

**Implementation Details:**

- Update server.ts to run Effects at entry point
- Integrate with Hono server lifecycle
- Set up Effect runtime for server startup
- Handle graceful shutdown with Effect

**Success Criteria:**

- [ ] Server starts with Effect runtime
- [ ] Server shutdown uses Effect
- [ ] All server tests pass

**Subtasks:**

1. Update server.ts entry point
2. Integrate with Hono
3. Implement graceful shutdown
4. Update server tests

**Dependencies:** Step 5.3 complete

**Blockers:** Server lifecycle integration decisions

**Risk Mitigations:**
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Startup failures | Medium | Critical | Smoke tests; rollback plan; gradual rollout |
| Hono integration issues | Medium | High | Test thoroughly; have middleware fallback |

**Verification:**

- **Level:** HIGH (Panel of 2 Judges)
- **Threshold:** 4.0/5.0
- **Rubric:** System Boundary
  - Runtime correctness: Server starts with Effect runtime (30%)
  - Lifecycle: Graceful shutdown uses Effect (25%)
  - Integration: Hono server lifecycle integrated (25%)
  - Test coverage: All server tests pass (20%)
- **Evaluation Method:** Panel evaluation with smoke testing
- **Checklist:**
  - [ ] Server starts with Effect runtime
  - [ ] Server shutdown uses Effect patterns
  - [ ] Hono integration works correctly
  - [ ] All server tests pass
  - [ ] Smoke tests verify startup/shutdown

---

#### Step 6.2: GraphQL Integration

**Agent:** `sdd:software-architect` (opus) - Critical GraphQL/Yoga integration  
**Parallel with:** Step 6.3 prep  
**Duration:** 4-5 days

**Goal:** Update GraphQL context and resolvers.

**Implementation Details:**

- Update GraphQL context with Effect runtime
- Migrate 19 resolvers to run Effects
- Update 24 type files for Effect types
- Ensure Yoga server integration works

**Success Criteria:**

- [ ] GraphQL context provides Effect runtime
- [ ] All 19 resolvers handle Effects correctly
- [ ] All 24 type files updated
- [ ] GraphQL tests pass

**Subtasks:**

1. Update GraphQL context
2. Batch 1: Migrate User, Group resolvers
3. Batch 2: Migrate Challenge, Submission resolvers
4. Batch 3: Migrate remaining resolvers
5. Update type files
6. Update GraphQL tests

**Dependencies:** Step 6.1 complete

**Blockers:** GraphQL Yoga integration with Effect

**Risk Mitigations:**
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| GraphQL Yoga compatibility | Medium | High | Test integration thoroughly |
| Resolver error mapping | Medium | Medium | Verify error format preserved |

**Verification:**

- **Level:** HIGH (Panel of 2 Judges)
- **Threshold:** 4.0/5.0
- **Rubric:** System Boundary
  - Runtime correctness: GraphQL context provides Effect runtime (25%)
  - Resolver migration: All 19 resolvers handle Effects (25%)
  - Type updates: All 24 type files updated (20%)
  - Error mapping: GraphQL error formats preserved (15%)
  - Integration tests: GraphQL tests pass (15%)
- **Evaluation Method:** Panel evaluation with GraphQL testing
- **Checklist:**
  - [ ] GraphQL context provides Effect runtime
  - [ ] All 19 resolvers properly handle Effects
  - [ ] All 24 type files updated for Effect types
  - [ ] Yoga server integration works
  - [ ] All GraphQL tests pass
  - [ ] Error formats preserved

---

#### Step 6.3: Other Apps Integration

**Agent:** `sdd:developer` (sonnet) - App integration  
**Parallel with:** Step 7.x cleanup prep  
**Duration:** 2-3 days

**Goal:** Update notification-sender and seed apps.

**Success Criteria:**

- [ ] notification-sender runs Effects at boundary
- [ ] seed app runs Effects at boundary
- [ ] Both app tests pass

**Subtasks:**

1. Update notification-sender entry point
2. Update seed application
3. Update app tests

**Dependencies:** Step 6.2 complete

**Verification:**

- **Level:** MEDIUM (Single Judge)
- **Threshold:** 3.5/5.0
- **Rubric:** System Boundary
  - Runtime correctness: Apps run Effects at boundaries (35%)
  - Integration: notification-sender properly wired (25%)
  - Integration: seed app properly wired (25%)
  - Test coverage: Both app tests pass (15%)
- **Evaluation Method:** Integration test + app startup verification
- **Checklist:**
  - [ ] notification-sender runs Effects at boundary
  - [ ] seed app runs Effects at boundary
  - [ ] Both app tests pass
  - [ ] Apps start and run correctly

---

### Phase 7: Cleanup & Verification

#### Step 7.1: Library Removal

**Agent:** `refactor` (haiku) - Cleanup, low complexity  
**Parallel with:** Step 7.2, Step 7.3 (all cleanup parallel)  
**Duration:** 2-3 days

**Goal:** Remove redundant libraries.

**Implementation Details:**

- Remove neverthrow from all package.json files
- Remove fp-ts if present
- Remove custom Result type and utilities
- Update all imports

**Success Criteria:**

- [ ] No redundant libraries in any package.json
- [ ] Result.ts removed
- [ ] result.ts removed

**Subtasks:**

1. Audit all package.json files
2. Remove neverthrow/fp-ts dependencies
3. Delete Result.ts and result.ts files
4. Clean up any remaining references

**Dependencies:** Step 6.3 complete

**Verification:**

- **Level:** LOW (None - Binary Verification)
- **Threshold:** N/A (Pass/Fail)
- **Rubric:** Library Removal
  - No remaining imports: Zero imports of removed libraries (40%)
  - Functionality preserved: All features work with replacement (35%)
  - Dependencies cleaned: All package.json files updated (25%)
- **Evaluation Method:** Automated verification
- **Checklist:**
  - [ ] No neverthrow in any package.json
  - [ ] No fp-ts in any package.json
  - [ ] Result.ts deleted
  - [ ] result.ts deleted
  - [ ] Zero imports of custom Result type
  - [ ] All tests still pass after removal

---

#### Step 7.2: tRPC Cleanup

**Agent:** `refactor` (haiku) - Cleanup, low complexity  
**Parallel with:** Step 7.1, Step 7.3  
**Duration:** 1-2 days

**Goal:** Verify and remove any tRPC files.

**Success Criteria:**

- [ ] Zero tRPC files in codebase
- [ ] Zero @trpc/ imports

**Subtasks:**

1. Search for tRPC-related files
2. Remove any found files
3. Verify no imports remain

**Dependencies:** Step 6.3 complete

**Verification:**

- **Level:** LOW (None - Binary Verification)
- **Threshold:** N/A (Pass/Fail)
- **Rubric:** Library Removal
  - No remaining files: Zero tRPC files in codebase (50%)
  - No remaining imports: Zero @trpc/ imports (50%)
- **Evaluation Method:** Automated verification
- **Checklist:**
  - [ ] Zero files containing "trpc" in name
  - [ ] Zero @trpc/ imports in codebase
  - [ ] grep/search confirms no tRPC references

---

#### Step 7.3: Documentation Update

**Agent:** `sdd:researcher` (sonnet) - Documentation, runs throughout  
**Parallel with:** ALL earlier phases (incremental), Step 7.1, Step 7.2  
**Duration:** 2-3 days (spread across all phases)

**Goal:** Update CLAUDE.md with Effect patterns.

**Implementation Details:**

- Document patterns as established (starts after 1.1)
- Refine throughout all phases
- Final polish after 6.3

**Success Criteria:**

- [ ] CLAUDE.md contains Effect patterns
- [ ] Migration guidance documented
- [ ] Examples provided

**Subtasks:**

1. Document Effect patterns in CLAUDE.md
2. Add migration examples
3. Update code style guidelines

**Dependencies:** Step 6.3 complete (for final version), but starts after 1.1

**Verification:**

- **Level:** MEDIUM (Single Judge)
- **Threshold:** 3.5/5.0
- **Rubric:** Documentation
  - Accuracy: Documentation matches actual implementation patterns (35%)
  - Completeness: All patterns documented with examples (30%)
  - Clarity: Clear, understandable guidance (20%)
  - Migration path: Step-by-step migration guidance provided (15%)
- **Evaluation Method:** Documentation review
- **Checklist:**
  - [ ] CLAUDE.md contains Effect patterns section
  - [ ] Migration examples provided (Result→Effect, async→Effect.gen)
  - [ ] Code style guidelines updated
  - [ ] Examples are accurate and runnable
  - [ ] Documentation reviewed for clarity

---

### Implementation Summary

| Step | Phase      | Goal                              | Duration | Critical Path | Agent  | Parallel With                      | Dependencies |
| ---- | ---------- | --------------------------------- | -------- | ------------- | ------ | ---------------------------------- | ------------ |
| 1.1  | Foundation | Effect install + utilities        | 2-3 days | Yes           | sonnet | None                               | None         |
| 2.1  | Domain     | Core entities (User, Group, Trip) | 3-4 days | Yes           | opus   | None                               | 1.1          |
| 2.2  | Domain     | Challenge entities                | 2-3 days | Yes           | opus   | 3.1 (starts)                       | 2.1          |
| 2.3  | Domain     | Supporting entities               | 4-5 days | Yes           | sonnet | 3.1 (continues), 3.2 (starts)      | 2.2          |
| 3.1  | Use Cases  | Port interface Tags               | 2-3 days | Yes           | sonnet | 2.2, 2.3, 4.1 (early), 7.3         | 2.1          |
| 3.2  | Use Cases  | CRUD use cases                    | 4-5 days | Yes           | sonnet | 2.3 (late), 4.1                    | 3.1          |
| 3.3  | Use Cases  | Authentication use case           | 3-4 days | Yes           | opus   | None                               | 3.2          |
| 3.4  | Use Cases  | Challenge use cases               | 3-4 days | Yes           | sonnet | 5.3 prep                           | 3.3          |
| 3.5  | Use Cases  | Reward/Coin use cases             | 3-4 days | Yes           | sonnet | None                               | 3.4          |
| 3.6  | Use Cases  | Notification/Admin use cases      | 3-4 days | Yes           | sonnet | 4.1 (completion), 5.1 prep         | 3.5          |
| 4.1  | Adapters   | Effect execution utilities        | 2-3 days | Yes           | sonnet | 3.2, 3.3, 3.4, 3.5, 3.6            | 3.1, 3.2     |
| 4.2  | Adapters   | Controller migration              | 4-5 days | Yes           | sonnet | None                               | 4.1, 3.6     |
| 4.3  | Adapters   | Drizzle gateway migration         | 4-5 days | Yes           | opus   | 4.4 (late)                         | 4.2          |
| 4.4  | Adapters   | In-memory gateway migration       | 3-4 days | Yes           | sonnet | 4.3 (late)                         | 4.3          |
| 4.5  | Adapters   | Service migration                 | 2-3 days | Yes           | sonnet | 5.1 prep                           | 4.4          |
| 5.1  | Framework  | DI integration                    | 3-4 days | Yes           | opus   | None                               | 3.6, 4.5     |
| 5.2  | Framework  | Runtime configuration             | 2-3 days | Yes           | sonnet | 5.3 prep                           | 5.1          |
| 5.3  | Framework  | Auth integration                  | 2-3 days | Yes           | sonnet | None                               | 5.2, 3.3     |
| 6.1  | Apps       | Backend server integration        | 3-4 days | Yes           | opus   | None                               | 5.3          |
| 6.2  | Apps       | GraphQL integration               | 4-5 days | Yes           | opus   | 6.3 prep                           | 6.1          |
| 6.3  | Apps       | Other apps integration            | 2-3 days | Yes           | sonnet | 7.x cleanup prep                   | 6.2          |
| 7.1  | Cleanup    | Library removal                   | 2-3 days | No            | haiku  | 7.2, 7.3                           | 6.3          |
| 7.2  | Cleanup    | tRPC cleanup                      | 1-2 days | No            | haiku  | 7.1, 7.3                           | 6.3          |
| 7.3  | Cleanup    | Documentation update              | 2-3 days | No            | sonnet | ALL phases (incremental), 7.1, 7.2 | 6.3, 1.1     |

**Summary:**

- **Total Implementation Steps:** 22
- **Total Subtasks:** 96
- **Critical Path Steps:** 19
- **Parallel Execution Waves:** 9
- **Max Parallelization Depth:** 4 concurrent steps
- **Estimated Total Duration:** 9-12 weeks (reduced from 12-17 weeks)
- **Time Saved:** ~3-5 weeks through parallelization
- **High Priority Risks:** 3

### Agent Distribution Summary

| Agent Type | Steps Assigned | Critical Steps | Rationale                                                        |
| ---------- | -------------- | -------------- | ---------------------------------------------------------------- |
| **opus**   | 7 (32%)        | 7              | Critical foundation, complex auth, database, DI, server, GraphQL |
| **sonnet** | 13 (59%)       | 10             | Standard implementation complexity                               |
| **haiku**  | 2 (9%)         | 0              | Cleanup tasks, low complexity                                    |

### Critical Path with Parallelization

```
SEQUENTIAL CORE:
[1.1 Foundation] → [2.1 Domain Core]
                     ↓
PARALLEL WAVE 1 (Depth 3-4):
┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│   [2.2]   │  │   [2.3]   │  │   [3.1]*  │  │   [7.3]*  │
│   Domain    │  │   Domain    │  │ Port Tags   │  │ Documentation│
└──────┬──────┘  └─────────────┘  └─────────────┘  └─────────────┘
       │
       ▼
PARALLEL WAVE 2 (Depth 3-4):
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│ [3.1 FINAL] │  │   [3.2]   │  │   [4.1]*  │
└──────┬──────┘  │   CRUD      │  │  Utilities  │
       │         └─────────────┘  └─────────────┘
       ▼
[3.3 Auth] → [3.4 Challenges] → [3.5 Rewards] → [3.6 Admin]
                                              ↓
PARALLEL WAVE 3:
                                        ┌─────────────┐
                                        │ [4.1 FINAL] │
                                        │  [5.1 prep] │
                                        └─────────────┘
                                              ↓
[4.2 Controllers] → [4.3 Drizzle] → [4.4 In-Memory] → [4.5 Services]
                                                            ↓
[5.1 DI Integration] → [5.2 Runtime] → [5.3 Auth]
                                          ↑
                                    NEEDS [3.3]
                                              ↓
[6.1 Backend Server] → [6.2 GraphQL] → [6.3 Other Apps]
                                              ↓
PARALLEL CLEANUP (Depth 3):
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│   [7.1]   │  │   [7.2]   │  │   [7.3]   │
│   Library   │  │    tRPC     │  │   FINAL     │
└─────────────┘  └─────────────┘  └─────────────┘
```

### Risk Assessment

**High Priority Risks:**

| Risk                                    | Phase | Likelihood | Impact | Mitigation Strategy                                        |
| --------------------------------------- | ----- | ---------- | ------ | ---------------------------------------------------------- |
| Dependency Integration Complexity       | 5.1   | High       | High   | Prototype first; incremental rollout; thorough testing     |
| Breaking Changes in Public API          | 2.x   | High       | High   | Staged rollout; use backward compatibility bridges         |
| Type Inference Complexity (R parameter) | 3.x   | Medium     | High   | Thorough testing; explicit type annotations; documentation |
| Parallel Execution Coordination         | All   | Medium     | High   | Strict dependency enforcement; daily sync; agent tagging   |

**Medium Priority Risks:**

| Risk                              | Phase | Likelihood | Impact   | Mitigation Strategy                                       |
| --------------------------------- | ----- | ---------- | -------- | --------------------------------------------------------- |
| Boundary Execution Errors         | 4.x   | Medium     | High     | Comprehensive integration tests; error mapping validation |
| Complex Entity Logic Conversion   | 2.x   | Medium     | High     | Pair review; maintain test coverage                       |
| Startup Failures                  | 6.x   | Medium     | Critical | Smoke tests; rollback plan; gradual rollout               |
| GraphQL Yoga Compatibility        | 6.2   | Medium     | High     | Test integration thoroughly                               |
| Early Tag Definition (3.1)        | 2.x   | Medium     | Medium   | Define for known entities; update as domain completes     |
| Effect Utilities Before Use Cases | 3.x   | Medium     | Medium   | Build generics first; refine iteratively                  |

**Low Priority Risks:**

| Risk                    | Phase | Likelihood | Impact | Mitigation Strategy                        |
| ----------------------- | ----- | ---------- | ------ | ------------------------------------------ |
| Performance Degradation | 5.x   | Low        | High   | Benchmark before/after; monitor in staging |
| Documentation Gaps      | 7.3   | Medium     | Low    | Documentation review checklist             |

### Definition of Done

- [ ] All 22 implementation steps completed with assigned agents
- [ ] All 96 subtasks completed
- [ ] All 501 implementation files migrated
- [ ] All 219 test files updated and passing
- [ ] No TypeScript errors (`tsc --noEmit`)
- [ ] No custom Result type usage remains
- [ ] No neverthrow, fp-ts, or redundant libraries
- [ ] No tRPC files or imports
- [ ] Code coverage ≥80%
- [ ] CLAUDE.md updated with Effect patterns and examples
- [ ] Performance within 10% of baseline
- [ ] Bundle size impact ≤40KB gzipped
- [ ] Code reviewed by at least one other developer
- [ ] Parallel execution dependencies validated
- [ ] All parallel wave handoffs documented

---

## Verification Summary

This table summarizes all LLM-as-Judge verification requirements for the 22 implementation steps.

| Step | Phase      | Name                          | Verification Level | Threshold | Rubric Type               | Judges        |
| ---- | ---------- | ----------------------------- | ------------------ | --------- | ------------------------- | ------------- |
| 1.1  | Foundation | Effect Installation           | MEDIUM             | 3.5/5.0   | Utility Creation          | Single        |
| 2.1  | Domain     | Core Entities                 | HIGH               | 4.0/5.0   | Code Migration            | Panel (2)     |
| 2.2  | Domain     | Challenge Entities            | HIGH               | 4.0/5.0   | Code Migration            | Panel (2)     |
| 2.3  | Domain     | Supporting Entities           | MEDIUM             | 3.5/5.0   | Code Migration            | Single        |
| 3.1  | Use Cases  | Port Interface Definitions    | HIGH               | 4.0/5.0   | Port Interfaces           | Panel (2)     |
| 3.2  | Use Cases  | CRUD Use Cases                | MEDIUM             | 3.5/5.0   | Code Migration + Tests    | Single        |
| 3.3  | Use Cases  | Authentication Use Case       | HIGH               | 4.0/5.0   | Code Migration            | Panel (2)     |
| 3.4  | Use Cases  | Challenge Use Cases           | MEDIUM             | 3.5/5.0   | Code Migration            | Single        |
| 3.5  | Use Cases  | Reward/Coin Use Cases         | MEDIUM             | 3.5/5.0   | Code Migration            | Single        |
| 3.6  | Use Cases  | Notification/Admin Use Cases  | MEDIUM             | 3.5/5.0   | Code Migration            | Single        |
| 4.1  | Adapters   | Effect Execution Utilities    | MEDIUM             | 3.5/5.0   | Utility Creation          | Single        |
| 4.2  | Adapters   | Controller Migration          | HIGH               | 4.0/5.0   | System Boundary           | Panel (2)     |
| 4.3  | Adapters   | Gateway Migration - Drizzle   | HIGH               | 4.0/5.0   | Code Migration + External | Panel (2)     |
| 4.4  | Adapters   | Gateway Migration - In-Memory | MEDIUM             | 3.5/5.0   | Code Migration            | Single        |
| 4.5  | Adapters   | Service Migration             | MEDIUM             | 3.5/5.0   | Code Migration            | Single        |
| 5.1  | Framework  | DI Container Integration      | HIGH               | 4.0/5.0   | Complex Integration       | Panel (2)     |
| 5.2  | Framework  | Runtime Configuration         | MEDIUM             | 3.5/5.0   | Code Migration            | Single        |
| 5.3  | Framework  | Auth System Integration       | MEDIUM             | 3.5/5.0   | Integration               | Single        |
| 6.1  | Apps       | Backend Server Integration    | HIGH               | 4.0/5.0   | System Boundary           | Panel (2)     |
| 6.2  | Apps       | GraphQL Integration           | HIGH               | 4.0/5.0   | System Boundary           | Panel (2)     |
| 6.3  | Apps       | Other Apps Integration        | MEDIUM             | 3.5/5.0   | System Boundary           | Single        |
| 7.1  | Cleanup    | Library Removal               | LOW                | N/A       | Library Removal           | None (Binary) |
| 7.2  | Cleanup    | tRPC Cleanup                  | LOW                | N/A       | Library Removal           | None (Binary) |
| 7.3  | Cleanup    | Documentation Update          | MEDIUM             | 3.5/5.0   | Documentation             | Single        |

### Verification Breakdown

| Metric                            | Count |
| --------------------------------- | ----- |
| **Total Steps with Verification** | 22    |
| **Panel Evaluation (2 judges)**   | 9     |
| **Single Judge / Per-Item**       | 11    |
| **None (Binary Pass/Fail)**       | 2     |
| **Critical Path Steps (HIGH)**    | 9     |
| **Standard Steps (MEDIUM)**       | 11    |
| **Cleanup Steps (LOW)**           | 2     |

### Rubric Type Distribution

| Rubric Type         | Steps | Criteria Focus                                                                |
| ------------------- | ----- | ----------------------------------------------------------------------------- |
| Code Migration      | 12    | Pattern correctness, type safety, error handling, business logic preservation |
| Port Interfaces     | 1     | Contract completeness, Effect type usage, backward compatibility              |
| Utility Creation    | 2     | Boundary execution, error mapping, TypeScript configuration                   |
| System Boundary     | 4     | Runtime correctness, error mapping, layer composition, integration tests      |
| Complex Integration | 1     | Layer composition, runtime correctness, backward compatibility                |
| Library Removal     | 2     | No remaining imports, functionality preserved, dependencies cleaned           |
| Documentation       | 1     | Accuracy, completeness, clarity, migration path                               |

### Quality Gates

| Gate                          | Trigger        | Evaluation                                               |
| ----------------------------- | -------------- | -------------------------------------------------------- |
| **Critical Entity Migration** | Steps 2.1, 2.2 | Panel review required before proceeding to Use Cases     |
| **Port Contract Definition**  | Step 3.1       | Panel review required before any use case implementation |
| **Controller Boundary**       | Step 4.2       | Panel review required for HTTP/GraphQL error mapping     |
| **Database Integration**      | Step 4.3       | Panel review required for Effect.tryPromise patterns     |
| **DI Integration**            | Step 5.1       | Panel review required for Layer composition              |
| **System Entry Points**       | Steps 6.1, 6.2 | Panel review required for runtime execution              |
| **Authentication**            | Steps 3.3, 5.3 | Coordinated review for auth flow preservation            |

---

### References

- **Skill File:** [`.claude/skills/effect-framework-migration/SKILL.md`](.claude/skills/effect-framework-migration/SKILL.md)
  - Migration Patterns, DDD Layer Integration, Dependency Injection
  - Testing Patterns, Error Handling, Library Consolidation Map

- **Analysis File:** [`.specs/analysis/analysis-migrate-to-effect-framework.md`](.specs/analysis/analysis-migrate-to-effect-framework.md)
  - tRPC removal status (already eliminated)
  - 720 files affected (~501 implementation + 219 tests)
  - 13-week phased timeline
  - Risk assessment and mitigation strategies
