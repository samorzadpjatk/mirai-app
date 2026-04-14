---
title: "Unified tRPC Client"
type: task
status: done
created: "2026-03-30"
migrated_from: "openspec/changes/archive/2026-03-30-optimize-admin-web-with-islands-architecture/specs/unified-trpc-client/spec.md"
parent_design: ".specs/plans/optimize-admin-web-with-islands-architecture.design.md"
---

## ADDED Requirements

### Requirement: Admin-web uses APIProvider from @mirai-app/trpc/client

The admin-web application SHALL use APIProvider from `@mirai-app/trpc/client` package instead of custom TRPCProvider, matching the native app's tRPC setup.

#### Scenario: APIProvider wraps admin app

- **WHEN** admin-web GlobalProviders renders
- **THEN** it imports and uses APIProvider from `@mirai-app/trpc/client`
- **THEN** it does NOT use custom TRPCProvider from `lib/trpc.ts`

#### Scenario: APIProvider receives required props

- **WHEN** APIProvider is instantiated
- **THEN** it receives `httpUrl` for backend HTTP connection
- **THEN** it receives `wsUrl` for backend WebSocket connection
- **THEN** auth/session is provided by surrounding AuthProvider
- **THEN** configuration matches native app setup

### Requirement: Hooks use shared tRPC client from context

Admin hooks in web app SHALL use `useTRPC()` or `useTRPCClient()` from `@mirai-app/trpc/client` to access tRPC client from context, instead of creating clients manually.

#### Scenario: Hook uses tRPC from context

- **WHEN** admin hook (e.g., `useAdminUsers`) executes in web app
- **THEN** it calls `useTRPC()` or `useTRPCClient()` from `@mirai-app/trpc/client`
- **THEN** it does NOT call `createTRPCClient()` directly
- **THEN** trpc client is obtained from APIProvider context

#### Scenario: Vanilla client available when needed

- **WHEN** hook needs non-reactive tRPC client (for async functions)
- **THEN** it calls `const client = useTRPCClient()` from `@mirai-app/trpc/client`
- **THEN** vanilla client is available for use outside React Query

### Requirement: tRPC client configuration matches native app

The tRPC client configuration in admin-web SHALL use same settings as native app: httpBatchLink, superjson transformer, and auth headers.

#### Scenario: Batch link is used

- **WHEN** multiple tRPC queries execute simultaneously
- **THEN** they are batched into single HTTP request
- **THEN** batching behavior matches native app

#### Scenario: Superjson transforms data

- **WHEN** tRPC response includes Date objects or other complex types
- **THEN** superjson deserializes them correctly
- **THEN** data types match native app's deserialized data

#### Scenario: Auth headers are included

- **WHEN** tRPC request is made from web app
- **THEN** Authorization header includes Bearer token from authStore.getState().session?.access_token
- **THEN** header generation matches native app logic

### Requirement: Custom TRPCProvider is deleted

The system SHALL NOT include custom TRPCProvider.tsx in admin-web after migration.

#### Scenario: Custom provider removed

- **WHEN** migration is complete
- **THEN** `components/TRPCProvider.tsx` file is deleted
- **THEN** no components import custom TRPCProvider
- **THEN** `lib/trpc.ts` manual client creation is deleted

### Requirement: Query client configuration is preserved

The QueryClient configuration from custom TRPCProvider SHALL be preserved or improved in APIProvider setup.

#### Scenario: Query defaults are maintained

- **WHEN** APIProvider creates QueryClient
- **THEN** default staleTime is set (60 seconds or similar)
- **THEN** refetchOnWindowFocus is disabled (or configured appropriately)
- **THEN** mutation retry is configured (1 retry or similar)

### Requirement: tRPC context is available in all admin hooks

All admin hooks SHALL have access to tRPC context via `useTRPC()` without needing to pass client as prop.

#### Scenario: Hook accesses tRPC without props

- **WHEN** admin hook executes (e.g., `useAdminGroups(tripId, searchTerm)`)
- **THEN** it does NOT require tRPC client as parameter
- **THEN** it obtains client from context internally
- **THEN** calling code only passes business logic params (tripId, searchTerm)

### Requirement: Web and native tRPC setup is identical

The tRPC client setup SHALL be identical between web and native apps, enabling consistent behavior and easier debugging.

#### Scenario: Same tRPC procedures work in both apps

- **WHEN** `trpc.user.searchWithPagination.query()` is called in web app
- **THEN** it uses same procedure as native app
- **THEN** request format is identical
- **WHEN** response is received
- **THEN** data shape is identical in both apps

#### Scenario: Both apps use same APIProvider

- **WHEN** native app wraps in APIProvider
- **THEN** web app wraps in same APIProvider from same package
- **THEN** provider implementation is shared, not duplicated
