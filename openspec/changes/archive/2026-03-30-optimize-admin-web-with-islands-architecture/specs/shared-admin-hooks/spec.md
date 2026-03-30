## ADDED Requirements

### Requirement: Shared admin hooks package exists

The system SHALL provide a `@mirai-app/admin-hooks` package containing all admin-related React hooks for data fetching and mutations, usable by both web and native applications.

#### Scenario: Package is importable from both apps

- **WHEN** web or native app imports `import { useAdminUsers } from '@mirai-app/admin-hooks'`
- **THEN** the hook is available and uses the tRPC client from context

#### Scenario: Package includes all admin hooks

- **WHEN** developer needs an admin hook (users, groups, challenges, rewards, activity, notifications, transactions, coins, schedules, trips)
- **THEN** the hook is exported from `@mirai-app/admin-hooks`

### Requirement: Hooks use shared tRPC client

All hooks in `@mirai-app/admin-hooks` SHALL use `useTRPC()` or `useTRPCClient()` from `@mirai-app/trpc/client` instead of creating clients manually.

#### Scenario: Hook uses tRPC from context

- **WHEN** hook executes (e.g., `useAdminUsers()`)
- **THEN** it calls `useTRPC()` to get the tRPC client from context
- **THEN** it does NOT call `createTRPCClient()` directly

#### Scenario: Hook works in both apps

- **WHEN** hook is called in native app wrapped in APIProvider
- **THEN** hook uses native app's tRPC client configuration
- **WHEN** hook is called in web app wrapped in APIProvider
- **THEN** hook uses web app's tRPC client configuration

### Requirement: Hooks export TypeScript types

The package SHALL export all TypeScript types used by hooks (User, Group, Challenge, etc.) for use by consuming applications.

#### Scenario: Types are importable

- **WHEN** developer imports `import type { User, UserSearchField } from '@mirai-app/admin-hooks'`
- **THEN** types are available for use in components

### Requirement: Hook behavior is identical across platforms

Each hook SHALL provide identical API and behavior regardless of whether it's called from web or native app.

#### Scenario: Same hook API in both apps

- **WHEN** `useAdminUsers(tripId, searchTerm, field)` is called in web app
- **THEN** it returns same properties as when called in native app
- **THEN** return shape includes: `{ users, usersLoading, usersError, usersHasNextPage, fetchMoreUsers, createUser, updateName, ... }`

#### Scenario: Same mutations in both apps

- **WHEN** `createUser()` mutation is called from hook in either app
- **THEN** it calls same tRPC procedure `user.createUser`
- **THEN** it invalidates same query keys on success

### Requirement: Package has proper dependencies

The package SHALL declare peer dependencies on `@tanstack/react-query`, `react`, and `@mirai-app/trpc` without bundling them.

#### Scenario: Peer dependencies declared

- **WHEN** package is installed in consuming app
- **THEN** `package.json` lists `@tanstack/react-query`, `react`, and `@mirai-app/trpc` as peer dependencies
- **THEN** consuming app provides compatible versions

### Requirement: Hooks preserve pagination and infinite query patterns

Hooks using infinite queries (e.g., `useAdminUsers`) SHALL maintain React Query's infinite query patterns with proper page parameters and next page logic.

#### Scenario: Infinite query maintains pagination

- **WHEN** `useAdminUsers()` fetches first page
- **THEN** it returns `hasNextPage: true` if more data exists
- **WHEN** `fetchMoreUsers()` is called
- **THEN** next page is fetched with correct offset
- **THEN** new data is appended to existing results

### Requirement: Query invalidation is consistent

Hooks SHALL use consistent query key patterns for invalidation, ensuring mutations properly refresh related data in both apps.

#### Scenario: User mutation invalidates user queries

- **WHEN** `createUser()` mutation succeeds
- **THEN** it invalidates queries with key `["users", "search", tripId]`
- **THEN** user list refreshes automatically in both apps

#### Scenario: Challenge mutation invalidates challenge queries

- **WHEN** `updateChallenge()` mutation succeeds
- **THEN** it invalidates queries with key `["challenges", tripId]` and `["challenges", challengeId]`
- **THEN** challenge list and detail views refresh
