## ADDED Requirements

### Requirement: Unit tests for storage utility

The system SHALL provide unit tests for `packages/trpc/src/utils/storage.ts` covering all pure parsing and transformation functions.

#### Scenario: Parsing valid storage input

- **WHEN** a test provides valid input to each exported parsing function in `storage.ts`
- **THEN** the function returns the correctly parsed and transformed output

#### Scenario: Handling invalid storage input

- **WHEN** a test provides null, undefined, or malformed input to parsing functions
- **THEN** the function throws or returns the expected error/empty value per its documented behavior

### Requirement: Unit tests for location validation

The system SHALL provide unit tests for `packages/trpc/src/utils/location-validation.ts` covering Zod schema validation and Haversine distance calculation.

#### Scenario: Validating location input with Zod schemas

- **WHEN** a test provides valid and invalid location data to the Zod schemas
- **THEN** valid data parses successfully and invalid data produces Zod validation errors

#### Scenario: Calculating Haversine distance

- **WHEN** a test provides two coordinate pairs to the Haversine function
- **THEN** the function returns the correct distance in the expected unit

### Requirement: Unit tests for resilience utility

The system SHALL provide unit tests for `packages/trpc/src/utils/resilience.ts` covering retry and circuit-breaker logic.

#### Scenario: Successful operation after retries

- **WHEN** a test calls a resilient function that fails N times before succeeding
- **THEN** the function returns the successful result after the configured retry attempts

#### Scenario: Exhausted retries

- **WHEN** a test calls a resilient function that fails more times than the maximum retry count
- **THEN** the function throws the last encountered error

### Requirement: Unit tests for auth emails utility

The system SHALL provide unit tests for `packages/trpc/src/utils/authEmails.ts` covering email template generation and validation logic.

#### Scenario: Generating auth email content

- **WHEN** a test calls email generation functions with valid template parameters
- **THEN** the output contains the expected subject, body, and recipient information

#### Scenario: Handling missing or invalid email parameters

- **WHEN** a test calls email generation functions with missing required parameters
- **THEN** the function throws or returns an appropriate error

### Requirement: Unit tests for notification templates

The system SHALL provide unit tests for `packages/trpc/src/utils/notificationTemplates.ts` covering template rendering and variable substitution.

#### Scenario: Rendering notification template with variables

- **WHEN** a test provides a template and variable map to the rendering function
- **THEN** the output has all template variables replaced with the provided values

#### Scenario: Rendering template with missing variables

- **WHEN** a test provides a template with referenced variables not in the variable map
- **THEN** the function either leaves placeholders or throws, per its documented behavior

### Requirement: Unit tests for recurring challenges

The system SHALL provide unit tests for `packages/trpc/src/utils/recurringChallenges.ts` covering challenge scheduling, recurrence rules, and date calculations.

#### Scenario: Generating recurring challenge instances

- **WHEN** a test provides a recurring challenge definition with start date, frequency, and end condition
- **THEN** the function generates all expected challenge instances with correct dates

#### Scenario: Handling edge cases in recurrence

- **WHEN** a test provides edge-case inputs (timezones, month boundaries, leap years)
- **THEN** the recurrence logic produces correct results for each edge case

### Requirement: Unit tests for activity feed

The system SHALL provide unit tests for `packages/trpc/src/utils/activityFeed.ts` covering feed item creation, aggregation, and filtering.

#### Scenario: Creating activity feed items from events

- **WHEN** a test provides event data to the feed creation function
- **THEN** the function produces correctly structured feed items with proper timestamps and references

#### Scenario: Filtering and aggregating feed items

- **WHEN** a test provides a list of feed items with aggregation parameters
- **THEN** the function returns filtered and merged items per the aggregation rules

### Requirement: Unit tests for trip guards

The system SHALL provide unit tests for `packages/trpc/src/utils/tripGuards.ts` covering authorization checks for trip operations.

#### Scenario: Authorizing a trip owner

- **WHEN** a test evaluates a trip guard with a user who is the trip owner
- **THEN** the guard returns true/allows access

#### Scenario: Denying access to non-owner

- **WHEN** a test evaluates a trip guard with a user who is not the trip owner
- **THEN** the guard returns false/denies access with the appropriate error

### Requirement: Unit tests for notification schedule validation

The system SHALL provide unit tests for `packages/trpc/src/utils/notificactionSchedule-validation.ts` covering Zod schema validation for notification scheduling.

#### Scenario: Validating schedule input

- **WHEN** a test provides valid and invalid schedule data to the Zod schemas
- **THEN** valid data parses successfully and invalid data produces descriptive Zod errors

### Requirement: Unit tests for shared storage utilities

The system SHALL provide unit tests for `packages/shared/src/storage/standard.ts` covering path normalization and storage key generation.

#### Scenario: Normalizing storage paths

- **WHEN** a test provides various path strings (with slashes, without, with special characters)
- **THEN** the normalization function returns consistent, correctly formatted paths

#### Scenario: Generating storage keys

- **WHEN** a test provides entity identifiers and types to the key generation function
- **THEN** the function produces the expected storage key format
