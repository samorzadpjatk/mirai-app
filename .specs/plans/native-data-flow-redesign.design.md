# Native / Backend Data-Flow Redesign

## Context

The MIRAI native app already received a round of request-reduction fixes in
`affcfa65` (#386): token-bucket rate limiting, oRPC `BatchLinkPlugin`,
`refetchOnMount: false`, a singleton background-location WebSocket, and an
offline mutation queue. Those changes stopped the acute 429 storms.

What remains is structural:

- Native screens still fire many fine-grained `orpc.*` calls. `useTripDetails`
  even layers its own `AsyncStorage` cache on top of TanStack Query because the
  API does not return enough data in one call.
- React Native's default `<Image>` flickers and re-fetches because source
  object identity changes across mounts.
- There is no per-screen request visibility in the dev environment.

This design consolidates backend reads into screen-scoped procedures, cleans
up the native hook layer, switches remote images to `expo-image`, and
measures the result on the dev Docker Compose stack with the iOS simulator.

## Goal

Simplify the data flow between `@mirai-app/native` and `@mirai-app/backend-server`
so that:

- every major screen loads with at most one primary HTTP read request;
- images render from disk/memory cache and do not refetch on navigation;
- changes are proven against a simulator baseline before they ship.

## Measurement-First Approach

Before changing behavior, capture a baseline.

- Run the full `environment/docker-compose.dev.yml` stack locally.
- Run the native app in the iOS simulator against that stack.
- Walk through the scenarios (cold start → home → trip list → trip details →
  back navigation ×3 → community → admin → back).
- Extract request metrics from the existing backend Pino logs and from the
  Metro / React Native network inspector:
  - total `orpc` procedure calls per screen;
  - number of batched vs. unbatched HTTP frames;
  - HTTP 429 and rate-limit `Retry-After` occurrences;
  - image fetch count per mount/remount.
- Store the baseline in `.specs/measurements/native-data-flow.baseline.md`.

All later changes must move one of the metrics. No speculative optimizations.

## Architecture

Keep the existing stack:

- oRPC + TanStack Query on the client;
- Hono + oRPC + token-bucket rate limiting on the backend;
- WebSocket streaming for location only.

The central change is the **client/server contract**: move from many small
read procedures per screen to one consolidated, screen-scoped read procedure per
screen. Old procedures are removed as soon as no screen uses them.

```
Native screen hook
        │
        ▼
orpc.trip.getByIdFull({ tripId })
        │
        ▼
Backend trip router ──▶ groups, challenges, sponsors, role, activity
        │
        ▼
Single batched HTTP response
```

## Client Layer Cleanup

### Remove redundant hook-local caches

- `useTripDetails` should read directly from `tripQuery.data` after the trip
  procedure returns a hydrated payload. Remove its manual
  `AsyncStorage`-backed cached-trip state.
- `useTrips` can keep its list cache only for cold-start display while data is
  loading, or remove it entirely if the consolidated endpoint is fast enough.
- General rule: if TanStack Query already holds the data, do not duplicate it in
  `AsyncStorage`. Keep `AsyncStorage` only for genuine cross-session state such
  as the selected trip ID.

### Standardize query defaults

Keep the existing global defaults in
`packages/orpc/src/client/query-client-factory.ts`. Add explicit overrides in
new/modified hooks:

- Reference data (trips, groups, challenges): `staleTime: 5 * 60 * 1000`,
  `gcTime: 10 * 60 * 1000`.
- User/session data: `staleTime: 60 * 1000`.
- Mutations: `retry: 0` to avoid repeated side effects.
- Real-time location: stays over WebSocket.

### Single loading state per screen

- Consolidated hooks return `{ data, isLoading, isError, error }`.
- Use TanStack Query `placeholderData` to keep previous data during
  background refetch, removing perceived flicker.
- Do not expose multiple nested loading flags (`isLoadingUser`,
  `isLoadingTrip`, etc.) from one hook.

## Backend Consolidation

### Consolidation pattern

Extend existing routers with richer read variants. Do not create a new `native`
router.

Two acceptable shapes:

1. Optional include list:
   ```ts
   trip.getById({ tripId, include: ["groups", "challenges"] })
   ```
2. Sibling full-read procedure:
   ```ts
   trip.getByIdFull({ tripId })
   ```

Each `*Full` procedure reuses existing SQL logic via shared service functions.
No query logic is duplicated.

### Candidates

- `trip.getById` + `group.getByTrip` + `challenge.getByTrip` +
  `sponsor.getByTrip` + activity fragments → `trip.getByIdFull`.
- `community.getFeed` + `community.getStatistics` +
  `challenge.getActive` → `community.getCommunityFull`.
- `user.getMy` + `trip.getAll` + `notification.getUnreadCount` →
  `home.getHomeFull`.

### Implementation rules

- Each `*Full` call uses one token-bucket token, replacing 3–6 separate calls.
- Response payload must stay under ~200 KB to avoid slow JS parsing.
- Essential failures (`NOT_FOUND`, `FORBIDDEN`) still throw `ORPCError`.
- Non-essential child data (e.g., latest activity feed) may return a partial
  error object instead of failing the whole screen.

### Deprecation and removal

- Add the consolidated procedure.
- Migrate every native screen that consumes the replaced procedures in one
  focused PR per screen cluster.
- Update the relevant tests and MSW mocks in the same PR.
- Delete the replaced old procedures in the same PR. No lingering
  `@deprecated` endpoints.

## Image Loading

### Root causes

- `react-native` `<Image>` does not reliably persist images across mounts.
- Signed Supabase Storage URLs are regenerated per render, changing source
  object identity and forcing re-fetch.
- No centralized disk cache.

### Fixes

1. Use `expo-image` for every remote image (trip hero, partner logos, group
   avatars, submission previews, profile photos). Add a `<CachedImage>`
   wrapper with `cachePolicy="memory-disk"`, `transition={200}`, and a
   normalized `source` prop.
2. Stabilize URLs:
   - Prefer public Supabase Storage URLs with RLS/image ACL when privacy
     allows.
   - If signed URLs are mandatory, generate them once in the consolidated
     backend procedure and return them in the payload. Do not regenerate them
     per query.
   - Cache-bust URLs only on content change (use the file's version/update
     timestamp).
3. Prefetch hot images when a consolidated endpoint returns, limited to a
   small number (e.g., first 5 images) and Wi-Fi/unmetered contexts.
4. Remove manual download hooks such as `useTripBackgroundImageDownload` and
   `usePartnerImageDownload`; `expo-image` caching replaces them.

## Error Handling and Resilience

- Consolidated endpoints expose a single error surface to the screen. Add a
  per-screen `ScreenErrorBoundary` with retry and pull-to-refresh.
- Child components receive data as props; they no longer need their own error
  states.
- 429 handling stays as in #386: TanStack Query reads `Retry-After` from the
  backend response.
- Cancellation: ensure unmounting a screen cancels the in-flight observer.
- Offline: consolidated reads fail silently when cached data exists, using
  TanStack Query's cache.

## Testing

### Backend

- PGLite transaction tests for each new `*Full` procedure.
- Verify that child SQL logic is reused, not duplicated.

### Native

- MSW handlers for each new `*Full` procedure before migrating a screen.
- Add a request-count assertion test in
  `packages/orpc/src/client/__tests__/` using a mock fetch to count calls per
  consolidated hook.
- Image tests use React Native Testing Library snapshots for the `<CachedImage>`
  wrapper.

### Simulator validation

- Re-run the baseline walkthrough and compare metrics.
- Use a dev-only overlay to show cached-vs-network state if needed.

## Rollout

1. Capture baseline measurements on dev Docker Compose + simulator.
2. Implement backend `*Full` procedures and migrate the home screen.
3. Migrate trip details, then community, then admin screens.
4. Remove all replaced old procedures in their respective migration PRs.
5. Switch images to `expo-image` and stabilize URLs.
6. Rename the `@mirai-app/common` package to `@mirai-app/common` once
   consolidation is merged, to minimize import churn.
7. Re-run simulator baseline and document improvements.

| Cluster | Native screens | Backend procedures |
|---|---|---|
| A. Home | `(tabs)/index` | `home.getHomeFull` |
| B. Trip Details | `(tabs)/trips/details`, `(tabs)/trips/info` | `trip.getByIdFull` |
| C. Community | `(tabs)/community` | `community.getCommunityFull` |
| D. Admin | admin challenges, rewards, activity | admin consolidations |
| E. Map / Location | leave unchanged | streaming only |

## Success Criteria

- ≥30% fewer HTTP calls on the cold-start home screen.
- ≥50% fewer image refetches on navigation.
- Zero 429 responses during a 5-minute simulator walkthrough.
- All old non-streaming procedures consumed by removed screens are deleted.
- No duplicate `AsyncStorage` caches where TanStack Query already holds the value.

## Out of Scope

- Full offline-first SQLite sync.
- GraphQL migration.
- Server-driven UI JSON payloads.
- Changes to WebSocket streaming procedures.
- New telemetry library or dashboard.
