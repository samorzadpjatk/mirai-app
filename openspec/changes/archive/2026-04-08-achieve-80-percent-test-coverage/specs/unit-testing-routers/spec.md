## ADDED Requirements

### Requirement: Unit tests for all tRPC routers

The system SHALL provide unit test suites for each of the 17 tRPC routers in `packages/trpc/src/routers/`, testing procedure definitions, input validation, authorization guards, and business logic with mocked DB and auth dependencies.

#### Scenario: Testing a public procedure that returns data

- **WHEN** a test calls a public tRPC procedure with valid input and a mocked DB that returns expected data
- **THEN** the procedure returns the data in the expected tRPC response format

#### Scenario: Testing input validation on a protected procedure

- **WHEN** a test calls a protected tRPC procedure with invalid input that violates the Zod schema
- **THEN** the procedure throws a tRPC BAD_REQUEST error with validation details

#### Scenario: Testing authorization guard on a moderator procedure

- **WHEN** a test calls a moderator-only procedure with a context mock that has a regular user role
- **THEN** the procedure throws a tRPC FORBIDDEN error

#### Scenario: Testing business logic with specific DB state

- **WHEN** a test calls a procedure that performs multiple DB operations in a specific order and provides a mocked Prisma client that simulates the expected DB state
- **THEN** the procedure completes successfully and the mock DB calls match the expected sequence and arguments

### Requirement: Router test pattern — mock isolation

Each tRPC router test suite SHALL create the tRPC caller using `createCallerFactory` with mocked context, ensuring tests are isolated from real DB, auth, and external service dependencies.

#### Scenario: Creating a test caller for a router

- **WHEN** a test creates a caller using `router.createCaller(mockContext)` where `mockContext` uses `createMockContext()`
- **THEN** the caller can invoke any router procedure, and all DB/auth calls are intercepted by the mock

#### Scenario: Verifying DB call arguments

- **WHEN** a test invokes a procedure that calls `prisma.user.findUnique` with specific query parameters
- **THEN** the test can assert that `mockPrisma.user.findUnique` was called with the expected arguments using `expect(fn).toHaveBeenCalledWith()`

### Requirement: Coverage of all 17 routers

The test suites SHALL cover the following routers, each with tests for major procedures: user, group, challenge, challengeSubmission, challengeVote, coin, coinTransaction, notifications, notificationSchedule, notificationDelivery, notificationSender, location, trip, storage, reward, activityFeed, and sponsor.

#### Scenario: Each router has a test file

- **WHEN** the test suite runs
- **THEN** every router in `packages/trpc/src/routers/` has a corresponding `__tests__/<router>.test.ts` file with at least one test per exported procedure
