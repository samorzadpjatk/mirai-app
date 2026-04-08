## ADDED Requirements

### Requirement: Notification sender core logic shall have comprehensive tests

The system SHALL provide 100% line coverage for the notification sender main logic in `apps/notification-sender/src/index.ts`, including Supabase realtime subscription and tRPC integration.

#### Scenario: Supabase realtime subscription is tested

- **WHEN** testing index.ts main function
- **THEN** Supabase channel subscription SHALL be established
- **AND** postgres_changes events SHALL be handled
- **AND** channel status changes SHALL be logged

#### Scenario: Notification INSERT handling is tested

- **WHEN** testing notification INSERT event handler
- **THEN** trackDeliveryStart SHALL be called
- **AND** sendMobileNotifications SHALL be called
- **AND** trackDeliveryComplete SHALL be called on success

#### Scenario: Delivery tracking error handling is tested

- **WHEN** testing delivery failure scenarios
- **THEN** trackDeliveryFailure SHALL be called on error
- **AND** errors SHALL be caught and logged
- **AND** processing SHALL continue for subsequent notifications

#### Scenario: Environment variable validation is tested

- **WHEN** testing with missing environment variables
- **THEN** appropriate errors SHALL be thrown
- **AND** missing TRPC_HOST SHALL be detected
- **AND** missing SUPABASE credentials SHALL be detected

#### Scenario: Graceful shutdown is tested

- **WHEN** testing SIGINT handler
- **THEN** Supabase channel SHALL be removed
- **AND** tRPC client cleanup SHALL be called
- **AND** process SHALL exit cleanly

### Requirement: Scheduler utility shall have comprehensive tests

The system SHALL provide 100% line coverage for `apps/notification-sender/src/utils/scheduler.ts` using fake timers.

#### Scenario: Scheduler lifecycle is fully tested

- **WHEN** testing Scheduler class
- **THEN** start() SHALL trigger immediate execution
- **AND** intervals SHALL run at specified frequency
- **AND** double-start SHALL log warning
- **AND** stop() SHALL clear interval
- **AND** isActive() SHALL return correct state

#### Scenario: Scheduler error handling is tested

- **WHEN** testing task failure scenarios
- **THEN** errors SHALL be caught and logged
- **AND** scheduler SHALL continue running
- **AND** subsequent intervals SHALL still execute

#### Scenario: Inactivity scheduler factory is tested

- **WHEN** testing createInactivityScheduler
- **THEN** configured Scheduler SHALL be returned
- **AND** check function SHALL be wrapped with logging
- **AND** default interval SHALL be 5 minutes
