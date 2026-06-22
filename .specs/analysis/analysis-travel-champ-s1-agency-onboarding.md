# Impact Analysis: S1 — Travel Champ Agency Onboarding

**Task:** `.specs/tasks/draft/travel-champ-s1-agency-onboarding.feature.md`  
**Depends on:** `.specs/tasks/todo/travel-champ-s0-rename-multitenancy.feature.md`  
**Author:** autonomous agent  
**Date:** 2026-06-21  
**Scratchpad:** `.specs/scratchpad/19291f99efa7fcc7.md`

## 1. Executive Summary

Sprint 1 adds the first B2B self-serve flow to Travel Champ: agency owners sign up with email OTP, create an organization, create trips, and invite staff through the new dashboard. The sprint introduces a new `organization` oRPC router, extends `trip` creation with org scoping, and builds five dashboard pages plus auth helpers and a trial banner.

| Risk Area | Level | Rationale |
|---|---|---|
| Dependency on incomplete S0 | **High** | S1 assumes S0 outcomes (package rename, multi-tenant schema, `requireOrgMembership` middleware, `apps/dashboard` skeleton) that are **not yet applied** in the repository. |
| Org router + schema | Medium-High | New `organizations` / `organizationMembers` tables and procedures must coexist with the legacy global role system during transition. |
| Dashboard auth flow | Medium | OTP helpers exist for the native app but need porting to Vite dashboard with route guards and session persistence. |
| Trip creation org-scoping | Medium | Changes `create` from `adminProcedure` to org-membership check; cross-org creation must return 403. |
| Trial banner / UI | Low | Pure presentational component reading `organizations.trialEndsAt`. |

## 2. Affected File Counts

Counts include both **pure S1 changes** and the **implicit S0 residuals** required because the repository is still in pre-S0 state. Pure S1 counts are shown in brackets where they differ.

| Type of Change | Count | Notes |
|---|---|---|
| **Create** | ~25 [~12 pure S1] | New org router (3 files + tests), dashboard pages (6), components, auth helpers, route definitions, dashboard layout, PGLite tests, Playwright tests. |
| **Modify** | ~45 [~15 pure S1] | Schema index/relations, `orpc.ts` context, `root.ts`, `trip/mutations.ts`, `trip/index.ts`, `authServer.ts`/`types.ts`, dashboard client/router, `backend-server` static serving, existing seed/demo data. |
| **Delete** | ~115 [0 pure S1] | Entire `apps/seed/` directory must be removed as part of the unresolved S0 work. |

## 3. Files to Create (S1)

### 3.1 Backend — Organization router

| File | Purpose |
|---|---|
| `packages/orpc/src/api/routers/organization/index.ts` | Barrel exporting `organizationRouter`. |
| `packages/orpc/src/api/routers/organization/queries.ts` | `getMyOrganization`, `getOrganizationBySlug`. |
| `packages/orpc/src/api/routers/organization/mutations.ts` | `createOrganization`, `updateOrganization`, `inviteStaff`, `acceptInvite`. |
| `packages/orpc/src/api/routers/organization/types.ts` | Shared Zod/input types (optional, consistent with other routers). |
| `packages/orpc/src/api/routers/organization/__tests__/organization.pglite.test.ts` | PGLite tests for all 5 endpoints. |

### 3.2 Backend — Tests

| File | Purpose |
|---|---|
| `packages/orpc/src/api/routers/__tests__/trip.create.pglite.test.ts` | Verify only org OWNER/ADMIN can create trips, and `organizationId` is persisted. |
| `packages/orpc/src/api/routers/__tests__/organization.crossOrg.pglite.test.ts` | Verify cross-org trip creation returns 403. |

### 3.3 Dashboard pages and layout

| File | Purpose |
|---|---|
| `apps/dashboard/src/pages/Signup.tsx` | Email input; calls `supabase.auth.signInWithOtp`. |
| `apps/dashboard/src/pages/Verify.tsx` | OTP token input; calls `supabase.auth.verifyOtp`. |
| `apps/dashboard/src/pages/Onboarding.tsx` | Organization name/slug form; calls `createOrganization`; redirects to `/trips`. |
| `apps/dashboard/src/pages/Trips.tsx` | Org-scoped trip list via React Query + `organization.getMyOrganization` / `trip.getAll`. |
| `apps/dashboard/src/pages/TripsNew.tsx` | New trip form; calls `trip.create`. |
| `apps/dashboard/src/pages/Staff.tsx` | Staff list, pending invites, invite form; calls `organization.inviteStaff`. |
| `apps/dashboard/src/components/TrialBanner.tsx` | Reads `organization.trialEndsAt` and renders countdown. |
| `apps/dashboard/src/layouts/DashboardLayout.tsx` | Root layout with `TrialBanner`, navigation, route guards. |
| `apps/dashboard/src/lib/auth.ts` | Dashboard-only Supabase OTP helpers (`signInWithOtp`, `verifyOtp`, `signOut`, session refresh). |
| `apps/dashboard/src/router.tsx` | `createBrowserRouter` with `/signup`, `/verify`, `/onboarding`, `/trips`, `/trips/new`, `/staff`. |

### 3.4 Tests

| File | Purpose |
|---|---|
| `apps/dashboard/e2e/signup-onboarding-create-trip.spec.ts` | Playwright E2E: signup → verify → onboarding → create trip. |
| `apps/dashboard/e2e/staff-invite-accept.spec.ts` | Playwright E2E: owner invites staff → staff accepts via OTP. |

## 4. Files to Modify (S1)

### 4.1 Database schema

| File | Change |
|---|---|
| `packages/db/src/schema/enums.ts` | Add `organizationRoleEnum` (`OWNER`, `ADMIN`, `STAFF`) and `planTierEnum` (`STARTER`, `PRO`, `ENTERPRISE`) if not already added by S0. |
| `packages/db/src/schema/organizations.ts` | Create table if missing; add `trialEndsAt` timestamp field required by S1 banner. |
| `packages/db/src/schema/organizationMembers.ts` | Create membership table if missing; ensure `acceptedAt` nullable for invite flow. |
| `packages/db/src/schema/trips.ts` | Add `organizationId` FK (if S0 missed it) and ensure `NOT NULL` after backfill. |
| `packages/db/src/schema/users.ts` | Add `organizationId` FK (nullable) if S0 missed it. |
| `packages/db/src/schema/index.ts` | Export new tables/types; add to `schemaTables`. |
| `packages/db/src/schema/relations.ts` | Add `organizations.trips`, `organizations.members`, `users.organization`, `trips.organization`. |
| `packages/db/drizzle/` | Generate migrations for new tables/columns and for `trialEndsAt`. |

### 4.2 oRPC core

| File | Change |
|---|---|
| `packages/orpc/src/api/orpc.ts` | Enrich `protectedProcedure` context with `organizationId` / org role; expose org-scoped procedure helpers. If S0 did not add `requireOrgMembership`, create it here. |
| `packages/orpc/src/api/root.ts` | Import and export `organizationRouter` in `appRouter`. |
| `packages/orpc/src/api/middleware/requireOrgMembership.ts` | Add `organizationId`-based membership check with OWNER/ADMIN/STAFF roles if missing. |
| `packages/orpc/src/api/routers/trip/mutations.ts` | Update `createTrip` to accept/require `organizationId`; insert it into `trips`. Add role/org check in handler. |
| `packages/orpc/src/api/routers/trip/index.ts` | Change `create` from `adminProcedure` to org-role-protected procedure; wire membership middleware. |

### 4.3 Auth package

| File | Change |
|---|---|
| `packages/auth/src/types.ts` | Add `organizationId: string \| null` to `DatabaseUser` if not present. |
| `packages/auth/src/authServer.ts` | `requireAuth` should return `dbUser` including `organizationId`; consider soft migration path where `organizationId` is looked up via `organizationMembers` if `users.organizationId` is null. |

### 4.4 Dashboard skeleton

| File | Change |
|---|---|
| `apps/dashboard/src/main.tsx` | Import and render `RouterProvider`. |
| `apps/dashboard/src/App.tsx` | Replace default Vite landing with dashboard route tree or remove in favor of router-driven layout. |
| `apps/dashboard/src/lib/orpc.ts` | Configure `@travel-champ/orpc/client` + React Query (reuse native client patterns). |
| `apps/dashboard/src/index.css` / Tailwind | Add styling for forms and trial banner if not configured. |
| `apps/dashboard/package.json` | Add `@travel-champ/orpc`, `@travel-champ/auth`, `@travel-champ/supabase`, `@tanstack/react-query`, `react-router-dom`, `date-fns` (for countdown). |
| `apps/backend-server/src/server.ts` / `bun-server.ts` | Serve `apps/dashboard/dist/` in production (if S0 missed it). |

## 5. Files Potentially to Delete

| File/Path | Reason |
|---|---|
| `apps/seed/` | Should already be removed by S0; if still present, deletion is required before dashboard can replace it. |

## 6. Key Integration Points

| Component | Path | Role in S1 |
|---|---|---|
| oRPC org context | `packages/orpc/src/api/orpc.ts` | Must expose `dbUser.organizationId` and org-role procedures so `organization` and `trip` routers can scope operations. |
| Org membership middleware | `packages/orpc/src/api/middleware/requireOrgMembership.ts` | Verifies caller belongs to target organization (or derives org from trip) before mutating data. |
| Organization router | `packages/orpc/src/api/routers/organization/` | New backend surface for signup agency creation, updates, staff invites, and invite acceptance. |
| Trip creation | `packages/orpc/src/api/routers/trip/mutations.ts` | Must attach `organizationId` to new trips and reject callers without OWNER/ADMIN role in that org. |
| Supabase OTP | `apps/dashboard/src/lib/auth.ts` | Reuses native Supabase OTP flow (`signInWithOtp`, `verifyOtp`) in Vite dashboard. |
| Dashboard route guards | `apps/dashboard/src/router.tsx` + `DashboardLayout.tsx` | Redirect unauthenticated users to `/signup`; redirect org-less users to `/onboarding`; show trial banner on every dashboard route. |
| React Query hooks | `apps/dashboard/src/lib/orpc.ts` | Drives `useQuery`/`useMutation` for org, trip, and staff endpoints. |
| Trial banner | `apps/dashboard/src/components/TrialBanner.tsx` | Reads `organization.trialEndsAt` and calculates days remaining. |
| DB schema | `packages/db/src/schema/*` | Organizations, organization members, `trips.organizationId`, `users.organizationId`, `trialEndsAt`. |
| Backend static serving | `apps/backend-server/src/server.ts`, `bun-server.ts` | Serves built dashboard in production. |

## 7. Dependency / Blocker Detail

The biggest risk is that **S0 has not been executed** despite the S1 task being active. Before starting S1 implementation, confirm the following S0 artifacts exist:

1. `@travel-champ/*` package scope applied and `@mirai-app/*` eliminated.
2. `packages/db/src/schema/organizations.ts` and `organizationMembers.ts` exist.
3. `trips` and `users` tables have `organizationId` columns (with `trips.organizationId` NOT NULL).
4. `requireOrgMembership` middleware exists and is wired on trip-scoped routers.
5. `apps/dashboard/` Vite SPA scaffold builds and runs.
6. `apps/seed/` is removed.
7. `packages/auth/src/types.ts` exposes `DatabaseUser.organizationId`.

If these are not present, S1 work will fail type-check and tests. **Recommended:** complete or apply S0 first, then re-run this impact analysis with the post-S0 file tree to get pure S1 file counts.

## 8. Verification Plan

| Area | How |
|---|---|
| Org router | PGLite tests for `createOrganization`, `getMyOrganization`, `updateOrganization`, `inviteStaff`, `acceptInvite`. |
| Org scoping | PGLite test that user in org A cannot create a trip in org B. |
| Dashboard auth | Playwright E2E: signup → verify → onboarding → create trip. |
| Staff invite | Playwright E2E: invite staff → accept via OTP → verify `organizationMembers` row with `role=STAFF`, `acceptedAt` set. |
| Trial banner | Component test / E2E asserting days-remaining text renders when `trialEndsAt` is in the future. |
| Type safety | `nx run-many -t typecheck` exits 0. |
| Build | `nx run-many -t build` exits 0. |

## 9. Risk Detail

| Risk | Likely Failure Mode | Mitigation |
|---|---|---|
| S0 not applied | S1 code references non-existent schema, package names, and middleware. | Block S1 until S0 acceptance criteria pass; re-run dependency check. |
| Legacy global roles vs org roles | `createTrip` currently uses `adminProcedure` (global ADMIN). Switching to org roles may conflict with existing native/admin flows. | Keep legacy `roleEnum` for native admin users during transition; add org-role check only for dashboard callers. |
| Slug collisions | `createOrganization` auto-generates slug from name; duplicate slugs must be rejected without leaking existing org info. | Add unique DB constraint + localized Zod error; verify via test. |
| Invite acceptance race | `inviteStaff` creates OTP invite; `acceptInvite` must idempotently insert `organizationMembers` only once. | Use unique `(organizationId, userId)` index and `on conflict do nothing` or upsert. |
| Cross-org trip creation | Missing membership check allows org-staff to create trips in other orgs. | Add `requireOrgMembership` to `trip.create` with OWNER/ADMIN role enforcement. |
| Dashboard session loss on refresh | Vite SPA loses Supabase session if `persistSession` not configured. | Use `@supabase/supabase-js` `persistSession: true` and `AuthTokenProvider` pattern from native. |
| Trial banner stale data | `trialEndsAt` rendered from cached org data may be outdated. | Set short `staleTime` for org query or invalidate on update. |
