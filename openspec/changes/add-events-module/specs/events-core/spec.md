## ADDED Requirements

### Requirement: Event stores complete core metadata
The system MUST allow organizers to create and update an event with: name, description, start timestamp, end timestamp, in-person flag, optional location/address, optional contact data, tags/topics, attendance coin reward, open-registration flag, creator identity, and audit timestamps.

#### Scenario: Create in-person event with full data
- **WHEN** an authorized organizer submits a valid in-person event payload with all required fields
- **THEN** the system persists the event and returns an event record including creator and audit metadata

#### Scenario: Reject invalid time range
- **WHEN** an organizer submits an event where end timestamp is earlier than start timestamp
- **THEN** the system MUST reject the request with a validation error

### Requirement: Event time values are UTC-normalized
The system MUST store and process event start and end datetimes as timezone-safe UTC-normalized values.

#### Scenario: Persist timezone-aware payload
- **WHEN** an organizer submits timestamps with local timezone offsets
- **THEN** the system stores canonical UTC values and preserves equivalent local rendering data for clients

### Requirement: In-person and remote validation rules are enforced
The system MUST require location or address data for in-person events and MUST allow missing location fields for remote events.

#### Scenario: In-person event without location is blocked
- **WHEN** an organizer creates an in-person event without location/address
- **THEN** the system MUST reject the request

#### Scenario: Remote event without location is accepted
- **WHEN** an organizer creates a remote event with no location/address
- **THEN** the system accepts the event and marks it as remote

### Requirement: Event supports one or more organizers
The system MUST support assigning one or more organizers to an event, where each organizer can be a user or a group.

#### Scenario: Event with user and group organizers
- **WHEN** an organizer creates an event with one user organizer and one group organizer
- **THEN** the event is stored with both organizer references and can be queried with organizer type information

#### Scenario: Event without organizers is rejected
- **WHEN** a create or update payload removes all organizers from an event
- **THEN** the system MUST reject the mutation

### Requirement: Event links are persisted and exposed as clickable resources
The system MUST allow storing zero or more event links and MUST expose them in event responses for client-side click navigation.

#### Scenario: Multiple links attached to event
- **WHEN** an organizer adds multiple links to an event
- **THEN** the system persists the links in stable order and returns them in event detail responses
