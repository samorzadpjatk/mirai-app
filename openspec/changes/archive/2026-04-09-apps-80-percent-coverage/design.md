## Context

The codebase has established testing infrastructure from the `test-coverage-spike` change:

- Bun test runner with Happy DOM for React testing
- 33 test files in `packages/trpc` proving the setup works
- `packages/test-utils` with mock Prisma client and tRPC context helpers
- Coverage thresholds configured at 80% lines, 75% branches in `bunfig.toml`

Current apps coverage state:

- `apps/web`: ~104 files, minimal tests (spike added fileValidation.ts tests)
- `apps/backend-server`: ~4 files, minimal tests (spike added headers.ts tests)
- `apps/notification-sender`: ~2 files, minimal tests (spike added scheduler.ts tests)
- `apps/native`: ~303 files, no tests (requires Jest + jest-expo)
- `apps/seed`: ~17 files, excluded from coverage goals

**Testable code inventory** (estimated ~6,650 lines):

- Native hooks (47 files): React Query + tRPC integration
- Native stores (13 files): Zustand state management
- Native services/utils (11 files): Background tasks, storage, location
- Web lib/hooks (13 files): Utilities and React islands
- Backend utilities (4 files): Fastify helpers, config
- Notification sender (2 files): Scheduler and worker logic

## Goals / Non-Goals

**Goals:**

- Achieve 80% line coverage on all testable code in `apps/` directory
- Establish Jest infrastructure for `apps/native` (Expo requirement)
- Apply proven patterns from spike: pure functions, mocking, timers, hooks
- Create reusable testing patterns documented for team
- Fix broken tests in `packages/auth` and other packages
- Integrate coverage enforcement into CI/CD pipeline

**Non-Goals:**

- Database model integration tests (requires PostgreSQL, skip per requirements)
- UI component snapshot testing (focused on logic/hooks/utilities)
- E2E or integration testing (unit tests only for coverage metric)
- Coverage of `apps/seed` (one-time scripts, excluded)
- 100% coverage (80% is the target threshold)
- Changing production code behavior (tests only, no refactors)

## Decisions

### 1. Hybrid Test Runner Architecture: Bun + Jest

**Decision:** Use Bun test for `apps/web`, `apps/backend-server`, `apps/notification-sender`; use Jest for `apps/native` only.

**Rationale:**

- Bun is already configured and proven in `packages/trpc` (33 working test files)
- Expo mandates Jest for React Native (jest-expo preset with native module mocking)
- Maintains consistency with existing monorepo setup
- Parallel test execution in CI mitigates runner diversity cost

**Implementation:**

- Root `package.json`: `"test": "turbo run test"` delegates to each app
- `apps/*/package.json`: Each app defines its own test command
- `apps/native/`: `"test": "jest"` with `jest.config.js` using `jest-expo` preset
- All others: `"test": "bun test"`

**Alternatives considered:**

- Convert everything to Jest: Rejected - slower, loses Bun's speed benefits, unnecessary work
- Use Vitest for native: Rejected - doesn't support Expo's native module mocking requirements

### 2. Test File Organization: Colocated `__tests__/` Pattern

**Decision:** Place tests in `__tests__/` subdirectories adjacent to source files.

**Rationale:**

- Matches existing pattern in `packages/trpc/src/utils/__tests__/` (proven successful)
- Keeps tests discoverable alongside code they test
- Relative imports work without complex path mapping
- Clear separation from source files in directory listings

**Structure:**

```
src/
  hooks/
    useGroups.ts
    __tests__/
      useGroups.test.ts
  utils/
    storage.ts
    __tests__/
      storage.test.ts
```

**Alternatives considered:**

- `*.test.ts` alongside source: Rejected - clutters src/ directories
- Top-level `tests/` directory: Rejected - harder to locate tests for specific modules

### 3. Coverage Strategy: Testable Code Only

**Decision:** Target 80% coverage of "testable" code (utilities, hooks, stores, services) excluding UI components and database models.

**Rationale:**

- ~6,650 lines of testable logic vs ~20,000 total lines (components, types, config)
- UI components have diminishing returns on unit test investment (change frequently, tested via E2E)
- Database models need integration tests (separate initiative, out of scope)
- 80% of testable code is achievable and meaningful

**What counts toward coverage:**

- ✅ Hooks with business logic (useGroups, useTrips, etc.)
- ✅ Pure utility functions (fileValidation, storage helpers)
- ✅ Store logic (Zustand stores, auth state)
- ✅ Service modules (backgroundLocation, scheduler)
- ✅ Backend utilities (headers, config, middleware)

**What does NOT count:**

- ❌ UI components (Button, Card, Modal)
- ❌ Page/route components (admin pages, tabs)
- ❌ Type definitions and interfaces
- ❌ Configuration files (tailwind.config, etc.)
- ❌ Database models and migrations

### 4. Mock Strategy: Boundary Mocking

**Decision:** Mock at architectural boundaries (tRPC, Supabase, Fastify, browser APIs) but use real implementations within modules.

**Rationale:**

- Reduces test fragility when internal implementations change
- Tests verify integration contracts, not internal details
- Faster than full integration tests
- Enables testing without database/external services

**Boundary mocks:**

```typescript
// tRPC client
mock.module("@mirai-app/trpc/client", () => ({
  useTRPC: () => ({ group: { getAll: { queryOptions: ... } } }),
  useTRPCClient: () => ({ group: { getAll: { query: mock() } } })
}));

// React Query
mock.module("@tanstack/react-query", () => ({
  useInfiniteQuery: () => ({ data, isLoading, fetchNextPage: mock() })
}));

// Browser APIs (Happy DOM)
window.localStorage = { getItem: mock(), setItem: mock() };
window.location = { search: "?tripId=abc" };
```

### 5. Testing Priority: Risk-Based Order

**Decision:** Implement tests in risk/priority order: shared utilities → backend → web → native.

**Rationale:**

- Shared utilities (`packages/shared`) affect all apps - highest impact
- Backend failures affect all clients - high risk
- Web app has fewer files than native - quicker wins
- Native requires Jest setup - additional complexity

**Phase Order:**

1. **Phase 1:** `packages/shared` stores and utilities (shared foundation)
2. **Phase 2:** `apps/backend-server` and `apps/notification-sender` (infrastructure)
3. **Phase 3:** `apps/web` lib and hooks (Astro + React islands)
4. **Phase 4:** `apps/native` Jest setup + hooks (highest complexity)
5. **Phase 5:** `apps/native` stores and services

## Risks / Trade-offs

| Risk                                                       | Likelihood | Impact | Mitigation                                                                                                           |
| ---------------------------------------------------------- | ---------- | ------ | -------------------------------------------------------------------------------------------------------------------- |
| Jest setup for native is more complex than anticipated     | Medium     | High   | Time-box Phase 4; if blocked, defer native to follow-up change                                                       |
| Happy DOM doesn't support all React Native patterns        | Medium     | High   | Use minimal DOM mocking; rely on Jest's native module mocking for RN APIs                                            |
| Coverage gaps in complex hooks (useInfiniteQuery patterns) | Medium     | Medium | Document patterns; pair programming for difficult cases; accept <80% for specific files if logic is tested elsewhere |
| CI time increases significantly                            | Medium     | Medium | Parallel test execution via Turbo; optimize slow tests; monitor and adjust                                           |
| Team adoption friction with two test runners               | Medium     | Medium | Clear documentation; code review templates; lunch-and-learn sessions                                                 |
| Tests break frequently with dependency updates             | Low        | Medium | Pin test dependency versions; run tests on dependency update PRs                                                     |
| 80% coverage metric creates perverse incentives            | Low        | High   | Code review emphasizes test quality over quantity; allow exceptions for justified cases                              |

**Trade-offs:**

- **Coverage vs. Maintenance:** 80% target may miss edge cases but avoids test maintenance burden of 100%
- **Bun vs. Jest:** Bun is faster but team must context-switch; Jest has better IDE/debugger support
- **Unit vs. Integration:** Unit tests are faster but don't catch integration issues; separate E2E initiative needed
- **Colocated vs. Separate:** Colocated improves discoverability but adds directory nesting

## Migration Plan

**Phase 1: Foundation (Week 1)**

- Fix broken tests in `packages/auth` (JWT decode issue)
- Verify `bunfig.toml` coverage thresholds active
- Document baseline coverage metrics
- Create `apps/native/jest.config.js` with jest-expo preset

**Phase 2: Shared Infrastructure (Week 1-2)**

- Test `packages/shared` stores (authStore, judgementStore, mapStore)
- Test `packages/shared` storage utilities
- Verify patterns work across both Bun and Jest contexts

**Phase 3: Backend & Worker (Week 2)**

- Complete `apps/backend-server` coverage (config, server setup, any new modules)
- Complete `apps/notification-sender` coverage (integration points, error handling)

**Phase 4: Web App (Week 2-3)**

- Test all `apps/web/src/lib/` utilities
- Test all `apps/web/src/hooks/` (useActiveTripId, admin hooks)
- Test React island components (LoginForm, LogoutButton)

**Phase 5: Native App Setup (Week 3)**

- Configure Jest with jest-expo preset
- Verify native module mocking works (expo-location, expo-notifications, etc.)
- Create first native test as proof of concept

**Phase 6: Native Hooks (Week 3-4)**

- Test all 47 hook files in `apps/native/src/hooks/`
- Focus on data fetching hooks (useGroups, useTrips, useChallenges)
- Mock heavy tRPC and React Query dependencies

**Phase 7: Native Stores & Services (Week 4-5)**

- Test 13 Zustand stores
- Test 6 services (backgroundLocation, storage, etc.)
- Test 5 utility modules

**Phase 8: CI/CD Integration (Week 5)**

- Add coverage check to CI pipeline
- Configure coverage reporting (badge, PR comments)
- Set up coverage delta checks (fail if coverage drops)

**Rollback Strategy:**

- Tests are additive only - no production risk
- If patterns prove unworkable, delete test files and document learnings
- Can disable coverage enforcement in CI without affecting production
- Each phase can be delivered independently; later phases optional

## Open Questions

1. **Jest configuration complexity:** Will jest-expo preset work out of the box with the monorepo structure, or require custom transformers?
2. **Native module mocking:** How extensive are the native module mocks needed? (expo-location, expo-notifications, expo-camera, etc.)
3. **Coverage aggregation:** How will we aggregate coverage reports from Bun and Jest into a single metric for CI?
4. **React Query testing:** Are there established patterns for testing useInfiniteQuery hooks, or will we need to invent them?
5. **Performance:** Will 80-100 new test files significantly slow CI? What's the threshold for concern?
6. **Test maintenance:** Who owns test maintenance when the underlying code changes? (Answer: same author as code change, via code review)
