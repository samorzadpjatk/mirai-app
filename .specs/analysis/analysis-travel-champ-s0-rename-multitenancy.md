# Impact Analysis: S0 — Travel Champ Rename + Multi-Tenant Foundation

**Task:** `.specs/tasks/draft/travel-champ-s0-rename-multitenancy.feature.md`  
**Author:** autonomous agent  
**Date:** 2026-06-21  
**Scratchpad:** `.specs/scratchpad/907ad821cfb68108.md`

## 1. Executive Summary

Sprint 0 renames the MIRAI/PJApp monorepo to **Travel Champ**, switches the license to proprietary, and lays a multi-tenant B2B foundation.

| Risk Area | Level | Rationale |
|---|---|---|
| Package/app rename | Low | Mechanical codemod across ~350 source files; verifiable by a zero-result search for `@mirai-app/`. |
| License change | Low | Single file + `license` field in 11 `package.json` files. |
| Schema migration (organizations, org members, `organizationId`) | Medium-High | Adding a NOT NULL `organizationId` to `trips` requires a sentinel-org backfill before enforcement. Existing PGLite transaction tests must be updated. |
| `requireOrgMembership` middleware | Medium-High | Must be wired correctly through **15 trip-scoped oRPC routers** with mixed procedure types (`public`, `protected`, `moderator`, `admin`, `serviceAccount`). Incorrect placement can leak cross-org data or block valid callers. |
| Dashboard replacement | Medium | Deletes `apps/seed/` and creates `apps/dashboard/`. Seed scripts move; NX targets and package scripts change. |
| **Overall** | **Medium-High** | High file volume is manageable, but schema + security changes have data and correctness consequences. |

## 2. Affected File Counts

Counts are derived from a fresh scan of `@mirai-app/` references plus the mandatory schema/structural changes.

| Type of Change | Count | Notes |
|---|---|---|
| **Modify** | ~350 source files | 285 TS/TSX, 51 Markdown/docs, 10 `package.json`, 3 `project.json`, 3 Vitest configs, 1 ESLint boundaries config, root `package.json`/`LICENSE`/`AGENTS.md`. Excludes cache/dist. |
| **Create** | ~30 files | `packages/db/src/schema/organizations.ts`, `organizationMembers.ts`, `packages/orpc/src/api/middleware/requireOrgMembership.ts`, `apps/dashboard/**` (Vite SPA skeleton, package config, scripts, dashboard routes), `apps/dashboard/scripts/backfill.ts`, plus drizzle migrations/relations updates. |
| **Delete** | ~115 files | Entire `apps/seed/` directory including CLI entrypoints, tests, assets, coverage cache. |

### Rename targets verified in scan

- `package.json` (root + 10 project/package files)
- `apps/backend-server/project.json`, `apps/notification-sender/project.json`, `packages/db/project.json`
- `eslint.boundaries.config.js` (line 32: `checkDynamicDependenciesExceptions: ["@mirai-app/auth"]`)
- All source code in `apps/native/`, `apps/backend-server/`, `apps/notification-sender/`, `apps/seed/`, `packages/auth/`, `packages/common/`, `packages/db/`, `packages/orpc/`, `packages/supabase/`
- Documentation under `docs/`

## 3. Rename & License Impact

### 3.1 Package/workspace names

Current workspace names are `@mirai-app/*`. They live in:

- root `package.json` (`@mirai-app/monorepo`, scripts, `license: "AGPL-3.0"`)
- `apps/*/package.json` (4)
- `packages/*/package.json` (6)
- `apps/backend-server/project.json`
- `apps/notification-sender/project.json`
- `packages/db/project.json`

All must become `@travel-champ/*`.

### 3.2 Root config files

- `LICENSE`: Replace AGPL-3.0 text with proprietary header.
- `package.json`: Update `"name"`, scripts (`dev:backend`, seed scripts, lint/typecheck/test excludes), `"license": "UNLICENSED"`.
- `nx.json`: No literal `@mirai-app/` strings today, but the workspace graph (project names from `package.json`/`project.json`) will change.
- `tsconfig.base.json`: Currently only `extends: "@tsconfig/bun/tsconfig.json"`. No path aliases exist. The task mentions updating it; no actual path renames are required unless the implementation chooses to add explicit paths.
- `AGENTS.md`: Mentions `@mirai-app/*` in project map.

### 3.3 Native app impact

`apps/native/` has **112 files** referencing `@mirai-app/*`. Impact is purely import/prefix rename. Native app behavior is explicitly unchanged in S0 except dropping admin-only dependencies.

## 4. Schema Impact

### 4.1 Current schema files inspected

- `packages/db/src/schema/enums.ts` — role, submission type, scoring category, challenge status, submission status, location sharing request status, reward purchase status, trip role. No organization enums.
- `packages/db/src/schema/users.ts` — flat user table with `role` from `roleEnum`. No org column.
- `packages/db/src/schema/trips.ts` — trip table with name, dates, background image, resources. No org column.
- `packages/db/src/schema/index.ts` — central export barrel and `schemaTables` array for Drizzle.
- `packages/db/src/schema/relations.ts` — existing Drizzle relations must be extended.

### 4.2 New/modified schema files

| File | Change |
|---|---|
| `packages/db/src/schema/enums.ts` | Add `organizationRoleEnum` (`OWNER`, `ADMIN`, `STAFF`) and `planTierEnum` (e.g. `STARTER`, `PRO`, `ENTERPRISE`). |
| `packages/db/src/schema/organizations.ts` | **Create** `organizations` table: `id` UUID PK, `name` text not null, `slug` text unique, `planTier` enum, `createdAt`/`updatedAt`. |
| `packages/db/src/schema/organizationMembers.ts` | **Create** `organizationMembers` table: `id` UUID PK, `organizationId` FK → organizations.id, `userId` FK → users.id, `role` enum, unique `(organizationId, userId)` index. |
| `packages/db/src/schema/users.ts` | Add `organizationId` FK (nullable) + index `users_organization_id_idx`. |
| `packages/db/src/schema/trips.ts` | Add `organizationId` FK. Initially nullable for migration, then NOT NULL after backfill. Add `trips_organization_id_idx`. |
| `packages/db/src/schema/index.ts` | Export new tables and types; add tables to `schemaTables`. |
| `packages/db/src/schema/relations.ts` | Add org relations: `organizations.trips`, `organizations.members`, `users.organizations`/`organization`, `trips.organization`. |

### 4.3 Migration path

Per the task, a **sentinel migration organization** must be created and all existing trips and staff users assigned to it. This requires:

1. A nullable `organizationId` on `trips` in the first migration.
2. `apps/dashboard/scripts/backfill.ts` to create the sentinel org and update existing rows.
3. A follow-up migration making `trips.organizationId` NOT NULL.

Existing `tripParticipants` membership remains the boundary for travelers without an org.

## 5. Middleware Impact

### 5.1 Current oRPC setup

- `packages/orpc/src/api/orpc.ts` declares:
  - `ORPCContext = { db, supabase, headers, accessToken }`
  - `publicProcedure`, `protectedProcedure` (adds `user`, `dbUser`), `moderatorProcedure`, `adminProcedure`, `serviceAccountProcedure`
- `packages/orpc/src/api/middleware/` does **not** exist yet.
- Existing trip-participant checks are decentralized helpers inside router utils (e.g. `ensureTripParticipant`).

### 5.2 New middleware

**Create:** `packages/orpc/src/api/middleware/requireOrgMembership.ts`

Suggested interface:

```ts
export const requireOrgMembership = os
  .$context<{ dbUser: User; db: DB }>()
  .use(async ({ context, input, next }) => {
    const tripId = deriveTripId(input); // from input.tripId or resolved via input.id
    const orgId = await tripOrganizationId(context.db, tripId);
    const callerOrgId = await resolveCallerOrg(context);

    if (!callerOrgId && !(await isTripParticipant(context, tripId))) {
      throw new ORPCError("FORBIDDEN", { message: "Cross-organization access denied" });
    }
    if (callerOrgId && orgId !== callerOrgId) {
      throw new ORPCError("FORBIDDEN", { message: "Cross-organization access denied" });
    }

    return next({ context: { organizationId: orgId } });
  });
```

The middleware should be exported from `packages/orpc/src/api/orpc.ts` (or a new middleware barrel) so routers can import it.

### 5.3 Router wiring (15 trip-scoped routers)

| Router | File(s) to Modify | Endpoints/Paths Requiring `requireOrgMembership` |
|---|---|---|
| `trip` | `packages/orpc/src/api/routers/trip/index.ts` | `getById`, `getByIdFull`, `getResources`, `create`, `update`, `delete` (all trip-scoped) |
| `user` | `packages/orpc/src/api/routers/user/index.ts` | `getAll(tripId)`, `getTripParticipant`, `getByIdWithGroup`, `createUser`, `updateWristNumber`, `updateHouseNumber`, and friends that pass `tripId` |
| `challenge` | `packages/orpc/src/api/routers/challenge/index.ts` | `getAllByTrip`, `getById`, `create`, `update`, `delete`, `forceCloseVoting` |
| `challengeSubmission` | `packages/orpc/src/api/routers/challengeSubmission/index.ts` | `getByChallenge(tripId)`, `getById`, `create`, `updateMine`, `deleteMine`, `review`, `adminDelete` |
| `challengeVote` | `packages/orpc/src/api/routers/challengeVote/index.ts` | `getMyByChallenge`, `getByChallenge`, `getJudgedStaffProgress*`, `submitVotes`, `submitVote` |
| `reward` | `packages/orpc/src/api/routers/reward/index.ts` | `getByTrip`, `getByTripAdmin`, `create`, `update`, `setHidden`, `delete`, `purchase`, `getPurchaseHistory`, `getTotalAvailablePoints` |
| `group` | `packages/orpc/src/api/routers/group/index.ts` | `getMy(tripId)`, `getAll`, `create(tripId)`, `update`, `join(tripId)`, `assignUserToGroup`, `ranking` |
| `sponsor` | `packages/orpc/src/api/routers/sponsor/index.ts` | `getByTripId` (public trip query), `addToTrip`, `removeFromTrip` |
| `coin` | `packages/orpc/src/api/routers/coin/index.ts` | `addCoins`, `removeCoins` |
| `coinTransaction` | `packages/orpc/src/api/routers/coinTransaction/index.ts` | `getStatistics`, `getMostActiveAdminStats`, `getAll`, `getQuickStats`, `getAdditionalInsights`, `getCoinTransactions` |
| `activityFeed` | `packages/orpc/src/api/routers/activityFeed/index.ts` | `getByTrip`, `getByTripModeration`, `createCustom`, `createUserPost`, `createSubmissionActivity`, `createChallengeActivity`, `createRankChangeActivity`, `update`, `setPinned`, `hide`, `unhide`, `toggleReaction` (all have `tripId`) |
| `location` | `packages/orpc/src/api/routers/location/index.ts` | `updateSharingSettings`, `getFriendsLocationsStream`, `updateLocation`, `getAllUsersForSharing`, `addUserToSharing`, `removeUserFromSharing` (when `tripId` provided) |
| `notificationSchedule` | `packages/orpc/src/api/routers/notificationSchedule/mutations.ts`, `queries.ts` | `create`, `upsertTemplate`, `update`, `deleteSchedule`, `bulkDelete`, `duplicate`, `toggleActive`, `bulkToggleActive`, `getAll`, `getActiveSchedules`, `getUpcoming`, `getById`, `getExecutionHistory` |
| `notificationDelivery` | `packages/orpc/src/api/routers/notificationDelivery/queries.ts` | `getDeliveries`, `getDeliveryByNotificationId`, `getDeliveryStats`, `getFailedDeliveries` (serviceAccount) |
| `community` | `packages/orpc/src/api/routers/community/index.ts` | `getCommunityFull(tripId)` |

The non-trip routers (`home`, `notifications`, `notificationSender`, `storage`) only need the package rename.

## 6. Dashboard App Impact

`apps/seed/` is removed entirely. A new `apps/dashboard/` is added as a Vite + React + TypeScript SPA.

### 6.1 Files to delete (`apps/seed/`)

Roughly **115 files** including:

- `apps/seed/index.ts`, `reset.ts`, `package.json`, `tsconfig.json`, `vitest.config.ts`, `vitest.setup.ts`
- `apps/seed/src/*.ts` (auth, config, rewards, seed, sponsors, storage, trips, tripInfo, types, users, constants)
- `apps/seed/src/__tests__/*.ts`
- `apps/seed/src/utils/*.ts`
- `apps/seed/assets/**/*`
- `apps/seed/coverage/**/*` (generated, should be gitignored but exists in tree)

### 6.2 Files to create (`apps/dashboard/`)

Suggested skeleton:

- `apps/dashboard/package.json`
- `apps/dashboard/project.json` (NX registration)
- `apps/dashboard/tsconfig.json`, `tsconfig.node.json`
- `apps/dashboard/vite.config.ts`
- `apps/dashboard/index.html`
- `apps/dashboard/src/main.tsx`, `src/App.tsx`, `src/router.tsx`
- `apps/dashboard/src/pages/Index.tsx` (landing page)
- `apps/dashboard/src/lib/orpc.ts` (client setup)
- `apps/dashboard/src/components/...`
- `apps/dashboard/scripts/seed.ts` (moved/adapted from `apps/seed/src/seed.ts`)
- `apps/dashboard/scripts/backfill.ts` (new sentinel migration script)

### 6.3 Seed script port

`apps/seed/src/seed.ts` currently:

- Loads auth users, trip configs, sponsors, rewards, trip info.
- Seeds sequential trips per environment.

For the dashboard, this logic becomes `apps/dashboard/scripts/seed.ts` and should be expanded to create **3 demo agencies** with isolated trips/users. Root `package.json` scripts (`seed:dev`, `seed:prod`, etc.) must point to `@travel-champ/dashboard` targets.

## 7. Key Integration Points

| Component | Path | Role in S0 |
|---|---|---|
| Workspace root | `package.json`, `nx.json`, `eslint.boundaries.config.js`, `LICENSE`, `AGENTS.md` | Mechanical rename + license + package graph |
| oRPC core | `packages/orpc/src/api/orpc.ts` | Import rename; extend `protectedProcedure` context with org info; export new middleware |
| oRPC router barrel | `packages/orpc/src/api/root.ts` | Import rename only |
| Auth types | `packages/auth/src/types.ts`, `authServer.ts` | `DatabaseUser` gains `organizationId` after schema change |
| DB schema | `packages/db/src/schema/*` | New tenant tables, `organizationId` FKs, indexes, relations |
| DB migrations | `packages/db/drizzle/` | Generated migrations for new tables and backfill/NOT NULL transitions |
| Trip-scoped routers | `packages/orpc/src/api/routers/{trip,user,challenge,challengeSubmission,challengeVote,reward,group,sponsor,coin,coinTransaction,activityFeed,location,notificationSchedule,notificationDelivery,community}` | Wire `requireOrgMembership` on relevant endpoints |
| Server entry | `apps/backend-server/src/server.ts`, `bun-server.ts` | Import rename; serve dashboard dist in production |
| Native app | `apps/native/` | Import rename only |
| Old CLI | `apps/seed/` | Deleted |
| New dashboard | `apps/dashboard/` | Created with Vite + React + TypeScript SPA |

## 8. Verification Plan

Per the task, the following gates should pass after implementation:

1. `nx run-many -t build && nx run-many -t typecheck && nx run-many -t test` exits 0.
2. `aft_search({query: "@mirai-app"})` returns 0 results in source files (allow cache/dist).
3. Cross-org trip query returns HTTP 403 for all 15 routers.
4. Seeded DB contains 3 organizations with non-overlapping trips.
5. Dashboard landing page renders at `http://localhost:5173`.

## 9. Risk Detail

| Risk | Likely Failure Mode | Mitigation |
|---|---|---|
| Missing rename in cache/dist | Build errors or stale `d.ts` files | `nx run-many -t clean`, regenerate, search in CI |
| Missing `project.json`/`package.json` name | NX graph breaks scripts | Update all 3 `project.json` and all 11 `package.json` |
| NOT NULL `trips.organizationId` before backfill | Migration fails on existing data | Two-step migration: nullable first, backfill, then enforce NOT NULL |
| Traveler (no org) blocked from own trip | 403 for legitimate user endpoints | Middleware must fall back to `tripParticipants` membership when `dbUser.organizationId` is null |
| Org admin accessing trip in same org | 403 due to `trip.organizationId` not set after seed | Backfill must assign seeded trips to the caller's org |
| Public trip endpoints leaked | `sponsor.getByTripId` returns data for wrong org | Wire middleware on public trip endpoints too |
| Service-account router bypass | `notificationDelivery` leaks cross-org deliveries | Apply org check even for `serviceAccountProcedure` |
| Dashboard build not wired | `dev:dashboard` script missing, proxy not configured | Add NX targets and Vite proxy in `vite.config.ts` |

## 10. Recommended Order of Work

1. Rename + license (Phase 1) to stabilize build graph.
2. Add new schema tables with nullable `organizationId` and generate migration.
3. Write and run `apps/dashboard/scripts/backfill.ts`.
4. Enforce NOT NULL on `trips.organizationId` and regenerate migration.
5. Implement `requireOrgMembership.ts` and add unit tests.
6. Wire middleware on the 15 trip-scoped routers, writing the parametric PGLite test as you go.
7. Create `apps/dashboard/` Vite skeleton and port/move seed scripts.
8. Update root scripts and run the verification suite.
