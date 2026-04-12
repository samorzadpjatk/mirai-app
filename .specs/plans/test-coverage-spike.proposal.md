---
title: "Test Coverage Spike"
type: proposal
status: done
created: "2026-04-08"
migrated_from: "openspec/changes/archive/2026-04-08-test-coverage-spike/proposal.md"
---

## Why

The codebase currently lacks comprehensive test coverage (estimated well below 80%), creating risk for regressions and slowing development velocity. While `packages/trpc` has 33 test files covering business logic, the `apps/` directory has nearly zero tests despite containing 432+ TypeScript files including critical React hooks, utilities, and backend infrastructure. This spike establishes testing patterns across the three Bun-testable apps (web, backend-server, notification-sender) to validate our hybrid testing approach (Bun for most apps, Jest for Expo native) before scaling to full 80% coverage.

## What Changes

- Add comprehensive unit tests for `apps/web/src/lib/fileValidation.ts` (pure utility functions)
- Add unit tests for `apps/backend-server/src/utils/headers.ts` (simple external type mocking)
- Add unit tests for `apps/notification-sender/src/utils/scheduler.ts` (async behavior, fake timers)
- Document established testing patterns for replication across the codebase
- Verify Bun test runner compatibility with Happy DOM for React components
- Fix existing broken tests in `packages/auth` (JWT decode issue)

**Note:** This spike intentionally excludes:

- Native app tests (requires Jest + jest-expo setup, planned separately)
- Database model tests (requires PostgreSQL, explicitly skipped per requirements)
- UI component tests (focused on logic/hooks/utilities for this phase)

## Capabilities

### New Capabilities

- `bun-testing-infrastructure`: Bun test runner configuration with Happy DOM for React components, coverage thresholds at 80% lines/75% branches
- `web-app-testing`: Testing patterns for Astro web app including pure utilities and React island components
- `backend-testing`: Testing patterns for Fastify backend utilities and services
- `test-patterns-documentation`: Reusable testing patterns for pure functions, external mocks, async/timers, and React hooks

### Modified Capabilities

- (None - this is a testing infrastructure spike that doesn't change existing behavior)

## Impact

**Affected Code:**

- `apps/web/src/lib/fileValidation.ts` - New test file
- `apps/backend-server/src/utils/headers.ts` - New test file
- `apps/notification-sender/src/utils/scheduler.ts` - New test file
- `packages/auth/src/__tests__/authServer.test.ts` - Fix broken JWT test
- Root `bunfig.toml` - Coverage thresholds already configured

**Dependencies:**

- Uses existing `packages/test-utils` for mocking infrastructure
- Leverages existing `@happy-dom/global-registrator` for DOM testing
- No new dependencies required (all testing tools already in monorepo)

**Systems:**

- CI/CD pipelines will need to run `bun test` across apps (already configured in package.json)
- Coverage reports generated automatically by Bun

**Success Criteria:**

- All 3 spike files achieve 100% line coverage
- Existing auth test fixed and passing
- Patterns documented for team replication
- Total project coverage increase measurable via `bun test --coverage`
