---
title: Increase test coverage to at least 80% across monorepo
---

## Initial User Prompt

Increase the test coverage to at least 80% across the monorepo (excluding Prisma auto-generated client code)

## Description

Increase test coverage to a minimum of 80% line, branch, and function coverage across all 10 packages/apps in the Bun/TypeScript DDD monorepo, excluding Prisma auto-generated code and operational scripts.

### Business Rationale

The monorepo currently has highly variable coverage ranging from 0% (shared, seed) to 88% (domain). The use-cases package — the critical orchestration layer — has only ~19% coverage with 64 of 78 interactors untested. This creates significant risk during the ongoing DI migration and future refactoring efforts.

### Scope

**In Scope:**

- All source files in packages: domain, use-cases, adapters, frameworks, shared
- All source files in apps: backend-server, web, notification-sender
- Unit tests for pure business logic (domain entities, value objects, use-case interactors, mappers)
- Unit tests for controllers (with mocked dependencies)
- Unit tests for framework utilities (DI modules, stores)

**Out of Scope:**

- `packages/frameworks/src/prisma/lib/**` — Prisma auto-generated code
- `apps/seed/**` — Seed scripts (operational, low business value)
- `apps/native/**` — Uses Jest, separate coverage pipeline
- Build output (`dist/**`), type declarations (`*.d.ts`)
- Integration tests for repositories (require real DB — separate task)
- tRPC router integration tests (require full stack — separate task)

### Strategic Approach

Implement coverage in phases to avoid CI gate failures and allow pattern refinement:

| Phase   | Target | Timeline  | Focus                                       |
| ------- | ------ | --------- | ------------------------------------------- |
| Phase 1 | 60%    | Weeks 1-2 | Quick wins: shared, domain VOs, mappers     |
| Phase 2 | 70%    | Weeks 3-4 | Use-case interactors (highest risk gap)     |
| Phase 3 | 80%    | Weeks 5-6 | Controllers, services, frameworks selective |

### Effort Estimate

**Total: ~410 tests, ~53-77 hours**

| Category                                    | Test Count | Difficulty  |
| ------------------------------------------- | ---------- | ----------- |
| Domain (VOs + entities + utils)             | ~53        | Easy        |
| Use-case interactors                        | ~224       | Medium      |
| Adapters (mappers + controllers + services) | ~97        | Easy-Medium |
| Frameworks + shared                         | ~33        | Easy-Medium |

### Key Risks

1. **DI Migration Breakages** — 64 untested interactors represent untested code paths that will be affected by DI changes
2. **Regression Bugs** — Without tests, changes to orchestration logic cannot be validated
3. **Coverage Decay** — Without CI enforcement, coverage will continue to decline

### Dependencies

- All existing patterns in `packages/domain/src/**/*.test.ts` serve as templates
- Use-case testing requires `runAsResult()` helper for Effect-based interactors
- Mock factories should be created in `packages/use-cases/src/test-utils/` to reduce boilerplate

## Acceptance Criteria

### Phase 1 Criteria (60% Target)

**Given** the monorepo baseline coverage has been measured  
**When** Phase 1 is complete  
**Then** shared package achieves ≥60% coverage  
**And** domain value objects (15 files) have co-located tests  
**And** domain entity NotificationSchedule has co-located tests  
**And** domain validation.ts utility has tests  
**And** adapter mappers (11 untested) have round-trip tests

**Given** Phase 1 completion  
**When** `bun test --coverage` runs on domain, use-cases, adapters, frameworks, shared  
**Then** shared coverage ≥60%  
**And** domain coverage maintained at ≥88%  
**And** adapters coverage ≥55%  
**And** CI reports coverage without errors

### Phase 2 Criteria (70% Target)

**Given** Phase 1 complete  
**When** Phase 2 is complete  
**Then** use-cases package achieves ≥70% coverage  
**And** at least 40 of 64 untested interactors have co-located unit tests  
**And** use-case error-helpers.ts and pagination.ts have unit tests  
**And** use-case UseCaseErrors.ts has unit tests

**Given** Phase 2 completion  
**When** `bun test --coverage` runs on use-cases  
**Then** use-cases coverage ≥70%  
**And** no new untested interactors are added without tests

### Phase 3 Criteria (80% Target — Final)

**Given** Phase 2 complete  
**When** Phase 3 is complete  
**Then** ALL packages achieve ≥80% line/branch/function coverage  
**And** adapters controllers (14 untested) have validation and delegation tests  
**And** adapters services have unit tests  
**And** frameworks DI modules and stores maintain ≥80% coverage  
**And** web app hooks/components have tests to reach ≥60%  
**And** `bunfig.toml` coverage thresholds are set to 0.80 for all metrics

**Given** Phase 3 complete  
**When** CI pipeline executes  
**Then** coverage check fails if any package drops below 80%  
**And** PR comments show coverage delta  
**And** no package is allowed to merge if coverage decreased

### Verification Criteria

**Given** any PR that modifies source code  
**When** CI runs  
**Then** `bun test --coverage` executes for affected packages  
**And** coverage artifacts are uploaded  
**And** coverage threshold check passes or PR is blocked

**Given** a developer adds a new use-case interactor  
**When** the interactor is merged  
**Then** it must have a co-located `*.test.ts` file  
**And** the test must cover at least the happy path and one error path

**Given** coverage enforcement is active  
**When** coverage drops below threshold  
**Then** CI job fails with clear message indicating which package failed  
**And** coverage report is attached as artifact

### Test Quality Criteria

**Given** any test file added  
**When** it is reviewed  
**Then** it follows the `[UNIT]` or `[INTEGRATION]` tag pattern  
**And** it uses co-located placement (`.test.ts` next to source) for domain/use-cases  
**And** it uses `__tests__/` directory for adapters  
**And** it uses `mock()` from `bun:test` (not Jest patterns)  
**And** it tests `Result<T,E>` via `result.kind === "ok"/"err"` branching

### Exclusions Verification

**Given** coverage report runs  
**When** it calculates coverage metrics  
**Then** files matching `packages/frameworks/src/prisma/lib/**` are excluded  
**And** files matching `apps/seed/**` are excluded  
**And** `*.d.ts` files are excluded  
**And** `dist/**` files are excluded

## Exclusions

Prisma auto-generated client code is **excluded** from coverage calculations:

- `packages/frameworks/src/prisma/lib/models/*` (all model files)
- `packages/frameworks/src/prisma/lib/client.ts`, `lib/browser.ts`
- `packages/frameworks/src/prisma/lib/enums.ts`, `lib/commonInputTypes.ts`, `lib/models.ts`

These are derived from the Prisma schema and re-generated on `prisma generate`. Testing them provides no meaningful coverage of business logic.

## Architecture Overview

### Solution Strategy

Implement coverage in three phased stages, prioritizing by dependency order and test difficulty:

1. **Phase 1 (60% target):** Quick wins with low dependency — shared package constants, domain value objects, adapter mappers
2. **Phase 2 (70% target):** High-risk interactors — use-case layer (64 untested interactors) using `runAsResult()` helper for Effect-based patterns
3. **Phase 3 (80% target):** Complex adapters — controllers, services, frameworks utilities, web hooks

**Dependency chain for test writing order:**

```
shared (design-tokens) → domain (value-objects) → adapters (mappers) → adapters (controllers) → use-cases (interactors)
```

### Key Architectural Decisions

1. **Two result patterns to handle:**
   - `Result<Output, string>` (older interactors) — use `result.kind === "ok"/"err"` branching
   - `Effect.Effect<Output, UseCaseError>` (newer interactors) — use `runAsResult()` helper wrapping `Effect.runPromise()`

2. **Full port mock requirement:** All repository port methods must be implemented in mocks; partial mocks cause runtime errors

3. **Tag convention enforced:** All unit tests tagged `[UNIT]`; integration tests (DB-dependent) tagged `[INTEGRATION]`

4. **Exclusions maintained:** Prisma auto-generated code, seed scripts, native app, barrel exports, type declarations — excluded from coverage

5. **No router integration tests:** Routers require full tRPC stack; covered by separate task

6. **CI enforcement at Phase 3:** `bunfig.toml` thresholds set to 0.80 for line/branch/function metrics

### Expected Changes

#### packages/shared — 5 new test files

- `design-tokens/borderRadius.test.ts`, `design-tokens/spacing.test.ts`
- `design-tokens/typography.test.ts`, `design-tokens/colors.test.ts`
- `tripInfo/types.test.ts`

#### packages/domain — 18 new test files

- 16 value objects: `ChallengeId.test.ts`, `TripId.test.ts`, `SponsorId.test.ts`, `LocationId.test.ts`, `GroupId.test.ts`, `RewardId.test.ts`, `NotificationId.test.ts`, `CoinTransactionId.test.ts`, `NotificationScheduleId.test.ts`, `SubmissionReportId.test.ts`, `UserId.test.ts`, `ActivityFeedId.test.ts`, `CoinAmount.test.ts`, `Email.test.ts`, `PhoneNumber.test.ts`, `ChallengeSlug.test.ts`
- 2 entities: `Sponsor.test.ts`, `NotificationSchedule.test.ts`

#### packages/use-cases — ~72 new test files

- CRUD interactors (25): Create/Get/Update/Delete for Group, Location, Reward, Sponsor, Submission, Activity, Report
- Notification interactors (12): Create/Update/Delete/GetNotificationSchedule*, Toggle*, Bulk\*
- Voting interactors (7): SubmitVote*, GetVotes*, ForceEndVoting
- Coin/Transaction interactors (9): GetCoinTransactions, GetPurchaseHistory, Update*Status, Get*Stats
- Sharing/Trip/Admin (8): UpdateSharing*, Add/RemoveSharingUser, Link/UnlinkSponsor*, GetMostActive*, ListSubmissions*, SetRewardHidden, AddReaction
- Utilities (3): `UseCaseErrors.test.ts`, `pagination.test.ts`, `error-helpers.test.ts`

#### packages/adapters — ~35 new test files

- Mappers (12): NotificationSchedule, ChallengeSubmission, ActivityFeed, Reward, Trip, SubmissionReport, ChallengeVote, Location, Group, Notification, Sponsor
- Controllers (15): challenge, user, storage, submissionReport, notification-schedule, group, notification-delivery, location, reward, challengeSubmission, notification, sponsor, challengeVote, activityFeed, trip
- Services (9): notificationService, PrismaCoinService, PrismaNotificationSenderService, PrismaRankingActivityService, PrismaCoinTransactionService, PrismaRewardService, PrismaTripAccessChecker, PrismaGroupCoinsService, PrismaTripPointsCalculator
- trpc-utils (4): controller-result-handler, storage, tripGuards

#### packages/frameworks — ~12 new test files

- DI (5): types.test.ts, scope.test.ts, container.test.ts, test-container.test.ts, AppModule.test.ts
- Factories (3): auth.test.ts, services.test.ts, repositories.test.ts
- Auth (2): authHooks.test.ts, types.test.ts
- tRPC (2): invalidationUtils.test.ts, router-factory.test.ts

#### apps/web — ~6 new test files

- lib (6): auth.test.ts, logout.test.ts, env.test.ts, supabase.test.ts, augment fileValidation.test.ts and toast.test.ts

**Total new test files: ~148**

## Implementation Process

### Implementation Summary Table

| Step | Package                                 | Files | Difficulty  | Phase Target | Subtotal | Parallel With | Agent  |
| ---- | --------------------------------------- | ----- | ----------- | ------------ | -------- | ------------- | ------ |
| 1    | packages/shared                         | 5     | Easy        | Phase 1      | 5        | 2, 3, 4, 5    | haiku  |
| 2    | packages/domain (VOs)                   | 16    | Easy        | Phase 1      | 21       | 1, 3, 4, 5    | haiku  |
| 3    | packages/domain (entities/utils)        | 3     | Medium      | Phase 1      | 24       | 1, 2, 4, 5    | haiku  |
| 4    | packages/adapters (mappers)             | 12    | Easy        | Phase 1      | 36       | 1, 2, 3, 5    | haiku  |
| 5    | packages/use-cases (utilities)          | 3     | Medium      | Phase 1      | 39       | 1, 2, 3, 4    | sonnet |
| 6    | packages/use-cases (CRUD)               | 25    | Medium      | Phase 2      | 64       | 7, 8, 9, 10   | sonnet |
| 7    | packages/use-cases (notifications)      | 12    | Medium      | Phase 2      | 76       | 6, 8, 9, 10   | sonnet |
| 8    | packages/use-cases (voting)             | 7     | Medium      | Phase 2      | 83       | 6, 7, 9, 10   | sonnet |
| 9    | packages/use-cases (coin/transaction)   | 9     | Medium      | Phase 2      | 92       | 6, 7, 8, 10   | sonnet |
| 10   | packages/use-cases (sharing/trip/admin) | 8     | Medium      | Phase 2      | 100      | 6, 7, 8, 9    | sonnet |
| 11   | packages/adapters (controllers)         | 15    | Medium      | Phase 3      | 115      | 12, 13, 14    | sonnet |
| 12   | packages/adapters (services)            | 9     | Medium      | Phase 3      | 124      | 11, 13, 14    | sonnet |
| 13   | packages/adapters (trpc-utils)          | 4     | Easy        | Phase 3      | 128      | 11, 12, 14    | haiku  |
| 14   | packages/frameworks                     | 12    | Easy-Medium | Phase 3      | 140      | 11, 12, 13    | haiku  |
| 15   | apps/web                                | 6     | Easy        | Phase 3      | 146      | —             | haiku  |

**Grand Total: 146 files**

### Agent Recommendations

| Agent  | Use For                                        | Steps                     |
| ------ | ---------------------------------------------- | ------------------------- |
| haiku  | Pure constant/object tests, simple utilities   | 1, 2, 3, 4, 13, 14, 15    |
| sonnet | Complex interactors, controllers, pattern work | 5, 6, 7, 8, 9, 10, 11, 12 |

**Rationale:**

- **haiku**: Value objects, mappers, trpc-utils, frameworks DI, web lib — all are straightforward unit tests with minimal business logic complexity
- **sonnet**: Utilities establish testing patterns, interactors have Effect/Result complexity, controllers need validation+delegation patterns

---

### Step 1: Test packages/shared (5 files)

**Goal:** Establish coverage baseline for shared constants and types

**Output:**

- `packages/shared/src/design-tokens/borderRadius.test.ts`
- `packages/shared/src/design-tokens/spacing.test.ts`
- `packages/shared/src/design-tokens/typography.test.ts`
- `packages/shared/src/design-tokens/colors.test.ts`
- `packages/shared/src/tripInfo/types.test.ts`

**Success Criteria:**

- `bun test packages/shared` passes
- shared package coverage ≥60%

**Subtasks:**

1. Create `borderRadius.test.ts` for BR and BRS constants
2. Create `spacing.test.ts` for Spacing enum values
3. Create `typography.test.ts` for Typography variants
4. Create `colors.test.ts` for ColorPalette exports
5. Create `tripInfo/types.test.ts` for TripInfo types
6. Run `bun test --coverage packages/shared`
7. Verify coverage ≥60%

**Blockers:** None

**Parallel with:** Steps 2, 3, 4, 5

**Recommended agent:** haiku

**Risks:** None — pure constant exports

---

### Step 2: Test packages/domain Value Objects (16 files)

**Goal:** Achieve 100% VO coverage, contributing to domain ≥88% target

**Output:**

- `packages/domain/src/value-objects/ChallengeId.test.ts`
- `packages/domain/src/value-objects/TripId.test.ts`
- `packages/domain/src/value-objects/SponsorId.test.ts`
- `packages/domain/src/value-objects/LocationId.test.ts`
- `packages/domain/src/value-objects/GroupId.test.ts`
- `packages/domain/src/value-objects/RewardId.test.ts`
- `packages/domain/src/value-objects/NotificationId.test.ts`
- `packages/domain/src/value-objects/CoinTransactionId.test.ts`
- `packages/domain/src/value-objects/NotificationScheduleId.test.ts`
- `packages/domain/src/value-objects/SubmissionReportId.test.ts`
- `packages/domain/src/value-objects/UserId.test.ts`
- `packages/domain/src/value-objects/ActivityFeedId.test.ts`
- `packages/domain/src/value-objects/CoinAmount.test.ts`
- `packages/domain/src/value-objects/Email.test.ts`
- `packages/domain/src/value-objects/PhoneNumber.test.ts`
- `packages/domain/src/value-objects/ChallengeSlug.test.ts`

**Success Criteria:**

- All 16 VO tests pass
- domain package coverage ≥88%

**Subtasks:**

1. Test ChallengeId creation and validation
2. Test TripId creation and validation
3. Test SponsorId creation and validation
4. Test LocationId creation and validation
5. Test GroupId creation and validation
6. Test RewardId creation and validation
7. Test NotificationId creation and validation
8. Test CoinTransactionId creation and validation
9. Test NotificationScheduleId creation and validation
10. Test SubmissionReportId creation and validation
11. Test UserId creation and validation
12. Test ActivityFeedId creation and validation
13. Test CoinAmount creation and validation
14. Test Email creation and validation
15. Test PhoneNumber creation and validation
16. Test ChallengeSlug creation and validation

**Blockers:** None

**Parallel with:** Steps 1, 3, 4, 5

**Recommended agent:** haiku

**Risks:** None — VOs are immutable, single-responsibility

---

### Step 3: Test packages/domain Entities and Utilities (3 files)

**Goal:** Complete domain entity coverage per Phase 1 criteria

**Output:**

- `packages/domain/src/entities/Sponsor/Sponsor.test.ts`
- `packages/domain/src/entities/NotificationSchedule/NotificationSchedule.test.ts`
- `packages/domain/src/utils/validation.test.ts`

**Success Criteria:**

- All entity tests pass
- validation.ts utility covered

**Subtasks:**

1. Create Sponsor entity tests (creation, validation, update methods)
2. Create NotificationSchedule entity tests (creation, scheduling logic)
3. Create validation.ts tests (all validation functions)
4. Run domain package tests

**Blockers:** None

**Parallel with:** Steps 1, 2, 4, 5

**Recommended agent:** haiku

**Risks:** None — entity patterns already established in existing tests

---

### Step 4: Test packages/adapters Mappers (12 files)

**Goal:** Ensure all adapter mappers have round-trip transformation tests

**Output:**

- `packages/adapters/src/mappers/NotificationScheduleMapper.test.ts`
- `packages/adapters/src/mappers/ChallengeSubmissionMapper.test.ts`
- `packages/adapters/src/mappers/ActivityFeedMapper.test.ts`
- `packages/adapters/src/mappers/RewardMapper.test.ts`
- `packages/adapters/src/mappers/TripMapper.test.ts`
- `packages/adapters/src/mappers/SubmissionReportMapper.test.ts`
- `packages/adapters/src/mappers/ChallengeVoteMapper.test.ts`
- `packages/adapters/src/mappers/LocationMapper.test.ts`
- `packages/adapters/src/mappers/GroupMapper.test.ts`
- `packages/adapters/src/mappers/NotificationMapper.test.ts`
- `packages/adapters/src/mappers/SponsorMapper.test.ts`
- `packages/adapters/src/mappers/TripMapper.test.ts`

**Success Criteria:**

- All mapper round-trip tests pass (domain → prisma → domain)
- adapters coverage ≥55%

**Subtasks:**

1. Create NotificationScheduleMapper round-trip test
2. Create ChallengeSubmissionMapper round-trip test
3. Create ActivityFeedMapper round-trip test
4. Create RewardMapper round-trip test
5. Create TripMapper round-trip test
6. Create SubmissionReportMapper round-trip test
7. Create ChallengeVoteMapper round-trip test
8. Create LocationMapper round-trip test
9. Create GroupMapper round-trip test
10. Create NotificationMapper round-trip test
11. Create SponsorMapper round-trip test
12. Run adapters tests and verify ≥55% coverage

**Blockers:** None

**Parallel with:** Steps 1, 2, 3, 5

**Recommended agent:** haiku

**Risks:** None — mappers are pure transformation functions

---

### Step 5: Test packages/use-cases Utilities (3 files)

**Goal:** Establish testing patterns for use-case helpers before interactor testing

**Output:**

- `packages/use-cases/src/utils/UseCaseErrors.test.ts`
- `packages/use-cases/src/utils/pagination.test.ts`
- `packages/use-cases/src/utils/error-helpers.test.ts`

**Success Criteria:**

- All utility tests pass
- Pattern established for Effect-based result handling

**Subtasks:**

1. Create UseCaseErrors test covering all error types
2. Create pagination test covering PaginationInput/Output
3. Create error-helpers test covering result transformation
4. Verify `runAsResult()` helper works consistently

**Blockers:** None

**Parallel with:** Steps 1, 2, 3, 4

**Recommended agent:** sonnet

**Risks:** Need `runAsResult()` helper finalized for Effect patterns

---

### Step 6: Test packages/use-cases CRUD Interactors (25 files)

**Goal:** Achieve 70% target by covering highest-risk orchestration layer

**Output:**

- `packages/use-cases/src/interactors/group/CreateGroup.test.ts`
- `packages/use-cases/src/interactors/group/GetGroup.test.ts`
- `packages/use-cases/src/interactors/group/UpdateGroup.test.ts`
- `packages/use-cases/src/interactors/group/DeleteGroup.test.ts`
- `packages/use-cases/src/interactors/location/CreateLocation.test.ts`
- `packages/use-cases/src/interactors/location/GetLocation.test.ts`
- `packages/use-cases/src/interactors/location/UpdateLocation.test.ts`
- `packages/use-cases/src/interactors/location/DeleteLocation.test.ts`
- `packages/use-cases/src/interactors/reward/CreateReward.test.ts`
- `packages/use-cases/src/interactors/reward/GetReward.test.ts`
- `packages/use-cases/src/interactors/reward/UpdateReward.test.ts`
- `packages/use-cases/src/interactors/reward/DeleteReward.test.ts`
- `packages/use-cases/src/interactors/sponsor/CreateSponsor.test.ts`
- `packages/use-cases/src/interactors/sponsor/GetSponsor.test.ts`
- `packages/use-cases/src/interactors/sponsor/UpdateSponsor.test.ts`
- `packages/use-cases/src/interactors/sponsor/DeleteSponsor.test.ts`
- `packages/use-cases/src/interactors/submission/CreateSubmission.test.ts`
- `packages/use-cases/src/interactors/submission/GetSubmission.test.ts`
- `packages/use-cases/src/interactors/submission/UpdateSubmission.test.ts`
- `packages/use-cases/src/interactors/submission/DeleteSubmission.test.ts`
- `packages/use-cases/src/interactors/activity/CreateActivity.test.ts`
- `packages/use-cases/src/interactors/activity/GetActivity.test.ts`
- `packages/use-cases/src/interactors/report/CreateReport.test.ts`
- `packages/use-cases/src/interactors/report/GetReport.test.ts`
- `packages/use-cases/src/interactors/report/UpdateReport.test.ts`

**Success Criteria:**

- At least 20 of 25 CRUD interactor tests pass
- use-cases coverage ≥60% (interim)

**Subtasks:**

1. Create mock repositories for each entity type
2. Write happy-path tests for Create\* interactors
3. Write error-path tests (not found, validation failure)
4. Write happy-path tests for Get\* interactors
5. Write Update* and Delete* tests
6. Run use-cases tests

**Blockers:** Step 5 complete

**Parallel with:** Steps 7, 8, 9, 10

**Recommended agent:** sonnet

**Risks:**

- Port mock must implement ALL methods (partial mocks cause runtime errors)
- Effect vs Result pattern inconsistency across interactors

---

### Step 7: Test packages/use-cases Notification Interactors (12 files)

**Goal:** Cover notification scheduling and delivery orchestration

**Output:**

- `packages/use-cases/src/interactors/notification/CreateNotification.test.ts`
- `packages/use-cases/src/interactors/notification/GetNotification.test.ts`
- `packages/use-cases/src/interactors/notification/UpdateNotification.test.ts`
- `packages/use-cases/src/interactors/notification/DeleteNotification.test.ts`
- `packages/use-cases/src/interactors/notification/GetNotificationSchedule.test.ts`
- `packages/use-cases/src/interactors/notification/UpdateNotificationSchedule.test.ts`
- `packages/use-cases/src/interactors/notification/ToggleNotification.test.ts`
- `packages/use-cases/src/interactors/notification/BulkCreateNotifications.test.ts`
- `packages/use-cases/src/interactors/notification/BulkDeleteNotifications.test.ts`

**Success Criteria:**

- All 9 notification interactor tests pass
- use-cases coverage ≥65%

**Subtasks:**

1. Create notification repository mocks
2. Test CreateNotification with scheduling
3. Test GetNotification variants
4. Test UpdateNotification status changes
5. Test ToggleNotification enable/disable
6. Test BulkCreate/BulkDelete batch operations
7. Test GetNotificationSchedule and UpdateNotificationSchedule

**Blockers:** Step 5 complete

**Parallel with:** Steps 6, 8, 9, 10

**Recommended agent:** sonnet

**Risks:** Notification scheduling has time-based logic (mock Date)

---

### Step 8: Test packages/use-cases Voting Interactors (7 files)

**Goal:** Cover voting submission and tallying logic

**Output:**

- `packages/use-cases/src/interactors/voting/SubmitVote.test.ts`
- `packages/use-cases/src/interactors/voting/GetVotes.test.ts`
- `packages/use-cases/src/interactors/voting/GetVoteStats.test.ts`
- `packages/use-cases/src/interactors/voting/ForceEndVoting.test.ts`
- `packages/use-cases/src/interactors/voting/GetActiveVoting.test.ts`
- `packages/use-cases/src/interactors/voting/CloseVoting.test.ts`
- `packages/use-cases/src/interactors/voting/OpenVoting.test.ts`

**Success Criteria:**

- All 7 voting interactor tests pass
- Voting logic coverage complete

**Subtasks:**

1. Create voting port mocks (ChallengeRepository)
2. Test SubmitVote (duplicate prevention, validation)
3. Test GetVotes with filters
4. Test GetVoteStats aggregation
5. Test ForceEndVoting admin action
6. Test OpenVoting/CloseVoting state transitions
7. Test GetActiveVoting query

**Blockers:** Step 5 complete

**Parallel with:** Steps 6, 7, 9, 10

**Recommended agent:** sonnet

**Risks:** Voting state machine has multiple edge cases

---

### Step 9: Test packages/use-cases Coin/Transaction Interactors (9 files)

**Goal:** Cover coin balance and transaction flow logic

**Output:**

- `packages/use-cases/src/interactors/coin/GetCoinTransactions.test.ts`
- `packages/use-cases/src/interactors/coin/GetPurchaseHistory.test.ts`
- `packages/use-cases/src/interactors/coin/UpdateCoinTransactionStatus.test.ts`
- `packages/use-cases/src/interactors/coin/UpdateCoinPurchaseStatus.test.ts`
- `packages/use-cases/src/interactors/coin/GetCoinStats.test.ts`
- `packages/use-cases/src/interactors/coin/GetCoinBalance.test.ts`
- `packages/use-cases/src/interactors/coin/GetSpendingStats.test.ts`
- `packages/use-cases/src/interactors/coin/GetTopSpenders.test.ts`

**Success Criteria:**

- All 8 coin interactor tests pass
- Transaction flow coverage complete

**Subtasks:**

1. Create coin transaction repository mocks
2. Test GetCoinTransactions with pagination
3. Test GetPurchaseHistory filtering
4. Test UpdateCoinTransactionStatus state machine
5. Test GetCoinStats aggregation queries
6. Test GetCoinBalance edge cases (zero, negative)
7. Test GetTopSpenders ranking logic
8. Verify use-cases ≥70% coverage

**Blockers:** Step 5 complete

**Parallel with:** Steps 6, 7, 8, 10

**Recommended agent:** sonnet

**Risks:** Financial calculations have precision edge cases

---

### Step 10: Test packages/use-cases Sharing/Trip/Admin Interactors (8 files)

**Goal:** Complete Phase 2 by covering sharing, sponsor linking, and admin operations

**Output:**

- `packages/use-cases/src/interactors/sharing/UpdateSharingPolicy.test.ts`
- `packages/use-cases/src/interactors/sharing/GetSharingSettings.test.ts`
- `packages/use-cases/src/interactors/sharing/AddSharingUser.test.ts`
- `packages/use-cases/src/interactors/sharing/RemoveSharingUser.test.ts`
- `packages/use-cases/src/interactors/sponsor/LinkSponsor.test.ts`
- `packages/use-cases/src/interactors/sponsor/UnlinkSponsor.test.ts`
- `packages/use-cases/src/interactors/admin/GetMostActiveTrips.test.ts`
- `packages/use-cases/src/interactors/admin/ListSubmissions.test.ts`
- `packages/use-cases/src/interactors/admin/SetRewardHidden.test.ts`
- `packages/use-cases/src/interactors/admin/AddReaction.test.ts`

**Success Criteria:**

- All sharing/trip/admin tests pass
- use-cases coverage ≥70% (Phase 2 complete)

**Subtasks:**

1. Create sharing and sponsor port mocks
2. Test UpdateSharingPolicy validation
3. Test AddSharingUser/RemoveSharingUser
4. Test LinkSponsor/UnlinkSponsor
5. Test GetMostActiveTrips aggregation
6. Test ListSubmissions filtering
7. Test SetRewardHidden visibility toggle
8. Test AddReaction

**Blockers:** Step 5 complete

**Parallel with:** Steps 6, 7, 8, 9

**Recommended agent:** sonnet

**Risks:** Admin operations may require special authorization context

---

### Step 11: Test packages/adapters Controllers (15 files)

**Goal:** Achieve 80% target for adapters layer

**Output:**

- `packages/adapters/src/controllers/challenge-controller.test.ts`
- `packages/adapters/src/controllers/user-controller.test.ts`
- `packages/adapters/src/controllers/storage-controller.test.ts`
- `packages/adapters/src/controllers/submission-report-controller.test.ts`
- `packages/adapters/src/controllers/notification-schedule-controller.test.ts`
- `packages/adapters/src/controllers/group-controller.test.ts`
- `packages/adapters/src/controllers/notification-delivery-controller.test.ts`
- `packages/adapters/src/controllers/location-controller.test.ts`
- `packages/adapters/src/controllers/reward-controller.test.ts`
- `packages/adapters/src/controllers/challenge-submission-controller.test.ts`
- `packages/adapters/src/controllers/notification-controller.test.ts`
- `packages/adapters/src/controllers/sponsor-controller.test.ts`
- `packages/adapters/src/controllers/challenge-vote-controller.test.ts`
- `packages/adapters/src/controllers/activity-feed-controller.test.ts`
- `packages/adapters/src/controllers/trip-controller.test.ts`

**Success Criteria:**

- All 15 controller tests pass (validation + delegation)
- adapters coverage ≥75%

**Subtasks:**

1. Create controller mocks for use-case ports
2. Test input validation for each controller
3. Test error delegation (Result error → TRPCError)
4. Test success delegation (Result ok → response)
5. Test validation error formatting
6. Run adapters tests

**Blockers:** Steps 6-10 complete (Phase 2)

**Parallel with:** Steps 12, 13

**Recommended agent:** sonnet

**Risks:** Controller error handling varies by error type

---

### Step 12: Test packages/adapters Services (9 files)

**Goal:** Complete service layer coverage for adapters

**Output:**

- `packages/adapters/src/services/notification-service.test.ts`
- `packages/adapters/src/services/prisma-coin-service.test.ts`
- `packages/adapters/src/services/prisma-notification-sender-service.test.ts`
- `packages/adapters/src/services/prisma-ranking-activity-service.test.ts`
- `packages/adapters/src/services/prisma-coin-transaction-service.test.ts`
- `packages/adapters/src/services/prisma-reward-service.test.ts`
- `packages/adapters/src/services/prisma-trip-access-checker.test.ts`
- `packages/adapters/src/services/prisma-group-coins-service.test.ts`
- `packages/adapters/src/services/prisma-trip-points-calculator.test.ts`

**Success Criteria:**

- All 9 service tests pass
- Service layer coverage complete

**Subtasks:**

1. Create Prisma client mocks
2. Test NotificationService send logic
3. Test PrismaCoinService balance calculations
4. Test PrismaNotificationSenderService delivery logic
5. Test PrismaRankingActivityService ranking aggregation
6. Test remaining services with appropriate mocks

**Blockers:** Steps 6-10 complete (Phase 2)

**Parallel with:** Steps 11, 13

**Recommended agent:** sonnet

**Risks:** Service methods may have DB-specific query edge cases

---

### Step 13: Test packages/adapters trpc-utils (4 files)

**Goal:** Complete adapters utils coverage

**Output:**

- `packages/adapters/src/trpc-utils/controller-result-handler.test.ts`
- `packages/adapters/src/trpc-utils/storage.test.ts`
- `packages/adapters/src/trpc-utils/trip-guards.test.ts`

**Success Criteria:**

- All trpc-utils tests pass

**Subtasks:**

1. Test controller result handler (Result → TRPC response)
2. Test storage helpers
3. Test trip access guards

**Blockers:** Steps 6-10 complete (Phase 2)

**Parallel with:** Steps 11, 12

**Recommended agent:** haiku

**Risks:** None — utility functions

---

### Step 14: Test packages/frameworks (12 files)

**Goal:** Complete frameworks layer coverage

**Output:**

- `packages/frameworks/src/di/types.test.ts`
- `packages/frameworks/src/di/scope.test.ts`
- `packages/frameworks/src/di/container.test.ts`
- `packages/frameworks/src/di/test-container.test.ts`
- `packages/frameworks/src/di/AppModule.test.ts`
- `packages/frameworks/src/factories/auth.test.ts`
- `packages/frameworks/src/factories/services.test.ts`
- `packages/frameworks/src/factories/repositories.test.ts`
- `packages/frameworks/src/auth/auth-hooks.test.ts`
- `packages/frameworks/src/auth/types.test.ts`
- `packages/frameworks/src/trpc/invalidation-utils.test.ts`
- `packages/frameworks/src/trpc/router-factory.test.ts`

**Success Criteria:**

- All 12 frameworks tests pass
- frameworks coverage ≥80%

**Subtasks:**

1. Test DI types and scope enums
2. Test container resolution and lifetime
3. Test test-container factory helpers
4. Test AppModule composition
5. Test auth factory
6. Test service factory
7. Test repository factory
8. Test auth hooks
9. Test auth types
10. Test tRPC invalidation utils
11. Test router factory

**Blockers:** Steps 6-10 complete (Phase 2)

**Parallel with:** — (runs after Phase 2)

**Recommended agent:** haiku

**Risks:** DI container state management between tests

---

### Step 15: Test apps/web (6 files)

**Goal:** Achieve ≥60% web app coverage per Phase 3 criteria

**Output:**

- `apps/web/src/lib/auth.test.ts`
- `apps/web/src/lib/logout.test.ts`
- `apps/web/src/lib/env.test.ts`
- `apps/web/src/lib/supabase.test.ts`
- `apps/web/src/lib/fileValidation.test.ts`
- `apps/web/src/lib/toast.test.ts`

**Success Criteria:**

- All 6 web tests pass
- web app coverage ≥60%

**Subtasks:**

1. Test auth helper functions
2. Test logout flow
3. Test environment validation
4. Test Supabase client initialization
5. Test file validation helpers
6. Test toast notification helpers

**Blockers:** None — web app tests are isolated

**Parallel with:** — (no dependencies, runs at any point in Phase 3)

**Recommended agent:** haiku

**Risks:** Supabase client may require mock setup

---

## Parallelization

### Execution Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│ PHASE 1: Foundation (All steps run in PARALLEL - no dependencies between them)      │
│                                                                                     │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐            │
│   │ Step 1   │  │ Step 2   │  │ Step 3   │  │ Step 4   │  │ Step 5   │            │
│   │ shared   │  │ domain   │  │ domain   │  │ adapters │  │ use-cases│            │
│   │ 5 files  │  │ VOs      │  │ entities │  │ mappers  │  │ utilities│            │
│   │ haiku    │  │ 16 files │  │ 3 files  │  │ 12 files │  │ 3 files  │            │
│   └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘            │
│                                         │                                            │
│                                         ▼                                            │
├─────────────────────────────────────────────────────────────────────────────────────┤
│ PHASE 2: Use-Case Interactors (All steps run in PARALLEL after Step 5 completes) │
│                                                                                     │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐            │
│   │ Step 6   │  │ Step 7   │  │ Step 8   │  │ Step 9   │  │ Step 10  │            │
│   │ CRUD     │  │ notif-   │  │ voting   │  │ coin/    │  │ sharing/ │            │
│   │ 25 files │  │ ications  │  │ 7 files  │  │ trans    │  │ trip/    │            │
│   │          │  │ 12 files │  │          │  │ 9 files  │  │ admin    │            │
│   │ sonnet   │  │ sonnet   │  │ sonnet   │  │ sonnet   │  │ sonnet   │            │
│   └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘            │
│                                         │                                            │
│                                         ▼                                            │
├─────────────────────────────────────────────────────────────────────────────────────┤
│ PHASE 3: Adapters & Frameworks (Parallel execution where dependencies allow)       │
│                                                                                     │
│  WAVE 1 (after Phase 2):                                                              │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐                    │
│  │ Step 11         │  │ Step 12         │  │ Step 13         │                    │
│  │ controllers     │  │ services        │  │ trpc-utils      │                    │
│  │ 15 files        │  │ 9 files         │  │ 4 files         │                    │
│  │ sonnet          │  │ sonnet          │  │ haiku           │                    │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘                    │
│        │                       │                       │                              │
│        └───────────────────────┴───────────────────────┘                              │
│                                   │                                                   │
│                                   ▼                                                   │
│  WAVE 2 (after Wave 1):                                                             │
│  ┌──────────────────┐                                                             │
│  │ Step 14          │                                                             │
│  │ frameworks       │                                                             │
│  │ 12 files         │                                                             │
│  │ haiku            │                                                             │
│  └──────────────────┘                                                             │
│                                   │                                                   │
│                                   ▼                                                   │
│  WAVE 3 (independent after Phase 1):                                                │
│  ┌──────────────────┐                                                             │
│  │ Step 15          │                                                             │
│  │ apps/web         │                                                             │
│  │ 6 files          │                                                             │
│  │ haiku            │                                                             │
│  └──────────────────┘                                                             │
│                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### Parallelization Summary

| Phase          | Steps          | Parallel Execution                     | Max Concurrent Agents |
| -------------- | -------------- | -------------------------------------- | --------------------- |
| Phase 1        | 1, 2, 3, 4, 5  | All 5 run simultaneously               | 5 haiku + 1 sonnet    |
| Phase 2        | 6, 7, 8, 9, 10 | All 5 run simultaneously after Step 5  | 5 sonnet              |
| Phase 3 Wave 1 | 11, 12, 13     | All 3 run simultaneously after Phase 2 | 2 sonnet + 1 haiku    |
| Phase 3 Wave 2 | 14             | Runs after Wave 1                      | 1 haiku               |
| Phase 3 Wave 3 | 15             | Independent after Phase 1              | 1 haiku               |

### Dependency Chain

```
Phase 1 (Steps 1-5) → Phase 2 (Steps 6-10) → Phase 3 Wave 1 (Steps 11, 12, 13) → Phase 3 Wave 2 (Step 14)
                                                                                              ↑
                                                                                              │
Phase 1 ─────────────────────────────────────────────────────────────────────────────────────┘
                                                                                              ↑
                                                                                              │
                                                                                    Phase 3 Wave 3 (Step 15)
```

### Execution Order (for sequential reference)

For maximum speed, execute in this order:

1. **Wave A (Phase 1):** Steps 1, 2, 3, 4, 5 in parallel (5 agents)
2. **Wave B (Phase 2):** Steps 6, 7, 8, 9, 10 in parallel (5 agents)
3. **Wave C (Phase 3 Wave 1):** Steps 11, 12, 13 in parallel (3 agents)
4. **Wave D (Phase 3 Wave 2):** Step 14 alone (1 haiku agent) — depends on Phase 2
5. **Wave E (Phase 3 Wave 3):** Step 15 alone (1 haiku agent) — independent after Phase 1

**Total sequential waves: 5** (instead of 15 sequential steps)

---

## Sub-Agent Execution Directive

### Overview

Use `/sadd:launch-sub-agent` to dispatch independent steps to sub-agents for parallel execution. Each sub-agent receives isolated context and works independently.

### Agent Selection Guidelines

| Agent      | Use For                                        | Steps assign to agent     |
| ---------- | ---------------------------------------------- | ------------------------- |
| **haiku**  | Pure constant/object tests, simple utilities   | 1, 2, 3, 4, 13, 14, 15    |
| **sonnet** | Complex interactors, controllers, pattern work | 5, 6, 7, 8, 9, 10, 11, 12 |

### Sub-Agent Invocation Pattern

For each step, the sub-agent must receive:

1. **Step goal**: The specific output files and success criteria
2. **Files to create**: Exact list of `*.test.ts` files to produce
3. **Skill file path**: Path to relevant skill for test patterns
4. **Test patterns reference**: Location of existing tests to model after

### Wave-Based Execution

#### Wave A (Phase 1) — LAUNCH ALL 5 IN PARALLEL

```bash
/sadd:launch-sub-agent "Step 1: Test packages/shared (5 files)" --files "packages/shared/src/design-tokens/*.test.ts,packages/shared/src/tripInfo/types.test.ts" --agent haiku --context "See Step 1 in .specs/tasks/draft/increase-test-coverage-80-percent.test.md"

# ... launch Steps 2, 3, 4, 5 simultaneously
```

#### Wave B (Phase 2) — LAUNCH ALL 5 IN PARALLEL (after Wave A completes)

```bash
/sadd:launch-sub-agent "Step 6: Test packages/use-cases CRUD interactors (25 files)" --files "packages/use-cases/src/interactors/group/*.test.ts,packages/use-cases/src/interactors/location/*.test.ts,..." --agent sonnet --context "See Step 6 in .specs/tasks/draft/increase-test-coverage-80-percent.test.md"

# ... launch Steps 7, 8, 9, 10 simultaneously
```

#### Wave C (Phase 3 Wave 1) — LAUNCH ALL 3 IN PARALLEL (after Wave B completes)

```bash
/sadd:launch-sub-agent "Step 11: Test packages/adapters Controllers (15 files)" --files "packages/adapters/src/controllers/*-controller.test.ts" --agent sonnet --context "See Step 11 in .specs/tasks/draft/increase-test-coverage-80-percent.test.md"

/sadd:launch-sub-agent "Step 12: Test packages/adapters Services (9 files)" --files "packages/adapters/src/services/*.test.ts" --agent sonnet --context "See Step 12 in .specs/tasks/draft/increase-test-coverage-80-percent.test.md"

/sadd:launch-sub-agent "Step 13: Test packages/adapters trpc-utils (4 files)" --files "packages/adapters/src/trpc-utils/*.test.ts" --agent haiku --context "See Step 13 in .specs/tasks/draft/increase-test-coverage-80-percent.test.md"
```

#### Wave D (Phase 3 Wave 2) — LAUNCH AFTER WAVE C COMPLETES

```bash
/sadd:launch-sub-agent "Step 14: Test packages/frameworks (12 files)" --files "packages/frameworks/src/di/*.test.ts,packages/frameworks/src/factories/*.test.ts,packages/frameworks/src/auth/*.test.ts,packages/frameworks/src/trpc/*.test.ts" --agent haiku --context "See Step 14 in .specs/tasks/draft/increase-test-coverage-80-percent.test.md"
```

#### Wave E (Phase 3 Wave 3) — INDEPENDENT AFTER PHASE 1

```bash
/sadd:launch-sub-agent "Step 15: Test apps/web (6 files)" --files "apps/web/src/lib/*.test.ts" --agent haiku --context "See Step 15 in .specs/tasks/draft/increase-test-coverage-80-percent.test.md"
```

### Sub-Agent Context Requirements

Each sub-agent must have access to:

- **Skill file**: `/Users/rafalopilowski/.agents/skills/sdd-plan/SKILL.md` (for implementation guidance)
- **Test patterns**: Existing tests in `packages/domain/src/**/*.test.ts` (for domain VOs/entities)
- **Use-case patterns**: `packages/use-cases/src/**/*.test.ts` (for interactors)
- **Adapter patterns**: `packages/adapters/src/__tests__/*.test.ts` (for controllers/services)
- **This task file**: `.specs/tasks/draft/increase-test-coverage-80-percent.test.md` (full specification)

### Files Per Step Reference

| Step | Files to Create                                                                                                                            | Count |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------ | ----- |
| 1    | `packages/shared/src/design-tokens/*.test.ts` + `tripInfo/types.test.ts`                                                                   | 5     |
| 2    | `packages/domain/src/value-objects/*Id.test.ts` + `CoinAmount.test.ts` + `Email.test.ts` + `PhoneNumber.test.ts` + `ChallengeSlug.test.ts` | 16    |
| 3    | `packages/domain/src/entities/Sponsor/Sponsor.test.ts` + `NotificationSchedule.test.ts` + `utils/validation.test.ts`                       | 3     |
| 4    | `packages/adapters/src/mappers/*Mapper.test.ts`                                                                                            | 12    |
| 5    | `packages/use-cases/src/utils/UseCaseErrors.test.ts` + `pagination.test.ts` + `error-helpers.test.ts`                                      | 3     |
| 6    | `packages/use-cases/src/interactors/{group,location,reward,sponsor,submission,activity,report}/*.test.ts`                                  | 25    |
| 7    | `packages/use-cases/src/interactors/notification/*.test.ts`                                                                                | 12    |
| 8    | `packages/use-cases/src/interactors/voting/*.test.ts`                                                                                      | 7     |
| 9    | `packages/use-cases/src/interactors/coin/*.test.ts`                                                                                        | 8     |
| 10   | `packages/use-cases/src/interactors/{sharing,sponsor,admin}/*.test.ts`                                                                     | 10    |
| 11   | `packages/adapters/src/controllers/*-controller.test.ts`                                                                                   | 15    |
| 12   | `packages/adapters/src/services/*.test.ts`                                                                                                 | 9     |
| 13   | `packages/adapters/src/trpc-utils/*.test.ts`                                                                                               | 4     |
| 14   | `packages/frameworks/src/{di/*,factories/*,auth/*,trpc/*}.test.ts`                                                                         | 12    |
| 15   | `apps/web/src/lib/*.test.ts`                                                                                                               | 6     |

---

## Verification

### Verification Levels by Step

| Level      | Description                                 | Steps                    |
| ---------- | ------------------------------------------- | ------------------------ |
| **Panel**  | Critical path with 2-judge panel evaluation | 3, 5, 6, 7, 8, 9, 10, 11 |
| **Single** | Medium complexity, single judge evaluation  | 1, 2, 4, 12, 14, 15      |
| **None**   | Trivial, self-verifying                     | 13                       |

### Custom Rubric for Test Artifacts

For all test files produced by this task:

```yaml
criteria:
  - name: "Result Pattern Correctness"
    description: "Tests use result.kind === 'ok'/'err' for old Result pattern, runAsResult() for Effect patterns. No throw/catch for error handling."
    weight: 0.25

  - name: "Tag Convention Compliance"
    description: "[UNIT] tags on pure tests, [INTEGRATION] tags on DB-dependent tests. Correct placement per layer."
    weight: 0.15

  - name: "Mock Completeness"
    description: "All port methods implemented in mock factories. No partial mocks causing runtime errors."
    weight: 0.20

  - name: "Coverage Threshold Met"
    description: "Phase targets achieved: 60% (Phase 1), 70% (Phase 2), 80% (Phase 3)"
    weight: 0.25

  - name: "Test Meaningfulness"
    description: "Tests verify actual behavior (not empty stubs). Happy path + error path. No .only or .skip in final code."
    weight: 0.15
```

### Per-Step Verification

#### Step 1: packages/shared (5 files)

**Verification Level:** Single  
**Threshold:** 3.5/5.0  
**Custom Rubric Additions:**

- Tests cover all constant exports (BR, BRS, Spacing, Typography, ColorPalette, TripInfo types)
- No mocking required (pure constants)
- Coverage ≥60% for shared package

#### Step 2: packages/domain VOs (16 files)

**Verification Level:** Single  
**Threshold:** 3.5/5.0  
**Custom Rubric Additions:**

- Each VO tested for creation success and validation failure
- No port mocks needed (VOs are pure)
- All 16 VO files have co-located tests

#### Step 3: packages/domain entities (3 files)

**Verification Level:** Panel  
**Threshold:** 4.0/5.0  
**Custom Rubric Additions:**

- Sponsor and NotificationSchedule entities test creation, validation, update methods
- validation.ts utility tests all validation functions
- Entity state transitions verified (not just method calls)

#### Step 4: packages/adapters mappers (12 files)

**Verification Level:** Single  
**Threshold:** 3.5/5.0  
**Custom Rubric Additions:**

- Round-trip tests: domain → prisma → domain preserves data
- No database calls (pure mappers)
- All 12 mapper files have tests

#### Step 5: packages/use-cases utilities (3 files)

**Verification Level:** Panel  
**Threshold:** 4.0/5.0  
**Custom Rubric Additions:**

- UseCaseErrors covers all error type mappings
- PaginationInput/Output handled correctly
- runAsResult() helper works for Effect-based interactors
- Establishes pattern for all subsequent interactor tests

#### Step 6: packages/use-cases CRUD (25 files)

**Verification Level:** Panel  
**Threshold:** 4.5/5.0  
**Custom Rubric Additions:**

- At least 20 of 25 CRUD interactor tests pass
- Happy path AND error path tested (not found, validation failure)
- All repository port methods implemented in mocks
- Coverage ≥60% interim, targeting ≥70% after Phase 2

#### Step 7: packages/use-cases notifications (12 files)

**Verification Level:** Panel  
**Threshold:** 4.5/5.0  
**Custom Rubric Additions:**

- Notification scheduling logic tested (time-based)
- Bulk operations (BulkCreate/BulkDelete) verified
- ToggleNotification enable/disable state changes

#### Step 8: packages/use-cases voting (7 files)

**Verification Level:** Panel  
**Threshold:** 4.5/5.0  
**Custom Rubric Additions:**

- Voting state machine tested (multiple states)
- Duplicate vote prevention verified
- GetVoteStats aggregation logic

#### Step 9: packages/use-cases coin/transaction (9 files)

**Verification Level:** Panel  
**Threshold:** 4.5/5.0  
**Custom Rubric Additions:**

- Financial calculation edge cases (zero, negative, precision)
- GetCoinBalance tested with boundary values
- Transaction state machine verified

#### Step 10: packages/use-cases sharing/trip/admin (10 files)

**Verification Level:** Panel  
**Threshold:** 4.5/5.0  
**Custom Rubric Additions:**

- Admin authorization context handled correctly
- LinkSponsor/UnlinkSponsor relationship changes verified
- GetMostActiveTrips aggregation logic

#### Step 11: packages/adapters controllers (15 files)

**Verification Level:** Panel  
**Threshold:** 4.5/5.0  
**Custom Rubric Additions:**

- Input validation for each controller tested
- Result error → TRPCError delegation verified
- Result ok → response delegation verified
- Validation error formatting

#### Step 12: packages/adapters services (9 files)

**Verification Level:** Single  
**Threshold:** 3.5/5.0  
**Custom Rubric Additions:**

- Prisma client mocks implemented
- Service layer business logic verified
- All 9 service files have tests

#### Step 13: packages/adapters trpc-utils (4 files)

**Verification Level:** None  
**Threshold:** N/A  
**Note:** Utility functions are self-verifying; no panel review needed.

#### Step 14: packages/frameworks (12 files)

**Verification Level:** Single  
**Threshold:** 3.5/5.0  
**Custom Rubric Additions:**

- DI container resolution and lifetime tested
- Test-container factory helpers verified
- Auth hooks and tRPC utils tested

#### Step 15: apps/web (6 files)

**Verification Level:** Single  
**Threshold:** 3.5/5.0  
**Custom Rubric Additions:**

- Auth, logout, env, supabase, fileValidation, toast tested
- Supabase client mock setup verified
- Web lib coverage ≥60%

### Verification Summary Table

| Step | Package                      | Phase | Files | Verification Level | Threshold | Critical Criteria                        |
| ---- | ---------------------------- | ----- | ----- | ------------------ | --------- | ---------------------------------------- |
| 1    | shared                       | 1     | 5     | Single             | 3.5       | Coverage ≥60%, all constants tested      |
| 2    | domain VOs                   | 1     | 16    | Single             | 3.5       | All 16 VOs have co-located tests         |
| 3    | domain entities              | 1     | 3     | Panel              | 4.0       | Entity methods, validation utility       |
| 4    | adapters mappers             | 1     | 12    | Single             | 3.5       | Round-trip transformation verified       |
| 5    | use-cases utils              | 1     | 3     | Panel              | 4.0       | Pattern established, runAsResult() works |
| 6    | use-cases CRUD               | 2     | 25    | Panel              | 4.5       | ≥20 tests pass, all ports mocked         |
| 7    | use-cases notifications      | 2     | 12    | Panel              | 4.5       | Scheduling, bulk operations              |
| 8    | use-cases voting             | 2     | 7     | Panel              | 4.5       | State machine, duplicate prevention      |
| 9    | use-cases coin/transaction   | 2     | 9     | Panel              | 4.5       | Financial edge cases                     |
| 10   | use-cases sharing/trip/admin | 2     | 10    | Panel              | 4.5       | Auth context, relationships              |
| 11   | adapters controllers         | 3     | 15    | Panel              | 4.5       | Validation + delegation patterns         |
| 12   | adapters services            | 3     | 9     | Single             | 3.5       | Service layer complete                   |
| 13   | adapters trpc-utils          | 3     | 4     | None               | N/A       | Trivial utility functions                |
| 14   | frameworks                   | 3     | 12    | Single             | 3.5       | DI patterns, auth, tRPC                  |
| 15   | apps/web                     | 3     | 6     | Single             | 3.5       | Web lib isolated functions               |

---

## Definition of Done

### Phase 1 Done (60% Target)

- [ ] shared package coverage ≥60%
- [ ] domain VOs (16 files) all tested
- [ ] domain entity NotificationSchedule tested
- [ ] domain validation.ts utility tested
- [ ] adapter mappers (12 files) all have round-trip tests
- [ ] `bun test packages/shared packages/domain packages/adapters --coverage` passes
- [ ] CI reports shared ≥60%, domain ≥88%, adapters ≥55%

### Phase 2 Done (70% Target)

- [ ] use-cases package coverage ≥70%
- [ ] At least 40 of 64 untested interactors have tests
- [ ] use-case UseCaseErrors, pagination, error-helpers all tested
- [ ] `bun test packages/use-cases --coverage` passes
- [ ] CI reports use-cases ≥70%

### Phase 3 Done (80% Target)

- [ ] ALL packages achieve ≥80% line/branch/function coverage
- [ ] adapters controllers (14 untested) all have validation + delegation tests
- [ ] adapters services all have unit tests
- [ ] frameworks DI modules and stores maintain ≥80%
- [ ] web app hooks/components achieve ≥60%
- [ ] `bunfig.toml` coverage thresholds set to 0.80
- [ ] `bun test --coverage` passes on all packages
- [ ] CI coverage check passes without failures

### Overall Task Done

1. `bun test --coverage` executes successfully on all target packages
2. Coverage artifacts uploaded to CI
3. No package is below 80% threshold
4. All ~146 test files created and passing
5. No regressions in existing tests
6. Coverage enforcement active in CI gate

---

## Implementation Notes

### Test File Placement

- Domain entities/VOs: Co-located `*.test.ts` next to source
- Use-cases: Co-located `*.test.ts` next to source
- Adapters: `__tests__/` directory for controllers/services
- Frameworks: Co-located `*.test.ts` next to source

### Tag Convention

- All unit tests tagged `[UNIT]`
- Integration tests tagged `[INTEGRATION]`

### Result Pattern Handling

- Old pattern: `Result<Output, string>` → use `result.kind === "ok"/"err"`
- New pattern: `Effect.Effect<Output, UseCaseError>` → use `runAsResult()`

### Mock Requirements

- All repository port methods must be implemented in mocks
- Partial mocks cause runtime errors during DI resolution

### Rough File-Level Coverage Estimates

| Package                  | Tests | Source Files | File Coverage |
| ------------------------ | ----- | ------------ | ------------- |
| packages/domain          | 15    | 17           | ~88% ✅       |
| packages/use-cases       | 17    | 89           | ~19% ❌       |
| packages/adapters        | 42    | 92           | ~45% ⚠️       |
| packages/frameworks      | 8     | ~20\*        | ~40% ⚠️       |
| packages/shared          | 0     | 5            | ~0% ❌        |
| apps/backend-server      | 3     | 3            | ~100% ✅      |
| apps/web                 | 18    | 90           | ~20% ❌       |
| apps/notification-sender | 2     | 1            | ~200% ✅      |
| apps/seed                | 0     | 15           | ~0% ❌        |

### Priority Gaps (by layer priority per DDD)

**1. Domain Layer (88% - AT TARGET)**

- 16 value objects missing tests (ChallengeId, TripId, SponsorId, etc.)
- 1 entity missing test: NotificationSchedule
- 1 util missing test: validation.ts

**2. Use Cases Layer (~19% - CRITICAL GAP)**

- 64 interactors without tests (only 14 have tests)
- 0 ports tested (interface files - acceptable)
- 0 utility tests (pagination.ts, error-helpers.ts)
- 0 error tests (UseCaseErrors.ts)

**3. Adapters Layer (~45% - NEEDS WORK)**

- 16 mappers without tests (only ChallengeMapper, UserMapper, CoinTransactionMapper, NotificationDeliveryMapper have tests)
- 16 controllers without tests (only coin-controller, coinTransaction-controller, authServer have tests)
- 16 gateways/Prisma repositories without tests (only PrismaChallengeRepository, PrismaUserRepository have tests)
- 8 services without tests
- 5 utils without tests
- BasePrismaRepository.ts untested

**4. Frameworks Layer (~40% excluding Prisma auto-generated - NEEDS WORK)**

- **EXCLUDED from coverage target**: Prisma auto-generated code (`packages/frameworks/src/prisma/lib/models/*`, `lib/client.ts`, `lib/browser.ts`, `lib/enums.ts`, `lib/commonInputTypes.ts`, `lib/models.ts`) — these are auto-derived from schema, not business logic
- DI module tests exist (4 files)
- Auth, storage, stores partially tested
- Missing: auth hooks, tRPC hooks, factories, prisma schema-helpers

**5. Apps**

- web (~20%): hooks and components need more tests
- seed (0%): seed scripts - low test priority
- native: has tests but uses Jest, not Bun
