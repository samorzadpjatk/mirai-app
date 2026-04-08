## ADDED Requirements

### Requirement: Shared test utilities package

The system SHALL provide a `@mirai-app/test-utils` package that exports typed mock factories (`createMockPrismaClient`, `createMockContext`) and shared test helpers for use across all packages in the monorepo.

#### Scenario: Package uses shared mock factories

- **WHEN** a test imports `createMockPrismaClient` or `createMockContext` from `@mirai-app/test-utils`
- **THEN** the imported functions produce properly typed mock objects compatible with Bun's `mock()` API

#### Scenario: Mock factory produces type-safe mocks

- **WHEN** a test calls `createMockPrismaClient()` with partial overrides
- **THEN** the returned object is fully typed against the Prisma client interface, and all non-overridden methods are defaulted to no-op mocks

### Requirement: Mock factory for Prisma DB layer

The system SHALL provide typed mock factories in `@mirai-app/test-utils` that produce fully-typed Prisma model mocks, enabling tRPC router tests to mock database calls without a real database connection.

#### Scenario: Creating a mock Prisma model

- **WHEN** a test calls `createMockPrismaClient()` from `@mirai-app/test-utils`
- **THEN** it returns a typed object with all Prisma model methods mocked as Bun `mock()` functions, matching the shape of the real Prisma client

#### Scenario: Overriding a specific model method

- **WHEN** a test calls `createMockPrismaClient({ user: { findMany: mock().mockResolvedValue([{ id: '1' }]) } })`
- **THEN** the returned mock has `prisma.user.findMany` returning the provided value while all other methods use default mocks

### Requirement: Mock factory for auth context

The system SHALL provide typed mock factories in `@mirai-app/test-utils` that produce tRPC context mocks with authenticated user information, enabling router tests to simulate various auth states.

#### Scenario: Creating an authenticated context mock

- **WHEN** a test calls `createMockContext({ userId: 'user-123', role: 'admin' })`
- **THEN** it returns a tRPC context object with the specified user ID and role, plus mocked DB and auth services

#### Scenario: Creating an unauthenticated context mock

- **WHEN** a test calls `createMockContext()` without user parameters
- **THEN** it returns a tRPC context object with no authenticated user, simulating public/anonymous access

### Requirement: Bun test runner configuration in every package and app

Every package and app in the monorepo with source code SHALL have a `bunfig.toml` with test configuration (coverage thresholds, file patterns) and a `package.json` with `test` and `test:coverage` scripts using `bun test`.

#### Scenario: Running tests for a single package

- **WHEN** a developer runs `bun test` in any package directory
- **THEN** Bun's test runner executes all test files matching `**/*.test.{ts,tsx}` and reports coverage against the 80%/75% threshold defined in that package's `bunfig.toml`

#### Scenario: Running tests across the monorepo

- **WHEN** a developer runs `turbo run test` from the monorepo root
- **THEN** Turborepo executes `bun test` for all packages in dependency order, collecting coverage artifacts from each

#### Scenario: Package needing DOM/Happy DOM support

- **WHEN** a package requires DOM APIs (e.g., `packages/web` for React component tests in a future change)
- **THEN** that package uses Happy DOM via the monorepo's shared `happydom.ts` preload, configured in `bunfig.toml` with `preload = ["../happydom.ts"]` (relative path from package root)
