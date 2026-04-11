# Analysis: Mapper Type Alignment (Phase 4)

**Task:** Fix adapters package mapper type alignment  
**Phase:** 4 of adapters cleanup  
**Scope:** Align mapper function outputs with controller DTO expectations  
**Date:** 2026-04-11  
**Errors Identified:** ~45 TypeScript type mismatches

---

## Executive Summary

This analysis identifies type alignment issues between mapper outputs, use-case DTOs, and controller expectations in the adapters package. The core issue is that controllers define inline return types that don't match the DTO types exported from use cases, leading to ~45 TypeScript errors.

### Key Findings

1. **Primary Issue:** Controllers redefine DTO shapes inline instead of importing from use-cases
2. **Secondary Issues:**
   - Error type mismatches (expecting string, receiving error objects)
   - Enum/string literal incompatibility
   - Missing type exports from use-cases
   - Mapper interface inconsistencies (method naming)

### Risk Level: MEDIUM

- **Impact:** Type safety violations, potential runtime issues
- **Complexity:** Moderate - requires coordination between use-cases and adapters
- **Breaking Changes:** No - fixes are type-only adjustments

---

## Affected Components

### 1. Mapper Layer (17 files)

| File                       | Mapper Class                                     | Domain Entity              | Status                  |
| -------------------------- | ------------------------------------------------ | -------------------------- | ----------------------- |
| `user.ts`                  | UserDrizzleMapper                                | User                       | ✅ Clean                |
| `trip.ts`                  | TripDrizzleMapper                                | Trip                       | ✅ Clean                |
| `group.ts`                 | GroupDrizzleMapper                               | Group                      | ✅ Clean                |
| `challenge.ts`             | ChallengeDrizzleMapper                           | Challenge                  | ✅ Clean                |
| `reward.ts`                | RewardDrizzleMapper, RewardPurchaseDrizzleMapper | Reward, RewardPurchase     | ✅ Clean                |
| `notification.ts`          | NotificationDrizzleMapper                        | Notification               | ✅ Clean                |
| `challenge-submission.ts`  | ChallengeSubmissionDrizzleMapper                 | ChallengeSubmission        | ⚠️ Non-standard methods |
| `coin-transaction.ts`      | CoinTransactionDrizzleMapper                     | CoinTransaction (use-case) | ⚠️ Non-standard methods |
| `location.ts`              | LocationDrizzleMapper                            | Location                   | ✅ Clean                |
| `event.ts`                 | EventDrizzleMapper                               | Event                      | ✅ Clean                |
| `challenge-vote.ts`        | ChallengeVoteDrizzleMapper                       | ChallengeVote              | ✅ Clean                |
| `submission-report.ts`     | SubmissionReportDrizzleMapper                    | SubmissionReport           | ✅ Clean                |
| `notification-schedule.ts` | NotificationScheduleDrizzleMapper                | NotificationSchedule       | ✅ Clean                |
| `notification-delivery.ts` | NotificationDeliveryDrizzleMapper                | NotificationDelivery       | ✅ Clean                |
| `activity-feed.ts`         | ActivityFeedDrizzleMapper                        | ActivityFeed               | ✅ Clean                |
| `sponsor.ts`               | SponsorDrizzleMapper                             | Sponsor                    | ✅ Clean                |
| `user-agent.ts`            | UserAgentDrizzleMapper                           | UserAgent                  | ✅ Clean                |

**Note:** Most mappers correctly implement `DrizzleEntityMapper<TDomain, TDrizzle, TInsert>` interface. Only `challenge-submission.ts` and `coin-transaction.ts` deviate with:

- `toDrizzleCreate` instead of `toDrizzleInsert`
- Extra `fromPartial` method

### 2. Controller Layer (18 files)

#### High Priority (Direct Type Mismatches)

| File                       | Errors | Issue Type                   | Severity |
| -------------------------- | ------ | ---------------------------- | -------- |
| `challenge-submission.ts`  | 3      | DTO mismatch                 | High     |
| `coin-transaction.ts`      | 1      | DTO mismatch                 | High     |
| `notification.ts`          | 8+     | Error type + property access | High     |
| `trip.ts`                  | 5      | Error type + property access | High     |
| `reward.ts`                | 2      | Import + enum mismatch       | Medium   |
| `coin.ts`                  | 2      | Type nullability             | Medium   |
| `notification-schedule.ts` | 2      | Filter type mismatch         | Medium   |

#### Medium Priority (Minor Issues)

| File                | Errors | Issue Type                    |
| ------------------- | ------ | ----------------------------- |
| `challenge-vote.ts` | 1      | Repository interface mismatch |
| `storage.ts`        | 1      | Missing module                |

#### Low Priority (Clean)

- `user.ts`, `challenge.ts`, `group.ts`, `location.ts`, `sponsor.ts`, `activity-feed.ts`

---

## Detailed Type Mismatch Analysis

### Issue 1: Challenge Submission DTO Mismatch

**File:** `packages/adapters/src/controllers/challenge-submission.ts`

**Lines:** 137, 202, 273

**Error:**

```
Type 'GetSubmissionOutput' is not assignable to type '{ id: string; challengeId: string; groupId: string; ... }'
```

**Root Cause:**

Controller defines return type inline:

```typescript
data: {
  id: string;
  challengeId: string;
  groupId: string;
  imageIds: string[];
  // ...
  group: {
    id: string;
    name: string;
    description: string | null;
    image: string | null;
  } | null;
  reviewedBy: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
  } | null;
}
```

But `GetSubmissionOutput` from use-case has:

```typescript
interface GetSubmissionOutput {
  id: SubmissionId; // Branded type, not plain string
  challengeId: string;
  groupId: string;
  // ...
  group: {
    id: string;
    name: string;
    image: string | null;
    coins: number; // Has coins, no description
  } | null;
  reviewedBy: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
  } | null;
}
```

**Differences:**

1. `id` is `SubmissionId` (branded), not `string`
2. `group` has `coins`, not `description`

**Fix:**

1. Update controller to use `GetSubmissionOutput` type directly
2. Or align controller return type with actual use-case output

---

### Issue 2: Coin Transaction Insights Mismatch

**File:** `packages/adapters/src/controllers/coin-transaction.ts`

**Line:** 236

**Error:**

```
Type 'GetCoinAdditionalInsightsOutput | null' is not assignable to type '{ mostActiveAdmin: { name: string; transactionCount: number; } | null; recentTransactions: {...}[]; } | null'
```

**Root Cause:**

Controller return type:

```typescript
data: {
  mostActiveAdmin: { name: string; transactionCount: number; } | null;
  recentTransactions: Array<{
    id: string;
    amount: number;
    reason: string | null;
    createdAt: Date;
    group?: { name: string; } | null;
  }>;
} | null
```

But `GetCoinAdditionalInsightsOutput` has:

```typescript
interface GetCoinAdditionalInsightsOutput {
  mostActiveAdmin: FormattedUser | null; // { name: string; transactionCount: number; }
  recentTransactions: CoinTransaction[]; // Full CoinTransaction, not simplified
}

interface CoinTransaction {
  id: string;
  groupId: string;
  amount: number;
  reason?: string | null;
  adminId: string;
  createdAt: Date;
  group?: { id: string; name: string; coins: number } | null;
  admin?: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
  } | null;
}
```

**Fix:**

1. Import and use `GetCoinAdditionalInsightsOutput` directly
2. Or remove manual mapping and pass through result.value

---

### Issue 3: Error Type Mismatches

**Files:** `notification.ts`, `trip.ts`

**Error Pattern:**

```
Type 'ValidationError' is not assignable to type 'string'
Type 'ValidationError | StateTransitionError' is not assignable to type 'string'
```

**Root Cause:**

Controllers expect:

```typescript
| { success: false; error: string }
```

But domain/use-case returns:

```typescript
Result<T, ValidationError>; // error is an Error object
Result<T, StateTransitionError>; // error is an Error object
```

**Affected Lines:**

- `notification.ts`: 223, 300, 311-319
- `trip.ts`: 185, 264, 281

**Fix:**
Normalize error handling in controllers:

```typescript
if (result.kind === "err") {
  const errorMessage =
    result.error instanceof Error ? result.error.message : String(result.error);
  return { success: false, error: errorMessage };
}
```

---

### Issue 4: Property Access on Domain Entity

**File:** `packages/adapters/src/controllers/notification.ts`

**Lines:** 311-319

**Errors:**

```
Property 'kind' does not exist on type 'Notification'
Property 'error' does not exist on type 'Notification'
Property 'value' does not exist on type 'Notification'
Property 'updateSchedule' does not exist on type 'Notification'
```

**Root Cause:**
Controller is trying to access Result properties (`.kind`, `.error`, `.value`) on a domain `Notification` entity. This suggests the controller is not properly handling the Result type from a use case call.

**Fix:**
Review the controller logic to ensure it's checking Result types before accessing domain entities.

---

### Issue 5: Missing Import

**File:** `packages/adapters/src/controllers/reward.ts`

**Line:** 20

**Error:**

```
Module '@mirai-app/use-cases' has no exported member 'UserRole'
```

**Root Cause:**
`UserRole` is defined in `@mirai-app/domain`, not `@mirai-app/use-cases`.

**Fix:**
Change import:

```typescript
import { UserRole } from "@mirai-app/domain"; // Instead of use-cases
```

---

### Issue 6: Enum Type Incompatibility

**File:** `packages/adapters/src/controllers/reward.ts`

**Line:** 467

**Error:**

```
Type '"CANCELLED" | "IN_DELIVERY"' is not assignable to type 'RewardPurchaseStatus'
```

**Root Cause:**
String literals used instead of enum values when calling use case.

**Fix:**
Import and use `RewardPurchaseStatus` enum from domain.

---

### Issue 7: Nullability Mismatch

**File:** `packages/adapters/src/controllers/coin.ts`

**Lines:** 79, 127

**Error:**

```
Type 'string | null | undefined' is not assignable to type 'string | null'
```

**Root Cause:**
Transaction `reason` field is optional (`string | null | undefined`) but controller return type specifies `string | null`.

**Fix:**
Normalize undefined to null:

```typescript
reason: result.value.transaction.reason ?? null,
```

---

## Integration Points

### Flow: Database → Controller

```
┌─────────────────────────────────────────────────────────────────────┐
│  DRIZZLE SCHEMA                                                      │
│  (packages/frameworks/drizzle)                                       │
│  - Table definitions                                                 │
│  - $inferSelect, $inferInsert types                                  │
└─────────────────────────────────┬───────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│  MAPPER LAYER                                                        │
│  (packages/adapters/src/mappers/drizzle)                            │
│  - Implements DrizzleEntityMapper<TDomain, TDrizzle, TInsert>       │
│  - toDomain(): TDrizzle → TDomain                                   │
│  - toDrizzleInsert(): TDomain → TInsert                             │
│  - toDrizzleUpdate(): TDomain → Partial<TInsert>                    │
└─────────────────────────────────┬───────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│  REPOSITORY LAYER                                                    │
│  (packages/adapters/src/gateways/drizzle)                          │
│  - Extends BaseDrizzleRepository                                    │
│  - Uses mapper.toDomain() for reads                                 │
│  - Returns domain entities                                          │
└─────────────────────────────────┬───────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│  USE CASE LAYER                                                      │
│  (packages/use-cases/src/interactors)                              │
│  - Receives domain entities from repositories                       │
│  - Returns Result<DTO, Error>                                         │
│  - DTO types define output shapes                                   │
└─────────────────────────────────┬───────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│  CONTROLLER LAYER                                                    │
│  (packages/adapters/src/controllers)                                │
│  - Receives Result<DTO, Error> from use cases                       │
│  - SHOULD use DTO types directly                                    │
│  - CURRENTLY redefines types inline (PROBLEM)                       │
└─────────────────────────────────────────────────────────────────────┘
```

### Critical Integration Points

1. **ChallengeSubmissionRepository → GetSubmissionUseCase → ChallengeSubmissionController**
   - Complex nested DTO with optional relations (group, reviewedBy)
   - Branded ID types (SubmissionId vs string)

2. **CoinTransactionRepository → GetCoinAdditionalInsightsUseCase → CoinTransactionController**
   - Optional nested objects in DTO
   - Controller manually remaps instead of passing through

3. **NotificationRepository → NotificationController**
   - Domain entity has state methods (isSent, isScheduled)
   - Error handling needs normalization

---

## Recommended Fix Strategy

### Phase 4a: Export DTO Types (Use-Cases)

Ensure all use-case DTO types are exported from `packages/use-cases/src/index.ts`:

```typescript
// Export DTO types for controllers
export type {
  GetSubmissionOutput,
  GetSubmissionByChallengeAndGroupOutput,
  ListSubmissionsByChallengeOutput,
} from "./interactors/GetSubmission";

export type { GetCoinAdditionalInsightsOutput } from "./interactors/GetCoinAdditionalInsights";

// ... etc for all use cases
```

### Phase 4b: Fix Controller Type Definitions

Update controllers to import and use DTO types:

**Before (problematic):**

```typescript
async getById(input: unknown): Promise<
  | {
      success: true;
      data: { id: string; /* ... 20+ inline fields */ };
    }
  | { success: false; error: string }
> {
  // ...
  return { success: true, data: result.value };  // TYPE ERROR
}
```

**After (fixed):**

```typescript
import type { GetSubmissionOutput } from "@mirai-app/use-cases";

async getById(input: unknown): Promise<
  | { success: true; data: GetSubmissionOutput }
  | { success: false; error: string }
> {
  // ...
  return { success: true, data: result.value };  // OK
}
```

### Phase 4c: Normalize Error Handling

Add error normalization helper or pattern:

```typescript
// Helper function
function normalizeError(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return String(error);
}

// Usage
if (result.kind === "err") {
  return { success: false, error: normalizeError(result.error) };
}
```

### Phase 4d: Fix Import Issues

Update `reward.ts`:

```typescript
// Change from:
import { UserRole } from "@mirai-app/use-cases"; // ❌

// To:
import { UserRole } from "@mirai-app/domain"; // ✅
```

### Phase 4e: Fix Enum Usage

Update `reward.ts` line 467:

```typescript
import { RewardPurchaseStatus } from "@mirai-app/domain";

// Use enum instead of string literals
newStatus: RewardPurchaseStatus.CANCELLED; // ✅
```

---

## Test Strategy

After each fix, run:

```bash
# Check TypeScript compilation
cd packages/adapters && bun tsc --noEmit

# Run unit tests
bun test

# Full type check
bun tsc --noEmit
```

---

## Estimation

| Task                            | Estimated Time | Files         |
| ------------------------------- | -------------- | ------------- |
| Export DTO types from use-cases | 30 min         | ~10 files     |
| Fix challenge-submission.ts     | 20 min         | 1 file        |
| Fix coin-transaction.ts         | 10 min         | 1 file        |
| Fix notification.ts             | 30 min         | 1 file        |
| Fix trip.ts                     | 20 min         | 1 file        |
| Fix reward.ts                   | 15 min         | 1 file        |
| Fix coin.ts                     | 10 min         | 1 file        |
| Fix remaining issues            | 20 min         | 3 files       |
| Testing                         | 15 min         | -             |
| **Total**                       | **~3 hours**   | **~18 files** |

---

## Related Documentation

- **AGENTS.md** - Project conventions and layer decision tree
- **CLAUDE.md** - CEK Five Pillars conventions
- **packages/adapters/src/gateways/base/repository.ts** - DrizzleEntityMapper interface
- **packages/use-cases/src/interactors/** - Use case DTO definitions

---

## Appendix: Full Error List (Adapters Package)

See scratchpad file for complete error listing.

Key error categories:

1. **TS2322:** Type X is not assignable to type Y (DTO mismatches)
2. **TS2345:** Argument of type X is not assignable to parameter of type Y (enum issues)
3. **TS2305:** Module has no exported member X (missing imports)
4. **TS2339:** Property X does not exist on type Y (property access issues)
5. **TS18046:** X is of type unknown (type inference issues)
