# Phase 2 Implementation Plan: Nest Child Entities

**Status:** Planned and Ready for Execution  
**Created:** 2026-04-11  
**Estimated Duration:** 2-3 hours  
**Risk Level:** Low (structural refactoring only, no behavior changes)

---

## Overview

Phase 2 converts 7 standalone entities to nested interfaces within their parent aggregates. These entities have **no independent lifecycle**—they exist only as children of aggregates.

| Entity                          | Current Lines | New Home                                       |
| ------------------------------- | ------------- | ---------------------------------------------- |
| `ChallengeActivity`             | 197           | `ActivityFeed.challengeMetadata` interface     |
| `RankChangeActivity`            | 141           | `ActivityFeed.rankChangeMetadata` interface    |
| `SubmissionActivity`            | 193           | `ActivityFeed.submissionMetadata` interface    |
| `UserPost`                      | 132           | `ActivityFeed.postMetadata` interface          |
| `TripInsuranceStep`             | 271           | `TripInsurance.steps[]` interface              |
| `NotificationPush`              | 150           | `NotificationDelivery.pushes[]` interface      |
| `NotificationScheduleExecution` | 88            | Remove entirely (becomes simple execution log) |

**Net Result:** 1,172 lines deleted, ~150 lines added to parent entities

---

## Pre-Implementation Checklist

- [ ] Phase 1 infrastructure utilities are complete and tested
- [ ] `bun test` passes on current codebase
- [ ] Create feature branch: `git checkout -b refactor/phase2-nest-entities`
- [ ] Review current exports in `packages/domain/src/index.ts`

---

## Implementation Steps

### Task 1: Update ActivityFeed.ts (Activity Metadata Nesting)

**File:** `packages/domain/src/entities/ActivityFeed.ts`
**Estimated Time:** 45 minutes

#### 1.1 Add Nested Metadata Interfaces

Add these 4 interfaces BEFORE the `ActivityFeed` class declaration:

```typescript
/**
 * Challenge metadata for challenge_event activities
 * Replaces ChallengeActivity entity
 */
export interface ChallengeMetadata {
  readonly challengeId: string;
  readonly challengeName: string;
  readonly type: string; // event type (started, ended, voting_started, etc.)
}

/**
 * Rank change metadata for rank_change activities
 * Replaces RankChangeActivity entity
 */
export interface RankChangeMetadata {
  readonly groupId: string;
  readonly newRank: number;
  readonly totalCoins: number;
  readonly coinsGained: number;
}

/**
 * Submission metadata for submission activities
 * Replaces SubmissionActivity entity
 */
export interface SubmissionMetadata {
  readonly submissionId: string;
  readonly challengeId: string;
  readonly groupId: string;
  readonly hasVideo: boolean;
  readonly isWinner: boolean;
  readonly ranking: number | null;
  readonly pointsAwarded: number | null;
}

/**
 * Post metadata for user_post activities
 * Replaces UserPost entity
 */
export interface PostMetadata {
  readonly authorId: string;
  readonly additionalImages: readonly string[];
}
```

#### 1.2 Update ActivityFeed Constructor

Add optional metadata fields to the constructor (after existing fields, before admin/hiddenBy):

```typescript
export class ActivityFeed {
  private constructor(
    public readonly id: ActivityId,
    public readonly tripId: string,
    public readonly activityType: ActivityType,
    public readonly title: string,
    public readonly description: string | null,
    public readonly imageUrl: string | null,
    public readonly isPinned: boolean,
    public readonly isHidden: boolean,
    public readonly hiddenAt: Date | null,
    public readonly hiddenReason: string | null,
    public readonly createdByAdmin: string | null,
    public readonly hiddenByAdmin: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    // NEW: Nested metadata based on activity type (discriminated union pattern)
    public readonly challengeMetadata: ChallengeMetadata | null,
    public readonly rankChangeMetadata: RankChangeMetadata | null,
    public readonly submissionMetadata: SubmissionMetadata | null,
    public readonly postMetadata: PostMetadata | null,
    // Existing related entities (for display purposes)
    public readonly submissionActivity: SubmissionActivityMetadata | null,  // LEGACY - mark deprecated
    public readonly challengeActivity: ChallengeActivityMetadata | null,   // LEGACY - mark deprecated
    public readonly rankChangeActivity: RankChangeActivityMetadata | null, // LEGACY - mark deprecated
    public readonly userPost: UserPostMetadata | null,                    // LEGACY - mark deprecated
    public readonly admin: AdminInfo | null,
    public readonly hiddenBy: AdminInfo | null,
  ) {}
```

#### 1.3 Update ActivityFeed.create() Factory

Add parameters to the create method and update the constructor call:

```typescript
static create(props: {
  id?: ActivityId;
  tripId: string;
  activityType: ActivityType;
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  isPinned?: boolean;
  isHidden?: boolean;
  hiddenAt?: Date | null;
  hiddenReason?: string | null;
  createdByAdmin?: string | null;
  hiddenByAdmin?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
  // NEW metadata parameters
  challengeMetadata?: ChallengeMetadata | null;
  rankChangeMetadata?: RankChangeMetadata | null;
  submissionMetadata?: SubmissionMetadata | null;
  postMetadata?: PostMetadata | null;
  // Legacy parameters (maintain backward compatibility)
  submissionActivity?: SubmissionActivityMetadata | null;
  challengeActivity?: ChallengeActivityMetadata | null;
  rankChangeActivity?: RankChangeActivity | null;
  userPost?: UserPostMetadata | null;
  admin?: AdminInfo | null;
  hiddenBy?: AdminInfo | null;
}): Result<ActivityFeed, string> {
  // Existing validation remains...

  return ok(
    new ActivityFeed(
      props.id ?? (crypto.randomUUID() as ActivityId),
      props.tripId.trim(),
      props.activityType,
      props.title.trim(),
      props.description ?? null,
      props.imageUrl ?? null,
      props.isPinned ?? false,
      props.isHidden ?? false,
      props.hiddenAt ?? null,
      props.hiddenReason ?? null,
      props.createdByAdmin ?? null,
      props.hiddenByAdmin ?? null,
      props.createdAt ?? now,
      props.updatedAt ?? now,
      // NEW: Pass metadata to constructor
      props.challengeMetadata ?? null,
      props.rankChangeMetadata ?? null,
      props.submissionMetadata ?? null,
      props.postMetadata ?? null,
      // Legacy fields
      props.submissionActivity ?? null,
      props.challengeActivity ?? null,
      props.rankChangeActivity ?? null,
      props.userPost ?? null,
      props.admin ?? null,
      props.hiddenBy ?? null,
    ),
  );
}
```

#### 1.4 Add Factory Methods for Specific Activity Types

Add these static factory methods after the main `create()` method:

```typescript
/**
 * Factory method for creating challenge activity
 */
static createChallengeActivity(props: {
  tripId: string;
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  createdByAdmin?: string | null;
  challenge: ChallengeMetadata;
  id?: ActivityId;
  createdAt?: Date;
  updatedAt?: Date;
}): Result<ActivityFeed, string> {
  return ActivityFeed.create({
    id: props.id,
    tripId: props.tripId,
    activityType: "challenge_event",
    title: props.title,
    description: props.description,
    imageUrl: props.imageUrl,
    createdByAdmin: props.createdByAdmin,
    challengeMetadata: props.challenge,
    createdAt: props.createdAt,
    updatedAt: props.updatedAt,
  });
}

/**
 * Factory method for creating rank change activity
 */
static createRankChangeActivity(props: {
  tripId: string;
  title: string;
  description?: string | null;
  rankChange: RankChangeMetadata;
  id?: ActivityId;
  createdAt?: Date;
  updatedAt?: Date;
}): Result<ActivityFeed, string> {
  return ActivityFeed.create({
    id: props.id,
    tripId: props.tripId,
    activityType: "rank_change",
    title: props.title,
    description: props.description,
    rankChangeMetadata: props.rankChange,
    createdAt: props.createdAt,
    updatedAt: props.updatedAt,
  });
}

/**
 * Factory method for creating submission activity
 */
static createSubmissionActivity(props: {
  tripId: string;
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  submission: SubmissionMetadata;
  id?: ActivityId;
  createdAt?: Date;
  updatedAt?: Date;
}): Result<ActivityFeed, string> {
  return ActivityFeed.create({
    id: props.id,
    tripId: props.tripId,
    activityType: "submission",
    title: props.title,
    description: props.description,
    imageUrl: props.imageUrl,
    submissionMetadata: props.submission,
    createdAt: props.createdAt,
    updatedAt: props.updatedAt,
  });
}

/**
 * Factory method for creating user post activity
 */
static createPostActivity(props: {
  tripId: string;
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  post: PostMetadata;
  id?: ActivityId;
  createdAt?: Date;
  updatedAt?: Date;
}): Result<ActivityFeed, string> {
  return ActivityFeed.create({
    id: props.id,
    tripId: props.tripId,
    activityType: "user_post",
    title: props.title,
    description: props.description,
    imageUrl: props.imageUrl,
    postMetadata: props.post,
    createdAt: props.createdAt,
    updatedAt: props.updatedAt,
  });
}
```

#### 1.5 Add Type Guard Methods

Add these instance methods after the factory methods:

```typescript
/**
 * Type guard: Check if this is a challenge activity
 */
isChallengeActivity(): this is { challengeMetadata: ChallengeMetadata } {
  return this.activityType === "challenge_event" && this.challengeMetadata !== null;
}

/**
 * Type guard: Check if this is a rank change activity
 */
isRankChange(): this is { rankChangeMetadata: RankChangeMetadata } {
  return this.activityType === "rank_change" && this.rankChangeMetadata !== null;
}

/**
 * Type guard: Check if this is a submission activity
 */
isSubmission(): this is { submissionMetadata: SubmissionMetadata } {
  return this.activityType === "submission" && this.submissionMetadata !== null;
}

/**
 * Type guard: Check if this is a user post activity
 */
isUserPostActivity(): this is { postMetadata: PostMetadata } {
  return this.activityType === "user_post" && this.postMetadata !== null;
}
```

#### 1.6 Update Immutable Update Methods

Update `pin()`, `unpin()`, `hide()`, `unhide()`, and `updateContent()` methods to include the new metadata fields in constructor calls:

For each method, add these 4 lines after the legacy fields:

```typescript
this.challengeMetadata,
this.rankChangeMetadata,
this.submissionMetadata,
this.postMetadata,
```

---

### Task 2: Delete Activity Feed Child Entities

**Estimated Time:** 15 minutes

#### 2.1 Delete Files

Delete these 4 files (and their `.test.ts` counterparts):

1. `packages/domain/src/entities/ChallengeActivity.ts`
2. `packages/domain/src/entities/RankChangeActivity.ts`
3. `packages/domain/src/entities/SubmissionActivity.ts`
4. `packages/domain/src/entities/UserPost.ts`

#### 2.2 Delete Test Files

1. `packages/domain/src/entities/ChallengeActivity.test.ts`
2. `packages/domain/src/entities/RankChangeActivity.test.ts`
3. `packages/domain/src/entities/SubmissionActivity.test.ts`
4. `packages/domain/src/entities/UserPost.test.ts`

---

### Task 3: Update TripInsurance.ts (Steps Nesting)

**File:** `packages/domain/src/entities/TripInsurance.ts`
**Estimated Time:** 30 minutes

#### 3.1 Add InsuranceStep Interface

Add this interface BEFORE the `TripInsurance` class:

```typescript
/**
 * Insurance step interface - represents a single step in emergency procedure
 * Replaces TripInsuranceStep entity
 */
export interface InsuranceStep {
  readonly stepNumber: number;
  readonly title: string;
  readonly text: string;
  readonly requiredInfo: readonly string[];
  readonly exampleCall: string | null;
  readonly additionalText: string | null;
}
```

#### 3.2 Update TripInsurance Constructor

Add `steps` field to the constructor:

```typescript
export class TripInsurance {
  private constructor(
    public readonly id: string,
    public readonly tripId: string,
    public readonly label: string,
    public readonly phoneNumber: string,
    public readonly phoneDisplay: string,
    public readonly policyNumber: string,
    public readonly contractNumber: string,
    public readonly providerName: string,
    public readonly hospitalName: string | null,
    public readonly hospitalAddress: string | null,
    public readonly hospitalDistance: string | null,
    // NEW: Nested steps
    public readonly steps: readonly InsuranceStep[],
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
```

#### 3.3 Update TripInsurance.create() Factory

Add `steps` parameter and update constructor call:

```typescript
static create(props: {
  id?: string;
  tripId: string;
  label: string;
  phoneNumber: string;
  phoneDisplay: string;
  policyNumber: string;
  contractNumber: string;
  providerName: string;
  hospitalName?: string | null;
  hospitalAddress?: string | null;
  hospitalDistance?: string | null;
  // NEW: Steps parameter
  steps?: InsuranceStep[];
  createdAt?: Date;
  updatedAt?: Date;
}): Result<TripInsurance, string> {
  // Existing validation remains...

  // Validate steps array (max 20 steps)
  const steps = props.steps ?? [];
  if (steps.length > 20) {
    return err("Maximum 20 steps allowed");
  }

  return ok(
    new TripInsurance(
      props.id ?? crypto.randomUUID(),
      props.tripId.trim(),
      props.label.trim(),
      props.phoneNumber.trim(),
      props.phoneDisplay.trim(),
      props.policyNumber.trim(),
      props.contractNumber.trim(),
      props.providerName.trim(),
      props.hospitalName ?? null,
      props.hospitalAddress ?? null,
      props.hospitalDistance ?? null,
      Object.freeze([...steps]), // NEW: Pass steps
      props.createdAt ?? now,
      props.updatedAt ?? now,
    ),
  );
}
```

#### 3.4 Add Step Management Methods

Add these methods after `updateHospitalInfo()`:

```typescript
/**
 * Add a new step to the insurance procedure
 * Returns a new TripInsurance instance (immutable)
 */
addStep(step: Omit<InsuranceStep, "stepNumber">): Result<TripInsurance, string> {
  if (this.steps.length >= 20) {
    return err("Maximum 20 steps allowed");
  }

  const stepNumber = this.steps.length + 1;
  const newStep: InsuranceStep = {
    ...step,
    stepNumber,
  };

  return ok(
    new TripInsurance(
      this.id,
      this.tripId,
      this.label,
      this.phoneNumber,
      this.phoneDisplay,
      this.policyNumber,
      this.contractNumber,
      this.providerName,
      this.hospitalName,
      this.hospitalAddress,
      this.hospitalDistance,
      Object.freeze([...this.steps, newStep]),
      this.createdAt,
      new Date(), // updatedAt
    ),
  );
}

/**
 * Remove a step by step number
 * Returns a new TripInsurance instance with renumbered steps (immutable)
 */
removeStep(stepNumber: number): TripInsurance {
  const newSteps = this.steps
    .filter((s) => s.stepNumber !== stepNumber)
    .map((s, index) => ({ ...s, stepNumber: index + 1 })); // Renumber remaining

  return new TripInsurance(
    this.id,
    this.tripId,
    this.label,
    this.phoneNumber,
    this.phoneDisplay,
    this.policyNumber,
    this.contractNumber,
    this.providerName,
    this.hospitalName,
    this.hospitalAddress,
    this.hospitalDistance,
    Object.freeze(newSteps),
    this.createdAt,
    new Date(), // updatedAt
  );
}

/**
 * Update an existing step
 * Returns a new TripInsurance instance (immutable)
 */
updateStep(
  stepNumber: number,
  updates: Partial<Omit<InsuranceStep, "stepNumber">>,
): Result<TripInsurance, string> {
  const step = this.steps.find((s) => s.stepNumber === stepNumber);
  if (!step) {
    return err(`Step ${stepNumber} not found`);
  }

  // Validate title if provided
  if (updates.title !== undefined) {
    if (updates.title.trim() === "") {
      return err("title is required");
    }
    if (updates.title.length > 200) {
      return err("title must be at most 200 characters");
    }
  }

  // Validate text if provided
  if (updates.text !== undefined) {
    if (updates.text.trim() === "") {
      return err("text is required");
    }
    if (updates.text.length > 2000) {
      return err("text must be at most 2000 characters");
    }
  }

  const newSteps = this.steps.map((s) =>
    s.stepNumber === stepNumber ? { ...s, ...updates } : s,
  );

  return ok(
    new TripInsurance(
      this.id,
      this.tripId,
      this.label,
      this.phoneNumber,
      this.phoneDisplay,
      this.policyNumber,
      this.contractNumber,
      this.providerName,
      this.hospitalName,
      this.hospitalAddress,
      this.hospitalDistance,
      Object.freeze(newSteps),
      this.createdAt,
      new Date(), // updatedAt
    ),
  );
}

/**
 * Get step count
 */
getStepCount(): number {
  return this.steps.length;
}

/**
 * Check if has any steps
 */
hasSteps(): boolean {
  return this.steps.length > 0;
}
```

#### 3.5 Update Existing Methods

Update `updateDetails()` and `updateHospitalInfo()` to pass `this.steps` in the constructor call.

---

### Task 4: Delete TripInsuranceStep Entity

**Estimated Time:** 5 minutes

#### 4.1 Delete Files

Delete:

1. `packages/domain/src/entities/TripInsuranceStep.ts`
2. `packages/domain/src/entities/TripInsuranceStep.test.ts`

---

### Task 5: Update NotificationDelivery.ts (Push Records Nesting)

**File:** `packages/domain/src/entities/NotificationDelivery.ts`
**Estimated Time:** 30 minutes

#### 5.1 Add PushDeliveryRecord Interface

Add this interface BEFORE the `NotificationDelivery` class:

```typescript
/**
 * Push delivery record interface - tracks push notification to individual user
 * Replaces NotificationPush entity
 */
export interface PushDeliveryRecord {
  readonly targetUserId: string;
  readonly status: "SENT" | "FAILED";
  readonly sentAt: Date | null;
  readonly failureReason: string | null;
}
```

#### 5.2 Update NotificationDelivery Constructor

Add `pushes` field to the constructor:

```typescript
export class NotificationDelivery {
  private constructor(
    public readonly id: string,
    public readonly tripId: string | null,
    public readonly notificationId: string,
    public readonly scheduleId: string | null,
    public readonly deliveryStartedAt: Date,
    public readonly deliveryCompletedAt: Date | null,
    public readonly totalRecipients: number,
    public readonly successCount: number,
    public readonly failureCount: number,
    public readonly errors: string | null,
    public readonly status: NotificationDeliveryStatus,
    // NEW: Nested push delivery records
    public readonly pushes: readonly PushDeliveryRecord[],
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
```

#### 5.3 Update NotificationDelivery.create() Factory

Add `pushes` parameter and update constructor call:

```typescript
static create(props: {
  id?: string;
  tripId?: string | null;
  notificationId: string;
  scheduleId?: string | null;
  deliveryStartedAt?: Date;
  deliveryCompletedAt?: Date | null;
  totalRecipients?: number;
  successCount?: number;
  failureCount?: number;
  errors?: string | null;
  status?: NotificationDeliveryStatus;
  // NEW: Pushes parameter
  pushes?: PushDeliveryRecord[];
  createdAt?: Date;
  updatedAt?: Date;
}): Result<NotificationDelivery, string> {
  // Existing validation remains...

  return ok(
    new NotificationDelivery(
      props.id ?? crypto.randomUUID(),
      props.tripId ?? null,
      props.notificationId.trim(),
      props.scheduleId ?? null,
      startedAt,
      props.deliveryCompletedAt ?? null,
      totalRecipients,
      successCount,
      failureCount,
      props.errors ?? null,
      status,
      // NEW: Pass pushes
      Object.freeze(props.pushes ?? []),
      props.createdAt ?? now,
      props.updatedAt ?? now,
    ),
  );
}
```

#### 5.4 Add Push Management Methods

Add these methods after the status check methods:

```typescript
/**
 * Record a push delivery attempt
 * Returns a new NotificationDelivery instance (immutable)
 */
recordPush(
  userId: string,
  success: boolean,
  error?: string,
): NotificationDelivery {
  const record: PushDeliveryRecord = {
    targetUserId: userId,
    status: success ? "SENT" : "FAILED",
    sentAt: success ? new Date() : null,
    failureReason: error ?? null,
  };

  return new NotificationDelivery(
    this.id,
    this.tripId,
    this.notificationId,
    this.scheduleId,
    this.deliveryStartedAt,
    this.deliveryCompletedAt,
    this.totalRecipients,
    this.successCount + (success ? 1 : 0),
    this.failureCount + (success ? 0 : 1),
    this.errors,
    this.status,
    Object.freeze([...this.pushes, record]),
    this.createdAt,
    new Date(), // updatedAt
  );
}

/**
 * Get all failed push deliveries
 */
getFailedPushes(): PushDeliveryRecord[] {
  return this.pushes.filter((p) => p.status === "FAILED");
}

/**
 * Get all successful push deliveries
 */
getSuccessfulPushes(): PushDeliveryRecord[] {
  return this.pushes.filter((p) => p.status === "SENT");
}

/**
 * Check if delivery is complete (all recipients have been processed)
 */
isComplete(): boolean {
  return this.pushes.length >= this.totalRecipients;
}

/**
 * Check if a specific user has been sent a push
 */
isPushSentToUser(userId: string): boolean {
  return this.pushes.some(
    (p) => p.targetUserId === userId && p.status === "SENT",
  );
}

/**
 * Get push record for a specific user
 */
getPushForUser(userId: string): PushDeliveryRecord | undefined {
  return this.pushes.find((p) => p.targetUserId === userId);
}
```

#### 5.5 Update Existing Methods

Update `start()`, `complete()`, `markAsFailed()`, and `updateStats()` to pass `this.pushes` in the constructor call.

---

### Task 6: Delete Notification Push and Schedule Entities

**Estimated Time:** 10 minutes

#### 6.1 Delete Files

Delete:

1. `packages/domain/src/entities/NotificationPush.ts`
2. `packages/domain/src/entities/NotificationPush.test.ts`
3. `packages/domain/src/entities/NotificationScheduleExecution.ts`
4. `packages/domain/src/entities/NotificationScheduleExecution.test.ts`

---

### Task 7: Update Barrel Exports

**File:** `packages/domain/src/index.ts`
**Estimated Time:** 15 minutes

#### 7.1 Remove Deleted Entity Exports

Remove these export lines from the barrel file:

```typescript
// Remove these lines:
export * from "./entities/TripInsuranceStep";
export * from "./entities/SubmissionActivity";
export * from "./entities/ChallengeActivity";
export * from "./entities/RankChangeActivity";
export * from "./entities/UserPost";
export * from "./entities/NotificationScheduleExecution";
export * from "./entities/NotificationPush";
```

#### 7.2 Add New Interface Exports

For each modified entity, export the new interfaces:

```typescript
// ActivityFeed nested interfaces (re-export from ActivityFeed)
export type {
  ChallengeMetadata,
  RankChangeMetadata,
  SubmissionMetadata,
  PostMetadata,
} from "./entities/ActivityFeed";

// TripInsurance nested interface (re-export from TripInsurance)
export type { InsuranceStep } from "./entities/TripInsurance";

// NotificationDelivery nested interface (re-export from NotificationDelivery)
export type { PushDeliveryRecord } from "./entities/NotificationDelivery";
```

#### 7.3 Organize Exports

Reorganize the Activity Feed section in the barrel exports:

```typescript
// Activity Feed Entities (updated - child entities now nested)
export * from "./entities/ActivityReaction";
// Note: ChallengeActivity, RankChangeActivity, SubmissionActivity, UserPost
// are now nested interfaces within ActivityFeed
```

---

### Task 8: Verify and Test

**Estimated Time:** 30 minutes

#### 8.1 Run Tests

```bash
# Run all tests
bun test

# Run domain package tests specifically
cd packages/domain && bun test

# Run with coverage
bun test --coverage
```

#### 8.2 Verify No Breaking Changes

Check that all existing tests pass. The refactoring should not change any behavior—only internal structure.

#### 8.3 Type Checking

```bash
# Type check the domain package
cd packages/domain && bunx tsc --noEmit
```

---

## Migration Checklist

### Before Starting

- [ ] Phase 1 infrastructure utilities complete
- [ ] All tests passing on main branch
- [ ] Feature branch created
- [ ] Design document reviewed

### During Implementation

- [ ] Task 1: ActivityFeed.ts updated with 4 metadata interfaces
- [ ] Task 1: Factory methods added (createChallengeActivity, createRankChangeActivity, createSubmissionActivity, createPostActivity)
- [ ] Task 1: Type guards added (isChallengeActivity, isRankChange, isSubmission, isUserPostActivity)
- [ ] Task 2: 4 activity child entity files deleted
- [ ] Task 3: TripInsurance.ts updated with InsuranceStep interface
- [ ] Task 3: Step management methods added (addStep, removeStep, updateStep)
- [ ] Task 4: TripInsuranceStep entity deleted
- [ ] Task 5: NotificationDelivery.ts updated with PushDeliveryRecord interface
- [ ] Task 5: Push management methods added (recordPush, getFailedPushes, isComplete)
- [ ] Task 6: NotificationPush and NotificationScheduleExecution entities deleted
- [ ] Task 7: Barrel exports updated

### Verification

- [ ] `bun test` passes
- [ ] `bun test --coverage` shows no regression
- [ ] `bunx tsc --noEmit` passes
- [ ] Dependency cruiser shows no new violations
- [ ] No references to deleted entities remain in codebase

### Post-Implementation

- [ ] Commit with message: `refactor(domain): nest child entities in parent aggregates`
- [ ] Create PR with summary of changes
- [ ] Update any documentation referencing old entity patterns

---

## Definition of Done

Phase 2 is complete when:

1. **All 7 child entities are removed:**
   - `ChallengeActivity.ts` → interface in `ActivityFeed`
   - `RankChangeActivity.ts` → interface in `ActivityFeed`
   - `SubmissionActivity.ts` → interface in `ActivityFeed`
   - `UserPost.ts` → interface in `ActivityFeed`
   - `TripInsuranceStep.ts` → interface in `TripInsurance`
   - `NotificationPush.ts` → interface in `NotificationDelivery`
   - `NotificationScheduleExecution.ts` → removed entirely

2. **All parent entities updated:**
   - `ActivityFeed.ts` has 4 nested metadata interfaces + factory methods + type guards
   - `TripInsurance.ts` has `InsuranceStep` interface + step management methods
   - `NotificationDelivery.ts` has `PushDeliveryRecord` interface + push management methods

3. **Tests pass:**
   - `bun test` passes with no failures
   - Coverage does not regress
   - Type checking passes

4. **Exports updated:**
   - Deleted entity exports removed from `index.ts`
   - New interface exports added

5. **Code review complete:**
   - PR reviewed and approved
   - No breaking changes to public API (if applicable)

---

## Interface Definitions Reference

### ActivityFeed Metadata Interfaces

```typescript
interface ChallengeMetadata {
  readonly challengeId: string;
  readonly challengeName: string;
  readonly type: string;
}

interface RankChangeMetadata {
  readonly groupId: string;
  readonly newRank: number;
  readonly totalCoins: number;
  readonly coinsGained: number;
}

interface SubmissionMetadata {
  readonly submissionId: string;
  readonly challengeId: string;
  readonly groupId: string;
  readonly hasVideo: boolean;
  readonly isWinner: boolean;
  readonly ranking: number | null;
  readonly pointsAwarded: number | null;
}

interface PostMetadata {
  readonly authorId: string;
  readonly additionalImages: readonly string[];
}
```

### TripInsurance Step Interface

```typescript
interface InsuranceStep {
  readonly stepNumber: number;
  readonly title: string;
  readonly text: string;
  readonly requiredInfo: readonly string[];
  readonly exampleCall: string | null;
  readonly additionalText: string | null;
}
```

### NotificationDelivery Push Record Interface

```typescript
interface PushDeliveryRecord {
  readonly targetUserId: string;
  readonly status: "SENT" | "FAILED";
  readonly sentAt: Date | null;
  readonly failureReason: string | null;
}
```

---

## Risk Mitigation

| Risk                                    | Likelihood | Impact | Mitigation                                                                                    |
| --------------------------------------- | ---------- | ------ | --------------------------------------------------------------------------------------------- |
| Tests fail after refactoring            | Low        | Medium | Run tests after each file change; this is pure refactoring with no behavior changes           |
| External references to deleted entities | Medium     | High   | Search codebase for imports before deleting; update any references                            |
| Type errors in dependent packages       | Low        | High   | Run `bunx tsc` after changes; fix any type issues                                             |
| Lost validation logic                   | Low        | High   | Review deleted entity validation rules; ensure they migrate to parent or are no longer needed |

---

## Appendix: Files Modified

### Modified (3 files)

1. `packages/domain/src/entities/ActivityFeed.ts`
2. `packages/domain/src/entities/TripInsurance.ts`
3. `packages/domain/src/entities/NotificationDelivery.ts`
4. `packages/domain/src/index.ts`

### Deleted (14 files)

1. `packages/domain/src/entities/ChallengeActivity.ts`
2. `packages/domain/src/entities/ChallengeActivity.test.ts`
3. `packages/domain/src/entities/RankChangeActivity.ts`
4. `packages/domain/src/entities/RankChangeActivity.test.ts`
5. `packages/domain/src/entities/SubmissionActivity.ts`
6. `packages/domain/src/entities/SubmissionActivity.test.ts`
7. `packages/domain/src/entities/UserPost.ts`
8. `packages/domain/src/entities/UserPost.test.ts`
9. `packages/domain/src/entities/TripInsuranceStep.ts`
10. `packages/domain/src/entities/TripInsuranceStep.test.ts`
11. `packages/domain/src/entities/NotificationPush.ts`
12. `packages/domain/src/entities/NotificationPush.test.ts`
13. `packages/domain/src/entities/NotificationScheduleExecution.ts`
14. `packages/domain/src/entities/NotificationScheduleExecution.test.ts`

---

**Last Updated:** 2026-04-11  
**Design Document:** `.specs/plans/simplify-domain-entities.design.md` (Section 5)
