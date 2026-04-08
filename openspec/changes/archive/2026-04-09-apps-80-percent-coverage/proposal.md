## Why

The codebase currently has minimal test coverage in the `apps/` directory despite having established testing infrastructure in `packages/`. With 432+ TypeScript files across 5 apps (native, web, backend-server, notification-sender, seed) and only the recent spike tests added, the project is vulnerable to regressions and slow to validate changes. Achieving 80% coverage on apps follows the successful spike patterns and provides confidence for ongoing development velocity.

## What Changes

- Add comprehensive unit tests to all Bun-testable apps to achieve 80% line coverage
- Implement Jest-based testing infrastructure for `apps/native` (Expo requirement)
- Apply testing patterns established in `test-coverage-spike`:
  - Pure function testing for utilities (fileValidation, storage helpers)
  - External mocking for Fastify and tRPC integration points
  - Fake timers for async/scheduler code
  - React hook testing with Happy DOM
- Create test infrastructure for `apps/web` (Astro + React islands)
- Create test infrastructure for `apps/backend-server` (Fastify + WebSocket)
- Create test infrastructure for `apps/notification-sender` (background worker)
- Document and enforce testing patterns through code review guidelines
- Fix remaining broken tests in `packages/auth` and other areas

**Explicitly Excluded:**

- Database model tests (requires PostgreSQL, skip per requirements)
- UI component snapshot testing (focused on logic/hooks/utilities)
- E2E testing (out of scope for unit test coverage)
- Coverage of `apps/seed` (one-time scripts, lower ROI)

## Capabilities

### New Capabilities

- `apps-web-testing-full`: Complete test coverage for Astro web app including all utilities, hooks, and React island components
- `apps-backend-testing-full`: Full test coverage for Fastify server including WebSocket handlers, middleware, and utilities
- `apps-notification-testing-full`: Test coverage for notification sender including scheduler and Supabase realtime integration
- `apps-native-jest-setup`: Jest + jest-expo configuration and test infrastructure for React Native app
- `apps-native-testing-full`: Test coverage for native app hooks, stores, services, and utilities (via Jest)
- `coverage-enforcement`: CI/CD integration enforcing 80% coverage threshold on PRs

### Modified Capabilities

- (None - this is a testing coverage initiative that doesn't change existing behavior)

## Impact

**Affected Code:**

- `apps/web/src/` - All hooks, utilities, lib functions, React island components (~104 files)
- `apps/backend-server/src/` - Server setup, utilities, configuration (~4 files + any new modules)
- `apps/notification-sender/src/` - Worker logic, scheduler, utilities (~2 files)
- `apps/native/src/` - Hooks (47 files), stores (13 files), services (6 files), utils (5 files)
- Root `bunfig.toml` - Coverage thresholds already configured
- `package.json` scripts - Test commands already exist

**New Files:**

- Approximately 80-100 new test files in `__tests__/` directories
- `apps/native/jest.config.js` - Jest configuration
- Testing pattern documentation

**Dependencies:**

- Uses `packages/test-utils` for mocking infrastructure
- Leverages `@happy-dom/global-registrator` for DOM testing
- Jest + jest-expo for native app testing
- No new production dependencies

**Systems:**

- CI/CD must run both `bun test` and `jest` (for native)
- Coverage reports aggregated from both runners
- Potential increase in CI time (mitigated by parallel test execution)

**Success Metrics:**

- 80% line coverage across all `apps/` directories (excluding seed)
- 75% branch coverage as configured in bunfig.toml
- All tests passing in CI (both Bun and Jest runners)
- Documented patterns enabling team to maintain coverage
