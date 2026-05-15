## ADDED Requirements

### Requirement: oRPC vanilla client supports HTTP and WebSocket
The vanilla oRPC client in `packages/trpc/src/client/vanilia.ts` SHALL use `createORPCClient` with `RPCLink` for both HTTP and WebSocket transports, supporting auth token injection, retries, and split routing (subscriptions over WS, queries/mutations over HTTP).

#### Scenario: Client creates with HTTP and WS links
- **WHEN** `getORPCClient(httpUrl, wsUrl, authorizationToken)` is called
- **THEN** it SHALL create an HTTP `RPCLink` with Authorization header
- **AND** it SHALL create a WebSocket `RPCLink` from `@orpc/client/websocket`
- **AND** it SHALL encode the auth token in the WebSocket URL as query param
- **AND** it SHALL return `{ client, cleanup }` where `cleanup` closes the WebSocket

#### Scenario: Retry link handles transient failures
- **WHEN** an HTTP request fails with a network error or 5xx status
- **THEN** the client SHALL retry up to 5 times with exponential backoff
- **AND** the delay SHALL be `min(1000 * 2^attempt, 30000)` milliseconds

### Requirement: oRPC TanStack Query integration is provider-less
The TanStack Query integration SHALL use `createTanstackQueryUtils` from `@orpc/tanstack-query` directly, without a React Context provider or `useTRPC` hook.

#### Scenario: Query utils are created from client
- **WHEN** the client is initialized
- **THEN** `createTanstackQueryUtils(client)` SHALL create query/mutation/infinite options builders
- **AND** these utils SHALL be exported for direct use in components

#### Scenario: Component uses query options
- **WHEN** a component calls `useQuery(orpc.user.getMy.queryOptions({ input: {} }))`
- **THEN** TanStack Query SHALL fetch data via the oRPC client
- **AND** types SHALL be fully inferred from the router

#### Scenario: Component uses mutation options
- **WHEN** a component calls `useMutation(orpc.user.updateMyProfile.mutationOptions())`
- **THEN** the mutation SHALL call the oRPC client with the mutation input
- **AND** on success, it SHALL invalidate relevant query keys automatically (via utils or manual invalidation)

### Requirement: Query invalidation utilities work with oRPC keys
The query invalidation utilities in `packages/trpc/src/client/invalidationUtils.ts` SHALL be updated to use oRPC query key patterns.

#### Scenario: Invalidation targets oRPC query keys
- **WHEN** `invalidateQueries(['user', 'getMy'])` is called
- **THEN** it SHALL invalidate the matching oRPC query cache entries
- **AND** it SHALL use the oRPC key format (which may differ from tRPC's key format)
