## ADDED Requirements

### Requirement: Users can mark interest independently of registration
The system MUST allow eligible users to mark or unmark interest in an event without requiring full registration.

#### Scenario: User marks event as interested
- **WHEN** a logged-in user chooses "interested" for an open event
- **THEN** the system records interest state and updates the event's interested-user count

#### Scenario: User removes interest
- **WHEN** a user who is marked as interested toggles interest off
- **THEN** the system removes interest state and decrements interested-user count

### Requirement: Event registration honors open-registration settings
The system MUST allow registrations only when event registration is open and MUST block new registrations when registration is closed.

#### Scenario: Registration succeeds while open
- **WHEN** a user registers for an event with open registration
- **THEN** the system creates a registration record and increments registered-user count

#### Scenario: Registration blocked while closed
- **WHEN** a user attempts to register for an event with closed registration
- **THEN** the system MUST reject the registration request

### Requirement: Registration metrics are queryable in event payloads
The system MUST expose counts for interested users and registered users in event list and event detail responses.

#### Scenario: Counts visible in event list
- **WHEN** a client requests event list data
- **THEN** each returned event includes current interested count and registered count

### Requirement: Final attendance is tracked separately from registration
The system MUST track attendance confirmation independently from registration so that final attendance can differ from registration totals.

#### Scenario: Registered user not yet attended
- **WHEN** a registered user has not completed check-in
- **THEN** the event reflects them as registered but not attended

#### Scenario: Attendance updates final metrics
- **WHEN** a registered user successfully checks in
- **THEN** the system marks attendance and increments attended-user count without changing registration count
