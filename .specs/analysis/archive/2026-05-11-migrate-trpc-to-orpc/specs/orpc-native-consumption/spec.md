## ADDED Requirements

### Requirement: Native app uses oRPC TanStack Query utils directly
All native app components and hooks SHALL import oRPC query/mutation/infinite options utils directly and use them with standard `useQuery`, `useMutation`, and `useInfiniteQuery` hooks from `@tanstack/react-query`.

#### Scenario: Hook fetches user data
- **WHEN** a hook calls `useQuery(orpc.user.getMy.queryOptions({ input: {} }))`
- **THEN** it SHALL fetch the current user data
- **AND** it SHALL be typed with the oRPC router's output type
- **AND** on unauthorized error, it SHALL trigger session refresh or sign-out (existing behavior)

#### Scenario: Hook performs mutation
- **WHEN** a hook calls `useMutation(orpc.user.updateMyProfile.mutationOptions())`
- **THEN** it SHALL mutate user profile data
- **AND** it SHALL accept the same input types as the oRPC procedure

#### Scenario: Infinite query for paginated data
- **WHEN** a hook uses `useInfiniteQuery(orpc.user.searchWithPagination.infiniteOptions({...}))`
- **THEN** it SHALL paginate through results
- **AND** it SHALL use `getNextPageParam` to determine next cursor

### Requirement: Native app layout removes tRPC provider
The native app root layout (`apps/native/src/app/_layout.tsx`) SHALL remove the `APIProvider` from `@mirai-app/orpc/client` and use `QueryClientProvider` from `@tanstack/react-query` directly.

#### Scenario: App boots without tRPC provider
- **WHEN** the app initializes
- **THEN** it SHALL wrap children with `QueryClientProvider` only
- **AND** it SHALL NOT import or use `APIProvider`, `useTRPC`, or `TRPCContext`
- **AND** the oRPC client SHALL be initialized at module level or in a separate provider if needed

### Requirement: Auth token updates trigger client reconstruction
When the Supabase auth token changes, the oRPC client SHALL be reconstructed with the new token, and WebSocket connections SHALL be updated.

#### Scenario: Token refresh updates client
- **WHEN** `supabaseClient.auth.onAuthStateChange` fires with a new session
- **THEN** the oRPC client SHALL be recreated with the new `access_token`
- **AND** the old WebSocket connection SHALL be closed
- **AND** a new WebSocket connection SHALL be established with the updated token
