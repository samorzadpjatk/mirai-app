---
title: In-Memory Mock Repository Infrastructure for Testing
created: 2026-04-09
type: infrastructure
tags: [testing, refactoring, deduplication, DDD]
priority: high
---

## Initial User Prompt

> Instead of making on each test a mock repository, make an MockRepository with in-memory store for testing repositories - deduplicate code

## Description

### Why This Feature is Needed

Currently, every unit test for use cases creates inline mock repositories using `mock()` from bun:test. This leads to:

1. **Massive code duplication**: Each test file repeats the same mock structure (20-30 lines per test)
2. **Maintenance burden**: When repository interfaces change, dozens of test files need updates
3. **Verbose tests**: Actual test logic is buried in mock setup boilerplate
4. **No stateful behavior**: Mocks don't actually store data, making complex test scenarios difficult
5. **Inconsistent patterns**: Different developers create mocks differently

Example of current pattern (from CreateUser.test.ts):

```typescript
const mockRepo: UserRepository = {
  existsByAuthUserId: mock(() => Promise.resolve(false)),
  create: mock(() => Promise.resolve(mockUser)),
  findById: mock(() => Promise.resolve(null)),
  findByAuthUserId: mock(() => Promise.resolve(null)),
  findByRole: mock(() => Promise.resolve([])),
  findAll: mock(() => Promise.resolve([])),
  update: mock(() => Promise.resolve(mockUser)),
  delete: mock(() => Promise.resolve()),
};
```

This pattern is repeated 6 times in a single test file, and across 14+ test files in the use-cases package alone.

### What This Feature Accomplishes

Create a suite of reusable **InMemoryRepository** classes that:

1. Implement repository port interfaces with real in-memory storage (Map/Array)
2. Provide realistic CRUD behavior (find, create, update, delete actually work)
3. Support easy test setup with `reset()` for test isolation
4. Include helper methods for common test scenarios (seed data, find by criteria)
5. Reduce test file size by 50-70% by eliminating mock boilerplate

**Target transformation:**

```typescript
// Before: ~20 lines of mock boilerplate
const mockRepo: UserRepository = {
  create: mock(() => Promise.resolve(mockUser)),
  findById: mock(() => Promise.resolve(null)),
  // ... 15 more lines
};

// After: 3 lines with in-memory repository
const repo = new InMemoryUserRepository();
repo.seed([mockUser]);
```

### Scope Boundaries

**IN Scope:**

- Base `InMemoryRepository<T>` class with generic CRUD operations
- In-memory implementations for all major repository ports:
  - UserRepository
  - ChallengeRepository
  - RewardRepository + RewardPurchaseRepository
  - CoinTransactionRepository
  - GroupRepository
  - TripRepository
  - LocationRepository
  - NotificationRepository + NotificationScheduleRepository + NotificationDeliveryRepository
  - ChallengeSubmissionRepository + ChallengeVoteRepository
  - ActivityFeedRepository
  - SponsorRepository
  - SubmissionReportRepository
- Refactor high-impact test files (CreateUser, AddCoins, CreateChallenge, PurchaseReward)
- Documentation and usage examples

**OUT of Scope:**

- Integration test refactoring (tests using real Prisma)
- Changes to actual repository implementations (PrismaXxxRepository)
- Changes to use case logic
- Changes to domain entities

## Acceptance Criteria

### Functional Criteria

- [ ] All in-memory repositories implement their respective port interfaces fully
- [ ] In-memory repositories store data in Maps/Arrays and persist across operations
- [ ] Each repository has a `reset()` method to clear state between tests
- [ ] All existing tests continue to pass after refactoring
- [ ] Test file size reduced by at least 50% for refactored files

### Non-Functional Criteria

- [ ] 100% TypeScript type safety (no `any` types)
- [ ] Zero dependencies on external libraries (only uses bun:test, Effect, domain)
- [ ] Code follows existing DDD/Clean Architecture patterns
- [ ] Each repository has co-located unit tests verifying mock behavior
- [ ] Package exports via `@mirai-app/adapters/test-utils`

## Architecture Overview

### Current State

```
packages/
├── use-cases/
│   ├── src/ports/              # Repository interfaces (UserRepository, etc.)
│   └── src/interactors/*.test.ts  # Tests with inline mocks:
│       const mockRepo: UserRepository = {
│         create: mock(() => Promise.resolve(mockUser)),
│         findById: mock(() => Promise.resolve(null)),
│         // ... 6 more methods
│       }
```

Problems:

- 200-600 lines of mock boilerplate per test file
- No actual data storage between calls
- No way to verify data was actually "saved"
- Tedious to add new methods to all mocks

### Target State

```
packages/
├── adapters/
│   └── src/test-utils/         # NEW: In-memory repositories
│       ├── InMemoryRepository.ts         # Base class
│       ├── InMemoryUserRepository.ts
│       ├── InMemoryChallengeRepository.ts
│       └── ... (one per port)
├── use-cases/
│   └── src/interactors/*.test.ts  # Refactored tests:
│       const repo = new InMemoryUserRepository();
│       repo.seed([mockUser]);     // Optional seed data
│       const useCase = new CreateUserUseCase(repo);
```

Benefits:

- 10-20 lines of setup per test file
- Real data storage and retrieval
- Consistent patterns across all tests
- Easy to extend with helper methods

### Key Architectural Decisions

| Decision       | Choice                           | Rationale                              |
| -------------- | -------------------------------- | -------------------------------------- |
| Storage type   | `Map<string, T>`                 | O(1) lookups, natural ID-based storage |
| Base class     | Generic `InMemoryRepository<T>`  | DRY - common CRUD in one place         |
| Reset method   | `reset(): void`                  | Essential for test isolation           |
| Seed method    | `seed(items: T[]): void`         | Convenient test setup                  |
| Location       | `adapters/src/test-utils/`       | Testing is an adapter concern          |
| Package export | `@mirai-app/adapters/test-utils` | Clean import path                      |

### Expected Changes

**Files to Create:**

- `packages/adapters/src/test-utils/InMemoryRepository.ts` - Base class
- `packages/adapters/src/test-utils/InMemoryUserRepository.ts`
- `packages/adapters/src/test-utils/InMemoryChallengeRepository.ts`
- `packages/adapters/src/test-utils/InMemoryRewardRepository.ts`
- `packages/adapters/src/test-utils/InMemoryRewardPurchaseRepository.ts`
- `packages/adapters/src/test-utils/InMemoryCoinTransactionRepository.ts`
- `packages/adapters/src/test-utils/InMemoryGroupRepository.ts`
- `packages/adapters/src/test-utils/InMemoryTripRepository.ts`
- `packages/adapters/src/test-utils/InMemoryLocationRepository.ts`
- `packages/adapters/src/test-utils/InMemoryNotificationRepository.ts`
- `packages/adapters/src/test-utils/InMemoryNotificationScheduleRepository.ts`
- `packages/adapters/src/test-utils/InMemoryNotificationDeliveryRepository.ts`
- `packages/adapters/src/test-utils/InMemoryChallengeSubmissionRepository.ts`
- `packages/adapters/src/test-utils/InMemoryChallengeVoteRepository.ts`
- `packages/adapters/src/test-utils/InMemoryActivityFeedRepository.ts`
- `packages/adapters/src/test-utils/InMemorySponsorRepository.ts`
- `packages/adapters/src/test-utils/InMemorySubmissionReportRepository.ts`
- `packages/adapters/src/test-utils/index.ts` - Barrel export

**Files to Modify:**

- `packages/adapters/package.json` - Add test-utils export
- `packages/use-cases/package.json` - Add adapters as dev dependency
- `packages/use-cases/src/interactors/CreateUser.test.ts` - Refactor
- `packages/use-cases/src/interactors/AddCoins.test.ts` - Refactor
- `packages/use-cases/src/interactors/CreateChallenge.test.ts` - Refactor
- `packages/use-cases/src/interactors/PurchaseReward.test.ts` - Refactor
- `packages/use-cases/src/interactors/UpdateUser.test.ts` - Refactor
- `packages/use-cases/src/interactors/GetUser.test.ts` - Refactor
- `packages/use-cases/src/interactors/RemoveCoins.test.ts` - Refactor
- `packages/use-cases/src/interactors/GetChallenge.test.ts` - Refactor
- `packages/use-cases/src/interactors/UpdateChallenge.test.ts` - Refactor
- `packages/use-cases/src/interactors/UpdateChallengeStatus.test.ts` - Refactor
- `packages/use-cases/src/interactors/CreateReward.test.ts` - Refactor
- `packages/use-cases/src/interactors/GetNotification.test.ts` - Refactor
- `packages/use-cases/src/interactors/GetDeliveries.test.ts` - Refactor
- `packages/use-cases/src/interactors/GetCoinStatistics.test.ts` - Refactor

**Files to Delete:**

- None (existing tests will be refactored, not deleted)

## Implementation Process

### Overview

We'll use a **parallel implementation strategy** where we:

1. First create the base `InMemoryRepository` class
2. Then create repository implementations in parallel batches
3. Finally refactor test files one by one

This allows subagents to work independently on different repositories.

### Step 1: Create Base InMemoryRepository Class

**Agent:** sonnet
**Execution:** Sequential
**Dependencies:** None

**Description:**

Create the foundational base class that provides generic CRUD operations. This class will be extended by all specific repository implementations.

**Expected Output:**

```typescript
// packages/adapters/src/test-utils/InMemoryRepository.ts
export abstract class InMemoryRepository<T extends { id: string }> {
  protected storage = new Map<string, T>();

  reset(): void { this.storage.clear(); }
  seed(items: T[]): void { items.forEach(i => this.storage.set(i.id, i)); }

  // Generic CRUD operations
  protected async findByIdGeneric(id: string): Promise<T | null> { ... }
  protected async findAllGeneric(): Promise<T[]> { ... }
  protected async createGeneric(item: T): Promise<T> { ... }
  protected async updateGeneric(item: T): Promise<T> { ... }
  protected async deleteGeneric(id: string): Promise<void> { ... }
  protected async existsGeneric(id: string): Promise<boolean> { ... }
}
```

**DDD Alignment:**

This is adapter layer code (testing utilities), following Clean Architecture's dependency direction. It depends on use-case ports but not on domain or framework layers.

**TDD Cycle for This Step:**

- **Red:** Write test for base class CRUD operations
- **Green:** Implement InMemoryRepository with minimal functionality
- **Refactor:** Add helper methods (reset, seed), ensure type safety

**Success Criteria:**

- [ ] Base class compiles with strict TypeScript settings
- [ ] Base class has 100% test coverage
- [ ] All generic CRUD methods work correctly
- [ ] reset() and seed() methods tested

**Risk/Blockers:**
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Type constraints too restrictive | Low | Medium | Start with `T extends { id: string }`, adjust as needed |

#### Verification

**Level:** Single Judge
**Threshold:** 4.5/5.0

| Criterion    | Weight | Description                          |
| ------------ | ------ | ------------------------------------ |
| Type Safety  | 0.40   | All methods properly typed, no `any` |
| Completeness | 0.30   | All generic CRUD operations present  |
| Testability  | 0.30   | Easy to extend and test              |

### Step 2: Create Core In-Memory Repositories (Batch 1)

**Agent:** haiku (parallel subagents)
**Execution:** Parallel
**Dependencies:** Step 1

**Description:**

Create the first batch of high-priority in-memory repositories in parallel:

1. InMemoryUserRepository
2. InMemoryChallengeRepository
3. InMemoryCoinTransactionRepository
4. InMemoryRewardRepository + InMemoryRewardPurchaseRepository

Each subagent will:

1. Read the port interface
2. Extend InMemoryRepository
3. Implement all interface methods
4. Write unit tests for the implementation

**Expected Output:**

```
packages/adapters/src/test-utils/
├── InMemoryUserRepository.ts          + test
├── InMemoryChallengeRepository.ts     + test
├── InMemoryCoinTransactionRepository.ts + test
├── InMemoryRewardRepository.ts        + test
├── InMemoryRewardPurchaseRepository.ts + test
```

**DDD Alignment:**

Each repository implements a port from the use-cases layer, maintaining Clean Architecture's dependency direction.

**TDD Cycle for Each Repository:**

- **Red:** Write test verifying all interface methods work
- **Green:** Implement all methods with in-memory storage
- **Refactor:** Add any repository-specific helper logic

**Success Criteria (per repository):**

- [ ] Implements all methods from port interface
- [ ] All methods use in-memory storage
- [ ] Has co-located unit tests
- [ ] 100% method coverage

#### Verification

**Level:** Panel of 2 Judges
**Threshold:** 4.5/5.0

| Criterion            | Weight | Description                               |
| -------------------- | ------ | ----------------------------------------- |
| Interface Compliance | 0.40   | All port methods implemented correctly    |
| Test Quality         | 0.30   | Tests verify behavior, not just existence |
| Code Clarity         | 0.30   | Clean, maintainable code                  |

### Step 3: Create Remaining In-Memory Repositories (Batch 2)

**Agent:** haiku (parallel subagents)
**Execution:** Parallel
**Dependencies:** Step 2

**Description:**

Create the remaining in-memory repositories:

- GroupRepository
- TripRepository
- LocationRepository
- NotificationRepository
- NotificationScheduleRepository
- NotificationDeliveryRepository
- ChallengeSubmissionRepository
- ChallengeVoteRepository
- ActivityFeedRepository
- SponsorRepository
- SubmissionReportRepository

**Expected Output:**

```
packages/adapters/src/test-utils/
├── InMemoryGroupRepository.ts
├── InMemoryTripRepository.ts
├── InMemoryLocationRepository.ts
├── InMemoryNotificationRepository.ts
├── InMemoryNotificationScheduleRepository.ts
├── InMemoryNotificationDeliveryRepository.ts
├── InMemoryChallengeSubmissionRepository.ts
├── InMemoryChallengeVoteRepository.ts
├── InMemoryActivityFeedRepository.ts
├── InMemorySponsorRepository.ts
└── InMemorySubmissionReportRepository.ts
```

#### Verification

**Level:** Single Judge per repository
**Threshold:** 4.0/5.0

### Step 4: Create Barrel Export and Update Package Config

**Agent:** haiku
**Execution:** Sequential
**Dependencies:** Step 2, Step 3

**Description:**

1. Create `index.ts` barrel export for all in-memory repositories
2. Update `packages/adapters/package.json` to export test-utils
3. Update `packages/use-cases/package.json` to include adapters as dev dependency

**Expected Output:**

```typescript
// packages/adapters/src/test-utils/index.ts
export { InMemoryRepository } from './InMemoryRepository';
export { InMemoryUserRepository } from './InMemoryUserRepository';
// ... all others

// packages/adapters/package.json
{
  "exports": {
    // ... existing exports
    "./test-utils": {
      "import": "./dist/test-utils/index.js",
      "types": "./dist/test-utils/index.d.ts"
    }
  }
}
```

#### Verification

**Level:** Single Judge
**Threshold:** 4.0/5.0

### Step 5: Refactor High-Priority Test Files

**Agent:** haiku (parallel subagents, 1 per test file)
**Execution:** Parallel
**Dependencies:** Step 4

**Description:**

Refactor the highest-impact test files to use in-memory repositories:

1. CreateUser.test.ts
2. AddCoins.test.ts
3. CreateChallenge.test.ts
4. PurchaseReward.test.ts

Each test file refactor should:

1. Replace inline mocks with in-memory repository instantiation
2. Use seed() for test data setup where appropriate
3. Call reset() in beforeEach for isolation
4. Remove 70%+ of mock boilerplate

**Example Transformation:**

Before (150 lines):

```typescript
const mockRepo: UserRepository = {
  create: mock(() => Promise.resolve(mockUser)),
  findById: mock(() => Promise.resolve(null)),
  // ... 20+ more lines
};
```

After (10 lines):

```typescript
const repo = new InMemoryUserRepository();
repo.seed([mockUser]);
```

**Success Criteria:**

- [ ] Test file size reduced by 50%+
- [ ] All tests still pass
- [ ] No inline mocks remaining
- [ ] Proper test isolation (reset() in beforeEach)

#### Verification

**Level:** Panel of 2 Judges
**Threshold:** 4.5/5.0

| Criterion       | Weight | Description                               |
| --------------- | ------ | ----------------------------------------- |
| Deduplication   | 0.40   | Significant reduction in mock boilerplate |
| Correctness     | 0.40   | All tests pass, behavior unchanged        |
| Maintainability | 0.20   | Clean, readable test code                 |

### Step 6: Refactor Remaining Test Files

**Agent:** haiku (parallel subagents)
**Execution:** Parallel
**Dependencies:** Step 5

**Description:**

Refactor remaining test files:

- UpdateUser.test.ts
- GetUser.test.ts
- RemoveCoins.test.ts
- GetChallenge.test.ts
- UpdateChallenge.test.ts
- UpdateChallengeStatus.test.ts
- CreateReward.test.ts
- GetNotification.test.ts
- GetDeliveries.test.ts
- GetCoinStatistics.test.ts

#### Verification

**Level:** Single Judge per file
**Threshold:** 4.0/5.0

### Step 7: Run Full Test Suite and Verify

**Agent:** sonnet
**Execution:** Sequential
**Dependencies:** Step 6

**Description:**

1. Run `bun test` to verify all tests pass
2. Run `bun test:coverage` to ensure coverage thresholds met
3. Run `bun run depcruise` to verify architecture rules
4. Fix any failing tests or violations

**Success Criteria:**

- [ ] All unit tests pass
- [ ] No coverage regressions
- [ ] No dependency-cruiser violations
- [ ] TypeScript compilation succeeds

#### Verification

**Level:** Single Judge
**Threshold:** 4.0/5.0

| Criterion      | Weight | Description                       |
| -------------- | ------ | --------------------------------- |
| Test Pass Rate | 0.50   | 100% of tests pass                |
| No Regressions | 0.30   | No new failures, no coverage loss |
| Architecture   | 0.20   | No dependency violations          |

## Definition of Done

- [ ] All acceptance criteria met
- [ ] 17 in-memory repository classes created
- [ ] Base InMemoryRepository class with generic CRUD
- [ ] All repository port interfaces have in-memory implementations
- [ ] High-priority test files refactored (4 files)
- [ ] All tests pass
- [ ] Code coverage maintained or improved
- [ ] No dependency-cruiser violations
- [ ] Documentation updated (this spec)
- [ ] Clean imports via `@mirai-app/adapters/test-utils`

## Migration Guide for Future Tests

When writing new tests, use this pattern:

```typescript
import { describe, it, expect, beforeEach } from "bun:test";
import { InMemoryUserRepository } from "@mirai-app/adapters/test-utils";
import { CreateUserUseCase } from "./CreateUser";

describe("[UNIT] CreateUserUseCase", () => {
  let repo: InMemoryUserRepository;
  let useCase: CreateUserUseCase;

  beforeEach(() => {
    repo = new InMemoryUserRepository();
    useCase = new CreateUserUseCase(repo);
  });

  it("creates a user", async () => {
    const result = await useCase.execute({
      authUserId: "auth-123",
      firstName: "John",
      lastName: "Doe",
    });

    expect(result.authUserId).toBe("auth-123");

    // Verify data was actually stored
    const stored = await repo.findByAuthUserId("auth-123");
    expect(stored).not.toBeNull();
  });
});
```

### References

- Clean Architecture: Ports and Adapters pattern
- DDD: Repository pattern
- bun:test documentation
- Effect TS for async handling in adapters

### Notes for Implementers

1. **Type Safety**: Ensure all repository implementations have strict typing - no `any`
2. **State Isolation**: Always call `reset()` in `beforeEach` to prevent test pollution
3. **Complex Queries**: For methods with complex filtering (e.g., `findByTripIdAndStatus`), implement actual filter logic
4. **Async**: All methods should return Promises to match repository interfaces
5. **Effect Integration**: Some repositories use Effect - ensure compatibility
