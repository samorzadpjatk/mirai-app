---
title: Fix cyclic dependency between adapters and frameworks
type: refactor
depends_on: []
---

## Initial User Prompt

Fix cyclic dependency between adapters and frameworks packages that prevents build and violates Clean Architecture

## Description

### The Problem

The codebase currently has a cyclic dependency between the `adapters` and `frameworks` packages that violates Clean Architecture principles:

1. **adapters imports from frameworks (33 occurrences)**: The adapters layer imports `PrismaClient` and Prisma types from `@mirai-app/frameworks/prisma`. According to Clean Architecture, the adapters layer should NOT depend on the frameworks layer.

2. **frameworks imports from adapters (3 occurrences)**: The frameworks layer imports `AppRouter` type and auth utilities from `@mirai-app/adapters`. This direction is actually correct per Clean Architecture (outer → inner), but the reverse dependency creates a cycle.

### Why This Matters

**Clean Architecture Dependency Rule states**: "Source code dependencies must point only inward, toward higher-level policies."

The correct dependency flow should be:

```
Frameworks → Adapters → Use Cases → Domain
```

Currently, we have:

```
Frameworks → Adapters ← Frameworks (CYCLE!)
```

### Business Impact

- **Build Failures**: Cyclic dependencies can cause build tools to fail or produce inconsistent results
- **Testing Difficulty**: Cannot test adapters layer in isolation without bringing in frameworks
- **Reduced Flexibility**: Cannot swap database implementations without touching adapters
- **Technical Debt**: Violates architectural standards documented in CLAUDE.md
- **Maintenance Risk**: Changes in frameworks can unexpectedly break adapters

### Success Criteria

When complete, the adapters package will have zero runtime dependencies on the frameworks package. All database dependencies will be injected via constructors, following the Dependency Inversion principle.

## Acceptance Criteria

### Scenario 1: No Runtime Dependencies on Frameworks

**Given** the adapters package source code
**When** analyzing imports from `@mirai-app/frameworks/prisma`
**Then** there should be zero runtime (non-type) imports
**And** the dependency-cruiser validation should pass with no violations

### Scenario 2: PrismaClient Constructor Injection

**Given** any repository class in adapters
**When** inspecting its constructor
**Then** it should accept `PrismaClient` as a parameter
**And** NOT import `createDb` or `PrismaClient` directly from frameworks

### Scenario 3: Factory Functions in Frameworks

**Given** the frameworks package
**When** creating repository or service instances
**Then** factory functions should inject `PrismaClient` into constructors
**And** all instantiation should happen through these factories

### Scenario 4: Build Success

**Given** the full codebase
**When** running `bun run build`
**Then** the build should complete successfully
**And** there should be no circular dependency warnings

### Scenario 5: Tests Pass

**Given** the test suite
**When** running `bun test`
**Then** all existing tests should pass
**And** tests should be able to mock PrismaClient without importing from frameworks

## Scope

### In-Scope

1. **All 33 files in adapters** that import from `@mirai-app/frameworks/prisma`:
   - 15 repository files in `src/gateways/`
   - 7 service files in `src/services/`
   - 1 auth controller in `src/controllers/auth/`
   - 1 tRPC config in `src/api/`
   - 6 utility files in `src/utils/`
   - 3 test files

2. **Factory creation in frameworks**:
   - Repository factory functions
   - Service factory functions
   - Composition root for dependency injection

3. **BasePrismaRepository refactor**:
   - Update base class to use injected PrismaClient

4. **tRPC context refactor**:
   - Pass database connection through context

### Out-of-Scope

1. **No functional changes**: Business logic remains exactly the same
2. **No API changes**: Public APIs (tRPC routes, types) stay unchanged
3. **No database schema changes**: Prisma schema is untouched
4. **No test logic changes**: Tests verify the same behavior, just with different setup
5. **No changes to frameworks → adapters imports**: The 3 correct-direction imports remain
6. **No changes to other packages**: Domain, use-cases, apps packages are untouched
7. **No new features**: This is purely a refactoring task

### Constraints

1. **Zero breaking changes**: All existing functionality must work identically
2. **Test coverage maintained**: All existing tests must pass
3. **Type safety preserved**: No `any` types introduced
4. **Build must pass**: No TypeScript errors
5. **Dependency rules**: After refactor, dependencies must only flow inward

## Architecture Overview

### Solution Strategy

The fix follows the **Dependency Inversion Principle** and **Dependency Injection** patterns to eliminate the cyclic dependency while maintaining all existing functionality.

**Key Decision**: Instead of adapters importing PrismaClient from frameworks, the frameworks layer will inject PrismaClient into adapters through constructor parameters. This reverses the dependency to follow Clean Architecture rules.

### Architecture Diagram

```
BEFORE (Cyclic - Current State):
┌─────────────────┐     ┌──────────────────┐
│   adapters      │◄────│    frameworks    │
│                 │     │                  │
│ imports Prisma  │     │  exports Prisma  │
│ (VIOLATION!)    │     │                  │
└─────────────────┘     └──────────────────┘
        │                        │
        ▼                        ▼
┌─────────────────┐     ┌──────────────────┐
│   use-cases     │     │     domain       │
└─────────────────┘     └──────────────────┘

AFTER (Clean - Target State):
┌─────────────────┐     ┌──────────────────┐
│   adapters      │◄────│    frameworks    │
│                 │     │                  │
│ PrismaClient ───┼─────┼───► Injected     │
│ (constructor)   │     │   via Factory    │
└─────────────────┘     └──────────────────┘
        │                        │
        ▼                        ▼
┌─────────────────┐     ┌──────────────────┐
│   use-cases     │     │     domain       │
└─────────────────┘     └──────────────────┘
```

### Key Architectural Decisions

| Decision                        | Rationale                                      | Trade-off                                  |
| ------------------------------- | ---------------------------------------------- | ------------------------------------------ |
| **Constructor Injection**       | Cleanest pattern for dependency inversion      | Requires updating all instantiation points |
| **Factory Functions**           | Centralize dependency wiring in outer layer    | Adds one layer of indirection              |
| **Type-Only Prisma Imports**    | Safe to keep as they don't create runtime deps | Some files still import types (acceptable) |
| **BasePrismaRepository Update** | Foundation class affects 15 repositories       | High impact but necessary                  |

### Components

#### 1. Repository Layer (adapters)

- **Current**: Repositories import PrismaClient directly
- **New**: Repositories receive PrismaClient via constructor
- **Impact**: 15 repository files + BasePrismaRepository

#### 2. Service Layer (adapters)

- **Current**: Services import Prisma types and client
- **New**: Services receive PrismaClient via constructor
- **Impact**: 8 service files

#### 3. Controller Layer (adapters)

- **Current**: authServer imports Prisma types directly
- **New**: authServer receives dependencies via constructor/factory
- **Impact**: 1 controller file

#### 4. tRPC Context (adapters)

- **Current**: trpc.ts imports createDb and PrismaClient
- **New**: Context receives database via context creation
- **Impact**: 1 file + all router instantiations

#### 5. Factory Layer (frameworks) - NEW

- **Purpose**: Create adapters with injected dependencies
- **Components**: RepositoryFactory, ServiceFactory, CompositionRoot
- **Impact**: 3 new files to create

### Contracts

#### Repository Constructor Contract

```typescript
// Before (VIOLATION):
import { createDb } from "@frameworks/prisma";
export class PrismaUserRepository {
  private prisma = createDb(); // ❌ Direct dependency
}

// After (CLEAN):
import type { PrismaClient } from "@frameworks/prisma";
export class PrismaUserRepository {
  constructor(private prisma: PrismaClient) {} // ✅ Injected
}
```

#### Factory Contract

```typescript
// packages/frameworks/src/factories/repositories.ts
import { createDb } from "../prisma";
import { PrismaUserRepository } from "@adapters/gateways";

export function createUserRepository() {
  return new PrismaUserRepository(createDb()); // ✅ Outer layer wires deps
}
```

### Expected Changes

#### Files to Create (3 files)

1. `packages/frameworks/src/factories/repositories.ts` - Repository factory
2. `packages/frameworks/src/factories/services.ts` - Service factory
3. `packages/frameworks/src/factories/index.ts` - Barrel export

#### Files to Modify (33 files in adapters)

1. **BasePrismaRepository.ts** - Update base class
2. **15 Repository files** - Add constructor parameter
3. **8 Service files** - Add constructor parameter
4. **1 Controller file** - Add constructor parameter
5. **1 tRPC config file** - Update context
6. **6 Utility files** - Update to use injected prisma
7. **3 Test files** - Update mocks

#### Files to Modify in Other Packages

- Backend server entry points - Use factories instead of direct instantiation
- Frameworks index.ts - Export factories

### References

- [Research: Clean Architecture Dependency Rules](../analysis/analysis-fix-cyclic-dependencies.md)
- [Skill: Fix Cyclic Dependencies](../../../.claude/skills/fix-cyclic-dependencies/SKILL.md)

## Implementation Process

### Phase 1: Factory Infrastructure (Setup)

**Goal**: Create factory functions in frameworks layer for dependency injection
**Output**: Factory files in `packages/frameworks/src/factories/`
**Success Criteria**:

- Factory files compile without errors
- All factory functions properly typed
- Factories can import from both frameworks and adapters

**Subtasks**:

1. Create `packages/frameworks/src/factories/repositories.ts` with factory functions for all 15 repositories
2. Create `packages/frameworks/src/factories/services.ts` with factory functions for all 8 services
3. Create `packages/frameworks/src/factories/index.ts` for barrel exports
4. Export factories from `packages/frameworks/src/index.ts`

**Blockers**: None - this is the foundation
**Risks**: Low - new code, no existing behavior changes
**Decomposition**: None needed - straightforward file creation

---

### Phase 2: BasePrismaRepository Refactor (Foundational)

**Goal**: Update base class to accept PrismaClient via constructor
**Output**: Modified `packages/adapters/src/gateways/BasePrismaRepository.ts`
**Success Criteria**:

- Base class accepts `PrismaClient` in constructor
- All existing repositories can still extend the base class (temporarily with any type)
- No imports from `@mirai-app/frameworks/prisma` in base class

**Subtasks**:

1. Add `prisma: PrismaClient` constructor parameter to BasePrismaRepository
2. Update base class to store and use injected prisma instance
3. Verify all 15 repositories still compile (accept temporary `any` if needed)

**Blockers**: None - can proceed in parallel with Phase 1
**Risks**: High - affects 15 repositories, must not break existing code
**Decomposition**:

- If this phase proves complex, split into:
  - Step 2a: Update constructor signature only
  - Step 2b: Update internal usage of prisma

---

### Phase 3: Repository Refactoring (High Volume)

**Goal**: Update all 15 repositories to pass PrismaClient to base class
**Output**: All repository files in `packages/adapters/src/gateways/` updated
**Success Criteria**:

- All repositories compile with new BasePrismaRepository
- All repositories removed from `@mirai-app/frameworks/prisma` imports
- Factory functions can create all repositories

**Subtasks**:

1. Update PrismaUserRepository with constructor injection
2. Update PrismaTripRepository with constructor injection
3. Update PrismaChallengeRepository with constructor injection
4. Update PrismaGroupRepository with constructor injection
5. Update PrismaRewardRepository with constructor injection
6. Update PrismaNotificationRepository with constructor injection
7. Update PrismaChallengeSubmissionRepository with constructor injection
8. Update PrismaSponsorRepository with constructor injection
9. Update PrismaLocationRepository with constructor injection
10. Update PrismaChallengeVoteRepository with constructor injection
11. Update PrismaSubmissionReportRepository with constructor injection
12. Update PrismaCoinTransactionRepository with constructor injection
13. Update PrismaNotificationDeliveryRepository with constructor injection
14. Update PrismaNotificationScheduleRepository with constructor injection
15. Update PrismaActivityFeedRepository with constructor injection

**Blockers**: Phase 2 (BasePrismaRepository must be updated first)
**Risks**: Medium - repetitive changes, but volume is high
**Parallelization**: Can be done in groups:

- Group A (5 repos): User, Trip, Challenge, Group, Reward
- Group B (5 repos): Notification, ChallengeSubmission, Sponsor, Location, ChallengeVote
- Group C (5 repos): SubmissionReport, CoinTransaction, NotificationDelivery, NotificationSchedule, ActivityFeed

---

### Phase 4: Service Refactoring (Business Logic)

**Goal**: Update all 8 services to use constructor-injected PrismaClient
**Output**: All service files in `packages/adapters/src/services/` updated
**Success Criteria**:

- All services accept PrismaClient in constructor
- All services compile without framework imports
- Service factory functions work correctly

**Subtasks**:

1. Update PrismaCoinTransactionService
2. Update PrismaCoinService
3. Update PrismaRankingActivityService
4. Update PrismaNotificationSenderService
5. Update notificationService
6. Update PrismaTripPointsCalculator
7. Update PrismaTripAccessChecker
8. Update PrismaGroupCoinsService

**Blockers**: Phase 3 (some services may depend on repositories)
**Risks**: Medium - business logic must not change
**Parallelization**: Can be done in pairs:

- Pair 1: CoinTransactionService, CoinService
- Pair 2: RankingActivityService, NotificationSenderService
- Pair 3: notificationService, TripPointsCalculator
- Pair 4: TripAccessChecker, GroupCoinsService

---

### Phase 5: tRPC Context Refactor (Critical)

**Goal**: Refactor tRPC context to receive database via context creation
**Output**: Modified `packages/adapters/src/api/trpc.ts`
**Success Criteria**:

- tRPC context accepts database connection from caller
- createContext function receives prisma instance
- All routers continue to work with updated context

**Subtasks**:

1. Update context type to include prisma as parameter (not import)
2. Update createContext function signature
3. Verify all routers compile with new context
4. Update tRPC utility functions in `src/utils/trpc-utils/`

**Blockers**: Phase 3 (repositories must be refactored first)
**Risks**: High - affects all API routes
**Decomposition**: None - must be done as single coherent change

---

### Phase 6: Auth Controller Refactor (Security Critical)

**Goal**: Refactor auth server to use injected PrismaClient
**Output**: Modified `packages/adapters/src/controllers/auth/authServer.ts`
**Success Criteria**:

- Auth server accepts PrismaClient via constructor or factory
- All auth functions work with injected instance
- Type imports handled correctly

**Subtasks**:

1. Analyze authServer.ts for all Prisma dependencies
2. Create factory function in frameworks for auth components
3. Update authServer.ts to use injected dependencies
4. Update auth tests with new mocking approach

**Blockers**: Phase 5 (tRPC context should be stable first)
**Risks**: High - security-critical code, must not break authentication
**Decomposition**:

- If complex, split into:
  - Step 6a: Type-only refactor (keep Prisma types)
  - Step 6b: Runtime dependency refactor (inject client)

---

### Phase 7: Utility & Test Updates (Cleanup)

**Goal**: Update all utility files and test files
**Output**: All utility and test files updated
**Success Criteria**:

- All utility functions compile without framework imports
- All tests pass with new dependency structure
- No remaining imports from `@mirai-app/frameworks/prisma` in adapters

**Subtasks**:

1. Update `src/utils/repository-factory.ts` (if still needed)
2. Update `src/utils/trpc-utils/tripGuards.ts`
3. Update `src/utils/trpc-utils/notifications.ts`
4. Update `src/utils/trpc-utils/recurringChallenges.ts`
5. Update `src/utils/trpc-utils/activityFeed.ts`
6. Update all 3 test utility files

**Blockers**: Phase 5 and 6 (main code must be stable)
**Risks**: Low - test and utility updates are straightforward
**Parallelization**: Can be done file-by-file independently

---

### Phase 8: Integration & Verification (Final)

**Goal**: Verify the entire refactoring and ensure everything works
**Output**: All tests passing, build successful, no cyclic dependencies
**Success Criteria**:

- `bun test` passes with no failures
- `bun run build` succeeds with no errors
- `bunx dependency-cruiser --validate .dependency-cruiser.mjs .` passes
- `grep -r "from.*@mirai-app/frameworks/prisma" packages/adapters/src` returns empty (except type imports if any)

**Subtasks**:

1. Run full test suite and fix any failures
2. Run dependency-cruiser validation
3. Run build and verify success
4. Manual verification of key flows (auth, API calls)
5. Update CLAUDE.md if architectural patterns changed

**Blockers**: All previous phases must be complete
**Risks**: Medium - integration issues may surface
**Decomposition**: None - this is the final validation

---

### Implementation Summary

| Phase | Files | Risk   | Estimate | Parallel Groups |
| ----- | ----- | ------ | -------- | --------------- |
| 1     | 3 new | Low    | Small    | N/A             |
| 2     | 1     | High   | Medium   | N/A             |
| 3     | 15    | Medium | Large    | 3 groups of 5   |
| 4     | 8     | Medium | Large    | 4 pairs         |
| 5     | 1     | High   | Medium   | N/A             |
| 6     | 1     | High   | Medium   | 2 sub-steps     |
| 7     | 6     | Low    | Small    | Independent     |
| 8     | All   | Medium | Small    | N/A             |

**Total**: 33 files modified, 3 files created
**Critical Path**: 2 → 3 → 5 → 6 → 8 (sequential dependencies)
**Parallelizable**: Phases 1, 4, 7 can run partially in parallel with critical path

### Definition of Done

- [ ] All 33 files in adapters no longer import from `@mirai-app/frameworks/prisma` (runtime)
- [ ] 3 factory files created in frameworks and exported
- [ ] BasePrismaRepository uses constructor injection
- [ ] All 15 repositories use constructor injection
- [ ] All 8 services use constructor injection
- [ ] tRPC context receives database via parameter
- [ ] Auth server refactored with injection
- [ ] All utility and test files updated
- [ ] All tests pass (`bun test`)
- [ ] Build succeeds (`bun run build`)
- [ ] No cyclic dependencies detected by dependency-cruiser
- [ ] CLAUDE.md updated if needed

## Parallelization

### Execution Strategy

This refactoring follows a **staged pipeline with parallel groups** pattern. The critical path is sequential, but independent work can proceed in parallel.

### Dependency Graph

```
Phase 1: Factories ──┐
                     │
Phase 2: BaseRepo ───┼──► Phase 3: Repos ───► Phase 5: tRPC ───► Phase 6: Auth ───► Phase 8: Verify
                     │                          ▲                    ▲
                     │                          │                    │
                     └──────────────────────────┴────────────────────┘
                        (Sequential dependencies)

Phase 4: Services ───► Phase 5: tRPC (can start after Phase 3)

Phase 7: Utils/Tests ────────────────────────────────► Phase 8: Verify
```

### Parallel Groups

#### Group A: Setup (Can start immediately)

**Phase 1: Factory Infrastructure**

- Files: 3 new files in frameworks
- Agent: `sonnet` (non-complex, standard patterns)
- Can run in parallel with: Nothing (foundational)

#### Group B: Foundation (Depends on: A)

**Phase 2: BasePrismaRepository**

- Files: 1 critical file
- Agent: `opus` (high complexity, foundational change)
- Can run in parallel with: Nothing (blocks everything else)

#### Group C: Repositories (Depends on: B, can parallelize internally)

**Phase 3: Repository Refactoring**

- Files: 15 repositories
- Agent: `sonnet` (repetitive but high volume)
- Parallel Sub-Groups:
  - **C1**: User, Trip, Challenge, Group, Reward repositories
  - **C2**: Notification, ChallengeSubmission, Sponsor, Location, ChallengeVote repositories
  - **C3**: SubmissionReport, CoinTransaction, NotificationDelivery, NotificationSchedule, ActivityFeed repositories
- Each sub-group: Independent, can run in parallel

#### Group D: Services (Depends on: C, can parallelize internally)

**Phase 4: Service Refactoring**

- Files: 8 services
- Agent: `sonnet` (repetitive patterns)
- Parallel Sub-Groups:
  - **D1**: CoinTransactionService, CoinService
  - **D2**: RankingActivityService, NotificationSenderService
  - **D3**: notificationService, TripPointsCalculator
  - **D4**: TripAccessChecker, GroupCoinsService
- Each sub-group: Independent, can run in parallel

#### Group E: tRPC (Depends on: C, D)

**Phase 5: tRPC Context**

- Files: 1 critical file
- Agent: `opus` (high complexity, affects all routes)
- Can run in parallel with: Nothing (blocks auth)

#### Group F: Auth (Depends on: E)

**Phase 6: Auth Controller**

- Files: 1 security-critical file
- Agent: `opus` (high complexity, security-critical)
- Can run in parallel with: Nothing (security-critical, needs focus)

#### Group G: Cleanup (Can start after C, D, E)

**Phase 7: Utilities & Tests**

- Files: 6 utility/test files
- Agent: `sonnet` (straightforward updates)
- Can run in parallel with: F (Phase 6)
- Parallel Sub-Groups:
  - **G1**: repository-factory.ts, tripGuards.ts
  - **G2**: notifications.ts, recurringChallenges.ts
  - **G3**: activityFeed.ts + test files

#### Group H: Final Verification (Depends on: F, G)

**Phase 8: Integration & Verification**

- Files: All files
- Agent: `opus` (comprehensive verification)
- Can run in parallel with: Nothing (final step)

### Agent Assignments

| Step                        | Agent    | Rationale                                                  |
| --------------------------- | -------- | ---------------------------------------------------------- |
| Phase 1 (Factories)         | `sonnet` | Standard patterns, straightforward implementation          |
| Phase 2 (BaseRepo)          | `opus`   | Foundational, affects 15+ classes, requires careful design |
| Phase 3.1-3.3 (Repos)       | `sonnet` | Repetitive changes following established pattern           |
| Phase 4.1-4.4 (Services)    | `sonnet` | Repetitive business logic changes                          |
| Phase 5 (tRPC)              | `opus`   | Critical infrastructure affecting all routes               |
| Phase 6 (Auth)              | `opus`   | Security-critical, must not break authentication           |
| Phase 7.1-7.3 (Utils/Tests) | `haiku`  | Simple updates, tests verification                         |
| Phase 8 (Verify)            | `opus`   | Comprehensive verification, final quality gate             |

### Sub-Agent Execution Directive

When executing this task:

**MUST**:

1. Follow the critical path sequentially (2 → 3 → 5 → 6 → 8)
2. Use the specified agent for each phase
3. Verify the previous phase passed before starting the next
4. Run parallel sub-groups simultaneously when possible

**MUST NOT**:

1. Skip Phase 2 (BasePrismaRepository) - it blocks all other phases
2. Run Phase 5 before Phase 3 completes (repository dependencies)
3. Run Phase 6 before Phase 5 completes (tRPC context dependency)
4. Run Phase 8 before Phases 6 and 7 complete

**CRITICAL PATH**: Phase 2 → Phase 3 (all sub-groups complete) → Phase 5 → Phase 6 → Phase 8

**PARALLEL EXECUTION**:

- Phase 1 can run with Phase 2
- Phase 3 sub-groups (C1, C2, C3) run in parallel
- Phase 4 can start as soon as relevant Phase 3 sub-groups complete
- Phase 4 sub-groups (D1, D2, D3, D4) run in parallel
- Phase 7 can run in parallel with Phase 6
- Phase 7 sub-groups (G1, G2, G3) run in parallel

## Verification

### Phase 1: Factory Infrastructure - Verification

**Verification Level**: Single Judge (MEDIUM)

**Custom Rubric**:

1. **Factory Completeness** (weight: 0.40)
   - All 15 repositories have factory functions?
   - All 8 services have factory functions?
   - Factories properly typed?
2. **Export Integration** (weight: 0.30)
   - Factories exported from frameworks index.ts?
   - Barrel export file complete?
3. **Compilation** (weight: 0.30)
   - No TypeScript errors?
   - Proper imports from both layers?

**Threshold**: 4.0/5.0

---

### Phase 2: BasePrismaRepository - Verification

**Verification Level**: Panel of 2 Judges (HIGH)

**Custom Rubric**:

1. **Constructor Signature** (weight: 0.35)
   - Accepts PrismaClient parameter?
   - Parameter properly typed?
   - No imports from frameworks?
2. **Backward Compatibility** (weight: 0.35)
   - All 15 repositories still extend base class?
   - No breaking changes to existing code?
3. **Implementation Quality** (weight: 0.30)
   - Prisma instance properly stored?
   - Base methods use injected instance?

**Threshold**: 4.5/5.0

---

### Phase 3: Repository Refactoring - Verification

**Verification Level**: Per-Item Judge (MEDIUM-HIGH)

**Custom Rubric** (applied to each repository):

1. **Constructor Injection** (weight: 0.40)
   - Accepts PrismaClient via constructor?
   - Passes to base class correctly?
2. **Import Removal** (weight: 0.35)
   - No runtime imports from @frameworks/prisma?
   - Type-only imports acceptable?
3. **Compilation** (weight: 0.25)
   - File compiles without errors?
   - Factory function works correctly?

**Threshold**: 4.0/5.0 per repository

---

### Phase 4: Service Refactoring - Verification

**Verification Level**: Per-Item Judge (MEDIUM)

**Custom Rubric** (applied to each service):

1. **Dependency Injection** (weight: 0.40)
   - Accepts PrismaClient/repositories via constructor?
   - No direct PrismaClient imports?
2. **Business Logic Preservation** (weight: 0.35)
   - All methods behave identically?
   - No functional changes?
3. **Factory Integration** (weight: 0.25)
   - Service factory creates instance correctly?

**Threshold**: 4.0/5.0 per service

---

### Phase 5: tRPC Context - Verification

**Verification Level**: Panel of 2 Judges (HIGH)

**Custom Rubric**:

1. **Context Type Safety** (weight: 0.35)
   - Context type includes database parameter?
   - Proper TypeScript types?
2. **Integration** (weight: 0.35)
   - All routers compile with new context?
   - Context creation properly wired?
3. **No Direct Imports** (weight: 0.30)
   - trpc.ts imports no PrismaClient/createDb?
   - Database comes via context parameter?

**Threshold**: 4.5/5.0

---

### Phase 6: Auth Controller - Verification

**Verification Level**: Panel of 2 Judges (CRITICAL)

**Custom Rubric**:

1. **Security Preservation** (weight: 0.40)
   - All auth functions work identically?
   - No security regressions?
2. **Dependency Injection** (weight: 0.30)
   - PrismaClient properly injected?
   - No direct imports from frameworks?
3. **Test Coverage** (weight: 0.30)
   - Auth tests pass?
   - Tests can mock dependencies?

**Threshold**: 4.5/5.0

---

### Phase 7: Utilities & Tests - Verification

**Verification Level**: Single Judge (LOW-MEDIUM)

**Custom Rubric**:

1. **Import Cleanup** (weight: 0.40)
   - No remaining runtime imports from frameworks?
   - Test utilities properly updated?
2. **Test Pass Rate** (weight: 0.35)
   - All affected tests pass?
   - No test logic changes?
3. **Utility Functions** (weight: 0.25)
   - All utilities use injected dependencies?

**Threshold**: 3.5/5.0

---

### Phase 8: Integration & Verification - Verification

**Verification Level**: Panel of 3 Judges (CRITICAL)

**Custom Rubric**:

1. **Test Suite Pass** (weight: 0.30)
   - `bun test` passes with 100% success?
   - No test failures?
2. **Build Success** (weight: 0.30)
   - `bun run build` completes without errors?
   - No TypeScript compilation errors?
3. **Dependency Validation** (weight: 0.25)
   - dependency-cruiser passes with no violations?
   - No cyclic dependencies detected?
4. **Import Verification** (weight: 0.15)
   - `grep` shows no runtime imports from frameworks in adapters?
   - Only type imports remain (if any)?

**Threshold**: 4.5/5.0

---

### Verification Summary Table

| Phase                | Verification Level | Judges        | Threshold | Critical? |
| -------------------- | ------------------ | ------------- | --------- | --------- |
| Phase 1: Factories   | Single Judge       | 1             | 4.0/5.0   | No        |
| Phase 2: BaseRepo    | Panel              | 2             | 4.5/5.0   | Yes       |
| Phase 3: Repos       | Per-Item           | 1 per repo    | 4.0/5.0   | No        |
| Phase 4: Services    | Per-Item           | 1 per service | 4.0/5.0   | No        |
| Phase 5: tRPC        | Panel              | 2             | 4.5/5.0   | Yes       |
| Phase 6: Auth        | Panel              | 2             | 4.5/5.0   | Yes       |
| Phase 7: Utils/Tests | Single Judge       | 1             | 3.5/5.0   | No        |
| Phase 8: Integration | Panel              | 3             | 4.5/5.0   | Yes       |

### Quality Gates Summary

- **Critical Phases** (2, 5, 6, 8): Require Panel of judges, 4.5/5.0 threshold
- **Standard Phases** (1, 3, 4, 7): Single judge sufficient, 3.5-4.0 threshold
- **Per-Item Verification**: Each repository and service individually judged
- **Final Integration**: Triple-judge panel for maximum confidence
