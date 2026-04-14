# Phase 3: Entity Refactoring Implementation Plan

**Status:** Planned and Ready for Implementation  
**Created:** 2026-04-11  
**Estimated Duration:** 4-6 hours  
**Dependencies:** Phase 1 (infrastructure utilities) and Phase 2 (entity nesting) must be complete

---

## Overview

Phase 3 applies the shared utilities created in Phase 1 to refactor the remaining ~21 domain entities. Each entity transformation follows a consistent pattern that eliminates boilerplate, standardizes error handling, and leverages the new infrastructure.

---

## 1. Priority Order with Rationale

Entities are ordered by **complexity first** to maximize early validation of the utility patterns and catch any issues before simpler entities are touched.

### Tier 1: High Complexity (State Machines + Complex Validations)

| Priority | Entity              | Complexity Factors                                        | Est. Time |
| -------- | ------------------- | --------------------------------------------------------- | --------- |
| 1        | `Challenge.ts`      | State machine (5 states), complex validations, 15+ fields | 45 min    |
| 2        | `Notification.ts`   | Status transitions, multi-step delivery flow              | 30 min    |
| 3        | `Trip.ts`           | Date validations, nested resources (Insurance, Locations) | 40 min    |
| 4        | `Group.ts`          | Member management, role transitions, admin logic          | 35 min    |
| 5        | `RewardPurchase.ts` | Status workflow, inventory validation                     | 30 min    |

### Tier 2: Medium Complexity (Validations + Standard Updates)

| Priority | Entity                      | Complexity Factors                      | Est. Time |
| -------- | --------------------------- | --------------------------------------- | --------- |
| 6        | `Location.ts`               | Coordinate validations, geofence logic  | 25 min    |
| 7        | `LocationSharingRequest.ts` | Status transitions, permission checks   | 20 min    |
| 8        | `NotificationDelivery.ts`   | Push records, delivery tracking         | 25 min    |
| 9        | `ActivityFeed.ts`           | Metadata type guards, union handling    | 20 min    |
| 10       | `TripInsurance.ts`          | Steps array, nested validations         | 20 min    |
| 11       | `CoinTransaction.ts`        | Balance calculations, transaction types | 15 min    |
| 12       | `TripLocation.ts`           | Scheduling, location references         | 15 min    |

### Tier 3: Lower Complexity (Standard CRUD Patterns)

| Priority | Entity                   | Complexity Factors              | Est. Time |
| -------- | ------------------------ | ------------------------------- | --------- |
| 13       | `User.ts`                | Profile fields, preferences     | 15 min    |
| 14       | `Sponsor.ts`             | Link handling, asset management | 15 min    |
| 15       | `Event.ts`               | Date ranges, attendee tracking  | 15 min    |
| 16       | `Ticket.ts`              | Status, QR code handling        | 15 min    |
| 17       | `TicketOption.ts`        | Pricing, inventory              | 10 min    |
| 18       | `TripTimelineItem.ts`    | Timeline ordering               | 10 min    |
| 19       | `TripMember.ts`          | Role management                 | 10 min    |
| 20       | `ChallengeSubmission.ts` | Media handling                  | 15 min    |
| 21       | `LeaderboardEntry.ts`    | Score tracking                  | 10 min    |

### Rationale for Priority Order

1. **Challenge first:** Has the most complex state machine (5 states) and longest validation rules. If the patterns work here, they'll work everywhere.
2. **Notification second:** Tests status transition pattern without the complexity of Challenge.
3. **Trip third:** Tests date validation utilities and nested resource handling.
4. **Group fourth:** Tests member management patterns that may influence other entities.
5. **RewardPurchase fifth:** Tests inventory/availability validation patterns.
6. **Location sixth:** Geolocation is isolated; any issues won't block other entities.
7. **Remaining entities:** Follow standard patterns; can be done in batches if needed.

---

## 2. Per-Entity Transformation Checklist

Use this checklist for each entity refactor:

### Pre-Refactor

- [ ] Run current tests for entity → confirm all pass
- [ ] Create test coverage snapshot → ensure no regression
- [ ] Read entity file → identify all `VALIDATION_RULES`, status methods, update patterns

### Import Updates

- [ ] Add imports for new utilities:
  ```typescript
  import { validate } from "../utils/entity-validation";
  import { createStateMachine } from "../utils/state-machine";
  import { updateEntity, timestamps } from "../utils/immutable";
  import {
    ValidationError,
    StateTransitionError,
  } from "../errors/domain-errors";
  import { isError } from "../utils/result";
  ```

### Validation Rules Transformation

- [ ] **DELETE** the `VALIDATION_RULES` constant
- [ ] **DELETE** any validation helper functions that become obsolete
- [ ] For each validation rule, convert to `validate.*` call:
  - String fields → `validate.string(value, field, { required, maxLength, minLength, trim })`
  - Number fields → `validate.number(value, field, { required, min, max, integer })`
  - ID fields → `validate.id(value, field)`
  - Arrays → `validate.array(value, field, maxItems)`
  - Date ranges → `validate.dateRange(start, end)`
- [ ] Chain validations with early returns:
  ```typescript
  const name = validate.string(props.name, "name", {
    required: true,
    maxLength: 200,
  });
  if (isError(name)) return err(name.error);
  ```

### State Machine Transformation

- [ ] **DELETE** `VALID_STATUS_TRANSITIONS` constant
- [ ] **DELETE** `canTransitionTo()` method (if exists)
- [ ] **DELETE** `isTerminal()` logic (if inline)
- [ ] Create state machine at module level:
  ```typescript
  const stateMachine = createStateMachine({
    transitions: {
      STATE1: ["STATE2", "STATE3"],
      STATE2: ["STATE3"],
      // ...
    },
    terminalStates: ["TERMINAL_STATE1", "TERMINAL_STATE2"],
  });
  ```
- [ ] Update transition methods to use state machine:
  ```typescript
  transitionTo(newStatus: Status): Result<Entity, StateTransitionError> {
    if (!stateMachine.canTransition(this.status, newStatus)) {
      return err(new StateTransitionError(this.status, newStatus));
    }
    return ok(updateEntity(this, { status: newStatus }, EntityName));
  }
  ```
- [ ] Replace `isTerminal()` with `stateMachine.isTerminal(this.status)`

### Factory Method Transformation

- [ ] **DELETE** manual timestamp handling in `static create()`
- [ ] Replace with `timestamps(props)` helper
- [ ] Simplify constructor call to use validated values directly:
  ```typescript
  static create(props: EntityProps): Result<Entity, ValidationError> {
    // Validate fields...

    return ok(
      new Entity(
        props.id ?? crypto.randomUUID(),
        validatedName.value,
        validatedDescription.value,
        stateMachine.getInitialState("INITIAL_STATE"), // if applicable
        timestamps(props),
      )
    );
  }
  ```

### Update Method Transformation

- [ ] **DELETE** all `new Date()` calls in update methods
- [ ] **DELETE** manual `updatedAt` passing
- [ ] Replace update method bodies with `updateEntity()`:
  ```typescript
  updateName(newName: string): Result<Entity, ValidationError> {
    const validated = validate.string(newName, "name", { required: true, maxLength: 200 });
    if (isError(validated)) return err(validated.error);

    return ok(updateEntity(this, { name: validated.value }, EntityName));
  }
  ```

### Error Type Transformation

- [ ] Change function signatures from:
  ```typescript
  Result<Entity, string>;
  ```
  To:
  ```typescript
  Result<Entity, DomainError>; // or specific: ValidationError | StateTransitionError
  ```
- [ ] Replace all `err("string message")` with:
  ```typescript
  err(new ValidationError("message", "fieldName"));
  err(new StateTransitionError(fromStatus, toStatus));
  err(new NotFoundError("EntityName", id));
  ```

### Helper Method Cleanup

- [ ] **DELETE** `isForX()` methods → use `entityHelpers.belongsTo()` in consuming code
- [ ] **DELETE** `matches()` methods → use `entityHelpers.matchesComposite()` in consuming code
- [ ] **DELETE** `getAgeMs()` methods → use `entityHelpers.getAgeMs(entity.createdAt)` in consuming code
- [ ] **DELETE** `isExpired()` methods → use `entityHelpers.isExpired(entity.createdAt, thresholdMs)` in consuming code

### Post-Refactor

- [ ] Run entity tests → verify all pass
- [ ] Check test coverage → ensure no regression
- [ ] Review line count → confirm reduction matches targets
- [ ] Run full test suite → ensure no regressions elsewhere

---

## 3. Example Transformation: Challenge.ts

### Before (~320 lines)

```typescript
// packages/domain/src/entities/Challenge.ts

const VALIDATION_RULES = {
  name: { minLength: 1, maxLength: 200 },
  description: { maxLength: 2000 },
  points: { min: 0, max: 10000 },
  durationDays: { min: 1, max: 365 },
  maxParticipants: { min: 1, max: 1000 },
  // ... 10 more fields
};

const VALID_STATUS_TRANSITIONS: Record<ChallengeStatus, ChallengeStatus[]> = {
  DRAFT: ["PENDING"],
  PENDING: ["ACTIVE", "CANCELLED"],
  ACTIVE: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

const TERMINAL_STATUSES: ChallengeStatus[] = ["COMPLETED", "CANCELLED"];

export class Challenge {
  private constructor(
    readonly id: string,
    readonly name: string,
    readonly description: string | null,
    readonly points: number,
    readonly durationDays: number,
    readonly maxParticipants: number,
    readonly status: ChallengeStatus,
    readonly groupId: string,
    readonly createdBy: string,
    readonly createdAt: Date,
    readonly updatedAt: Date,
  ) {}

  static create(props: ChallengeProps): Result<Challenge, string> {
    // Validation boilerplate (~40 lines)
    if (!props.name?.trim()) return err("name is required");
    if (props.name.length > 200) return err("name too long");
    if (props.description && props.description.length > 2000) {
      return err("description too long");
    }
    if (props.points < 0 || props.points > 10000) return err("invalid points");
    if (props.durationDays < 1 || props.durationDays > 365) {
      return err("invalid duration");
    }
    if (props.maxParticipants < 1 || props.maxParticipants > 1000) {
      return err("invalid max participants");
    }
    // ... more validations

    return ok(
      new Challenge(
        props.id ?? crypto.randomUUID(),
        props.name.trim(),
        props.description?.trim() ?? null,
        props.points,
        props.durationDays,
        props.maxParticipants,
        "DRAFT",
        props.groupId,
        props.createdBy,
        props.createdAt ?? new Date(),
        props.updatedAt ?? new Date(),
      ),
    );
  }

  publish(): Result<Challenge, string> {
    if (!this.canTransitionTo("ACTIVE")) return err("invalid transition");
    if (this.status !== "PENDING") return err("must be pending to publish");

    return ok(
      new Challenge(
        this.id,
        this.name,
        this.description,
        this.points,
        this.durationDays,
        this.maxParticipants,
        "ACTIVE",
        this.groupId,
        this.createdBy,
        this.createdAt,
        new Date(),
      ),
    );
  }

  cancel(): Result<Challenge, string> {
    if (!this.canTransitionTo("CANCELLED")) return err("cannot cancel");

    return ok(
      new Challenge(
        this.id,
        this.name,
        this.description,
        this.points,
        this.durationDays,
        this.maxParticipants,
        "CANCELLED",
        this.groupId,
        this.createdBy,
        this.createdAt,
        new Date(),
      ),
    );
  }

  complete(): Result<Challenge, string> {
    if (this.status !== "ACTIVE") return err("must be active to complete");

    return ok(
      new Challenge(
        this.id,
        this.name,
        this.description,
        this.points,
        this.durationDays,
        this.maxParticipants,
        "COMPLETED",
        this.groupId,
        this.createdBy,
        this.createdAt,
        new Date(),
      ),
    );
  }

  canTransitionTo(status: ChallengeStatus): boolean {
    return VALID_STATUS_TRANSITIONS[this.status].includes(status);
  }

  isTerminal(): boolean {
    return TERMINAL_STATUSES.includes(this.status);
  }

  isForGroup(groupId: string): boolean {
    return this.groupId === groupId;
  }

  isCreatedBy(userId: string): boolean {
    return this.createdBy === userId;
  }

  updateDescription(description: string): Result<Challenge, string> {
    if (description.length > 2000) return err("description too long");

    return ok(
      new Challenge(
        this.id,
        this.name,
        description.trim(),
        this.points,
        this.durationDays,
        this.maxParticipants,
        this.status,
        this.groupId,
        this.createdBy,
        this.createdAt,
        new Date(),
      ),
    );
  }
}
```

### After (~180 lines)

```typescript
// packages/domain/src/entities/Challenge.ts

import { validate } from "../utils/entity-validation";
import { createStateMachine } from "../utils/state-machine";
import { updateEntity, timestamps } from "../utils/immutable";
import { ValidationError, StateTransitionError } from "../errors/domain-errors";
import { isError, ok, err } from "../utils/result";
import type { Result } from "../utils/result";

const stateMachine = createStateMachine<ChallengeStatus>({
  transitions: {
    DRAFT: ["PENDING"],
    PENDING: ["ACTIVE", "CANCELLED"],
    ACTIVE: ["COMPLETED", "CANCELLED"],
    COMPLETED: [],
    CANCELLED: [],
  },
  terminalStates: ["COMPLETED", "CANCELLED"],
});

export interface ChallengeProps {
  id?: string;
  name: string;
  description?: string;
  points: number;
  durationDays: number;
  maxParticipants: number;
  groupId: string;
  createdBy: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Challenge {
  private constructor(
    readonly id: string,
    readonly name: string,
    readonly description: string | null,
    readonly points: number,
    readonly durationDays: number,
    readonly maxParticipants: number,
    readonly status: ChallengeStatus,
    readonly groupId: string,
    readonly createdBy: string,
    readonly createdAt: Date,
    readonly updatedAt: Date,
  ) {}

  static create(props: ChallengeProps): Result<Challenge, ValidationError> {
    // Validate name
    const name = validate.string(props.name, "name", {
      required: true,
      maxLength: 200,
      trim: true,
    });
    if (isError(name)) return err(name.error);

    // Validate description (optional)
    const description = validate.string(props.description, "description", {
      maxLength: 2000,
      trim: true,
    });
    if (isError(description)) return err(description.error);

    // Validate numeric fields
    const points = validate.number(props.points, "points", {
      required: true,
      min: 0,
      max: 10000,
    });
    if (isError(points)) return err(points.error);

    const durationDays = validate.number(props.durationDays, "durationDays", {
      required: true,
      min: 1,
      max: 365,
      integer: true,
    });
    if (isError(durationDays)) return err(durationDays.error);

    const maxParticipants = validate.number(
      props.maxParticipants,
      "maxParticipants",
      {
        required: true,
        min: 1,
        max: 1000,
        integer: true,
      },
    );
    if (isError(maxParticipants)) return err(maxParticipants.error);

    // Validate IDs
    const groupId = validate.id(props.groupId, "groupId");
    if (isError(groupId)) return err(groupId.error);

    const createdBy = validate.id(props.createdBy, "createdBy");
    if (isError(createdBy)) return err(createdBy.error);

    return ok(
      new Challenge(
        props.id ?? crypto.randomUUID(),
        name.value,
        description.value,
        points.value,
        durationDays.value,
        maxParticipants.value,
        "DRAFT",
        groupId.value,
        createdBy.value,
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

  cancel(): Result<Challenge, StateTransitionError> {
    if (!stateMachine.canTransition(this.status, "CANCELLED")) {
      return err(new StateTransitionError(this.status, "CANCELLED"));
    }
    return ok(updateEntity(this, { status: "CANCELLED" }, Challenge));
  }

  complete(): Result<Challenge, StateTransitionError> {
    if (!stateMachine.canTransition(this.status, "COMPLETED")) {
      return err(new StateTransitionError(this.status, "COMPLETED"));
    }
    return ok(updateEntity(this, { status: "COMPLETED" }, Challenge));
  }

  isTerminal(): boolean {
    return stateMachine.isTerminal(this.status);
  }

  updateDescription(description: string): Result<Challenge, ValidationError> {
    const validated = validate.string(description, "description", {
      maxLength: 2000,
      trim: true,
    });
    if (isError(validated)) return err(validated.error);

    return ok(updateEntity(this, { description: validated.value }, Challenge));
  }
}
```

### Transformation Summary for Challenge.ts

| Aspect             | Before                                          | After                                                |
| ------------------ | ----------------------------------------------- | ---------------------------------------------------- |
| Constants          | 3 (VALIDATION_RULES, transitions, terminal)     | 1 (stateMachine only)                                |
| Validation lines   | ~40 inline checks                               | 6 `validate.*` calls                                 |
| Status methods     | 3 (canTransitionTo, isTerminal + inline checks) | 1 (isTerminal using stateMachine)                    |
| Timestamp handling | Manual in create + every update                 | `timestamps()` + `updateEntity()`                    |
| Update methods     | 3 methods × 12 field copies = ~36 lines         | 3 methods × 1 updateEntity = ~12 lines               |
| Error types        | `Result<T, string>`                             | `Result<T, ValidationError \| StateTransitionError>` |
| Helper methods     | isForGroup, isCreatedBy                         | Deleted (use entityHelpers in consuming code)        |
| **Total lines**    | **~320**                                        | **~180**                                             |
| **Reduction**      |                                                 | **~43%**                                             |

---

## 4. Test Update Guidelines

### Test File Structure

Each entity's test file follows this structure after Phase 3:

```typescript
// Challenge.test.ts
import { describe, it, expect } from "bun:test";
import { Challenge } from "./Challenge";
import { ValidationError, StateTransitionError } from "../errors/domain-errors";

describe("[UNIT] Challenge", () => {
  // === Creation Tests ===
  describe("create", () => {
    it("creates valid challenge", () => {
      // Test passes
    });

    it("returns ValidationError for missing name", () => {
      const result = Challenge.create({
        name: "",
        points: 100,
        // ...
      });

      expect(result.kind).toBe("err");
      expect(result.error).toBeInstanceOf(ValidationError);
      expect(result.error.field).toBe("name");
    });

    // More validation tests...
  });

  // === State Transition Tests ===
  describe("state machine", () => {
    it("transitions from DRAFT to PENDING", () => {
      const challenge = Challenge.create(/* ... */)._unsafeUnwrap();
      const result = challenge.publish(); // or appropriate transition
      expect(result.kind).toBe("ok");
    });

    it("returns StateTransitionError for invalid transition", () => {
      const challenge = Challenge.create({
        /* ... */
      })._unsafeUnwrap();
      const cancelled = challenge.cancel()._unsafeUnwrap();
      const result = cancelled.complete();

      expect(result.kind).toBe("err");
      expect(result.error).toBeInstanceOf(StateTransitionError);
      expect(result.error.from).toBe("CANCELLED");
      expect(result.error.to).toBe("COMPLETED");
    });
  });

  // === Update Tests ===
  describe("updates", () => {
    it("updates description with validation", () => {
      // Test typed error
    });
  });
});
```

### Required Test Updates by Pattern

#### Pattern 1: String Error → Typed Error

```typescript
// BEFORE:
expect(result.kind).toBe("err");
expect(result.error).toBe("name is required");

// AFTER:
expect(result.kind).toBe("err");
expect(result.error).toBeInstanceOf(ValidationError);
expect(result.error.field).toBe("name");
expect(result.error.message).toBe("name is required");
```

#### Pattern 2: Status Transition Error

```typescript
// BEFORE:
expect(result.error).toBe("cannot transition from PENDING to DRAFT");

// AFTER:
expect(result.error).toBeInstanceOf(StateTransitionError);
expect(result.error.from).toBe("PENDING");
expect(result.error.to).toBe("DRAFT");
```

#### Pattern 3: Update Validation

```typescript
// BEFORE:
expect(result.error).toBe("description too long");

// AFTER:
expect(result.error).toBeInstanceOf(ValidationError);
expect(result.error.field).toBe("description");
```

### Testing State Machine Behavior

Add these tests for every entity with state machines:

```typescript
describe("state machine", () => {
  it("canTransition returns true for valid transitions", () => {
    const challenge = /* create in DRAFT */;
    // No direct canTransition method anymore
    // Test via actual transition methods
    expect(challenge.publish().kind).toBe("ok");
  });

  it("isTerminal returns true for terminal states", () => {
    const completed = /* create completed challenge */;
    expect(completed.isTerminal()).toBe(true);
  });

  it("isTerminal returns false for non-terminal states", () => {
    const draft = /* create draft challenge */;
    expect(draft.isTerminal()).toBe(false);
  });
});
```

### Test Coverage Requirements

- Each validation rule must have a failing test
- Each state transition (valid and invalid) must be tested
- Each update method must test both success and validation failure
- `updateEntity` behavior is tested in utility tests, not entity tests
- `timestamps()` behavior is tested in utility tests, not entity tests

---

## 5. Definition of Done

### Per-Entity Criteria

An entity refactoring is complete when:

- [ ] All `VALIDATION_RULES` constants removed
- [ ] All `new Date()` calls in update methods removed
- [ ] All status transition constants replaced with state machine
- [ ] All `Result<T, string>` changed to `Result<T, DomainError>`
- [ ] All helper methods (`isForX`, `matches`, `getAgeMs`, `isExpired`) removed
- [ ] All entity tests pass
- [ ] No test coverage regression (> current coverage %)
- [ ] ESLint passes with no new warnings
- [ ] `bun test` passes for the entity's test file

### Phase 3 Overall Criteria

Phase 3 is complete when:

- [ ] All 21 entities refactored per checklist
- [ ] All entity tests pass (`bun test` in `packages/domain`)
- [ ] Overall line count reduction meets or exceeds targets:
  - Challenge: ~320 → ~180 (43% reduction)
  - Notification: ~250 → ~140 (44% reduction)
  - Trip: ~380 → ~220 (42% reduction)
  - Group: ~340 → ~190 (44% reduction)
  - RewardPurchase: ~310 → ~170 (45% reduction)
  - Remaining 16 entities: ~4,200 → ~2,500 (40% reduction avg)
- [ ] Test coverage maintained or improved
- [ ] No regressions in use-case layer tests
- [ ] No regressions in adapter layer tests
- [ ] `bun run build` succeeds
- [ ] `bunx dependency-cruiser --validate .dependency-cruiser.mjs .` passes

### Handoff to Phase 4

Phase 3 hands off to Phase 4 when:

1. This definition of done is met
2. Code review completed (if required by team process)
3. All changes committed with message: `refactor(domain): simplify entities with shared utilities`
4. Phase 4 cleanup tasks are ready to execute

---

## Appendix A: Quick Reference Card

### Common Validation Patterns

```typescript
// String with all options
const name = validate.string(props.name, "name", {
  required: true,
  minLength: 1,
  maxLength: 200,
  trim: true,
});

// Number
const count = validate.number(props.count, "count", {
  required: true,
  min: 0,
  max: 1000,
  integer: true,
});

// ID
const userId = validate.id(props.userId, "userId");

// Array
const items = validate.array(props.items, "items", 50);

// Date range
const range = validate.dateRange(props.startDate, props.endDate);
```

### Common State Machine Patterns

```typescript
// Simple two-state
const sm = createStateMachine({
  transitions: { INACTIVE: ["ACTIVE"], ACTIVE: ["INACTIVE"] },
});

// With terminal states
const sm = createStateMachine({
  transitions: {
    PENDING: ["ACTIVE", "CANCELLED"],
    ACTIVE: ["COMPLETED"],
    CANCELLED: [],
    COMPLETED: [],
  },
  terminalStates: ["CANCELLED", "COMPLETED"],
});
```

### Common Update Patterns

```typescript
// Simple field update
return ok(updateEntity(this, { status: "ACTIVE" }, Entity));

// Multiple fields
return ok(updateEntity(this, { name: value, updatedAt: new Date() }, Entity));
```

---

**Ready for Implementation:** This plan can begin immediately after Phase 1 and Phase 2 are complete and stable.
