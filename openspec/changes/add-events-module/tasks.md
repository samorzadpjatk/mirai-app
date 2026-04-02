## 1. Data Model and Migrations

- [ ] 1.1 Add Prisma enums and models for `Event`, `EventOrganizer`, `EventLink`, `EventInterest`, `EventRegistration`, `EventAttendance`, and `EventTicketPool` with pool-level `pricePln`.
- [ ] 1.2 Add constraints/indexes for event time validity, organizer minimum cardinality (service-level enforcement), and unique attendance `(eventId, userId)`.
- [ ] 1.3 Generate and apply migration for local development environment.
- [ ] 1.4 Add seed-safe defaults for audit fields and counter columns (interested, registered, attended), plus registration `lockedPricePln`.

## 2. Shared Types and Validation Contracts

- [ ] 2.1 Define shared domain types for event list/detail payloads and organizer/ticket/check-in DTOs in shared package.
- [ ] 2.2 Add Zod validation schemas for create/update event mutations including in-person vs. remote validation rules.
- [ ] 2.3 Add schema validation for multi-link payloads and contact fields.
- [ ] 2.4 Add schema validation for ticket pool windows, capacity rules, and required `pricePln >= 0`.

## 3. Events API (Core + Registration)

- [ ] 3.1 Create `events` tRPC router with list/detail/create/update endpoints.
- [ ] 3.2 Implement organizer authorization for user and group organizers.
- [ ] 3.3 Implement interest toggle endpoint and count synchronization.
- [ ] 3.4 Implement registration endpoint that respects open-registration status.
- [ ] 3.5 Return interested/registered/attended counts in event list and detail responses.

## 4. Ticket Pool Lifecycle

- [ ] 4.1 Implement organizer endpoints for CRUD of ticket pools under an event.
- [ ] 4.2 Implement pool availability evaluation (time window + remaining capacity).
- [ ] 4.3 Attach registration to selected pool, snapshot `lockedPricePln`, and reserve capacity atomically.
- [ ] 4.4 Expose per-pool `pricePln`, capacity, and remaining seats in event detail responses.

## 5. Attendance Check-In (QR/OTP)

- [ ] 5.1 Generate stable attendee event-scoped QR identity token at registration time.
- [ ] 5.2 Implement rotating organizer verification token service with TTL and 6-digit OTP projection.
- [ ] 5.3 Add organizer endpoint to fetch current rotating token payload and expiry.
- [ ] 5.4 Add check-in mutation validating attendee token + active organizer token in one transaction.
- [ ] 5.5 Enforce idempotent attendance writes and replay protection.

## 6. Client Integration (Web + Native)

- [ ] 6.1 Add event list/detail screens showing links, tags, organizer, cost, and count metrics.
- [ ] 6.2 Add user actions for interest toggle and registration.
- [ ] 6.3 Add organizer UI for ticket pool configuration and check-in session start.
- [ ] 6.4 Add attendee QR display and organizer scanner/manual OTP input flow.

## 7. Verification and Rollout

- [ ] 7.1 Add unit/integration tests for event validation, organizer permissions, and registration transitions.
- [ ] 7.2 Add integration tests for ticket pool window/capacity behavior and race-condition handling.
- [ ] 7.3 Add integration tests for rotating token expiration and duplicate check-in prevention.
- [ ] 7.4 Add feature flag and staged rollout plan (internal organizers -> limited groups -> general availability).
