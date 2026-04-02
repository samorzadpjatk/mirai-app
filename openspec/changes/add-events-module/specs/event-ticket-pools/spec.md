## ADDED Requirements

### Requirement: Event supports multiple ticket pools
The system MUST allow organizers to define one or more ticket pools per event, each with its own name, start datetime, end datetime, ticket capacity, and required `pricePln`.

#### Scenario: Organizer creates two pools
- **WHEN** an organizer creates an event with "Early Bird" and "Regular" pools and distinct `pricePln` values
- **THEN** the system stores both pools with independent sale windows, capacities, and prices

#### Scenario: Free pool is explicitly represented
- **WHEN** an organizer sets `pricePln` to `0` for a pool
- **THEN** the system accepts the pool and treats it as a free registration option

### Requirement: Pool availability is time- and capacity-bound
The system MUST allow registrations for a pool only when the current time is within that pool's sale window and the pool has remaining capacity.

#### Scenario: Pool open and in stock
- **WHEN** a user registers during active pool window and pool has available tickets
- **THEN** the system accepts registration and reserves capacity from that pool

#### Scenario: Pool sold out
- **WHEN** a user attempts to register for a pool with no remaining capacity
- **THEN** the system MUST reject the registration with sold-out status

#### Scenario: Pool outside sale window
- **WHEN** a user attempts to register before pool start or after pool end
- **THEN** the system MUST reject the registration with availability-window error

### Requirement: Pool inventory state is visible to clients and organizers
The system MUST expose per-pool price, total capacity, and remaining availability in event detail responses.

#### Scenario: Client reads pool availability
- **WHEN** a client requests event details
- **THEN** the response includes all ticket pools with current remaining capacity and `pricePln`

### Requirement: Registration stores pool price snapshot
The system MUST persist registration-level `lockedPricePln` based on the selected pool's current `pricePln` at the moment of registration.

#### Scenario: Pool price changes after earlier registrations
- **WHEN** organizer updates pool `pricePln` after some users already registered
- **THEN** existing registrations keep their original `lockedPricePln` and new registrations use the new price
