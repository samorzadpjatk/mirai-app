## ADDED Requirements

### Requirement: Pure function testing pattern shall be documented and demonstrated

The system SHALL provide a documented pattern for testing pure functions (input → output, no side effects) using `apps/web/src/lib/fileValidation.ts` as the reference implementation.

#### Scenario: Pattern covers edge case testing

- **WHEN** documenting pure function testing pattern
- **THEN** it SHALL include examples of boundary value testing (zeros, negatives, empty inputs)
- **AND** it SHALL show how to test both valid and invalid inputs

#### Scenario: Pattern shows input/output table testing

- **WHEN** documenting pure function testing pattern
- **THEN** it SHALL demonstrate table-driven tests for functions with multiple input/output pairs
- **AND** it SHALL use descriptive test names that explain the scenario

#### Scenario: Pattern demonstrates no-mock philosophy

- **WHEN** documenting pure function testing pattern
- **THEN** it SHALL explicitly state that pure functions require no mocking
- **AND** it SHALL explain why this makes tests more reliable and faster

### Requirement: External dependency mocking pattern shall be documented

The system SHALL provide a documented pattern for mocking external dependencies (modules, browser APIs) using Bun's `mock()` function, demonstrated with `apps/backend-server/src/utils/headers.ts`.

#### Scenario: Pattern covers type-level mocking

- **WHEN** documenting external mocking pattern
- **THEN** it SHALL show how to create type-compatible mocks without importing full libraries
- **AND** it SHALL demonstrate using TypeScript's `satisfies` operator for type safety

#### Scenario: Pattern shows module boundary mocking

- **WHEN** documenting external mocking pattern
- **THEN** it SHALL demonstrate `mock.module()` for intercepting imports
- **AND** it SHALL explain when to mock modules vs. individual functions

#### Scenario: Pattern includes Fastify-specific examples

- **WHEN** documenting external mocking pattern for backend
- **THEN** it SHALL include examples for mocking Fastify request types
- **AND** it SHALL show how to create realistic header objects for testing

### Requirement: Async and timer testing pattern shall be documented

The system SHALL provide a documented pattern for testing asynchronous code and timers using fake timers, demonstrated with `apps/notification-sender/src/utils/scheduler.ts`.

#### Scenario: Pattern covers fake timer setup and teardown

- **WHEN** documenting async/timer testing pattern
- **THEN** it SHALL show how to enable fake timers before tests
- **AND** it SHALL demonstrate proper cleanup after tests to prevent leakage

#### Scenario: Pattern shows interval and timeout testing

- **WHEN** documenting async/timer testing pattern
- **THEN** it SHALL include examples of testing setInterval-based code
- **AND** it SHALL show how to advance time without real delays

#### Scenario: Pattern covers error handling in async code

- **WHEN** documenting async/timer testing pattern
- **THEN** it SHALL demonstrate testing async error scenarios
- **AND** it SHALL show how to verify that errors are caught and logged

#### Scenario: Pattern explains Bun-specific timer behavior

- **WHEN** documenting async/timer testing pattern
- **THEN** it SHALL note any Bun-specific behaviors or limitations with timers
- **AND** it SHALL compare to Jest's timer API if there are differences

### Requirement: React hook testing pattern shall be documented

The system SHALL provide a documented pattern for testing React hooks using Bun test with Happy DOM, demonstrated with `apps/web/src/hooks/useActiveTripId.ts`.

#### Scenario: Pattern shows Happy DOM setup for hooks

- **WHEN** documenting React hook testing pattern
- **THEN** it SHALL explain how Happy DOM globals are preloaded
- **AND** it SHALL show any additional setup needed for React specifically

#### Scenario: Pattern covers browser API mocking

- **WHEN** documenting React hook testing pattern
- **THEN** it SHALL demonstrate mocking window.location and localStorage
- **AND** it SHALL show how to reset mocks between tests

#### Scenario: Pattern includes SSR safety testing

- **WHEN** documenting React hook testing pattern
- **THEN** it SHALL include examples of testing server-side rendering scenarios
- **AND** it SHALL show how to simulate `typeof window === "undefined"`

#### Scenario: Pattern explains renderHook equivalent

- **WHEN** documenting React hook testing pattern
- **THEN** it SHALL provide a helper function or pattern for rendering hooks
- **AND** it SHALL explain why testing-library's renderHook may not work with Bun
