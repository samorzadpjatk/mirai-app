---
title: "Simplify Domain Entities - Reduce 65% Boilerplate"
type: task
status: ready
priority: high
created: "2026-04-14"
source_plan: ".specs/plans/simplify-domain-entities.design.md"
---

## Initial Request

Convert the validated "Domain Entity Simplification" design into an implementation task. This work eliminates ~65% of domain layer boilerplate by extracting shared infrastructure, nesting child entities, and standardizing patterns.

## Description

### Why This is Needed

The domain layer has accumulated significant duplication across 35 entity files:

- 30+ `VALIDATION_RULES` constants
- 5 status state machine implementations
- 28+ repetitive factory methods
- 100+ timestamp update patterns (`new Date()`)
- 50+ `isForX()` query methods
- 20+ `matches()` composite key methods

This creates maintenance burden and increases bug risk when changes need to be applied consistently across all entities.

### What This Accomplishes

**Target outcome:** ~3,500 lines → ~1,200 lines (65% reduction)

**Key deliverables:**

1. **Shared infrastructure utilities** (validation, state machines, immutable helpers, entity helpers)
2. **7 nested entity interfaces** (child entities become interfaces within aggregates)
3. **Standardized error handling** (unified error types)
4. **Simplified entities** (21 aggregate roots instead of 35)

### Scope Boundaries

**IN Scope:**

- Create `packages/domain/src/utils/entity-validation.ts` framework
- Create `packages/domain/src/utils/state-machine.ts` factory
- Create `packages/domain/src/utils/immutable.ts` helpers
- Create `packages/domain/src/utils/entity-helpers.ts` query methods
- Nest 7 child entities as interfaces (ChallengeActivity, RankChangeActivity, etc.)
- Refactor 21 aggregate root entities to use new utilities
- Update all tests to maintain coverage

**OUT of Scope:**

- Changes to use-cases layer
- Changes to adapters layer
- Database schema changes
- API contract changes

## Acceptance Criteria

### Functional Criteria

- [ ] `packages/domain/src/utils/entity-validation.ts` provides declarative validation API
- [ ] `packages/domain/src/utils/state-machine.ts` provides status transition factory
- [ ] `packages/domain/src/utils/immutable.ts` provides `timestamps()`, `withUpdatedAt()`, `updateEntity()` helpers
- [ ] `packages/domain/src/utils/entity-helpers.ts` provides `isForTrip()`, `matches()` factories
- [ ] 7 child entities nested as interfaces (not standalone entities)
- [ ] All 21 aggregate roots use shared utilities
- [ ] Zero breaking changes to public entity APIs
- [ ] All existing tests pass without modification

### Quality Criteria

- [ ] Domain tests maintain 100% pass rate
- [ ] No increase in TypeScript errors
- [ ] Entity creation patterns remain type-safe
- [ ] Error messages remain clear and actionable

## Architecture Overview

### Current State

35 entity files with copy-pasted:

- Validation rules (30+)
- State machines (5)
- Factory methods (28+)
- Timestamp handling (100+)
- Query helpers (70+)

### Target State

```
packages/domain/src/
├── entities/                    # 21 aggregates (down from 35)
│   ├── ActivityFeed.ts          # Contains nested metadata interfaces
│   ├── TripInsurance.ts         # Contains steps[] interface
│   └── ...
├── utils/                       # Enhanced shared infrastructure
│   ├── entity-validation.ts     # NEW: Validation framework
│   ├── state-machine.ts         # NEW: Status transitions
│   ├── immutable.ts             # NEW: Timestamp helpers
│   └── entity-helpers.ts        # NEW: Common query methods
└── errors/
    └── unified-errors.ts        # Already created
```

### Migration Strategy

1. **Phase 1: Create utilities** (parallel-safe)
   - Build validation framework
   - Build state machine factory
   - Build immutable helpers
   - Build entity-helpers

2. **Phase 2: Nest child entities** (parallel-safe)
   - ChallengeActivity → ActivityFeed.challengeMetadata
   - RankChangeActivity → ActivityFeed.rankChangeMetadata
   - SubmissionActivity → ActivityFeed.submissionMetadata
   - UserPost → ActivityFeed.postMetadata
   - TripInsuranceStep → TripInsurance.steps[]
   - NotificationPush → NotificationDelivery.pushes[]
   - Remove NotificationScheduleExecution (use simple interface)

3. **Phase 3: Refactor aggregates** (sequential)
   - Update each aggregate root to use new utilities
   - Migrate one entity at a time
   - Run tests after each entity

## Implementation Notes

### From Source Plan

See `.specs/plans/simplify-domain-entities.design.md` for:

- Complete validation framework API
- State machine configuration patterns
- Immutable helper signatures
- Entity nesting specifications
- Per-entity refactoring guidance

### Key Patterns

**Validation Framework:**

```typescript
export const validation = {
  string: (rules: StringRules) => Validator<string>,
  number: (rules: NumberRules) => Validator<number>,
  array: <T>(rules: ArrayRules<T>) => Validator<T[]>,
};
```

**State Machine:**

```typescript
export const createStateMachine = <S extends string>(config: {
  initial: S;
  states: Record<S, { transitions: Record<string, S> }>;
}) => StateMachine<S>;
```

**Immutable Helpers:**

```typescript
export const timestamps = () => ({
  createdAt: new Date(),
  updatedAt: new Date(),
});
export const withUpdatedAt = <T extends { updatedAt: Date }>(entity: T): T => ({
  ...entity,
  updatedAt: new Date(),
});
```

## Estimated Effort

| Phase               | Duration        | Complexity |
| ------------------- | --------------- | ---------- |
| Create utilities    | 2-3 hours       | Medium     |
| Nest child entities | 2-3 hours       | Medium     |
| Refactor aggregates | 6-8 hours       | High       |
| Test verification   | 1-2 hours       | Low        |
| **Total**           | **11-16 hours** |            |

## Dependencies

- ✅ Unified error hierarchy (already created)
- ✅ Branded ID factory (already created)
- ⬜ May need PDCA Cycle 2 results (clean test files)

## Success Metrics

| Metric               | Before | Target     |
| -------------------- | ------ | ---------- |
| Entity files         | 35     | 21         |
| Domain LOC           | ~3,500 | ~1,200     |
| Validation constants | 30+    | 0 (shared) |
| State machine dupes  | 5      | 0 (shared) |
| Test pass rate       | 100%   | 100%       |

---

**Next Step:** Use `/sdd:implement` to execute this task with sub-agent orchestration.
