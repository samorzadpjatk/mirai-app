# Codebase Impact Analysis: Full DI and Effect.ts Migration

## Executive Summary

This document provides a complete catalog of all files requiring migration to:

1. **DI (awilix-modular)**: Dependency injection container pattern
2. **Effect.ts**: Functional effect system for async operations

**Scope**: Mirai App Monorepo  
**Total Files Identified**: 400+ files  
**Estimated Migration Effort**: 6-8 weeks (parallel execution recommended)

---

## Current State Overview

### DI Infrastructure (Already Implemented)

| Component        | Status      | Module File                                                              |
| ---------------- | ----------- | ------------------------------------------------------------------------ |
| RepositoryModule | ✅ Complete | `packages/adapters/src/modules/RepositoryModule.ts`                      |
| ControllerModule | ✅ Complete | `packages/adapters/src/modules/ControllerModule.ts`                      |
| UseCaseModule    | ✅ Complete | `packages/use-cases/src/modules/UseCaseModule.ts`                        |
| AppModule        | ⚠️ Partial  | `packages/frameworks/src/di/AppModule.ts` (UseCaseModule is placeholder) |

**Container Initialization**: `apps/backend-server/src/server.ts` (lines 34-42)

### Current Migration Statistics

| Layer           | Total | Migrated to DI          | Remaining                     |
| --------------- | ----- | ----------------------- | ----------------------------- |
| Repositories    | 16    | 16 (100%)               | 0                             |
| Use Cases       | 75    | 75 registered in module | Need integration in AppModule |
| Controllers     | 17    | 17 registered in module | Need router integration       |
| Routers         | 19    | 2 (user, challenge)     | 17 need DI migration          |
| tRPC Procedures | ~400  | ~10 use DI              | ~390 need migration           |

---

## DI Migration: Detailed File Catalog

### 1. Repositories (16 files) - ✅ COMPLETE

All repositories are already migrated to the BasePrismaRepository pattern and registered in RepositoryModule:

| File                                 | Path                                                                     | Status      |
| ------------------------------------ | ------------------------------------------------------------------------ | ----------- |
| PrismaUserRepository                 | `packages/adapters/src/gateways/PrismaUserRepository.ts`                 | ✅ Migrated |
| PrismaTripRepository                 | `packages/adapters/src/gateways/PrismaTripRepository.ts`                 | ✅ Migrated |
| PrismaChallengeRepository            | `packages/adapters/src/gateways/PrismaChallengeRepository.ts`            | ✅ Migrated |
| PrismaGroupRepository                | `packages/adapters/src/gateways/PrismaGroupRepository.ts`                | ✅ Migrated |
| PrismaLocationRepository             | `packages/adapters/src/gateways/PrismaLocationRepository.ts`             | ✅ Migrated |
| PrismaNotificationRepository         | `packages/adapters/src/gateways/PrismaNotificationRepository.ts`         | ✅ Migrated |
| PrismaChallengeSubmissionRepository  | `packages/adapters/src/gateways/PrismaChallengeSubmissionRepository.ts`  | ✅ Migrated |
| PrismaChallengeVoteRepository        | `packages/adapters/src/gateways/PrismaChallengeVoteRepository.ts`        | ✅ Migrated |
| PrismaActivityFeedRepository         | `packages/adapters/src/gateways/PrismaActivityFeedRepository.ts`         | ✅ Migrated |
| PrismaSponsorRepository              | `packages/adapters/src/gateways/PrismaSponsorRepository.ts`              | ✅ Migrated |
| PrismaSubmissionReportRepository     | `packages/adapters/src/gateways/PrismaSubmissionReportRepository.ts`     | ✅ Migrated |
| PrismaRewardRepository               | `packages/adapters/src/gateways/PrismaRewardRepository.ts`               | ✅ Migrated |
| PrismaRewardPurchaseRepository       | `packages/adapters/src/gateways/PrismaRewardRepository.ts`               | ✅ Migrated |
| PrismaCoinTransactionRepository      | `packages/adapters/src/gateways/PrismaCoinTransactionRepository.ts`      | ✅ Migrated |
| PrismaNotificationDeliveryRepository | `packages/adapters/src/gateways/PrismaNotificationDeliveryRepository.ts` | ✅ Migrated |
| PrismaNotificationScheduleRepository | `packages/adapters/src/gateways/PrismaNotificationScheduleRepository.ts` | ✅ Migrated |

### 2. Use Cases (75 files) - MODULE READY, NEED APPMODULE INTEGRATION

All use cases are defined in `packages/use-cases/src/modules/UseCaseModule.ts` but AppModule uses a placeholder.

#### User Domain (3 use cases)

| File              | Path                                               | DI Status     |
| ----------------- | -------------------------------------------------- | ------------- |
| GetUserUseCase    | `packages/use-cases/src/interactors/GetUser.ts`    | ✅ Registered |
| CreateUserUseCase | `packages/use-cases/src/interactors/CreateUser.ts` | ✅ Registered |
| UpdateUserUseCase | `packages/use-cases/src/interactors/UpdateUser.ts` | ✅ Registered |

#### Challenge Domain (4 use cases)

| File                         | Path                                                          | DI Status     |
| ---------------------------- | ------------------------------------------------------------- | ------------- |
| GetChallengeUseCase          | `packages/use-cases/src/interactors/GetChallenge.ts`          | ✅ Registered |
| CreateChallengeUseCase       | `packages/use-cases/src/interactors/CreateChallenge.ts`       | ✅ Registered |
| UpdateChallengeUseCase       | `packages/use-cases/src/interactors/UpdateChallenge.ts`       | ✅ Registered |
| UpdateChallengeStatusUseCase | `packages/use-cases/src/interactors/UpdateChallengeStatus.ts` | ✅ Registered |

#### Group Domain (3 use cases)

| File               | Path                                                | DI Status     |
| ------------------ | --------------------------------------------------- | ------------- |
| GetGroupUseCase    | `packages/use-cases/src/interactors/GetGroup.ts`    | ✅ Registered |
| CreateGroupUseCase | `packages/use-cases/src/interactors/CreateGroup.ts` | ✅ Registered |
| UpdateGroupUseCase | `packages/use-cases/src/interactors/UpdateGroup.ts` | ✅ Registered |

#### Challenge Submission Domain (6 use cases)

| File                                    | Path                                                                     | DI Status     |
| --------------------------------------- | ------------------------------------------------------------------------ | ------------- |
| CreateSubmissionUseCase                 | `packages/use-cases/src/interactors/CreateSubmission.ts`                 | ✅ Registered |
| GetSubmissionUseCase                    | `packages/use-cases/src/interactors/GetSubmission.ts`                    | ✅ Registered |
| GetSubmissionByChallengeAndGroupUseCase | `packages/use-cases/src/interactors/GetSubmissionByChallengeAndGroup.ts` | ✅ Registered |
| UpdateSubmissionUseCase                 | `packages/use-cases/src/interactors/UpdateSubmission.ts`                 | ✅ Registered |
| DeleteSubmissionUseCase                 | `packages/use-cases/src/interactors/DeleteSubmission.ts`                 | ✅ Registered |
| ListSubmissionsByChallengeUseCase       | `packages/use-cases/src/interactors/ListSubmissionsByChallenge.ts`       | ✅ Registered |

#### Challenge Vote Domain (7 use cases)

| File                                | Path                                                                 | DI Status     |
| ----------------------------------- | -------------------------------------------------------------------- | ------------- |
| GetMyVotesUseCase                   | `packages/use-cases/src/interactors/GetMyVotes.ts`                   | ✅ Registered |
| GetVotesByChallengeUseCase          | `packages/use-cases/src/interactors/GetVotesByChallenge.ts`          | ✅ Registered |
| GetChallengeVotingProgressUseCase   | `packages/use-cases/src/interactors/GetChallengeVotingProgress.ts`   | ✅ Registered |
| GetJudgedStaffVotingProgressUseCase | `packages/use-cases/src/interactors/GetJudgedStaffVotingProgress.ts` | ✅ Registered |
| SubmitVoteUseCase                   | `packages/use-cases/src/interactors/SubmitVote.ts`                   | ✅ Registered |
| SubmitVotesUseCase                  | `packages/use-cases/src/interactors/SubmitVotes.ts`                  | ✅ Registered |
| ForceEndVotingUseCase               | `packages/use-cases/src/interactors/ForceEndVoting.ts`               | ✅ Registered |

#### Location Domain (8 use cases)

| File                         | Path                                                          | DI Status     |
| ---------------------------- | ------------------------------------------------------------- | ------------- |
| GetLocationUseCase           | `packages/use-cases/src/interactors/GetLocation.ts`           | ✅ Registered |
| CreateLocationUseCase        | `packages/use-cases/src/interactors/CreateLocation.ts`        | ✅ Registered |
| UpdateLocationUseCase        | `packages/use-cases/src/interactors/UpdateLocation.ts`        | ✅ Registered |
| ListLocationsUseCase         | `packages/use-cases/src/interactors/ListLocations.ts`         | ✅ Registered |
| UpdateSharingSettingsUseCase | `packages/use-cases/src/interactors/UpdateSharingSettings.ts` | ✅ Registered |
| AddSharingUserUseCase        | `packages/use-cases/src/interactors/AddSharingUser.ts`        | ✅ Registered |
| RemoveSharingUserUseCase     | `packages/use-cases/src/interactors/RemoveSharingUser.ts`     | ✅ Registered |
| GetSharingSettingsUseCase    | `packages/use-cases/src/interactors/GetSharingSettings.ts`    | ✅ Registered |

#### Notification Domain (1 use case)

| File                   | Path                                                    | DI Status     |
| ---------------------- | ------------------------------------------------------- | ------------- |
| GetNotificationUseCase | `packages/use-cases/src/interactors/GetNotification.ts` | ✅ Registered |

#### Activity Feed Domain (3 use cases)

| File                   | Path                                                    | DI Status     |
| ---------------------- | ------------------------------------------------------- | ------------- |
| GetActivityFeedUseCase | `packages/use-cases/src/interactors/GetActivityFeed.ts` | ✅ Registered |
| CreateActivityUseCase  | `packages/use-cases/src/interactors/CreateActivity.ts`  | ✅ Registered |
| AddReactionUseCase     | `packages/use-cases/src/interactors/AddReaction.ts`     | ✅ Registered |

#### Submission Report Domain (2 use cases)

| File                | Path                                                 | DI Status     |
| ------------------- | ---------------------------------------------------- | ------------- |
| CreateReportUseCase | `packages/use-cases/src/interactors/CreateReport.ts` | ✅ Registered |
| GetReportsUseCase   | `packages/use-cases/src/interactors/GetReports.ts`   | ✅ Registered |

#### Sponsor Domain (7 use cases)

| File                         | Path                                                          | DI Status     |
| ---------------------------- | ------------------------------------------------------------- | ------------- |
| CreateSponsorUseCase         | `packages/use-cases/src/interactors/CreateSponsor.ts`         | ✅ Registered |
| GetSponsorUseCase            | `packages/use-cases/src/interactors/GetSponsor.ts`            | ✅ Registered |
| UpdateSponsorUseCase         | `packages/use-cases/src/interactors/UpdateSponsor.ts`         | ✅ Registered |
| DeleteSponsorUseCase         | `packages/use-cases/src/interactors/DeleteSponsor.ts`         | ✅ Registered |
| ListSponsorsUseCase          | `packages/use-cases/src/interactors/ListSponsors.ts`          | ✅ Registered |
| LinkSponsorToTripUseCase     | `packages/use-cases/src/interactors/LinkSponsorToTrip.ts`     | ✅ Registered |
| UnlinkSponsorFromTripUseCase | `packages/use-cases/src/interactors/UnlinkSponsorFromTrip.ts` | ✅ Registered |

#### Reward Domain (10 use cases)

| File                          | Path                                                           | DI Status     |
| ----------------------------- | -------------------------------------------------------------- | ------------- |
| GetRewardUseCase              | `packages/use-cases/src/interactors/GetReward.ts`              | ✅ Registered |
| CreateRewardUseCase           | `packages/use-cases/src/interactors/CreateReward.ts`           | ✅ Registered |
| UpdateRewardUseCase           | `packages/use-cases/src/interactors/UpdateReward.ts`           | ✅ Registered |
| SetRewardHiddenUseCase        | `packages/use-cases/src/interactors/SetRewardHidden.ts`        | ✅ Registered |
| DeleteRewardUseCase           | `packages/use-cases/src/interactors/DeleteReward.ts`           | ✅ Registered |
| ListRewardsUseCase            | `packages/use-cases/src/interactors/ListRewards.ts`            | ✅ Registered |
| PurchaseRewardUseCase         | `packages/use-cases/src/interactors/PurchaseReward.ts`         | ✅ Registered |
| UpdatePurchaseStatusUseCase   | `packages/use-cases/src/interactors/UpdatePurchaseStatus.ts`   | ✅ Registered |
| UpdateMyPurchaseStatusUseCase | `packages/use-cases/src/interactors/UpdateMyPurchaseStatus.ts` | ✅ Registered |
| GetPurchaseHistoryUseCase     | `packages/use-cases/src/interactors/GetPurchaseHistory.ts`     | ✅ Registered |

#### Coin Transaction Domain (7 use cases)

| File                             | Path                                                              | DI Status     |
| -------------------------------- | ----------------------------------------------------------------- | ------------- |
| GetCoinStatisticsUseCase         | `packages/use-cases/src/interactors/GetCoinStatistics.ts`         | ✅ Registered |
| GetMostActiveAdminStatsUseCase   | `packages/use-cases/src/interactors/GetMostActiveAdminStats.ts`   | ✅ Registered |
| GetCoinTransactionsUseCase       | `packages/use-cases/src/interactors/GetCoinTransactions.ts`       | ✅ Registered |
| GetCoinQuickStatsUseCase         | `packages/use-cases/src/interactors/GetCoinQuickStats.ts`         | ✅ Registered |
| GetCoinAdditionalInsightsUseCase | `packages/use-cases/src/interactors/GetCoinAdditionalInsights.ts` | ✅ Registered |
| AddCoinsUseCase                  | `packages/use-cases/src/interactors/AddCoins.ts`                  | ✅ Registered |
| RemoveCoinsUseCase               | `packages/use-cases/src/interactors/RemoveCoins.ts`               | ✅ Registered |

#### Notification Delivery Domain (4 use cases)

| File                               | Path                                                                | DI Status     |
| ---------------------------------- | ------------------------------------------------------------------- | ------------- |
| GetDeliveriesUseCase               | `packages/use-cases/src/interactors/GetDeliveries.ts`               | ✅ Registered |
| GetDeliveryByNotificationIdUseCase | `packages/use-cases/src/interactors/GetDeliveryByNotificationId.ts` | ✅ Registered |
| GetDeliveryStatsUseCase            | `packages/use-cases/src/interactors/GetDeliveryStats.ts`            | ✅ Registered |
| GetFailedDeliveriesUseCase         | `packages/use-cases/src/interactors/GetFailedDeliveries.ts`         | ✅ Registered |

#### Notification Schedule Domain (13 use cases)

| File                                           | Path                                                                            | DI Status     |
| ---------------------------------------------- | ------------------------------------------------------------------------------- | ------------- |
| GetNotificationSchedulesUseCase                | `packages/use-cases/src/interactors/GetNotificationSchedules.ts`                | ✅ Registered |
| GetNotificationScheduleByIdUseCase             | `packages/use-cases/src/interactors/GetNotificationScheduleById.ts`             | ✅ Registered |
| CreateNotificationScheduleUseCase              | `packages/use-cases/src/interactors/CreateNotificationSchedule.ts`              | ✅ Registered |
| UpdateNotificationScheduleUseCase              | `packages/use-cases/src/interactors/UpdateNotificationSchedule.ts`              | ✅ Registered |
| DeleteNotificationScheduleUseCase              | `packages/use-cases/src/interactors/DeleteNotificationSchedule.ts`              | ✅ Registered |
| GetActiveNotificationSchedulesUseCase          | `packages/use-cases/src/interactors/GetActiveNotificationSchedules.ts`          | ✅ Registered |
| GetUpcomingNotificationSchedulesUseCase        | `packages/use-cases/src/interactors/GetUpcomingNotificationSchedules.ts`        | ✅ Registered |
| UpdateNotificationScheduleLastRunUseCase       | `packages/use-cases/src/interactors/UpdateNotificationScheduleLastRun.ts`       | ✅ Registered |
| ToggleNotificationScheduleActiveUseCase        | `packages/use-cases/src/interactors/ToggleNotificationScheduleActive.ts`        | ✅ Registered |
| BulkToggleNotificationScheduleActiveUseCase    | `packages/use-cases/src/interactors/BulkToggleNotificationScheduleActive.ts`    | ✅ Registered |
| BulkDeleteNotificationSchedulesUseCase         | `packages/use-cases/src/interactors/BulkDeleteNotificationSchedules.ts`         | ✅ Registered |
| DuplicateNotificationScheduleUseCase           | `packages/use-cases/src/interactors/DuplicateNotificationSchedule.ts`           | ✅ Registered |
| GetNotificationScheduleExecutionHistoryUseCase | `packages/use-cases/src/interactors/GetNotificationScheduleExecutionHistory.ts` | ✅ Registered |

**AppModule Integration Required**:

```typescript
// File: packages/frameworks/src/di/AppModule.ts
// Line 67-71: Replace UseCaseModulePlaceholder with actual UseCaseModule import
```

### 3. Controllers (17 files) - MODULE READY

All controllers registered in `packages/adapters/src/modules/ControllerModule.ts`:

| File                                  | Token                            | Status        |
| ------------------------------------- | -------------------------------- | ------------- |
| `user-controller.ts`                  | `userController`                 | ✅ Registered |
| `trip-controller.ts`                  | `tripController`                 | ✅ Registered |
| `challenge-controller.ts`             | `challengeController`            | ✅ Registered |
| `group-controller.ts`                 | `groupController`                | ✅ Registered |
| `location-controller.ts`              | `locationController`             | ✅ Registered |
| `notification-controller.ts`          | `notificationController`         | ✅ Registered |
| `notification-schedule-controller.ts` | `notificationScheduleController` | ✅ Registered |
| `notification-delivery-controller.ts` | `notificationDeliveryController` | ✅ Registered |
| `challengeSubmission-controller.ts`   | `challengeSubmissionController`  | ✅ Registered |
| `challengeVote-controller.ts`         | `challengeVoteController`        | ✅ Registered |
| `activityFeed-controller.ts`          | `activityFeedController`         | ✅ Registered |
| `reward-controller.ts`                | `rewardController`               | ✅ Registered |
| `coin-controller.ts`                  | `coinController`                 | ✅ Registered |
| `coin-transaction-controller.ts`      | `coinTransactionController`      | ✅ Registered |
| `sponsor-controller.ts`               | `sponsorController`              | ✅ Registered |
| `submissionReport-controller.ts`      | `submissionReportController`     | ✅ Registered |
| `storage-controller.ts`               | `storageController`              | ✅ Registered |

### 4. tRPC Routers (19 files) - NEED MIGRATION

Current routers using DI: **2** (user.ts, challenge.ts)

Routers needing DI migration: **17**

| File                    | Path                                                        | Current Pattern | Target Pattern |
| ----------------------- | ----------------------------------------------------------- | --------------- | -------------- |
| activityFeed.ts         | `packages/adapters/src/api/routers/activityFeed.ts`         | Direct import   | ctx.di.resolve |
| challengeSubmission.ts  | `packages/adapters/src/api/routers/challengeSubmission.ts`  | Direct import   | ctx.di.resolve |
| challengeVote.ts        | `packages/adapters/src/api/routers/challengeVote.ts`        | Direct import   | ctx.di.resolve |
| coin.ts                 | `packages/adapters/src/api/routers/coin.ts`                 | Direct import   | ctx.di.resolve |
| coinTransaction.ts      | `packages/adapters/src/api/routers/coinTransaction.ts`      | Direct import   | ctx.di.resolve |
| group.ts                | `packages/adapters/src/api/routers/group.ts`                | Direct import   | ctx.di.resolve |
| location.ts             | `packages/adapters/src/api/routers/location.ts`             | Direct import   | ctx.di.resolve |
| notificationDelivery.ts | `packages/adapters/src/api/routers/notificationDelivery.ts` | Direct import   | ctx.di.resolve |
| notificationSchedule.ts | `packages/adapters/src/api/routers/notificationSchedule.ts` | Direct import   | ctx.di.resolve |
| notificationSender.ts   | `packages/adapters/src/api/routers/notificationSender.ts`   | Direct import   | ctx.di.resolve |
| notifications.ts        | `packages/adapters/src/api/routers/notifications.ts`        | Direct import   | ctx.di.resolve |
| reward.ts               | `packages/adapters/src/api/routers/reward.ts`               | Direct import   | ctx.di.resolve |
| sponsor.ts              | `packages/adapters/src/api/routers/sponsor.ts`              | Direct import   | ctx.di.resolve |
| storage.ts              | `packages/adapters/src/api/routers/storage.ts`              | Direct import   | ctx.di.resolve |
| submissionReport.ts     | `packages/adapters/src/api/routers/submissionReport.ts`     | Direct import   | ctx.di.resolve |
| trip.ts                 | `packages/adapters/src/api/routers/trip.ts`                 | Direct import   | ctx.di.resolve |

### 5. tRPC Controllers Index - MAJOR MIGRATION NEEDED

**File**: `packages/adapters/src/api/controllers/index.ts` (4,311 lines)

This file contains ~87 direct instantiations of controllers that need migration to DI pattern:

**Current Pattern**:

```typescript
const controller = new StorageController(ctx.supabase);
const controller = new GroupController(repo);
const controller = new NotificationController(repo);
```

**Target Pattern**:

```typescript
const controller = ctx.di.resolve<ControllerType>("controllerToken");
```

**Migration Blocks** (line numbers approximate):

- Lines 74-92: UserController (already using DI ✅)
- Lines 98-169: StorageController (needs migration)
- Lines 176-300+: ChallengeController (already using DI ✅)
- Lines 300-1000+: GroupController procedures (need migration)
- Lines 1000-2000+: NotificationController procedures (need migration)
- Lines 2000-3000+: ActivityFeedController procedures (need migration)
- Lines 3000-4000+: Other controllers (need migration)

### 6. DI Context and Infrastructure Files

| File         | Path                                      | Purpose                                       |
| ------------ | ----------------------------------------- | --------------------------------------------- |
| trpc.ts      | `packages/adapters/src/api/trpc.ts`       | DIContext interface defined (lines 168-200)   |
| AppModule.ts | `packages/frameworks/src/di/AppModule.ts` | Root module - needs UseCaseModule integration |
| container.ts | `packages/frameworks/src/di/container.ts` | Container initialization                      |
| index.ts     | `packages/frameworks/src/di/index.ts`     | DI exports                                    |

---

## Effect.ts Migration: Detailed File Catalog

### Overview

**Effect.ts** provides a functional effect system for managing async operations, error handling, and resource management. Migration involves replacing `Result<T,E>` with Effect-based patterns.

### Files Using Result<T,E>

**Total**: 101+ files import Result from domain package

#### Domain Layer - Entities (14 files)

| File                    | Path                                                   | Lines | Result Usage                  |
| ----------------------- | ------------------------------------------------------ | ----- | ----------------------------- |
| User.ts                 | `packages/domain/src/entities/User.ts`                 | ~120  | Validation, creation          |
| Challenge.ts            | `packages/domain/src/entities/Challenge.ts`            | ~400  | Validation, state transitions |
| ChallengeSubmission.ts  | `packages/domain/src/entities/ChallengeSubmission.ts`  | ~400  | Validation, scoring           |
| ChallengeVote.ts        | `packages/domain/src/entities/ChallengeVote.ts`        | ~200  | Validation, vote creation     |
| Group.ts                | `packages/domain/src/entities/Group.ts`                | ~250  | Validation, creation          |
| Location.ts             | `packages/domain/src/entities/Location.ts`             | ~450  | Validation, geofencing        |
| Notification.ts         | `packages/domain/src/entities/Notification.ts`         | ~350  | Validation, creation          |
| NotificationSchedule.ts | `packages/domain/src/entities/NotificationSchedule.ts` | ~650  | Complex scheduling logic      |
| ActivityFeed.ts         | `packages/domain/src/entities/ActivityFeed.ts`         | ~350  | Activity creation             |
| Reward.ts               | `packages/domain/src/entities/Reward.ts`               | ~500  | Purchase, validation          |
| Sponsor.ts              | `packages/domain/src/entities/Sponsor.ts`              | ~200  | Validation                    |
| SubmissionReport.ts     | `packages/domain/src/entities/SubmissionReport.ts`     | ~200  | Report creation               |
| Trip.ts                 | `packages/domain/src/entities/Trip.ts`                 | ~350  | Validation                    |

**Recommendation**: Keep Result<T,E> in domain layer. Domain entities should remain pure and simple.

#### Domain Layer - Value Objects (7 files)

| File            | Path                                                | Effect Candidate?      |
| --------------- | --------------------------------------------------- | ---------------------- |
| CoinAmount.ts   | `packages/domain/src/value-objects/CoinAmount.ts`   | No - simple validation |
| VotePosition.ts | `packages/domain/src/value-objects/VotePosition.ts` | No - simple validation |
| VoteWeight.ts   | `packages/domain/src/value-objects/VoteWeight.ts`   | No - simple validation |
| ReportReason.ts | `packages/domain/src/value-objects/ReportReason.ts` | No - simple validation |

#### Use Case Layer (75 files)

**High Priority for Effect.ts** (complex async flows):

| File                 | Path                                                      | Complexity | Async Operations           |
| -------------------- | --------------------------------------------------------- | ---------- | -------------------------- |
| PurchaseReward.ts    | `packages/use-cases/src/interactors/PurchaseReward.ts`    | High       | DB + coin calc + inventory |
| SubmitVotes.ts       | `packages/use-cases/src/interactors/SubmitVotes.ts`       | High       | Multiple vote creation     |
| ForceEndVoting.ts    | `packages/use-cases/src/interactors/ForceEndVoting.ts`    | High       | Vote calc + ranking update |
| AddCoins.ts          | `packages/use-cases/src/interactors/AddCoins.ts`          | Medium     | Transaction + notification |
| RemoveCoins.ts       | `packages/use-cases/src/interactors/RemoveCoins.ts`       | Medium     | Transaction + validation   |
| CreateSubmission.ts  | `packages/use-cases/src/interactors/CreateSubmission.ts`  | Medium     | DB + activity feed         |
| GetCoinStatistics.ts | `packages/use-cases/src/interactors/GetCoinStatistics.ts` | Medium     | Aggregation queries        |

**Low Priority** (simple CRUD - keep Result<T,E>):

| File            | Path                                                 | Complexity |
| --------------- | ---------------------------------------------------- | ---------- |
| GetUser.ts      | `packages/use-cases/src/interactors/GetUser.ts`      | Low        |
| CreateUser.ts   | `packages/use-cases/src/interactors/CreateUser.ts`   | Low        |
| GetChallenge.ts | `packages/use-cases/src/interactors/GetChallenge.ts` | Low        |
| GetGroup.ts     | `packages/use-cases/src/interactors/GetGroup.ts`     | Low        |
| GetLocation.ts  | `packages/use-cases/src/interactors/GetLocation.ts`  | Low        |
| GetSponsor.ts   | `packages/use-cases/src/interactors/GetSponsor.ts`   | Low        |

#### Controller Layer (17 files)

Controllers wrap use cases and transform results for tRPC. Effect migration would require:

- Converting Effect to Promise at controller boundary
- Or updating tRPC adapters to support Effect

**Recommendation**: Keep controllers with Result<T,E> pattern for now.

#### Result Utility Files

| File           | Path                                       | Purpose                         |
| -------------- | ------------------------------------------ | ------------------------------- |
| result.ts      | `packages/domain/src/utils/result.ts`      | Core Result type and utilities  |
| result.test.ts | `packages/domain/src/utils/result.test.ts` | Result tests                    |
| validation.ts  | `packages/domain/src/utils/validation.ts`  | Validation helpers using Result |

---

## Test Files Requiring Updates

### Use Case Tests (16 files)

| File                          | Path                                                               | DI Updates Needed       |
| ----------------------------- | ------------------------------------------------------------------ | ----------------------- |
| CreateUser.test.ts            | `packages/use-cases/src/interactors/CreateUser.test.ts`            | Container-based mocking |
| GetUser.test.ts               | `packages/use-cases/src/interactors/GetUser.test.ts`               | Container-based mocking |
| UpdateUser.test.ts            | `packages/use-cases/src/interactors/UpdateUser.test.ts`            | Container-based mocking |
| GetChallenge.test.ts          | `packages/use-cases/src/interactors/GetChallenge.test.ts`          | Container-based mocking |
| CreateChallenge.test.ts       | `packages/use-cases/src/interactors/CreateChallenge.test.ts`       | Container-based mocking |
| UpdateChallenge.test.ts       | `packages/use-cases/src/interactors/UpdateChallenge.test.ts`       | Container-based mocking |
| UpdateChallengeStatus.test.ts | `packages/use-cases/src/interactors/UpdateChallengeStatus.test.ts` | Container-based mocking |
| CreateReward.test.ts          | `packages/use-cases/src/interactors/CreateReward.test.ts`          | Container-based mocking |
| PurchaseReward.test.ts        | `packages/use-cases/src/interactors/PurchaseReward.test.ts`        | Container-based mocking |
| AddCoins.test.ts              | `packages/use-cases/src/interactors/AddCoins.test.ts`              | Container-based mocking |
| RemoveCoins.test.ts           | `packages/use-cases/src/interactors/RemoveCoins.test.ts`           | Container-based mocking |
| GetCoinStatistics.test.ts     | `packages/use-cases/src/interactors/GetCoinStatistics.test.ts`     | Container-based mocking |
| GetNotification.test.ts       | `packages/use-cases/src/interactors/GetNotification.test.ts`       | Container-based mocking |
| GetDeliveries.test.ts         | `packages/use-cases/src/interactors/GetDeliveries.test.ts`         | Container-based mocking |

### Module Tests (3 files)

| File                     | Path                                                               | Updates Needed            |
| ------------------------ | ------------------------------------------------------------------ | ------------------------- |
| UseCaseModule.test.ts    | `packages/use-cases/src/modules/__tests__/UseCaseModule.test.ts`   | Verify all 75 use cases   |
| ControllerModule.test.ts | `packages/adapters/src/modules/__tests__/ControllerModule.test.ts` | Verify all 17 controllers |
| AppModule.test.ts        | `packages/frameworks/src/di/__tests__/AppModule.test.ts`           | Verify integration        |

---

## Migration Phases and Sequencing

### Phase 1: AppModule Integration (Week 1)

**Files to modify**:

1. `packages/frameworks/src/di/AppModule.ts`
   - Replace UseCaseModulePlaceholder with actual UseCaseModule import
   - Update imports array

### Phase 2: tRPC Router Migration (Weeks 2-3)

**Priority order** (by usage frequency):

1. `challengeVote.ts` - High traffic
2. `challengeSubmission.ts` - High traffic
3. `activityFeed.ts` - Medium traffic
4. `reward.ts` - Medium traffic
5. `location.ts` - Medium traffic
6. `notificationSchedule.ts` - Admin usage
7. `notificationDelivery.ts` - Admin usage
8. `coinTransaction.ts` - Admin usage
9. `sponsor.ts` - Admin usage
10. `submissionReport.ts` - Moderator usage
11. `notifications.ts` - System usage
12. `coin.ts` - System usage
13. `storage.ts` - File operations
14. `group.ts` - Group management
15. `trip.ts` - Trip management
16. `notificationSender.ts` - Background jobs

### Phase 3: Controller Index Migration (Weeks 3-4)

**File**: `packages/adapters/src/api/controllers/index.ts`

Migrate by controller:

1. StorageController (lines 98-169)
2. GroupController procedures
3. NotificationController procedures
4. ActivityFeedController procedures
5. ChallengeSubmissionController procedures
6. ChallengeVoteController procedures
7. Remaining controllers

### Phase 4: Effect.ts Integration (Weeks 5-6)

**Priority use cases**:

1. `PurchaseReward.ts` - Complex transaction
2. `SubmitVotes.ts` - Batch operations
3. `ForceEndVoting.ts` - Multi-step workflow
4. `AddCoins.ts` + `RemoveCoins.ts` - Financial operations
5. `CreateSubmission.ts` - Side effects (activity feed)

### Phase 5: Test Migration (Weeks 6-8)

Update all test files to use DI container for mocking.

---

## Complexity Assessment

| Migration Type             | Files | Complexity | Risk   |
| -------------------------- | ----- | ---------- | ------ |
| AppModule Integration      | 1     | Low        | Low    |
| Router DI Migration        | 17    | Medium     | Medium |
| Controller Index Migration | 1     | High       | High   |
| Effect.ts Integration      | ~10   | High       | Medium |
| Test Updates               | 20+   | Medium     | Low    |

**Total Estimated Effort**: 6-8 developer weeks

---

## Key Dependencies and Blockers

### Blockers for Full Migration

1. **AppModule UseCaseModule Integration**
   - Current: Placeholder module
   - Required: Real UseCaseModule import
   - Impact: Blocks all use case DI resolution

2. **Controller Index Size**
   - File: 4,311 lines
   - Risk: High chance of merge conflicts
   - Mitigation: Migrate in small chunks

3. **Test Infrastructure**
   - Need container-based mocking utilities
   - Test isolation requirements

### Dependencies Between Phases

```
Phase 1 (AppModule)
    ↓
Phase 2 (Routers) --can parallelize--> Phase 3 (Controller Index)
    ↓
Phase 4 (Effect.ts) --can parallelize--> Phase 5 (Tests)
```

---

## Migration Strategy Recommendations

### Option 1: Sequential (Conservative)

- Complete each phase before starting next
- Lower risk, longer timeline
- Best for: Team learning DI/Effect patterns

### Option 2: Parallel (Aggressive)

- Multiple subagents work on different routers simultaneously
- Controller index migration split by controller
- Best for: Faster delivery, requires experienced team

### Option 3: Hybrid (Recommended)

- Phase 1: Sequential (foundation)
- Phase 2-3: Parallel (independent routers)
- Phase 4-5: Sequential (stabilization)

---

## Appendix: Migration Patterns

### DI Migration Pattern

**Before**:

```typescript
import { GroupController } from "../../controllers/group-controller";
import { PrismaGroupRepository } from "../../gateways/PrismaGroupRepository";

export const groupController = {
  getById: protectedProcedure.query(async ({ ctx, input }) => {
    const repo = new PrismaGroupRepository(ctx.db);
    const controller = new GroupController(repo);
    return controller.getById(input);
  }),
};
```

**After**:

```typescript
export const groupController = {
  getById: protectedProcedure.query(async ({ ctx, input }) => {
    const controller = ctx.di.resolve<GroupController>("groupController");
    return controller.getById(input);
  }),
};
```

### Effect.ts Migration Pattern

**Before**:

```typescript
async execute(input: PurchaseInput): Promise<Result<Output, string>> {
  const user = await this.userRepo.findById(input.userId);
  if (!user) return err("User not found");

  const reward = await this.rewardRepo.findById(input.rewardId);
  if (!reward) return err("Reward not found");

  const hasCoins = await this.coinService.checkBalance(user.id, reward.cost);
  if (!hasCoins) return err("Insufficient coins");

  // ... more steps
}
```

**After**:

```typescript
import { Effect, pipe } from "effect";

execute(input: PurchaseInput): Effect.Effect<Output, PurchaseError> {
  return pipe(
    Effect.promise(() => this.userRepo.findById(input.userId)),
    Effect.flatMap(user =>
      user ? Effect.succeed(user) : Effect.fail(new UserNotFoundError())
    ),
    Effect.flatMap(user =>
      Effect.promise(() => this.rewardRepo.findById(input.rewardId))
    ),
    Effect.flatMap(reward =>
      reward ? Effect.succeed(reward) : Effect.fail(new RewardNotFoundError())
    ),
    // ... compose remaining steps
  );
}
```

---

_Analysis generated: 2026-04-09_  
_Scope: Full codebase DI + Effect.ts migration_  
_Total files identified: 400+_
