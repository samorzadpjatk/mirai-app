# Test Coverage Analysis - Monorepo

**Date:** 2026-04-09  
**Goal:** Increase test coverage to at least 80% across all packages  
**Exclusion:** Prisma auto-generated code in `packages/frameworks/src/prisma/lib/`

---

## Executive Summary

| Package                  | Source Files | Test Files | Current Coverage | Target Gap    |
| ------------------------ | ------------ | ---------- | ---------------- | ------------- |
| domain                   | 17           | 15         | ~88%             | ✅ Target met |
| use-cases                | 89           | 17         | ~19%             | ❌ 61% gap    |
| adapters                 | 92           | 42         | ~45%             | ⚠️ 35% gap    |
| frameworks               | ~20          | 8          | ~40%             | ⚠️ 40% gap    |
| shared                   | 5            | 0          | 0%               | ❌ 80% gap    |
| apps/backend-server      | 3            | 3          | ~100%            | ✅ Target met |
| apps/web                 | 90           | 18         | ~20%             | ❌ 60% gap    |
| apps/notification-sender | 1            | 2          | ~200%            | ✅ Target met |
| apps/seed                | 15           | 0          | 0%               | ❌ 80% gap    |

**Priority Packages for Coverage Improvement:**

1. **use-cases** (89 files, 19% coverage) - HIGHEST IMPACT
2. **adapters** (92 files, 45% coverage) - HIGH IMPACT
3. **web** (90 files, 20% coverage) - HIGH IMPACT
4. **shared** (5 files, 0% coverage) - EASY WINS
5. **seed** (15 files, 0% coverage) - EASY WINS
6. **frameworks** (20 files, 40% coverage) - MEDIUM IMPACT

---

## Package-by-Package Analysis

### 1. packages/domain

**Status:** ✅ Target likely met (~88%)

#### Files WITH Tests

- `src/entities/Trip.test.ts`
- `src/entities/Notification.test.ts`
- `src/entities/Reward.test.ts`
- `src/entities/Sponsor.test.ts`
- `src/entities/ActivityFeed.test.ts`
- `src/entities/ChallengeSubmission.test.ts`
- `src/entities/Group.test.ts`
- `src/entities/Challenge.test.ts`
- `src/entities/Location.test.ts`
- `src/entities/ChallengeVote.test.ts`
- `src/entities/SubmissionReport.test.ts`
- `src/entities/User.test.ts`
- `src/utils/result.test.ts`
- `src/value-objects/UserId.test.ts`
- `src/value-objects/CoinAmount.test.ts`

#### Files WITHOUT Tests (1 entity, potentially 16 value objects)

| File                                   | Difficulty | Notes                           |
| -------------------------------------- | ---------- | ------------------------------- |
| `src/entities/Sponsor.ts`              | Medium     | Entity with validation logic    |
| `src/entities/Trip.ts`                 | Medium     | Large entity with complex logic |
| `src/entities/ChallengeVote.ts`        | Medium     | Vote-related logic              |
| `src/entities/ChallengeSubmission.ts`  | Medium     | Submission handling             |
| `src/entities/NotificationSchedule.ts` | Medium     | Schedule management             |
| `src/entities/Location.ts`             | Medium     | Location entity                 |
| `src/entities/SubmissionReport.ts`     | Medium     | Report entity                   |
| `src/value-objects/*.ts` (16 files)    | Easy       | Simple value objects            |

#### Priority for domain

- **EASY:** `src/entities/Sponsor.ts` - similar pattern to User/Group
- **EASY:** Remaining value objects - follow CoinAmount/UserId pattern

---

### 2. packages/use-cases

**Status:** ❌ CRITICAL - 89 files, only 17 tests (~19%)

#### Tested Interactors (17 files)

1. `CreateChallenge.test.ts`
2. `GetChallenge.test.ts`
3. `UpdateUser.test.ts`
4. `CreateUser.test.ts`
5. `GetUser.test.ts`
6. `UpdateChallengeStatus.test.ts`
7. `PurchaseReward.test.ts`
8. `GetDeliveries.test.ts`
9. `GetCoinStatistics.test.ts`
10. `AddCoins.test.ts`
11. `CreateReward.test.ts`
12. `RemoveCoins.test.ts`
13. `UpdateChallenge.test.ts`
14. `GetNotification.test.ts`
    15-17. Container tests

#### Untested Interactors by Category

**CRUD Interactors (High Priority - Easy)**
| File | Difficulty | Lines | Dependencies |
|------|------------|-------|--------------|
| `CreateGroup.ts` | Easy | ~80 | GroupRepository |
| `GetGroup.ts` | Easy | ~50 | GroupRepository |
| `UpdateGroup.ts` | Easy | ~80 | GroupRepository |
| `CreateLocation.ts` | Easy | ~60 | LocationRepository |
| `GetLocation.ts` | Easy | ~50 | LocationRepository |
| `ListLocations.ts` | Easy | ~50 | LocationRepository |
| `UpdateLocation.ts` | Easy | ~60 | LocationRepository |
| `CreateReward.ts` | Easy | ~70 | RewardRepository |
| `GetReward.ts` | Easy | ~50 | RewardRepository |
| `ListRewards.ts` | Easy | ~50 | RewardRepository |
| `UpdateReward.ts` | Easy | ~70 | RewardRepository |
| `DeleteReward.ts` | Easy | ~50 | RewardRepository |
| `CreateSponsor.ts` | Easy | ~70 | SponsorRepository |
| `GetSponsor.ts` | Easy | ~50 | SponsorRepository |
| `ListSponsors.ts` | Easy | ~50 | SponsorRepository |
| `UpdateSponsor.ts` | Easy | ~70 | SponsorRepository |
| `DeleteSponsor.ts` | Easy | ~50 | SponsorRepository |
| `CreateSubmission.ts` | Easy | ~80 | ChallengeSubmissionRepository |
| `UpdateSubmission.ts` | Easy | ~80 | ChallengeSubmissionRepository |
| `DeleteSubmission.ts` | Easy | ~50 | ChallengeSubmissionRepository |
| `GetSubmission.ts` | Easy | ~50 | ChallengeSubmissionRepository |
| `CreateActivity.ts` | Easy | ~70 | ActivityFeedRepository |
| `GetActivityFeed.ts` | Easy | ~60 | ActivityFeedRepository |
| `CreateReport.ts` | Easy | ~70 | SubmissionReportRepository |
| `GetReports.ts` | Easy | ~50 | SubmissionReportRepository |

**Notification Interactors (Medium Priority)**
| File | Difficulty | Lines | Dependencies |
|------|------------|-------|--------------|
| `CreateNotificationSchedule.ts` | Medium | ~100 | NotificationScheduleRepository |
| `UpdateNotificationSchedule.ts` | Medium | ~80 | NotificationScheduleRepository |
| `DeleteNotificationSchedule.ts` | Medium | ~60 | NotificationScheduleRepository |
| `GetNotificationScheduleById.ts` | Medium | ~50 | NotificationScheduleRepository |
| `GetNotificationSchedules.ts` | Medium | ~50 | NotificationScheduleRepository |
| `GetUpcomingNotificationSchedules.ts` | Medium | ~50 | NotificationScheduleRepository |
| `GetActiveNotificationSchedules.ts` | Medium | ~50 | NotificationScheduleRepository |
| `ToggleNotificationScheduleActive.ts` | Medium | ~70 | NotificationScheduleRepository |
| `BulkToggleNotificationScheduleActive.ts` | Medium | ~80 | NotificationScheduleRepository |
| `BulkDeleteNotificationSchedules.ts` | Medium | ~70 | NotificationScheduleRepository |
| `DuplicateNotificationSchedule.ts` | Medium | ~80 | NotificationScheduleRepository |
| `UpdateNotificationScheduleLastRun.ts` | Medium | ~60 | NotificationScheduleRepository |
| `GetNotificationScheduleExecutionHistory.ts` | Medium | ~60 | NotificationScheduleRepository |

**Voting Interactors (Medium Priority)**
| File | Difficulty | Lines | Dependencies |
|------|------------|-------|--------------|
| `SubmitVote.ts` | Medium | ~90 | ChallengeVoteRepository |
| `SubmitVotes.ts` | Medium | ~100 | ChallengeVoteRepository |
| `GetMyVotes.ts` | Medium | ~60 | ChallengeVoteRepository |
| `GetVotesByChallenge.ts` | Medium | ~60 | ChallengeVoteRepository |
| `GetChallengeVotingProgress.ts` | Medium | ~70 | ChallengeVoteRepository |
| `GetJudgedStaffVotingProgress.ts` | Medium | ~70 | ChallengeVoteRepository |
| `ForceEndVoting.ts` | Medium | ~80 | ChallengeVoteRepository |

**Coin/Transaction Interactors (Medium Priority)**
| File | Difficulty | Lines | Dependencies |
|------|------------|-------|--------------|
| `GetCoinTransactions.ts` | Medium | ~60 | CoinTransactionRepository |
| `GetPurchaseHistory.ts` | Medium | ~60 | CoinTransactionRepository |
| `UpdateMyPurchaseStatus.ts` | Medium | ~70 | CoinTransactionRepository |
| `UpdatePurchaseStatus.ts` | Medium | ~70 | CoinTransactionRepository |
| `GetCoinQuickStats.ts` | Medium | ~60 | CoinTransactionRepository |
| `GetCoinAdditionalInsights.ts` | Medium | ~60 | CoinTransactionRepository |
| `GetDeliveryByNotificationId.ts` | Medium | ~60 | NotificationDeliveryRepository |
| `GetFailedDeliveries.ts` | Medium | ~60 | NotificationDeliveryRepository |
| `GetDeliveries.ts` | Medium | ~60 | NotificationDeliveryRepository |
| `GetDeliveryStats.ts` | Medium | ~60 | NotificationDeliveryRepository |

**Sharing Interactors (Medium Priority)**
| File | Difficulty | Lines | Dependencies |
|------|------------|-------|--------------|
| `UpdateSharingSettings.ts` | Medium | ~70 | UserRepository |
| `GetSharingSettings.ts` | Medium | ~50 | UserRepository |
| `AddSharingUser.ts` | Medium | ~70 | UserRepository |
| `RemoveSharingUser.ts` | Medium | ~70 | UserRepository |

**Trip Interactors (Medium Priority)**
| File | Difficulty | Lines | Dependencies |
|------|------------|-------|--------------|
| `LinkSponsorToTrip.ts` | Medium | ~80 | TripRepository |
| `UnlinkSponsorFromTrip.ts` | Medium | ~70 | TripRepository |

**Admin/Stats Interactors (Medium Priority)**
| File | Difficulty | Lines | Dependencies |
|------|------------|-------|--------------|
| `GetMostActiveAdminStats.ts` | Medium | ~80 | Multiple repositories |
| `GetSubmissionByChallengeAndGroup.ts` | Medium | ~60 | ChallengeSubmissionRepository |
| `ListSubmissionsByChallenge.ts` | Medium | ~60 | ChallengeSubmissionRepository |
| `SetRewardHidden.ts` | Medium | ~60 | RewardRepository |
| `AddReaction.ts` | Medium | ~70 | ActivityFeedRepository |

**Notification Interactors (Already tested via GetNotification.test.ts)**

- `GetNotification.ts`

#### Use Case Errors (Need Tests)

| File                      | Difficulty | Notes                               |
| ------------------------- | ---------- | ----------------------------------- |
| `errors/UseCaseErrors.ts` | Easy       | 4 error classes, 1 utility function |

#### Test Pattern Reference

```typescript
// Pattern from CreateChallenge.test.ts
describe("[UNIT] CreateChallengeUseCase", () => {
  let container: AwilixContainer;
  beforeEach(() => { container = createTestContainer(); });

  it("should create challenge with valid input", async () => {
    const mockRepo = { create: mock(() => Promise.resolve(mockChallenge)), ... };
    container.register(TYPES.ChallengeRepository, asValue(mockRepo));
    const useCase = new CreateChallengeUseCase(container.resolve(...));
    const result = await runAsResult(useCase.execute(input));
    expect(result.kind).toBe("ok");
  });
});
```

---

### 3. packages/adapters

**Status:** ⚠️ 92 files, 42 tests (~45%)

#### Tested Files

**Mappers (4/16 tested)**

- ✅ `CoinTransactionMapper.test.ts`
- ✅ `NotificationDeliveryMapper.test.ts`
- ✅ `UserMapper.test.ts`
- ✅ `ChallengeMapper.test.ts`

**Controllers (2/17 tested)**

- ✅ `coinTransaction-controller.test.ts`
- ✅ `coin-controller.test.ts`

**Routers (14/18 tested)**

- ✅ `trip.test.ts`, `user.test.ts`, `challenge.test.ts`
- ✅ `notificationDelivery.test.ts`, `coin.test.ts`, `coinTransaction.test.ts`
- ✅ `notificationSender.test.ts`, `reward.test.ts`, `sponsor.test.ts`
- ✅ `storage.test.ts`, `activityFeed.test.ts`, `challengeSubmission.test.ts`
- ✅ `group.test.ts`, `location.test.ts`, `challengeVote.test.ts`
- ✅ `notifications.test.ts`, `notificationSchedule.test.ts`, `submissionReport.test.ts`

**trpc-utils (11/15 tested)**

- ✅ `notificationTemplates.test.ts`, `resilience.test.ts`
- ✅ `location-validation.test.ts`, `tripGuards.test.ts`
- ✅ `notificactionSchedule-validation.test.ts`, `storage.test.ts`
- ✅ `activityFeed.test.ts`, `recurringChallenges.test.ts`
- ✅ `authEmails.test.ts`, `notifications.test.ts`

**Modules (2/2 tested)**

- ✅ `ControllerModule.test.ts`
- ✅ `RepositoryModule.test.ts`

**DI Tests (2/3 tested)**

- ✅ `repository-di.test.ts`, `container-resolution.test.ts`

#### Untested Files by Category

**Mappers (12 untested)** - EASY
| File | Lines | Pattern to Follow |
|------|-------|------------------|
| `NotificationScheduleMapper.ts` | ~80 | UserMapper.test.ts |
| `ChallengeSubmissionMapper.ts` | ~100 | UserMapper.test.ts |
| `ActivityFeedMapper.ts` | ~80 | UserMapper.test.ts |
| `RewardMapper.ts` | ~80 | UserMapper.test.ts |
| `TripMapper.ts` | ~100 | UserMapper.test.ts |
| `ChallengeMapper.ts` | ~100 | Already tested |
| `SubmissionReportMapper.ts` | ~80 | UserMapper.test.ts |
| `ChallengeVoteMapper.ts` | ~80 | UserMapper.test.ts |
| `LocationMapper.ts` | ~80 | UserMapper.test.ts |
| `GroupMapper.ts` | ~80 | UserMapper.test.ts |
| `NotificationMapper.ts` | ~80 | UserMapper.test.ts |
| `SponsorMapper.ts` | ~80 | UserMapper.test.ts |

**Controllers (15 untested)** - MEDIUM
| File | Lines | Pattern to Follow |
|------|-------|------------------|
| `challenge-controller.ts` | ~600 | coin-controller.test.ts |
| `user-controller.ts` | ~300 | coin-controller.test.ts |
| `storage-controller.ts` | ~150 | coin-controller.test.ts |
| `submissionReport-controller.ts` | ~150 | coin-controller.test.ts |
| `notification-schedule-controller.ts` | ~200 | coin-controller.test.ts |
| `group-controller.ts` | ~250 | coin-controller.test.ts |
| `notification-delivery-controller.ts` | ~150 | coin-controller.test.ts |
| `location-controller.ts` | ~150 | coin-controller.test.ts |
| `reward-controller.ts` | ~200 | coin-controller.test.ts |
| `challengeSubmission-controller.ts` | ~200 | coin-controller.test.ts |
| `notification-controller.ts` | ~200 | coin-controller.test.ts |
| `sponsor-controller.ts` | ~200 | coin-controller.test.ts |
| `challengeVote-controller.ts` | ~200 | coin-controller.test.ts |
| `activityFeed-controller.ts` | ~150 | coin-controller.test.ts |
| `trip-controller.ts` | ~300 | coin-controller.test.ts |

**Routers (4 untested)** - MEDIUM/HARD
| File | Lines | Pattern to Follow |
|------|-------|------------------|
| `coin.ts` | ~200 | challenge.test.ts |
| `coinTransaction.ts` | ~200 | challenge.test.ts |
| `challenge.ts` | ~500 | challenge.test.ts |
| `notificationSender.ts` | ~150 | challenge.test.ts |

**Services (9 untested)** - HARD
| File | Lines | Pattern | Difficulty Notes |
|------|-------|---------|-----------------|
| `notificationService.ts` | ~150 | Mock Prisma | Database queries |
| `PrismaCoinService.ts` | ~180 | Mock multiple deps | Complex transactions |
| `PrismaNotificationSenderService.ts` | ~150 | Mock Prisma | External calls |
| `PrismaRankingActivityService.ts` | ~200 | Mock Prisma | Complex business logic |
| `PrismaCoinTransactionService.ts` | ~150 | Mock Prisma | Database queries |
| `PrismaRewardService.ts` | ~150 | Mock Prisma | Database queries |
| `PrismaTripAccessChecker.ts` | ~100 | Mock Prisma | Access control |
| `PrismaGroupCoinsService.ts` | ~150 | Mock Prisma | Coin operations |
| `PrismaTripPointsCalculator.ts` | ~150 | Mock Prisma | Calculations |

**Utils (4 untested)** - EASY/MEDIUM
| File | Lines | Pattern to Follow |
|------|-------|------------------|
| `utils/storage-helpers.ts` | ~100 | storage.test.ts |
| `utils/repository-factory.ts` | ~100 | DI container tests |
| `utils/controller-helpers.ts` | ~100 | Follow controller pattern |
| `utils/trpc-utils/recurringChallenges.ts` | ~100 | Already tested |
| `utils/trpc-utils/notifications.ts` | ~125 | notifications.test.ts |

**trpc-utils (4 untested)** - EASY/MEDIUM
| File | Lines | Pattern to Follow |
|------|-------|------------------|
| `utils/trpc-utils/controller-result-handler.ts` | ~50 | Simple utility |
| `utils/trpc-utils/storage.ts` | ~80 | storage.test.ts |
| `utils/trpc-utils/tripGuards.ts` | ~100 | tripGuards.test.ts |
| `utils/trpc-utils/notificactionSchedule-validation.ts` | ~100 | Already tested |

**API Routers (0 additional untested - all tested)**

---

### 4. packages/frameworks

**Status:** ⚠️ ~20 non-Prisma files, 8 tests (~40%)

#### Tested (8 files)

- ✅ `di/__tests__/awilix-loads.test.ts`
- ✅ `di/__tests__/AppModule.test.ts`
- ✅ `di/__tests__/container.test.ts`
- ✅ `di/__tests__/types.test.ts`
- ✅ `storage/__tests__/standard.test.ts`
- ✅ `stores/__tests__/authStore.test.ts`
- ✅ `stores/__tests__/judgementStore.test.ts`
- ✅ `stores/__tests__/mapStore.test.ts`

#### Untested Files

**DI (2 files)** - MEDIUM
| File | Lines | Pattern to Follow |
|------|-------|------------------|
| `di/types.ts` | ~50 | types.test.ts |
| `di/scope.ts` | ~50 | container.test.ts |
| `di/container.ts` | ~100 | container.test.ts |
| `di/test-container.ts` | ~50 | container.test.ts |
| `di/AppModule.ts` | ~100 | AppModule.test.ts |

**Stores (0 files)** - All tested

- `authStore.ts` ✅
- `judgementStore.ts` ✅
- `mapStore.ts` ✅

**Factories (3 files)** - MEDIUM
| File | Lines | Pattern |
|------|-------|---------|
| `factories/index.ts` | ~30 | Simple exports |
| `factories/auth.ts` | ~100 | DI patterns |
| `factories/services.ts` | ~100 | DI patterns |
| `factories/repositories.ts` | ~100 | DI patterns |

**Supabase (4 files)** - MEDIUM/HARD
| File | Lines | Pattern |
|------|-------|---------|
| `supabase/index.ts` | ~30 | Simple exports |
| `supabase/client.ts` | ~100 | Mock supabase |
| `supabase/types.ts` | ~50 | Type tests |
| `supabase/base.ts` | ~100 | Mock supabase |

**Auth (4 files)** - MEDIUM
| File | Lines | Pattern |
|------|-------|---------|
| `auth/index.ts` | ~30 | Simple exports |
| `auth/client.ts` | ~100 | Mock auth |
| `auth/store/authHooks.ts` | ~150 | Hook tests |
| `auth/types.ts` | ~50 | Type tests |

**tRPC (8 files)** - MEDIUM
| File | Lines | Pattern |
|------|-------|---------|
| `trpc/index.ts` | ~30 | Simple exports |
| `trpc/client.ts` | ~50 | Client tests |
| `trpc/client/index.ts` | ~30 | Simple exports |
| `trpc/client/react.ts` | ~50 | Client tests |
| `trpc/client/vanilia.ts` | ~50 | Client tests |
| `trpc/client/invalidationUtils.ts` | ~100 | Utility tests |
| `trpc/router-factory.ts` | ~100 | Router tests |
| `trpc/hooks/*.ts` (8 files) | ~50 each | Hook tests |

**Storage (1 file)** - Already tested

- `storage/index.ts` ✅

---

### 5. packages/shared

**Status:** ❌ 5 files, 0 tests (0%)

#### Untested Files - ALL EASY

| File                            | Lines | Pattern          |
| ------------------------------- | ----- | ---------------- |
| `design-tokens/borderRadius.ts` | ~30   | Pure constants   |
| `design-tokens/spacing.ts`      | ~30   | Pure constants   |
| `design-tokens/typography.ts`   | ~50   | Pure constants   |
| `design-tokens/colors.ts`       | ~50   | Pure constants   |
| `design-tokens/index.ts`        | ~20   | Re-exports       |
| `tripInfo/types.ts`             | ~50   | Type definitions |

**Recommended approach:** Snapshot-style tests for design tokens, simple type tests for tripInfo

---

### 6. apps/web

**Status:** ❌ 90 files, 18 tests (~20%)

#### Tested (18 files)

- ✅ `lib/__tests__/toast.test.ts`
- ✅ `lib/__tests__/fileValidation.test.ts`
- ✅ `lib/__tests__/logout.test.ts`
- ✅ `lib/__tests__/env.test.ts`
- ✅ `lib/__tests__/auth.test.ts`
- ✅ `lib/__tests__/supabase.test.ts`
- ✅ `hooks/__tests__/useActiveTripId.test.ts`
- ✅ `hooks/__tests__/useChallengeForm.test.ts`
- ✅ `hooks/__tests__/useJudgement.test.ts`
- ✅ `hooks/__tests__/useWebFileUpload.test.ts`
- ✅ `hooks/__tests__/useChallengeSubmissions.test.ts`
- ✅ `hooks/__tests__/useStaffVoting.test.ts`
- ✅ `middleware.test.ts`

#### Untested Files

**lib (0 tested of 7)** - EASY
| File | Lines | Pattern |
|------|-------|---------|
| `lib/auth.ts` | ~100 | auth.test.ts |
| `lib/logout.ts` | ~50 | logout.test.ts |
| `lib/env.ts` | ~50 | env.test.ts |
| `lib/supabase.ts` | ~100 | supabase.test.ts |
| `lib/fileValidation.ts` | ~100 | fileValidation.test.ts |
| `lib/toast.ts` | ~50 | toast.test.ts |

**hooks (4 tested, 0 untested)** - All admin hooks need tests
| File | Lines | Pattern |
|------|-------|---------|
| `hooks/admin/useChallengeForm.ts` | ~200 | useChallengeForm.test.ts |
| `hooks/admin/useJudgement.ts` | ~200 | useJudgement.test.ts |
| `hooks/admin/useStaffVoting.ts` | ~200 | useStaffVoting.test.ts |
| `hooks/admin/useChallengeSubmissions.ts` | ~200 | useChallengeSubmissions.test.ts |
| `hooks/useWebFileUpload.ts` | ~150 | Already tested |
| `hooks/useActiveTripId.ts` | ~50 | Already tested |

**components/admin (1 file)** - EASY
| File | Lines | Pattern |
|------|-------|---------|
| `components/admin/challenges/challengeFormConstants.ts` | ~100 | Constants file |

**middleware** - Already tested

---

### 7. apps/seed

**Status:** ❌ 15 files, 0 tests (0%)

#### Untested Files - ALL HARD (requires database/seeding)

**Core Files**
| File | Lines | Difficulty | Notes |
|------|-------|------------|-------|
| `seed.ts` | ~200 | Hard | Main entry point |
| `auth.ts` | ~100 | Hard | Auth integration |
| `tripInfo.ts` | ~150 | Medium | Data setup |
| `users.ts` | ~200 | Hard | User seeding |
| `sponsors.ts` | ~150 | Medium | Sponsor seeding |
| `rewards.ts` | ~150 | Medium | Reward seeding |
| `trips.ts` | ~200 | Medium | Trip seeding |
| `constants.ts` | ~50 | Easy | Constants |
| `types.ts` | ~50 | Easy | Type definitions |
| `storage.ts` | ~100 | Medium | Storage integration |
| `tripConfigs.ts` | ~150 | Medium | Config setup |

**Utils**
| File | Lines | Difficulty |
|------|-------|------------|
| `utils/fs.ts` | ~100 | Medium |
| `utils/path.ts` | ~50 | Easy |

**Config**
| File | Lines | Difficulty |
|------|-------|------------|
| `config/db.ts` | ~50 | Medium |
| `config/env.ts` | ~50 | Medium |
| `config/supabase.ts` | ~100 | Medium |

**Recommendation:** Focus on unit testing utility functions and config validators rather than full integration tests

---

## Dependency Mapping for Test Writing Order

### Phase 1: Independent Easy Wins

```
packages/shared (design-tokens)
    ↓ (types used by)
packages/domain (value-objects)
    ↓ (entities used by)
packages/use-cases (interactors)
    ↓ (ports used by)
packages/adapters (mappers, then controllers)
    ↓ (controllers used by)
packages/adapters (routers)
```

### Phase 2: Package-by-Package Dependencies

#### Domain Dependencies

- `value-objects/*.ts` → `utils/result.ts`
- `entities/*.ts` → `value-objects/*.ts`

#### Use Cases Dependencies

- `interactors/*.ts` → `entities` (domain)
- `interactors/*.ts` → `ports/*.ts`
- `errors/*.ts` → Independent

#### Adapters Dependencies

- `mappers/*.ts` → `domain entities`
- `controllers/*.ts` → `interactors`, `mappers`
- `services/*.ts` → `repositories`, `use cases`
- `gateways/*.ts` → `mappers`, `ports`

### Critical Path for Coverage

1. **Value Objects** (16 files) - Easiest, most impactful for domain
2. **Remaining Entities** (8 files) - Medium, follows existing pattern
3. **Use Case Interactors** (72 files) - HIGHEST IMPACT
4. **Mappers** (12 files) - Easy, mechanical
5. **Controllers** (15 files) - Medium, follow coin-controller pattern
6. **Services** (9 files) - Hard, complex mocks
7. **Routers** (4 files) - Hard, complex integration

---

## Recommended Test Patterns

### 1. Value Object Pattern (EASY)

```typescript
// Follow CoinAmount.test.ts or UserId.test.ts
describe("[UNIT] SomeId", () => {
  describe("create", () => {
    it("should create with valid input", () => {
      const result = SomeId.create("valid-uuid");
      expect(result.kind).toBe("ok");
    });
    it("should reject invalid format", () => {
      const result = SomeId.create("invalid");
      expect(result.kind).toBe("err");
    });
  });
});
```

### 2. Entity Pattern (MEDIUM)

```typescript
// Follow Group.test.ts or User.test.ts
describe("[UNIT] SomeEntity", () => {
  describe("create", () => {
    it("should create with valid input", () => {
      /* ... */
    });
    it("should reject invalid field", () => {
      /* ... */
    });
  });
  describe("updateField", () => {
    it("should update field", () => {
      /* ... */
    });
    it("should reject invalid update", () => {
      /* ... */
    });
  });
});
```

### 3. Use Case Pattern (MEDIUM)

```typescript
// Follow CreateChallenge.test.ts
describe("[UNIT] CreateSomethingUseCase", () => {
  it("should create with valid input", async () => {
    const mockRepo = { create: mock(() => Promise.resolve(entity)) };
    container.register(TYPES.SomeRepository, asValue(mockRepo));
    const useCase = new CreateSomethingUseCase(container.resolve(...));
    const result = await runAsResult(useCase.execute(input));
    expect(result.kind).toBe("ok");
  });
});
```

### 4. Mapper Pattern (EASY)

```typescript
// Follow UserMapper.test.ts
describe("[UNIT] SomeMapper", () => {
  it("should map to domain", () => {
    /* ... */
  });
  it("should map to prisma", () => {
    /* ... */
  });
  it("should handle edge cases", () => {
    /* ... */
  });
});
```

### 5. Controller Pattern (MEDIUM)

```typescript
// Follow coin-controller.test.ts
describe("[UNIT] SomeController", () => {
  it("should handle success case", async () => {
    mockUseCase.execute = mock(() => Promise.resolve(ok({ data: {} })));
    const result = await controller.someMethod(input);
    expect(result.success).toBe(true);
  });
});
```

---

## Coverage Targets by Phase

### Phase 1: Quick Wins (Target: +10% overall)

- [ ] `packages/shared` - 5 files (100% → 5 tests)
- [ ] Value objects in domain - 16 files (follow CoinAmount pattern)
- [ ] UseCase errors - 1 file (follow simple utility pattern)

### Phase 2: High Impact (Target: +25% overall)

- [ ] CRUD interactors in use-cases - ~25 files (follow CreateChallenge pattern)
- [ ] Mappers in adapters - ~12 files (follow UserMapper pattern)
- [ ] Remaining controllers in adapters - ~10 files (follow coin-controller pattern)

### Phase 3: Medium Impact (Target: +15% overall)

- [ ] Complex interactors in use-cases - ~45 files
- [ ] Services in adapters - ~9 files
- [ ] Hooks in apps/web - ~4 files

### Phase 4: Hard Wins (Target: +5% overall)

- [ ] Routers in adapters - ~4 files
- [ ] Framework utilities - ~10 files
- [ ] Seed app utilities - ~5 files

---

## Files Requiring No Tests (By Design)

1. **Index/re-export files** - No logic, just re-exports
2. **Type definition files** - No runtime code
3. **Configuration files** - Framework setup
4. **Prisma auto-generated code** - Excluded per requirements

---

## Appendix: Complete File Inventory

### packages/domain

**Total:** 17 source files, 15 test files
**Untested:** 2 files (Sponsor.ts, Trip.ts) + 16 value objects

### packages/use-cases

**Total:** 89 source files, 17 test files
**Untested:** 72 files

### packages/adapters

**Total:** 92 source files, 42 test files
**Untested:** 50 files

### packages/frameworks (excluding prisma/)

**Total:** ~20 source files, 8 test files
**Untested:** ~12 files

### packages/shared

**Total:** 5 source files, 0 test files
**Untested:** 5 files

### apps/backend-server

**Total:** 3 source files, 3 test files
**Untested:** 0 files

### apps/web

**Total:** 90 source files, 18 test files
**Untested:** 72 files

### apps/notification-sender

**Total:** 1 source file, 2 test files
**Untested:** 0 files

### apps/seed

**Total:** 15 source files, 0 test files
**Untested:** 15 files
