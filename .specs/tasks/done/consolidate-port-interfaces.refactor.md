---
title: Consolidate all IPort interfaces into domain package
---

## Initial User Prompt

Some I...Port interfaces are in use-case package, some in domain package; move all of them into one package - the most appropriate for Clean Architecture

## Description

The codebase currently has port interfaces (IUserPort, ITripPort, etc.) defined in both the domain package and the use-cases package. This violates Clean Architecture principles and creates confusion about where new ports should be added.

**Clean Architecture Principle**: The domain layer should define WHAT operations exist (pure interfaces without dependencies), while the use-cases layer should define HOW to access them (Context.Tag for Effect DI).

This refactoring consolidates all IPort interfaces into the domain package as the single source of truth. The Context.Tag classes remain in the use-cases package but will import the interfaces from domain. Entity interfaces currently defined only in use-cases (Notification, PushSubscription, etc.) will be moved to the domain package.

**Affected Port Interfaces:**

- **Domain currently has (13)**: IUserPort, ITripPort, ISponsorPort, IGroupPort, IGroupJoinRequestPort, IRewardPort, IRewardPurchasePort, ILocationPort, IChallengePort, IActivityFeedPort, ICoinTransactionPort, ISubmissionReportPort, plus shared services (IAuthPort, IStoragePort, IRealtimePort)

- **Use-cases has (26) including duplicates**: IUserPort, ITripPort, ISponsorPort, ITripSponsorPort, ITripParticipantPort, ISubmissionReportPort, IRewardPort, IRewardPurchasePort, INotificationPort, IPushSubscriptionPort, INotificationSchedulePort, INotificationScheduleExecutionPort, INotificationDeliveryPort, INotificationServicePort, ILocationPort, ILocationSharingRequestPort, IChallengePort, IChallengeSubmissionPort, IChallengeVotePort, IActivityFeedPort, IActivityReactionPort, IGroupPort, IGroupJoinRequestPort, ICoinTransactionPort, IAuthServicePort, IStoragePort, IStoragePathResolverPort

- **Unique to use-cases (need to move)**: ~14 ports including notification-related ports, challenge submission/vote ports, activity reaction port, location sharing request port, trip sponsor/participant ports, auth service, storage path resolver

**Scope:**
- **Included**: Moving interfaces, creating missing domain entities, updating imports, updating barrel exports, reconciling duplicate signatures
- **Excluded**: Gateway implementation changes, database changes, new features, performance optimizations

**User Scenarios:**
1. **Primary Flow**: Developer adds new port → Creates interface in domain → Creates Context.Tag in use-cases → Implements in adapters
2. **Alternative Flow**: Port exists in both packages → Compare signatures → Move superset to domain → Update use-cases to import
3. **Error Handling**: Missing entity in domain → Create entity → Update references → Verify compilation

---

## Acceptance Criteria

### Functional Requirements

- [x] **[AC1] All IPort interfaces exist in domain package**: Given a search for "export interface I\w+Port" in packages/use-cases/src, When the search is executed, Then 0 results are returned (all moved to domain)

- [x] **[AC2] Context.Tags remain in use-cases**: Given a search for "Context.Tag" in packages/use-cases/src, When the search is executed, Then all Tags exist and import from @mirai-app/domain

- [x] **[AC3] Entity interfaces exist in domain**: Given notification-related ports need Notification entity, When checked in domain package, Then Notification, NotificationPush, PushSubscription, NotificationSchedule, NotificationScheduleExecution, NotificationDelivery entities exist

- [x] **[AC4] No duplicate interface definitions**: Given the same port name (e.g., IUserPort), When searched across both packages, Then only one interface definition exists (in domain)

- [x] **[AC5] Import paths updated**: Given files that imported from "../ports/UserPort" in use-cases, When checked, Then they import from "@mirai-app/domain" instead

- [x] **[AC6] Barrel exports updated**: Given packages/domain/src/index.ts, When checked, Then all moved ports are exported

- [x] **[AC7] TypeScript compilation passes**: Given "bun run typecheck" command, When executed, Then no type errors related to port interfaces (domain package passes)

### Non-Functional Requirements

- [x] **[NFR1] No breaking changes**: Given existing code using ports, When compilation runs, Then no breaking changes to public APIs (backward compatibility aliases provided)

- [ ] **[NFR2] All tests pass**: Given "bun test" command, When executed, Then all tests pass without modification (pending interactor fixes)

- [x] **[NFR3] Domain purity maintained**: Given domain package code, When analyzed, Then no imports from "effect" except "import type"

### Port Inventory

#### Domain Package (Current) - 13 ports
1. IUserPort (packages/domain/src/user/ports/UserPort.ts)
2. ITripPort (packages/domain/src/trip/ports/TripPort.ts)
3. ISponsorPort (packages/domain/src/sponsor/ports/SponsorPort.ts)
4. IGroupPort (packages/domain/src/group/ports/GroupPort.ts)
5. IGroupJoinRequestPort (packages/domain/src/group/ports/GroupJoinRequestPort.ts)
6. IRewardPort (packages/domain/src/reward/ports/RewardPort.ts)
7. IRewardPurchasePort (packages/domain/src/reward/ports/RewardPurchasePort.ts)
8. ILocationPort (packages/domain/src/location/ports/LocationPort.ts)
9. IChallengePort (packages/domain/src/challenge/ports/ChallengePort.ts)
10. IActivityFeedPort (packages/domain/src/activity/ports/ActivityFeedPort.ts)
11. ICoinTransactionPort (packages/domain/src/coin/ports/CoinTransactionPort.ts)
12. ISubmissionReportPort (packages/domain/src/submission-report/ports/SubmissionReportPort.ts)
13. Shared: IAuthPort, IStoragePort, IRealtimePort (packages/domain/src/shared/services/index.ts)

#### Use-cases Package (Current) - 26 ports

**With duplicates (need reconciliation):**
- IUserPort, ITripPort, ISponsorPort, ISubmissionReportPort, IRewardPort, IRewardPurchasePort, ILocationPort, IChallengePort, IActivityFeedPort, IGroupPort, IGroupJoinRequestPort, ICoinTransactionPort

**Unique to use-cases (must move to domain):**
- ITripSponsorPort, ITripParticipantPort, INotificationPort, IPushSubscriptionPort, INotificationSchedulePort, INotificationScheduleExecutionPort, INotificationDeliveryPort, INotificationServicePort, ILocationSharingRequestPort, IChallengeSubmissionPort, IChallengeVotePort, IActivityReactionPort, IAuthServicePort, IStoragePathResolverPort

#### Entity Interfaces to Create in Domain
From use-cases notification, challenge-submission, challenge-vote, activity-feed, and location ports:
- Notification, NotificationPush, PushSubscription, NotificationSchedule, NotificationScheduleExecution, NotificationDelivery, NotificationDeliveryStats
- ChallengeSubmission, ChallengeVote, ActivityReaction, LocationSharingRequest

---

## Implementation Process

### Implementation Summary

| Step | Name | Size | Dependencies | Parallel With |
|------|------|------|--------------|---------------|
| 1 | Create Domain Infrastructure | Large | None | - |
| 2 | Move Notification Ports | Medium | Step 1 | - |
| 3 | Move Remaining Unique Ports | Medium | Step 1 | Step 2 |
| 4 | Reconcile Duplicate Ports | Large | None | Steps 2-3 |
| 5 | Update Context.Tags | Large | Steps 2,3,4 | - |
| 6 | Update Barrel Exports | Medium | Steps 2,3 | Step 5 |
| 7 | Update Imports Across Codebase | Large | Steps 5,6 | - |
| 8 | Verification | Small | Step 7 | - |

**Estimated Total Time**: 4-5 hours with parallelization
**Critical Path**: 1 → 2 → 5 → 7 → 8

---

### Step 1: Create Domain Infrastructure for New Domains

**Goal**: Create domain directories and entity files for notification, challenge-submission, challenge-vote, activity-feed-reaction, and location-sharing-request domains.

**Output**:
- packages/domain/src/notification/ directory with entities/
- packages/domain/src/challenge/ extended with submission and vote entities
- packages/domain/src/activity/ extended with reaction entities
- packages/domain/src/location/ extended with sharing request entities

**Success Criteria**:
- [ ] Directory structure exists for all 5 domains
- [ ] Entity files created: Notification, NotificationPush, PushSubscription, NotificationSchedule, NotificationScheduleExecution, NotificationDelivery, NotificationDeliveryStats, ChallengeSubmission, ChallengeVote, ActivityReaction, LocationSharingRequest
- [ ] Each entity file exports its interface

**Subtasks**:
1. Create notification domain structure
2. Extract Notification entity from use-cases/notification/ports/NotificationPort.ts
3. Extract PushSubscription, NotificationSchedule, NotificationScheduleExecution, NotificationDelivery, NotificationDeliveryStats
4. Create ChallengeSubmission and ChallengeVote entities in challenge domain
5. Create ActivityReaction entity in activity domain
6. Create LocationSharingRequest entity in location domain

**Size**: Large (10 entities)  
**Time**: 2-3 hours  
**Agent**: sdd:developer

**Risks**:
| Risk | Impact | Mitigation |
|------|--------|------------|
| Entity fields differ from what gateways expect | High | Copy exact interface from use-cases |
| Missing related types | Medium | Check use-cases port files for all referenced types |

---

### Step 2: Move Notification Ports to Domain

**Goal**: Move all 6 notification-related ports to domain package.

**Ports**: INotificationPort, IPushSubscriptionPort, INotificationSchedulePort, INotificationScheduleExecutionPort, INotificationDeliveryPort, INotificationServicePort

**Output**:
- packages/domain/src/notification/ports/ with all 6 notification ports

**Success Criteria**:
- [ ] All 6 notification ports exist in packages/domain/src/notification/ports/
- [ ] Each port imports entities from ../entities/
- [ ] Each port uses IPortError from shared
- [ ] Barrel export exists

**Dependencies**: Step 1 (entities must exist)

**Size**: Medium  
**Time**: 1-2 hours  
**Agent**: sdd:developer

---

### Step 3: Move Remaining Unique Ports to Domain

**Goal**: Move the remaining 8 unique ports from use-cases to domain.

**Ports**: ITripSponsorPort, ITripParticipantPort, ILocationSharingRequestPort, IChallengeSubmissionPort, IChallengeVotePort, IActivityReactionPort, IAuthServicePort, IStoragePathResolverPort

**Success Criteria**:
- [ ] All 8 ports exist in appropriate domain directories
- [ ] Ports import from domain entities

**Dependencies**: Step 1 (for challenge/activity/location entities)
**Parallel With**: Step 2

**Size**: Medium  
**Time**: 1-2 hours  
**Agent**: sdd:developer

---

### Step 4: Reconcile Duplicate Ports

**Goal**: Merge the 12 duplicate ports keeping the superset of methods.

**Duplicates**: IUserPort, ITripPort, ISponsorPort, IGroupPort, IGroupJoinRequestPort, IRewardPort, IRewardPurchasePort, ILocationPort, IChallengePort, IActivityFeedPort, ICoinTransactionPort, ISubmissionReportPort

**Success Criteria**:
- [ ] For each duplicate, domain version has superset of methods from both versions
- [ ] No methods lost during merge
- [ ] TypeScript compilation passes for each merged port

**Subtasks**:
1. Compare signatures for each duplicate pair (domain vs use-cases)
2. Merge signatures keeping superset
3. Update domain interface

**Parallel With**: Steps 2-3

**Size**: Large (12 ports)  
**Time**: 2-3 hours  
**Agent**: sdd:developer

**Risks**:
| Risk | Impact | Mitigation |
|------|--------|------------|
| Method signature incompatibility | High | Careful comparison, use Effect types |
| Different return types for same method | High | Choose most flexible type |

---

### Step 5: Update Context.Tags in Use-cases

**Goal**: Update all 26 Context.Tags to import interfaces from @mirai-app/domain.

**Tags**: UserPortTag, TripPortTag, SponsorPortTag, TripSponsorPortTag, TripParticipantPortTag, SubmissionReportPortTag, RewardPortTag, RewardPurchasePortTag, NotificationPortTag, PushSubscriptionPortTag, NotificationSchedulePortTag, NotificationScheduleExecutionPortTag, NotificationDeliveryPortTag, NotificationServicePortTag, LocationPortTag, LocationSharingRequestPortTag, ChallengePortTag, ChallengeSubmissionPortTag, ChallengeVotePortTag, ActivityFeedPortTag, ActivityReactionPortTag, GroupPortTag, GroupJoinRequestPortTag, CoinTransactionPortTag, AuthServicePortTag, StoragePathResolverPortTag

**Success Criteria**:
- [ ] All use-cases port files import IPort interfaces from @mirai-app/domain
- [ ] No interface definitions remain in use-cases (only Tags)
- [ ] TypeScript compilation passes

**Dependencies**: Steps 2, 3, 4

**Size**: Large (26 files)  
**Time**: 2-3 hours  
**Agent**: sdd:developer

---

### Step 6: Update Barrel Exports

**Goal**: Update domain package barrel exports to include new ports.

**Files**: packages/domain/src/index.ts, packages/domain/src/*/ports/index.ts

**Success Criteria**:
- [ ] packages/domain/src/index.ts exports all moved ports
- [ ] Each domain's ports/index.ts is complete
- [ ] Notification domain added to main exports

**Dependencies**: Steps 2, 3
**Parallel With**: Step 5

**Size**: Medium  
**Time**: 1 hour  
**Agent**: sdd:developer

---

### Step 7: Update Imports Across Codebase

**Goal**: Update all files that import ports from use-cases to import from @mirai-app/domain.

**Success Criteria**:
- [ ] grep for IPort imports from use-cases returns 0 results
- [ ] All IPort imports use @mirai-app/domain
- [ ] TypeScript compilation passes

**Dependencies**: Steps 5, 6

**Size**: Large (many files)  
**Time**: 2-3 hours  
**Agent**: sdd:developer

---

### Step 8: Verification and Cleanup

**Goal**: Verify all acceptance criteria are met.

**Verification Checklist**:
- [ ] AC1: 0 IPort interfaces in use-cases (verify with grep)
- [ ] AC2: All Context.Tags import from domain (verify imports)
- [ ] AC3: All entities exist in domain (verify file existence)
- [ ] AC4: No duplicates (only domain has interfaces)
- [ ] AC5: Imports updated (verify with grep)
- [ ] AC6: Barrel exports complete (verify index.ts)
- [ ] AC7: TypeScript compilation passes (bun run typecheck)
- [ ] NFR1-3: Tests pass, no breaking changes, domain purity maintained

**Dependencies**: Step 7

**Size**: Small  
**Time**: 30-60 minutes  
**Agent**: code-review:review-local-changes

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Entity field mismatches | Medium | High | Copy exact interface from use-cases |
| Method signature conflicts | Medium | High | Careful merge, use superset |
| Import cycles after move | Low | High | Check dependencies, use type imports |
| Tests break mid-refactor | Medium | Medium | Run tests after each step |
| Missing port in inventory | Low | Medium | Final grep verification |

---

## Verification Rubrics

### Step 1 Verification: Domain Infrastructure

**Verification Level**: HIGH (Panel - requires multiple checks)

**Rubric**:

| Criteria | Weight | Description |
|----------|--------|-------------|
| Directory structure | 0.25 | All 5 domain directories exist (notification, challenge with submission/vote, activity with reaction, location with sharing) |
| Entity completeness | 0.35 | All 10+ entity interfaces created matching use-cases definitions |
| Type correctness | 0.25 | Entities use proper types, no 'any', import IPortError correctly |
| Export correctness | 0.15 | All entities exported from barrel files |

**Threshold**: 4.0/5.0

**Verification Commands**:
```bash
# Check directories exist
ls packages/domain/src/notification/entities/
ls packages/domain/src/challenge/entities/

# Count entity files
find packages/domain/src -name "*.ts" -path "*/entities/*" | wc -l

# Verify exports
grep -r "export interface" packages/domain/src/notification/entities/
```

---

### Step 2 Verification: Notification Ports

**Verification Level**: MEDIUM (Single check)

**Rubric**:

| Criteria | Weight | Description |
|----------|--------|-------------|
| Port files exist | 0.40 | All 6 notification port files exist in domain |
| Entity imports | 0.30 | Ports import from ../entities/ correctly |
| IPortError usage | 0.20 | All methods use IPortError for errors |
| Barrel export | 0.10 | notification/ports/index.ts exports all 6 |

**Threshold**: 3.5/5.0

---

### Step 3 Verification: Remaining Unique Ports

**Verification Level**: MEDIUM (Single check)

**Rubric**:

| Criteria | Weight | Description |
|----------|--------|-------------|
| Port files exist | 0.50 | All 8 unique port files exist in correct domain directories |
| Proper placement | 0.30 | Each port in correct domain (e.g., ITripSponsorPort in sponsor/) |
| Import correctness | 0.20 | Ports import entities from domain correctly |

**Threshold**: 3.5/5.0

---

### Step 4 Verification: Reconcile Duplicates

**Verification Level**: HIGH (Panel - requires careful review)

**Rubric**:

| Criteria | Weight | Description |
|----------|--------|-------------|
| Signature completeness | 0.40 | Domain version has ALL methods from both original versions |
| No method loss | 0.30 | No methods from use-cases version were dropped |
| Type compatibility | 0.20 | Method signatures are type-compatible (Effect types preserved) |
| Compilation | 0.10 | TypeScript compiles without errors for each merged port |

**Threshold**: 4.0/5.0

**Verification Method**: 
- Compare use-cases port with domain port using diff
- Verify domain version has superset
- Run typecheck on each merged port

---

### Step 5 Verification: Context.Tags Update

**Verification Level**: HIGH (Panel - critical for DI)

**Rubric**:

| Criteria | Weight | Description |
|----------|--------|-------------|
| Import correctness | 0.35 | All 26 Tags import IPort from @mirai-app/domain |
| Interface removal | 0.35 | No IPort interface definitions remain in use-cases |
| Tag preservation | 0.20 | All Context.Tag classes still exist and are exported |
| Compilation | 0.10 | use-cases package compiles without errors |

**Threshold**: 4.0/5.0

**Verification Commands**:
```bash
# Check no IPort interfaces in use-cases
grep -r "export interface I\w\+Port" packages/use-cases/src/ | wc -l
# Expected: 0

# Check Tags exist
grep -r "Context.Tag" packages/use-cases/src/ | wc -l
# Expected: 26

# Check imports from domain
grep -r "from \"@mirai-app/domain\"" packages/use-cases/src/*/ports/*.ts | wc -l
```

---

### Step 6 Verification: Barrel Exports

**Verification Level**: MEDIUM (Per-item check)

**Rubric**:

| Criteria | Weight | Description |
|----------|--------|-------------|
| Main index.ts | 0.40 | packages/domain/src/index.ts exports all new ports |
| Domain barrels | 0.40 | Each domain's ports/index.ts exports its ports |
| No duplicates | 0.20 | No port exported twice from different locations |

**Threshold**: 3.5/5.0

---

### Step 7 Verification: Imports Updated

**Verification Level**: MEDIUM (Single check with grep)

**Rubric**:

| Criteria | Weight | Description |
|----------|--------|-------------|
| Zero use-cases imports | 0.50 | No IPort imports from use-cases (except Tags) |
| Domain imports correct | 0.30 | All IPort imports use @mirai-app/domain |
| No broken imports | 0.20 | TypeScript compilation passes |

**Threshold**: 3.5/5.0

**Verification Commands**:
```bash
# Check for wrong imports
grep -r "from.*use-cases.*/ports" packages/ --include="*.ts" | grep -v "PortTag" | wc -l
# Expected: 0

# Typecheck
bun run typecheck
```

---

### Step 8 Verification: Final

**Verification Level**: HIGH (Panel - comprehensive)

**Rubric**:

| Criteria | Weight | Description |
|----------|--------|-------------|
| AC1: No IPort in use-cases | 0.25 | grep returns 0 results |
| AC2: Tags import from domain | 0.20 | All Context.Tags have correct imports |
| AC3-AC7: All criteria | 0.30 | Remaining acceptance criteria pass |
| NFR1-3: Quality metrics | 0.25 | Tests pass, no breaking changes, domain pure |

**Threshold**: 4.0/5.0

**Final Verification Commands**:
```bash
# AC1: No IPort interfaces in use-cases
grep -r "export interface I\w\+Port" packages/use-cases/src/ | wc -l
# Expected: 0

# AC2: Tags import from domain
grep -r "import.*I\w\+Port.*from \"@mirai-app/domain\"" packages/use-cases/src/ | wc -l
# Expected: >= 26

# AC7: TypeScript compilation
bun run typecheck

# NFR2: Tests pass
bun test

# NFR3: Domain purity
grep -r "import { Effect }" packages/domain/src/ | grep -v "import type" | wc -l
# Expected: 0
```

---

## Verification Summary Table

| Step | Level | Threshold | Key Criteria |
|------|-------|-----------|--------------|
| 1 | HIGH (Panel) | 4.0/5.0 | 10+ entities created, directories exist |
| 2 | MEDIUM | 3.5/5.0 | 6 notification ports in domain |
| 3 | MEDIUM | 3.5/5.0 | 8 unique ports in correct domains |
| 4 | HIGH (Panel) | 4.0/5.0 | 12 duplicates reconciled, no method loss |
| 5 | HIGH (Panel) | 4.0/5.0 | 26 Tags import from domain, no interfaces in use-cases |
| 6 | MEDIUM | 3.5/5.0 | All barrel exports complete |
| 7 | MEDIUM | 3.5/5.0 | All imports use @mirai-app/domain |
| 8 | HIGH (Panel) | 4.0/5.0 | All ACs pass, tests green |

---

## Definition of Done

- [ ] All acceptance criteria pass (AC1-AC7, NFR1-NFR3)
- [ ] TypeScript compilation passes with zero errors
- [ ] All existing tests pass without modification
- [ ] No duplicate IPort interfaces exist across packages
- [ ] All Context.Tags in use-cases import from @mirai-app/domain
- [ ] Domain package exports all port interfaces
- [ ] Code review completed
- [ ] Scratchpad analysis document complete
