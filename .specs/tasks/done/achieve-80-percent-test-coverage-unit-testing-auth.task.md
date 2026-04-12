---
title: "Unit Testing Auth"
type: task
status: done
created: "2026-04-08"
migrated_from: "openspec/changes/archive/2026-04-08-achieve-80-percent-test-coverage/specs/unit-testing-auth/spec.md"
parent_design: ".specs/plans/achieve-80-percent-test-coverage.design.md"
---

## ADDED Requirements

### Requirement: Unit tests for auth server — JWT decoding and verification

The system SHALL provide unit tests for `packages/auth/src/authServer.ts` covering JWT token decoding, verification, and claims extraction.

#### Scenario: Decoding a valid JWT token

- **WHEN** a test provides a validly signed JWT token to the decode function
- **THEN** the function returns the decoded payload with user ID, role, and expiration claims

#### Scenario: Rejecting an expired JWT token

- **WHEN** a test provides an expired JWT token to the verification function
- **THEN** the function throws an authentication error with a clear message about token expiry

#### Scenario: Rejecting a malformed JWT token

- **WHEN** a test provides an invalid or corrupted JWT string to the decode function
- **THEN** the function throws an authentication error without exposing internal details

### Requirement: Unit tests for auth server — role checking

The system SHALL provide unit tests for `packages/auth/src/authServer.ts` covering `requireAuth`, `requireAdmin`, and `requireModerator` middleware functions.

#### Scenario: requireAuth with valid user

- **WHEN** a test calls `requireAuth` with a context containing a valid authenticated user
- **THEN** the function returns/continues without error, providing the authenticated user

#### Scenario: requireAuth with missing user

- **WHEN** a test calls `requireAuth` with a context that has no authenticated user
- **THEN** the function throws an unauthorized error

#### Scenario: requireAdmin with admin user

- **WHEN** a test calls `requireAdmin` with a context containing a user with admin role
- **THEN** the function returns/continues without error

#### Scenario: requireAdmin with non-admin user

- **WHEN** a test calls `requireAdmin` with a context containing a user with a non-admin role
- **THEN** the function throws a forbidden error

#### Scenario: requireModerator with moderator or admin user

- **WHEN** a test calls `requireModerator` with a context containing a user with moderator or admin role
- **THEN** the function returns/continues without error

#### Scenario: requireModerator with regular user

- **WHEN** a test calls `requireModerator` with a context containing a user with a regular role
- **THEN** the function throws a forbidden error

### Requirement: Unit tests for auth server — user synchronization

The system SHALL provide unit tests for `packages/auth/src/authServer.ts` covering user sync logic that reconciles Supabase auth users with the application database.

#### Scenario: Syncing a new user from Supabase to DB

- **WHEN** a test calls user sync with a Supabase auth user that does not exist in the application database
- **THEN** the function creates a new user record in the database with matching ID, email, and role

#### Scenario: Syncing an existing user with changed email

- **WHEN** a test calls user sync with a Supabase auth user whose email has changed since last sync
- **THEN** the function updates the existing user record with the new email

#### Scenario: Syncing with unreachable database

- **WHEN** a test calls user sync when the database is unreachable
- **THEN** the function throws a meaningful error and does not create partial records
