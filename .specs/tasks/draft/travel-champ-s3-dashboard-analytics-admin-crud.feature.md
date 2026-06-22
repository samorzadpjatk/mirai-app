---
title: S3 — Build agency analytics dashboard and migrate admin CRUD from native to dashboard
depends_on: [.specs/tasks/draft/travel-champ-s2-billing-subscription.feature.md]
---

## Initial User Prompt

Build the agency owner dashboard in Travel Champ with KPI cards, engagement charts, traveler roster, and trip detail analytics. Migrate all admin CRUD screens (challenges, rewards, groups, activities, schedules, transactions, users) from the native app into the dashboard so agency owners manage everything from the web.

## Description

Sprint 3 gives agency owners an ROI view and completes the move of administration from the on-site native app to the web dashboard. A new analytics router provides org-level KPIs and engagement breakdowns. Dashboard pages display KPI cards and charts, a searchable traveler roster, per-trip engagement details, and full CRUD for challenges, rewards, groups, activities, schedules, transactions, and trip users. The native app's 26 admin files are no longer needed (they will be removed in Sprint 5).

**Scope**:
- Included: Analytics router, dashboard home KPIs/charts, traveler roster, trip detail analytics, dashboard CRUD for challenges, rewards, groups, activities, schedules, transactions, users.
- Excluded: White-label, templates, i18n, native app changes.

## User Scenarios

1. **Primary Flow**: Agency owner opens dashboard home, sees active trips, travelers this month, challenge completion rate, coins issued, rewards redeemed; clicks a trip to see per-day engagement.
2. **Alternative Flow**: Owner creates a new challenge directly in the dashboard for an upcoming trip.
3. **Error Handling**: Cross-org traveler or trip data is not visible in roster or analytics.

## Architecture Overview

### Solution Strategy

- **Analytics router** (`packages/orpc/src/api/routers/analytics/`):
  - `getOrgKpis(dateRange)` — aggregate active trips, travelers, completion rate, coins, rewards.
  - `getTripEngagement(tripId)` — per-day breakdown.
  - `getTravelerRoster({pagination})` — org-wide travelers with lifetime stats.
  - `getEngagementTimeSeries(range)` — daily counts for charts.
- **Dashboard pages**:
  - `/` — home with KPI cards and charts (line + bar).
  - `/trips/:id` — trip detail with engagement.
  - `/travelers` — org-wide searchable roster.
  - `/trips/:id/challenges`, `/trips/:id/challenges/new`, `/trips/:id/challenges/:challengeId/edit`.
  - `/trips/:id/rewards`, `/trips/:id/rewards/new`, `/trips/:id/rewards/:rewardId/edit`.
  - `/trips/:id/groups`, `/trips/:id/groups/:groupId/edit`.
  - `/trips/:id/activities`, `/trips/:id/schedules`, `/trips/:id/transactions`, `/trips/:id/users`.
- **Charts**: Use `recharts` (lightweight React charting library).
- **CRUD reuse**: All backend mutations already exist from native admin; only dashboard UI is needed.

### Key Architectural Decisions

1. **Backend-first analytics**: Aggregations computed in SQL in the analytics router; no separate data warehouse for MVP.
2. **CRUD pages mirror native admin sections**: Reduces learning curve for agencies moving from native to dashboard.
3. **Charts only on home + trip detail**: Avoids chart overload; keep other pages data-dense tables.

### Expected Changes

| Type | Path | Change |
|---|---|---|
| Create | `packages/orpc/src/api/routers/analytics/` | KPI + engagement queries |
| Create | `apps/dashboard/src/pages/Home.tsx` | KPIs + charts |
| Create | `apps/dashboard/src/pages/Travelers.tsx` | traveler roster |
| Create | `apps/dashboard/src/pages/TripDetail.tsx` | trip detail analytics |
| Create | `apps/dashboard/src/pages/Challenges*.tsx` | challenge CRUD |
| Create | `apps/dashboard/src/pages/Rewards*.tsx` | reward CRUD |
| Create | `apps/dashboard/src/pages/Groups*.tsx` | group CRUD |
| Create | `apps/dashboard/src/pages/Activities.tsx` | activity moderation |
| Create | `apps/dashboard/src/pages/Schedules.tsx` | notification schedules |
| Create | `apps/dashboard/src/pages/Transactions.tsx` | coin transactions |
| Create | `apps/dashboard/src/pages/TripUsers*.tsx` | user management |
| Modify | `apps/dashboard/src/router.tsx` | add routes |

## Implementation Process

### Phase 1: Analytics router + tests (8h)
- **Step 1.1**: Create `analytics/queries.ts` with `getOrgKpis`, `getTripEngagement`, `getTravelerRoster`, `getEngagementTimeSeries`.
- **Step 1.2**: Write PGLite tests verifying aggregations match seeded fixture data.

### Phase 2: Dashboard home + charts (6h)
- **Step 2.1**: Build `Home.tsx` with KPI cards and `recharts` line/bar charts.
- **Step 2.2**: Add Playwright E2E asserting KPIs render non-zero for seeded org.

### Phase 3: Traveler roster + trip detail (4h)
- **Step 3.1**: Build `Travelers.tsx` with search, filter by trip, infinite scroll.
- **Step 3.2**: Build `TripDetail.tsx` with engagement breakdown and top travelers.

### Phase 4: Challenge + reward CRUD (10h)
- **Step 4.1**: Build `Challenges.tsx`, `ChallengeNew.tsx`, `ChallengeEdit.tsx`.
- **Step 4.2**: Build `Rewards.tsx`, `RewardNew.tsx`, `RewardEdit.tsx`.
- **Step 4.3**: Add E2E tests for create/edit/delete.

### Phase 5: Group + activity + schedule + transaction + user CRUD (10h)
- **Step 5.1**: Build `Groups.tsx`, `GroupEdit.tsx`.
- **Step 5.2**: Build `Activities.tsx` (moderation), `Schedules.tsx`, `Transactions.tsx`.
- **Step 5.3**: Build `TripUsers.tsx`, `TripUserEdit.tsx` (ban, wrist#, house#).
- **Step 5.4**: Add route wiring and E2E smoke tests.

## Verification

### Functional verification
- Dashboard home renders 5 KPIs and 2 charts for seeded agency.
- Traveler roster search/filter works and is org-scoped.
- Trip detail shows per-day engagement breakdown matching fixture data.
- Challenge/reward/group create/edit/delete flows work and are org-scoped.
- Activity moderation, schedule creation, coin adjustment, and user ban work.

### Test coverage
- PGLite tests for analytics router.
- Playwright E2E for dashboard home KPIs.
- Playwright E2E for each CRUD flow (challenge, reward, group, user ban).

## Files touched (estimated)

- `packages/orpc/src/api/routers/analytics/` (NEW)
- `apps/dashboard/src/pages/Home.tsx` (NEW)
- `apps/dashboard/src/pages/Travelers.tsx` (NEW)
- `apps/dashboard/src/pages/TripDetail.tsx` (NEW)
- `apps/dashboard/src/pages/{Challenges,ChallengeNew,ChallengeEdit,Rewards,RewardNew,RewardEdit,Groups,GroupEdit,Activities,Schedules,Transactions,TripUsers,TripUserEdit}.tsx` (NEW)
- `apps/dashboard/src/router.tsx`
- `apps/dashboard/src/components/charts/` (NEW)
