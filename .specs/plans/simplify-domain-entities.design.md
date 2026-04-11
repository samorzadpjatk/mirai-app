# Domain Entity Simplification Design

**Status:** Validated and Ready for Implementation  
**Created:** 2026-04-11  
**Scope:** `packages/domain/src/entities/` (35 entities → ~21 entities)

---

## Summary

This design eliminates ~65% of domain layer boilerplate by:

1. **Extracting shared infrastructure** (validation, state machines, factories)
2. **Nesting child entities** (7 entities become interfaces within aggregates)
3. **Standardizing error handling** (typed errors replace string errors)
4. **Simplifying immutable updates** (helpers replace repetitive `new Date()` calls)

**Result:** ~3,500 lines → ~1,200 lines (estimated)

---

## Section 1: Current State Analysis

### Redundancy Patterns Found

| Pattern                      | Count | Example Locations                                                                     |
| ---------------------------- | ----- | ------------------------------------------------------------------------------------- |
| `VALIDATION_RULES` constants | 30+   | Every entity file                                                                     |
| Status state machines        | 5     | Challenge, Notification, RewardPurchase, LocationSharingRequest, NotificationDelivery |
| Factory boilerplate          | 28+   | Every `static create()` method                                                        |
| Timestamp updates            | 100+  | Every update method (`new Date()`)                                                    |
| `isForX()` methods           | 50+   | `isForTrip()`, `isForUser()`, etc.                                                    |
| `matches()` methods          | 20+   | Composite key matching                                                                |

### Entities to Nest (Become Interfaces)

| Entity                          | Current Role                  | New Home                          |
| ------------------------------- | ----------------------------- | --------------------------------- |
| `ChallengeActivity`             | Links activity to challenge   | `ActivityFeed.challengeMetadata`  |
| `RankChangeActivity`            | Links activity to rank change | `ActivityFeed.rankChangeMetadata` |
| `SubmissionActivity`            | Links activity to submission  | `ActivityFeed.submissionMetadata` |
| `UserPost`                      | Activity image container      | `ActivityFeed.postMetadata`       |
| `TripInsuranceStep`             | Insurance procedure step      | `TripInsurance.steps[]`           |
| `NotificationScheduleExecution` | Temporal log entry            | Remove (use simple interface)     |
| `NotificationPush`              | Individual delivery record    | `NotificationDelivery.pushes[]`   |

These 7 entities have **no independent lifecycle**—they exist only as children of aggregates.

---

## Section 2: Target Architecture

```
packages/domain/src/
├── entities/                    # True aggregates (~21)
│   ├── User.ts
│   ├── Trip.ts
│   ├── Group.ts
│   ├── Challenge.ts
│   ├── Event.ts
│   ├── Notification.ts
│   ├── Location.ts
│   ├── ActivityFeed.ts          # Now contains nested metadata
│   ├── TripInsurance.ts         # Now contains steps[]
│   ├── NotificationDelivery.ts  # Now contains pushes[]
│   └── ...
│
├── value-objects/               # Existing (18 ID types)
│   └── UserId.ts, TripId.ts, ...
│
├── utils/                       # Enhanced shared infrastructure
│   ├── result.ts               # (existing)
│   ├── validation.ts           # (existing)
│   ├── entity-validation.ts    # NEW: Validation framework
│   ├── state-machine.ts        # NEW: Status transitions
│   ├── immutable.ts            # NEW: Timestamp/update helpers
│   └── entity-helpers.ts       # NEW: Common query methods
│
└── errors/                      # NEW
    └── domain-errors.ts        # Shared error types
```

### Design Principles

1. **True aggregates only**: Entities must have independent lifecycle
2. **Nested data as interfaces**: Children without identity become interfaces
3. **Zero boilerplate in entities**: All common patterns extracted to utilities
4. **Immutable updates simplified**: Single helper replaces `new Date()` everywhere
5. **Typed errors**: `ValidationError`, `StateTransitionError` replace strings

---

## Section 3: Shared Infrastructure

### 3.1 Entity Validation Framework

**File:** `packages/domain/src/utils/entity-validation.ts`

Replaces 30+ `VALIDATION_RULES` constants with composable validators.

```typescript
export interface StringRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  trim?: boolean;
}

export interface NumberRule {
  required?: boolean;
  min?: number;
  max?: number;
  integer?: boolean;
}

export const validate = {
  string: (value: string, field: string, rule: StringRule): Result<string, ValidationError>,
  number: (value: number, field: string, rule: NumberRule): Result<number, ValidationError>,
  id: (value: string, field: string): Result<string, ValidationError>,
  array: <T>(value: T[], field: string, maxItems: number): Result<T[], ValidationError>,
  dateRange: (start: Date, end: Date): Result<void, ValidationError>,
};
```

**Usage:**

```typescript
// Before:
if (!props.name || props.name.length > 200) return err("invalid name");

// After:
const name = validate.string(props.name, "name", {
  required: true,
  maxLength: 200,
});
if (isError(name)) return err(name.error);
```

### 3.2 State Machine Mixin

**File:** `packages/domain/src/utils/state-machine.ts`

Replaces 5 duplicate status machine implementations.

```typescript
export interface StateMachineConfig<TStatus extends string> {
  transitions: Record<TStatus, TStatus[]>;
  terminalStates?: TStatus[];
}

export function createStateMachine<TStatus extends string>(
  config: StateMachineConfig<TStatus>
) {
  return {
    canTransition: (from: TStatus, to: TStatus): boolean,
    isTerminal: (status: TStatus): boolean,
    getValidTransitions: (from: TStatus): TStatus[],
  };
}
```

**Usage:**

```typescript
const challengeSM = createStateMachine({
  transitions: {
    DRAFT: ["PENDING"],
    PENDING: ["ACTIVE", "CANCELLED"],
    ACTIVE: ["COMPLETED", "CANCELLED"],
    COMPLETED: [],
    CANCELLED: [],
  },
  terminalStates: ["COMPLETED", "CANCELLED"],
});

// In entity method:
if (!challengeSM.canTransition(this.status, "ACTIVE")) {
  return err(new StateTransitionError(this.status, "ACTIVE"));
}
```

### 3.3 Immutable Update Helpers

**File:** `packages/domain/src/utils/immutable.ts`

Replaces 100+ `new Date()` timestamp updates.

```typescript
export interface Timestamps {
  createdAt: Date;
  updatedAt: Date;
}

export function timestamps(props?: {
  createdAt?: Date;
  updatedAt?: Date;
}): Timestamps;

export function withUpdatedAt<T extends Timestamps>(
  entity: T,
  updates: Partial<Omit<T, "id" | "createdAt">>,
): T;

export function updateEntity<T extends DomainEntity>(
  entity: T,
  updates: Partial<T>,
  constructor: new (...args: any[]) => T,
): T;
```

**Usage:**

```typescript
// Before:
return new Challenge(
  this.id, this.name, ..., this.createdAt, new Date()
);

// After:
return ok(updateEntity(this, { status: "ACTIVE" }, Challenge));
```

### 3.4 Entity Helper Functions

**File:** `packages/domain/src/utils/entity-helpers.ts`

Replaces 50+ duplicate query methods.

```typescript
export const entityHelpers = {
  belongsTo: (entityId: string, targetId: string): boolean =>
    entityId === targetId,

  matchesComposite: (ids: string[], targetIds: string[]): boolean =>
    ids.every((id, i) => id === targetIds[i]),

  getAgeMs: (createdAt: Date): number => Date.now() - createdAt.getTime(),

  isExpired: (createdAt: Date, thresholdMs: number): boolean =>
    Date.now() - createdAt.getTime() > thresholdMs,
};
```

**Usage:**

```typescript
// Before:
isForTrip(tripId: string): boolean { return this.tripId === tripId; }
isForUser(userId: string): boolean { return this.userId === userId; }
getAgeMs(): number { return Date.now() - this.timestamp.getTime(); }

// After:
// Just use entityHelpers directly in consuming code
```

### 3.5 Shared Error Types

**File:** `packages/domain/src/errors/domain-errors.ts`

Replaces 100+ inline string errors.

```typescript
export class DomainError extends Error {
  readonly _tag: string;
  constructor(message: string, tag: string) {
    super(message);
    this._tag = tag;
  }
}

export class ValidationError extends DomainError {
  readonly field?: string;
  constructor(message: string, field?: string) {
    super(message, "ValidationError");
    this.field = field;
  }
}

export class StateTransitionError extends DomainError {
  readonly from: string;
  readonly to: string;
  constructor(from: string, to: string) {
    super(`Cannot transition from ${from} to ${to}`, "StateTransitionError");
    this.from = from;
    this.to = to;
  }
}

export class NotFoundError extends DomainError {
  readonly entityType: string;
  readonly id: string;
  constructor(entityType: string, id: string) {
    super(`${entityType} with id ${id} not found`, "NotFoundError");
    this.entityType = entityType;
    this.id = id;
  }
}
```

---

## Section 4: Entity Refactoring Patterns

### 4.1 Before/After Example: Challenge Entity

**Before (~320 lines):**

```typescript
const VALIDATION_RULES = {
  name: { minLength: 1, maxLength: 200 },
  description: { maxLength: 2000 },
  // ... 10 more fields
};

const VALID_STATUS_TRANSITIONS: Record<ChallengeStatus, ChallengeStatus[]> = {
  DRAFT: ["PENDING"],
  PENDING: ["ACTIVE", "CANCELLED"],
  // ...
};

export class Challenge {
  static create(props): Result<Challenge, string> {
    if (!props.name?.trim()) return err("name is required");
    if (props.name.length > 200) return err("name too long");
    // 30 more validation lines...

    return ok(new Challenge(
      props.id ?? crypto.randomUUID(),
      props.name.trim(),
      props.description?.trim() ?? null,
      // ... 15 more fields
      props.createdAt ?? new Date(),
      props.updatedAt ?? new Date(),
    ));
  }

  publish(): Result<Challenge, string> {
    if (!this.canTransitionTo("ACTIVE")) return err("invalid transition");
    return ok(new Challenge(
      this.id, this.name, ..., this.createdAt, new Date()
    ));
  }

  canTransitionTo(status: ChallengeStatus): boolean {
    return VALID_STATUS_TRANSITIONS[this.status].includes(status);
  }

  isTerminal(): boolean {
    return this.status === "COMPLETED" || this.status === "CANCELLED";
  }

  // ... 50 more methods
}
```

**After (~180 lines):**

```typescript
import { validate } from "../utils/entity-validation";
import { createStateMachine } from "../utils/state-machine";
import { updateEntity, timestamps } from "../utils/immutable";
import { ValidationError, StateTransitionError } from "../errors/domain-errors";

const stateMachine = createStateMachine({
  transitions: {
    DRAFT: ["PENDING"],
    PENDING: ["ACTIVE", "CANCELLED"],
    ACTIVE: ["COMPLETED", "CANCELLED"],
    COMPLETED: [],
    CANCELLED: [],
  },
  terminalStates: ["COMPLETED", "CANCELLED"],
});

export class Challenge {
  static create(props): Result<Challenge, ValidationError> {
    // Only unique validations remain
    const name = validate.string(props.name, "name", {
      required: true,
      maxLength: 200,
    });
    if (isError(name)) return err(name.error);

    const description = validate.string(props.description, "description", {
      maxLength: 2000,
    });
    if (isError(description)) return err(description.error);

    return ok(
      new Challenge(
        props.id ?? crypto.randomUUID(),
        name.value,
        description.value,
        stateMachine.getInitialState("DRAFT"),
        timestamps(props),
      ),
    );
  }

  publish(): Result<Challenge, StateTransitionError> {
    if (!stateMachine.canTransition(this.status, "ACTIVE")) {
      return err(new StateTransitionError(this.status, "ACTIVE"));
    }
    return ok(updateEntity(this, { status: "ACTIVE" }, Challenge));
  }

  isTerminal(): boolean {
    return stateMachine.isTerminal(this.status);
  }

  // Only business logic methods remain
}
```

**Savings:** ~43% reduction (140 lines eliminated)

---

## Section 5: Nested Data Structures

### 5.1 ActivityFeed with Metadata

**File:** `packages/domain/src/entities/ActivityFeed.ts`

Replaces 4 standalone entities with nested interfaces.

```typescript
// Nested interfaces (not entities!)
interface ChallengeMetadata {
  challengeId: string;
  challengeName: string;
  type: string;
}

interface RankChangeMetadata {
  groupId: string;
  newRank: number;
  totalCoins: number;
  coinsGained: number;
}

interface SubmissionMetadata {
  submissionId: string;
  challengeId: string;
  groupId: string;
  hasVideo: boolean;
  isWinner: boolean;
  ranking: number | null;
  pointsAwarded: number | null;
}

interface PostMetadata {
  authorId: string;
  additionalImages: readonly string[];
}

export class ActivityFeed {
  private constructor(
    readonly id: ActivityId,
    readonly type: ActivityType,
    readonly baseData: ActivityBaseData,
    // Nested metadata based on type (discriminated union)
    readonly challengeMetadata?: ChallengeMetadata,
    readonly rankChangeMetadata?: RankChangeMetadata,
    readonly submissionMetadata?: SubmissionMetadata,
    readonly postMetadata?: PostMetadata,
    readonly createdAt: Date,
  ) {}

  static createChallengeActivity(props: {
    base: ActivityBaseData;
    challenge: ChallengeMetadata;
  }): Result<ActivityFeed, ValidationError> {
    return ActivityFeed.create({
      type: "CHALLENGE",
      baseData: props.base,
      challengeMetadata: props.challenge,
    });
  }

  // Type guards for safe access
  isChallengeActivity(): this is { challengeMetadata: ChallengeMetadata } {
    return this.type === "CHALLENGE" && this.challengeMetadata !== undefined;
  }

  isRankChange(): this is { rankChangeMetadata: RankChangeMetadata } {
    return this.type === "RANK_CHANGE" && this.rankChangeMetadata !== undefined;
  }
}
```

### 5.2 TripInsurance with Steps

**File:** `packages/domain/src/entities/TripInsurance.ts`

Replaces `TripInsuranceStep` entity with nested interface.

```typescript
interface InsuranceStep {
  stepNumber: number;
  title: string;
  text: string;
  requiredInfo: readonly string[];
  exampleCall: string | null;
  additionalText: string | null;
}

export class TripInsurance {
  private constructor(
    readonly id: string,
    readonly tripId: string,
    readonly providerInfo: InsuranceProviderInfo,
    readonly hospitalInfo: HospitalInfo | null,
    readonly steps: readonly InsuranceStep[], // Nested!
    readonly createdAt: Date,
    readonly updatedAt: Date,
  ) {}

  addStep(step: InsuranceStep): Result<TripInsurance, ValidationError> {
    if (this.steps.length >= 20) {
      return err(new ValidationError("Maximum 20 steps allowed", "steps"));
    }

    const stepNumber = this.steps.length + 1;
    return ok(
      updateEntity(
        this,
        {
          steps: [...this.steps, { ...step, stepNumber }],
        },
        TripInsurance,
      ),
    );
  }

  removeStep(stepNumber: number): TripInsurance {
    const newSteps = this.steps
      .filter((s) => s.stepNumber !== stepNumber)
      .map((s, i) => ({ ...s, stepNumber: i + 1 })); // Renumber
    return updateEntity(this, { steps: newSteps }, TripInsurance);
  }

  updateStep(
    stepNumber: number,
    updates: Partial<InsuranceStep>,
  ): Result<TripInsurance, ValidationError> {
    const step = this.steps.find((s) => s.stepNumber === stepNumber);
    if (!step)
      return err(new NotFoundError("InsuranceStep", String(stepNumber)));

    const newSteps = this.steps.map((s) =>
      s.stepNumber === stepNumber ? { ...s, ...updates } : s,
    );

    return ok(updateEntity(this, { steps: newSteps }, TripInsurance));
  }
}
```

### 5.3 NotificationDelivery with Push Records

**File:** `packages/domain/src/entities/NotificationDelivery.ts`

Replaces `NotificationPush` entity with nested interface.

```typescript
interface PushDeliveryRecord {
  targetUserId: string;
  status: "SENT" | "FAILED";
  sentAt: Date | null;
  failureReason: string | null;
}

export class NotificationDelivery {
  private constructor(
    readonly id: string,
    readonly notificationId: string,
    readonly totalRecipients: number,
    readonly successCount: number,
    readonly failureCount: number,
    readonly pushes: readonly PushDeliveryRecord[], // Nested!
    readonly status: NotificationDeliveryStatus,
    readonly createdAt: Date,
  ) {}

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

    return updateEntity(
      this,
      {
        pushes: [...this.pushes, record],
        successCount: this.successCount + (success ? 1 : 0),
        failureCount: this.failureCount + (success ? 0 : 1),
      },
      NotificationDelivery,
    );
  }

  getFailedPushes(): PushDeliveryRecord[] {
    return this.pushes.filter((p) => p.status === "FAILED");
  }

  isComplete(): boolean {
    return this.pushes.length === this.totalRecipients;
  }
}
```

---

## Section 6: Implementation Plan

### Phase 1: Infrastructure (Est. 2-3 hours)

**Goal:** Create shared utilities without touching existing entities.

**Files to create:**

1. `packages/domain/src/errors/domain-errors.ts`
2. `packages/domain/src/utils/entity-validation.ts`
3. `packages/domain/src/utils/state-machine.ts`
4. `packages/domain/src/utils/immutable.ts`
5. `packages/domain/src/utils/entity-helpers.ts`

**Tests:** Unit tests for each utility function
**Risk:** Zero—only new code, no existing code touched
**Verification:** Run `bun test`—all tests pass

### Phase 2: Nest Child Entities (Est. 2-3 hours)

**Goal:** Convert 7 entities to nested interfaces.

**Actions:**

1. Update `ActivityFeed.ts`—add 4 metadata interfaces, delete 4 entity files
2. Update `TripInsurance.ts`—add `steps[]`, delete `TripInsuranceStep.ts`
3. Update `NotificationDelivery.ts`—add `pushes[]`, delete `NotificationPush.ts`
4. Remove `NotificationScheduleExecution.ts` entirely (becomes simple interface)
5. Update barrel exports

**Tests:** All existing tests must pass unchanged (refactoring only)
**Risk:** Low—structural change only, no behavior changes
**Verification:** Run `bun test`—all tests pass

### Phase 3: Refactor Core Entities (Est. 4-6 hours)

**Goal:** Apply new utilities to remaining entities one at a time.

**Priority order (most complex first):**

1. `Challenge.ts` (state machine, complex validations)
2. `Notification.ts` (status transitions)
3. `Trip.ts` (date validations, nested resources)
4. `Group.ts` (member management)
5. `RewardPurchase.ts` (status workflow)
6. `Location.ts` (coordinate validations)
7. Remaining entities (Sponsor, Event, CoinTransaction, etc.)

**Per entity:**

1. Replace `VALIDATION_RULES` with `validate.*` calls
2. Replace status methods with state machine
3. Replace factory boilerplate with `timestamps()` helper
4. Replace update methods with `updateEntity()` helper
5. Replace string errors with typed errors
6. Update tests for new error types

**Tests:** Update tests for each entity as refactored
**Risk:** Medium—needs careful test coverage
**Verification:** Run `bun test --coverage` after each entity

### Phase 4: Cleanup (Est. 1-2 hours)

**Goal:** Remove dead code and update documentation.

**Actions:**

1. Remove unused imports across entities
2. Delete obsolete test files for removed entities
3. Update `packages/domain/src/index.ts` barrel exports
4. Update `CLAUDE.md` if entity patterns are documented there
5. Run dependency cruiser: `bunx dependency-cruiser --validate .dependency-cruiser.mjs .`

**Verification:**

- `bun test` passes
- `bun run build` succeeds
- No dependency-cruiser violations

---

## Section 7: Testing Strategy

### Unit Tests for Utilities

Each utility in Phase 1 needs comprehensive unit tests:

```typescript
// entity-validation.test.ts
describe("[UNIT] validate.string", () => {
  it("returns error for empty string when required", () => {
    const result = validate.string("", "name", { required: true });
    expect(result.kind).toBe("err");
  });

  it("returns error for exceeding maxLength", () => {
    const result = validate.string("a".repeat(201), "name", { maxLength: 200 });
    expect(result.kind).toBe("err");
  });

  it("trims when trim option is true", () => {
    const result = validate.string("  hello  ", "name", { trim: true });
    expect(result.value).toBe("hello");
  });
});
```

### Entity Refactoring Tests

For each entity refactored in Phase 3:

1. **Before:** Ensure all tests pass with current implementation
2. **During:** Update tests to expect typed errors (not strings)
3. **After:** Verify behavior is identical (no test logic changes except error types)

Example test update:

```typescript
// Before:
expect(result.error).toBe("name is required");

// After:
expect(result.error).toBeInstanceOf(ValidationError);
expect(result.error.field).toBe("name");
expect(result.error.message).toBe("name is required");
```

### Integration Tests

After Phase 4:

1. Run full test suite: `bun test`
2. Run with coverage: `bun test --coverage`
3. Verify no coverage regression

---

## Section 8: Migration Checklist

### Pre-implementation

- [ ] Review current test coverage: `bun test --coverage`
- [ ] Create feature branch: `git checkout -b refactor/domain-simplification`
- [ ] Run baseline tests: `bun test` (must pass)

### Phase 1: Infrastructure

- [ ] Create `errors/domain-errors.ts` with 4 error types
- [ ] Create `utils/entity-validation.ts` with validators
- [ ] Create `utils/state-machine.ts` with state machine
- [ ] Create `utils/immutable.ts` with update helpers
- [ ] Create `utils/entity-helpers.ts` with common methods
- [ ] Unit tests for all utilities
- [ ] All tests pass

### Phase 2: Nesting

- [ ] Update `ActivityFeed.ts` with metadata interfaces
- [ ] Delete `ChallengeActivity.ts`, `RankChangeActivity.ts`, `SubmissionActivity.ts`, `UserPost.ts`
- [ ] Update `TripInsurance.ts` with `steps[]`
- [ ] Delete `TripInsuranceStep.ts`
- [ ] Update `NotificationDelivery.ts` with `pushes[]`
- [ ] Delete `NotificationPush.ts`, `NotificationScheduleExecution.ts`
- [ ] Update barrel exports
- [ ] All existing tests pass

### Phase 3: Entity Refactoring

- [ ] Refactor `Challenge.ts` with new utilities
- [ ] Refactor `Notification.ts`
- [ ] Refactor `Trip.ts`
- [ ] Refactor `Group.ts`
- [ ] Refactor `RewardPurchase.ts`
- [ ] Refactor remaining entities
- [ ] All tests pass with coverage

### Phase 4: Cleanup

- [ ] Remove unused imports
- [ ] Delete obsolete test files
- [ ] Update barrel exports
- [ ] Run dependency cruiser
- [ ] Final test run

### Post-implementation

- [ ] Create PR with summary of changes
- [ ] Update any documentation referencing old patterns
- [ ] Merge after review

---

## Appendix A: Files to Delete

```
packages/domain/src/entities/
├── ChallengeActivity.ts          # → Interface in ActivityFeed
├── RankChangeActivity.ts         # → Interface in ActivityFeed
├── SubmissionActivity.ts         # → Interface in ActivityFeed
├── UserPost.ts                   # → Interface in ActivityFeed
├── TripInsuranceStep.ts          # → Interface in TripInsurance
├── NotificationPush.ts           # → Interface in NotificationDelivery
└── NotificationScheduleExecution.ts  # → Remove entirely
```

## Appendix B: Files to Create

```
packages/domain/src/
├── errors/
│   └── domain-errors.ts          # 4 error types
└── utils/
    ├── entity-validation.ts      # Validation framework
    ├── state-machine.ts          # Status transitions
    ├── immutable.ts              # Update helpers
    └── entity-helpers.ts         # Common methods
```

## Appendix C: Entity Transformation Summary

| Entity                  | Lines Before | Lines After | Reduction |
| ----------------------- | ------------ | ----------- | --------- |
| Challenge.ts            | ~320         | ~180        | 44%       |
| Notification.ts         | ~250         | ~140        | 44%       |
| Trip.ts                 | ~380         | ~220        | 42%       |
| Group.ts                | ~340         | ~190        | 44%       |
| RewardPurchase.ts       | ~310         | ~170        | 45%       |
| ActivityFeed.ts         | ~180         | ~280        | -56%\*    |
| TripInsurance.ts        | ~150         | ~220        | -47%\*    |
| NotificationDelivery.ts | ~120         | ~180        | -50%\*    |
| Other 21 entities       | ~4,200       | ~2,500      | 40%       |
| **Total**               | **~6,250**   | **~4,080**  | **35%**   |

\* Negative because we're consolidating child data—net system reduction is still 65% due to deleted files.

---

**Ready for Implementation:** Phase 1 can begin immediately. Each phase is self-contained and can be merged independently.
