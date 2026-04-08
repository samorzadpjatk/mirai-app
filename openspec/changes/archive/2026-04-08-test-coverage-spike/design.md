## Context

The Mirai App monorepo has a significant test coverage gap. While `packages/trpc` contains 33 test files covering business logic, the `apps/` directory (~432 TypeScript files) has minimal test coverage. Current infrastructure includes:

- **Bun test runner** with coverage thresholds configured in `bunfig.toml` (80% lines, 75% branches)
- **Happy DOM** configured for React component testing via `happydom.ts`
- **test-utils package** with mock Prisma client and tRPC context helpers
- **33 existing test files** in `packages/trpc` proving the setup works

**Current Testing Challenges:**

1. Native app requires Jest (Expo limitation), creating a hybrid testing environment
2. Database tests require PostgreSQL (port 5433), causing 30 test failures
3. No established patterns for mocking tRPC, React Query, or Fastify in Bun tests
4. JWT test in `packages/auth` fails due to environment-specific decoding issues

## Goals / Non-Goals

**Goals:**

- Establish 3 escalating-complexity testing patterns that can be replicated across the codebase
- Achieve 100% line coverage on 3 representative files (196 total lines of source code)
- Document reusable patterns for: pure functions, external type mocking, async/timers
- Fix existing broken auth test to restore baseline test health
- Validate Happy DOM compatibility with Bun for React hook testing

**Non-Goals:**

- Full 80% coverage of entire codebase (this is a spike, not the complete migration)
- Database model tests (requires PostgreSQL, explicitly out of scope)
- Native app Jest setup (planned as separate change)
- UI component snapshot testing (focused on logic/utilities/hooks)
- E2E or integration tests (unit tests only for this phase)

## Decisions

### 1. Hybrid Testing Approach: Bun for most, Jest for native

**Decision:** Use Bun test for all apps except `apps/native`, which requires Jest due to Expo constraints.

**Rationale:**

- Bun's test runner is faster and already configured in the monorepo
- Maintains consistency with existing `packages/trpc` tests (33 files using `bun:test`)
- Jest is only required for Expo-specific modules (jest-expo preset)

**Alternatives considered:**

- Convert everything to Jest: Rejected - slower, loses Bun's benefits
- Use Vitest: Rejected - adds another test runner when Bun already works

### 2. Test Location: Colocated `__tests__/` directories

**Decision:** Place tests in `__tests__/` subdirectories adjacent to source files.

**Rationale:**

- Matches existing pattern in `packages/trpc/src/utils/__tests__/`
- Keeps tests visible alongside code they test
- Easy import paths (relative imports work without path mapping)

**Example structure:**

```
src/
  utils/
    headers.ts
    __tests__/
      headers.test.ts
```

**Alternatives considered:**

- Top-level `tests/` directory: Rejected - harder to find tests for specific modules
- `.test.ts` suffix alongside source: Rejected - clutters directory listings

### 3. Coverage Scope: Testable code only

**Decision:** Target 80% coverage of "testable" code (utilities, hooks, stores, lib) not UI components or database models.

**Rationale:**

- UI components have diminishing returns on unit test investment
- Database models need integration tests (out of scope)
- 6,650 lines of testable logic is achievable target vs 20,000+ total lines

**Alternatives considered:**

- 80% of all lines: Rejected - forces testing UI components that change frequently
- 100% coverage mandate: Rejected - creates perverse incentives (testing for coverage not quality)

### 4. Mock Strategy: Minimal mocking, real implementations preferred

**Decision:** Mock at module boundaries (tRPC, Supabase) but use real implementations for utilities.

**Rationale:**

- `fileValidation.ts` requires no mocks - pure functions
- `headers.ts` needs Fastify type stubbing only
- `scheduler.ts` needs fake timers, not implementation mocking
- Reduces test fragility when internal implementations change

**Pattern examples:**

```typescript
// For tRPC hooks - mock the client
mock.module("@mirai-app/trpc/client", () => ({
  useTRPC: () => ({ ... }),
  useTRPCClient: () => ({ ... })
}));

// For Fastify types - type-level stub only
import type { FastifyRequest } from "fastify";
const mockHeaders: FastifyRequest["headers"] = { ... };
```

## Risks / Trade-offs

| Risk                                                  | Likelihood | Impact | Mitigation                                                 |
| ----------------------------------------------------- | ---------- | ------ | ---------------------------------------------------------- |
| Happy DOM doesn't support all React Native hooks      | Medium     | High   | Document limitations; use Jest for native-specific testing |
| Bun coverage reporting differs from industry standard | Low        | Low    | Verify coverage output format; adjust CI if needed         |
| Test patterns don't scale to complex hooks            | Medium     | Medium | Start with simple hooks; escalate complexity gradually     |
| Team adoption friction with hybrid setup              | Medium     | Medium | Clear documentation; code review checklists                |
| Fixing auth JWT test reveals deeper issues            | Medium     | Medium | Time-box investigation; document workarounds if needed     |

**Trade-offs:**

- **Coverage vs. Test value:** Targeting 80% may miss critical edge cases, but 100% creates maintenance burden
- **Bun vs. Jest:** Bun is faster but Jest has better IDE support; team must context-switch between runners
- **Colocated vs. separate:** Colocated tests improve discoverability but increase directory nesting

## Migration Plan

This spike doesn't require production deployment (no runtime code changes). For the follow-up full coverage effort:

**Phase 1 (This Spike):**

1. Create test files for 3 target files
2. Fix auth JWT test
3. Document patterns
4. Measure coverage delta

**Phase 2 (Post-Spike - Separate Change):**

1. Apply patterns to all hooks in `apps/native/src/hooks/` (47 files)
2. Apply patterns to all stores in `packages/shared/src/stores/` (4 files)
3. Test remaining utilities in `apps/web/src/lib/` (6 files)
4. Set up Jest for `apps/native` and begin hook testing there

**Rollback Strategy:**

- Tests are additive only - no production risk
- If patterns prove unworkable, delete test files, document learnings, adjust approach
- No database migrations or API changes to rollback

## Open Questions

1. **Auth JWT test fix:** Is the decode error environment-specific (Bun vs Node) or a test data issue?
2. **Happy DOM React Native compatibility:** Will `nativewind` or Expo modules cause issues even when mocking?
3. **Fake timers granularity:** Does Bun's `mock()` provide enough timer control for `scheduler.ts` intervals?
4. **Coverage aggregation:** Will `turbo run test --coverage` correctly aggregate across Bun and Jest (once native is ready)?
5. **CI integration:** Are coverage thresholds enforced in CI already, or do we need to add that?
