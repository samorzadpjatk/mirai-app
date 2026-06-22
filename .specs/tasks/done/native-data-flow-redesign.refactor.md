# Consolidate native data flow and remove redundant client caching

## Task Info

- **Type:** refactor
- **Depends on:** none

## Description

Redo the data flow between `@mirai-app/native` and `@mirai-app/backend-server` so that each major screen loads from a single consolidated oRPC read procedure. Remove hook-local caches that duplicate TanStack Query, switch remote images to `expo-image`, and delete the replaced fine-grained procedures in the same PRs. Rename `@mirai-app/common` to `@mirai-app/common` once the refactor settles.

Measurement is the first step: use the dev Docker Compose stack (https://github.com/user-attachments/files/environment/docker-compose.dev.yml) and the iOS simulator to capture a baseline of HTTP requests, image refetches, and 429s before any production code changes.

## Acceptance Criteria

- ≥30% fewer HTTP calls on the cold-start home screen compared to the simulator baseline.
- ≥50% fewer image refetches on navigation compared to the simulator baseline.
- Zero 429 responses during a 5-minute simulator walkthrough under normal usage.
- All old non-streaming procedures that are replaced by consolidated endpoints are deleted in the same PR that migrates their last consumer.
- `@mirai-app/common` is renamed to `@mirai-app/common` and all imports/workspace references are updated.
- Existing tests continue to pass; new MSW handlers and PGLite tests cover the consolidated procedures.

## Architecture Overview

Keep the existing stack: Expo React Native, oRPC, TanStack Query, Hono + oRPC backend, WebSocket streaming for location only.

Change the contract: backend read procedures are widened per screen. Native screen hooks call one procedure instead of many. TanStack Query cache becomes the single source of truth for server state; remove hand-written `AsyncStorage` overlays.

Example consolidation:
- `trip.getById` + `group.getByTrip` + `challenge.getByTrip` + `sponsor.getByTrip` + activity fragments → `trip.getByIdFull`.
- `community.getFeed` + `community.getStatistics` + `challenge.getActive` → `community.getCommunityFull`.
- `user.getMy` + `trip.getAll` + `notification.getUnreadCount` → `home.getHomeFull`.

Image URLs are stabilized and served with `expo-image` `cachePolicy="memory-disk"`.

## Implementation Process

### Phase 0: Baseline measurement

1. Start the dev Docker Compose stack.
2. Run the iOS simulator against it.
3. Walk through scenarios and capture backend Pino logs + React Native Network inspector output.
4. Store baseline at `.specs/measurements/native-data-flow.baseline.md`.

### Phase 1: Backend `*Full` procedures (home + trip)

- Add `home.getHomeFull` and `trip.getByIdFull` to existing routers.
- Reuse existing SQL via shared service helpers; no duplicated queries.
- Add PGLite tests and MSW handlers in native.

### Phase 2: Native home and trip details migration

- Replace multi-query hooks on home and trip details screens with consolidated `orpc.*.queryOptions`.
- Remove `AsyncStorage` cache overlays from `useTripDetails` and `useTrips` where redundant.
- Update query key strategy and loading states.

### Phase 3: Delete replaced procedures

- Once `home.getHomeFull` and `trip.getByIdFull` are the only callers, delete the replaced read procedures in the same PR.

### Phase 4: Image layer

- Add `<CachedImage>` wrapper using `expo-image`.
- Migrate remote images in trip hero, partner logos, group avatars, submission previews, profile photos.
- Stabilize image URLs in consolidated payloads.
- Remove `useTripBackgroundImageDownload` and `usePartnerImageDownload`.

### Phase 5: Community + admin screens

- Repeat Phase 1–3 for community and admin screen clusters.

### Phase 6: Package rename

- Rename `@mirai-app/common` to `@mirai-app/common` across the monorepo.
- Update `package.json` workspace names, `tsconfig.json` paths, and all imports.

### Phase 7: Final measurement

- Re-run the simulator walkthrough and compare against baseline.
- Document deltas in `.specs/measurements/native-data-flow.after.md`.

## Definition of Done (Task Level)

- [ ] `.specs/measurements/native-data-flow.baseline.md` exists with request counts.
- [X] Consolidated `home.getHomeFull` and `trip.getByIdFull` procedures exist with tests.
- [X] Native home and trip details use the consolidated procedures with no redundant caches.
- [ ] Replaced procedures deleted in the same migration PRs.
- [X] `<CachedImage>` wrapper exists and is used for all remote images.
- [X] Image URL stability verified (no refetches on remount).
- [X] Community and admin screens consolidated.
- [X] `@mirai-app/common` renamed to `@mirai-app/common`.
- [X] All tests pass (`nx run-many -t test`).
- [ ] Final measurement shows ≥30% fewer home-screen HTTP calls, ≥50% fewer image refetches, zero 429s.

## Out of Scope

- Full offline-first SQLite sync.
- GraphQL migration.
- Server-driven UI JSON payloads.
- Changes to WebSocket streaming procedures.
- New telemetry library or dashboard.
