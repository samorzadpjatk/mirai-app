# Analysis: Migrate to Effect Framework

**Analysis Date:** 2026-04-12  
**Scope:** Full codebase migration from custom Result<T,E> to Effect framework  
**Current State:** Custom Result<T,E> pattern, minimal tRPC remnants, Hono+GraphQL architecture

---

## 1. Executive Summary

The codebase currently uses a custom `Result<T,E>` implementation for error handling across all layers. The migration to Effect framework involves:

- **NO tRPC removal required** - tRPC is already eliminated from production (only test mocks remain)
- **Evolutionary migration** - Result<T,E> → Effect<R,E,A> is a pattern upgrade
- **800+ files affected** across domain, use-cases, adapters, frameworks, and apps
- **219 test files** require updates to Effect-based testing patterns

---

## 2. tRPC Analysis

### 2.1 Current tRPC Status: ALREADY REMOVED

| Location           | Status                      |
| ------------------ | --------------------------- |
| Production code    | ✅ No tRPC imports found    |
| Backend server     | ✅ Uses Hono + GraphQL Yoga |
| Routers/Procedures | ✅ None exist               |
| Middleware         | ✅ None exist               |

### 2.2 Remaining tRPC References (Test-Only)

```
apps/web/test-setup.ts (lines 12-13)
- import "@trpc/client"
- import "@trpc/tanstack-react-query"

apps/backend-server/src/utils/__tests__/server.test.ts (4 mock references)
- mock.module("@trpc/server/adapters/fastify", ...)

packages/use-cases/src/interactors/__tests__/AuthenticateUser.test.ts (line 493)
- Test assertion: "does not import from @trpc/server"

packages/use-cases/src/ports/__tests__/AuthPort.test.ts (line 226)
- Test assertion: "AuthPort source does not import from @trpc/server"
```

**Action:** These are defensive test assertions ensuring tRPC doesn't leak into layers. No removal needed.

---

## 3. Domain Layer Analysis

### 3.1 Files Using Result<T,E> Pattern

**Core Result Implementation:**

- `packages/domain/src/utils/result.ts` (163 lines, 12 functions)
- `packages/domain/src/types/Result.ts` (146 lines, duplicate)

**Entity Files (18 total):**

```
packages/domain/src/entities/ActivityFeed.ts
packages/domain/src/entities/ActivityReaction.ts
packages/domain/src/entities/Challenge.ts
packages/domain/src/entities/ChallengeSubmission.ts
packages/domain/src/entities/ChallengeVote.ts
packages/domain/src/entities/CoinTransaction.ts
packages/domain/src/entities/Group.ts
packages/domain/src/entities/GroupJoinRequest.ts
packages/domain/src/entities/Location.ts
packages/domain/src/entities/Notification.ts
packages/domain/src/entities/NotificationDelivery.ts
packages/domain/src/entities/NotificationSchedule.ts
packages/domain/src/entities/PushSubscription.ts
packages/domain/src/entities/Reward.ts
packages/domain/src/entities/SubmissionReport.ts
packages/domain/src/entities/Trip.ts
packages/domain/src/entities/TripSponsor.ts
packages/domain/src/entities/User.ts
```

**Value Object Files (19 total):**

```
packages/domain/src/value-objects/ActivityId.ts
packages/domain/src/value-objects/AuthContext.ts
packages/domain/src/value-objects/ChallengeId.ts
packages/domain/src/value-objects/ChallengeVoteId.ts
packages/domain/src/value-objects/CoinAmount.ts
packages/domain/src/value-objects/LocationId.ts
packages/domain/src/value-objects/NotificationId.ts
packages/domain/src/value-objects/NotificationScheduleId.ts
packages/domain/src/value-objects/RewardId.ts
packages/domain/src/value-objects/SponsorId.ts
packages/domain/src/value-objects/SubmissionId.ts
packages/domain/src/value-objects/TripId.ts
packages/domain/src/value-objects/TripSponsorId.ts
packages/domain/src/value-objects/UserId.ts
packages/domain/src/value-objects/VotePosition.ts
packages/domain/src/value-objects/VoteWeight.ts
packages/domain/src/value-objects/ReportId.ts
packages/domain/src/value-objects/ReportReason.ts
```

**Entity Test Files (18 total):**
Each entity has a `.test.ts` counterpart.

### 3.2 Result Pattern Usage Stats

| File Pattern               | Count | Lines of Code |
| -------------------------- | ----- | ------------- |
| Entities using Result      | 18    | ~3000         |
| Value Objects using Result | 19    | ~1500         |
| Result utility functions   | 12    | ~310          |

### 3.3 Migration Complexity: MEDIUM

**Changes Required:**

1. Replace `Result<T, E>` with `Effect<never, E, T>`
2. Replace `ok(value)` with `Effect.succeed(value)`
3. Replace `err(error)` with `Effect.fail(error)`
4. Replace utility functions (map, flatMap, etc.) with Effect combinators

---

## 4. Use Cases Layer Analysis

### 4.1 Async/Await Patterns to Migrate

**Total Interactors:** 93 files  
**Pattern:** `async execute(): Promise<Result<T, E>>`

#### By Category:

**User Management (3):**

- GetUser.ts, CreateUser.ts, UpdateUser.ts

**Group Management (3):**

- GetGroup.ts, CreateGroup.ts, UpdateGroup.ts

**Challenge Operations (3):**

- GetChallenge.ts, CreateChallenge.ts, UpdateChallenge.ts

**Submission Operations (5):**

- GetSubmission.ts, CreateSubmission.ts, UpdateSubmission.ts, DeleteSubmission.ts, ListSubmissionsByChallenge.ts

**Voting Operations (6):**

- SubmitVotes.ts, SubmitVote.ts, GetMyVotes.ts, GetVotesByChallenge.ts, ForceEndVoting.ts, GetChallengeVotingProgress.ts, GetJudgedStaffVotingProgress.ts

**Reward Operations (9):**

- GetReward.ts, CreateReward.ts, UpdateReward.ts, DeleteReward.ts, PurchaseReward.ts, GetPurchaseHistory.ts, UpdatePurchaseStatus.ts, UpdateMyPurchaseStatus.ts, ListRewards.ts, SetRewardHidden.ts

**Sponsor Operations (7):**

- GetSponsor.ts, CreateSponsor.ts, UpdateSponsor.ts, DeleteSponsor.ts, ListSponsors.ts, LinkSponsorToTrip.ts, UnlinkSponsorFromTrip.ts

**Notification Operations (14):**

- GetNotification.ts, GetNotificationSchedules.ts, GetNotificationScheduleById.ts, CreateNotificationSchedule.ts, UpdateNotificationSchedule.ts, DeleteNotificationSchedule.ts, DuplicateNotificationSchedule.ts, ToggleNotificationScheduleActive.ts, BulkToggleNotificationScheduleActive.ts, BulkDeleteNotificationSchedules.ts, GetActiveNotificationSchedules.ts, GetUpcomingNotificationSchedules.ts, GetNotificationScheduleExecutionHistory.ts, UpdateNotificationScheduleLastRun.ts

**Delivery Operations (4):**

- GetDeliveryByNotificationId.ts, GetDeliveries.ts, GetFailedDeliveries.ts, GetDeliveryStats.ts

**Location Operations (4):**

- GetLocation.ts, CreateLocation.ts, UpdateLocation.ts, ListLocations.ts

**Coin Operations (6):**

- AddCoins.ts, RemoveCoins.ts, GetCoinTransactions.ts, GetCoinStatistics.ts, GetCoinAdditionalInsights.ts, GetCoinQuickStats.ts

**Sharing/Settings (4):**

- GetSharingSettings.ts, AddSharingUser.ts, RemoveSharingUser.ts, UpdateSharingSettings.ts

**Activity Feed (2):**

- GetActivityFeed.ts, CreateActivity.ts

**Reporting (2):**

- CreateReport.ts, GetReports.ts

**Reactions (1):**

- AddReaction.ts

**Authentication (1):**

- AuthenticateUser.ts (complex, 493 lines of tests)

**Stats/Admin (2):**

- GetMostActiveAdminStats.ts, LogTelemetry.ts

**Miscellaneous (2):**

- GetSubmissionByChallengeAndGroup.ts, UpdateChallengeStatus.ts

### 4.2 Port Interfaces (17 files)

```
packages/use-cases/src/ports/ActivityFeedRepository.ts
packages/use-cases/src/ports/AuthPort.ts
packages/use-cases/src/ports/ChallengeRepository.ts
packages/use-cases/src/ports/ChallengeSubmissionRepository.ts
packages/use-cases/src/ports/ChallengeVoteRepository.ts
packages/use-cases/src/ports/CoinTransactionRepository.ts
packages/use-cases/src/ports/GroupRepository.ts
packages/use-cases/src/ports/LocationRepository.ts
packages/use-cases/src/ports/NotificationDeliveryRepository.ts
packages/use-cases/src/ports/NotificationRepository.ts
packages/use-cases/src/ports/NotificationScheduleRepository.ts
packages/use-cases/src/ports/PubSubService.ts
packages/use-cases/src/ports/RewardRepository.ts
packages/use-cases/src/ports/SponsorRepository.ts
packages/use-cases/src/ports/StoragePort.ts
packages/use-cases/src/ports/TelemetryRepository.ts
packages/use-cases/src/ports/TripRepository.ts
packages/use-cases/src/ports/UserRepository.ts
```

### 4.3 Test Files (93+ files)

All interactors have corresponding `.test.ts` files in:

- `packages/use-cases/src/interactors/*.test.ts`
- `packages/use-cases/src/interactors/__tests__/*.test.ts`

### 4.4 Migration Complexity: HIGH

**Why High:**

- 93 interactor files to convert
- Each uses async/await + Promise<Result<T,E>>
- Must maintain backward compatibility during migration
- Complex orchestration patterns (e.g., PurchaseReward, AuthenticateUser)

---

## 5. Adapters Layer Analysis

### 5.1 Controllers (30 files)

**Files:**

```
packages/adapters/src/controllers/activity-feed.ts
packages/adapters/src/controllers/challenge-submission.ts
packages/adapters/src/controllers/challenge-vote.ts
packages/adapters/src/controllers/challenge.ts
packages/adapters/src/controllers/coin-transaction.ts
packages/adapters/src/controllers/coin.ts
packages/adapters/src/controllers/group.ts
packages/adapters/src/controllers/location.ts
packages/adapters/src/controllers/notification-delivery.ts
packages/adapters/src/controllers/notification-schedule.ts
packages/adapters/src/controllers/notification.ts
packages/adapters/src/controllers/reward.ts
packages/adapters/src/controllers/sponsor.ts
packages/adapters/src/controllers/storage.ts
packages/adapters/src/controllers/submission-report.ts
packages/adapters/src/controllers/trip.ts
packages/adapters/src/controllers/user.ts
packages/adapters/src/controllers/auth/authServer.ts
packages/adapters/src/controllers/auth/index.ts
```

**Test Files:**

```
packages/adapters/src/controllers/__tests__/*.test.ts (19 files)
packages/adapters/src/controllers/auth/__tests__/authServer.test.ts
```

### 5.2 Gateways

**Drizzle Implementations (17):**

```
packages/adapters/src/gateways/drizzle/activity-feed.ts
packages/adapters/src/gateways/drizzle/challenge-submission.ts
packages/adapters/src/gateways/drizzle/challenge-vote.ts
packages/adapters/src/gateways/drizzle/challenge.ts
packages/adapters/src/gateways/drizzle/coin-transaction.ts
packages/adapters/src/gateways/drizzle/group.ts
packages/adapters/src/gateways/drizzle/location.ts
packages/adapters/src/gateways/drizzle/notification-delivery.ts
packages/adapters/src/gateways/drizzle/notification-schedule.ts
packages/adapters/src/gateways/drizzle/notification.ts
packages/adapters/src/gateways/drizzle/reward.ts
packages/adapters/src/gateways/drizzle/sponsor.ts
packages/adapters/src/gateways/drizzle/telemetry.ts
packages/adapters/src/gateways/drizzle/trip.ts
packages/adapters/src/gateways/drizzle/user.ts
packages/adapters/src/gateways/drizzle/index.ts
packages/adapters/src/gateways/drizzle/base.ts
```

**In-Memory Implementations (17):**

```
packages/adapters/src/gateways/in-memory/*.ts
```

### 5.3 Services (12 files)

```
packages/adapters/src/services/*.ts
```

### 5.4 Migration Complexity: MEDIUM

Controllers need to:

1. Use `Effect.runPromise()` to execute Effect-based use cases
2. Convert Effect errors to TRPCError/GraphQLError equivalents
3. Maintain current API contract

---

## 6. Frameworks Layer Analysis

### 6.1 DI Container Files (11)

```
packages/frameworks/src/di/AppModule.ts
packages/frameworks/src/di/container.ts
packages/frameworks/src/di/index.ts
packages/frameworks/src/di/scope.ts
packages/frameworks/src/di/test-container.ts
packages/frameworks/src/di/test-fixtures.ts
packages/frameworks/src/di/types.ts
packages/frameworks/src/di/__tests__/AppModule.test.ts
packages/frameworks/src/di/__tests__/awilix-loads.test.ts
packages/frameworks/src/di/__tests__/container.test.ts
packages/frameworks/src/di/__tests__/test-fixtures.test.ts
packages/frameworks/src/di/__tests__/types.test.ts
```

### 6.2 Auth System

```
packages/frameworks/src/auth/client.ts
packages/frameworks/src/auth/server.ts
packages/frameworks/src/auth/hooks/useLoginForm.ts
packages/frameworks/src/auth/hooks/index.ts
packages/frameworks/src/auth/store/authHooks.ts
packages/frameworks/src/auth/store/__tests__/authHooks.test.ts
packages/frameworks/src/auth/types.ts
packages/frameworks/src/auth/index.ts
```

### 6.3 Migration Complexity: MEDIUM

Changes needed:

1. Update DI container to support Effect-based service resolution
2. Add Effect runtime configuration
3. Update auth hooks to work with Effect

---

## 7. Apps Layer Analysis

### 7.1 Backend Server (Hono + GraphQL)

**Server Files:**

```
apps/backend-server/src/hono-server.ts (428 lines)
apps/backend-server/src/bun-server.ts
apps/backend-server/src/index.ts
apps/backend-server/src/config/hono-config.ts
```

**GraphQL Files:**

```
apps/backend-server/src/graphql/context.ts (171 lines)
apps/backend-server/src/graphql/schema.ts
apps/backend-server/src/graphql/builder.ts
apps/backend-server/src/graphql/yoga-handler.ts
apps/backend-server/src/graphql/index.ts
```

**GraphQL Types (24):**

```
apps/backend-server/src/graphql/types/Query.ts
apps/backend-server/src/graphql/types/User.ts
apps/backend-server/src/graphql/types/group.ts
apps/backend-server/src/graphql/types/trip.ts
apps/backend-server/src/graphql/types/challenge.ts
apps/backend-server/src/graphql/types/challengeVote.ts
apps/backend-server/src/graphql/types/challengeSubmission.ts
apps/backend-server/src/graphql/types/submissionReport.ts
apps/backend-server/src/graphql/types/reward.ts
apps/backend-server/src/graphql/types/sponsor.ts
apps/backend-server/src/graphql/types/coin.ts
apps/backend-server/src/graphql/types/coinTransaction.ts
apps/backend-server/src/graphql/types/location.ts
apps/backend-server/src/graphql/types/storage.ts
apps/backend-server/src/graphql/types/notifications.ts
apps/backend-server/src/graphql/types/notificationSchedule.ts
apps/backend-server/src/graphql/types/notificationDelivery.ts
apps/backend-server/src/graphql/types/notificationSender.ts
apps/backend-server/src/graphql/types/activityFeed.ts
apps/backend-server/src/graphql/types/subscriptions.ts
apps/backend-server/src/graphql/types/coin.ts
```

**GraphQL Resolvers (19):**

```
apps/backend-server/src/graphql/resolvers/*.ts
```

**Utils:**

```
apps/backend-server/src/graphql/utils/error-mapper.ts
apps/backend-server/src/graphql/utils/auth-helpers.ts
```

### 7.2 Web Frontend (Next.js)

```
apps/web/src/hooks/useWebFileUpload.ts
apps/web/test-setup.ts (tRPC imports here)
```

### 7.3 Native App (Expo)

```
apps/native/src/stores/*.ts
apps/native/src/hooks/**/*.ts (multiple hook files)
```

### 7.4 Migration Complexity: HIGH

Resolvers need:

1. Convert to Effect-based execution
2. Error mapping to GraphQL errors
3. Context integration with Effect

---

## 8. Key Integration Points

### 8.1 Package Boundaries

| From       | To         | Integration Type     |
| ---------- | ---------- | -------------------- |
| domain     | use-cases  | Result<T,E>          |
| use-cases  | adapters   | Promise<Result<T,E>> |
| adapters   | frameworks | DI container         |
| frameworks | apps       | DI container         |

### 8.2 Critical Files for Migration

1. **Result Implementation**
   - `packages/domain/src/utils/result.ts` → Replace with Effect
   - `packages/domain/src/types/Result.ts` → Deprecate

2. **Controller Helpers**
   - `packages/adapters/src/utils/controller-helpers.ts` → Update for Effect

3. **Context Factory**
   - `apps/backend-server/src/graphql/context.ts` → Effect integration

4. **DI Module**
   - `packages/frameworks/src/di/AppModule.ts` → Effect-aware registration

5. **Auth Use Case**
   - `packages/use-cases/src/interactors/AuthenticateUser.ts` → Most complex

### 8.3 Port Interfaces (Must Remain Stable)

All 17 port interfaces must continue to work during migration:

- Option 1: Add Effect-based methods alongside async methods
- Option 2: Ports become Effect-first, adapters adapt

---

## 9. Redundant Libraries Post-Migration

### 9.1 Libraries to Remove

| Library                  | Current Use       | Effect Replacement   |
| ------------------------ | ----------------- | -------------------- |
| Custom Result utils      | Error handling    | Effect<R,E,A>        |
| Some promise utilities   | Async composition | Effect.gen           |
| Manual error propagation | Error handling    | Effect error channel |

### 9.2 Libraries to Keep

| Library        | Reason                                |
| -------------- | ------------------------------------- |
| zod            | Schema validation (works with Effect) |
| awilix-modular | DI container (can work with Effect)   |
| hono           | HTTP server (unrelated to Effect)     |
| graphql-yoga   | GraphQL server (unrelated to Effect)  |
| drizzle-orm    | Database ORM (unrelated to Effect)    |

---

## 10. Test Coverage Impact

### 10.1 Test Files by Layer

| Layer      | Test Files | Migration Strategy               |
| ---------- | ---------- | -------------------------------- |
| Domain     | ~36        | Update to Effect test patterns   |
| Use Cases  | ~93        | Update async tests to Effect.gen |
| Adapters   | ~40        | Update controller/gateway tests  |
| Frameworks | ~12        | Update DI container tests        |
| Backend    | ~19        | Update GraphQL resolver tests    |
| Web/Native | ~19        | Update hook tests                |
| **Total**  | **219**    | All need Effect patterns         |

### 10.2 Testing Pattern Changes

**From:**

```typescript
const result = await useCase.execute(input);
expect(result.kind).toBe("ok");
```

**To:**

```typescript
const result = await Effect.runPromise(useCase.execute(input));
expect(result).toBeDefined();
// Or for error cases:
await expect(Effect.runPromise(useCase.execute(input))).rejects.toThrow();
```

---

## 11. Risk Assessment

### 11.1 Risk Matrix

| Component                 | Risk Level | Mitigation                                   |
| ------------------------- | ---------- | -------------------------------------------- |
| Domain layer changes      | HIGH       | Migrate incrementally; maintain dual exports |
| Use case async patterns   | HIGH       | Feature-by-feature migration                 |
| Test file updates         | MEDIUM     | Automate with codemods where possible        |
| Controller result mapping | MEDIUM     | Maintain existing API contracts              |
| GraphQL resolvers         | MEDIUM     | Update error mapping only                    |
| DI container              | LOW        | awilix supports any return type              |
| tRPC removal              | N/A        | Already removed                              |

### 11.2 Critical Path

1. Install Effect dependencies
2. Migrate domain utilities (Result → Effect)
3. Migrate domain entities (batch-by-batch)
4. Migrate use cases (feature-by-feature)
5. Update controllers to execute Effects
6. Update GraphQL resolvers
7. Update tests for all layers

---

## 12. File Count Summary

| Category             | Count    | Files Affected                                   |
| -------------------- | -------- | ------------------------------------------------ |
| Domain entities      | 18       | `packages/domain/src/entities/*.ts`              |
| Value objects        | 19       | `packages/domain/src/value-objects/*.ts`         |
| Use case interactors | 93       | `packages/use-cases/src/interactors/*.ts`        |
| Port interfaces      | 17       | `packages/use-cases/src/ports/*.ts`              |
| Controllers          | 30       | `packages/adapters/src/controllers/*.ts`         |
| Gateways (Drizzle)   | 17       | `packages/adapters/src/gateways/drizzle/*.ts`    |
| Gateways (In-Mem)    | 17       | `packages/adapters/src/gateways/in-memory/*.ts`  |
| Services             | 12       | `packages/adapters/src/services/*.ts`            |
| DI files             | 11       | `packages/frameworks/src/di/*.ts`                |
| GraphQL types        | 24       | `apps/backend-server/src/graphql/types/*.ts`     |
| GraphQL resolvers    | 19       | `apps/backend-server/src/graphql/resolvers/*.ts` |
| Server files         | 5        | `apps/backend-server/src/*.ts`                   |
| Test files           | 219      | `**/*.test.ts`                                   |
| **Total Affected**   | **~501** | **Implementation files**                         |
| **Grand Total**      | **~720** | **Including tests**                              |

---

## 13. Migration Phases Recommended

### Phase 1: Foundation (Week 1)

- Install Effect dependencies
- Create Effect utilities wrapper
- Migrate `packages/domain/src/utils/result.ts`
- Update domain index exports

### Phase 2: Domain Layer (Weeks 2-3)

- Batch migrate 18 entities
- Batch migrate 19 value objects
- Update all domain tests

### Phase 3: Use Cases - Core (Weeks 4-5)

- Migrate authentication use case (complex)
- Migrate CRUD use cases (User, Group, Trip)
- Update corresponding tests

### Phase 4: Use Cases - Features (Weeks 6-8)

- Migrate challenge-related use cases
- Migrate voting use cases
- Migrate reward use cases
- Migrate notification use cases
- Update all tests

### Phase 5: Adapters (Weeks 9-10)

- Update controller-helpers.ts
- Migrate controllers to execute Effects
- Update gateway error handling
- Update service implementations

### Phase 6: Frameworks & Apps (Weeks 11-12)

- Update DI container configuration
- Update GraphQL context
- Update GraphQL resolvers
- Update server files
- Full integration testing

### Phase 7: Cleanup (Week 13)

- Remove custom Result utilities
- Remove deprecated exports
- Update documentation
- Final test sweep

---

## 14. Conclusion

The Effect framework migration is a **significant but manageable** undertaking:

- **No tRPC removal needed** - already eliminated
- **Evolutionary approach works** - Result<T,E> → Effect<R,E,A>
- **~720 files affected** - requires phased approach
- **13-week estimated timeline** - assuming parallel work streams
- **Risk: HIGH** - due to file count, but manageable with good test coverage

The codebase is well-structured for this migration with clear layer boundaries and existing Result-based error handling patterns.
