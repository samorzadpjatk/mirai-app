## Context

This is a Turborepo+Bun monorepo (`@mirai-app/monorepo`) with 5 apps and 7+ packages, all TypeScript. The current test coverage is 0% — zero test files exist. Vitest v4 and `@vitest/coverage-v8` are listed as devDependencies in 3 packages (`supabase`, `backend-server`, `notification-sender`) but only `packages/supabase` has a `vitest.config.ts` (with no tests to run). The `turbo.json` pipeline already defines a `test` task with `coverage/**` outputs, but nothing produces them.

Since the monorepo already uses Bun as its runtime, package manager, and script runner, Bun's native test runner (`bun test`) is the natural choice. It provides built-in `describe`/`test`/`expect` assertions, `mock()`/`spy()` mocking, and `--coverage` flag with V8 coverage — all without additional dependencies or configuration files.

The core business logic lives in:

- **`packages/trpc`** — 17 tRPC routers + 10+ utility modules (~14k lines)
- **`packages/auth`** — server & client auth (390 lines)
- **`packages/db`** — Prisma model wrappers (~67k lines, heavily auto-generated)
- **`packages/shared`** — Zustand stores, design tokens, storage utils
- **`packages/supabase`** — thin client wrapper (63 lines)

Apps are thin orchestration layers (`backend-server` = 131 lines, `notification-sender` = 178 lines) or UI-heavy (`web`, `native`) — lower testing priority.

## Goals / Non-Goals

**Goals:**

- Establish Bun's native test runner as the unified testing framework across the entire monorepo — including DOM/UI tests via Happy DOM (no Vitest needed anywhere)
- Achieve ≥80% line coverage and ≥75% branch coverage per package
- Prioritize testing pure functions and business logic (trpc utilities, auth, validation)
- Test all tRPC routers with mocked DB/auth dependencies
- Set up integration tests for the DB layer against a real PostgreSQL instance
- Enforce coverage thresholds in CI to prevent regressions

**Non-Goals:**

- 80% coverage for apps (`web`, `native`) in this change — UI component testing is deferred to a future change
- E2E testing (Playwright/Detox) — out of scope
- Snapshot testing for React components — deferred
- Performance/load testing — out of scope
- Testing the seed app — it's a one-time utility, not production code
- Removing Vitest entirely — all tests (unit, integration, DOM) use Bun's test runner with Happy DOM; any existing Vitest deps are removed

## Decisions

### D1: Bun test runner as primary framework

**Choice**: Bun's native test runner (`bun test`) as the sole testing framework for all test types — unit, integration, and DOM tests via Happy DOM.
**Rationale**: The monorepo already uses Bun as runtime and package manager. Bun's test runner has built-in `describe`/`test`/`expect`, `mock()`/`spy()` APIs, `--coverage` flag (V8), and native ESM/TypeScript support — zero config needed. Happy DOM provides browser API mocking (`document`, `window`, `location`) via `@happy-dom/global-registrator` with Bun's `preload` in `bunfig.toml`. This eliminates the need for Vitest entirely, reducing dependencies and configuration overhead.
**Compatibility note**: Bun's test runner natively supports Happy DOM for DOM testing. For React component tests (future scope), `@testing-library/react` can be used with Happy DOM via `bun test`. No Vitest or jsdom needed.
**Alternatives considered**: Vitest everywhere (adds unneeded deps and config), Jest (more config, worse ESM), Node test runner (no built-in coverage or mocking).

### D2: Shared test utilities package

**Choice**: Create `packages/test-utils` with shared mock factories, test helpers, and a `bunfig.toml` preset. No shared config factory needed — Bun reads `bunfig.toml` natively.
**Rationale**: Bun test runner is configured via `bunfig.toml` (not a JS config file). Each package gets its own minimal `bunfig.toml` for coverage thresholds and test file patterns. The `test-utils` package provides reusable mock factories (`createMockPrismaClient()`, `createMockContext()`) and test helpers, but not a Vitest-style config factory — that's not needed with Bun.
**Alternatives considered**: Vitest workspace mode (too coupled), shared `createVitestConfig()` (unnecessary with Bun's simpler config model).

### D3: Mock strategy for tRPC routers

**Choice**: Mock at the `packages/db` and `packages/auth` boundaries using Bun's `mock()` function. Create typed mock factories in `packages/test-utils` that produce fully-typed Prisma model mocks and auth context mocks.
**Rationale**: tRPC routers depend on DB and auth. Mocking at the boundary isolates router logic without test database coupling. Typed mock factories give autocomplete and type-safety for test authors. Bun's `mock()` API is equivalent to Vitest's `vi.fn()` for function mocking.
**Alternatives considered**: In-memory SQLite (different dialect from Postgres, Prisma schema incompatibilities), test database per test (too slow, flaky).

### D4: Integration test strategy for DB layer

**Choice**: Use a dedicated test PostgreSQL database (via Docker or Supabase test project) with Prisma migrate + seed. Run integration tests as a separate `test:db` script via Bun. Use transactions rolled back per test for isolation.
**Rationale**: Prisma model wrappers make DB calls that must be verified against real Postgres. Transaction rollback provides fast, isolated test runs without polluting the database.
**Alternatives considered**: Mock Prisma client (defeats the purpose — we need to verify real queries), in-memory SQLite (Prisma generates different SQL for different providers).

### D5: Coverage enforcement via bunfig.toml

**Choice**: Per-package `bunfig.toml` with `[test]` section defining `coverage` thresholds (80% lines, 75% branches). Fail `bun test --coverage` if thresholds not met. CI pipeline runs `turbo run test` and fails on any threshold breach.
**Rationale**: Bun's coverage is configured directly in `bunfig.toml` — no `vitest.config.ts` needed. Per-package thresholds give granular control and clear failure messages. Turborepo orchestrates parallel test runs across packages. V8 coverage is built into Bun.
**Alternatives considered**: Vitest `coverage.thresholds` in `vitest.config.ts` (adds config file complexity), monorepo-level aggregate threshold (masks under-covered packages).

### D6: Test file organization

**Choice**: Co-located `__tests__/` directories next to source files. E.g., `src/utils/storage.ts` → `src/utils/__tests__/storage.test.ts`.
**Rationale**: Colocation keeps tests discoverable and avoids long import paths. Default Bun test runner glob pattern (`**/*.test.{ts,tsx}`) matches this convention.
**Alternatives considered**: Top-level `test/` directory (separated from source, harder to maintain), single test file per package (doesn't scale).

### D7: DOM testing with Happy DOM

**Choice**: Use `@happy-dom/global-registrator` for all DOM/UI tests, preloaded via `bunfig.toml` `[test] preload = "./happydom.ts"`.
**Rationale**: Happy DOM implements browser APIs (`document`, `window`, `location`) in Node. Bun's test runner supports it natively via the `preload` directive in `bunfig.toml`. A single `happydom.ts` file at the monorepo root registers the global DOM APIs before any tests run. Packages needing DOM testing (e.g., `packages/web` for React component tests in a future change) simply import the shared `happydom.ts` setup.
**Future scope**: React component tests in `packages/web` or `packages/native` can use `@testing-library/react` with Happy DOM. No Vitest or jsdom needed.
**Alternatives considered**: jsdom (Bun doesn't support it; Happy DOM is faster and more compatible with Bun), Vitest + jsdom (adds unnecessary test framework dependency).

## Risks / Trade-offs

- **[Risk] Bun test runner API may differ from Vitest in edge cases** → Mitigation: Bun's `mock()`/`spy()`/`expect()` APIs cover the same ground as Vitest's. Document any API differences in `test-utils`. If an incompatibility is found, isolate the failing test in Vitest.
- **[Risk] Flaky integration tests from DB state** → Mitigation: Use transaction rollback per test. Add retry logic for connection failures in CI. Mark integration tests with `.db.test.ts` suffix and run them separately.
- **[Risk] Coverage threshold too aggressive for auto-generated Prisma code** → Mitigation: Exclude `packages/db/src/prisma/lib/models/` from coverage via `bunfig.toml` `coverage.exclude`. Only test custom model methods, not Prisma-generated CRUD.
- **[Risk] Mock drift — mocks diverge from real DB/auth interfaces** → Mitigation: Generate mock factories from Prisma schema types. Add a test that validates mock shapes match real interfaces (structural typing).
- **[Trade-off] Integration tests are slower than pure unit tests** → Mitigation: Separate `test:unit` (fast, no DB) and `test:db` (slower, needs Postgres) scripts. CI runs both; local dev defaults to unit only.
- **[Trade-off] 80% line / 75% branch may not catch all logic errors** → Mitigation: Focus test quality on boundary conditions and error paths, not just line coverage. Use mutation testing in a future change.
