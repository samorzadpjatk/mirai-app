---
title: Add all missing entities from schema.prisma to domain layer
depends_on: []
---

## Initial User Prompt

/add-task add all missing entitis from schema.prisma - based on the tRPC routers

## Description

We need to complete the domain layer by adding 21 missing domain entities that correspond to existing schema.prisma models. Currently, only 13 of 34 Prisma models have domain entity counterparts, creating architectural inconsistency and limiting our ability to implement proper DDD patterns across the entire application.

Each entity must follow established patterns: static factory methods returning Either<Error, Entity>, branded ID types to prevent mixing across aggregates, immutable readonly properties, and co-located test files. The domain layer must remain pure with ZERO external dependencies - no async operations, no UUID generation, no framework dependencies.

This work is foundational for implementing use cases and adapters for these domains. Without these domain entities, business logic cannot be properly isolated from persistence concerns.

**Scope**:

- **Included**: 21 domain entity files in packages/domain/src/entities/ with co-located tests
- **Excluded**: Repository implementations, use cases, tRPC controllers, database migrations, changes to schema.prisma

**User Scenarios**:

1. **Primary Flow**: Developer creates entity via static factory with valid data, receives Either.right(entity), uses in business logic
2. **Error Handling**: Developer provides invalid data, receives Either.left(ValidationError) with specific message

## Analysis

### Schema.prisma models (34 total):

1. User
2. Trip
3. TripResource
4. TripInsurance
5. TripInsuranceStep
6. TripParticipant
7. Event
8. UserEvent
9. Group
10. GroupJoinRequest
11. Challenge
12. ChallengeSubmission
13. ChallengeVote
14. SubmissionReport
15. ActivityFeed
16. ActivityReaction
17. SubmissionActivity
18. ChallengeActivity
19. RankChangeActivity
20. UserPost
21. CoinTransaction
22. NotificationSchedule
23. Notification
24. NotificationScheduleExecution
25. NotificationPush
26. NotificationDelivery
27. PushSubscription
28. Location
29. LocationSharingRequest
30. Reward
31. RewardPurchase
32. UserAgent
33. Sponsor
34. TripSponsor

### Existing domain entities (13):

ActivityFeed.ts, Challenge.ts, ChallengeSubmission.ts, ChallengeVote.ts, Group.ts, Location.ts, Notification.ts, NotificationSchedule.ts, Reward.ts, Sponsor.ts, SubmissionReport.ts, Trip.ts, User.ts

### Missing entities (21):

**Trip Management:**

1. TripResource
2. TripInsurance
3. TripInsuranceStep
4. TripParticipant
5. TripSponsor

**Event Management:** 6. Event 7. UserEvent

**Group Management:** 8. GroupJoinRequest

**Activity Feed:** 9. ActivityReaction 10. SubmissionActivity 11. ChallengeActivity 12. RankChangeActivity 13. UserPost

**Economy/Rewards:** 14. CoinTransaction 15. RewardPurchase

**Notifications:** 16. NotificationScheduleExecution 17. NotificationPush 18. NotificationDelivery 19. PushSubscription

**Location:** 20. LocationSharingRequest

**System:** 21. UserAgent

## Acceptance Criteria

### Functional Requirements

Each entity must be created following the established domain patterns:

- [ ] **[TripResource]**: Entity exists with proper validation
  - Given: Valid trip resource data from Prisma schema
  - When: Static create() factory method is called
  - Then: Returns Either.right(TripResource) with valid properties

- [ ] **[TripInsurance]**: Entity exists with proper validation
  - Given: Valid trip insurance data from Prisma schema
  - When: Static create() factory method is called
  - Then: Returns Either.right(TripInsurance) with valid properties

- [ ] **[TripInsuranceStep]**: Entity exists with proper validation
  - Given: Valid trip insurance step data from Prisma schema
  - When: Static create() factory method is called
  - Then: Returns Either.right(TripInsuranceStep) with valid properties

- [ ] **[TripParticipant]**: Entity exists with proper validation
  - Given: Valid trip participant data from Prisma schema
  - When: Static create() factory method is called
  - Then: Returns Either.right(TripParticipant) with valid properties

- [ ] **[Event]**: Entity exists with proper validation
  - Given: Valid event data from Prisma schema
  - When: Static create() factory method is called
  - Then: Returns Either.right(Event) with valid properties

- [ ] **[UserEvent]**: Entity exists with proper validation
  - Given: Valid user event data from Prisma schema
  - When: Static create() factory method is called
  - Then: Returns Either.right(UserEvent) with valid properties

- [ ] **[GroupJoinRequest]**: Entity exists with proper validation
  - Given: Valid group join request data from Prisma schema
  - When: Static create() factory method is called
  - Then: Returns Either.right(GroupJoinRequest) with valid properties

- [ ] **[ActivityReaction]**: Entity exists with proper validation
  - Given: Valid activity reaction data from Prisma schema
  - When: Static create() factory method is called
  - Then: Returns Either.right(ActivityReaction) with valid properties

- [ ] **[SubmissionActivity]**: Entity exists with proper validation
  - Given: Valid submission activity data from Prisma schema
  - When: Static create() factory method is called
  - Then: Returns Either.right(SubmissionActivity) with valid properties

- [ ] **[ChallengeActivity]**: Entity exists with proper validation
  - Given: Valid challenge activity data from Prisma schema
  - When: Static create() factory method is called
  - Then: Returns Either.right(ChallengeActivity) with valid properties

- [ ] **[RankChangeActivity]**: Entity exists with proper validation
  - Given: Valid rank change activity data from Prisma schema
  - When: Static create() factory method is called
  - Then: Returns Either.right(RankChangeActivity) with valid properties

- [ ] **[UserPost]**: Entity exists with proper validation
  - Given: Valid user post data from Prisma schema
  - When: Static create() factory method is called
  - Then: Returns Either.right(UserPost) with valid properties

- [ ] **[CoinTransaction]**: Entity exists with proper validation
  - Given: Valid coin transaction data from Prisma schema
  - When: Static create() factory method is called
  - Then: Returns Either.right(CoinTransaction) with valid properties

- [ ] **[NotificationScheduleExecution]**: Entity exists with proper validation
  - Given: Valid notification schedule execution data from Prisma schema
  - When: Static create() factory method is called
  - Then: Returns Either.right(NotificationScheduleExecution) with valid properties

- [ ] **[NotificationPush]**: Entity exists with proper validation
  - Given: Valid notification push data from Prisma schema
  - When: Static create() factory method is called
  - Then: Returns Either.right(NotificationPush) with valid properties

- [ ] **[NotificationDelivery]**: Entity exists with proper validation
  - Given: Valid notification delivery data from Prisma schema
  - When: Static create() factory method is called
  - Then: Returns Either.right(NotificationDelivery) with valid properties

- [ ] **[PushSubscription]**: Entity exists with proper validation
  - Given: Valid push subscription data from Prisma schema
  - When: Static create() factory method is called
  - Then: Returns Either.right(PushSubscription) with valid properties

- [ ] **[LocationSharingRequest]**: Entity exists with proper validation
  - Given: Valid location sharing request data from Prisma schema
  - When: Static create() factory method is called
  - Then: Returns Either.right(LocationSharingRequest) with valid properties

- [ ] **[RewardPurchase]**: Entity exists with proper validation
  - Given: Valid reward purchase data from Prisma schema
  - When: Static create() factory method is called
  - Then: Returns Either.right(RewardPurchase) with valid properties

- [ ] **[UserAgent]**: Entity exists with proper validation
  - Given: Valid user agent data from Prisma schema
  - When: Static create() factory method is called
  - Then: Returns Either.right(UserAgent) with valid properties

- [ ] **[TripSponsor]**: Entity exists with proper validation
  - Given: Valid trip sponsor data from Prisma schema
  - When: Static create() factory method is called
  - Then: Returns Either.right(TripSponsor) with valid properties

### Pattern Compliance Requirements

- [ ] **[ID-Branding]**: All entities use branded ID types to prevent mixing across aggregates
  - Given: Entity with ID field
  - When: Creating or referencing the entity
  - Then: ID type is unique to that entity (e.g., TripResourceId, not just string)

- [ ] **[Immutable-Design]**: All entity properties are readonly
  - Given: An instantiated entity
  - When: Attempting to modify properties
  - Then: TypeScript compilation prevents mutation (readonly properties)

- [ ] **[Either-Error-Handling]**: Factory methods return Either<Error, Entity>
  - Given: Invalid entity data
  - When: Static create() factory method is called
  - Then: Returns Either.left(ValidationError) with specific message

- [ ] **[Domain-Purity]**: No external dependencies in domain layer
  - Given: Entity source code
  - When: Checking imports
  - Then: No imports from Prisma, tRPC, Effect runtime services, or other external libraries

### Testing Requirements

- [ ] **[Co-located-Tests]**: Each entity has co-located test file
  - Given: Entity at packages/domain/src/entities/Entity.ts
  - When: Checking for tests
  - Then: Entity.test.ts exists in same directory

- [ ] **[Test-Coverage]**: All validation paths tested
  - Given: Entity validation rules
  - When: Running tests
  - Then: Tests cover valid creation, invalid data, edge cases

### Non-Functional Requirements

- [x] **[Consistency]**: All entities follow existing entity patterns
  - Given: New entity implementation
  - When: Comparing to existing entities (User.ts, Trip.ts, etc.)
  - Then: Same structure, patterns, naming conventions

### Definition of Done

- [x] All 21 entities created in packages/domain/src/entities/
- [x] All 21 co-located test files created and passing
- [x] All entities follow DDD patterns (Either error handling, branded IDs, immutable)
- [x] No dependency-cruiser violations (domain has no external deps)
- [x] All tests pass: `bun test` in packages/domain
- [x] Task moved to done/ folder

## Implementation Process

### Phase 1: Setup

#### Step 1: Prisma Schema Analysis [DONE]

**Goal**: Extract field definitions for all 21 entities from schema.prisma
**Output**: Reference document with field types and constraints
**Success Criteria**:

- [x] Document created at `.specs/scratchpad/prisma-entity-reference.md`
- [x] Contains field definitions for all 21 entities
- [x] Notes any special validation requirements
      **Estimate**: Small
      **Blockers**: None
      **Risks**: None - mechanical task

### Phase 2: Domain Implementation (Parallel Groups)

#### Step 2: Implement Trip Management Entities [DONE]

**Goal**: Create 5 trip-related domain entities
**Outputs**:

- `packages/domain/src/entities/TripResource.ts` + test ✅
- `packages/domain/src/entities/TripInsurance.ts` + test ✅
- `packages/domain/src/entities/TripInsuranceStep.ts` + test ✅
- `packages/domain/src/entities/TripParticipant.ts` + test ✅
- `packages/domain/src/entities/TripSponsor.ts` + test ✅
  **Success Criteria**:
- [x] All 5 entities exist with proper validation
- [x] All 5 tests pass
- [x] Follow existing patterns (Either, branded IDs, immutable)
      **Estimate**: Medium
      **Blockers**: Step 1
      **Risks**: None
      **Parallel with**: Steps 3-8

#### Step 3: Implement Event Management Entities [DONE]

**Goal**: Create 2 event-related domain entities
**Outputs**:

- `packages/domain/src/entities/Event.ts` + test ✅
- `packages/domain/src/entities/UserEvent.ts` + test ✅
  **Success Criteria**:
- [x] Both entities exist with proper validation
- [x] Both tests pass
      **Estimate**: Small
      **Blockers**: Step 1
      **Risks**: None
      **Parallel with**: Steps 2, 4-8

#### Step 4: Implement Group Management Entity [DONE]

**Goal**: Create GroupJoinRequest domain entity
**Outputs**:

- `packages/domain/src/entities/GroupJoinRequest.ts` + test ✅
  **Success Criteria**:
- [x] Entity exists with proper validation
- [x] Test passes
      **Estimate**: Tiny
      **Blockers**: Step 1
      **Risks**: None
      **Parallel with**: Steps 2-3, 5-8

#### Step 5: Implement Activity Feed Entities [DONE]

**Goal**: Create 5 activity-related domain entities
**Outputs**:

- `packages/domain/src/entities/ActivityReaction.ts` + test ✅
- `packages/domain/src/entities/SubmissionActivity.ts` + test ✅
- `packages/domain/src/entities/ChallengeActivity.ts` + test ✅
- `packages/domain/src/entities/RankChangeActivity.ts` + test ✅
- `packages/domain/src/entities/UserPost.ts` + test ✅
  **Success Criteria**:
- [x] All 5 entities exist with proper validation
- [x] All 5 tests pass
      **Estimate**: Medium
      **Blockers**: Step 1
      **Risks**: None
      **Parallel with**: Steps 2-4, 6-8

#### Step 6: Implement Economy/Rewards Entities [DONE]

**Goal**: Create 2 economy-related domain entities
**Outputs**:

- `packages/domain/src/entities/CoinTransaction.ts` + test ✅
- `packages/domain/src/entities/RewardPurchase.ts` + test ✅
  **Success Criteria**:
- [x] Both entities exist with proper validation
- [x] Both tests pass
      **Estimate**: Small
      **Blockers**: Step 1
      **Risks**: None
      **Parallel with**: Steps 2-5, 7-8

#### Step 7: Implement Notification Entities [DONE]

**Goal**: Create 4 notification-related domain entities
**Outputs**:

- `packages/domain/src/entities/NotificationScheduleExecution.ts` + test ✅
- `packages/domain/src/entities/NotificationPush.ts` + test ✅
- `packages/domain/src/entities/NotificationDelivery.ts` + test ✅
- `packages/domain/src/entities/PushSubscription.ts` + test ✅
  **Success Criteria**:
- [x] All 4 entities exist with proper validation
- [x] All 4 tests pass
      **Estimate**: Medium
      **Blockers**: Step 1
      **Risks**: None
      **Parallel with**: Steps 2-6, 8

#### Step 8: Implement Location & System Entities [DONE]

**Goal**: Create LocationSharingRequest and UserAgent domain entities
**Outputs**:

- `packages/domain/src/entities/LocationSharingRequest.ts` + test ✅
- `packages/domain/src/entities/UserAgent.ts` + test ✅
  **Success Criteria**:
- [x] Both entities exist with proper validation
- [x] Both tests pass
      **Estimate**: Small
      **Blockers**: Step 1
      **Risks**: None
      **Parallel with**: Steps 2-7

### Phase 3: Validation

#### Step 9: Run All Domain Tests [DONE]

**Goal**: Verify all entities work correctly together
**Output**: Test results from `bun test`
**Success Criteria**:

- [x] All 21 entity tests pass
- [x] No test failures in packages/domain
      **Estimate**: Small
      **Blockers**: Steps 2-8 complete
      **Risks**: None

#### Step 10: Check Dependency Violations [DONE]

**Goal**: Ensure domain purity (no external dependencies)
**Output**: dependency-cruiser validation report
**Success Criteria**:

- [x] No violations in packages/domain/src/entities/
- [x] No imports from Prisma, tRPC, or external libs in entity files
      **Estimate**: Tiny
      **Blockers**: Steps 2-8 complete
      **Risks**: None
      **Parallel with**: Step 9

#### Step 11: Update Barrel Exports [DONE]

**Goal**: Export all new entities from domain package index
**Output**: Updated `packages/domain/src/index.ts`
**Success Criteria**:

- [x] All 21 new entities exported
- [x] No circular dependency issues
- [x] Package builds successfully
      **Estimate**: Tiny
      **Blockers**: Steps 2-8 complete
      **Risks**: None
      **Parallel with**: Steps 9-10

---

## Risk Assessment

| Risk                                          | Likelihood | Impact | Mitigation                                |
| --------------------------------------------- | ---------- | ------ | ----------------------------------------- |
| Complex relationships requiring value objects | Low        | Medium | Defer to separate task if discovered      |
| Unclear validation rules from Prisma          | Low        | Low    | Use schema constraints as reference       |
| Pattern inconsistency across entities         | Low        | Medium | Review first 2-3 entities before batching |
| Test coverage gaps                            | Low        | Low    | TDD approach - test first                 |

## Implementation Summary

| Phase      | Steps | Entities | Effort | Parallel Groups   |
| ---------- | ----- | -------- | ------ | ----------------- |
| Setup      | 1     | 0        | Small  | Sequential        |
| Domain     | 2-8   | 21       | Medium | 7 parallel groups |
| Validation | 9-11  | -        | Small  | 3 parallel steps  |

**Critical Path**: Step 1 → Steps 2-8 (parallel) → Steps 9-11 (parallel)

**Recommended Parallel Execution**:

```
Step 1 (Prisma Analysis)
         ↓
    ┌────┴────┬────────┬────────┬────────┬────────┬────────┐
    ▼         ▼        ▼        ▼        ▼        ▼        ▼
 Step 2   Step 3   Step 4   Step 5   Step 6   Step 7   Step 8
(Trip)   (Event)  (Group)  (Activ)  (Econ)   (Notif)  (Loc/Sys)
    └────┬────┴────────┴────────┴────────┴────────┴────────┘
         ↓
    ┌────┴────┬────────┐
    ▼         ▼        ▼
 Step 9    Step 10  Step 11
 (Tests)   (Deps)   (Exports)
```

## Verification

### Step 1 Verification: Prisma Schema Analysis

**Verification Level**: Single Judge (Medium complexity)
**Judge**: sdd:code-explorer (sonnet)

**Rubric**:

| Criterion    | Weight | Description                                       |
| ------------ | ------ | ------------------------------------------------- |
| Completeness | 0.40   | All 21 entities documented with field definitions |
| Accuracy     | 0.35   | Field types match Prisma schema                   |
| Clarity      | 0.25   | Document is well-organized and readable           |

**Threshold**: 3.0/5.0

---

### Step 2 Verification: Trip Management Entities

**Verification Level**: Single Judge (Medium complexity)
**Judge**: sdd:developer (sonnet)

**Rubric**:

| Criterion          | Weight | Description                                                      |
| ------------------ | ------ | ---------------------------------------------------------------- |
| Pattern Compliance | 0.35   | Follows existing entity patterns (Either, branded IDs, readonly) |
| Test Coverage      | 0.30   | Tests exist and pass for all 5 entities                          |
| Domain Purity      | 0.20   | No external dependencies in entity files                         |
| Validation Logic   | 0.15   | Proper validation using Either.left for invalid data             |

**Threshold**: 3.0/5.0

---

### Step 3 Verification: Event Management Entities

**Verification Level**: Single Judge (Low complexity)
**Judge**: sdd:developer (haiku)

**Rubric**:

| Criterion          | Weight | Description                            |
| ------------------ | ------ | -------------------------------------- |
| Pattern Compliance | 0.40   | Follows existing entity patterns       |
| Test Coverage      | 0.35   | Tests exist and pass for both entities |
| Domain Purity      | 0.25   | No external dependencies               |

**Threshold**: 3.0/5.0

---

### Step 4 Verification: GroupJoinRequest Entity

**Verification Level**: Single Judge (Low complexity)
**Judge**: sdd:developer (haiku)

**Rubric**:

| Criterion          | Weight | Description                      |
| ------------------ | ------ | -------------------------------- |
| Pattern Compliance | 0.40   | Follows existing entity patterns |
| Test Coverage      | 0.35   | Tests exist and pass             |
| Domain Purity      | 0.25   | No external dependencies         |

**Threshold**: 3.0/5.0

---

### Step 5 Verification: Activity Feed Entities

**Verification Level**: Single Judge (Medium complexity)
**Judge**: sdd:developer (sonnet)

**Rubric**:

| Criterion          | Weight | Description                             |
| ------------------ | ------ | --------------------------------------- |
| Pattern Compliance | 0.35   | Follows existing entity patterns        |
| Test Coverage      | 0.30   | Tests exist and pass for all 5 entities |
| Domain Purity      | 0.20   | No external dependencies                |
| Validation Logic   | 0.15   | Proper validation using Either          |

**Threshold**: 3.0/5.0

---

### Step 6 Verification: Economy/Rewards Entities

**Verification Level**: Single Judge (Low complexity)
**Judge**: sdd:developer (haiku)

**Rubric**:

| Criterion          | Weight | Description                      |
| ------------------ | ------ | -------------------------------- |
| Pattern Compliance | 0.40   | Follows existing entity patterns |
| Test Coverage      | 0.35   | Tests exist and pass             |
| Domain Purity      | 0.25   | No external dependencies         |

**Threshold**: 3.0/5.0

---

### Step 7 Verification: Notification Entities

**Verification Level**: Single Judge (Medium complexity)
**Judge**: sdd:developer (sonnet)

**Rubric**:

| Criterion          | Weight | Description                             |
| ------------------ | ------ | --------------------------------------- |
| Pattern Compliance | 0.35   | Follows existing entity patterns        |
| Test Coverage      | 0.30   | Tests exist and pass for all 4 entities |
| Domain Purity      | 0.20   | No external dependencies                |
| Validation Logic   | 0.15   | Proper validation using Either          |

**Threshold**: 3.0/5.0

---

### Step 8 Verification: Location & System Entities

**Verification Level**: Single Judge (Low complexity)
**Judge**: sdd:developer (haiku)

**Rubric**:

| Criterion          | Weight | Description                      |
| ------------------ | ------ | -------------------------------- |
| Pattern Compliance | 0.40   | Follows existing entity patterns |
| Test Coverage      | 0.35   | Tests exist and pass             |
| Domain Purity      | 0.25   | No external dependencies         |

**Threshold**: 3.0/5.0

---

### Step 9 Verification: Domain Tests

**Verification Level**: Single Judge (Medium complexity)
**Judge**: sdd:qa-engineer (sonnet)

**Rubric**:

| Criterion      | Weight | Description                      |
| -------------- | ------ | -------------------------------- |
| Test Pass Rate | 0.40   | All 21 entity tests pass         |
| Coverage       | 0.30   | Tests cover validation paths     |
| Integration    | 0.30   | No regressions in existing tests |

**Threshold**: 3.0/5.0

---

### Step 10 Verification: Dependency Check

**Verification Level**: Single Judge (Low complexity)
**Judge**: sdd:code-explorer (haiku)

**Rubric**:

| Criterion           | Weight | Description                              |
| ------------------- | ------ | ---------------------------------------- |
| No External Imports | 0.60   | No Prisma, tRPC, or external lib imports |
| Domain Purity       | 0.40   | Only Effect/Either imports allowed       |

**Threshold**: 3.0/5.0

---

### Step 11 Verification: Barrel Exports

**Verification Level**: Single Judge (Low complexity)
**Judge**: sdd:developer (haiku)

**Rubric**:

| Criterion           | Weight | Description                   |
| ------------------- | ------ | ----------------------------- |
| Export Completeness | 0.50   | All 21 entities exported      |
| Build Success       | 0.30   | Package builds without errors |
| No Cycles           | 0.20   | No circular dependency issues |

**Threshold**: 3.0/5.0

---

## Verification Summary Table

| Step | Description              | Verification Level | Judge                      | Threshold |
| ---- | ------------------------ | ------------------ | -------------------------- | --------- |
| 1    | Prisma Analysis          | Single             | sdd:code-explorer (sonnet) | 3.0       |
| 2    | Trip Entities            | Single             | sdd:developer (sonnet)     | 3.0       |
| 3    | Event Entities           | Single             | sdd:developer (haiku)      | 3.0       |
| 4    | Group Entity             | Single             | sdd:developer (haiku)      | 3.0       |
| 5    | Activity Entities        | Single             | sdd:developer (sonnet)     | 3.0       |
| 6    | Economy Entities         | Single             | sdd:developer (haiku)      | 3.0       |
| 7    | Notification Entities    | Single             | sdd:developer (sonnet)     | 3.0       |
| 8    | Location/System Entities | Single             | sdd:developer (haiku)      | 3.0       |
| 9    | Domain Tests             | Single             | sdd:qa-engineer (sonnet)   | 3.0       |
| 10   | Dependency Check         | Single             | sdd:code-explorer (haiku)  | 3.0       |
| 11   | Barrel Exports           | Single             | sdd:developer (haiku)      | 3.0       |
