## Why

The app currently has no first-class events module, which blocks organizers from planning, promoting, and validating participation in structured activities. We need a scalable events foundation now to support registrations, attendance rewards (coins), and future ticket sales.

## What Changes

- Add a new event domain with core fields: name, start/end datetime, in-person/remote mode, location, links, description, organizer(s), contact, tags/topics, registration count, attendance coin reward, open-registration flag, creator, created/updated timestamps.
- Support organizer model for both single-person and group-based event ownership.
- Add registration lifecycle with separate tracking for interested users vs. confirmed attendance.
- Add attendance verification flow based on QR check-in:
- participant-level stable QR identifier (per user/event context),
- organizer-facing rotating verification code (QR and/or 6-digit OTP style).
- Add event ticket pool model for future sales: multiple pools with independent sale windows, inventory limits, and mandatory pool price in PLN.
- Expose event APIs and shared types for native/web clients and admin workflows.

## Capabilities

### New Capabilities

- `events-core`: Event entity, metadata, organizer ownership, links, tags, contact fields, and lifecycle timestamps.
- `event-registration-and-interest`: Open registration controls, signup counts, and separation of interest vs. final attendance states.
- `event-ticket-pools`: Multiple ticket pools per event with pool start dates and per-pool ticket limits.
- `event-attendance-checkin`: QR/OTP-based attendance verification, including participant static codes and organizer rotating verification codes.

### Modified Capabilities

- None.

## Impact

- Database: new Prisma models/tables for events, organizers, registrations, attendance, ticket pools, and rotating check-in tokens.
- Database: pool-level pricing in PLN stored on ticket pools, with registration-level price snapshot for history safety.
- Backend: new/extended tRPC routers, validation schemas, authorization rules, and counting/aggregation queries.
- Shared contracts: new domain types in shared packages for event detail/list/check-in flows.
- Clients: native/web screens for event browsing, details, registration state, organizer controls, and QR check-in interactions.
- Security and operations: token/code rotation strategy, anti-replay verification, and auditability for attendance confirmation events.
