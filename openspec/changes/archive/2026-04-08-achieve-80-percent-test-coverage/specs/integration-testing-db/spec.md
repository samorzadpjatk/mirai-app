## ADDED Requirements

### Requirement: Integration test environment setup

The system SHALL provide a test PostgreSQL database and Prisma migration setup that integration tests can use, configured via a `test:db` script that starts the database, runs migrations, and tears down after the test run.

#### Scenario: Setting up test database for integration tests

- **WHEN** a developer runs `bun run test:db` in the `packages/db` directory
- **THEN** a PostgreSQL test database is provisioned, Prisma migrations are applied, and integration tests run against it with transaction-based isolation

#### Scenario: Tearing down test database

- **WHEN** integration tests complete (success or failure)
- **THEN** the test database connection is closed and any provisioned resources are cleaned up

### Requirement: Transaction-based test isolation

Each integration test SHALL run within a database transaction that is rolled back after the test, ensuring no test data persists between runs.

#### Scenario: Test data does not leak between tests

- **WHEN** test A inserts a user record and test B runs after test A
- **THEN** test B does not see the user record created by test A

#### Scenario: Transaction rollback on test failure

- **WHEN** a test fails with an assertion error after inserting data
- **THEN** the transaction is still rolled back and no data persists in the database

### Requirement: Integration tests for Prisma model CRUD operations

The system SHALL provide integration tests for each Prisma model wrapper in `packages/db/src/prisma/lib/models/`, testing create, read, update, and delete operations against a real PostgreSQL database.

#### Scenario: Creating and reading a model record

- **WHEN** a test creates a new record using a model's create method and then reads it using findUnique
- **THEN** the returned record matches the input data with all default fields populated

#### Scenario: Updating a model record

- **WHEN** a test updates an existing record's field and then reads it
- **THEN** the returned record reflects the updated value while preserving other fields

#### Scenario: Deleting a model record

- **WHEN** a test deletes a record by ID and then attempts to find it
- **THEN** the find operation returns null

### Requirement: Integration tests for model relations and constraints

The system SHALL provide integration tests verifying foreign key constraints, cascading deletes, and relation queries work correctly.

#### Scenario: Cascade delete removes related records

- **WHEN** a test deletes a parent record that has cascade-delete configured
- **THEN** all child records with foreign keys pointing to the parent are also deleted

#### Scenario: Foreign key constraint prevents orphan records

- **WHEN** a test attempts to create a child record referencing a non-existent parent
- **THEN** the database raises a foreign key constraint error that Prisma surfaces as a known error
