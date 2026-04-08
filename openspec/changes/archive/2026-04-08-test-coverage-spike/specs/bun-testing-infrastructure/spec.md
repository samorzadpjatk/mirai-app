## ADDED Requirements

### Requirement: Bun test runner shall be configured with coverage thresholds

The system SHALL use Bun's built-in test runner for all testable apps except `apps/native`, with coverage thresholds enforced at 80% lines and 75% branches.

#### Scenario: Coverage thresholds are enforced

- **WHEN** running `bun test --coverage`
- **THEN** the test suite SHALL fail if line coverage falls below 80%
- **AND** the test suite SHALL fail if branch coverage falls below 75%

#### Scenario: Coverage configuration is centralized

- **WHEN** examining the monorepo root configuration
- **THEN** `bunfig.toml` SHALL contain the coverage threshold settings
- **AND** the configuration SHALL apply to all Bun test runs in the workspace

#### Scenario: Happy DOM is preloaded for React testing

- **WHEN** running tests that import React components or hooks
- **THEN** Happy DOM global registrator SHALL be preloaded before test execution
- **AND** `window`, `document`, and other DOM globals SHALL be available

### Requirement: Bun test files shall follow colocated directory pattern

The system SHALL place test files in `__tests__/` subdirectories adjacent to the source files they test, using the `.test.ts` or `.test.tsx` suffix.

#### Scenario: Test file location for utilities

- **WHEN** creating tests for `src/utils/headers.ts`
- **THEN** the test file SHALL be created at `src/utils/__tests__/headers.test.ts`

#### Scenario: Test file location for lib functions

- **WHEN** creating tests for `src/lib/fileValidation.ts`
- **THEN** the test file SHALL be created at `src/lib/__tests__/fileValidation.test.ts`

#### Scenario: Test imports use relative paths

- **WHEN** importing the source module from a test file
- **THEN** the import SHALL use relative path (e.g., `import { fn } from "../file"`)
- **AND** path mapping aliases SHALL be avoided in test imports to ensure clarity

### Requirement: Bun test shall support React component and hook testing

The system SHALL support testing React components and hooks using Bun test with Happy DOM, including proper cleanup after each test.

#### Scenario: React hook can be tested

- **WHEN** testing a custom hook that uses `useState` or `useEffect`
- **THEN** the hook SHALL render without errors in the test environment
- **AND** state updates SHALL be testable via act() or equivalent patterns

#### Scenario: Component DOM manipulation works

- **WHEN** testing a component that modifies the DOM
- **THEN** DOM operations SHALL work as expected
- **AND** cleanup between tests SHALL prevent state leakage
