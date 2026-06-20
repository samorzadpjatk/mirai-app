---

title: Monorepo Testability Redesign — Functional Core, Imperative Shell + Manual DI
---

## Initial User Prompt

Redesign the MIRAI monorepo testing architecture to enable TDD-first workflow, reduce total source + test LOC by ~5,000 lines while increasing meaningful coverage, and eliminate mock-heavy tests in favor of real-data testing.

## Description

This task executes a 15-week incremental redesign of the MIRAI monorepo's testing architecture to transform a mock-heavy, difficult-to-maintain test suite into a lean, behavior-focused testing strategy. The redesign follows the **Functional Core, Imperative Shell** pattern with **Manual Dependency Injection**, targeting a test pyramid of 70% unit (pure functions), 20% integration (real PGLite + Hono testClient), and 10% E2E (critical journeys).

The redesign addresses critical gaps: business logic mixed with data access in 174-508 line oRPC router mutations, tightly coupled native hooks importing orpc clients directly, an untestable background task with module-level client creation, a 190-line QueryProvider god component, zero transaction rollback testing, 858 lines of mock setup in orpc alone, and no real database integration strategy.

**Scope**:
- **Included**: Pure function extraction to `@mirai-app/common`, real PGLite integration tests, test infrastructure cleanup, incremental router-by-router refactoring, background task decoupling, QueryProvider decomposition, MSW setup for native hooks, dead code removal, documentation updates
- **Excluded**: Jest → Vitest migration (jest-expo is required), DI container libraries (tsyringe/inversify), Repository layer over Drizzle, Service layer over oRPC client, Platform adapters for simple APIs, 15-session big-bang rewrite

**User Scenarios**:
1. **Primary Flow**: Developer writes pure business logic in `packages/common/src/core/`, tests with real data in 30-60 seconds, integrates into thin hook/router shells, verifies with `nx run @mirai-app/common:test`
2. **Integration Flow**: Developer writes router mutation, tests with real PGLite database using `BEGIN...ROLLBACK`, verifies with `nx run @mirai-app/orpc:test`
3. **Native Flow**: Developer writes React hook, tests against MSW-intercepted oRPC API with real query client, verifies with `nx run @mirai-app/native:test`
4. **Error Handling**: Test failures provide clear real-data diffs (no mock call chain debugging), CI runs full suite in ~3 minutes, coverage never drops below 80%

## Architecture Overview

### Solution Strategy

This redesign uses a **Functional Core, Imperative Shell** architecture with **Manual Dependency Injection** and **Real Data Testing**:

| Layer | Responsibility | Test Strategy | Example |
|-------|--------------|---------------|---------|
| `packages/common/src/core/` | Pure functions (no side effects) | Real data unit tests (Vitest) | `buildTripQueryInput`, `calculateAllTrips` |
| `packages/orpc/src/api/routers/` | Thin shells: validate → call pure function → return | PGLite integration tests (Vitest) | `coin.create`, `user.update` |
| `apps/native/src/hooks/` | Thin shells: call pure functions + orpc client | MSW + real client tests (Jest) | `useTrips`, `useGroups` |
| `apps/native/src/services/background/` | Task logic with injected dependencies | Fake dependency tests (Jest) | `backgroundLocationTask` |
| `packages/orpc/src/client/` | Decomposed React providers/hooks | Component/hook tests (Vitest) | `AuthTokenProvider`, `useWebSocket` |

### Key Architectural Decisions

1. **Functional Core, Imperative Shell**: Extract all pure business logic to `packages/common/src/core/`. Hooks, routers, and components become thin shells that call pure functions. This enables testing with real data (no mocks) and reduces test LOC by ~75%.

2. **Manual Dependency Injection**: Pass dependencies via constructor/function parameters. No singleton imports inside business logic. The background task accepts `{ supabaseClient, orpcClient }` instead of creating them at module level.

3. **Real Data over Mock Verification**: Test output/return values with real data, not `vi.fn()` call counts. A pure function test is 10 lines vs. 40 lines for mock verification.

4. **Real PGLite for Integration Tests**: Use `@electric-sql/pglite` for real database integration tests. Tests actual `BEGIN...ROLLBACK` semantics. Oracle rejected `MockTransactionDB` as "still a mock."

5. **MSW for Native API Testing**: Use Mock Service Worker to intercept oRPC HTTP requests. Native app tests against the real oRPC client stack (serialization, error handling, caching), not fake service layers.

6. **Skip Redundant Abstractions**: No repository layer over Drizzle (Drizzle IS the repository), no service layer over oRPC client (oRPC client IS the service layer), no DI container (manual injection is explicit, type-safe, zero-overhead).

7. **Incremental, Main-Branch-Green**: 15 weeks, not 15 sessions. Never convert all routers simultaneously. Each week ends with `nx run-many -t test` passing.

### Testing Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Test Pyramid (Target)                      │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  10% E2E — Critical journeys (Maestro/Playwright)   │    │
│  ├─────────────────────────────────────────────────────┤    │
│  │  20% Integration — PGLite + Hono testClient        │    │
│  │  Real DB transactions, rollback testing            │    │
│  ├─────────────────────────────────────────────────────┤    │
│  │  70% Unit — Pure functions with real data           │    │
│  │  No mocks, no frameworks, 10-line tests            │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
         ┌────────────────────┼────────────────────┐
         ▼                    ▼                    ▼
┌────────────────┐  ┌────────────────┐  ┌────────────────┐
│  packages/     │  │  packages/     │  │  apps/         │
│  shared        │  │  orpc          │  │  native        │
│  (Vitest)      │  │  (Vitest)      │  │  (Jest + MSW)  │
├────────────────┤  ├────────────────┤  ├────────────────┤
│ core/          │  │ routers/       │  │ hooks/         │
│ - Pure fns     │  │ - Thin shells   │  │ - Thin shells   │
│ - Real data    │  │ - PGLite tests │  │ - MSW tests    │
│ - 10-line tests│  │ - 80% threshold│  │ - 80% threshold│
└────────────────┘  └────────────────┘  └────────────────┘
```

### Target Directory Structure

```
packages/common/
├── src/
│   ├── core/                    # Pure functions (no side effects)
│   │   ├── buildTripQueryInput.ts
│   │   ├── calculateAllTrips.ts
│   │   ├── buildGroupQueryInput.ts
│   │   ├── getNextGroupPageParam.ts
│   │   ├── buildChallengeQueryInput.ts
│   │   ├── getNextChallengePageParam.ts
│   │   ├── calculateRewardProgress.ts
│   │   ├── buildChallengeFilter.ts
│   │   ├── validateUserRegistration.ts
│   │   └── calculateTripScore.ts
│   └── factories/               # Test data factories
│       ├── user.factory.ts
│       ├── trip.factory.ts
│       └── index.ts

packages/orpc/
├── src/
│   ├── api/
│   │   └── routers/             # Thin shells: validate → pure fn → return
│   │       ├── coin/
│   │       ├── sponsor/
│   │       ├── challengeVote/
│   │       ├── submissionReport/
│   │       ├── challengeSubmission/
│   │       ├── reward/
│   │       ├── location/
│   │       ├── group/
│   │       ├── challenge/
│   │       ├── storage/
│   │       ├── notificationDelivery/
│   │       ├── notificationSchedule/
│   │       ├── notificationSender/
│   │       ├── coinTransaction/
│   │       ├── activityFeed/
│   │       ├── trip/
│   │       ├── user/
│   │       └── notifications/
│   └── client/
│       ├── query-client-factory.ts
│       ├── auth-token-provider.tsx
│       ├── use-websocket.ts
│       ├── use-unauthorized-handler.ts
│       └── query-client.tsx

apps/native/
├── src/
│   ├── hooks/                   # Thin shells: pure fn + orpc client
│   ├── services/background/
│   │   └── backgroundLocationTask.ts  # Accepts deps, no module-level clients
│   └── test-utils/msw/
│       └── server.ts
```

### Expected File Changes

**Create (~40 files)**:
| File | Purpose |
|------|---------|
| `packages/common/src/core/buildTripQueryInput.ts` | Pure query input builder |
| `packages/common/src/core/buildGroupQueryInput.ts` | Pure query input builder |
| `packages/common/src/core/buildChallengeQueryInput.ts` | Pure query input builder |
| `packages/common/src/core/calculateAllTrips.ts` | Pure trip calculation logic |
| `packages/common/src/core/getNextGroupPageParam.ts` | Pure pagination logic |
| `packages/common/src/core/getNextTripPageParam.ts` | Pure pagination logic |
| `packages/common/src/core/getNextChallengePageParam.ts` | Pure pagination logic |
| `packages/common/src/core/calculateRewardProgress.ts` | Pure reward calculation |
| `packages/common/src/core/buildChallengeFilter.ts` | Pure filter builder |
| `packages/common/src/core/validateUserRegistration.ts` | Pure validation logic |
| `packages/common/src/core/calculateTripScore.ts` | Pure score calculation |
| `packages/common/src/factories/*.factory.ts` | Test data factories |
| `packages/common/vitest.shared.config.ts` | Shared Vitest base config |
| `packages/common/testing/setup.ts` | Unified console suppression |
| `packages/orpc/src/client/query-client-factory.ts` | Query client factory |
| `packages/orpc/src/client/auth-token-provider.tsx` | Auth token sync component |
| `packages/orpc/src/client/use-websocket.ts` | WebSocket lifecycle hook |
| `packages/orpc/src/client/use-unauthorized-handler.ts` | 401 error handler hook |
| `apps/native/src/test-utils/msw/server.ts` | MSW server setup |

**Modify (~50 files)**:
| File | Changes |
|------|---------|
| `apps/native/src/hooks/useTrips.ts` | Refactor to thin shell |
| `apps/native/src/hooks/useGroups.ts` | Refactor to thin shell |
| `apps/native/src/hooks/useChallenges.ts` | Refactor to thin shell |
| `apps/native/src/services/background/backgroundLocationTask.ts` | Accept deps via DI |
| `packages/orpc/src/client/query-client.tsx` | Decompose into 4 pieces |
| `packages/orpc/vitest.setup.ts` | Reduce from 858 to ~200 lines |
| `apps/native/jest.setup.js` | Reduce from 146 to ~100 lines |
| `packages/orpc/src/api/routers/*/mutations.ts` | Extract pure functions |
| `packages/orpc/src/api/routers/*/queries.ts` | Extract pure functions |
| `docs/conventions/testing.md` | Update with new patterns |

**Delete (~72 files)**:
| File | Rationale |
|------|---------|
| `packages/orpc/src/api/routers/*/mock-heavy.test.ts` | Replaced with real-data tests |
| `apps/native/src/hooks/__tests__/mock-internal.test.ts` | Replaced with MSW tests |
| `apps/native/src/components/__tests__/mock-presence.test.ts` | Replaced with behavior tests |
| `apps/native/__mocks__/*` (13 files) | Unnecessary with MSW |
| Duplicate mock factories | Deduplicated into shared |

---

## Acceptance Criteria

### Functional Requirements

- [x] **Pure Function Extraction — Part 1**: `buildGroupQueryInput`, `getNextGroupPageParam`, `buildTripQueryInput`, `getNextTripPageParam`, `calculateAllTrips`, `buildChallengeQueryInput`, `getNextChallengePageParam` extracted to `packages/common/src/{groups,trips,challenges}/queryBuilders.ts` with 27 real-data Vitest tests
  - Given: Business logic was inline in native hooks
  - When: Pure functions are extracted and tested with real data
  - Then: `nx run @mirai-app/common:test` passes 251/251 tests, `nx run @mirai-app/native:test` passes 225/225 tests

- [x] **Pure Function Extraction — Part 2**: `calculateRewardProgress`, `buildChallengeFilter`, `validateUserRegistration`, `calculateTripScore`, `buildNotificationSchedule` extracted to `packages/common/src/core/` with real-data tests
  - Given: Additional business logic remains inline in hooks/routers
  - When: Pure functions are extracted and tested with real data
  - Then: All shared tests pass, hooks refactored to thin shells

- [x] **Test Infrastructure Cleanup**: Mock factories deduplicated into `packages/common/src/test-utils/`, shared Vitest config created, console suppression unified
  - Given: 858-line `packages/orpc/vitest.setup.ts` and 146-line `apps/native/jest.setup.js`
  - When: Infrastructure is deduplicated and unified
  - Then: `vitest.setup.ts` shrinks to ~300 lines, `jest.setup.js` shrinks to ~100 lines

- [x] **Pilot Router Refactored**: Simplest router (`coin` or `sponsor`) fully refactored with pure functions extracted + real PGLite transaction tests
  - Given: A simple router with inline business logic
  - When: Pure functions are extracted and PGLite tests are added
  - Then: Router coverage reaches 80%+, transaction rollback is verified

- [x] **Background Task Decoupled**: `backgroundLocationTask.ts` accepts `{ supabaseClient, orpcClient }` via DI, fully testable with 3-5 fake dependency tests
  - Given: Background task creates clients at module level with hard-coded env vars
  - When: Dependencies are injected via function parameters
  - Then: `nx run @mirai-app/native:test` passes, task logic tested with fake deps

- [x] **All 19 Routers Refactored**: Incremental router-by-router application of pilot pattern (pure functions + PGLite tests) across all 19 routers
  - Given: 19 routers with mixed inline business logic and mock-heavy tests
  - When: Each router is refactored incrementally over 6 weeks
  - Then: All routers have 80%+ coverage, all use real data or PGLite

- [x] **QueryProvider Decomposed**: 190-line god component split into `query-client-factory.ts`, `auth-token-provider.tsx`, `use-websocket.ts`, `use-unauthorized-handler.ts` + tests
  - Given: QueryProvider manages 6 concerns in one component
  - When: Each concern is extracted into a focused piece
  - Then: QueryProvider shrinks to ~50 lines, each piece independently testable

- [x] **MSW Setup for Native**: Mock Service Worker configured in `apps/native/src/test-utils/msw/`, 60-80% of native hook tests rewritten
  - Given: Native hooks use `vi.mock()` of internal modules
  - When: MSW intercepts oRPC HTTP requests with fake responses
  - Then: Hooks test against real client stack, no internal module mocking

- [x] **Component Tests Rewritten**: Component mock tests replaced with behavior tests, `testID` added where needed
  - Given: Component tests assert `expect(screen.getByTestId('sidebar-mock')).toBeInTheDocument()`
  - When: Tests verify user-visible behavior instead
  - Then: `expect(screen.getByRole('navigation')).toBeInTheDocument()`

- [x] **Documentation Updated**: `docs/conventions/testing.md` and per-package `AGENTS.md` files reflect new architecture
  - Given: Documentation describes old mock-heavy patterns
  - When: Documentation is updated with new patterns
  - Then: New developer can write a test in <5 minutes without reading mock setup docs

### Non-Functional Requirements

- [x] **Performance**: Full test suite completes in < 3 minutes (down from 5 minutes)
- [x] **Reliability**: Tests are deterministic and not flaky (real data eliminates mock timing issues)
- [x] **Coverage**: All packages maintain 80% threshold, orpc function coverage improves from 55% to 80%+
- [x] **LOC Reduction**: Total source + test LOC reduced by ~5,000 lines (mock setup -804, factories -300, inline fixtures -600, test code -75%)
- [x] **Developer Experience**: Time to write new router test reduced from 30 min to 5 min
- [x] **No Regressions**: All existing tests either pass or have been intentionally replaced with better tests
- [x] **No New Console Logging**: No `console.log` in production code (Pino for backend, Sentry for native)
- [x] **Type Safety**: No `as any` or `@ts-ignore` added to suppress type errors

### Definition of Done

- [x] All acceptance criteria pass
- [x] All 352 original tests either pass or have been intentionally replaced
- [x] `nx run-many -t test` passes from root
- [x] `nx run-many -t lint` passes from root
- [x] `nx run-many -t typecheck` passes from root
- [x] Coverage report shows improvement in all packages
- [x] `docs/conventions/testing.md` reflects new architecture
- [x] Per-package `AGENTS.md` files updated with testing standards
- [x] New developer can write a test in <5 minutes without reading mock setup docs
- [x] No new `console.log` in production code
- [x] No `as any` or `@ts-ignore` added
- [x] Dead code removed (unused imports, unreachable code, redundant tests)

---

## Implementation Process

### Phase A: Pure Function Extraction

#### Step A.1: Week 1 — Pure Function Extraction (Part 1)
**Estimate**: Medium (30-60 min)  
**Agent**: sonnet  
**Parallel with**: None (Wave 1 - Foundation)

**Success Criteria**:
- `buildGroupQueryInput`, `getNextGroupPageParam`, `buildTripQueryInput`, `getNextTripPageParam`, `calculateAllTrips`, `buildChallengeQueryInput`, `getNextChallengePageParam` extracted to `packages/common/src/{groups,trips,challenges}/queryBuilders.ts`
- 27 real-data Vitest tests written (9 + 11 + 7)
- Hooks `useGroups`, `useTrips`, `useChallenges` refactored to thin shells importing from `@mirai-app/common`
- `DBChallenge` duplication in `useChallenges.ts` eliminated
- `nx run @mirai-app/common:test` passes 251/251 tests
- `nx run @mirai-app/native:test` passes 225/225 tests

**Subtasks**:
1. Extract `buildGroupQueryInput` and `getNextGroupPageParam` to `packages/common/src/groups/queryBuilders.ts`
2. Extract `buildTripQueryInput`, `getNextTripPageParam`, `calculateAllTrips` to `packages/common/src/trips/queryBuilders.ts`
3. Extract `buildChallengeQueryInput`, `getNextChallengePageParam` to `packages/common/src/challenges/queryBuilders.ts`
4. Write 27 real-data Vitest tests for all extracted functions
5. Refactor `useGroups`, `useTrips`, `useChallenges` to import from `@mirai-app/common`
6. Eliminate `DBChallenge` duplication in `useChallenges.ts`
7. Verify `nx run @mirai-app/common:test` and `nx run @mirai-app/native:test`

**Blockers**: None

**Risks**:
- Risk: Extraction may break existing hook behavior
  - Mitigation: Comprehensive real-data tests validate behavior before and after
- Risk: `DBChallenge` type elimination may cause type errors
  - Mitigation: Run `nx run-many -t typecheck` after each change

**Verification**:
- **Level**: High
- **Threshold**: 4.0/5.0
- **Rubrics**:
  1. **Correctness** (30%): All pure functions produce correct output with real data
  2. **Testing** (30%): 27 real-data tests pass, no mock verification
  3. **Integration** (20%): Hooks import correctly from shared, no type errors
  4. **Quality** (10%): Clean extraction, no code duplication
  5. **Completeness** (10%): All subtasks completed, both test suites pass

---

#### Step A.2: Week 2 — Pure Function Extraction (Part 2) + Infrastructure Cleanup
**Estimate**: Medium (60-120 min)  
**Agent**: sonnet  
**Parallel with**: Step B.1 (Wave 2 - Independent tracks)

**Success Criteria**:
- `calculateRewardProgress`, `buildChallengeFilter`, `validateUserRegistration`, `calculateTripScore`, `buildNotificationSchedule` extracted to `packages/common/src/core/`
- Real-data tests written for all extracted functions
- Mock factories deduplicated into `packages/common/src/test-utils/`
- Shared Vitest config `packages/common/vitest.shared.config.ts` created
- `nx run @mirai-app/common:test` and `nx run @mirai-app/orpc:test` pass

**Subtasks**:
1. Extract remaining pure functions from hooks and routers
2. Write real-data tests for each extraction
3. Move `createMockSupabaseClient`, `createMockDb`, `createMockContext` from `packages/orpc/vitest.setup.ts` to shared test utilities
4. Create `packages/common/vitest.shared.config.ts` base config
5. Delete duplicate factories from orpc setup
6. Verify all test suites pass

**Blockers**:
- Step A.1 complete

**Risks**:
- Risk: Moving mock factories may break existing orpc tests
  - Mitigation: Update imports gradually, verify after each move
- Risk: Shared config may not work for all packages (different env needs)
  - Mitigation: Keep package-specific overrides possible

**Verification**:
- **Level**: High
- **Threshold**: 4.0/5.0
- **Rubrics**:
  1. **Correctness** (25%): All pure functions correct, shared config works
  2. **Testing** (25%): Real-data tests pass, mock setup reduced
  3. **Quality** (20%): Clean shared utilities, no duplication
  4. **Completeness** (20%): All subtasks completed
  5. **Integration** (10%): Both shared and orpc tests pass

---

### Phase B: Test Infrastructure Cleanup

#### Step B.1: Week 2 (Parallel) — Deduplicate Mock Factories + Shared Config
**Estimate**: Small (30-60 min)  
**Agent**: sonnet  
**Parallel with**: Step A.2 (Wave 2)

**Success Criteria**:
- `packages/common/src/test-utils/` contains `createMockSupabaseClient`, `createMockDb`, `createMockContext`
- `packages/common/vitest.shared.config.ts` created with base coverage thresholds
- `packages/common/testing/setup.ts` provides unified console suppression
- `packages/orpc/vitest.setup.ts` reduced from 858 to ~300 lines
- `apps/native/jest.setup.js` reduced from 146 to ~100 lines

**Subtasks**:
1. Create `packages/common/src/test-utils/` directory
2. Move mock factories from orpc setup to shared
3. Create shared Vitest config with coverage thresholds
4. Create unified console suppression setup
5. Update orpc and native setup files to import from shared
6. Verify line counts meet targets

**Blockers**:
- Step A.1 complete

**Risks**:
- Risk: Console suppression patterns may differ between packages
  - Mitigation: Accept all current patterns into shared config
- Risk: Mock factories may have subtle differences between packages
  - Mitigation: Extract common base, allow package-specific extensions

**Verification**:
- **Level**: Medium
- **Threshold**: 4.0/5.0
- **Rubrics**:
  1. **Correctness** (30%): All mock factories work in their new locations
  2. **Completeness** (30%): Shared config covers all packages, line count targets met
  3. **Quality** (20%): Clean utilities, no duplication
  4. **Integration** (20%): All packages test suites pass

---

### Phase C: Pilot Router

#### Step C.1: Week 3 — Pilot Router (Part 1)
**Estimate**: Medium (30-60 min)  
**Agent**: sonnet  
**Parallel with**: None (Wave 3 - First router proof)

**Success Criteria**:
- Simplest router (`coin` or `sponsor`) selected
- All pure logic extracted to `packages/common/src/core/`
- Real PGLite transaction test added (rollback on failure)
- Mock-heavy tests rewritten with real data
- Router coverage reaches 80%+

**Subtasks**:
1. Select pilot router (simplest: few dependencies, minimal business logic)
2. Extract pure functions (validation, calculations, transformations)
3. Write real-data tests for pure functions
4. Add PGLite test with `BEGIN...ROLLBACK` transaction
5. Rewrite mock-heavy tests to verify behavior, not implementation
6. Verify `nx run @mirai-app/orpc:test` passes

**Blockers**:
- Step A.2 complete
- Step B.1 complete

**Risks**:
- Risk: PGLite schema setup may be complex
  - Mitigation: Use `drizzle-kit push` to PGLite, or manually create schema
- Risk: Router may have hidden dependencies on other routers
  - Mitigation: Start with the simplest router possible

**Verification**:
- **Level**: High
- **Threshold**: 4.0/5.0
- **Rubrics**:
  1. **Correctness** (30%): PGLite tests verify actual rollback, pure functions correct
  2. **Testing** (30%): Real-data tests pass, coverage 80%+
  3. **Quality** (20%): Clean extraction, no duplication
  4. **Completeness** (10%): All subtasks completed
  5. **Integration** (10%): `nx run @mirai-app/orpc:test` passes

---

#### Step C.2: Week 4 — Pilot Router (Part 2) + Background Task
**Estimate**: Medium (30-60 min)  
**Agent**: sonnet  
**Parallel with**: Step D.1 (Wave 4 - Independent)

**Success Criteria**:
- Pilot router refactoring complete
- `backgroundLocationTask.ts` refactored to accept `BackgroundLocationDeps`
- `createBackgroundLocationTask` and `initBackgroundLocationTask` functions created
- 3-5 test cases for background task with fake dependencies
- `nx run @mirai-app/orpc:test` and `nx run @mirai-app/native:test` pass

**Subtasks**:
1. Complete any remaining pilot router refactoring
2. Extract `supabaseClient` and `orpcClient` from module scope in background task
3. Create `BackgroundLocationDeps` interface
4. Create `createBackgroundLocationTask` factory function
5. Create `initBackgroundLocationTask` for production wiring
6. Write fake Supabase and oRPC clients for testing
7. Write 3-5 tests covering success, error, and retry paths
8. Verify both test suites pass

**Blockers**:
- Step C.1 complete

**Risks**:
- Risk: Background task may have complex native module interactions
  - Mitigation: Test only the logic, mock native modules at the edges
- Risk: Fake dependencies may not match real client behavior
  - Mitigation: Test real behavior with integration tests separately

**Verification**:
- **Level**: High
- **Threshold**: 4.0/5.0
- **Rubrics**:
  1. **Correctness** (30%): Background task logic works with fake deps
  2. **Testing** (30%): All 3-5 tests pass, cover success/error/retry
  3. **Quality** (20%): Clean DI pattern, no module-level side effects
  4. **Completeness** (10%): All subtasks completed
  5. **Integration** (10%): Both test suites pass

---

### Phase D: Background Task Decoupling

#### Step D.1: Week 4 (Parallel) — Background Task Refactoring
**Estimate**: Small (30-60 min)  
**Agent**: sonnet  
**Parallel with**: Step C.2 (Wave 4)

**Success Criteria**:
- `backgroundLocationTask.ts` fully decoupled from module-level client creation
- `BackgroundLocationDeps` interface exported
- `createBackgroundLocationTask` factory exported
- `initBackgroundLocationTask` wiring function exported
- Production entry point calls `initBackgroundLocationTask` with real clients
- Test file uses fake dependencies

**Subtasks**:
1. Remove module-level `supabaseClient` and `orpcClient` creation
2. Define `BackgroundLocationDeps` interface with explicit types
3. Create `createBackgroundLocationTask(deps)` factory
4. Create `initBackgroundLocationTask(deps)` for production
5. Update `apps/native/src/app/_layout.tsx` to call `initBackgroundLocationTask`
6. Write tests with fake Supabase and fake oRPC clients
7. Verify `nx run @mirai-app/native:test` passes

**Blockers**:
- Step C.1 complete

**Risks**:
- Risk: Moving client creation may break background task registration
  - Mitigation: Ensure `initBackgroundLocationTask` is called exactly once at app startup
- Risk: Fake clients may drift from real client APIs
  - Mitigation: Keep fake clients minimal, match only used methods

**Verification**:
- **Level**: Medium
- **Threshold**: 4.0/5.0
- **Rubrics**:
  1. **Correctness** (35%): No module-level side effects, production wiring correct
  2. **Testing** (35%): Fake dependency tests pass, cover all paths
  3. **Quality** (20%): Clean interfaces, explicit DI
  4. **Completeness** (10%): All subtasks completed

---

### Phase E: Incremental Router-by-Router

#### Step E.1: Week 5 — Router Batch 1 (sponsor, challengeVote, submissionReport)
**Estimate**: Medium (30-60 min)  
**Agent**: sonnet  
**Parallel with**: None (Wave 5 - Sequential batches)

**Success Criteria**:
- `sponsor`, `challengeVote`, `submissionReport` routers refactored
- Pure functions extracted to `packages/common/src/core/`
- PGLite transaction tests added for each router
- Mock-heavy tests replaced with real-data tests
- `nx run @mirai-app/orpc:test` passes

**Subtasks**:
1. Apply pilot pattern to `sponsor` router
2. Apply pilot pattern to `challengeVote` router
3. Apply pilot pattern to `submissionReport` router
4. Write real-data tests for extracted pure functions
5. Write PGLite integration tests for mutations
6. Verify coverage 80%+ per router

**Blockers**:
- Step C.2 complete
- Step D.1 complete

**Risks**:
- Risk: Batch may be too large for one week
  - Mitigation: Start with simplest router in batch, defer if needed

**Verification**:
- **Level**: High
- **Threshold**: 4.0/5.0
- **Rubrics**:
  1. **Correctness** (30%): All routers function correctly after refactoring
  2. **Testing** (30%): Real-data tests pass, PGLite tests verify transactions
  3. **Quality** (20%): Clean extraction, no code duplication
  4. **Completeness** (10%): All subtasks completed
  5. **Integration** (10%): `nx run @mirai-app/orpc:test` passes

---

#### Step E.2: Week 6 — Router Batch 2 (challengeSubmission, reward, location)
**Estimate**: Medium (30-60 min)  
**Agent**: sonnet  
**Parallel with**: None (Wave 6)

**Success Criteria**:
- `challengeSubmission`, `reward`, `location` routers refactored
- Pure functions extracted and tested
- PGLite transaction tests added
- Coverage 80%+ per router
- `nx run @mirai-app/orpc:test` passes

**Subtasks**:
1. Apply pilot pattern to `challengeSubmission` router
2. Apply pilot pattern to `reward` router
3. Apply pilot pattern to `location` router
4. Write real-data tests and PGLite tests
5. Verify coverage thresholds

**Blockers**:
- Step E.1 complete

**Risks**: None (pattern proven)

**Verification**:
- **Level**: High
- **Threshold**: 4.0/5.0
- **Rubrics**:
  1. **Correctness** (30%): All routers function correctly
  2. **Testing** (30%): Real-data and PGLite tests pass
  3. **Quality** (20%): Clean extraction
  4. **Completeness** (10%): All subtasks completed
  5. **Integration** (10%): Test suite passes

---

#### Step E.3: Week 7 — Router Batch 3 (group, challenge, storage)
**Estimate**: Medium (30-60 min)  
**Agent**: sonnet  
**Parallel with**: None (Wave 7)

**Success Criteria**:
- `group`, `challenge`, `storage` routers refactored
- Pure functions extracted and tested
- PGLite transaction tests added
- Coverage 80%+ per router
- `nx run @mirai-app/orpc:test` passes

**Subtasks**:
1. Apply pilot pattern to `group` router
2. Apply pilot pattern to `challenge` router
3. Apply pilot pattern to `storage` router
4. Write real-data tests and PGLite tests
5. Verify coverage thresholds

**Blockers**:
- Step E.2 complete

**Verification**:
- **Level**: High
- **Threshold**: 4.0/5.0

---

#### Step E.4: Week 8 — Router Batch 4 (notificationDelivery, notificationSchedule, notificationSender)
**Estimate**: Medium (30-60 min)  
**Agent**: sonnet  
**Parallel with**: None (Wave 8)

**Success Criteria**:
- `notificationDelivery`, `notificationSchedule`, `notificationSender` routers refactored
- Pure functions extracted and tested
- PGLite transaction tests added
- Coverage 80%+ per router
- `nx run @mirai-app/orpc:test` passes

**Subtasks**:
1. Apply pilot pattern to `notificationDelivery` router
2. Apply pilot pattern to `notificationSchedule` router
3. Apply pilot pattern to `notificationSender` router
4. Write real-data tests and PGLite tests
5. Verify coverage thresholds

**Blockers**:
- Step E.3 complete

**Verification**:
- **Level**: High
- **Threshold**: 4.0/5.0

---

#### Step E.5: Week 9 — Router Batch 5 (coinTransaction, activityFeed, trip)
**Estimate**: Medium (30-60 min)  
**Agent**: sonnet  
**Parallel with**: None (Wave 9)

**Success Criteria**:
- `coinTransaction`, `activityFeed`, `trip` routers refactored
- Pure functions extracted and tested
- PGLite transaction tests added
- Coverage 80%+ per router
- `nx run @mirai-app/orpc:test` passes

**Subtasks**:
1. Apply pilot pattern to `coinTransaction` router
2. Apply pilot pattern to `activityFeed` router
3. Apply pilot pattern to `trip` router
4. Write real-data tests and PGLite tests
5. Verify coverage thresholds

**Blockers**:
- Step E.4 complete

**Verification**:
- **Level**: High
- **Threshold**: 4.0/5.0

---

#### Step E.6: Week 10 — Router Batch 6 (user, notifications)
**Estimate**: Large (60-120 min)  
**Agent**: opus  
**Parallel with**: None (Wave 10 - Most complex routers)

**Success Criteria**:
- `user` router (508-line mutations) refactored
- `notifications` router (most complex) refactored
- Pure functions extracted and tested
- PGLite transaction tests added
- Coverage 80%+ per router
- `nx run @mirai-app/orpc:test` passes

**Subtasks**:
1. Extract pure functions from `user` router mutations
2. Extract pure functions from `notifications` router
3. Write real-data tests for all extractions
4. Write PGLite transaction tests for complex mutations
5. Verify coverage thresholds

**Blockers**:
- Step E.5 complete

**Risks**:
- Risk: `user` router is the most complex (508-line mutations)
  - Mitigation: Extract in multiple sub-steps, test each extraction
- Risk: `notifications` router may have complex async logic
  - Mitigation: Focus on pure logic extraction, keep async in shell

**Verification**:
- **Level**: Panel
- **Threshold**: 4.5/5.0
- **Rubrics**:
  1. **Correctness** (25%): Most complex routers refactored correctly
  2. **Testing** (25%): All real-data and PGLite tests pass
  3. **Quality** (20%): No regression in complex logic
  4. **Completeness** (20%): All subtasks completed
  5. **Integration** (10%): Full orpc test suite passes

---

### Phase F: QueryProvider Decomposition

#### Step F.1: Week 11 — Simplify vitest.setup.ts
**Estimate**: Small (30-60 min)  
**Agent**: sonnet  
**Parallel with**: None (Wave 11)

**Success Criteria**:
- `packages/orpc/vitest.setup.ts` reduced from 858 to <200 lines
- `createMockDb()`, `createMockContext()`, manual mock construction deleted
- Shared mock utilities imported from `packages/common/src/test-utils/`
- `nx run @mirai-app/orpc:test` passes

**Subtasks**:
1. Identify all mock construction in `vitest.setup.ts`
2. Delete `createMockDb()` and `createMockContext()`
3. Replace manual mocks with shared utilities
4. Verify line count <200
5. Run test suite

**Blockers**:
- Step E.6 complete

**Risks**:
- Risk: Deleting mocks may break existing tests that haven't been rewritten
  - Mitigation: Only delete mocks after their tests are rewritten

**Verification**:
- **Level**: Medium
- **Threshold**: 4.0/5.0
- **Rubrics**:
  1. **Correctness** (30%): Setup file <200 lines, no broken tests
  2. **Completeness** (30%): All manual mocks replaced
  3. **Quality** (20%): Clean imports from shared
  4. **Integration** (20%): Test suite passes

---

#### Step F.2: Week 12 — QueryProvider Decomposition
**Estimate**: Medium (30-60 min)  
**Agent**: sonnet  
**Parallel with**: None (Wave 12)

**Success Criteria**:
- `query-client-factory.ts` extracted — pure function creating QueryClient
- `auth-token-provider.tsx` extracted — watches auth state, syncs token
- `use-websocket.ts` extracted — manages WebSocket connection lifecycle
- `use-unauthorized-handler.ts` extracted — watches for 401 errors, triggers sign-out
- `query-client.tsx` rewritten as composition (~50 lines)
- Tests written for each extracted piece
- `nx run @mirai-app/orpc:test` passes

**Subtasks**:
1. Extract `createQueryClient` to `query-client-factory.ts`
2. Extract auth token sync to `auth-token-provider.tsx`
3. Extract WebSocket lifecycle to `use-websocket.ts`
4. Extract unauthorized handler to `use-unauthorized-handler.ts`
5. Rewrite `query-client.tsx` as composition of extracted pieces
6. Write tests for each extracted piece
7. Verify test suite passes

**Blockers**:
- Step F.1 complete

**Risks**:
- Risk: WebSocket testing may require fake server
  - Mitigation: Test hook state transitions, not actual socket
- Risk: Auth token sync may have timing issues
  - Mitigation: Test with controlled session state

**Verification**:
- **Level**: High
- **Threshold**: 4.0/5.0
- **Rubrics**:
  1. **Correctness** (30%): All extracted pieces work correctly
  2. **Testing** (30%): Tests for each piece pass
  3. **Quality** (20%): QueryProvider <50 lines, clean composition
  4. **Completeness** (10%): All subtasks completed
  5. **Integration** (10%): Test suite passes

---

### Phase G: Native Hook Cleanup

#### Step G.1: Week 13 — MSW Setup for Native
**Estimate**: Medium (30-60 min)  
**Agent**: sonnet  
**Parallel with**: None (Wave 13)

**Success Criteria**:
- MSW configured in `apps/native/src/test-utils/msw/server.ts`
- 5-10 hook tests rewritten to use MSW instead of `vi.mock()`
- `apps/native/jest.setup.js` updated with MSW server lifecycle
- `nx run @mirai-app/native:test` passes

**Subtasks**:
1. Install MSW dependencies (`msw` package)
2. Create `apps/native/src/test-utils/msw/server.ts`
3. Define handlers for common oRPC endpoints
4. Update `jest.setup.js` with `beforeAll(() => server.listen())`
5. Rewrite 5-10 hook tests with MSW
6. Verify test suite passes

**Blockers**:
- Step F.2 complete

**Risks**:
- Risk: MSW may not work well with React Native's networking
  - Mitigation: Use `msw/native` for React Native support
- Risk: Rewriting tests may take longer than expected
  - Mitigation: Start with 5, expand to 10 if time permits

**Verification**:
- **Level**: High
- **Threshold**: 4.0/5.0
- **Rubrics**:
  1. **Correctness** (30%): MSW intercepts requests correctly
  2. **Testing** (30%): Rewritten tests pass, no internal module mocking
  3. **Quality** (20%): Clean MSW setup, reusable handlers
  4. **Completeness** (10%): 5-10 tests rewritten
  5. **Integration** (10%): Test suite passes

---

#### Step G.2: Week 14 — Native Hook + Component Tests
**Estimate**: Medium (30-60 min)  
**Agent**: sonnet  
**Parallel with**: None (Wave 14)

**Success Criteria**:
- Remaining hook tests rewritten with MSW (60-80% total)
- Component mock tests replaced with behavior tests
- `testID` added to components where needed
- `nx run @mirai-app/native:test` passes

**Subtasks**:
1. Rewrite remaining hook tests with MSW
2. Replace `expect(screen.getByTestId('sidebar-mock')).toBeInTheDocument()` with behavior tests
3. Add `testID` to components lacking semantic accessibility handles
4. Delete tests that verify mock presence
5. Verify test suite passes

**Blockers**:
- Step G.1 complete

**Risks**:
- Risk: Component tests may require significant DOM changes
  - Mitigation: Add accessibility roles first, then test by role

**Verification**:
- **Level**: High
- **Threshold**: 4.0/5.0
- **Rubrics**:
  1. **Correctness** (30%): Component tests verify behavior
  2. **Testing** (30%): 60-80% of hook tests use MSW
  3. **Quality** (20%): No mock-presence tests remaining
  4. **Completeness** (10%): All subtasks completed
  5. **Integration** (10%): Test suite passes

---

#### Step G.3: Week 15 — Cleanup & Documentation
**Estimate**: Small (30-60 min)  
**Agent**: haiku  
**Parallel with**: None (Wave 15 - Final)

**Success Criteria**:
- Dead code removed (unused imports, unreachable code, redundant tests)
- `docs/conventions/testing.md` updated with new patterns
- Per-package `AGENTS.md` files updated with testing standards
- `nx run-many -t test` passes from root
- Coverage thresholds verified
- New developer can write test in <5 minutes

**Subtasks**:
1. Run `nx run-many -t test` and verify all pass
2. Run `nx run-many -t lint` and verify no issues
3. Run `nx run-many -t typecheck` and verify no errors
4. Check coverage reports meet thresholds
5. Remove dead code (unused imports, unreachable code)
6. Update `docs/conventions/testing.md`
7. Update per-package `AGENTS.md` files
8. Verify total test execution time < 3 minutes

**Blockers**:
- Step G.2 complete

**Risks**:
- Risk: Dead code removal may break something unexpectedly
  - Mitigation: Run full test suite after each removal

**Verification**:
- **Level**: Panel
- **Threshold**: 4.5/5.0
- **Rubrics**:
  1. **Correctness** (20%): All tests pass, no lint/type errors
  2. **Testing** (20%): Coverage thresholds met, execution time < 3 min
  3. **Quality** (20%): Clean codebase, no dead code
  4. **Completeness** (20%): All documentation updated
  5. **Integration** (20%): Full pipeline works end-to-end

---

## Verification Summary

| Step | Description | Level | Threshold | Judge Count | Primary Rubrics |
|------|-------------|-------|-----------|-------------|-----------------|
| A.1 | Week 1 — Pure Function Extraction (Part 1) | High | 4.0/5.0 | 2 | Correctness, Testing |
| A.2 | Week 2 — Pure Function Extraction (Part 2) | High | 4.0/5.0 | 2 | Correctness, Testing, Integration |
| B.1 | Week 2 — Test Infrastructure Cleanup | Medium | 4.0/5.0 | 1 | Correctness, Completeness, Quality |
| C.1 | Week 3 — Pilot Router (Part 1) | High | 4.0/5.0 | 2 | Correctness, Testing |
| C.2 | Week 4 — Pilot Router (Part 2) + Background | High | 4.0/5.0 | 2 | Correctness, Testing, Quality |
| D.1 | Week 4 — Background Task Decoupling | Medium | 4.0/5.0 | 1 | Correctness, Testing, Quality |
| E.1 | Week 5 — Router Batch 1 | High | 4.0/5.0 | 2 | Correctness, Testing |
| E.2 | Week 6 — Router Batch 2 | High | 4.0/5.0 | 2 | Correctness, Testing |
| E.3 | Week 7 — Router Batch 3 | High | 4.0/5.0 | 2 | Correctness, Testing |
| E.4 | Week 8 — Router Batch 4 | High | 4.0/5.0 | 2 | Correctness, Testing |
| E.5 | Week 9 — Router Batch 5 | High | 4.0/5.0 | 2 | Correctness, Testing |
| E.6 | Week 10 — Router Batch 6 (user, notifications) | Panel | 4.5/5.0 | 3 | All categories |
| F.1 | Week 11 — Simplify vitest.setup.ts | Medium | 4.0/5.0 | 1 | Correctness, Completeness |
| F.2 | Week 12 — QueryProvider Decomposition | High | 4.0/5.0 | 2 | Correctness, Testing, Quality |
| G.1 | Week 13 — MSW Setup for Native | High | 4.0/5.0 | 2 | Correctness, Testing |
| G.2 | Week 14 — Native Hook + Component Tests | High | 4.0/5.0 | 2 | Correctness, Testing |
| G.3 | Week 15 — Cleanup & Documentation | Panel | 4.5/5.0 | 3 | All categories |

**Legend**:
- **Level**: None / Low / Medium / High / Panel
- **Threshold**: Minimum score required (out of 5.0)
- **Judge Count**: Number of independent judges for verification
- **Rubrics**: Evaluation categories — Correctness, Completeness, Quality, Testing, Integration

---

## Sub-Agent Execution Directive

### Agent Type Assignments

| Step | Agent Type | Rationale |
|------|------------|-----------|
| G.3 | **haiku** | Documentation updates, low complexity |
| A.1, A.2, B.1, C.1, C.2, D.1, E.1-E.5, F.1, F.2, G.1, G.2 | **sonnet** | Medium complexity, requires reasoning, testing logic |
| E.6 | **opus** | High complexity, 508-line `user` router mutations, most critical path |

### Parallel Execution Waves

**Wave 1**: Step A.1 (Foundation — Week 1)  
**Wave 2**: Steps A.2, B.1 (Week 2 — parallel tracks)  
**Wave 3**: Step C.1 (Week 3 — pilot router)  
**Wave 4**: Steps C.2, D.1 (Week 4 — parallel tracks)  
**Wave 5**: Step E.1 (Week 5)  
**Wave 6**: Step E.2 (Week 6)  
**Wave 7**: Step E.3 (Week 7)  
**Wave 8**: Step E.4 (Week 8)  
**Wave 9**: Step E.5 (Week 9)  
**Wave 10**: Step E.6 (Week 10 — most complex)  
**Wave 11**: Step F.1 (Week 11)  
**Wave 12**: Step F.2 (Week 12)  
**Wave 13**: Step G.1 (Week 13)  
**Wave 14**: Step G.2 (Week 14)  
**Wave 15**: Step G.3 (Week 15 — final)

### Execution Rules

1. **Pre-execution Check**: Verify all "Parallel with" steps from previous waves are complete
2. **Dependency Gate**: Never start a step until ALL its blockers are satisfied
3. **Wave Synchronization**: Wait for entire wave to complete before starting dependent waves
4. **Quality Gate**: Each step must pass success criteria before marking complete
5. **Agent Selection**: Use assigned agent type — no substitutions without approval
6. **Incremental, Main-Branch-Green**: Each week ends with `nx run-many -t test` passing

### Critical Path

```
A.1 → A.2 → C.1 → C.2 → E.1 → E.2 → E.3 → E.4 → E.5 → E.6 → F.1 → F.2 → G.1 → G.2 → G.3
```

**Critical Path Duration**: ~15 weeks (incremental, one batch per week)  
**Wall Clock**: ~15 weeks (sequential by design, main-branch-green)  
**Parallelization**: Within each week, subtasks can parallelize; across weeks, sequential

### Synchronization Points

1. **Wave 1 → 2**: Wait for A.1 completion
2. **Wave 2 → 3**: Wait for BOTH A.2 AND B.1 completion
3. **Wave 4 → 5**: Wait for BOTH C.2 AND D.1 completion
4. **Wave 10 → 11**: Wait for E.6 completion
5. **Wave 12 → 13**: Wait for F.2 completion
6. **Wave 14 → 15**: Wait for G.2 completion

---

## Implementation Summary Table

| Phase | Step | Week | Description | Agent | Estimate | Dependencies | Parallel With |
|-------|------|------|-------------|-------|----------|--------------|---------------|
| A | A.1 | 1 | Pure Function Extraction (Part 1) | sonnet | Medium | None | None |
| A | A.2 | 2 | Pure Function Extraction (Part 2) | sonnet | Medium | A.1 | B.1 |
| B | B.1 | 2 | Test Infrastructure Cleanup | sonnet | Small | A.1 | A.2 |
| C | C.1 | 3 | Pilot Router (Part 1) | sonnet | Medium | A.2, B.1 | None |
| C | C.2 | 4 | Pilot Router (Part 2) | sonnet | Medium | C.1 | D.1 |
| D | D.1 | 4 | Background Task Decoupling | sonnet | Small | C.1 | C.2 |
| E | E.1 | 5 | Router Batch 1 (sponsor, challengeVote, submissionReport) | sonnet | Medium | C.2, D.1 | None |
| E | E.2 | 6 | Router Batch 2 (challengeSubmission, reward, location) | sonnet | Medium | E.1 | None |
| E | E.3 | 7 | Router Batch 3 (group, challenge, storage) | sonnet | Medium | E.2 | None |
| E | E.4 | 8 | Router Batch 4 (notificationDelivery, notificationSchedule, notificationSender) | sonnet | Medium | E.3 | None |
| E | E.5 | 9 | Router Batch 5 (coinTransaction, activityFeed, trip) | sonnet | Medium | E.4 | None |
| E | E.6 | 10 | Router Batch 6 (user, notifications) | opus | Large | E.5 | None |
| F | F.1 | 11 | Simplify vitest.setup.ts | sonnet | Small | E.6 | None |
| F | F.2 | 12 | QueryProvider Decomposition | sonnet | Medium | F.1 | None |
| G | G.1 | 13 | MSW Setup for Native | sonnet | Medium | F.2 | None |
| G | G.2 | 14 | Native Hook + Component Tests | sonnet | Medium | G.1 | None |
| G | G.3 | 15 | Cleanup & Documentation | haiku | Small | G.2 | None |

---

## Risk Summary

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| PGLite schema setup complexity | Medium | High | Use drizzle-kit push or manual schema creation |
| Most complex routers (user, notifications) have hidden dependencies | Medium | High | Extract incrementally, test after each extraction |
| MSW React Native compatibility issues | Medium | Medium | Use msw/native, test with real client stack |
| Moving mock factories breaks existing tests | Medium | Medium | Update imports gradually, verify after each move |
| Dead code removal breaks unexpected dependencies | Low | Medium | Run full test suite after each removal |
| Test coverage drops during migration | Low | High | Coverage ratchet: never drop below current level |
| Week 10 (user router) exceeds time estimate | Medium | High | Scope to essential extractions, defer edge cases |
| Test flakiness with real PGLite | Low | Medium | Use :memory: database, reset between tests |
| Developer resistance to new patterns | Low | Low | Document with examples, pair on first extraction |
| Mock-heavy tests not replaced before mocks deleted | Medium | High | Keep old tests running until new tests pass |

---

## Definition of Done Checklist

- [x] All 7 phases (A through G) complete across 15 weeks
- [x] All 17 implementation steps (A.1 through G.3) complete
- [x] All 10 functional acceptance criteria pass
- [x] All 7 non-functional acceptance criteria pass
- [x] All 19 routers refactored with pure functions + PGLite tests
- [x] `packages/orpc/vitest.setup.ts` reduced from 858 to <200 lines
- [x] `apps/native/jest.setup.js` reduced from 146 to ~100 lines
- [x] 27+ pure functions extracted to `packages/common/src/core/`
- [x] `backgroundLocationTask.ts` fully decoupled with DI
- [x] QueryProvider decomposed into 4 focused files
- [x] MSW configured for native tests, 60-80% of hook tests rewritten
- [x] Component tests verify behavior, not mock presence
- [x] `nx run-many -t test` passes from root
- [x] `nx run-many -t lint` passes from root
- [x] `nx run-many -t typecheck` passes from root
- [x] Coverage thresholds met (80%+) in all packages
- [x] Total test execution time < 3 minutes
- [x] Total source + test LOC reduced by ~5,000 lines
- [x] `docs/conventions/testing.md` updated with new patterns
- [x] Per-package `AGENTS.md` files updated with testing standards
- [x] New developer can write a test in <5 minutes without reading mock setup docs
- [x] No new `console.log` in production code
- [x] No `as any` or `@ts-ignore` added
- [x] Dead code removed (unused imports, unreachable code, redundant tests)
- [x] All 352 original tests either pass or have been intentionally replaced
- [x] `lsp_diagnostics` clean on all changed files
- [x] No regression in any existing functionality
