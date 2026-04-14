# Awilix to Effect DI Migration Analysis

**Analysis Date:** 2026-04-15  
**Scope:** Complete migration from awilix/awilix-modular to Effect-based Dependency Injection  
**Status:** Draft - Ready for Planning

---

## Executive Summary

This document provides a comprehensive analysis of all awilix and awilix-modular usage patterns in the codebase, including affected files, integration points, risk assessments, and migration complexity estimates.

---

## 1. Affected Files Overview

### 1.1 Core Module Definition Files (4 files)

| File Path                                           | Lines | Purpose                                                 | Risk Level |
| --------------------------------------------------- | ----- | ------------------------------------------------------- | ---------- |
| `packages/adapters/src/modules/RepositoryModule.ts` | 580   | 17 repository registrations                             | HIGH       |
| `packages/adapters/src/modules/ControllerModule.ts` | 570   | 18 controller registrations                             | HIGH       |
| `packages/adapters/src/modules/UseCaseModule.ts`    | 709   | Port registrations (auth, realtime, storage, telemetry) | HIGH       |
| `packages/adapters/src/modules/AnalyticsModule.ts`  | 351   | Analytics storage registration                          | MEDIUM     |

**Total Module Lines:** 2,210

### 1.2 DI Infrastructure Files (2 files)

| File Path                                  | Lines | Purpose                                          | Risk Level |
| ------------------------------------------ | ----- | ------------------------------------------------ | ---------- |
| `packages/frameworks/src/di/index.ts`      | 49    | DI exports and backward compatibility stubs      | MEDIUM     |
| `packages/frameworks/src/di/test-layer.ts` | 445   | Test utilities, createTestContainer (deprecated) | HIGH       |

**Total Infrastructure Lines:** 494

### 1.3 Use Cases Module (1 file)

| File Path                                         | Lines | Purpose                                            | Risk Level |
| ------------------------------------------------- | ----- | -------------------------------------------------- | ---------- |
| `packages/use-cases/src/modules/UseCaseModule.ts` | 114   | Use case registrations (mostly migrated to Effect) | LOW        |

### 1.4 GraphQL Resolvers (20 files, ~173 resolve calls)

| Resolver File             | Lines | Resolve Count | Risk Level |
| ------------------------- | ----- | ------------- | ---------- |
| `activityFeed.ts`         | 751   | ~26           | HIGH       |
| `challengeVote.ts`        | 440   | ~9            | HIGH       |
| `challengeSubmission.ts`  | 348   | ~7            | HIGH       |
| `challenge.ts`            | 413   | ~7            | HIGH       |
| `coinTransaction.ts`      | 421   | ~8            | MEDIUM     |
| `group.ts`                | 513   | ~12           | HIGH       |
| `location.ts`             | 357   | ~6            | MEDIUM     |
| `notificationDelivery.ts` | 227   | ~5            | MEDIUM     |
| `notificationSchedule.ts` | 704   | ~10           | MEDIUM     |
| `notificationSender.ts`   | 252   | ~4            | MEDIUM     |
| `notifications.ts`        | 394   | ~9            | MEDIUM     |
| `reward.ts`               | 606   | ~6            | MEDIUM     |
| `sponsor.ts`              | 383   | ~5            | MEDIUM     |
| `storage.ts`              | 181   | ~2            | LOW        |
| `submissionReport.ts`     | 123   | ~3            | LOW        |
| `trip.ts`                 | 342   | ~8            | HIGH       |
| `User.ts`                 | 328   | ~5            | HIGH       |
| `coin.ts`                 | 144   | ~2            | LOW        |
| (Other resolvers)         | ~500  | ~15           | MEDIUM     |

**Total Resolver Lines:** ~6,927  
**Total Resolve Calls:** ~173

### 1.5 GraphQL Framework Resolvers (7 files in packages/frameworks)

| Resolver File                                                       | Lines | Resolve Count | Risk Level |
| ------------------------------------------------------------------- | ----- | ------------- | ---------- |
| `packages/frameworks/src/graphql/resolvers/User.ts`                 | ~200  | 6             | MEDIUM     |
| `packages/frameworks/src/graphql/resolvers/Challenge.ts`            | ~100  | 2             | MEDIUM     |
| `packages/frameworks/src/graphql/resolvers/Location.ts`             | ~250  | 5             | MEDIUM     |
| `packages/frameworks/src/graphql/resolvers/Group.ts`                | ~230  | 3             | MEDIUM     |
| `packages/frameworks/src/graphql/resolvers/Trip.ts`                 | ~150  | 5             | MEDIUM     |
| `packages/frameworks/src/graphql/resolvers/ActivityFeed.ts`         | ~170  | 7             | MEDIUM     |
| `packages/frameworks/src/graphql/resolvers/Event.ts`                | ~170  | 7             | MEDIUM     |
| `packages/frameworks/src/graphql/resolvers/ChallengeVote.ts`        | ~200  | 7             | MEDIUM     |
| `packages/frameworks/src/graphql/resolvers/NotificationDelivery.ts` | ~200  | 6             | MEDIUM     |
| `packages/frameworks/src/graphql/resolvers/Notification.ts`         | ~200  | 8             | MEDIUM     |
| `packages/frameworks/src/graphql/resolvers/ChallengeSubmission.ts`  | ~200  | 6             | MEDIUM     |
| `packages/frameworks/src/graphql/resolvers/SubmissionReport.ts`     | ~180  | 7             | MEDIUM     |

**Total Framework Resolver Lines:** ~2,250  
**Total Framework Resolve Calls:** ~70

### 1.6 Test Files Using createTestContainer

| Test File                                                          | Lines | Purpose                  | Risk Level |
| ------------------------------------------------------------------ | ----- | ------------------------ | ---------- |
| `apps/backend-server/src/__tests__/migration.e2e.test.ts`          | 1,171 | E2E tests with container | HIGH       |
| `apps/backend-server/src/__tests__/performance.bench.ts`           | 801   | Performance benchmarks   | MEDIUM     |
| `apps/backend-server/src/graphql/__tests__/User.resolver.test.ts`  | 565   | GraphQL resolver tests   | HIGH       |
| `apps/backend-server/src/websocket/__tests__/auth-handler.test.ts` | ~150  | WebSocket auth tests     | MEDIUM     |

**Total Test Lines:** ~2,687

### 1.7 Infrastructure Files

| File Path                                           | Lines | Purpose                                  | Risk Level |
| --------------------------------------------------- | ----- | ---------------------------------------- | ---------- |
| `apps/backend-server/src/websocket/auth-handler.ts` | 342   | WebSocket auth with container            | MEDIUM     |
| `packages/frameworks/src/graphql/server.ts`         | ~100  | GraphQL server with AwilixContainer type | MEDIUM     |
| `packages/frameworks/src/graphql/builder.ts`        | ~150  | Schema builder with AwilixContainer type | LOW        |

**Total Infrastructure Lines:** ~592

---

## 2. Integration Points and Connections

### 2.1 Module Dependency Graph

```
AppModule (entry point)
├── RepositoryModule (17 repositories)
│   └── Depends on: drizzle (DrizzleDb)
├── UseCaseModule (adapters layer - ports)
│   ├── authPort → SupabaseAuthAdapter | InMemoryAuthAdapter
│   ├── realtimePort → SupabaseRealtimeAdapter | InMemoryRealtimeAdapter
│   ├── storagePort → SupabaseStorageAdapter | InMemoryStorageAdapter
│   ├── telemetryPort → DrizzleTelemetryAdapter
│   ├── pubSubService → EventEmitterPubSub
│   └── authenticateUserUseCase, authorizeAdminUseCase, etc.
├── ControllerModule (18 controllers)
│   └── Depends on: All repositories + use cases + services
└── AnalyticsModule (analytics storage)
    └── analyticsStoragePort → S3StorageAdapter
```

### 2.2 Container Resolution Chain

**Request Flow:**

1. HTTP/WebSocket request → tRPC/GraphQL context
2. Context contains `container` (AwilixContainer)
3. Resolvers/Router handlers call `context.container.resolve("token")`
4. awilix-modular resolves through module hierarchy
5. Factory functions create instances with dependencies

**Critical Resolution Points:**

- GraphQL resolvers: ~173 resolve calls across 20 resolvers
- Framework resolvers: ~70 resolve calls
- tRPC routers: Unknown (need investigation)
- WebSocket handlers: 2 resolve calls in auth-handler.ts

### 2.3 Cross-Module Dependencies

| Module           | Depends On                      | Exported To                     |
| ---------------- | ------------------------------- | ------------------------------- |
| RepositoryModule | drizzle                         | ControllerModule, UseCaseModule |
| UseCaseModule    | supabase, db                    | ControllerModule                |
| ControllerModule | RepositoryModule, UseCaseModule | GraphQL resolvers, tRPC routers |
| AnalyticsModule  | AWS credentials                 | Analytics controllers           |

### 2.4 Type Dependencies

```typescript
// Critical types from awilix
import type { AwilixContainer } from "awilix";

// Used in:
- apps/backend-server/src/websocket/auth-handler.ts
- apps/backend-server/src/__tests__/*.ts
- packages/frameworks/src/graphql/server.ts
- packages/frameworks/src/graphql/builder.ts
```

---

## 3. Risk Level Assessment

### 3.1 HIGH Risk (Breaking Changes)

| Component           | Risk                                        | Mitigation                                      |
| ------------------- | ------------------------------------------- | ----------------------------------------------- |
| RepositoryModule    | Changing 17 repository registrations        | Create RepositoryTag per entity, Layer.succeed  |
| ControllerModule    | 18 controllers with complex Layer injection | Gradual migration, maintain compatibility layer |
| UseCaseModule       | Port environment-based selection            | Convert to Effect Layer with Config layer       |
| GraphQL resolvers   | 173 resolve calls need rewriting            | Create resolver wrapper, migrate incrementally  |
| Test infrastructure | createTestContainer is widely used          | Maintain shim, encourage createTestLayer        |

### 3.2 MEDIUM Risk (Refactoring Required)

| Component              | Risk                           | Mitigation                         |
| ---------------------- | ------------------------------ | ---------------------------------- |
| AnalyticsModule        | Single S3 adapter registration | Simple Layer conversion            |
| WebSocket auth         | 2 resolve calls                | Inject services at connection time |
| Framework resolvers    | 70 resolve calls               | Same strategy as GraphQL resolvers |
| Performance benchmarks | Container-based setup          | Use createTestLayer                |

### 3.3 LOW Risk (Simple Conversions)

| Component                 | Risk                          | Mitigation                        |
| ------------------------- | ----------------------------- | --------------------------------- |
| UseCaseModule (use-cases) | Already Effect-based          | Remove module, use direct imports |
| GraphQL builder types     | Type-only references          | Replace with Context type         |
| Documentation comments    | JSDoc with container examples | Update docs                       |

---

## 4. Migration Complexity Estimate

### 4.1 Complexity by Component

| Component                      | Files  | Lines      | Complexity | Effort (days) |
| ------------------------------ | ------ | ---------- | ---------- | ------------- |
| Module definitions             | 4      | 2,210      | HIGH       | 8-10          |
| DI infrastructure              | 2      | 494        | MEDIUM     | 3-4           |
| GraphQL resolvers (backend)    | 20     | 6,927      | HIGH       | 12-15         |
| GraphQL resolvers (frameworks) | 12     | 2,250      | MEDIUM     | 6-8           |
| Test files                     | 4      | 2,687      | MEDIUM     | 5-7           |
| Infrastructure                 | 3      | 592        | MEDIUM     | 3-4           |
| **TOTAL**                      | **45** | **15,160** | **HIGH**   | **37-48**     |

### 4.2 Migration Phases

**Phase 1: Foundation (5-7 days)**

- Create Effect-based RepositoryTags (17 tags)
- Build Layer composition utilities
- Migrate RepositoryModule to Layer pattern
- Create backward compatibility shim

**Phase 2: Use Cases & Ports (3-4 days)**

- Convert UseCaseModule to Effect Config layers
- Migrate port adapters to Layer.succeed pattern
- Update environment-based provider selection

**Phase 3: Controllers (5-7 days)**

- Migrate ControllerModule to Effect-based injection
- Create controller factory with Layer
- Update controller tests

**Phase 4: GraphQL Resolvers (10-12 days)**

- Create resolver Effect wrapper
- Migrate resolvers in batches (5 per batch)
- Update resolver tests
- Remove context.container usage

**Phase 5: Test Infrastructure (3-4 days)**

- Remove createTestContainer
- Migrate all tests to createTestLayer
- Update test documentation

**Phase 6: Cleanup (2-3 days)**

- Remove awilix dependencies from package.json
- Clean up backward compatibility stubs
- Final verification and testing

---

## 5. Dependencies Between Modules

### 5.1 Dependency Matrix

| From \ To      | Repository | UseCase | Controller | Analytics |
| -------------- | ---------- | ------- | ---------- | --------- |
| **Repository** | -          | CRADLE  | CRADLE     | -         |
| **UseCase**    | -          | -       | CRADLE     | -         |
| **Controller** | DEPENDS    | DEPENDS | -          | -         |
| **Analytics**  | -          | -       | -          | -         |

_CRADLE = Provided via cradle pattern in awilix_
_DEPENDS = Has dependency_

### 5.2 Registration Tokens by Module

**RepositoryModule (17 tokens):**

```typescript
(userRepository,
  tripRepository,
  challengeRepository,
  groupRepository,
  locationRepository,
  notificationRepository,
  challengeSubmissionRepository,
  challengeVoteRepository,
  activityFeedRepository,
  sponsorRepository,
  submissionReportRepository,
  rewardRepository,
  rewardPurchaseRepository,
  coinTransactionRepository,
  notificationDeliveryRepository,
  notificationScheduleRepository,
  eventRepository);
```

**ControllerModule (18 tokens):**

```typescript
(userController,
  tripController,
  challengeController,
  groupController,
  locationController,
  notificationController,
  notificationScheduleController,
  notificationDeliveryController,
  challengeSubmissionController,
  challengeVoteController,
  activityFeedController,
  rewardController,
  coinController,
  coinTransactionController,
  sponsorController,
  submissionReportController,
  storageController,
  notificationService);
```

**UseCaseModule (9 tokens):**

```typescript
(authPort,
  realtimePort,
  storagePort,
  telemetryPort,
  pubSubService,
  tokenExtractor,
  authenticateUserUseCase,
  authorizeAdminUseCase,
  authorizeModeratorUseCase,
  logTelemetryUseCase);
```

**AnalyticsModule (1 token):**

```typescript
analyticsStoragePort;
```

### 5.3 Effect Tag Equivalents Needed

| Awilix Token        | Effect Tag             | Layer          |
| ------------------- | ---------------------- | -------------- |
| userRepository      | UserRepositoryTag      | RepositoryLive |
| tripRepository      | TripRepositoryTag      | RepositoryLive |
| challengeRepository | ChallengeRepositoryTag | RepositoryLive |
| ...                 | ...                    | ...            |
| authPort            | AuthPortTag            | PortsLive      |
| realtimePort        | RealtimePortTag        | PortsLive      |
| storagePort         | StoragePortTag         | PortsLive      |

---

## 6. Key Migration Patterns

### 6.1 Module to Layer Conversion

```typescript
// BEFORE: awilix-modular
export const RepositoryModule = createStaticModule({
  name: "RepositoryModule",
  providers: {
    userRepository: {
      factory: (cradle) => new DrizzleUserRepository(cradle.drizzle),
      lifetime: Lifetime.SINGLETON,
    },
  },
});

// AFTER: Effect Layer
export const RepositoryLive = Layer.effect(
  UserRepositoryTag,
  Effect.gen(function* () {
    const db = yield* DrizzleTag;
    return new DrizzleUserRepository(db);
  }),
);
```

### 6.2 Container Resolution to Effect

```typescript
// BEFORE: container.resolve
const controller = context.container.resolve<UserController>("userController");
const result = await controller.getById({ id });

// AFTER: Effect.gen with yield*
const program = Effect.gen(function* () {
  const controller = yield* UserControllerTag;
  return yield* controller.getById({ id });
});
const result = await Effect.runPromise(program);
```

### 6.3 Test Container to Test Layer

```typescript
// BEFORE: createTestContainer
const container = createTestContainer();
container.register({
  userRepository: asClass(InMemoryUserRepository).singleton(),
});

// AFTER: createTestLayer
const testLayer = Layer.succeed(
  UserRepositoryTag,
  new InMemoryUserRepository(),
);
```

---

## 7. Recommendations

### 7.1 Migration Strategy

1. **Incremental Migration**: Migrate one module at a time, maintaining backward compatibility
2. **Dual Mode**: Support both awilix and Effect DI during transition period
3. **Test-First**: Migrate tests first using createTestLayer, then migrate implementation
4. **Batch Processing**: Group related resolvers for migration (e.g., all challenge-related resolvers)

### 7.2 Risk Mitigation

1. **Compatibility Layer**: Keep shim functions (createTestContainer) with deprecation warnings
2. **Feature Flags**: Allow runtime switching between DI systems for gradual rollout
3. **Rollback Plan**: Maintain git tags at each phase for quick rollback
4. **Comprehensive Testing**: Full integration test suite must pass after each phase

### 7.3 Success Criteria

- [ ] All 17 repositories available via Effect Tags
- [ ] All 18 controllers migrated to Effect-based injection
- [ ] All 173 GraphQL resolver calls converted to Effect.gen
- [ ] All tests using createTestLayer (no createTestContainer usage)
- [ ] Zero awilix imports in production code
- [ ] All tests passing with >95% coverage maintained
- [ ] Performance benchmarks show no regression

---

## 8. Appendix: File Checksums for Verification

Use these checksums to verify file states during migration:

```bash
# Generate checksums for affected files
find packages/adapters/src/modules apps/backend-server/src/graphql/resolvers \
  packages/frameworks/src/di packages/frameworks/src/graphql/resolvers \
  -type f -name "*.ts" | sort | xargs sha256sum > .specs/analysis/awilix-files.sha256
```

---

**Document Version:** 1.0  
**Last Updated:** 2026-04-15  
**Migration Priority:** HIGH  
**Estimated Completion:** 37-48 engineering days
