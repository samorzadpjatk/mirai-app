---
title: "tRPC Web Client"
type: task
status: done
created: "2026-03-30"
migrated_from: "openspec/changes/archive/2026-03-30-migrate-admin-panel-to-astro-web/specs/trpc-web-client/spec.md"
parent_design: ".specs/plans/migrate-admin-panel-to-astro-web.design.md"
---

## ADDED Requirements

### Requirement: tRPC client initialization

The system SHALL initialize tRPC client for web environment using `@mirai-app/trpc` package with HTTP transport.

#### Scenario: Client created

- **WHEN** application initializes
- **THEN** tRPC client is created with web-compatible configuration

#### Scenario: Backend URL configured

- **WHEN** tRPC client is initialized
- **THEN** client points to correct backend server URL

#### Scenario: HTTP transport used

- **WHEN** tRPC client makes request
- **THEN** standard HTTP fetch is used instead of Expo-specific transport

### Requirement: React Query integration

The system SHALL integrate React Query provider in Astro layout for tRPC client components.

#### Scenario: Query client provider

- **WHEN** admin page loads
- **THEN** React Query provider wraps client components

#### Scenario: Query caching works

- **WHEN** same data is requested multiple times
- **THEN** React Query serves cached data without redundant requests

#### Scenario: Background refetch

- **WHEN** user navigates back to page
- **THEN** React Query refetches stale data in background

### Requirement: tRPC procedure calls

The system SHALL enable tRPC procedure calls from client components with proper TypeScript inference.

#### Scenario: Query procedure called

- **WHEN** component calls tRPC query procedure
- **THEN** data is fetched and returned with correct types

#### Scenario: Mutation procedure called

- **WHEN** component calls tRPC mutation procedure
- **THEN** server-side mutation executes and returns result

#### Scenario: Type inference works

- **WHEN** developer writes tRPC call
- **THEN** TypeScript provides autocomplete and type checking

### Requirement: Authentication headers

The system SHALL include authentication headers in tRPC requests using Supabase session tokens.

#### Scenario: Authenticated request

- **WHEN** authenticated user makes tRPC call
- **THEN** Supabase access token is included in request headers

#### Scenario: Unauthenticated request

- **WHEN** unauthenticated user makes tRPC call
- **THEN** request fails with authentication error

#### Scenario: Token refresh during request

- **WHEN** access token expires during request
- **THEN** token is refreshed and request is retried

### Requirement: Error handling

The system SHALL handle tRPC errors gracefully with user-friendly error messages.

#### Scenario: Network error

- **WHEN** tRPC request fails due to network issue
- **THEN** user sees friendly error message with retry option

#### Scenario: Server error

- **WHEN** tRPC procedure throws error
- **THEN** error is caught and displayed to user

#### Scenario: Validation error

- **WHEN** request data fails validation
- **THEN** validation errors are displayed on form fields

### Requirement: Optimistic updates

The system SHALL support optimistic updates for mutation procedures to improve perceived performance.

#### Scenario: Optimistic mutation

- **WHEN** user submits form
- **THEN** UI updates immediately before server response

#### Scenario: Successful mutation

- **WHEN** server confirms mutation success
- **THEN** optimistic update is confirmed and UI remains updated

#### Scenario: Failed mutation rollback

- **WHEN** server rejects mutation
- **THEN** optimistic update is rolled back and error is shown

### Requirement: Server/client boundary

The system SHALL properly handle tRPC calls across Astro server/client boundaries.

#### Scenario: Server-side rendering

- **WHEN** page renders on server
- **THEN** tRPC calls execute server-side if needed

#### Scenario: Client-side hydration

- **WHEN** page hydrates on client
- **THEN** client-side tRPC calls use browser fetch

#### Scenario: Islands architecture compatibility

- **WHEN** React island component uses tRPC
- **THEN** tRPC client works correctly within island
