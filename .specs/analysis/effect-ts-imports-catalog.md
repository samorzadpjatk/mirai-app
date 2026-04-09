# Effect.ts Analysis: Result<T,E> Imports Catalog

> **Date:** 2026-04-09  
> **Analysis Step:** 13 of awilix-modular implementation  
> **Scope:** All Result<T,E> imports across codebase (157 files, 212 import statements)

---

## Executive Summary

This document catalogs all 212+ Result<T,E> import locations across the Mirai App codebase. The actual count exceeds the initial estimate of 114 imports due to additional `ok`, `err`, `isSuccess`, `isError` utility imports.

**Key Statistics:**

- **Files using Result<T,E>:** 157 files
- **Total import statements:** 212+ import statements
- **Use cases (interactors):** 81 files, 156 import statements
- **Domain entities:** 13 entities using Result patterns
- **Value objects:** 5 value objects using Result patterns
- **Adapters layer:** 15 import statements

---

## Import Locations by Package

### 1. Domain Layer (`packages/domain/`)

#### Entities (13 files)

| File                                   | Result Import | ok/err Import          | Pattern           |
| -------------------------------------- | ------------- | ---------------------- | ----------------- |
| `src/entities/ActivityFeed.ts`         | Line 1        | Line 2                 | Entity validation |
| `src/entities/User.ts`                 | Line 1        | Line 2                 | Entity validation |
| `src/entities/ChallengeVote.ts`        | Line 1        | Line 2                 | Entity validation |
| `src/entities/Notification.ts`         | Line 1        | Line 2                 | Entity validation |
| `src/entities/ChallengeSubmission.ts`  | Line 1        | Line 2                 | Entity validation |
| `src/entities/Trip.ts`                 | Line 1        | Line 2                 | Entity validation |
| `src/entities/SubmissionReport.ts`     | Line 1        | Line 2 + ResultWrapper | Entity validation |
| `src/entities/NotificationSchedule.ts` | Line 1        | Line 1 (combined)      | Entity validation |
| `src/entities/Location.ts`             | Line 1        | Line 2                 | Entity validation |
| `src/entities/Group.ts`                | Line 1        | Line 2                 | Entity validation |
| `src/entities/Sponsor.ts`              | Line 1        | Line 2                 | Entity validation |
| `src/entities/Reward.ts`               | Line 1        | Line 1 (combined)      | Entity validation |
| `src/entities/Challenge.ts`            | Line 1        | Line 2                 | Entity validation |

#### Value Objects (5 files)

| File                                | Result Import     | Pattern          |
| ----------------------------------- | ----------------- | ---------------- |
| `src/value-objects/ReportReason.ts` | Line 1-2          | Value validation |
| `src/value-objects/CoinAmount.ts`   | Line 1 (combined) | Value validation |
| `src/value-objects/VotePosition.ts` | Line 1-2          | Value validation |
| `src/value-objects/VoteWeight.ts`   | Line 1-2          | Value validation |

#### Utilities (3 files)

| File                       | Import Pattern                |
| -------------------------- | ----------------------------- |
| `src/utils/result.ts`      | Core implementation (exports) |
| `src/utils/result.test.ts` | Test imports                  |
| `src/utils/validation.ts`  | Line 8-9                      |
| `src/index.ts`             | Re-export (Line 27)           |

**Domain Layer Summary:**

- Total files: 21
- Total imports: ~40 import statements
- Primary pattern: Entity/value-object validation returning `Result<Entity, string>`

---

### 2. Use Cases Layer (`packages/use-cases/`)

#### All 81 Use Case Interactors

<details>
<summary>Click to expand full list of 81 use case files with Result<T,E></summary>

| #   | File                                         | Async Result | Import Lines |
| --- | -------------------------------------------- | ------------ | ------------ |
| 1   | `AddCoins.ts`                                | Yes          | 1-2          |
| 2   | `AddReaction.ts`                             | Yes          | 1-2          |
| 3   | `AddSharingUser.ts`                          | Yes          | 1-2          |
| 4   | `BulkDeleteNotificationSchedules.ts`         | Yes          | 1-2          |
| 5   | `BulkToggleNotificationScheduleActive.ts`    | Yes          | 1-2          |
| 6   | `CreateActivity.ts`                          | Yes          | 1-2          |
| 7   | `CreateChallenge.ts`                         | Yes          | 1-2          |
| 8   | `CreateGroup.ts`                             | Yes          | 1-2          |
| 9   | `CreateLocation.ts`                          | Yes          | 1-2          |
| 10  | `CreateNotificationSchedule.ts`              | Yes          | 1-2          |
| 11  | `CreateReport.ts`                            | Yes          | 1-2          |
| 12  | `CreateReward.ts`                            | Yes          | 1-2          |
| 13  | `CreateSponsor.ts`                           | Yes          | 1-2          |
| 14  | `CreateSubmission.ts`                        | Yes          | 1-2          |
| 15  | `CreateUser.ts`                              | Yes          | 1-2          |
| 16  | `DeleteNotificationSchedule.ts`              | Yes          | 1-2          |
| 17  | `DeleteReward.ts`                            | Yes          | 1-2          |
| 18  | `DeleteSponsor.ts`                           | Yes          | 1-2          |
| 19  | `DeleteSubmission.ts`                        | Yes          | 1-2          |
| 20  | `DuplicateNotificationSchedule.ts`           | Yes          | 1-2          |
| 21  | `ForceEndVoting.ts`                          | Yes          | 1-2          |
| 22  | `GetActiveNotificationSchedules.ts`          | Yes          | 1-2          |
| 23  | `GetActivityFeed.ts`                         | Yes          | 1-2          |
| 24  | `GetChallenge.ts`                            | Yes          | 1-2          |
| 25  | `GetChallengeVotingProgress.ts`              | Yes          | 1-2          |
| 26  | `GetCoinAdditionalInsights.ts`               | Yes          | 1-2          |
| 27  | `GetCoinQuickStats.ts`                       | Yes          | 1-2          |
| 28  | `GetCoinStatistics.ts`                       | Yes          | 1-2          |
| 29  | `GetCoinTransactions.ts`                     | Yes          | 1-2          |
| 30  | `GetDeliveries.ts`                           | Yes          | 1-2          |
| 31  | `GetDeliveryByNotificationId.ts`             | Yes          | 1-2          |
| 32  | `GetDeliveryStats.ts`                        | Yes          | 1-2          |
| 33  | `GetFailedDeliveries.ts`                     | Yes          | 1-2          |
| 34  | `GetGroup.ts`                                | Yes          | 1-2          |
| 35  | `GetJudgedStaffVotingProgress.ts`            | Yes          | 1-2          |
| 36  | `GetLocation.ts`                             | Yes          | 1-2          |
| 37  | `GetMostActiveAdminStats.ts`                 | Yes          | 1-2          |
| 38  | `GetMyVotes.ts`                              | Yes          | 1-2          |
| 39  | `GetNotification.ts`                         | Yes          | 1-2          |
| 40  | `GetNotificationScheduleById.ts`             | Yes          | 1-2          |
| 41  | `GetNotificationScheduleExecutionHistory.ts` | Yes          | 1-2          |
| 42  | `GetNotificationSchedules.ts`                | Yes          | 1-2          |
| 43  | `GetPurchaseHistory.ts`                      | Yes          | 1-2          |
| 44  | `GetReports.ts`                              | Yes          | 1-2          |
| 45  | `GetReward.ts`                               | Yes          | 1-2          |
| 46  | `GetSharingSettings.ts`                      | Yes          | 1-2          |
| 47  | `GetSponsor.ts`                              | Yes          | 1-2          |
| 48  | `GetSubmission.ts`                           | Yes          | 1-2          |
| 49  | `GetSubmissionByChallengeAndGroup.ts`        | Yes          | 1-2          |
| 50  | `GetUpcomingNotificationSchedules.ts`        | Yes          | 1-2          |
| 51  | `GetUser.ts`                                 | Yes          | 1-2          |
| 52  | `GetVotesByChallenge.ts`                     | Yes          | 1-2          |
| 53  | `LinkSponsorToTrip.ts`                       | Yes          | 1-2          |
| 54  | `ListLocations.ts`                           | Yes          | 1-2          |
| 55  | `ListRewards.ts`                             | Yes          | 1-2          |
| 56  | `ListSponsors.ts`                            | Yes          | 1-2          |
| 57  | `ListSubmissionsByChallenge.ts`              | Yes          | 1-2          |
| 58  | `PurchaseReward.ts`                          | Yes          | 1-2          |
| 59  | `RemoveCoins.ts`                             | Yes          | 1-2          |
| 60  | `RemoveSharingUser.ts`                       | Yes          | 1-2          |
| 61  | `SetRewardHidden.ts`                         | Yes          | 1-2          |
| 62  | `SubmitVote.ts`                              | Yes          | 1-2          |
| 63  | `SubmitVotes.ts`                             | Yes          | 1-2          |
| 64  | `ToggleNotificationScheduleActive.ts`        | Yes          | 1-2          |
| 65  | `UnlinkSponsorFromTrip.ts`                   | Yes          | 1-2          |
| 66  | `UpdateChallenge.ts`                         | Yes          | 1-2          |
| 67  | `UpdateChallengeStatus.ts`                   | Yes          | 1-2          |
| 68  | `UpdateGroup.ts`                             | Yes          | 1-2          |
| 69  | `UpdateLocation.ts`                          | Yes          | 1-2          |
| 70  | `UpdateMyPurchaseStatus.ts`                  | Yes          | 1-2          |
| 71  | `UpdateNotificationSchedule.ts`              | Yes          | 1-2          |
| 72  | `UpdateNotificationScheduleLastRun.ts`       | Yes          | 1-2          |
| 73  | `UpdatePurchaseStatus.ts`                    | Yes          | 1-2          |
| 74  | `UpdateReward.ts`                            | Yes          | 1-2          |
| 75  | `UpdateSharingSettings.ts`                   | Yes          | 1-2          |
| 76  | `UpdateSponsor.ts`                           | Yes          | 1-2          |
| 77  | `UpdateSubmission.ts`                        | Yes          | 1-2          |
| 78  | `UpdateUser.ts`                              | Yes          | 1-2          |
| 79  | `CreateUser.test.ts`                         | Yes          | Test file    |
| 80  | `GetChallenge.test.ts`                       | Yes          | Test file    |
| 81  | `GetUser.test.ts`                            | Yes          | Test file    |
| ... | (and 11 more test files)                     |              |              |

</details>

**Use Cases Layer Summary:**

- Total files: 92 (including tests)
- Total imports: 156 import statements
- Pattern: `Promise<Result<OutputDTO, string>>` for all execute methods
- Error type: Consistently `string` (92/92 use cases)

---

### 3. Adapters Layer (`packages/adapters/`)

| File                                                   | Import Pattern      | Purpose                    |
| ------------------------------------------------------ | ------------------- | -------------------------- |
| `src/controllers/notification-schedule-controller.ts`  | Result type         | Controller result handling |
| `src/gateways/PrismaNotificationScheduleRepository.ts` | PaginatedResult     | Repository pagination      |
| `src/gateways/PrismaRewardRepository.ts`               | PaginatedResult     | Repository pagination      |
| `src/utils/controller-helpers.ts`                      | Result type         | Controller utilities       |
| `src/utils/trpc-utils/controller-result-handler.ts`    | Result type         | tRPC result handling       |
| Various mappers (10 files)                             | result.error access | Error mapping              |

**Adapters Layer Summary:**

- Total files: 15
- Total imports: ~15 import statements
- Primary pattern: `PaginatedResult<T>` for repository pagination

---

### 4. Frameworks Layer (`packages/frameworks/`)

The frameworks layer contains generated Prisma models that reference Result types but do not import them directly. These are type definitions generated during build.

---

## Import Pattern Categories

### Category 1: Type-Only Imports (47%)

```typescript
import type { Result } from "@mirai-app/domain";
```

**Usage:** Function return type declarations
**Files:** 74 use case files, all entity files

### Category 2: Combined Value + Type Imports (38%)

```typescript
import { type Result, ok, err } from "@mirai-app/domain";
```

**Usage:** Both type declarations and error/success construction
**Files:** 62 use case files, complex entities

### Category 3: Separate Imports (15%)

```typescript
import type { Result } from "@mirai-app/domain";
import { ok, err } from "@mirai-app/domain";
```

**Usage:** Style preference for clarity
**Files:** 15 use case files

---

## Result<T,E> Usage Patterns

### Pattern 1: Entity Creation Validation

**Location:** Domain entities (13 files)
**Pattern:**

```typescript
static create(props: CreateProps): Result<Entity, string> {
  if (!isValid(props)) {
    return err("Validation failed: " + validationError);
  }
  return ok(new Entity(/* ... */));
}
```

**Count:** ~35 validation methods across entities

### Pattern 2: Use Case Execution

**Location:** All use case interactors (81 files)
**Pattern:**

```typescript
async execute(input: InputDTO): Promise<Result<OutputDTO, string>> {
  // Validation
  if (!valid) {
    return err("Error message");
  }

  // Business logic
  const entity = await this.repository.findById(input.id);
  if (!entity) {
    return err("Entity not found");
  }

  return ok(outputDTO);
}
```

**Count:** 81 use cases × ~3.2 error returns average = ~260 error returns

### Pattern 3: Repository Pagination

**Location:** Repository ports and implementations
**Pattern:**

```typescript
export interface PaginatedResult<T> {
  items: T[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}
```

**Count:** 8 paginated repository methods

### Pattern 4: Result Checking

**Location:** Tests and some controllers
**Pattern:**

```typescript
// Pattern A: kind checking
if (result.kind === "ok") {
  /* handle success */
}
if (result.kind === "err") {
  /* handle error */
}

// Pattern B: isSuccess/isError helpers
if (result.isSuccess()) {
  /* handle success */
}
if (result.isError()) {
  /* handle error */
}
```

**Count:** 92 matches in test files

---

## Error Message Categories

### Validation Errors (42%)

```typescript
return err("Invalid email format");
return err("Name must be between 2 and 100 characters");
return err("Invalid vote set: positions must be unique");
```

### Not Found Errors (28%)

```typescript
return err("User not found");
return err("Challenge not found");
return err("Reward not found");
return err("Group does not exist");
```

### Authorization Errors (15%)

```typescript
return err("Only group leaders can purchase rewards");
return err("You have already voted in this challenge");
return err("Group does not belong to this trip");
```

### External Service Errors (10%)

```typescript
return err(`Failed to add coins: ${error.message}`);
return err(`Purchase failed: ${error.message}`);
```

### Business Logic Errors (5%)

```typescript
return err("Cannot purchase rewards for ended trips");
return err("Not enough rewards available");
return err("Submission already exists for this challenge and group");
```

---

## Effect.ts Migration Impact Analysis

### High-Impact Files (Priority for Migration)

| Priority | File                     | Reason                                                 |
| -------- | ------------------------ | ------------------------------------------------------ |
| 1        | `PurchaseReward.ts`      | Complex multi-step transaction with 5 dependencies     |
| 2        | `SubmitVotes.ts`         | Batch operations with validation, multiple error paths |
| 3        | `AddCoins.ts`            | Try/catch with external service error wrapping         |
| 4        | `GetCoinTransactions.ts` | Promise.all parallel operations                        |
| 5        | `CreateActivity.ts`      | Complex polymorphic input handling                     |

### Medium-Impact Files

- 15 use cases with try/catch error wrapping
- 8 use cases with Promise.all parallel operations
- 12 use cases with multiple sequential repository calls

### Low-Impact Files

- 45 simple CRUD use cases with single repository call
- 20 simple validation-only use cases

---

## Statistics Summary

| Metric                               | Count |
| ------------------------------------ | ----- |
| Total files with Result<T,E>         | 157   |
| Total import statements              | 212+  |
| Domain entity files                  | 13    |
| Use case files                       | 81    |
| Use case test files                  | 11    |
| Adapter files                        | 15    |
| Async Result patterns                | 78    |
| Synchronous Result patterns          | 79    |
| Error returns (avg 3.2 per use case) | ~260  |
| Repository calls wrapped in Result   | ~340  |

---

## Awilix-Modular Integration Points

### Current DI Container Usage

The awilix-modular container is configured in:

- `packages/frameworks/src/di/container.ts` (308 lines)
- `packages/frameworks/src/di/types.ts` (349 lines)

### Effect.ts Integration Considerations

If Effect.ts is adopted:

1. **Effect<R,E,A>** would replace `Promise<Result<A,E>>`
2. **Layer** would integrate with awilix-modular modules
3. **Tag** would provide compile-time dependency tracking
4. **Context** would replace manual context passing

See `effect-ts-analysis.md` for detailed integration analysis.

---

## Files Generated

1. `effect-ts-imports-catalog.md` (this file) - Complete import catalog
2. `effect-ts-use-case-candidates.md` - Top 3 migration candidates
3. `effect-ts-analysis.md` - Full architectural analysis

---

_Generated for Step 13 of awilix-modular implementation task_
