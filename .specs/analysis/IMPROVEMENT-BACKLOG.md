# Kaizen Improvement Backlog

**Purpose:** Living document tracking potential improvements identified during development  
**Update Frequency:** After each Kaizen session or when new waste is identified  
**Priority System:** High/Medium/Low based on impact/effort ratio

---

## Quick Wins (< 1 hour, High Impact)

### QW1: Consolidate Duplicate Test UUIDs ✅ COMPLETE

**File:** Various test files  
**Observation:** Tests use hardcoded UUID "550e8400-e29b-41d4-a716-446655440000" pattern repeatedly  
**Impact:** ~197 duplicate UUID strings across tests  
**Solution:** Created `TestIds` constant in `packages/domain/src/utils/test-ids.ts`  
**Delivered:** 24 named constants (USER, ADMIN, TRIP, GROUP, etc.)  
**Usage:** `import { TestIds } from "@mirai-app/domain"`  
**Effort:** 15 min  
**Status:** ✅ **COMPLETE - PDCA Cycle 7**

---

## Medium Effort (1-4 hours, High Impact)

### M1: Standardize Test Mock Factories

**Location:** Various `__tests__/` directories  
**Observation:** Tests create mock entities with repetitive boilerplate  
**Example:** `UserId.create("550e8400-e29b-41d4-a716-446655440000")` appears 81+ times  
**Solution:** Create `test-utils/mock-factories.ts` with pre-built test entities  
**Effort:** 2-3 hours  
**Status:** 📋 Identified

### M2: Archive Obsolete Branches ✅ COMPLETE

**Location:** Git repository  
**Observation:** 7 local branches, some stale or merged  
**Deleted:**

- `main-readonly` - copy of main
- `refactor/consolidate-test-utils` - merged into new_tech_stack
- `feature/tanstack-graphql-codegen` - no longer needed
- `refactor/clean-architecture-naming` - no longer needed

**Remaining (3 active):**

- `main` - production
- `new_tech_stack` - current technical debt work
- `next` - new features

**Result:** 7 → 3 branches (-57%)  
**Effort:** 5 min  
**Status:** ✅ **COMPLETE - PDCA Cycle 8**

### M3: Native App Hook Analysis

**Location:** `apps/native/src/hooks/` (61 files)  
**Observation:** Large number of hooks may indicate abstraction opportunities  
**Questions to investigate:**

- Are there duplicate data fetching patterns?
- Can generic hooks replace specific ones?
- Is React Query/TanStack being used consistently?
  **Solution:** Audit hooks for duplication, create generic abstractions  
  **Effort:** 3-4 hours  
  **Status:** 📋 Identified

---

## Large Effort (4+ hours, Strategic Impact)

### L1: Effect Framework Migration (COMPLETE - In Progress)

**Location:** Entire monorepo  
**Status:** ✅ **IN PROGRESS** on `new_tech_stack` branch  
**Work completed:**

- Domain layer converted
- Use cases layer converted
- Controllers migrated from awilix to Effect Layers
- awilix-modular DI infrastructure removed
  **Timeline:** Already complete on branch  
  **Next Action:** Merge to main when ready

### L2: Simplify Domain Entities

**Location:** `packages/domain/src/entities/`  
**Status:** 📋 **TASK CREATED** - `.specs/tasks/todo/simplify-domain-entities.task.md`  
**Impact:** 65% code reduction (3,500 → 1,200 lines)  
**Effort:** 11-16 hours  
**Priority:** High  
**Dependencies:** None

### L3: Refactor Use Cases to Result<T,E>

**Location:** `packages/use-cases/src/interactors/`  
**Status:** 📋 **TASK CREATED** - `.specs/tasks/todo/refactor-use-cases-to-result.task.md`  
**Impact:** ~370 type errors eliminated  
**Effort:** 7-10 hours  
**Priority:** High  
**Dependencies:** None

### L4: Fix Adapters Type Errors

**Location:** `packages/adapters/`  
**Status:** 📋 **TASK CREATED** - `.specs/tasks/todo/fix-adapters-type-errors.task.md`  
**Impact:** 63 → 0 TypeScript errors  
**Effort:** 7-11 hours  
**Priority:** Medium  
**Dependencies:** Use case Result refactor (reduces errors)

---

## Architectural/Strategic (Long-term)

### S1: GraphQL Schema Optimization

**Location:** `apps/backend-server/src/graphql/`  
**Observation:** Schema may have redundant fields or inefficient resolvers  
**Questions:**

- Are all fields in schema actively used?
- Can resolver batching reduce N+1 queries?
- Are fragments used effectively in client?
  **Solution:** Schema audit, performance analysis, optimization  
  **Effort:** 2-3 days  
  **Status:** 📋 Future consideration

### S2: Microservices Migration Planning

**Location:** Architecture level  
**Status:** 📋 **PLAN EXISTS** - `.specs/plans/microservices-migration.design.md`  
**Approach:** Strangler Fig pattern with GraphQL Federation  
**Timeline:** 9-12 months (future)  
**Next Action:** Review when monolith complexity requires it

### S3: Clean Architecture Naming Refactor

**Location:** `packages/adapters/src/`  
**Status:** 📋 **PLAN EXISTS** - `.specs/plans/clean-architecture-naming.design.md`  
**Impact:** Remove framework names from filenames (e.g., `DrizzleUserRepository.ts` → `user.ts`)  
**Effort:** Medium  
**Priority:** Low (cosmetic)

---

## Completed Improvements ✅

| Cycle | Target                       | Result                  | Date       |
| ----- | ---------------------------- | ----------------------- | ---------- |
| 1     | ID value object duplication  | 78% reduction           | 2026-04-14 |
| 2     | WebSocket spike tests        | 71% file reduction      | 2026-04-14 |
| 3     | Plans inventory              | 67% reduction + 3 tasks | 2026-04-14 |
| 4     | Migration plan consolidation | Unified hierarchy       | 2026-04-14 |
| 5     | Documentation                | Complete record         | 2026-04-14 |
| 6     | Improvement backlog          | Living document         | 2026-04-14 |
| 7     | Test UUID consolidation      | 24 named constants      | 2026-04-14 |
| 8     | Branch cleanup               | 7 → 3 branches          | 2026-04-14 |

---

## How to Use This Backlog

### Starting a New Kaizen Session

1. **Review this backlog** for ready items
2. **Check Quick Wins first** - immediate value with minimal effort
3. **Prioritize by:**
   - Impact on current work
   - Effort required
   - Dependencies blocking other work
4. **Execute with PDCA** using `/plan-do-check-act`

### Adding New Items

When you identify waste during development:

```markdown
### [ID]: [Brief Description]

**Location:** [Where]  
**Observation:** [What you noticed]  
**Impact:** [Estimated impact]  
**Suggested Solution:** [How to fix]  
**Effort:** [Quick/Medium/Large/Strategic]  
**Status:** 📋 Identified
```

### Moving Items to In Progress

When starting work:

1. Update status: `🔄 In Progress`
2. Add your name/date
3. Reference PDCA cycle document when complete

---

## Current Priority Queue

### Next Recommended Actions (Immediate)

1. **Execute ready tasks:**
   - `simplify-domain-entities.task.md` (11-16 hrs)
   - `refactor-use-cases-to-result.task.md` (7-10 hrs)
   - `fix-adapters-type-errors.task.md` (7-11 hrs)

2. **Quick wins while working:**
   - Consolidate duplicate test UUIDs (30 min)
   - Archive obsolete branches (30 min)

### Next Kaizen Session Targets

If starting fresh Kaizen analysis:

1. **Native app hook audit** (3-4 hrs, may find duplication)
2. **Test mock factory standardization** (2-3 hrs)
3. **GraphQL schema optimization analysis** (2-3 days)

---

## Waste Categories to Monitor

### Overproduction (Building too much)

- Unused features in native app
- Over-engineered abstractions

### Waiting (Idle time)

- CI build times
- Test execution times

### Transportation (Moving data unnecessarily)

- API layer duplication
- Excessive transformations

### Over-processing (Doing more than needed)

- Duplicate validation
- Excessive logging (console.log reduction ongoing)

### Inventory (Work in progress)

- Unmerged branches
- Draft specs aging
- Incomplete migrations

### Motion (Unnecessary movement)

- Context switching between tools
- Repetitive manual tasks

### Defects (Rework)

- Type errors
- Flaky tests
- Tech debt

---

**Last Updated:** 2026-04-14  
**Next Review:** When starting next Kaizen session
