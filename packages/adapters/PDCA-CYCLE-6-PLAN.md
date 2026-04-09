# PDCA Cycle 6: Complex Repository Refactoring - Plan

**Date:** 2026-04-09  
**Status:** PLANNING PHASE  
**Goal:** Address remaining complex repositories and complete standardization  
**Timeline:** 2 weeks dedicated cycle

---

## Executive Summary

PDCA Cycle 5 achieved **81% pattern coverage** (13/16 repositories), exceeding the 60% target. Cycle 6 will address the final complex repository and modularize the TRPC layer to complete the optimization initiative.

**Cycle 6 Scope:**

1. **Primary Goal:** Refactor `PrismaNotificationScheduleRepository` (397 LOC, 18 methods)
2. **Secondary Goal:** Modularize `packages/trpc/src/api/controllers/index.ts` (4,287 LOC barrel file)
3. **Target Coverage:** 94% (15/16 repositories, with ActivityFeed as permanent exception)

---

## Phase 1: PLAN

### Problem Definition

**Current State:**

- 13/16 repositories standardized (81%)
- 2 repositories remain non-standard:
  - `PrismaNotificationScheduleRepository` (deferred from Cycle 5 due to complexity)
  - `PrismaActivityFeedRepository` (permanently excluded - polymorphic complexity)
- 1 infrastructure file needs attention:
  - `packages/trpc/src/api/controllers/index.ts` (4,287 LOC - becoming unwieldy)

**Target Repository Analysis:**

#### PrismaNotificationScheduleRepository (397 LOC, 18 methods)

**Complexity Factors:**

1. **Execution Scheduling Logic**
   - Recurrence patterns (daily, weekly, monthly, custom)
   - Cron-like scheduling with timezone handling
   - Next execution time calculation
   - Schedule activation/deactivation

2. **Batch Operations**
   - Batch notification distribution
   - Pagination for large recipient lists
   - Progress tracking for long-running jobs
   - Partial failure handling

3. **Integration Points**
   - Notification delivery system integration
   - Supabase realtime subscriptions
   - External notification services (email, push, SMS)
   - Schedule status management

4. **State Management**
   - Schedule lifecycle (draft → active → paused → completed)
   - Execution history tracking
   - Error recovery and retry logic
   - Concurrent execution prevention

**Why It Was Deferred:**

- Requires 2-week dedicated focus (not suitable for parallel batch processing)
- Complex business logic that needs careful testing
- High risk of regression if rushed
- Integration testing required with notification pipeline

**Baseline Metrics:**

| Metric                 | Current     | Target          |
| ---------------------- | ----------- | --------------- |
| Pattern Coverage       | 81% (13/16) | 94% (15/16)     |
| Average LOC per repo   | ~200        | <180 (maintain) |
| Quality Gate Pass Rate | 100%        | 100% (maintain) |
| Build Time Impact      | +2%         | <5% (maintain)  |

### Hypothesis

> **If** we dedicate 2 weeks to carefully refactor `PrismaNotificationScheduleRepository` with comprehensive testing, **then** we will:
>
> - Successfully standardize the most complex remaining repository
> - Achieve 94% pattern coverage (15/16 repositories)
> - Maintain zero regressions through extended testing
> - Document complex repository patterns for future reference
> - Complete the repository standardization initiative

### Success Criteria

| Criterion               | Baseline  | Target      | Measurement                |
| ----------------------- | --------- | ----------- | -------------------------- |
| Repositories refactored | 13        | 14 (min)    | Pattern compliance check   |
| Total LOC removed       | 540 lines | 600+ lines  | Line count diff            |
| Pattern coverage        | 81%       | 94%         | % standardized             |
| Tests passing           | 100%      | 100%        | Test suite run             |
| Integration tests       | N/A       | All passing | Notification pipeline test |
| Build time impact       | +2%       | <5%         | CI timing                  |
| Quality gate score      | 4.83 avg  | ≥4.5        | Judge evaluation           |

### Experiment Design

#### Week 1: Analysis & Implementation

**Days 1-2: Deep Analysis**

- Read and understand all 18 methods in NotificationScheduleRepository
- Identify which methods can be inherited vs must remain custom
- Map integration points with notification delivery system
- Document scheduling algorithm requirements
- Create test plan for batch operations

**Days 3-5: Refactoring**

- Extend BasePrismaRepository with correct type parameters
- Create NotificationScheduleMapper with toDomain, toPrismaCreate, toPrismaUpdate
- Implement scheduling-specific custom methods
- Preserve execution logic, recurrence patterns, batch operations
- Add comprehensive error handling

**Day 5: Initial Testing**

- Unit tests for mapper methods
- Integration tests for scheduling logic
- Batch operation performance tests
- Error recovery scenario tests

#### Week 2: Integration & Modularization

**Days 6-8: Integration Testing**

- End-to-end notification pipeline tests
- Schedule execution workflow tests
- Concurrent execution prevention tests
- Failure recovery tests
- Performance benchmarks

**Days 9-10: TRPC Modularization**

- Split `packages/trpc/src/api/controllers/index.ts` (4,287 LOC) into domain modules:
  - `users/` - User-related controllers
  - `challenges/` - Challenge-related controllers
  - `notifications/` - Notification-related controllers
  - `trips/` - Trip-related controllers
  - `groups/` - Group-related controllers
  - `rewards/` - Reward-related controllers
- Update barrel exports
- Verify no breaking changes

**Day 11-12: Final Verification**

- Full test suite run
- dependency-cruiser validation
- Build time measurement
- Judge evaluation

**Day 13-14: Documentation & Standardization**

- Update README.md with complex repository patterns
- Document NotificationSchedule as reference implementation for complex repos
- Update REPOSITORY_REFACTORING.md
- Create ADR for permanent exclusions (ActivityFeed)

### Risk Analysis

| Risk                                          | Probability | Impact | Mitigation                                                  |
| --------------------------------------------- | ----------- | ------ | ----------------------------------------------------------- |
| Scheduling logic regression                   | Medium      | High   | Comprehensive integration tests, gradual rollout            |
| Batch operation performance degradation       | Low         | High   | Performance benchmarks before/after, query optimization     |
| Integration with notification pipeline breaks | Medium      | High   | End-to-end tests, staging environment validation            |
| TRPC modularization breaks imports            | Low         | Medium | Careful export mapping, backward compatibility tests        |
| 2-week timeline insufficient                  | Low         | Medium | Scope reduction option (focus on NotificationSchedule only) |

---

## Phase 2: DO (Execution Plan)

### Task 1: Refactor PrismaNotificationScheduleRepository

**Steps:**

1. **Read Current Implementation**

   ```bash
   wc -l packages/adapters/src/gateways/PrismaNotificationScheduleRepository.ts
   grep -E "async |constructor|extends" packages/adapters/src/gateways/PrismaNotificationScheduleRepository.ts
   ```

2. **Analyze Method Categories**
   - Standard CRUD (should be inherited):
     - `create`, `findById`, `findAll`, `update`, `delete`
   - Scheduling-specific (must remain custom):
     - `calculateNextExecution`, `activateSchedule`, `pauseSchedule`
     - `executeBatch`, `trackProgress`, `handlePartialFailure`
   - Integration methods (must remain custom):
     - `integrateWithDeliverySystem`, `subscribeToRealtime`, `triggerExternalNotifications`

3. **Create NotificationScheduleMapper**
   - `toDomain` - Handle complex schedule configuration objects
   - `toPrismaCreate` - Convert recurrence patterns to Prisma format
   - `toPrismaUpdate` - Handle partial updates for schedule modification

4. **Refactor Repository Class**

   ```typescript
   export class PrismaNotificationScheduleRepository
     extends BasePrismaRepository<
       NotificationSchedule,
       PrismaNotificationSchedule,
       PrismaNotificationScheduleCreateInput,
       PrismaNotificationScheduleUpdateInput
     >
     implements NotificationScheduleRepository
   ```

5. **Preserve Critical Custom Methods**
   - All 18 methods reviewed and categorized
   - Custom scheduling logic preserved
   - Integration points maintained
   - Batch operations optimized

6. **Add Comprehensive Tests**
   - Unit tests for each custom method
   - Integration tests for scheduling workflows
   - Performance tests for batch operations
   - Error scenario tests

### Task 2: Modularize TRPC Controllers

**Current State:**

```
packages/trpc/src/api/controllers/index.ts (4,287 LOC)
├── User controllers
├── Challenge controllers
├── Notification controllers
├── Trip controllers
├── Group controllers
├── Reward controllers
└── ... (mixed together)
```

**Target State:**

```
packages/trpc/src/api/controllers/
├── index.ts (barrel, ~100 LOC)
├── users/
│   ├── index.ts
│   ├── user-profile.ts
│   └── user-settings.ts
├── challenges/
│   ├── index.ts
│   ├── challenge-list.ts
│   └── challenge-submissions.ts
├── notifications/
│   ├── index.ts
│   ├── notification-send.ts
│   └── notification-schedule.ts
├── trips/
│   ├── index.ts
│   ├── trip-management.ts
│   └── trip-settings.ts
├── groups/
│   ├── index.ts
│   ├── group-members.ts
│   └── group-points.ts
└── rewards/
    ├── index.ts
    ├── reward-catalog.ts
    └── reward-purchases.ts
```

**Implementation Steps:**

1. Create directory structure
2. Move controller functions to domain-specific files
3. Update imports in each file
4. Create domain-specific index.ts barrel files
5. Update main index.ts to export from domain barrels
6. Verify no breaking changes
7. Run full test suite

**Benefits:**

- Faster build times (tree-shaking improvement)
- Better code organization
- Easier navigation
- Domain-specific changes isolated
- Reduced merge conflicts

---

## Phase 3: CHECK (Verification Plan)

### Verification Checklist

**NotificationScheduleRepository:**

- [ ] Extends BasePrismaRepository with correct 4 type parameters
- [ ] All standard CRUD methods inherited (not manually implemented)
- [ ] All 18 custom methods preserved and functional
- [ ] Scheduling logic (recurrence, execution) working correctly
- [ ] Batch operations performant (benchmark vs baseline)
- [ ] Integration with notification pipeline intact
- [ ] Error handling and recovery working
- [ ] Concurrent execution prevention functional
- [ ] Judge score ≥4.5/5.0

**TRPC Modularization:**

- [ ] All controllers exported (no missing exports)
- [ ] No breaking changes to existing imports
- [ ] Build time improved or maintained
- [ ] dependency-cruiser passes with no violations
- [ ] Full test suite passes

**Overall:**

- [ ] Pattern coverage: 94% (15/16 repositories)
- [ ] Total LOC reduction: 600+ lines
- [ ] Zero test regressions
- [ ] Zero dependency violations
- [ ] Build time impact: <5%

### Test Plan

**Unit Tests:**

```bash
# Mapper tests
bun test packages/adapters/src/mappers/NotificationScheduleMapper.test.ts

# Repository custom method tests
bun test packages/adapters/src/gateways/__tests__/PrismaNotificationScheduleRepository.test.ts
```

**Integration Tests:**

```bash
# Notification pipeline
bun test packages/trpc/src/api/routers/__tests__/notificationSchedule.test.ts

# End-to-end scheduling
bun test:integration
```

**Performance Tests:**

```bash
# Batch operation benchmarks
# Schedule execution timing
# Memory usage monitoring
```

**Architecture Validation:**

```bash
# Dependency-cruiser check
bun run depcruise:check

# Build verification
bun run build

# Type checking
bun run typecheck
```

---

## Phase 4: ACT (Standardization Plan)

### If Successful (Expected)

**Standardize:**

1. ✅ Update `packages/adapters/README.md` with:
   - Complex repository patterns (scheduling, batch operations)
   - NotificationSchedule as reference implementation
   - Pattern variations documented (CRUD overrides, private prisma, dual-entity)

2. ✅ Update `packages/adapters/REPOSITORY_REFACTORING.md` with:
   - Cycle 6 results
   - Complex repository refactoring guide
   - Performance optimization tips

3. ✅ Update `AGENTS.md` Kaizen log with:
   - Cycle 6 completion
   - Final metrics (94% coverage)
   - Lessons learned from complex refactoring

4. ✅ Create ADR (Architecture Decision Record):
   - `docs/adr/0001-repository-pattern-exclusions.md`
   - Document ActivityFeed as permanent exception
   - Justification: polymorphic complexity

5. ✅ Mark PDCA Cycle as COMPLETE
   - Repository standardization initiative finished
   - 94% pattern coverage achieved
   - Pattern is institutional standard

### If Partially Successful

**Standardize what worked:**

- Document successful parts
- Document what didn't work and why

**Plan next cycle:**

- If NotificationSchedule too complex, consider:
  - Partial refactoring (only standard CRUD)
  - Documentation of why it remains custom
  - Accept 81% as final coverage (still excellent)

### If Unsuccessful

**Analyze:**

- Root cause analysis (use `/why` or `/cause-and-effect`)
- Why did it fail? Complexity underestimated? Integration issues?

**Decide:**

- Accept 81% coverage (already exceeded 60% target)
- Document NotificationSchedule as exception
- Focus on other improvements (code generation, testing)

---

## Resource Requirements

### Time Allocation (2 weeks)

| Week   | Days  | Focus           | Deliverable                               |
| ------ | ----- | --------------- | ----------------------------------------- |
| Week 1 | 1-2   | Analysis        | Understanding document, test plan         |
| Week 1 | 3-5   | Refactoring     | NotificationScheduleRepository refactored |
| Week 1 | 5     | Initial Testing | Unit tests passing                        |
| Week 2 | 6-8   | Integration     | Integration tests passing                 |
| Week 2 | 9-10  | Modularization  | TRPC controllers organized                |
| Week 2 | 11-12 | Verification    | All tests passing, judge evaluation       |
| Week 2 | 13-14 | Documentation   | All docs updated                          |

### Personnel

- **1 Senior Developer** (familiar with scheduling logic)
- **1 QA Engineer** (for integration testing)
- **Code Review:** Architecture team for final approval

### Tools & Infrastructure

- Staging environment for notification pipeline testing
- Performance benchmarking tools
- CI/CD pipeline for continuous validation

---

## Success Metrics Dashboard

| Metric                    | Cycle 3 | Cycle 4 | Cycle 5 | Cycle 6 (Target) |
| ------------------------- | ------- | ------- | ------- | ---------------- |
| Repositories Standardized | 3       | 7       | 13      | 15               |
| Pattern Coverage          | 19%     | 44%     | 81%     | **94%**          |
| LOC Reduction             | 35% avg | 33% avg | 34% avg | 30%+             |
| Quality Gate Pass Rate    | 100%    | 75%     | 100%    | **100%**         |
| Total LOC Eliminated      | ~200    | ~272    | ~540    | **~600+**        |

---

## Conclusion

**Cycle 6 Goal:** Complete the repository standardization initiative by addressing the final complex repository and improving infrastructure organization.

**Expected Outcome:**

- ✅ 94% pattern coverage (15/16 repositories)
- ✅ ~600+ lines of CRUD boilerplate eliminated (total)
- ✅ TRPC layer modularized for better maintainability
- ✅ Complex repository patterns documented
- ✅ PDCA initiative successfully concluded

**Fallback Plan:**
If Cycle 6 encounters insurmountable complexity:

- Accept 81% coverage as successful completion
- Document NotificationSchedule as exception with clear rationale
- Still modularize TRPC layer for infrastructure improvement
- Mark initiative as successful (already exceeded 60% target by 21 points)

---

**Prepared:** 2026-04-09  
**Review Date:** Upon Cycle 6 completion (2 weeks)  
**Decision Authority:** Tech Lead + Architecture Team  
**Status:** ✅ PLAN COMPLETE - Ready for execution
