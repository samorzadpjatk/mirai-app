---
title: S5 — Add backend-driven i18n EN+PL, strip native admin screens, add on-site staff tools, and post-trip carry-over
depends_on: [.specs/tasks/draft/travel-champ-s3-dashboard-analytics-admin-crud.feature.md]
---

## Initial User Prompt

Add EN+PL localization to Travel Champ using backend-driven translation maps. Strip all admin screens from the native app (they are now in the dashboard) and keep only minimal on-site staff tools for trip crew. Add traveler profile carry-over across trips and a post-trip summary screen to drive repeat bookings.

## Description

Sprint 5 prepares Travel Champ for the EU market (Poland first, then UK/IE/DE post-MVP). Translations are served from the backend as `{ID: localizedString}` maps per language; the frontend fetches and caches them, displaying strings by ID. The native app loses its 26 admin files (migrated to dashboard in S3) and keeps traveler-facing tabs plus four minimal on-site staff tools: challenge review, coin adjust, send notification, and ban user. Traveler progress persists across trips via the new `travelerProfiles` table, and a post-trip summary screen shows stats + repeat-booking CTA.

**Scope**:
- Included: Backend `GET /api/i18n/:lang` route, translation maps for EN+PL, `useTranslations` hooks, extraction of all hardcoded strings, deletion of native admin directory, 4 on-site staff screens, `travelerProfiles` schema/router, post-trip summary screen.
- Excluded: Additional languages, multi-brand app distribution, post-trip email campaigns.

## User Scenarios

1. **Primary Flow**: Traveler switches language to Polish in profile → all UI strings become Polish without reload.
2. **Alternative Flow**: Trip guide (with `tripRoleEnum=ORGANIZER`) opens staff tab on-site, approves a challenge submission, and awards bonus coins.
3. **Error Handling**: Staff-only screens hidden from travelers (`tripRoleEnum=MEMBER`); accessing banned/missing translation ID falls back to the key itself.

## Architecture Overview

### Solution Strategy

- **Backend i18n**: Custom Hono route `GET /api/i18n/:lang` returning `{id: string}` map. Translations stored as TS objects in `packages/common/src/i18n/translations/{en,pl}.ts` for type safety, served with `Cache-Control: public, max-age=86400`.
- **Frontend i18n**: `useTranslations()` hook fetches map via React Query, caches in AsyncStorage/LocalStorage 24h, exposes `t('namespace.key', params?)` with `{{param}}` interpolation.
- **Native app scoping**:
  - **DELETE**: `apps/native/src/app/(tabs)/admin/` (26 files across activity, challenges, rewards, coins, groups, schedules, transactions, users, notifications).
  - **KEEP**: traveler-facing tabs (trips, rewards, leaderboard, map, notifications, profile).
  - **ADD**: `apps/native/src/app/(tabs)/staff/` with `challenge-review.tsx`, `coin-adjust.tsx`, `send-notification.tsx`, `ban-user.tsx`.
- **Staff gating**: Use `tripRoleEnum` values `ORGANIZER`/`ADMIN`/`COORDINATOR` on `tripParticipants.role` for the current trip. Not `organizationRoleEnum` (org-level) and not global `roleEnum`.
- **Traveler carry-over**: `travelerProfiles` table tracks `lifetimeCoins`, `lifetimeChallenges`, `badges[]`, `lastTripId`. Updated on challenge submission approval.
- **Post-trip summary**: `apps/native/src/app/(tabs)/trips/[id]/summary.tsx` shown after `endDate`; CTA links to agency booking URL.

### Key Architectural Decisions

1. **Backend as single source of truth for translations**: Prevents divergent locale files; easy to add languages later.
2. **Delete native admin entirely**: Native app becomes traveler + on-site crew only; heavier admin lives on dashboard.
3. **Post-trip summary drives repeat bookings**: Repeat-booking rate is a key agency ROI metric.

### Expected Changes

| Type | Path | Change |
|---|---|---|
| Create | `packages/common/src/i18n/translations/en.ts` | EN strings |
| Create | `packages/common/src/i18n/translations/pl.ts` | PL strings |
| Create | `packages/common/src/i18n/index.ts` | types + loader |
| Create | `apps/backend-server/src/routes/i18n.ts` | custom route |
| Create | `apps/dashboard/src/hooks/useTranslations.ts` | dashboard hook |
| Create | `apps/native/src/hooks/i18n/useTranslations.ts` | native hook |
| Modify | `apps/native/src/**/*.{ts,tsx}` | replace hardcoded strings with `t()` |
| Modify | `apps/dashboard/src/**/*.{ts,tsx}` | replace hardcoded strings with `t()` |
| Delete | `apps/native/src/app/(tabs)/admin/` | 26 files removed |
| Create | `apps/native/src/app/(tabs)/staff/` | 4 staff screens |
| Create | `packages/db/src/schema/travelerProfiles.ts` | carry-over table |
| Create | `packages/orpc/src/api/routers/travelerProfile/` | profile router |
| Modify | `packages/orpc/src/api/routers/challenge/mutations.ts` | update profile on approval |
| Create | `apps/native/src/app/(tabs)/trips/[id]/summary.tsx` | post-trip screen |

## Implementation Process

### Phase 1: Backend i18n (4h)
- **Step 1.1**: Create EN + PL translation maps with namespace structure.
- **Step 1.2**: Create Hono route `/api/i18n/:lang`.
- **Step 1.3**: Add curl test verifying both maps have identical keys and correct strings.

### Phase 2: useTranslations hooks (3h)
- **Step 2.1**: Implement `useTranslations` for native and dashboard with 24h caching.
- **Step 2.2**: Support language switcher and interpolation.
- **Step 2.3**: Add unit tests.

### Phase 3: Extract strings (8h)
- **Step 3.1**: Find all user-facing strings (including Polish at `packages/common/src/users/participantResult.ts:47`).
- **Step 3.2**: Replace with `t('namespace.key')` and register IDs in EN+PL maps.
- **Step 3.3**: Add Playwright screenshot diff tests for EN/PL layout parity.

### Phase 4: Native app scoping (8h)
- **Step 4.1**: Delete `apps/native/src/app/(tabs)/admin/`.
- **Step 4.2**: Create 4 staff screens under `staff/`.
- **Step 4.3**: Gate staff tab on `tripRoleEnum` ORGANIZER/ADMIN/COORDINATOR.
- **Step 4.4**: Add E2E verifying travelers don't see staff tab and staff do.

### Phase 5: Traveler profiles + post-trip summary (8h)
- **Step 5.1**: Create `travelerProfiles` table and PGLite tests.
- **Step 5.2**: Create `travelerProfile` router.
- **Step 5.3**: Extend challenge approval mutation to increment lifetime stats.
- **Step 5.4**: Create post-trip summary screen with stats and repeat-booking CTA.

## Verification

### Functional verification
- `GET /api/i18n/en` and `GET /api/i18n/pl` return JSON maps with identical ID keys.
- Switching language updates dashboard and native UI without reload.
- Native admin directory no longer exists; staff tab only visible to ORGANIZER/ADMIN/COORDINATOR trip roles.
- Completing a challenge increments `travelerProfiles.lifetimeChallenges` and `lifetimeCoins`.
- Post-trip summary renders correct stats after `endDate` and shows booking CTA.

### Test coverage
- PGLite tests for `travelerProfiles` and challenge approval carry-over.
- Unit tests for `useTranslations` hook.
- Playwright screenshot diff EN vs PL (dashboard + native if feasible).
- E2E for native role-based staff tab visibility.
- E2E for post-trip summary.

## Files touched (estimated)

- `packages/common/src/i18n/` (NEW)
- `apps/backend-server/src/routes/i18n.ts` (NEW)
- `apps/dashboard/src/hooks/useTranslations.ts` (NEW)
- `apps/native/src/hooks/i18n/useTranslations.ts` (NEW)
- `apps/native/src/**/*.{ts,tsx}` (many modified for string extraction)
- `apps/dashboard/src/**/*.{ts,tsx}` (many modified for string extraction)
- `apps/native/src/app/(tabs)/admin/` (DELETED)
- `apps/native/src/app/(tabs)/staff/*.tsx` (NEW)
- `packages/db/src/schema/travelerProfiles.ts` (NEW)
- `packages/orpc/src/api/routers/travelerProfile/` (NEW)
- `packages/orpc/src/api/routers/challenge/mutations.ts`
- `apps/native/src/app/(tabs)/trips/[id]/summary.tsx` (NEW)
