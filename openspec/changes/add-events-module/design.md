## Context

Integral app currently supports trips, challenges, rewards, and storage-backed content, but it does not provide a first-class event lifecycle. The proposed events module spans multiple layers (Prisma schema, tRPC APIs, shared contracts, and native/web UX) and introduces attendance validation mechanics that affect security and data consistency.

The new feature set is inspired by Luma-like event management and includes future-facing ticket pools, coin rewards for attendance, and organizer-side verification with rotating codes.

## Goals / Non-Goals

**Goals:**

- Introduce a normalized event domain model that supports in-person and remote events.
- Support organizer ownership by both users and groups.
- Track interest, registration, and final attendance as separate states.
- Enable future ticket-pool based sales with configurable pool windows and inventory.
- Implement secure check-in verification using participant static QR plus organizer rotating QR/OTP.
- Keep all event timestamps UTC-normalized and timezone-safe.

**Non-Goals:**

- Full payment processing and settlement flows.
- Public marketplace discovery/ranking algorithms.
- Offline-first check-in synchronization.
- Marketing automation (email campaigns, reminders, drip sequences).

## Decisions

### 1) Event data model with UTC timestamps and explicit mode

Decision:
- Add core event model with `startsAt` and `endsAt` stored as `timestamptz` (UTC normalized).
- Include `isInPerson` boolean plus nullable `location` and `address` fields, required only for in-person events.

Rationale:
- UTC storage removes timezone ambiguity while preserving local rendering in clients.
- Explicit event mode keeps validation and query logic predictable.

Alternatives considered:
- `timestamp without time zone` + app-side conversion only: rejected due to higher drift risk.
- Single free-form location field for all event types: rejected due to weaker validation and analytics.

### 2) Organizer model supports user and group ownership

Decision:
- Model organizers via join table (`EventOrganizer`) with discriminator (`USER` or `GROUP`) and foreign key target.
- Require at least one organizer per event.

Rationale:
- Handles current requirement (single organizer) and future requirement (multiple organizers) without schema rewrite.

Alternatives considered:
- Single `organizerUserId`: rejected because it cannot represent group ownership.
- Polymorphic JSON blob: rejected due to weak referential integrity.

### 3) Registration lifecycle separates intent from attendance

Decision:
- Track intent and outcome in explicit records:
- interest state (user marked as interested),
- registration state (user completed signup),
- attendance state (user confirmed present after check-in).

Rationale:
- Product explicitly needs both “interest” and final attendance metrics; separate states avoid overloading one flag.

Alternatives considered:
- Single enum with transitions: possible, but less flexible for reporting and audit history.

### 4) Ticket pools as a first-class child entity

Decision:
- Introduce `EventTicketPool` with `name`, `startsAt`, `endsAt`, `capacity`, counters, and required `pricePln`.
- Support multiple pools per event with independent windows.
- Remove event-level cost from `Event` to avoid duplicated pricing sources.
- Persist `lockedPricePln` on registration as a snapshot of the chosen pool price at signup time.

Rationale:
- Aligns with future ticket sales roadmap and allows gradual adoption before payment integration.
- Pool-level pricing supports tiered offers (e.g., Early Bird vs Regular) without ambiguity.
- Registration snapshot protects reporting/history when pool prices are edited later.

Alternatives considered:
- Single event-level capacity window: rejected because it cannot model tiered release.
- Event-level `cost` + pool-level overrides: rejected because it introduces drift and unclear source of truth.

### 5) Attendance verification using dual-code protocol

Decision:
- Each attendee receives a stable event-scoped QR identity token.
- Organizer app exposes a rotating verification artifact every short interval (QR + 6-digit OTP representation).
- Check-in endpoint validates:
- attendee token authenticity and registration state,
- active organizer rotating token for that event/time window,
- replay protection (single attendance confirmation per user/event).

Rationale:
- Dual proof lowers abuse risk compared to static attendee QR alone.
- OTP representation allows fallback input when camera scan is unavailable.

Alternatives considered:
- Static organizer code: rejected due to easy leakage/replay.
- Organizer manual attendee search only: rejected due to poor throughput and auditability.

### 6) API and authorization boundaries

Decision:
- Add dedicated event router namespace in tRPC (`events.*`) with role-aware mutations.
- Attendee endpoints limited to browse/register/interest/check-in self flow.
- Organizer endpoints limited to event owners and admin roles for managing pools and check-in sessions.

Rationale:
- Clear boundary minimizes accidental privilege overlap.

## Risks / Trade-offs

- [Time-window drift on rotating OTP/QR] -> Mitigation: allow short grace window and use server-issued epoch boundaries.
- [Race conditions during high-volume check-ins] -> Mitigation: transactional attendance write with unique `(eventId, userId)` constraint.
- [Overly complex V1 scope] -> Mitigation: deliver payments as explicit non-goal and gate advanced organizer analytics behind follow-up change.
- [Group organizer authorization edge cases] -> Mitigation: reuse existing group-role checks and add integration tests for mixed ownership.
- [Denormalized counters becoming stale] -> Mitigation: derive canonical truth from registration tables and reconcile counters asynchronously.

## Migration Plan

1. Add Prisma models/enums and generate migration with indexes + uniqueness constraints.
2. Ship backend read endpoints behind feature flag with no write exposure.
3. Add create/update/register/check-in mutations with permission checks.
4. Introduce client views for event list/detail and organizer check-in UI.
5. Backfill/initialize counters from registration tables.
6. Enable feature flag progressively (internal organizers -> selected groups -> all).

Rollback strategy:
- Disable feature flag to stop new event writes.
- Keep schema in place; do not destructive-rollback migrations in production.
- Revert API/UI exposure while preserving stored records for forward recovery.

## Open Questions

- Do we need per-pool waitlists in V1 or only hard capacity limits?
- Is organizer rotating code interval fixed globally (e.g., 30s) or event-configurable?
- Should attendee static QR token rotate per registration update for additional privacy hardening?
