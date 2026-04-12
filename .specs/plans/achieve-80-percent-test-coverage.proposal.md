---
title: "Achieve 80% Test Coverage"
type: proposal
status: done
created: "2026-04-08"
migrated_from: "openspec/changes/archive/2026-04-08-achieve-80-percent-test-coverage/proposal.md"
---

## Why

The monorepo has **zero test coverage** across all packages and apps — no test files, no coverage thresholds, and only a partial Vitest configuration in one package. This creates significant risk: business logic in tRPC routers (14k+ lines), auth (390 lines), and shared utilities has no verification. Bugs are caught only in production, and refactoring is unsafe. Establishing 80% coverage provides a safety net, enables confident refactoring, and enforces a testing culture from this point forward.

## What Changes

- **Use Bun's native test runner everywhere** — leverage `bun test` with built-in `describe`/`test`/`expect` and `mock()`/`spy()` APIs; use Happy DOM (`@happy-dom/global-registrator`) for DOM tests; no Vitest anywhere in the monorepo
- **Set coverage thresholds (80% lines, 75% branches)** — enforce minimums per package via `bunfig.toml` and Turborepo pipeline
- **Write unit tests for pure utility functions** — `storage.ts`, `location-validation.ts`, `resilience.ts`, `authEmails.ts`, `notificationTemplates.ts`, `recurringChallenges.ts`, `activityFeed.ts`, `tripGuards.ts`, `packages/shared/storage/standard.ts`
- **Write unit tests for auth logic** — `authServer.ts` (JWT decoding, role checking, user sync)
- **Write unit tests for tRPC routers** — mock DB and auth layers; test procedure definitions, input validation, and business logic in all 17 routers
- **Write integration tests for DB layer** — verify Prisma model wrappers against a test database
- **Add test scripts to all `package.json` files** — consistent `test` and `test:coverage` scripts using `bun test`
- **Update Turborepo pipeline** — include `test` task with proper dependency chain and coverage outputs
- **Add CI test step** — run tests with coverage on every PR; fail if thresholds are not met

## Capabilities

### New Capabilities

- `test-runner-setup`: Monorepo-wide Bun test runner configuration, shared test utilities, mock factories, and `bunfig.toml` presets
- `unit-testing-utilities`: Unit test suites for pure functions in trpc utils and shared packages
- `unit-testing-auth`: Unit test suites for auth package (JWT parsing, role checks, user sync)
- `unit-testing-routers`: Unit test suites for all 17 tRPC routers with mocked dependencies
- `integration-testing-db`: Integration tests for Prisma DB model wrappers
- `coverage-enforcement`: Coverage thresholds, Turborepo pipeline integration, and CI gate

### Modified Capabilities

_(No existing specs are being modified — this is all new.)_

## Impact

- **All packages and apps** — new `bunfig.toml` files, new `__tests__/` directories, updated `package.json` scripts
- **`packages/trpc`** — highest impact: 17 routers + 10+ utility modules need tests
- **`packages/auth`** — `authServer.ts` needs comprehensive auth tests
- **`packages/db`** — needs integration test setup with test database
- **`packages/supabase`** — existing partial Vitest config will be replaced with Bun test runner setup
- **`packages/shared`** — stores and utility functions need tests
- **Apps (`backend-server`, `notification-sender`, `web`, `native`)** — minimal impact; focus on critical integration paths
- **CI pipeline** — new test step with coverage enforcement
- **`turbo.json`** — updated `test` task with coverage outputs and dependency chain
