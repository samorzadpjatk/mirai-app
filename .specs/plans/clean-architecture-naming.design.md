# Clean Architecture Naming Refactor: Framework-Library Files

> **Design Document**  
> Groups framework-specific code in folders, removes framework names from filenames, moves in-memory repositories to adapters layer.

---

## Summary

This refactor reorganizes `packages/adapters/src/` to follow Clean Architecture principles more strictly. Framework names (Drizzle, Supabase, Prisma) move from filenames to folder names. In-memory test implementations move from `test-utils/` to `gateways/in-memory/` as they are adapter implementations.

---

## Goals

1. **Remove framework names from filenames** (`DrizzleUserRepository.ts` → `user.ts`)
2. **Group by technology in folders** (`drizzle/`, `supabase/`, `in-memory/`)
3. **Move in-memory repos to adapters** (they implement ports, belong in adapter layer)
4. **Standardize on kebab-case** for all source files
5. **Maintain Clean Architecture** (frameworks → adapters → use-cases → domain)

---

## New Structure

```
packages/adapters/src/
├── controllers/
│   ├── user.ts
│   ├── group.ts
│   ├── challenge.ts
│   ├── challenge-submission.ts
│   ├── challenge-vote.ts
│   ├── coin.ts
│   ├── coin-transaction.ts
│   ├── activity-feed.ts
│   ├── notification.ts
│   ├── notification-delivery.ts
│   ├── notification-schedule.ts
│   ├── reward.ts
│   ├── sponsor.ts
│   ├── trip.ts
│   ├── location.ts
│   ├── storage.ts
│   ├── submission-report.ts
│   └── auth/
│       ├── index.ts
│       └── server.ts
│
├── gateways/
│   ├── index.ts
│   ├── base/
│   │   ├── repository.ts           # BaseDrizzleRepository
│   │   └── types.ts
│   │
│   ├── drizzle/                    # Production ORM implementations
│   │   ├── user.ts                 # DrizzleUserRepository
│   │   ├── group.ts
│   │   ├── trip.ts
│   │   ├── challenge.ts
│   │   ├── challenge-submission.ts
│   │   ├── challenge-vote.ts
│   │   ├── location.ts
│   │   ├── notification.ts
│   │   ├── notification-delivery.ts
│   │   ├── notification-schedule.ts
│   │   ├── reward.ts
│   │   ├── sponsor.ts
│   │   ├── coin-transaction.ts
│   │   ├── activity-feed.ts
│   │   ├── submission-report.ts
│   │   └── telemetry.ts
│   │
│   ├── in-memory/                  # Test implementations (MOVED from test-utils)
│   │   ├── index.ts
│   │   ├── base.ts                 # InMemoryRepository
│   │   ├── user.ts
│   │   ├── group.ts
│   │   ├── trip.ts
│   │   ├── challenge.ts
│   │   ├── challenge-submission.ts
│   │   ├── challenge-vote.ts
│   │   ├── location.ts
│   │   ├── notification.ts
│   │   ├── notification-delivery.ts
│   │   ├── notification-schedule.ts
│   │   ├── reward.ts
│   │   ├── sponsor.ts
│   │   ├── coin-transaction.ts
│   │   ├── activity-feed.ts
│   │   ├── submission-report.ts
│   │   └── mocks.ts                # Mock factories
│   │
│   ├── supabase/                   # Supabase service adapters
│   │   ├── auth/
│   │   │   ├── index.ts
│   │   │   └── adapter.ts          # SupabaseAuthAdapter
│   │   ├── storage/
│   │   │   ├── index.ts
│   │   │   └── adapter.ts          # SupabaseStorageAdapter
│   │   └── realtime/
│   │       ├── index.ts
│   │       └── adapter.ts          # SupabaseRealtimeAdapter
│   │
│   └── __tests__/
│       └── gateway-contracts.test.ts
│
├── mappers/
│   ├── index.ts
│   ├── drizzle/                    # Drizzle entity mappers
│   │   ├── user.ts
│   │   ├── group.ts
│   │   ├── trip.ts
│   │   ├── challenge.ts
│   │   ├── challenge-submission.ts
│   │   ├── challenge-vote.ts
│   │   ├── location.ts
│   │   ├── notification.ts
│   │   ├── notification-delivery.ts
│   │   ├── notification-schedule.ts
│   │   ├── reward.ts
│   │   ├── sponsor.ts
│   │   ├── coin-transaction.ts
│   │   ├── activity-feed.ts
│   │   ├── submission-report.ts
│   │   ├── event.ts
│   │   └── user-agent.ts
│   │
│   └── in-memory/                  # (If needed for test mappers)
│
├── services/
│   ├── index.ts
│   ├── coin.ts                     # DrizzleCoinService
│   ├── coin-transaction.ts
│   ├── event-bus.ts
│   ├── group-coins.ts
│   ├── location-streaming.ts
│   ├── notification-delivery.ts
│   ├── notification-sender.ts
│   ├── ranking-activity.ts
│   ├── reward.ts
│   ├── trip-access.ts
│   └── trip-points.ts
│
├── errors/
│   ├── index.ts
│   └── adapter-errors.ts
│
├── utils/
│   ├── controller-helpers.ts
│   ├── repository-factory.ts
│   ├── storage-helpers.ts
│   ├── storage.ts
│   └── token-extractor.ts
│
└── modules/
    ├── controller-module.ts
    ├── repository-module.ts
    └── use-case-module.ts
```

---

## Migration Phases

### Phase 1: Preparation

Run baseline tests:

```bash
bun test
bunx dependency-cruiser --validate .dependency-cruiser.mjs .
```

Create backup branch:

```bash
git checkout -b refactor/clean-architecture-naming
git add .
git commit -m "refactor: baseline before naming refactor"
```

### Phase 2: Move In-Memory Repositories

Move files from `test-utils/` to `gateways/in-memory/`:

| From                                                   | To                                            |
| ------------------------------------------------------ | --------------------------------------------- |
| `test-utils/InMemoryRepository.ts`                     | `gateways/in-memory/base.ts`                  |
| `test-utils/InMemoryUserRepository.ts`                 | `gateways/in-memory/user.ts`                  |
| `test-utils/InMemoryChallengeRepository.ts`            | `gateways/in-memory/challenge.ts`             |
| `test-utils/InMemoryGroupRepository.ts`                | `gateways/in-memory/group.ts`                 |
| `test-utils/InMemoryTripRepository.ts`                 | `gateways/in-memory/trip.ts`                  |
| `test-utils/InMemoryRewardRepository.ts`               | `gateways/in-memory/reward.ts`                |
| `test-utils/InMemoryCoinTransactionRepository.ts`      | `gateways/in-memory/coin-transaction.ts`      |
| `test-utils/InMemoryLocationRepository.ts`             | `gateways/in-memory/location.ts`              |
| `test-utils/InMemoryNotificationRepository.ts`         | `gateways/in-memory/notification.ts`          |
| `test-utils/InMemoryNotificationScheduleRepository.ts` | `gateways/in-memory/notification-schedule.ts` |
| `test-utils/InMemoryNotificationDeliveryRepository.ts` | `gateways/in-memory/notification-delivery.ts` |
| `test-utils/InMemoryChallengeSubmissionRepository.ts`  | `gateways/in-memory/challenge-submission.ts`  |
| `test-utils/InMemoryChallengeVoteRepository.ts`        | `gateways/in-memory/challenge-vote.ts`        |
| `test-utils/InMemoryActivityFeedRepository.ts`         | `gateways/in-memory/activity-feed.ts`         |
| `test-utils/InMemorySponsorRepository.ts`              | `gateways/in-memory/sponsor.ts`               |
| `test-utils/InMemorySubmissionReportRepository.ts`     | `gateways/in-memory/submission-report.ts`     |
| `test-utils/mocks.ts`                                  | `gateways/in-memory/mocks.ts`                 |

Update `gateways/in-memory/index.ts`:

```typescript
export { InMemoryRepository } from "./base";
export { InMemoryUserRepository } from "./user";
// ... etc
export {
  createMockPrismaClient,
  createMockContext,
  type MockPrismaClient,
  type MockContext,
} from "./mocks";
```

### Phase 3: Rename Drizzle Gateway Files

Rename `gateways/drizzle/*.ts` to kebab-case without Drizzle prefix:

| From                                       | To                         |
| ------------------------------------------ | -------------------------- |
| `DrizzleUserRepository.ts`                 | `user.ts`                  |
| `DrizzleGroupRepository.ts`                | `group.ts`                 |
| `DrizzleTripRepository.ts`                 | `trip.ts`                  |
| `DrizzleChallengeRepository.ts`            | `challenge.ts`             |
| `DrizzleChallengeSubmissionRepository.ts`  | `challenge-submission.ts`  |
| `DrizzleChallengeVoteRepository.ts`        | `challenge-vote.ts`        |
| `DrizzleLocationRepository.ts`             | `location.ts`              |
| `DrizzleNotificationRepository.ts`         | `notification.ts`          |
| `DrizzleNotificationDeliveryRepository.ts` | `notification-delivery.ts` |
| `DrizzleNotificationScheduleRepository.ts` | `notification-schedule.ts` |
| `DrizzleRewardRepository.ts`               | `reward.ts`                |
| `DrizzleSponsorRepository.ts`              | `sponsor.ts`               |
| `DrizzleCoinTransactionRepository.ts`      | `coin-transaction.ts`      |
| `DrizzleActivityFeedRepository.ts`         | `activity-feed.ts`         |
| `DrizzleSubmissionReportRepository.ts`     | `submission-report.ts`     |
| `DrizzleTelemetryAdapter.ts`               | `telemetry.ts`             |

Update `gateways/drizzle/index.ts`:

```typescript
export { UserRepository } from "./user";
export { GroupRepository } from "./group";
// ... etc (class names stay the same, just file paths change)
```

### Phase 4: Rename Mappers

Rename `mappers/drizzle/*DrizzleMapper.ts` to kebab-case:

| From                                   | To                         |
| -------------------------------------- | -------------------------- |
| `UserDrizzleMapper.ts`                 | `user.ts`                  |
| `GroupDrizzleMapper.ts`                | `group.ts`                 |
| `TripDrizzleMapper.ts`                 | `trip.ts`                  |
| `ChallengeDrizzleMapper.ts`            | `challenge.ts`             |
| `ChallengeSubmissionDrizzleMapper.ts`  | `challenge-submission.ts`  |
| `ChallengeVoteDrizzleMapper.ts`        | `challenge-vote.ts`        |
| `LocationDrizzleMapper.ts`             | `location.ts`              |
| `NotificationDrizzleMapper.ts`         | `notification.ts`          |
| `NotificationDeliveryDrizzleMapper.ts` | `notification-delivery.ts` |
| `NotificationScheduleDrizzleMapper.ts` | `notification-schedule.ts` |
| `RewardDrizzleMapper.ts`               | `reward.ts`                |
| `SponsorDrizzleMapper.ts`              | `sponsor.ts`               |
| `CoinTransactionDrizzleMapper.ts`      | `coin-transaction.ts`      |
| `ActivityFeedDrizzleMapper.ts`         | `activity-feed.ts`         |
| `SubmissionReportDrizzleMapper.ts`     | `submission-report.ts`     |
| `EventDrizzleMapper.ts`                | `event.ts`                 |
| `UserAgentDrizzleMapper.ts`            | `user-agent.ts`            |

### Phase 5: Rename Controllers

Rename controller files to remove `-controller` suffix:

| From                                  | To                         |
| ------------------------------------- | -------------------------- |
| `user-controller.ts`                  | `user.ts`                  |
| `group-controller.ts`                 | `group.ts`                 |
| `challenge-controller.ts`             | `challenge.ts`             |
| `challengeSubmission-controller.ts`   | `challenge-submission.ts`  |
| `challengeVote-controller.ts`         | `challenge-vote.ts`        |
| `coin-controller.ts`                  | `coin.ts`                  |
| `coinTransaction-controller.ts`       | `coin-transaction.ts`      |
| `activityFeed-controller.ts`          | `activity-feed.ts`         |
| `notification-controller.ts`          | `notification.ts`          |
| `notification-delivery-controller.ts` | `notification-delivery.ts` |
| `notification-schedule-controller.ts` | `notification-schedule.ts` |
| `reward-controller.ts`                | `reward.ts`                |
| `sponsor-controller.ts`               | `sponsor.ts`               |
| `trip-controller.ts`                  | `trip.ts`                  |
| `location-controller.ts`              | `location.ts`              |
| `storage-controller.ts`               | `storage.ts`               |
| `submissionReport-controller.ts`      | `submission-report.ts`     |

### Phase 6: Rename Services and Base Classes

| From                                  | To                                |
| ------------------------------------- | --------------------------------- |
| `BaseDrizzleRepository.ts`            | `gateways/base/repository.ts`     |
| `DrizzleCoinService.ts`               | `services/coin.ts`                |
| `DrizzleCoinTransactionService.ts`    | `services/coin-transaction.ts`    |
| `DrizzleGroupCoinsService.ts`         | `services/group-coins.ts`         |
| `DrizzleNotificationSenderService.ts` | `services/notification-sender.ts` |
| `DrizzleRankingActivityService.ts`    | `services/ranking-activity.ts`    |
| `DrizzleRewardService.ts`             | `services/reward.ts`              |
| `DrizzleTripAccessChecker.ts`         | `services/trip-access.ts`         |
| `DrizzleTripPointsCalculator.ts`      | `services/trip-points.ts`         |

### Phase 7: Rename Error File

| From               | To                         |
| ------------------ | -------------------------- |
| `AdapterErrors.ts` | `errors/adapter-errors.ts` |

### Phase 8: Update Imports Across Codebase

Update all import statements to use new paths. Temporary backwards compatibility in `test-utils/index.ts`:

```typescript
// packages/adapters/src/test-utils/index.ts (TEMPORARY)
// Re-export from new locations during transition
export { InMemoryUserRepository } from "../gateways/in-memory/user";
// ... re-export all moved items
export {
  createMockPrismaClient,
  createMockContext,
} from "../gateways/in-memory/mocks";
```

### Phase 9: Final Cleanup

Remove `test-utils/` folder after verifying no references remain:

```bash
rm -rf packages/adapters/src/test-utils/
```

Update `adapters/src/index.ts` exports:

```typescript
// Main exports
export * from "./controllers";
export * from "./gateways";
export * from "./mappers";
export * from "./services";
export * from "./errors";
export * from "./utils";

// Test utilities (now from gateways/in-memory)
export * from "./gateways/in-memory";
```

---

## Testing Strategy

| Phase         | Verification                                         |
| ------------- | ---------------------------------------------------- |
| After Phase 2 | `bun test packages/adapters` – in-memory repos work  |
| After Phase 3 | `bun test packages/adapters` – drizzle repos renamed |
| After Phase 4 | `bun test packages/adapters` – mappers renamed       |
| After Phase 5 | `bun test packages/adapters` – controllers renamed   |
| After Phase 6 | `bun test packages/adapters` – services renamed      |
| After Phase 8 | `bun test` (full suite) – all imports updated        |
| After Phase 9 | `bun test` + `bunx dependency-cruiser --validate`    |

---

## Rollback Strategy

If any phase fails:

1. `git status` – identify modified files
2. `git checkout -- <files>` – revert specific files
3. Or `git reset --hard HEAD~1` – revert to last checkpoint
4. Fix issue, resume from failed phase

Commit after each successful phase:

```bash
git add .
git commit -m "refactor(adapters): Phase X – description"
```

---

## Acceptance Criteria

- [ ] All framework names removed from filenames (Drizzle, Supabase, Prisma)
- [ ] All files use kebab-case naming
- [ ] In-memory repositories live in `gateways/in-memory/`
- [ ] All imports updated across codebase
- [ ] `test-utils/` folder removed
- [ ] All tests pass
- [ ] Dependency cruiser validation passes
- [ ] No breaking changes to public API (exports maintained)

---

## Benefits

1. **Cleaner architecture** – Technology in folders, concern in filenames
2. **Easier navigation** – Find all Drizzle code in `drizzle/`, all Supabase in `supabase/`
3. **Consistent naming** – Kebab-case everywhere
4. **Clear separation** – Production vs test implementations obvious
5. **Maintainability** – New framework? Add a folder, not a naming convention

---

## Related Files

- `AGENTS.md` – Clean Architecture guidelines
- `CLAUDE.md` – Layer conventions
- `.dependency-cruiser.mjs` – Dependency validation

---

**Created**: 2026-04-10  
**Status**: Design validated, ready for implementation
