# Explicit Return Type Annotations Migration - Codebase Analysis

**Analysis Date:** 2026-04-17  
**Task:** Implement Explicit Return Type Annotations Convention  
**Status:** Analysis Complete

---

## Executive Summary

This analysis identifies all files requiring modification for the migration to inference-first return type annotations. The migration follows the design document at `.specs/plans/explicit-return-types.design.md`.

**Total Files Affected:** 80 files  
**Estimated Effort:** 1-2 days (Setup) + 2-3 days (Pilot) + 2-3 weeks (Gradual Rollout)

---

## 1. File Inventory

### 1.1 Domain Port Interfaces (10 files)

**Location:** `packages/domain/src/*/ports/*.ts`

| File                                  | Domain    | Methods | Current Error Type |
| ------------------------------------- | --------- | ------- | ------------------ |
| `user/ports/UserPort.ts`              | User      | 7       | `DatabaseError`    |
| `group/ports/GroupPort.ts`            | Group     | 7       | `DatabaseError`    |
| `trip/ports/TripPort.ts`              | Trip      | 7       | `DatabaseError`    |
| `challenge/ports/ChallengePort.ts`    | Challenge | 7       | `DatabaseError`    |
| `reward/ports/RewardPort.ts`          | Reward    | 7       | `DatabaseError`    |
| `reward/ports/RewardPurchasePort.ts`  | Reward    | TBD     | `DatabaseError`    |
| `location/ports/LocationPort.ts`      | Location  | TBD     | `DatabaseError`    |
| `activity/ports/ActivityFeedPort.ts`  | Activity  | TBD     | `DatabaseError`    |
| `sponsor/ports/SponsorPort.ts`        | Sponsor   | TBD     | `DatabaseError`    |
| `group/ports/GroupJoinRequestPort.ts` | Group     | TBD     | `DatabaseError`    |

**Modification Required:**

- Change `DatabaseError` to `IPortError` in all method signatures
- Keep explicit return type annotations (interfaces need explicit types)

---

### 1.2 Error Classes (1 file to modify, 10+ classes)

**Location:** `packages/domain/src/shared/errors/domain-errors.ts`

**Existing Error Classes:**

1. `DatabaseError` - Must implement `IPortError`
2. `ApplicationError` - Should implement `IPortError`
3. `ValidationError` - Should implement `IPortError`
4. `InvalidIdError` - Should implement `IPortError`
5. `EntityNotFoundError` - Should implement `IPortError`
6. `EntityAlreadyExistsError` - Should implement `IPortError`
7. `UnauthorizedError` - Should implement `IPortError`
8. `InvalidStateTransitionError` - Should implement `IPortError`
9. `InsufficientResourcesError` - Should implement `IPortError`
10. `TimeConstraintError` - Should implement `IPortError`
11. `DuplicateActionError` - Should implement `IPortError`

**New File to Create:**

- `packages/domain/src/shared/errors/ports.ts` - Contains `IPortError` interface

---

### 1.3 Gateway Implementations (47 files)

**Location:** `packages/adapters/src/*/gateways/**/*.ts`

#### Drizzle Gateways (23 files)

| Domain       | File                                                                         |
| ------------ | ---------------------------------------------------------------------------- |
| User         | `user/gateways/drizzle/UserDrizzleGateway.ts`                                |
| User         | `user/gateways/drizzle/TripParticipantDrizzleGateway.ts`                     |
| Group        | `group/gateways/drizzle/GroupDrizzleGateway.ts`                              |
| Group        | `group/gateways/drizzle/GroupJoinRequestDrizzleGateway.ts`                   |
| Trip         | `trip/gateways/drizzle/TripDrizzleGateway.ts`                                |
| Challenge    | `challenge/gateways/drizzle/ChallengeDrizzleGateway.ts`                      |
| Activity     | `activity-feed/gateways/drizzle/ActivityFeedDrizzleGateway.ts`               |
| Activity     | `activity-feed/gateways/drizzle/ActivityReactionDrizzleGateway.ts`           |
| Reward       | `reward/gateways/drizzle/RewardDrizzleGateway.ts`                            |
| Reward       | `reward/gateways/drizzle/RewardPurchaseDrizzleGateway.ts`                    |
| Location     | `location/gateways/drizzle/LocationDrizzleGateway.ts`                        |
| Location     | `location/gateways/drizzle/LocationSharingRequestDrizzleGateway.ts`          |
| Sponsor      | `sponsor/gateways/drizzle/SponsorDrizzleGateway.ts`                          |
| Sponsor      | `sponsor/gateways/drizzle/TripSponsorDrizzleGateway.ts`                      |
| Challenge    | `challenge-submission/gateways/drizzle/ChallengeSubmissionDrizzleGateway.ts` |
| Challenge    | `challenge-vote/gateways/drizzle/ChallengeVoteDrizzleGateway.ts`             |
| Coin         | `coin/gateways/drizzle/CoinTransactionDrizzleGateway.ts`                     |
| Notification | `notification/gateways/drizzle/NotificationDrizzleGateway.ts`                |
| Notification | `notification/gateways/drizzle/PushSubscriptionDrizzleGateway.ts`            |
| Notification | `notification/gateways/drizzle/NotificationDeliveryDrizzleGateway.ts`        |
| Notification | `notification/gateways/drizzle/NotificationScheduleDrizzleGateway.ts`        |
| Submission   | `submission-report/gateways/drizzle/SubmissionReportDrizzleGateway.ts`       |

#### In-Memory Gateways (19 files)

| Domain       | File                                                                            |
| ------------ | ------------------------------------------------------------------------------- |
| User         | `user/gateways/in-memory/InMemoryUserGateway.ts`                                |
| User         | `user/gateways/in-memory/InMemoryTripParticipantGateway.ts`                     |
| Group        | `group/gateways/in-memory/InMemoryGroupGateway.ts`                              |
| Group        | `group/gateways/in-memory/InMemoryGroupJoinRequestGateway.ts`                   |
| Trip         | `trip/gateways/in-memory/InMemoryTripGateway.ts`                                |
| Challenge    | `challenge/gateways/in-memory/InMemoryChallengeGateway.ts`                      |
| Challenge    | `challenge-submission/gateways/in-memory/InMemoryChallengeSubmissionGateway.ts` |
| Challenge    | `challenge-vote/gateways/in-memory/InMemoryChallengeVoteGateway.ts`             |
| Activity     | `activity-feed/gateways/in-memory/InMemoryActivityFeedGateway.ts`               |
| Reward       | `reward/gateways/in-memory/InMemoryRewardGateway.ts`                            |
| Reward       | `reward/gateways/in-memory/InMemoryRewardPurchaseGateway.ts`                    |
| Location     | `location/gateways/in-memory/InMemoryLocationGateway.ts`                        |
| Location     | `location/gateways/in-memory/InMemoryLocationSharingRequestGateway.ts`          |
| Coin         | `coin/gateways/in-memory/InMemoryCoinTransactionGateway.ts`                     |
| Sponsor      | `sponsor/gateways/in-memory/InMemorySponsorGateway.ts`                          |
| Sponsor      | `sponsor/gateways/in-memory/InMemoryTripSponsorGateway.ts`                      |
| Submission   | `submission-report/gateways/in-memory/InMemorySubmissionReportGateway.ts`       |
| Notification | `notification/gateways/in-memory/InMemoryNotificationGateway.ts`                |
| Notification | `notification/gateways/in-memory/InMemoryPushSubscriptionGateway.ts`            |
| Notification | `notification/gateways/in-memory/InMemoryNotificationDeliveryGateway.ts`        |
| Notification | `notification/gateways/in-memory/InMemoryNotificationScheduleGateway.ts`        |

#### Service Gateways (5 files)

| Service  | File                                                    |
| -------- | ------------------------------------------------------- |
| Storage  | `storage/gateways/supabase/SupabaseStorageGateway.ts`   |
| Storage  | `storage/gateways/supabase/SupabaseStorageAdapter.ts`   |
| Storage  | `storage/gateways/in-memory/InMemoryStorageGateway.ts`  |
| Auth     | `auth/gateways/supabase/SupabaseAuthGateway.ts`         |
| Realtime | `realtime/gateways/supabase/SupabaseRealtimeGateway.ts` |

**Modification Required:**

- Remove explicit return type annotations from all method implementations
- Let TypeScript infer types from interface contracts
- Error unions will form naturally: `DatabaseError | NotFoundError | ValidationError`

---

### 1.4 Use-Cases Port Definitions (22 files)

**Location:** `packages/use-cases/src/*/ports/*.ts`

| Domain       | File                                                    | Has Context.Tag |
| ------------ | ------------------------------------------------------- | --------------- |
| User         | `user/ports/UserPort.ts`                                | Yes             |
| User         | `user/ports/TripParticipantPort.ts`                     | Yes             |
| User         | `user/ports/AuthServicePort.ts`                         | Yes             |
| Group        | `group/ports/GroupPort.ts`                              | Yes             |
| Group        | `group/ports/GroupJoinRequestPort.ts`                   | Yes             |
| Trip         | `trip/ports/TripPort.ts`                                | Yes             |
| Challenge    | `challenge/ports/ChallengePort.ts`                      | Yes             |
| Challenge    | `challenge-submission/ports/ChallengeSubmissionPort.ts` | Yes             |
| Challenge    | `challenge-vote/ports/ChallengeVotePort.ts`             | Yes             |
| Activity     | `activity-feed/ports/ActivityFeedPort.ts`               | Yes             |
| Activity     | `activity-feed/ports/ActivityReactionPort.ts`           | Yes             |
| Reward       | `reward/ports/RewardPort.ts`                            | Yes             |
| Reward       | `reward/ports/RewardPurchasePort.ts`                    | Yes             |
| Location     | `location/ports/LocationPort.ts`                        | Yes             |
| Location     | `location/ports/LocationSharingRequestPort.ts`          | Yes             |
| Sponsor      | `sponsor/ports/SponsorPort.ts`                          | Yes             |
| Sponsor      | `sponsor/ports/TripSponsorPort.ts`                      | Yes             |
| Coin         | `coin/ports/CoinTransactionPort.ts`                     | Yes             |
| Notification | `notification/ports/NotificationPort.ts`                | Yes             |
| Submission   | `submission-report/ports/SubmissionReportPort.ts`       | Yes             |
| Storage      | `storage/ports/StoragePort.ts`                          | Yes             |
| Storage      | `storage/ports/StoragePathResolverPort.ts`              | Yes             |

**Modification Required:**

- Change `DatabaseError` to `IPortError` in interface definitions
- Keep Context.Tag definitions unchanged
- Remove explicit return types from any implementation-like code

---

### 1.5 ESLint Configuration Files (3 files)

| File                                  | Purpose                               |
| ------------------------------------- | ------------------------------------- |
| `eslint.config.base.js`               | Base configuration for all packages   |
| `packages/adapters/eslint.config.js`  | Adapters-specific (currently lenient) |
| `packages/use-cases/eslint.config.js` | Use-cases-specific                    |
| `packages/domain/eslint.config.js`    | Domain-specific                       |

**Modification Required:**

- Add `explicit-function-return-type` rule to base config
- Add override for adapters/use-cases with `allowOverrideWithoutType: true`
- Update adapters config to remove lenient rules and use standard config

---

### 1.6 Test Files (8 files)

| File                                                    | Package    | Test Type |
| ------------------------------------------------------- | ---------- | --------- |
| `trip/mappers/TripInsuranceMapper.test.ts`              | adapters   | Unit      |
| `frameworks/src/graphql/schema.test.ts`                 | frameworks | Unit      |
| `frameworks/src/graphql/builder.test.ts`                | frameworks | Unit      |
| `frameworks/src/graphql/generate-schema.test.ts`        | frameworks | Unit      |
| `frameworks/src/graphql/relay.test.ts`                  | frameworks | Unit      |
| `frameworks/src/storage/__tests__/standard.test.ts`     | frameworks | Unit      |
| `frameworks/src/auth/store/__tests__/authHooks.test.ts` | frameworks | Unit      |

**Note:** Additional gateway tests may need to be created or updated to use `Effect.either` + `Either.isLeft/isRight` patterns.

---

## 2. File Categorization

### By Layer

| Layer         | Files | Primary Change Type                |
| ------------- | ----- | ---------------------------------- |
| Domain        | 11    | Interface error type updates       |
| Use-Cases     | 22    | Interface error type updates       |
| Adapters      | 47    | Remove explicit return annotations |
| Configuration | 3     | ESLint rule updates                |
| Tests         | 8+    | Update to Either patterns          |

### By Change Type

| Change Type                    | Files | Risk Level |
| ------------------------------ | ----- | ---------- |
| Create new file                | 1     | Low        |
| Update interface signatures    | 32    | Medium     |
| Remove annotations (inference) | 47    | Low        |
| Update error classes           | 1     | Low        |
| Update ESLint config           | 3     | Low        |
| Update/create tests            | 8+    | Medium     |

---

## 3. Integration Points

### 3.1 Cross-Package Dependencies

```
packages/domain/src/*/ports/*.ts (IUserPort, IGroupPort, etc.)
    ↓ imported by
packages/use-cases/src/*/ports/*.ts (UserPortTag, GroupPortTag, etc.)
    ↓ imported by
packages/adapters/src/*/gateways/drizzle/*DrizzleGateway.ts
    ↓ implements
packages/use-cases/src/*/ports/*.ts interfaces
```

### 3.2 Risk Areas

| Risk Area                       | Description                                                                 | Mitigation                                                          |
| ------------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| **Interface Contract Breaks**   | Changing `DatabaseError` to `IPortError` affects all implementations        | Update all ports in single commit; TypeScript will catch mismatches |
| **Error Union Expansion**       | Implementations may now return unions like `DatabaseError \| NotFoundError` | Ensure tests check for specific error types using `instanceof`      |
| **ESLint Transition**           | Adapters has lenient config that masks type issues                          | Remove lenient rules gradually; fix errors incrementally            |
| **Gateway Test Coverage**       | Many gateways lack dedicated tests                                          | Create tests using `Effect.either` pattern before migration         |
| **In-Memory vs Drizzle Parity** | In-memory and drizzle gateways must maintain signature parity               | Migrate both implementations of same domain together                |

---

## 4. Domain-by-Domain Effort Estimate

### Phase 1: Setup (1-2 days)

| Task                          | Files    | Effort    |
| ----------------------------- | -------- | --------- |
| Create `IPortError` interface | 1 new    | 30 min    |
| Update error classes          | 1 modify | 1 hour    |
| Update ESLint configs         | 3 modify | 1 hour    |
| Type-check fixes              | -        | 4-8 hours |

### Phase 2: Pilot Domain - User (2-3 days)

| Task                          | Files | Effort  |
| ----------------------------- | ----- | ------- |
| Update `IUserPort` (domain)   | 1     | 30 min  |
| Update `UserPort` (use-cases) | 1     | 30 min  |
| Update `UserDrizzleGateway`   | 1     | 2 hours |
| Update `InMemoryUserGateway`  | 1     | 1 hour  |
| Update related gateways       | 3     | 2 hours |
| Create/update tests           | 2-4   | 4 hours |
| Verification                  | -     | 4 hours |

**Pilot Total:** ~8 files, ~14 hours

### Phase 3: Gradual Rollout (2-3 weeks)

| Domain       | Port Files | Gateway Files | Est. Effort |
| ------------ | ---------- | ------------- | ----------- |
| Group        | 2          | 4             | 1-2 days    |
| Trip         | 1          | 2             | 1 day       |
| Challenge    | 3          | 4             | 1-2 days    |
| Reward       | 2          | 4             | 1-2 days    |
| Location     | 2          | 4             | 1-2 days    |
| Activity     | 2          | 2             | 1 day       |
| Sponsor      | 2          | 4             | 1-2 days    |
| Coin         | 1          | 2             | 1 day       |
| Notification | 1          | 6             | 2-3 days    |
| Submission   | 1          | 2             | 1 day       |
| Storage      | 2          | 3             | 1-2 days    |
| Auth         | 1          | 1             | 0.5 day     |
| Realtime     | 1          | 1             | 0.5 day     |

**Rollout Total:** ~20 port files, ~35 gateway files

---

## 5. Code Pattern Examples

### Current State (Before Migration)

```typescript
// packages/domain/src/user/ports/UserPort.ts
export interface IUserPort {
  findById(id: UserId): Effect.Effect<User | null, DatabaseError, never>;
}

// packages/adapters/src/user/gateways/drizzle/UserDrizzleGateway.ts
export class UserDrizzleGateway implements IUserPort {
  findById(id: UserId): Effect.Effect<User | null, DatabaseError, never> {
    return this.tryPromise(...);
  }
}
```

### Desired State (After Migration)

```typescript
// packages/domain/src/shared/errors/ports.ts
export interface IPortError {
  readonly _tag: string;
  readonly message: string;
}

// packages/domain/src/shared/errors/domain-errors.ts
export class DatabaseError
  extends Data.TaggedError("DatabaseError")<{ cause: unknown }>
  implements IPortError
{
  readonly message = "Database operation failed";
}

// packages/domain/src/user/ports/UserPort.ts
export interface IUserPort {
  findById(id: UserId): Effect.Effect<User | null, IPortError, never>;
}

// packages/adapters/src/user/gateways/drizzle/UserDrizzleGateway.ts
export class UserDrizzleGateway implements IUserPort {
  // Inferred: Effect<User | null, DatabaseError | NotFoundError, never>
  findById(id: UserId) {
    return Effect.gen(function* () {
      const result = yield* Effect.tryPromise({
        try: () => this.db.query.users.findFirst({ where: eq(users.id, id) }),
        catch: (error) => new DatabaseError({ cause: error }),
      });

      if (!result) {
        return yield* Effect.fail(
          new EntityNotFoundError({ entityType: "User", identifier: id }),
        );
      }

      return this.mapper.toDomain(result);
    });
  }
}
```

---

## 6. Testing Pattern Migration

### Current Pattern (to be replaced)

```typescript
// Using try/catch or _tag checking
const result = await Effect.runPromise(Effect.either(effect));
expect(result._tag).toBe("Left");
if (result._tag === "Left") {
  expect(result.left._tag).toBe("DatabaseError");
}
```

### New Pattern (Either with instanceof)

```typescript
import { Effect, Either } from "effect";

it("should return error when user not found", async () => {
  const gateway = new UserDrizzleGateway(db);

  const either = await Effect.runPromise(
    Effect.either(gateway.findById("nonexistent-id")),
  );

  expect(Either.isLeft(either)).toBe(true);
  if (Either.isLeft(either)) {
    expect(either.left).toBeInstanceOf(EntityNotFoundError);
  }
});

it("should return user when found", async () => {
  const gateway = new UserDrizzleGateway(db);

  const either = await Effect.runPromise(
    Effect.either(gateway.findById("valid-id")),
  );

  expect(Either.isRight(either)).toBe(true);
  if (Either.isRight(either)) {
    expect(either.right.id).toBe("valid-id");
  }
});
```

---

## 7. Recommended Migration Order

1. **Setup Phase**
   - Create `IPortError` interface
   - Update error classes
   - Configure ESLint rules

2. **Pilot Phase (User Domain)**
   - Update `IUserPort` interface
   - Update `UserDrizzleGateway` (drizzle)
   - Update `InMemoryUserGateway` (in-memory)
   - Update tests
   - Verify full test suite passes

3. **Rollout Phases (by domain)**
   - Group + GroupJoinRequest
   - Trip
   - Challenge + ChallengeSubmission + ChallengeVote
   - Reward + RewardPurchase
   - Location + LocationSharing
   - ActivityFeed + ActivityReaction
   - Sponsor + TripSponsor
   - Coin
   - Notification + PushSubscription
   - SubmissionReport
   - Storage + Auth + Realtime

---

## 8. Success Criteria Verification

| Criteria                   | How to Verify                                               |
| -------------------------- | ----------------------------------------------------------- |
| `IPortError` created       | File exists at `packages/domain/src/shared/errors/ports.ts` |
| Errors implement interface | `class DatabaseError implements IPortError`                 |
| ESLint config updated      | `allowOverrideWithoutType: true` in adapters/use-cases      |
| Pilot domain migrated      | User domain tests pass with new patterns                    |
| No compilation errors      | `bun tsc --noEmit` passes                                   |
| All tests pass             | `bun test` passes                                           |
| Inference working          | Hover over gateway methods shows proper inferred types      |

---

## 9. Appendices

### Appendix A: Domain Port File Paths

```
packages/domain/src/activity/ports/ActivityFeedPort.ts
packages/domain/src/challenge/ports/ChallengePort.ts
packages/domain/src/group/ports/GroupJoinRequestPort.ts
packages/domain/src/group/ports/GroupPort.ts
packages/domain/src/location/ports/LocationPort.ts
packages/domain/src/reward/ports/RewardPort.ts
packages/domain/src/reward/ports/RewardPurchasePort.ts
packages/domain/src/sponsor/ports/SponsorPort.ts
packages/domain/src/trip/ports/TripPort.ts
packages/domain/src/user/ports/UserPort.ts
```

### Appendix B: Use-Cases Port File Paths

```
packages/use-cases/src/activity-feed/ports/ActivityFeedPort.ts
packages/use-cases/src/activity-feed/ports/ActivityReactionPort.ts
packages/use-cases/src/challenge-submission/ports/ChallengeSubmissionPort.ts
packages/use-cases/src/challenge-vote/ports/ChallengeVotePort.ts
packages/use-cases/src/challenge/ports/ChallengePort.ts
packages/use-cases/src/coin/ports/CoinTransactionPort.ts
packages/use-cases/src/group/ports/GroupJoinRequestPort.ts
packages/use-cases/src/group/ports/GroupPort.ts
packages/use-cases/src/location/ports/LocationPort.ts
packages/use-cases/src/location/ports/LocationSharingRequestPort.ts
packages/use-cases/src/notification/ports/NotificationPort.ts
packages/use-cases/src/reward/ports/RewardPort.ts
packages/use-cases/src/reward/ports/RewardPurchasePort.ts
packages/use-cases/src/sponsor/ports/SponsorPort.ts
packages/use-cases/src/sponsor/ports/TripSponsorPort.ts
packages/use-cases/src/storage/ports/StoragePathResolverPort.ts
packages/use-cases/src/storage/ports/StoragePort.ts
packages/use-cases/src/submission-report/ports/SubmissionReportPort.ts
packages/use-cases/src/trip/ports/TripPort.ts
packages/use-cases/src/user/ports/AuthServicePort.ts
packages/use-cases/src/user/ports/TripParticipantPort.ts
packages/use-cases/src/user/ports/UserPort.ts
```

### Appendix C: Gateway File Paths (All)

See section 1.3 for complete list of 47 gateway files.

---

**Analysis Completed By:** sdd:code-explorer agent  
**Date:** 2026-04-17
