# InversifyJS & Effect.ts Integration Analysis

## Executive Summary

This document analyzes the codebase impact of implementing InversifyJS dependency injection and Effect.ts functional programming patterns in the Mirai App monorepo.

**Assessment**: The codebase already has a strong DI pattern foundation with constructor injection. InversifyJS would be a **Medium effort** enhancement, while Effect.ts represents a **High effort** paradigm shift.

---

## Current State Overview

### Layer Structure

- **Domain Layer** (`packages/domain/`): Pure business logic with `Result<T,E>` error handling
- **Use Cases Layer** (`packages/use-cases/`): 75 interactors with constructor injection
- **Adapters Layer** (`packages/adapters/`): 16 Prisma repositories + 19 controllers
- **Frameworks Layer** (`packages/frameworks/`): Prisma, Supabase clients
- **Apps Layer** (`apps/`): tRPC backend server

### Current DI Pattern

The codebase uses **manual constructor injection** with a factory pattern:

- Repositories receive `PrismaClient` via constructor
- Use cases receive repositories via constructor
- Controllers receive repositories via constructor
- tRPC procedures manually instantiate controllers

### Key Infrastructure

- `repository-factory.ts`: Repository instantiation utilities
- `BasePrismaRepository.ts`: Abstract base for all Prisma repositories
- TRPC context (`api/trpc.ts`): Provides db/supabase to request handlers
- Controllers index (`api/controllers/index.ts`): tRPC-wrapped controller procedures

---

## Repository Analysis (16 Files)

### Prisma Repositories (packages/adapters/src/gateways/)

| Repository                              | Pattern    | Prisma Injected   | Notes                    |
| --------------------------------------- | ---------- | ----------------- | ------------------------ |
| BasePrismaRepository.ts                 | Base class | Yes (constructor) | Abstract base with CRUD  |
| PrismaUserRepository.ts                 | Standard   | Yes               | New pattern with adapter |
| PrismaChallengeRepository.ts            | Standard   | Yes               | 81% pattern coverage     |
| PrismaGroupRepository.ts                | Standard   | Yes               | Refactored to base       |
| PrismaTripRepository.ts                 | Standard   | Yes               | Refactored to base       |
| PrismaNotificationRepository.ts         | Standard   | Yes               | Refactored to base       |
| PrismaChallengeSubmissionRepository.ts  | Standard   | Yes               | Refactored to base       |
| PrismaChallengeVoteRepository.ts        | Standard   | Yes               | Refactored to base       |
| PrismaLocationRepository.ts             | Standard   | Yes               | Refactored to base       |
| PrismaSponsorRepository.ts              | Standard   | Yes               | Refactored to base       |
| PrismaSubmissionReportRepository.ts     | Standard   | Yes               | Refactored to base       |
| PrismaActivityFeedRepository.ts         | Standard   | Yes               | Legacy pattern (complex) |
| PrismaNotificationScheduleRepository.ts | Standard   | Yes               | Not yet refactored       |
| PrismaRewardRepository.ts               | Standard   | Yes               | Refactored to base       |
| PrismaCoinTransactionRepository.ts      | Standard   | Yes               | Refactored to base       |
| PrismaNotificationDeliveryRepository.ts | Standard   | Yes               | Refactored to base       |

**DI Readiness**: ✅ **EXCELLENT** - All repositories already use constructor injection with PrismaClient. Ready for Inversify container.

---

## Use Case Analysis (75 Files)

### Interactors with Single Repository (68 files - 91%)

Most use cases follow the simple pattern:

```typescript
constructor(private repoName: RepoName) {}
```

Examples:

- CreateUserUseCase → UserRepository
- GetChallengeUseCase → ChallengeRepository
- AddCoinsUseCase → CoinTransactionRepository

### Complex Use Cases with Multiple Dependencies (7 files - 9%)

| Use Case                                | Dependencies                   | Complexity |
| --------------------------------------- | ------------------------------ | ---------- |
| PurchaseRewardUseCase                   | 5 repos/services               | HIGH       |
| CreateActivityUseCase                   | ActivityFeedRepository only    | MEDIUM     |
| UpdateSubmissionUseCase                 | ChallengeSubmissionRepository  | LOW        |
| GetReportsUseCase                       | SubmissionReportRepository     | LOW        |
| GetNotificationScheduleExecutionHistory | NotificationScheduleRepository | LOW        |
| CreateNotificationScheduleUseCase       | NotificationScheduleRepository | LOW        |
| CreateSubmissionUseCase                 | ChallengeSubmissionRepository  | LOW        |

**DI Readiness**: ✅ **EXCELLENT** - All use cases use constructor injection. Inversify can inject repositories automatically.

---

## Controller Analysis (19 Files)

### Controller Pattern

Controllers wrap use cases and handle tRPC integration:

| Controller                          | Repository Dependencies        | Notes                   |
| ----------------------------------- | ------------------------------ | ----------------------- |
| user-controller.ts                  | UserRepository                 | Simple wrapper          |
| challenge-controller.ts             | ChallengeRepository            | Simple wrapper          |
| group-controller.ts                 | GroupRepository                | Simple wrapper          |
| trip-controller.ts                  | TripRepository                 | Simple wrapper          |
| location-controller.ts              | LocationRepository             | Simple wrapper          |
| sponsor-controller.ts               | SponsorRepository              | Simple wrapper          |
| notification-controller.ts          | NotificationRepository         | Simple wrapper          |
| activityFeed-controller.ts          | ActivityFeedRepository         | Simple wrapper          |
| challengeSubmission-controller.ts   | ChallengeSubmissionRepository  | Simple wrapper          |
| challengeVote-controller.ts         | ChallengeVoteRepository        | Simple wrapper          |
| submissionReport-controller.ts      | SubmissionReportRepository     | Simple wrapper          |
| notification-schedule-controller.ts | NotificationScheduleRepository | Complex logic           |
| storage-controller.ts               | SupabaseClient only            | No repository           |
| reward-controller.ts                | RewardRepository + services    | Uses service layer      |
| coin-controller.ts                  | CoinTransactionRepository      | Uses multiple use cases |
| coin-transaction-controller.ts      | CoinTransactionRepository      | Extended methods        |
| notification-delivery-controller.ts | NotificationDeliveryRepository | Delivery tracking       |
| auth/authServer.ts                  | PrismaClient directly          | Authentication          |

**DI Readiness**: ✅ **GOOD** - Controllers already use constructor injection. Minor complexity with service dependencies.

---

## tRPC Router Analysis (18 Files)

### Current Instantiation Pattern

In `packages/adapters/src/api/controllers/index.ts` and routers:

```typescript
// Current pattern (112 occurrences across codebase)
const repo = new PrismaUserRepository(ctx.db);
const controller = new UserController(repo);
const result = await controller.getById({ id: input.id });
```

### Router Files

- `activityFeed.ts`
- `challenge.ts`
- `challengeSubmission.ts`
- `challengeVote.ts`
- `coin.ts`
- `coinTransaction.ts`
- `group.ts`
- `location.ts`
- `notificationDelivery.ts`
- `notificationSchedule.ts`
- `notificationSender.ts`
- `notifications.ts`
- `reward.ts`
- `sponsor.ts`
- `storage.ts`
- `submissionReport.ts`
- `trip.ts`
- `user.ts`

**Integration Point**: The tRPC `createTRPCContext` is the **KEY INJECTION POINT** where Inversify container would resolve all dependencies.

---

## Result<T,E> Pattern Analysis

### Current Usage

- **114 import statements** for Result type across packages
- **Custom implementation** in `packages/domain/src/utils/result.ts`
- **Full API**: `ok()`, `err()`, `isSuccess()`, `isError()`, `map()`, `flatMap()`, etc.

### Files Using Result Pattern

- **Domain entities**: 15 entities with Result-based validation
- **Value objects**: 5 value objects (CoinAmount, VotePosition, etc.)
- **Use cases**: 75 interactors with Result return types
- **Controllers**: All controllers handle Result types

### Effect.ts Impact Assessment

| Aspect             | Current              | With Effect.ts     | Effort |
| ------------------ | -------------------- | ------------------ | ------ |
| Error handling     | Result<T,E>          | Effect<A,E,R>      | HIGH   |
| Async operations   | async/await          | Effect.gen         | HIGH   |
| Repository returns | Promise<T>           | Effect<never,E,T>  | MEDIUM |
| Use case returns   | Promise<Result<T,E>> | Effect<A,E,T>      | HIGH   |
| Testing            | Simple mocks         | Effect test layers | HIGH   |

**Risk**: Effect.ts is a paradigm shift requiring retraining. 145+ files would need modification.

---

## Files Summary

### Files to Modify (InversifyJS)

| Layer       | Count | Primary Changes                   |
| ----------- | ----- | --------------------------------- |
| Framework   | 2     | Container setup, DI configuration |
| Adapters    | 16    | Repository @injectable decorators |
| Use Cases   | 75    | Use case @injectable decorators   |
| Controllers | 19    | Controller @injectable decorators |
| TRPC        | 18    | Router dependency resolution      |
| Tests       | ~50   | Container setup for tests         |

**Total to Modify**: ~180 files

### Files to Create (InversifyJS)

| File                | Purpose                    | Location                      |
| ------------------- | -------------------------- | ----------------------------- |
| Container.ts        | DI container configuration | `packages/frameworks/src/di/` |
| types.ts            | Injection symbols/tokens   | `packages/frameworks/src/di/` |
| inversify.config.ts | Binding definitions        | `packages/frameworks/src/di/` |
| RepositoryModule.ts | Repository bindings        | `packages/adapters/src/di/`   |
| UseCaseModule.ts    | Use case bindings          | `packages/use-cases/src/di/`  |
| ControllerModule.ts | Controller bindings        | `packages/adapters/src/di/`   |

**Total to Create**: 6 files

### Files Unaffected (InversifyJS)

| Layer          | Count | Reason                       |
| -------------- | ----- | ---------------------------- |
| Domain         | 35    | Pure logic, no DI needed     |
| Routers (thin) | ~10   | Just wiring, already handled |

---

## Risk Assessment

### Overall Risk: **MEDIUM**

### Risk Factors

| Factor               | Level  | Mitigation                    |
| -------------------- | ------ | ----------------------------- |
| Dependency Inversion | LOW    | Pattern already exists        |
| Test Coverage        | MEDIUM | Need container mocks          |
| Layer Boundaries     | LOW    | Clean Architecture maintained |
| Complexity Increase  | MEDIUM | New decorators/symbols        |
| Team Learning Curve  | MEDIUM | Inversify documentation       |
| Runtime Overhead     | LOW    | Minimal container overhead    |

### High-Risk Areas

1. **Complex Use Cases** (PurchaseRewardUseCase with 5 deps) - Need careful container configuration
2. **Service Layer** (PrismaCoinService, etc.) - Mixed with repositories
3. **Auth Server** (auth/authServer.ts) - Uses Prisma directly, needs special handling

### Low-Risk Areas

1. **Simple CRUD repositories** - Straightforward @injectable
2. **Single-repository use cases** - Standard constructor injection
3. **BasePrismaRepository** - Only needs container at base class

---

## Key Integration Points (5 Points)

### 1. tRPC Context Creation (`packages/adapters/src/api/trpc.ts:152`)

```typescript
export const createTRPCContext = (opts: { db; supabase; headers }) => {
  // RESOLVE: Container would create all dependencies here
  return {
    db: opts.db,
    supabase: opts.supabase,
    // repositories: container.getAllRepositories()
  };
};
```

### 2. Router Controllers (`packages/adapters/src/api/controllers/index.ts`)

```typescript
// CURRENT: Manual instantiation
const repo = new PrismaUserRepository(ctx.db);
const controller = new UserController(repo);

// WITH INVERSIFY: Container resolution
const controller = container.get(UserController);
```

### 3. Repository Factory (`packages/adapters/src/utils/repository-factory.ts`)

```typescript
// Current factory functions replaced with container bindings
export const RepositoryModule = new ContainerModule((bind) => {
  bind(UserRepository).to(PrismaUserRepository);
});
```

### 4. Use Case Instantiation

```typescript
// CURRENT: Direct constructor
new CreateUserUseCase(userRepository);

// WITH INVERSIFY: Decorator injection
@injectable()
class CreateUserUseCase {
  constructor(@inject(UserRepository) private repo: UserRepository) {}
}
```

### 5. Backend Server (`apps/backend-server/src/server.ts`)

```typescript
// Container initialization point
const container = new Container();
container.load(RepositoryModule, UseCaseModule, ControllerModule);

// Pass container or resolver to tRPC context
```

---

## Effort Estimation

### InversifyJS Implementation

| Phase           | Tasks                                     | Estimated Time |
| --------------- | ----------------------------------------- | -------------- |
| 1. Setup        | Install packages, create container config | 2-4 hours      |
| 2. Repositories | Add @injectable to 16 repositories        | 4-8 hours      |
| 3. Use Cases    | Add @injectable to 75 interactors         | 8-16 hours     |
| 4. Controllers  | Add @injectable to 19 controllers         | 4-8 hours      |
| 5. TRPC Wiring  | Update router instantiation               | 4-8 hours      |
| 6. Tests        | Update test setup with container mocks    | 8-16 hours     |
| 7. Validation   | Run full test suite, CI checks            | 4-8 hours      |

**Total Estimated Effort**: 34-68 hours (1-2 developer weeks)

### Effect.ts Implementation

| Phase           | Tasks                            | Estimated Time |
| --------------- | -------------------------------- | -------------- |
| 1. Learning     | Team training on Effect patterns | 40 hours       |
| 2. Domain Layer | Refactor Result → Effect         | 40-80 hours    |
| 3. Use Cases    | Refactor async → Effect.gen      | 80-160 hours   |
| 4. Repositories | Refactor Promise → Effect        | 40-80 hours    |
| 5. Controllers  | Refactor error handling          | 40-80 hours    |
| 6. Testing      | Effect test patterns             | 40-80 hours    |

**Total Estimated Effort**: 280-520 hours (7-13 developer weeks)

---

## Recommendations

### Phase 1: InversifyJS (Recommended)

**Priority**: HIGH  
**Timeline**: 1-2 weeks  
**Benefits**:

- Eliminates manual instantiation
- Enables better testing (mock injection)
- Prepares for future refactoring
- Minimal paradigm shift

### Phase 2: Effect.ts (Deferred)

**Priority**: LOW  
**Timeline**: Post-MVP / Technical Debt Sprint  
**Rationale**:

- Massive refactoring effort
- Requires team training
- Current Result<T,E> pattern is adequate
- Consider for greenfield modules only

### Immediate Actions

1. ✅ Install `inversify` and `reflect-metadata` packages
2. ✅ Create `packages/frameworks/src/di/` directory structure
3. ✅ Implement container with RepositoryModule (16 repos)
4. ✅ Migrate one complete router chain as pilot (e.g., user router)
5. ✅ Validate with tests and CI
6. ✅ Roll out to remaining 17 routers incrementally

---

## Conclusion

The Mirai App codebase is **well-positioned** for InversifyJS adoption due to:

- ✅ Existing constructor injection patterns
- ✅ Clean Architecture layer boundaries
- ✅ BasePrismaRepository abstraction
- ✅ Repository factory utilities

Effect.ts represents a more significant architectural shift that should be evaluated separately after InversifyJS stabilizes.

**Next Step**: Create specification for InversifyJS pilot implementation using `/sdd:add-task` skill.

---

_Analysis generated: 2026-04-09_  
_Scope: InversifyJS DI + Effect.ts FP patterns_  
_Analyst: Code Exploration Agent_
