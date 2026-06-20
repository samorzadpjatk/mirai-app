# Rate Limiting & Request Reduction

## Context

The MIRAI native app gets HTTP 429 responses from the backend even for one user on one device.
The current rate limiter counts every `/api/orpc` call per IP: 600 requests per minute globally and
30 per minute on auth endpoints. Native code multiplies that volume:

- the background-location task creates a new HTTP+WS `oRPC` client on every GPS update
- the vanilla `oRPC` client retries failed requests up to 5 times on top of TanStack Query's 3 retries
- most hooks inherit the default `refetchOnMount: true`

This design combines approaches 1, 2, 3 and 5 from the brainstorm.

## Goal

Stop 429s for a single legitimate user while keeping backend abuse protection.

## Architecture

### Backend

Replace the fixed-window IP rate limiter with a token-bucket implementation.

| Bucket | Key | Capacity | Refill |
|---|---|---|---|
| Per-token | `sha256(accessToken)` | 400 tokens | 400 per minute |
| Per-IP | First trusted `X-Forwarded-For` / `X-Real-IP` | 1200 tokens | 1200 per minute |
| Auth | IP | 30 tokens | 30 per minute |

- Per-token bucket is primary. If no token is present, fall back to the IP bucket.
- The token hash is used instead of an unverified JWT `sub` claim to prevent bucket spoofing.
- Harden `X-Forwarded-For` parsing: trust only the rightmost non-internal hop when behind a proxy.
- 429 responses include `Retry-After`.

### Native: background location

Refactor `sendUpdate` in `apps/native/src/services/background/backgroundLocationTask.ts`.

- Open one persistent WebSocket connection when the background task starts.
- Send updates via `location/updateLocationStream` over that WebSocket.
- If the WebSocket is not connected, buffer updates in a capped queue (max 10) and flush over HTTP once every 60 seconds.
- Close the connection only when the background task ends.

This eliminates a new HTTP+WS client per GPS update.

### Native: client retries

Edit `packages/orpc/src/client/vanilia.ts`.

- Remove the custom 5-retry interceptor. TanStack Query already retries up to 3 times.
- Special-case 429: do not retry in the interceptor and let TanStack Query's failure logic surface it.
- Keep `RPCLink` with dynamic routing (HTTP for normal procedures, WS for streaming).

### Native: query defaults

Edit `packages/orpc/src/client/query-client-factory.ts`.

- Set `refetchOnMount: false` globally.
- Keep `staleTime: 60_000` as the default; add explicit larger `staleTime` for reference data per hook.

### Native: request batching

Edit `packages/orpc/src/client/vanilia.ts` and `apps/backend-server/src/server.ts`.

- Add `BatchLinkPlugin` on the client and `BatchHandlerPlugin` on the server for non-streaming RPC.
- Use a small window, e.g. 20 ms, so simultaneous mount queries share one HTTP round-trip.

### Invalidation

Review `packages/orpc/src/client/invalidationUtils.ts`.

- Replace broad `invalidateAdminQueries` with domain-specific invalidation predicates so one admin action does not refetch the whole app.

## Data Flow

### Screen load

1. `_layout.tsx` creates one `QueryClient` and one `oRPC` client.
2. A screen hook reads cached data. If fresh, no network request runs.
3. `refetchOnMount: false` prevents silent refetches on navigation.
4. A mutation invalidates only the query groups it changes.

### Background location

1. Expo `TaskManager` fires with `distanceInterval: 25 m`, `deferredUpdatesInterval: 60 s`.
2. `handleBackgroundLocationTask` filters against `lastSentLocation` using the existing delta utility.
3. Passing updates go over the persistent WebSocket `updateLocationStream`.
4. The server broadcasts to active `getFriendsLocationsStream` subscribers.

### Batched calls

1. `BatchLinkPlugin` batches non-streaming calls over a short window.
2. `BatchHandlerPlugin` executes them in parallel and returns one response.

## Error Handling & Resilience

### Native

- 429 errors do not trigger the interceptor retry.
- TanStack Query reads the backend `Retry-After` header.
- Background-task send failures append the update to a 10-item queue and retry on the next heartbeat; oldest updates drop when the queue overflows.
- Token refresh updates the headers function, not the client identity, so existing connections stay alive.

### Backend

- Token bucket rejects only when the bucket is empty.
- JWT `sub` extraction falls back to IP if the request is unauthenticated.
- `Retry-After` is calculated as ceil(seconds until next refill tick).

## Rollout

1. Backend token-bucket limiter and hardened IP parsing.
2. Backend `BatchHandlerPlugin` for `/api/orpc`.
3. Native client retry cleanup.
4. Native query defaults + invalidation tightening.
5. Native background-location persistent WebSocket.
6. Native `BatchLinkPlugin`.

## Success Criteria

- One user / one device with background location enabled does not see 429s under normal movement.
- 400 requests from a single user within one minute succeed.
- Request 401 from that user is throttled with `Retry-After`.
- Automated test: 60 GPS updates in one minute from one background task produce at most 2 HTTP fallback requests and zero 429 retry loops.

## Files to Change

- `apps/backend-server/src/utils.ts`
- `apps/backend-server/src/server.ts`
- `apps/backend-server/src/__tests__/utils.test.ts`
- `apps/native/src/services/background/backgroundLocationTask.ts`
- `packages/orpc/src/client/vanilia.ts`
- `packages/orpc/src/client/query-client-factory.ts`
- `packages/orpc/src/client/invalidationUtils.ts`
- `apps/native/src/services/background/__tests__/backgroundLocationTask.init.test.ts`

## Out of Scope

- CDN/WAF-level rate limiting
- Full service-worker/offline rewrite
- Admin UI redesign or additional admin features
- Moving all real-time procedures to WebSocket
