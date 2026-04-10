# Codebase Impact Analysis: Clean Architecture Naming Refactor

**Analysis Date:** 2026-04-10  
**Task:** Refactor Clean Architecture naming - group framework libraries in folders  
**Analyst:** sdd:code-explorer

---

## Summary

This analysis covers the impact of refactoring the adapters layer to remove framework names from filenames and move in-memory repositories from test-utils to the adapter layer.

---

## Current File Inventory

### 1. Drizzle Gateways (17 files)

| Current Path                              | File Count     |
| ----------------------------------------- | -------------- |
| `packages/adapters/src/gateways/drizzle/` | 17 `.ts` files |

**Files:**

- DrizzleActivityFeedRepository.ts
- DrizzleChallengeRepository.ts
- DrizzleChallengeSubmissionRepository.ts
- DrizzleChallengeVoteRepository.ts
- DrizzleCoinTransactionRepository.ts
- DrizzleEventRepository.ts
- DrizzleGroupRepository.ts
- DrizzleLocationRepository.ts
- DrizzleNotificationDeliveryRepository.ts
- DrizzleNotificationRepository.ts
- DrizzleNotificationScheduleRepository.ts
- DrizzleRewardRepository.ts
- DrizzleSponsorRepository.ts
- DrizzleSubmissionReportRepository.ts
- DrizzleTelemetryAdapter.ts
- DrizzleTripRepository.ts
- DrizzleUserRepository.ts

**Impact:** All imports referencing these files need updating. Index file exports need updating.

### 2. Drizzle Mappers (17 files)

| Current Path                             | File Count     |
| ---------------------------------------- | -------------- |
| `packages/adapters/src/mappers/drizzle/` | 17 `.ts` files |

**Files:**

- ActivityFeedDrizzleMapper.ts
- ChallengeDrizzleMapper.ts
- ChallengeSubmissionDrizzleMapper.ts
- ChallengeVoteDrizzleMapper.ts
- CoinTransactionDrizzleMapper.ts
- EventDrizzleMapper.ts
- GroupDrizzleMapper.ts
- LocationDrizzleMapper.ts
- NotificationDeliveryDrizzleMapper.ts
- NotificationDrizzleMapper.ts
- NotificationScheduleDrizzleMapper.ts
- RewardDrizzleMapper.ts
- SponsorDrizzleMapper.ts
- SubmissionReportDrizzleMapper.ts
- TripDrizzleMapper.ts
- UserAgentDrizzleMapper.ts
- UserDrizzleMapper.ts

**Impact:** All mapper imports need updating. Mappers are used by gateways and services.

### 3. Controllers (17 files)

| Current Path                         | File Count                |
| ------------------------------------ | ------------------------- |
| `packages/adapters/src/controllers/` | 17 `-controller.ts` files |

**Files:**

- activityFeed-controller.ts
- challenge-controller.ts
- challengeSubmission-controller.ts
- challengeVote-controller.ts
- coin-controller.ts
- coin-transaction-controller.ts (partial kebab-case already)
- group-controller.ts
- location-controller.ts
- notification-controller.ts
- notification-delivery-controller.ts
- notification-schedule-controller.ts
- reward-controller.ts
- sponsor-controller.ts
- storage-controller.ts
- submissionReport-controller.ts
- trip-controller.ts
- user-controller.ts

**Impact:** Router files import controllers. Auth controller has subdirectory.

### 4. Drizzle Services (9 files)

| Current Path                      | File Count            |
| --------------------------------- | --------------------- |
| `packages/adapters/src/services/` | 9 `Drizzle*.ts` files |

**Files:**

- DrizzleCoinService.ts
- DrizzleCoinTransactionService.ts
- DrizzleGroupCoinsService.ts
- DrizzleNotificationSenderService.ts
- DrizzleRankingActivityService.ts
- DrizzleRewardService.ts
- DrizzleTripAccessChecker.ts
- DrizzleTripPointsCalculator.ts

**Note:** Also includes non-Drizzle services:

- ConnectionManager.ts
- EventBus.ts
- LocationStreamingService.ts
- NotificationDeliveryService.ts
- notificationService.ts

### 5. In-Memory Repositories (17 files in test-utils)

| Current Path                        | File Count     |
| ----------------------------------- | -------------- |
| `packages/adapters/src/test-utils/` | 17 `.ts` files |

**Files:**

- index.ts (exports)
- mocks.ts
- InMemoryRepository.ts (base class)
- InMemoryActivityFeedRepository.ts
- InMemoryChallengeRepository.ts
- InMemoryChallengeSubmissionRepository.ts
- InMemoryChallengeVoteRepository.ts
- InMemoryCoinTransactionRepository.ts
- InMemoryGroupRepository.ts
- InMemoryLocationRepository.ts
- InMemoryNotificationDeliveryRepository.ts
- InMemoryNotificationRepository.ts
- InMemoryNotificationScheduleRepository.ts
- InMemoryRewardRepository.ts
- InMemorySponsorRepository.ts
- InMemorySubmissionReportRepository.ts
- InMemoryTripRepository.ts
- InMemoryUserRepository.ts

**Impact:** Moving these to `gateways/in-memory/` affects all test files importing from test-utils.

### 6. Other Framework Files

| File                     | Current Location | Target Location             |
| ------------------------ | ---------------- | --------------------------- |
| BaseDrizzleRepository.ts | gateways/        | gateways/base/repository.ts |
| AdapterErrors.ts         | errors/          | errors/adapter-errors.ts    |

---

## Integration Points

### Module Configuration Files

**Files importing adapter components:**

- `packages/adapters/src/modules/ControllerModule.ts`
- `packages/adapters/src/modules/RepositoryModule.ts`
- `packages/adapters/src/modules/UseCaseModule.ts`

These use `awilix-modular` and reference file paths for DI registration.

### Index Exports

**Barrel files to update:**

- `packages/adapters/src/index.ts` (main exports)
- `packages/adapters/src/gateways/index.ts`
- `packages/adapters/src/gateways/drizzle/index.ts`
- `packages/adapters/src/mappers/index.ts`
- `packages/adapters/src/services/index.ts`
- `packages/adapters/src/controllers/index.ts` (may not exist)
- `packages/adapters/src/errors/index.ts`

### Cross-Package Imports

**Apps that may import from adapters:**

- `apps/backend-server/` - Uses controllers, gateways
- Test suites across all packages

---

## Risk Assessment

### High Risk

| Risk                   | Mitigation                                                 |
| ---------------------- | ---------------------------------------------------------- |
| Missing import updates | Comprehensive grep before/after. Test after each phase     |
| Broken DI registration | Update module files in same phase as file moves            |
| Test suite failures    | Maintain backwards-compatible re-exports during transition |

### Medium Risk

| Risk                             | Mitigation                                       |
| -------------------------------- | ------------------------------------------------ |
| Index file circular dependencies | Test barrel file imports separately              |
| Naming collisions                | Use kebab-case consistently, verify no conflicts |

### Low Risk

| Risk               | Mitigation                          |
| ------------------ | ----------------------------------- |
| File rename errors | Use git mv for proper tracking      |
| Export omissions   | Review index files after each phase |

---

## Files to Create

### New Folders

```
packages/adapters/src/
├── gateways/
│   ├── base/           # New folder for base classes
│   │   ├── repository.ts
│   │   └── types.ts
│   └── in-memory/      # New folder for in-memory repos
│       ├── index.ts
│       ├── base.ts
│       ├── user.ts
│       ├── group.ts
│       ├── trip.ts
│       ├── challenge.ts
│       ├── challenge-submission.ts
│       ├── challenge-vote.ts
│       ├── location.ts
│       ├── notification.ts
│       ├── notification-delivery.ts
│       ├── notification-schedule.ts
│       ├── reward.ts
│       ├── sponsor.ts
│       ├── coin-transaction.ts
│       ├── activity-feed.ts
│       ├── submission-report.ts
│       └── mocks.ts
```

---

## Testing Impact

### Tests Referencing test-utils

**Contract Tests:**

- `packages/adapters/src/gateways/__tests__/PortImplementations.contract.test.ts`
- `packages/adapters/src/gateways/__tests__/InMemoryAdapters.contract.test.ts`

**Unit Tests:**

- Controller tests in `packages/adapters/src/controllers/__tests__/`
- Service tests in `packages/adapters/src/services/__tests__/`
- Gateway tests in `packages/adapters/src/gateways/__tests__/`

### Test Update Strategy

1. Update imports to reference new `gateways/in-memory/` paths
2. Or maintain temporary re-exports in `test-utils/index.ts` during transition
3. Remove test-utils folder only after all imports verified

---

## Estimated Scope

| Metric                   | Count |
| ------------------------ | ----- |
| Files to rename          | 60+   |
| Files to move            | 17    |
| Folders to create        | 2     |
| Index files to update    | 7+    |
| Module files to update   | 3     |
| Estimated import updates | 200+  |
| Test files affected      | 20+   |

---

## Recommendations

1. **Phase approach:** Move in-memory repos first (highest risk), then mechanical renames
2. **Test after each phase:** Verify build and tests pass before continuing
3. **Git checkpoints:** Commit after each phase for easy rollback
4. **Temporary re-exports:** Maintain backwards compatibility during transition
5. **CI validation:** Run full test suite + dependency-cruiser before final cleanup

---

**End of Analysis**
