# Codebase Analysis: awilix-modular Implementation

> **Historical pre-migration analysis snapshot (kept for audit/reference).**
>
> This document captures the state of the codebase BEFORE migration to awilix-modular.
> References to `@provide`, `@inject`, `@injectable` describe the OLD state (now removed).
> The migration to awilix-modular has been completed.

**Task**: Implement dependency injection with awilix-modular  
**Phase**: 2b (Codebase Analysis - Historical)  
**Date**: 2026-04-09  
**Analyst**: sdd:code-explorer agent  
**Status**: ✅ Migration completed - this document kept for historical reference only

---

## Executive Summary

At the time of this analysis (April 2026), the codebase planned to migrate from a decorator-based DI approach to **awilix-modular**. This document is preserved as historical context. The migration has since been completed successfully.

### Key Findings (Historical State)

- **16 repositories** used constructor injection (planned for awilix-modular conversion)
- **17 controllers** instantiated manually in tRPC wrappers (main integration point)
- **73 use cases** used constructor-based injection
- **19 tRPC routers** are thin delegators to controllers
- **Root challenge**: Request-scoped PrismaClient per tRPC request

**Note:** References to "DI decorators", "@provide", "@inject" below describe the planned architecture at analysis time. The actual implementation uses clean constructor injection with awilix-modular registration (no decorators).

### Risk Level: **MEDIUM-HIGH**

Rationale: While the codebase has DI foundations, the tRPC integration pattern (manual instantiation in controller wrappers) requires significant refactoring. The request-scoped container pattern with awilix-modular is powerful but introduces complexity for transaction management.

---

## 1. Current Repository Pattern Analysis

### Location

`packages/adapters/src/gateways/` (16 repositories)

### Pattern (Historical - Pre-Migration)

The following shows the pattern the analysis anticipated (now superseded by awilix-modular):

```typescript
// HISTORICAL: Planned decorator-based approach (not implemented)
// Actual implementation uses clean constructor injection with awilix-modular
@provide(TYPES.UserRepository)  // Historical - not in final implementation
export class PrismaUserRepository extends BasePrismaRepository<...>
  implements UserRepository
{
  constructor(@inject(TYPES.PrismaClient) prisma: PrismaClient) {  // Historical
    super(prisma, { model: prisma.user }, UserMapperAdapter);
  }
}
```

### Base Repository

`BasePrismaRepository.ts` provides generic CRUD and accepts `PrismaClient` via constructor.

### Repositories List

| Repository                           | File                                    | Status at Analysis Time |
| ------------------------------------ | --------------------------------------- | ----------------------- |
| PrismaUserRepository                 | PrismaUserRepository.ts                 | Constructor injection   |
| PrismaChallengeRepository            | PrismaChallengeRepository.ts            | Constructor injection   |
| PrismaTripRepository                 | PrismaTripRepository.ts                 | Constructor injection   |
| PrismaGroupRepository                | PrismaGroupRepository.ts                | Constructor injection   |
| PrismaNotificationRepository         | PrismaNotificationRepository.ts         | Constructor injection   |
| PrismaActivityFeedRepository         | PrismaActivityFeedRepository.ts         | Constructor injection   |
| PrismaChallengeSubmissionRepository  | PrismaChallengeSubmissionRepository.ts  | Constructor injection   |
| PrismaChallengeVoteRepository        | PrismaChallengeVoteRepository.ts        | Constructor injection   |
| PrismaLocationRepository             | PrismaLocationRepository.ts             | Constructor injection   |
| PrismaRewardRepository               | PrismaRewardRepository.ts               | Constructor injection   |
| PrismaSponsorRepository              | PrismaSponsorRepository.ts              | Constructor injection   |
| PrismaSubmissionReportRepository     | PrismaSubmissionReportRepository.ts     | Constructor injection   |
| PrismaCoinTransactionRepository      | PrismaCoinTransactionRepository.ts      | Constructor injection   |
| PrismaNotificationDeliveryRepository | PrismaNotificationDeliveryRepository.ts | Constructor injection   |
| PrismaNotificationScheduleRepository | PrismaNotificationScheduleRepository.ts | Constructor injection   |
| BasePrismaRepository                 | BasePrismaRepository.ts                 | Base class              |

> **Historical Note:** The analysis originally planned for decorator-based DI (`@provide`, `@inject`). The actual implementation uses clean constructor injection with `createStaticModule()` registration (no decorators required).

### Migration Notes (Historical Planning)

- All repositories already use constructor injection ✓
- Migrated to awilix-modular `createStaticModule()` registration (no decorators needed)
- Clean constructor injection pattern maintained throughout

---

## 2. Current Controller Pattern Analysis

### Location

`packages/adapters/src/controllers/` (17 controllers)

### Pattern

```typescript
export class UserController {
  constructor(private userRepository: UserRepository) {}
  // Methods return ControllerResult types
}
```

### Controllers List

| Controller                     | Dependencies                               | DI Status     |
| ------------------------------ | ------------------------------------------ | ------------- |
| UserController                 | UserRepository                             | No decorators |
| ChallengeController            | ChallengeRepository                        | No decorators |
| TripController                 | TripRepository                             | No decorators |
| GroupController                | GroupRepository                            | No decorators |
| NotificationController         | NotificationRepository                     | No decorators |
| ActivityFeedController         | ActivityFeedRepository                     | No decorators |
| ChallengeSubmissionController  | ChallengeSubmissionRepository              | No decorators |
| ChallengeVoteController        | ChallengeVoteRepository                    | No decorators |
| LocationController             | LocationRepository                         | No decorators |
| RewardController               | RewardRepository, RewardPurchaseRepository | No decorators |
| NotificationScheduleController | NotificationScheduleRepository             | No decorators |
| NotificationDeliveryController | NotificationDeliveryRepository             | No decorators |
| CoinController                 | CoinService                                | No decorators |
| CoinTransactionController      | CoinTransactionRepository                  | No decorators |
| StorageController              | SupabaseClient                             | No decorators |
| SponsorController              | SponsorRepository                          | No decorators |
| SubmissionReportController     | SubmissionReportRepository                 | No decorators |

### Migration Notes

- Controllers currently receive dependencies via constructor (DI-ready)
- Need to add DI registration to module definitions
- No decorators currently - clean slate for awilix-modular

---

## 3. Current Use Case Pattern Analysis

### Location

`packages/use-cases/src/interactors/` (73 use cases, 8 with tests)

### Pattern (Historical - Pre-Migration)

```typescript
// HISTORICAL: Analysis anticipated decorator-based DI (not implemented)
// Actual implementation uses clean constructor injection
@injectable() // Historical - not in final implementation
export class CreateUserUseCase {
  constructor(
    @inject(TYPES.UserRepository) private userRepository: UserRepository, // Historical
  ) {}
}
```

### Key Use Cases

| Use Case                | Repository Dependencies                                             | Status at Analysis |
| ----------------------- | ------------------------------------------------------------------- | ------------------ |
| CreateUserUseCase       | UserRepository                                                      | Constructor-based  |
| GetUserUseCase          | UserRepository                                                      | Constructor-based  |
| CreateChallengeUseCase  | ChallengeRepository                                                 | Constructor-based  |
| CreateSubmissionUseCase | ChallengeSubmissionRepository, ChallengeRepository, GroupRepository | Constructor-based  |
| AddCoinsUseCase         | GroupRepository, CoinTransactionRepository                          | Constructor-based  |

> **Historical Note:** All use cases use clean constructor injection. The migration to awilix-modular maintained this pattern.

### Migration Notes (Historical Planning)

- All use cases use clean constructor injection ✓
- Successfully migrated to awilix-modular module pattern
- Maintained constructor pattern with `createStaticModule()` registration

---

## 4. tRPC Context Analysis

### Location

`packages/adapters/src/api/trpc.ts` (lines 124-176)

### Current TRPCContext Interface

```typescript
export interface TRPCContext {
  db: PrismaClient; // Per-request instance
  supabase: SupabaseClient; // Per-request instance
  headers: Headers;
  accessToken: string | null;
}
```

### Context Creation (server.ts lines 43-92)

```typescript
createContext: (opts: {
  req: FastifyRequest;
  connectionParams?: Record<string, string>;
}) => {
  const db = createDb(databaseUrl); // Fresh PrismaClient per request
  const supabase = createSupabaseClient(supabaseUrl, supabaseKey);
  return createTRPCContext({ headers, db, supabase, connectionParams });
};
```

### Awilix-Modular Integration Point

The context creation is the **primary integration point** for request-scoped containers:

```typescript
// New approach with awilix-modular
createContext: (opts) => {
  const requestContainer = createRequestContainer();
  requestContainer.register("headers", headers);
  requestContainer.register("accessToken", accessToken);

  return {
    container: requestContainer, // ADD: request-scoped container
    db: requestContainer.resolve<PrismaClient>("prismaClient"),
    supabase: requestContainer.resolve<SupabaseClient>("supabaseClient"),
    headers,
    accessToken,
  };
};
```

---

## 5. Router Analysis

### Location

`packages/adapters/src/api/routers/` (19 routers)

### Pattern

All routers are thin delegators:

```typescript
export const userRouter = createTRPCRouter({
  ...userController,
});
```

### Routers List

| Router                  | Controller Source                          | Lines |
| ----------------------- | ------------------------------------------ | ----- |
| user.ts                 | userController (from controllers/index.ts) | ~16   |
| coin.ts                 | coinController (from controllers/index.ts) | ~16   |
| coinTransaction.ts      | coinTransactionController                  | ~16   |
| notifications.ts        | notificationController                     | ~16   |
| notificationSchedule.ts | notificationScheduleController             | ~16   |
| notificationDelivery.ts | notificationDeliveryController             | ~16   |
| notificationSender.ts   | notificationSenderController               | ~16   |
| location.ts             | locationController                         | ~16   |
| trip.ts                 | tripController                             | ~16   |
| challenge.ts            | challengeController                        | ~16   |
| challengeSubmission.ts  | challengeSubmissionController              | ~16   |
| challengeVote.ts        | challengeVoteController                    | ~16   |
| submissionReport.ts     | submissionReportController                 | ~16   |
| storage.ts              | storageController                          | ~16   |
| reward.ts               | rewardController                           | ~16   |
| activityFeed.ts         | activityFeedController                     | ~16   |
| sponsor.ts              | sponsorController                          | ~16   |
| group.ts                | groupController                            | ~16   |

### Controller Wrapper Pattern (CRITICAL!)

The **actual** controller logic is in `packages/adapters/src/api/controllers/index.ts` (~1700 lines):

```typescript
export const userController = {
  getById: moderatorProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const repo = new PrismaUserRepository(ctx.db); // MANUAL INSTANTIATION
      const controller = new UserController(repo); // MANUAL INSTANTIATION
      const result = await controller.getById({ id: input.id });
      // ...
    }),
};
```

This is the **primary file to refactor** for DI integration.

---

## 6. Files to Create (New Infrastructure)

### Module Definitions

| File                                                     | Purpose                            | Lines Est. |
| -------------------------------------------------------- | ---------------------------------- | ---------- |
| `packages/frameworks/src/di/modules/RepositoryModule.ts` | Registers all 16 repositories      | ~60        |
| `packages/frameworks/src/di/modules/ControllerModule.ts` | Registers all 17 controllers       | ~50        |
| `packages/frameworks/src/di/modules/UseCaseModule.ts`    | Registers all 73 use cases         | ~100       |
| `packages/frameworks/src/di/modules/ServiceModule.ts`    | Registers domain services          | ~40        |
| `packages/frameworks/src/di/AppModule.ts`                | Root module composing all          | ~30        |
| `packages/frameworks/src/di/context.ts`                  | DIContext initialization           | ~50        |
| `packages/frameworks/src/di/types-awilix.ts`             | Awilix-compatible type definitions | ~40        |

### New Exports

- `packages/frameworks/src/di/index.ts` - Update to export new APIs

---

## 7. Files to Modify (Existing)

### Critical Core Files (5 files)

| File                                      | Changes Required                        | Risk   |
| ----------------------------------------- | --------------------------------------- | ------ |
| `packages/frameworks/src/di/container.ts` | Replace legacy DI container with Awilix | High   |
| `packages/frameworks/src/di/index.ts`     | Update exports for new API              | Medium |
| `packages/frameworks/src/di/types.ts`     | Keep symbols or migrate to awilix keys  | Medium |
| `apps/backend-server/src/server.ts`       | Initialize DIContext in createContext   | High   |
| `packages/adapters/src/api/trpc.ts`       | Extend TRPCContext with container       | Medium |

### Controller Wrappers (1 major file)

| File                                             | Changes Required                                     | Risk         |
| ------------------------------------------------ | ---------------------------------------------------- | ------------ |
| `packages/adapters/src/api/controllers/index.ts` | Refactor 19 controller wrappers to use DI resolution | **Critical** |

### Controllers (17 files)

| File                                                        | Changes (Historical Planning) |
| ----------------------------------------------------------- | ----------------------------- |
| `packages/adapters/src/controllers/user-controller.ts`      | Add to module registration    |
| `packages/adapters/src/controllers/challenge-controller.ts` | Add to module registration    |
| `packages/adapters/src/controllers/trip-controller.ts`      | Add to module registration    |
| ... (14 more)                                               | Same pattern                  |

> **Note:** Controllers use clean constructor injection with awilix-modular registration. No decorators needed.

### Repositories (16 files)

| File                                                          | Changes (Historical Planning) |
| ------------------------------------------------------------- | ----------------------------- |
| `packages/adapters/src/gateways/PrismaUserRepository.ts`      | Add to module registration    |
| `packages/adapters/src/gateways/PrismaChallengeRepository.ts` | Add to module registration    |
| ... (14 more)                                                 | Same pattern                  |

> **Note:** Repositories use clean constructor injection with awilix-modular registration. No decorators needed.

### Use Cases (73 files)

All use cases use clean constructor injection. Migrated to awilix-modular with `createStaticModule()` registration.

---

## 8. Files to Delete

| File                                                | Reason                               |
| --------------------------------------------------- | ------------------------------------ |
| `packages/frameworks/src/di/container.ts`           | Replaced by awilix-modular DIContext |
| `packages/frameworks/src/di/test-container.ts`      | Replaced by awilix test utilities    |
| `packages/adapters/src/utils/repository-factory.ts` | Replaced by DI container             |

---

## 9. Interface Documentation

### Current Container API (Legacy)

```typescript
export const container: Container;
export function initializeContainer(): void;
export function createChildContainer(parent?: Container): Container;
export function createTestContainer(): Container;
export function resetContainer(): void;
```

### New Container API (Awilix-modular)

```typescript
// Module definition
type RepositoryModuleDef = ModuleDef<{
  providers: {
    userRepository: UserRepository;
    // ... all repos
  };
  exportKeys: keyof RepositoryModuleDef["providers"];
}>;

export const RepositoryModule: StaticModule<RepositoryModuleDef>;
export type RepositoryModuleDeps = RepositoryModuleDef["deps"];

// Context creation
export interface DIContextConfig {
  framework: FastifyInstance;
  rootProviders: {
    prismaClient: FactoryProvider<PrismaClient>;
    supabaseClient: FactoryProvider<SupabaseClient>;
  };
}

export function createDIContext(config: DIContextConfig): DIContext;

// Request container
export function createRequestContainer(): Container;
```

### TRPCContext Extension

```typescript
export interface TRPCContext {
  db: PrismaClient;
  supabase: SupabaseClient;
  headers: Headers;
  accessToken: string | null;
  container: Container; // NEW: request-scoped DI container
}
```

---

## 10. Integration Points with awilix-modular

### Point 1: Root Container Initialization

**Location**: `apps/backend-server/src/server.ts`

```typescript
import { DIContext } from '@mirai-app/frameworks/di';
import { AppModule } from '@mirai-app/frameworks/di/modules/AppModule';

// Initialize DI context during server creation
DIContext.create(AppModule, {
  framework: server,
  rootProviders: {
    prismaClient: { useFactory: () => createDb(databaseUrl) },
    supabaseClient: { useFactory: () => createSupabaseClient(...) },
  },
});
```

### Point 2: Request-Scoped Container per tRPC Request

**Location**: `apps/backend-server/src/server.ts` (createContext)

```typescript
createContext: (opts) => {
  // Create request-scoped container with PrismaClient
  const requestContainer = createRequestContainer();

  // Register request-specific values
  requestContainer.register('prismaClient', createDb(databaseUrl));
  requestContainer.register('supabaseClient', createSupabaseClient(...));

  return {
    container: requestContainer,
    db: requestContainer.resolve('prismaClient'),
    supabase: requestContainer.resolve('supabaseClient'),
    headers,
    accessToken,
  };
}
```

### Point 3: Controller Resolution in tRPC Wrappers

**Location**: `packages/adapters/src/api/controllers/index.ts`

```typescript
export const userController = {
  getById: moderatorProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      // Resolve controller from request container instead of manual instantiation
      const controller =
        ctx.container.resolve<UserController>("userController");
      const result = await controller.getById({ id: input.id });
      // ...
    }),
};
```

### Point 4: Module Imports for Cross-Layer Dependencies

**Pattern**:

```typescript
type ControllerModuleDef = ModuleDef<{
  providers: {
    userController: UserController;
    // ...
  };
  imports: [typeof RepositoryModule, typeof UseCaseModule];
}>;
```

### Point 5: Scoped PrismaClient with Transactions

**Challenge**: Maintaining transaction scope across multiple repositories
**Solution**: Use `Lifetime.SCOPED` for PrismaClient with `resolveSelf` pattern if needed

---

## 11. Risk Assessment

### Risk Level: **MEDIUM-HIGH** (7/10)

### High Risk Areas

1. **tRPC Controller Wrapper Refactoring** (Critical)
   - File: `packages/adapters/src/api/controllers/index.ts` (~1700 lines)
   - Impact: 19 routers depend on this
   - Mitigation: Incremental migration, keep old pattern during transition

2. **Request-Scoped Container Pattern** (High)
   - Challenge: Proper PrismaClient lifecycle per request
   - Impact: Memory leaks if not handled correctly
   - Mitigation: Extensive testing, use `Lifetime.SCOPED` correctly

3. **Test Container Updates** (High)
   - All tests using `createTestContainer()` need updates
   - Impact: ~50+ test files
   - Mitigation: Create compatibility layer first

### Medium Risk Areas

1. **Repository Module Registration** (Medium)
   - 16 repositories need `createStaticModule()` registration
   - Risk: Missing registration in module definition
   - Mitigation: Automated verification script

2. **Use Case Registration** (Medium)
   - 73 use cases need `createStaticModule()` registration
   - Risk: Constructor injection compatibility
   - Mitigation: Gradual migration, test each use case

3. **Circular Dependencies** (Medium)
   - Potential hidden circular deps in current code
   - Risk: Awilix strict mode failures
   - Mitigation: Use `allowCircular: true` where needed

### Low Risk Areas

1. **Domain Layer** - No dependencies, unaffected
2. **DTOs** - Pure types, no changes needed
3. **Mappers** - Already framework-agnostic

---

## 12. Key Integration Points Summary

| Point                 | Location                  | Pattern                      | Complexity |
| --------------------- | ------------------------- | ---------------------------- | ---------- |
| Root Container        | `server.ts`               | `DIContext.create()`         | Medium     |
| Request Container     | `server.ts` createContext | Scoped container per request | High       |
| Controller Resolution | `controllers/index.ts`    | `ctx.container.resolve()`    | High       |
| Module Composition    | `AppModule.ts`            | Static modules with imports  | Medium     |
| PrismaClient Scope    | `RepositoryModule.ts`     | `Lifetime.SCOPED`            | High       |

---

## 13. Counts Summary

### Files Affected

- **Create**: 7 new module/infrastructure files
- **Modify**: 38 existing files (5 core + 1 wrapper + 17 controllers + 16 repositories - overlap)
- **Delete**: 3 old DI infrastructure files
- **Total**: ~55 files including test updates

### Components Affected

- **16 repositories**: Add to `createStaticModule()` registration
- **17 controllers**: Add to module registration
- **73 use cases**: Add to module registration
- **19 routers**: No changes (thin wrappers)
- **1 tRPC wrapper**: Major refactoring (~1700 lines)

---

## 14. Recommended Migration Strategy

### Phase 1: Infrastructure (Low Risk)

1. Create new module files alongside existing DI
2. Add `container` to TRPCContext without breaking changes
3. Create compatibility layer for gradual migration

### Phase 2: Repository Migration (Medium Risk)

1. Convert repositories 4 at a time using parallel subagents
2. Keep the legacy DI container running during transition
3. Verify each batch with tests

### Phase 3: Controller Migration (High Risk)

1. Refactor tRPC wrapper to support both patterns
2. Migrate controllers one at a time
3. Extensive integration testing

### Phase 4: Cleanup (Low Risk)

1. Verify no runtime DI residue
2. Update documentation
3. Standardize on awilix-modular patterns

---

## Analysis Complete

**Next Step**: Proceed to Phase 3 (Design) to create detailed module definitions and integration specifications.
