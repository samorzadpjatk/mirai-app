# Codebase Analysis: Fix Cyclic Dependencies Between adapters and frameworks

## Summary

This analysis identifies all cyclic dependencies between `packages/adapters` and `packages/frameworks`, providing a comprehensive map for refactoring.

### Dependency Direction Overview

```
Current State (VIOLATION):
  adapters ──► frameworks (33 imports of Prisma)
  frameworks ──► adapters (3 imports of AppRouter/authServer)

Target State (Clean Architecture):
  frameworks ──► adapters ──► use-cases ──► domain
       ▲_________________________________________│
       (Frameworks can depend on all inner layers)
```

## Imports: adapters → frameworks (33 total)

### Category 1: PrismaClient Imports (19 files)

These files import `PrismaClient` for database operations:

| #   | File                                                   | Import Statement                                                        | Usage                          |
| --- | ------------------------------------------------------ | ----------------------------------------------------------------------- | ------------------------------ |
| 1   | `src/gateways/PrismaUserRepository.ts`                 | `import type { PrismaClient } from "@mirai-app/frameworks/prisma/client"`    | Repository database operations |
| 2   | `src/gateways/PrismaTripRepository.ts`                 | `import type { PrismaClient } from "@mirai-app/frameworks/prisma/client"`    | Repository database operations |
| 3   | `src/gateways/PrismaChallengeRepository.ts`            | `import type { PrismaClient } from "@mirai-app/frameworks/prisma/client"`    | Repository database operations |
| 4   | `src/gateways/PrismaGroupRepository.ts`                | `import type { PrismaClient } from "@mirai-app/frameworks/prisma/client"`    | Repository database operations |
| 5   | `src/gateways/PrismaRewardRepository.ts`               | `import type { PrismaClient } from "@mirai-app/frameworks/prisma/client"`    | Repository database operations |
| 6   | `src/gateways/PrismaNotificationRepository.ts`         | `import type { PrismaClient } from "@mirai-app/frameworks/prisma/client"`    | Repository database operations |
| 7   | `src/gateways/PrismaChallengeSubmissionRepository.ts`  | `import type { PrismaClient } from "@mirai-app/frameworks/prisma/client"`    | Repository database operations |
| 8   | `src/gateways/PrismaSponsorRepository.ts`              | `import type { PrismaClient } from "@mirai-app/frameworks/prisma/client"`    | Repository database operations |
| 9   | `src/gateways/PrismaLocationRepository.ts`             | `import type { PrismaClient } from "@mirai-app/frameworks/prisma/client"`    | Repository database operations |
| 10  | `src/gateways/PrismaChallengeVoteRepository.ts`        | `import type { PrismaClient } from "@mirai-app/frameworks/prisma/client"`    | Repository database operations |
| 11  | `src/gateways/PrismaSubmissionReportRepository.ts`     | `import type { PrismaClient } from "@mirai-app/frameworks/prisma/client"`    | Repository database operations |
| 12  | `src/gateways/PrismaCoinTransactionRepository.ts`      | `import type { PrismaClient } from "@mirai-app/frameworks/prisma"`           | Repository database operations |
| 13  | `src/gateways/PrismaNotificationDeliveryRepository.ts` | `import type { PrismaClient } from "@mirai-app/frameworks/prisma"`           | Repository database operations |
| 14  | `src/gateways/BasePrismaRepository.ts`                 | `import type { PrismaClient } from "@mirai-app/frameworks/prisma/client"`    | Base class for repositories    |
| 15  | `src/api/trpc.ts`                                      | `import { createDb, type PrismaClient } from "@mirai-app/frameworks/prisma"` | tRPC context creation          |
| 16  | `src/utils/repository-factory.ts`                      | `import type { PrismaClient } from "@mirai-app/frameworks/prisma"`           | Factory function               |
| 17  | `src/services/PrismaTripAccessChecker.ts`              | `import type { PrismaClient } from "@mirai-app/frameworks/prisma"`           | Service logic                  |
| 18  | `src/services/PrismaGroupCoinsService.ts`              | `import type { PrismaClient } from "@mirai-app/frameworks/prisma"`           | Service logic                  |
| 19  | `src/utils/trpc-utils/tripGuards.ts`                   | `import type { PrismaClient } from "@mirai-app/frameworks/prisma"`           | tRPC utility functions         |

### Category 2: Prisma Namespace Types (9 files)

These files import `Prisma` namespace for types:

| #   | File                                              | Import Statement                                              | Usage            |
| --- | ------------------------------------------------- | ------------------------------------------------------------- | ---------------- |
| 1   | `src/services/PrismaCoinTransactionService.ts`    | `import type { Prisma } from "@mirai-app/frameworks/prisma"`       | Type definitions |
| 2   | `src/services/PrismaCoinService.ts`               | `import type { Prisma } from "@mirai-app/frameworks/prisma"`       | Type definitions |
| 3   | `src/services/PrismaRankingActivityService.ts`    | `import type { Prisma } from "@mirai-app/frameworks/prisma"`       | Type definitions |
| 4   | `src/services/PrismaNotificationSenderService.ts` | `import type { Prisma } from "@mirai-app/frameworks/prisma"`       | Type definitions |
| 5   | `src/services/notificationService.ts`             | `import { type PrismaClient } from "@mirai-app/frameworks/prisma"` | Service logic    |
| 6   | `src/services/PrismaTripPointsCalculator.ts`      | `import type { PrismaClient } from "@mirai-app/frameworks/prisma"` | Service logic    |
| 7   | `src/utils/trpc-utils/notifications.ts`           | `import type { Prisma } from "@mirai-app/frameworks/prisma"`       | tRPC utilities   |
| 8   | `src/utils/trpc-utils/recurringChallenges.ts`     | `import { type Prisma } from "@mirai-app/frameworks/prisma"`       | tRPC utilities   |
| 9   | `src/utils/trpc-utils/activityFeed.ts`            | `import { type Prisma } from "@mirai-app/frameworks/prisma"`       | tRPC utilities   |

### Category 3: Prisma Model Types (3 files)

These files import User, Role, and other model types:

| #   | File                                                | Import Statement                                                          | Usage          |
| --- | --------------------------------------------------- | ------------------------------------------------------------------------- | -------------- |
| 1   | `src/controllers/auth/authServer.ts`                | `import type { User, Role, PrismaClient } from "@mirai-app/frameworks/prisma"` | Auth logic     |
| 2   | `src/controllers/auth/__tests__/authServer.test.ts` | `import type { User, Role, PrismaClient } from "@mirai-app/frameworks/prisma"` | Test mocks     |
| 3   | `src/utils/trpc-utils/__tests__/*.test.ts`          | `import type { Prisma } from "@mirai-app/frameworks/prisma"`                   | Test utilities |

### Category 4: Test File Imports (3 files)

Test files with additional Prisma imports:

| #   | File                                                         | Import Statement                                        |
| --- | ------------------------------------------------------------ | ------------------------------------------------------- |
| 1   | `src/utils/trpc-utils/__tests__/notifications.test.ts`       | `import type { Prisma } from "@mirai-app/frameworks/prisma"` |
| 2   | `src/utils/trpc-utils/__tests__/recurringChallenges.test.ts` | `import type { Prisma } from "@mirai-app/frameworks/prisma"` |
| 3   | `src/utils/trpc-utils/__tests__/activityFeed.test.ts`        | `import type { Prisma } from "@mirai-app/frameworks/prisma"` |

## Imports: frameworks → adapters (3 total)

| #   | File                         | Import Statement                                           | Usage                |
| --- | ---------------------------- | ---------------------------------------------------------- | -------------------- |
| 1   | `src/trpc/client/react.ts`   | `import type { AppRouter } from "@mirai-app/adapters/api/root"` | React hooks for tRPC |
| 2   | `src/trpc/client/vanilia.ts` | `import type { AppRouter } from "@mirai-app/adapters/api/root"` | Vanilla tRPC client  |
| 3   | `src/auth/server.ts`         | `from "@mirai-app/adapters/auth/authServer"` (multiple exports) | Server-side auth     |

**Note**: These imports are actually **CORRECT** according to Clean Architecture! Frameworks (outer layer) importing from Adapters (inner layer) follows the dependency rule.

However, the **adapters → frameworks** direction (33 Prisma imports) is the **VIOLATION** that must be fixed.

## Files Affected Summary

### Files to Modify (33 files in adapters)

#### Gateways (15 files)

All Prisma repository implementations need constructor injection:

- `PrismaUserRepository.ts`
- `PrismaTripRepository.ts`
- `PrismaChallengeRepository.ts`
- `PrismaGroupRepository.ts`
- `PrismaRewardRepository.ts`
- `PrismaNotificationRepository.ts`
- `PrismaChallengeSubmissionRepository.ts`
- `PrismaSponsorRepository.ts`
- `PrismaLocationRepository.ts`
- `PrismaChallengeVoteRepository.ts`
- `PrismaSubmissionReportRepository.ts`
- `PrismaCoinTransactionRepository.ts`
- `PrismaNotificationDeliveryRepository.ts`
- `PrismaNotificationScheduleRepository.ts` (not in current list but likely exists)
- `PrismaActivityFeedRepository.ts` (not in current list but likely exists)
- `BasePrismaRepository.ts`

#### Services (7 files)

- `PrismaCoinTransactionService.ts`
- `PrismaCoinService.ts`
- `PrismaRankingActivityService.ts`
- `PrismaNotificationSenderService.ts`
- `notificationService.ts`
- `PrismaTripPointsCalculator.ts`
- `PrismaTripAccessChecker.ts`
- `PrismaGroupCoinsService.ts`

#### Controllers (1 file)

- `auth/authServer.ts`

#### API (1 file)

- `api/trpc.ts`

#### Utils (6 files)

- `repository-factory.ts`
- `trpc-utils/tripGuards.ts`
- `trpc-utils/notifications.ts`
- `trpc-utils/recurringChallenges.ts`
- `trpc-utils/activityFeed.ts`

#### Tests (3 files)

- `auth/__tests__/authServer.test.ts`
- `trpc-utils/__tests__/notifications.test.ts`
- `trpc-utils/__tests__/recurringChallenges.test.ts`
- `trpc-utils/__tests__/activityFeed.test.ts`

### Files to Create (in frameworks)

1. **Factory Functions** - Create repositories with injected PrismaClient:
   - `src/factories/repositories.ts` - Factory for all repositories
   - `src/factories/services.ts` - Factory for all services
   - `src/factories/index.ts` - Barrel export

2. **Composition Root** - Wire all dependencies:
   - `src/composition/root.ts` - Main composition root

### Files to Modify (in frameworks)

1. `src/index.ts` - Export factories
2. Backend server entry point - Use factories instead of direct instantiation

## Risk Assessment

### High Risk

1. **BasePrismaRepository.ts** - Base class change affects 15+ repositories
2. **auth/authServer.ts** - Core authentication logic, must not break
3. **api/trpc.ts** - tRPC context affects all API routes

### Medium Risk

1. **Services** - Business logic changes, need comprehensive testing
2. **tRPC utilities** - Guard functions used across multiple routers

### Low Risk

1. **Test files** - Can be updated alongside main files
2. **Repository implementations** - Simple constructor parameter addition

## Key Integration Points

1. **tRPC Context** - `api/trpc.ts` creates context with `createDb()` - must inject instead
2. **Repository Instantiation** - Currently direct instantiation in routers/controllers
3. **Service Instantiation** - Some services create their own PrismaClient
4. **Auth Server** - Uses Prisma types directly in function signatures

## Dependency Graph Visualization

```
Before (Cyclic):
┌─────────────────┐     ┌──────────────────┐
│   adapters      │◄────│    frameworks    │
│                 │     │                  │
│ PrismaClient ◄──┼─────┼─── PrismaClient  │
│ (WRONG!)        │     │    (exports)     │
└─────────────────┘     └──────────────────┘
        │                        │
        ▼                        ▼
┌─────────────────┐     ┌──────────────────┐
│   use-cases     │     │     domain       │
└─────────────────┘     └──────────────────┘

After (Clean):
┌─────────────────┐     ┌──────────────────┐
│   adapters      │◄────│    frameworks    │
│                 │     │                  │
│ PrismaClient ───┼─────┼───► PrismaClient │
│ (injected)      │     │    (injects)     │
└─────────────────┘     └──────────────────┘
        │                        │
        ▼                        ▼
┌─────────────────┐     ┌──────────────────┐
│   use-cases     │     │     domain       │
└─────────────────┘     └──────────────────┘
```

## Recommended Refactoring Order

1. **Phase 1: Setup** (Low risk)
   - Create factory functions in frameworks
   - Create composition root

2. **Phase 2: Base Class** (High risk, but foundational)
   - Modify `BasePrismaRepository` to accept `PrismaClient`
   - Update all repositories to pass `prisma` to base

3. **Phase 3: Repositories** (Low risk, high volume)
   - Update 15 repositories with constructor injection
   - Update factory functions to create instances

4. **Phase 4: Services** (Medium risk)
   - Update 8 services with constructor injection
   - Update service factory

5. **Phase 5: tRPC Context** (High risk)
   - Refactor `api/trpc.ts` to accept database as context property
   - Update all router instantiation points

6. **Phase 6: Auth** (High risk)
   - Refactor `auth/authServer.ts` to use injected Prisma
   - Update auth factory

7. **Phase 7: Utilities & Tests** (Low risk)
   - Update utility functions
   - Update all test files

8. **Phase 8: Verification**
   - Run dependency-cruiser to verify no cycles
   - Run full test suite
   - Build and deploy

## Verification Commands

After refactoring, run these commands to verify:

```bash
# Check for any remaining cyclic dependencies
bunx dependency-cruiser --validate .dependency-cruiser.cjs .

# Check for any remaining @frameworks imports in adapters
grep -r "from.*@mirai-app/frameworks/prisma" packages/adapters/src --include="*.ts"
# Should return empty (or only type imports if acceptable)

# Run tests
bun test

# Build
bun run build
```
