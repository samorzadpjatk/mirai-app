# Phase 1: Shared Infrastructure Implementation Plan

**Project:** Domain Entity Simplification  
**Phase:** 1 of 4  
**Est. Duration:** 2-3 hours  
**Status:** Ready for Implementation

---

## Overview

Phase 1 creates the foundational shared utilities that will eliminate ~65% of domain layer boilerplate in subsequent phases. **No existing entities are touched**—this phase only creates new infrastructure files that will be consumed later.

---

## Files to Create

### 1. Shared Error Types

**File:** `packages/domain/src/errors/domain-errors.ts`  
**Purpose:** Replace 100+ inline string errors with typed, structured error classes  
**Estimated Lines:** ~50 lines

**Public API:**

```typescript
export class DomainError extends Error {
  readonly _tag: string;
  constructor(message: string, tag: string);
}

export class ValidationError extends DomainError {
  readonly field?: string;
  constructor(message: string, field?: string);
}

export class StateTransitionError extends DomainError {
  readonly from: string;
  readonly to: string;
  constructor(from: string, to: string);
}

export class NotFoundError extends DomainError {
  readonly entityType: string;
  readonly id: string;
  constructor(entityType: string, id: string);
}
```

**Implementation Notes:**

- Use `readonly` properties for immutability
- Each error class must have a `_tag` discriminator property
- Error messages should be descriptive and include relevant context
- ValidationError has optional `field` property for linking to input field
- StateTransitionError stores both source and target status
- NotFoundError stores entity type (e.g., "Challenge", "User") and the ID that was not found
- All errors must be properly typed for TypeScript exhaustiveness checking

---

### 2. Entity Validation Framework

**File:** `packages/domain/src/utils/entity-validation.ts`  
**Purpose:** Replace 30+ `VALIDATION_RULES` constants with composable validators  
**Estimated Lines:** ~100 lines

**Public API:**

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

export interface ArrayRule {
  required?: boolean;
  maxItems?: number;
}

export const validate = {
  string: (value: string, field: string, rule: StringRule): Result<string, ValidationError>,
  number: (value: number, field: string, rule: NumberRule): Result<number, ValidationError>,
  id: (value: string, field: string): Result<string, ValidationError>,
  array: <T>(value: T[], field: string, rule: ArrayRule): Result<T[], ValidationError>,
  dateRange: (start: Date, end: Date): Result<void, ValidationError>,
};
```

**Implementation Notes:**

**validate.string:**

- Returns `err` if `required: true` and value is empty/whitespace-only
- Validates `minLength` and `maxLength` when specified
- Applies `trim()` when `trim: true` and returns trimmed value
- Returns `ok(value)` on success, `err(ValidationError)` on failure
- Error messages: `"${field} is required"`, `"${field} must be at least ${minLength} characters"`, etc.

**validate.number:**

- Returns `err` if `required: true` and value is undefined/null
- Validates `min` and `max` bounds when specified
- Validates `integer: true` with `Number.isInteger()`
- Error messages: `"${field} must be at most ${max}"`, `"${field} must be an integer"`, etc.

**validate.id:**

- Validates that value is a non-empty string with length > 0
- Used for all ID fields (userId, tripId, etc.)
- Error message: `"${field} must be a valid ID"`

**validate.array:**

- Returns `err` if `required: true` and array is undefined/null/empty
- Validates `maxItems` when specified
- Error message: `"${field} cannot exceed ${maxItems} items"`

**validate.dateRange:**

- Validates that `start` date is before or equal to `end` date
- Returns `ok(void 0)` on success
- Error message: `"start date must be before or equal to end date"`

**Dependencies:**

- Import `Result`, `ok`, `err` from `./result`
- Import `ValidationError` from `../errors/domain-errors`

---

### 3. State Machine Mixin

**File:** `packages/domain/src/utils/state-machine.ts`  
**Purpose:** Replace 5 duplicate status machine implementations (Challenge, Notification, RewardPurchase, LocationSharingRequest, NotificationDelivery)  
**Estimated Lines:** ~60 lines

**Public API:**

```typescript
export interface StateMachineConfig<TStatus extends string> {
  transitions: Record<TStatus, TStatus[]>; // from -> valid to[]
  terminalStates?: TStatus[];
  initialState?: TStatus;
}

export interface StateMachine<TStatus extends string> {
  canTransition: (from: TStatus, to: TStatus) => boolean;
  isTerminal: (status: TStatus) => boolean;
  getValidTransitions: (from: TStatus) => TStatus[];
  getInitialState: (defaultState: TStatus) => TStatus;
}

export function createStateMachine<TStatus extends string>(
  config: StateMachineConfig<TStatus>,
): StateMachine<TStatus>;
```

**Implementation Notes:**

**createStateMachine factory:**

- Returns frozen object with utility methods
- `canTransition`: Checks if `to` exists in `transitions[from]` array
- `isTerminal`: Checks if status exists in `terminalStates` array
- `getValidTransitions`: Returns `transitions[from]` or empty array
- `getInitialState`: Returns `config.initialState` if set, otherwise returns `defaultState` parameter

**Usage Pattern:**

```typescript
// Define at module level (once per entity type)
const challengeSM = createStateMachine<ChallengeStatus>({
  transitions: {
    DRAFT: ["PENDING"],
    PENDING: ["ACTIVE", "CANCELLED"],
    ACTIVE: ["COMPLETED", "CANCELLED"],
    COMPLETED: [],
    CANCELLED: [],
  },
  terminalStates: ["COMPLETED", "CANCELLED"],
  initialState: "DRAFT",
});

// In entity methods:
if (!challengeSM.canTransition(this.status, "ACTIVE")) {
  return err(new StateTransitionError(this.status, "ACTIVE"));
}
```

**Design Principles:**

- Use string literal union type parameter for type safety
- Return plain object (no class) since this is pure behavior
- Consider using `Object.freeze()` on returned object to prevent mutation

---

### 4. Immutable Update Helpers

**File:** `packages/domain/src/utils/immutable.ts`  
**Purpose:** Replace 100+ `new Date()` timestamp updates with composable helpers  
**Estimated Lines:** ~80 lines

**Public API:**

```typescript
export interface Timestamps {
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface TimestampOptions {
  createdAt?: Date;
  updatedAt?: Date;
}

export function timestamps(options?: TimestampOptions): Timestamps;

export function withUpdatedAt<T extends Timestamps>(
  entity: T,
  updates: Partial<Omit<T, "id" | "createdAt">>,
): T;

export function updateEntity<T extends DomainEntity>(
  entity: T,
  updates: Partial<T>,
  constructor: new (...args: any[]) => T,
): T;

export type DomainEntity = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
};
```

**Implementation Notes:**

**timestamps:**

- Returns `{ createdAt, updatedAt }` object
- Uses `new Date()` for any undefined timestamps
- Allows override via options parameter
- Both properties are `readonly`

**withUpdatedAt:**

- Accepts entity with Timestamps interface
- Merges updates with existing properties
- Automatically sets `updatedAt` to `new Date()`
- Preserves `id` and `createdAt` from original entity
- Returns new object of same type

**updateEntity:**

- Factory method for entity classes with private constructors
- Accepts current entity instance, updates object, and constructor reference
- Calls constructor with merged arguments
- Automatically updates `updatedAt` timestamp
- Returns new instance via constructor call

**Example Usage:**

```typescript
// In factory method:
return ok(
  new Challenge(
    props.id ?? crypto.randomUUID(),
    name.value,
    description.value,
    timestamps(props), // Handles both new and existing timestamps
  ),
);

// In update method:
return ok(updateEntity(this, { status: "ACTIVE" }, Challenge));
```

**Dependencies:**

- Uses domain-level `crypto.randomUUID()` pattern (passed in, not imported)
- Must work with entity classes that have private constructors

---

### 5. Entity Helper Functions

**File:** `packages/domain/src/utils/entity-helpers.ts`  
**Purpose:** Replace 50+ duplicate query methods (`isForX()`, `matches()`, `getAgeMs()`, etc.)  
**Estimated Lines:** ~40 lines

**Public API:**

```typescript
export const entityHelpers = {
  /**
   * Check if an entity belongs to a specific target by ID.
   * Replaces: isForTrip(tripId), isForUser(userId), etc.
   */
  belongsTo: (entityId: string, targetId: string): boolean;

  /**
   * Check if a composite key matches target IDs.
   * Replaces: matches(userId, tripId), matchesCompositeKey(ids)
   */
  matchesComposite: (ids: readonly string[], targetIds: readonly string[]): boolean;

  /**
   * Get the age of an entity in milliseconds from its creation date.
   * Replaces: getAgeMs() methods on entities
   */
  getAgeMs: (createdAt: Date): number;

  /**
   * Check if an entity has expired based on a threshold.
   * Replaces: isExpired() methods, expiration checks
   */
  isExpired: (createdAt: Date, thresholdMs: number): boolean;
};
```

**Implementation Notes:**

**belongsTo:**

- Simple equality check: `entityId === targetId`
- Returns boolean
- Use in consuming code: `entityHelpers.belongsTo(this.tripId, tripId)`

**matchesComposite:**

- Validates arrays have same length
- Returns `true` only if every element matches at corresponding index
- Use for composite key matching (e.g., userId + tripId pairs)
- Should handle empty arrays gracefully

**getAgeMs:**

- Returns `Date.now() - createdAt.getTime()`
- Always positive for dates in the past
- Use for sorting, filtering, or expiration logic

**isExpired:**

- Returns `Date.now() - createdAt.getTime() > thresholdMs`
- `thresholdMs` is the maximum age allowed in milliseconds
- Common thresholds: 24h = 86400000ms, 7d = 604800000ms

**Usage Pattern:**

```typescript
// Before:
isForTrip(tripId: string): boolean { return this.tripId === tripId; }
getAgeMs(): number { return Date.now() - this.createdAt.getTime(); }

// After:
// No method needed—use entityHelpers directly:
const matches = entityHelpers.belongsTo(entity.tripId, targetTripId);
const isOld = entityHelpers.isExpired(entity.createdAt, 86400000);
```

**Design Principles:**

- Pure functions (no side effects)
- Readonly array parameters for safety
- No dependencies on other domain modules
- All functions should be trivial to unit test

---

## Test Strategy

### Unit Test Requirements

Each utility file must have comprehensive unit tests with the following coverage:

#### domain-errors.test.ts

| Test Case                                  | Description                              |
| ------------------------------------------ | ---------------------------------------- |
| `DomainError has _tag property`            | Verify base class sets discriminator     |
| `ValidationError includes field`           | Verify field property is set correctly   |
| `StateTransitionError stores from/to`      | Verify transition states are preserved   |
| `NotFoundError includes entityType and id` | Verify search context is preserved       |
| `All errors extend Error correctly`        | Verify stack traces and message property |

#### entity-validation.test.ts

| Validator            | Test Cases                                                                      |
| -------------------- | ------------------------------------------------------------------------------- |
| `validate.string`    | Required check, minLength, maxLength, trim option, success case                 |
| `validate.number`    | Required check, min, max, integer check, success case                           |
| `validate.id`        | Empty string rejection, valid ID success, whitespace rejection                  |
| `validate.array`     | Required check, maxItems limit, empty array handling, generic type preservation |
| `validate.dateRange` | Start before end, equal dates, invalid range error                              |

**Edge Cases:**

- `null` and `undefined` handling for all validators
- Empty string vs whitespace-only string
- Boundary values (exactly at min/max)
- Array with exactly `maxItems` elements

#### state-machine.test.ts

| Test Case                                        | Description                        |
| ------------------------------------------------ | ---------------------------------- |
| `canTransition allows valid transitions`         | Check forward transition           |
| `canTransition rejects invalid transitions`      | Check blocked transition           |
| `canTransition handles terminal states`          | Check no transitions from terminal |
| `isTerminal returns true for terminal states`    | Verify terminal detection          |
| `isTerminal returns false for non-terminal`      | Verify non-terminal detection      |
| `getValidTransitions returns all valid targets`  | List valid next states             |
| `getValidTransitions returns empty for terminal` | Empty array for terminal           |
| `getInitialState returns configured initial`     | Uses config.initialState           |
| `getInitialState returns default when no config` | Uses parameter default             |

**Test State Machine:**

```typescript
const testSM = createStateMachine({
  transitions: {
    A: ["B", "C"],
    B: ["C"],
    C: [],
  },
  terminalStates: ["C"],
  initialState: "A",
});
```

#### immutable.test.ts

| Function        | Test Cases                                                         |
| --------------- | ------------------------------------------------------------------ |
| `timestamps`    | Both undefined (creates new), existing preserved, partial override |
| `withUpdatedAt` | Updates properties, preserves id/createdAt, sets new updatedAt     |
| `updateEntity`  | Calls constructor correctly, applies updates, updates timestamp    |

**Test Entity:**

```typescript
class TestEntity {
  private constructor(
    readonly id: string,
    readonly name: string,
    readonly createdAt: Date,
    readonly updatedAt: Date,
  ) {}

  static create(props: {
    id: string;
    name: string;
    createdAt?: Date;
    updatedAt?: Date;
  }) {
    return new TestEntity(
      props.id,
      props.name,
      props.createdAt ?? new Date(),
      props.updatedAt ?? new Date(),
    );
  }
}
```

#### entity-helpers.test.ts

| Function           | Test Cases                                                |
| ------------------ | --------------------------------------------------------- |
| `belongsTo`        | Matching IDs, non-matching IDs, case sensitivity          |
| `matchesComposite` | All match, partial match, different lengths, empty arrays |
| `getAgeMs`         | Positive result, zero for future date (edge case)         |
| `isExpired`        | Expired check, not expired check, boundary at threshold   |

**Mock Dates:**

- Use fixed timestamps in tests to avoid flakiness
- Example: `const now = new Date("2024-01-01T00:00:00Z");`

### Test File Locations

Following the project's co-located test pattern:

```
packages/domain/src/
├── errors/
│   ├── domain-errors.ts
│   └── domain-errors.test.ts          # Co-located
├── utils/
│   ├── entity-validation.ts
│   ├── entity-validation.test.ts      # Co-located
│   ├── state-machine.ts
│   ├── state-machine.test.ts          # Co-located
│   ├── immutable.ts
│   ├── immutable.test.ts              # Co-located
│   ├── entity-helpers.ts
│   └── entity-helpers.test.ts         # Co-located
```

### Test Running Commands

```bash
# Run all domain tests
bun test

# Run specific test file
bun test packages/domain/src/utils/entity-validation.test.ts

# Run with coverage
bun test --coverage

# Run with debug output
ENABLE_TEST_LOGS=1 bun test
```

---

## Definition of Done

### Completion Criteria

Phase 1 is complete when **all** of the following are true:

#### Code Completion

- [ ] All 5 files created with full TypeScript implementation
- [ ] All public functions properly exported
- [ ] JSDoc comments on all exported functions and types
- [ ] No `any` types used (strict typing throughout)
- [ ] All imports use relative paths within domain package

#### Test Completion

- [ ] Unit test file exists for each utility
- [ ] All unit tests pass: `bun test` exits with code 0
- [ ] Test coverage >90% for each utility file
- [ ] Edge cases covered (empty strings, null values, boundary conditions)

#### Quality Checks

- [ ] `bun run build` succeeds without errors
- [ ] No ESLint errors in new files
- [ ] No dependency-cruiser violations for new files
- [ ] All files follow existing code style (checked via lint)

#### Verification Steps

```bash
# 1. Verify all files exist
ls -la packages/domain/src/errors/domain-errors.ts
ls -la packages/domain/src/utils/entity-validation.ts
ls -la packages/domain/src/utils/state-machine.ts
ls -la packages/domain/src/utils/immutable.ts
ls -la packages/domain/src/utils/entity-helpers.ts

# 2. Verify all test files exist
ls -la packages/domain/src/errors/domain-errors.test.ts
ls -la packages/domain/src/utils/entity-validation.test.ts
ls -la packages/domain/src/utils/state-machine.test.ts
ls -la packages/domain/src/utils/immutable.test.ts
ls -la packages/domain/src/utils/entity-helpers.test.ts

# 3. Run tests
bun test

# 4. Run with coverage
bun test --coverage

# 5. Run build
bun run build

# 6. Check for lint errors
bunx eslint packages/domain/src/errors/ packages/domain/src/utils/
```

#### Documentation

- [ ] Each exported function has JSDoc comment explaining purpose
- [ ] Complex types have explanatory comments
- [ ] Usage examples in comments for key functions

#### Risk Assessment

| Risk                 | Mitigation                                    | Status |
| -------------------- | --------------------------------------------- | ------ |
| Existing tests break | Only adding new files, not modifying existing | Low    |
| Type conflicts       | All new types in separate namespaces          | Low    |
| Build failures       | Utilities don't export to other packages yet  | Low    |
| Performance          | Pure functions, no runtime overhead           | None   |

---

## Implementation Order

Recommended sequence to minimize rework:

1. **domain-errors.ts** - Foundation for all other utilities
2. **entity-helpers.ts** - Simplest, builds confidence
3. **immutable.ts** - Used by validation framework
4. **entity-validation.ts** - Depends on errors and immutable
5. **state-machine.ts** - Standalone, can be done anytime

---

## Files Summary

| File                         | Purpose                  | Lines (est.) | Tests   |
| ---------------------------- | ------------------------ | ------------ | ------- |
| `errors/domain-errors.ts`    | 4 error types            | ~50          | ~8      |
| `utils/entity-helpers.ts`    | Common query methods     | ~40          | ~12     |
| `utils/immutable.ts`         | Timestamp/update helpers | ~80          | ~10     |
| `utils/entity-validation.ts` | Validation framework     | ~100         | ~20     |
| `utils/state-machine.ts`     | Status transitions       | ~60          | ~10     |
| **Total**                    |                          | **~330**     | **~60** |

---

## Next Phase Preview

After Phase 1 completes, Phase 2 will:

1. Update `ActivityFeed.ts` with 4 metadata interfaces
2. Delete 4 activity-related entity files
3. Update `TripInsurance.ts` with nested `steps[]`
4. Update `NotificationDelivery.ts` with nested `pushes[]`
5. Delete 3 more entity files

The utilities created in Phase 1 will be used in Phases 2-4 to dramatically reduce boilerplate.

---

**Plan Created:** 2026-04-11  
**Design Reference:** `.specs/plans/simplify-domain-entities.design.md` Section 3  
**Ready for Implementation:** Yes
