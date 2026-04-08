## ADDED Requirements

### Requirement: fastifyHeadersToFetchHeaders shall be fully tested

The system SHALL provide comprehensive unit tests for `apps/backend-server/src/utils/headers.ts`, achieving 100% line and branch coverage with minimal external mocking.

#### Scenario: Converts simple string header values

- **GIVEN** Fastify headers with single string values { "content-type": "application/json", "x-custom": "value" }
- **WHEN** fastifyHeadersToFetchHeaders is called
- **THEN** it SHALL return a Headers object with matching key-value pairs

#### Scenario: Handles array header values

- **GIVEN** Fastify headers with array values { "set-cookie": ["session=abc", "user=john"] }
- **WHEN** fastifyHeadersToFetchHeaders is called
- **THEN** it SHALL append each array value to the Fetch Headers (multi-value headers)

#### Scenario: Filters out undefined values

- **GIVEN** Fastify headers with undefined values { "content-type": "json", "x-missing": undefined }
- **WHEN** fastifyHeadersToFetchHeaders is called
- **THEN** the undefined key SHALL be excluded from the output Headers

#### Scenario: Handles empty headers object

- **GIVEN** Fastify headers is undefined or empty object
- **WHEN** fastifyHeadersToFetchHeaders is called
- **THEN** it SHALL return an empty Headers object

#### Scenario: Converts non-string values to strings

- **GIVEN** Fastify headers with numeric values { "content-length": 1024 }
- **WHEN** fastifyHeadersToFetchHeaders is called
- **THEN** the value SHALL be converted to string "1024"

### Requirement: Scheduler class shall be fully tested with fake timers

The system SHALL provide comprehensive unit tests for `apps/notification-sender/src/utils/scheduler.ts`, using fake timers to avoid real async delays, achieving 100% line and branch coverage.

#### Scenario: Scheduler starts and runs task immediately

- **GIVEN** a Scheduler instance with a mock task
- **WHEN** start() is called
- **THEN** the task SHALL run once immediately (within setTimeout 0)
- **AND** isActive() SHALL return true

#### Scenario: Scheduler runs task at regular intervals

- **GIVEN** a Scheduler with 1-minute interval
- **WHEN** start() is called and fake timers advance 1 minute
- **THEN** the task SHALL have been called twice (initial + one interval)

#### Scenario: Scheduler prevents double-start

- **GIVEN** a Scheduler that is already running
- **WHEN** start() is called again
- **THEN** it SHALL log a warning
- **AND** it SHALL not create additional intervals

#### Scenario: Scheduler stops cleanly

- **GIVEN** a running Scheduler
- **WHEN** stop() is called
- **THEN** the interval SHALL be cleared
- **AND** isActive() SHALL return false

#### Scenario: Stopping inactive scheduler is safe

- **GIVEN** a Scheduler that was never started
- **WHEN** stop() is called
- **THEN** it SHALL not throw or error
- **AND** isActive() SHALL remain false

#### Scenario: Scheduler catches and logs task errors

- **GIVEN** a Scheduler with a task that throws an error
- **WHEN** the task runs
- **THEN** the error SHALL be caught
- **AND** it SHALL be logged to console.error
- **AND** the scheduler SHALL continue running

#### Scenario: createInactivityScheduler factory works correctly

- **GIVEN** a check function and interval
- **WHEN** createInactivityScheduler is called
- **THEN** it SHALL return a configured Scheduler instance
- **AND** the scheduler SHALL wrap the check function with logging

### Requirement: Server configuration utilities shall be testable

The system SHALL ensure that `apps/backend-server/src/config.ts` can be tested without requiring environment variable setup, using dependency injection or mocking patterns.

#### Scenario: Config reads environment variables

- **GIVEN** environment variables are set (PORT, HOST, etc.)
- **WHEN** config module is imported
- **THEN** it SHALL export configuration values derived from env vars

#### Scenario: Config provides sensible defaults

- **GIVEN** environment variables are missing
- **WHEN** config module is imported
- **THEN** it SHALL provide sensible default values
- **AND** it SHALL not throw or crash
