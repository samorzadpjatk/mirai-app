## ADDED Requirements

### Requirement: All native app hooks shall have comprehensive unit tests

The system SHALL provide 80%+ line coverage for all 47 hook files in `apps/native/src/hooks/`, testing React Query integration, tRPC calls, and state management.

#### Scenario: Group-related hooks are tested

- **WHEN** testing useGroups.ts
- **THEN** infinite query pagination SHALL be tested
- **AND** search filtering SHALL be tested
- **AND** loading states SHALL be verified

#### Scenario: Trip-related hooks are tested

- **WHEN** testing useTrips.ts, useTripDetails.ts, useTripResources.ts
- **THEN** data fetching SHALL be tested with mocked tRPC
- **AND** caching behavior SHALL be verified
- **AND** error handling SHALL be tested

#### Scenario: Challenge-related hooks are tested

- **WHEN** testing useChallenges.ts, useChallengeDetails.ts, useChallengeCapture.ts
- **THEN** challenge data fetching SHALL be tested
- **AND** submission handling SHALL be tested
- **AND** staff voting hooks SHALL be tested

#### Scenario: Location-related hooks are tested

- **WHEN** testing useLocationPermissions.ts, useMapLocationStream.ts
- **THEN** Expo location permissions SHALL be mocked
- **AND** location updates SHALL be tested
- **AND** background location handling SHALL be tested

#### Scenario: Notification-related hooks are tested

- **WHEN** testing useNotifications.ts, useNotificationSchedules.ts, useAutoPushSubscription.ts
- **THEN** push notification permissions SHALL be mocked
- **AND** notification scheduling SHALL be tested
- **AND** subscription management SHALL be tested

#### Scenario: Auth and user hooks are tested

- **WHEN** testing useSupabase.ts, group management hooks
- **THEN** Supabase auth SHALL be mocked
- **AND** user state SHALL be tested
- **AND** group CRUD operations SHALL be tested

#### Scenario: File and admin hooks are tested

- **WHEN** testing useFileUpload.ts, useFileDownload.ts, admin hooks
- **THEN** file upload progress SHALL be tested
- **AND** download handling SHALL be tested
- **AND** admin operations SHALL be tested with role mocks

### Requirement: All native app stores shall have comprehensive unit tests

The system SHALL provide 80%+ line coverage for all 13 Zustand store files in `apps/native/src/stores/` (or shared stores used by native).

#### Scenario: Auth store is tested

- **WHEN** testing authStore
- **THEN** sign in actions SHALL be tested
- **AND** sign out actions SHALL be tested
- **AND** session refresh SHALL be tested
- **AND** user state management SHALL be verified

#### Scenario: Map store is tested

- **WHEN** testing mapStore
- **THEN** user location tracking SHALL be tested
- **AND** selected user management SHALL be tested
- **AND** map state updates SHALL be verified

#### Scenario: Judgement store is tested

- **WHEN** testing judgementStore
- **THEN** voting state SHALL be tested
- **AND** submission selection SHALL be tested
- **AND** optimistic updates SHALL be verified

### Requirement: All native app services shall have comprehensive unit tests

The system SHALL provide 80%+ line coverage for all 6 service modules in `apps/native/src/services/`.

#### Scenario: Background location service is tested

- **WHEN** testing backgroundLocation.ts
- **THEN** Expo Location APIs SHALL be mocked
- **AND** background task registration SHALL be tested
- **AND** location updates SHALL be tested

#### Scenario: Storage services are tested

- **WHEN** testing storage modules (tusUrlStorage, selectedTripStorage, storage.ts)
- **THEN** AsyncStorage SHALL be mocked
- **AND** read/write operations SHALL be tested
- **AND** error handling SHALL be verified

#### Scenario: Background task service is tested

- **WHEN** testing backgroundLocationTask.ts
- **THEN** TaskManager SHALL be mocked
- **AND** task execution SHALL be tested
- **AND** location tracking logic SHALL be verified

### Requirement: Native app utilities shall be tested

The system SHALL provide 80%+ line coverage for utility functions in `apps/native/src/utils/` and config.

#### Scenario: Utility functions are tested

- **WHEN** testing utility modules
- **THEN** pure functions SHALL be tested
- **AND** formatters SHALL be tested
- **AND** validators SHALL be tested

#### Scenario: Type definitions are validated

- **WHEN** testing type guards and validators
- **THEN** type checking logic SHALL be tested
- **AND** runtime validation SHALL be verified
