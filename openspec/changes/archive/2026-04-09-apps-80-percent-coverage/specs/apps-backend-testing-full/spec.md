## ADDED Requirements

### Requirement: Backend server utilities shall have comprehensive unit tests

The system SHALL provide 100% line coverage for all utility functions in `apps/backend-server/src/`, including headers conversion, configuration, and any middleware utilities.

#### Scenario: fastifyHeadersToFetchHeaders achieves full coverage

- **WHEN** testing headers.ts
- **THEN** string header conversion SHALL be tested
- **AND** array header handling SHALL be tested
- **AND** undefined value filtering SHALL be verified
- **AND** empty headers handling SHALL be tested
- **AND** non-string value conversion SHALL be tested

#### Scenario: Server configuration is tested

- **WHEN** testing config.ts
- **THEN** environment variable reading SHALL be tested
- **AND** default value handling SHALL be verified
- **AND** missing env var scenarios SHALL be tested

#### Scenario: Server factory function is tested

- **WHEN** testing server.ts createServer function
- **THEN** server initialization SHALL be testable
- **AND** middleware registration SHALL be verified
- **AND** WebSocket setup SHALL be tested with mocks

### Requirement: Backend server routes and handlers shall be testable

The system SHALL ensure Fastify routes and tRPC handlers can be tested with mocked request/response contexts.

#### Scenario: Health check endpoint is tested

- **WHEN** testing health endpoint
- **THEN** it SHALL return "OK" response
- **AND** correct status code SHALL be verified

#### Scenario: CORS configuration is tested

- **WHEN** testing CORS middleware
- **THEN** correct headers SHALL be set in development
- **AND** production CORS SHALL be configurable

#### Scenario: WebSocket upgrade handling is tested

- **WHEN** testing WebSocket connections
- **THEN** upgrade requests SHALL be handled
- **AND** connection parameters SHALL be parsed

### Requirement: Backend error handling is tested

The system SHALL provide tests for error handling middleware and logging.

#### Scenario: tRPC error handler is tested

- **WHEN** testing tRPC onError handler
- **THEN** errors SHALL be logged correctly
- **AND** error paths SHALL be tracked
- **AND** production vs dev error handling SHALL differ

#### Scenario: Uncaught exceptions are handled

- **WHEN** testing server error handling
- **THEN** uncaught exceptions SHALL not crash server
- **AND** appropriate error responses SHALL be sent
