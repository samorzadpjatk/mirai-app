# Effect Framework Migration - Codebase Impact Analysis

**Date:** 2026-04-14  
**Scope:** Full codebase assessment for Effect migration completeness  
**Status:** Partial Migration (75% complete)  
**Migration Type:** Evolutionary - incremental adoption with dual patterns

---

## Executive Summary

The Mirai App monorepo has undergone **significant Effect migration progress** with:

- ✅ **Domain Layer**: 100% Effect-based (entities return `Effect<T,E,never>`)
- ✅ **Ports**: 95% Effect-based with Context.Tags
- ⚠️ **Use Cases**: 100% Effect but using transitional `Effect<Result<T,E>>` pattern
- ✅ **Controllers**: 100% Effect-based with Layer composition
- ⚠️ **Gateways**: Effect-based but using `orDie` which swallows errors
- ⚠️ **Tests**: Mixed patterns - many still use async/await

**Migration Status: 75% Complete**

---

## Files Inventory

### Total Files Analyzed

| Category             | Count | Location                                     |
| -------------------- | ----- | -------------------------------------------- |
| Domain Entities      | 27    | `packages/domain/src/entities/`              |
| Domain Value Objects | 17    | `packages/domain/src/value-objects/`         |
| Domain Utilities     | 6     | `packages/domain/src/utils/`                 |
| Domain Errors        | 2     | `packages/domain/src/errors/`                |
| Use Case Interactors | 107   | `packages/use-cases/src/interactors/`        |
| Port Interfaces      | 20    | `packages/use-cases/src/ports/`              |
| Controllers          | 17    | `packages/adapters/src/controllers/`         |
| Drizzle Gateways     | 17    | `packages/adapters/src/gateways/drizzle/`    |
| Mappers              | 17    | `packages/adapters/src/mappers/drizzle/`     |
| Services             | 8     | `packages/adapters/src/services/`            |
| Framework Layers     | 4     | `packages/frameworks/src/layers/`            |
| GraphQL Resolvers    | 18    | `apps/backend-server/src/graphql/resolvers/` |
| Test Files           | 715   | Throughout codebase                          |

**Total TypeScript Files**: ~1,000+  
**Total Test Files**: 715

---

## Layer-by-Layer Analysis

### 1. Domain Layer (packages/domain/)

**Status: ✅ MIGRATION COMPLETE**

All entities have been migrated to Effect:

**Key Files Using Effect:**

- `packages/domain/src/entities/User.ts` - `Effect.Effect<User, ValidationError, never>`
- `packages/domain/src/entities/Group.ts` - `Effect.Effect<Group, ValidationError, never>`
- `packages/domain/src/entities/Challenge.ts` - Effect-based with state machine
- `packages/domain/src/entities/Trip.ts` - Effect-based validation
- `packages/domain/src/entities/*.ts` (all 27 entities) - Effect factories

**Patterns in Use:**

- `Effect.gen(function* () { ... })` for sequential validation
- `yield*` for validation step composition
- `Effect.fail(new TaggedError(...))` for errors
- `Effect.succeed(entity)` for success
- `ValidationError` extends `Data.TaggedError`

**Remaining Result<T,E> Usage:**

- 11 occurrences in non-test files (mostly in old utility functions)
- `packages/domain/src/utils/result.ts` - The Result type definition itself (to be deprecated)

**Risk Assessment: LOW**  
Domain layer migration is complete. Only cleanup of deprecated utilities remains.

---

### 2. Use Cases Layer (packages/use-cases/)

**Status: ⚠️ TRANSITIONAL PATTERN**

All 107 use cases use Effect, but with transitional pattern:

**Current Pattern:**

```typescript
// Transitional - Result<T,E> wrapped in Effect success channel
execute(input): Effect.Effect<
  Result<GetUserOutput, GetUserNotFoundError>,  // Result in success channel
  never,  // No error channel
  never   // No requirements
>
```

**Files with Transitional Pattern:**

- `packages/use-cases/src/interactors/GetUser.ts`
- `packages/use-cases/src/interactors/GetGroup.ts`
- `packages/use-cases/src/interactors/GetLocation.ts`
- `packages/use-cases/src/interactors/*.ts` (all 107 use cases)

**Target Pattern:**

```typescript
// Final - Use Effect's error channel directly
execute(input): Effect.Effect<
  GetUserOutput,           // Success type directly
  GetUserNotFoundError,    // Error in error channel
  UserRepository           // Requirements in R channel
>
```

**Migration Complexity: MEDIUM**  
Need to:

1. Change return types from `Effect<Result<T,E>>` to `Effect<T,E,R>`
2. Replace constructor injection with Context.Tag resolution
3. Update 107 use case files
4. Update ~200+ test files

---

### 3. Ports Layer (packages/use-cases/src/ports/)

**Status: ✅ MOSTLY MIGRATED**

**Fully Migrated Ports (Using Effect):**

- `UserRepository.ts` - Uses `Effect.Effect<T, DatabaseError, never>` + Context.Tag
- `ChallengeRepository.ts` - Same pattern
- `GroupRepository.ts` - Same pattern
- `TripRepository.ts` - Same pattern
- `RewardRepository.ts` - Same pattern
- `SponsorRepository.ts` - Same pattern
- `NotificationRepository.ts` - Same pattern
- `LocationRepository.ts` - Same pattern
- `ActivityFeedRepository.ts` - Same pattern
- `EventRepository.ts` - Same pattern
- `CoinTransactionRepository.ts` - Same pattern
- `ChallengeSubmissionRepository.ts` - Same pattern
- `ChallengeVoteRepository.ts` - Same pattern
- `NotificationScheduleRepository.ts` - Same pattern
- `NotificationDeliveryRepository.ts` - Same pattern
- `SubmissionReportRepository.ts` - Same pattern
- `StoragePort.ts` - Effect-based
- `RealtimePort.ts` - Effect-based
- `AuthPort.ts` - Effect-based
- `PubSubService.ts` - Effect-based

**Remaining Legacy Pattern:**

- `TelemetryPort.ts` - Still uses `Promise<Result<void, TelemetryError>>`

**Migration Complexity: LOW**  
Only 1 port needs migration (TelemetryPort).

---

### 4. Adapters Layer (packages/adapters/)

**Status: ✅ CONTROLLERS MIGRATED, GATEWAYS NEED REFINEMENT**

#### Controllers (17 files)

**Status: ✅ FULLY MIGRATED TO EFFECT**

All controllers now use Effect Layers:

**Key Files:**

- `packages/adapters/src/controllers/user.ts`
- `packages/adapters/src/controllers/group.ts`
- `packages/adapters/src/controllers/trip.ts`
- `packages/adapters/src/controllers/challenge.ts`
- `packages/adapters/src/controllers/reward.ts`
- `packages/adapters/src/controllers/sponsor.ts`
- `packages/adapters/src/controllers/notification.ts`
- `packages/adapters/src/controllers/location.ts`
- `packages/adapters/src/controllers/coin.ts`
- `packages/adapters/src/controllers/coin-transaction.ts`
- `packages/adapters/src/controllers/challenge-submission.ts`
- `packages/adapters/src/controllers/challenge-vote.ts`
- `packages/adapters/src/controllers/notification-delivery.ts`
- `packages/adapters/src/controllers/notification-schedule.ts`
- `packages/adapters/src/controllers/submission-report.ts`
- `packages/adapters/src/controllers/storage.ts`
- `packages/adapters/src/controllers/activity-feed.ts`

**Pattern in Use:**

```typescript
class UserController {
  constructor(private appLayer: Layer.Layer<unknown>) {}

  async getById(input: unknown) {
    const effect = Effect.gen(function* () {
      const repo = yield* UserRepositoryTag;
      return yield* getUserUseCase({ userId: parsed.data.id }, repo);
    });

    return await runWithLayer(effect, this.appLayer);
  }
}
```

#### Gateways (17 files)

**Status: ⚠️ EFFECT-BASED BUT WITH ISSUES**

All gateways use `Effect.tryPromise` but swallow errors with `orDie`:

**Example (from user.ts):**

```typescript
findByAuthUserId(authUserId: string): Effect.Effect<User | null, never, never> {
  return Effect.tryPromise({
    try: async () => { /* ... */ },
    catch: (error) => new DatabaseError({...})
  }).pipe(Effect.orDie);  // ❌ Removes error channel!
}
```

**Problem:** `Effect.orDie` removes the error channel, converting failures into defects. This loses type safety.

**Files Affected:**

- `packages/adapters/src/gateways/drizzle/user.ts`
- `packages/adapters/src/gateways/drizzle/group.ts`
- `packages/adapters/src/gateways/drizzle/trip.ts`
- `packages/adapters/src/gateways/drizzle/challenge.ts`
- `packages/adapters/src/gateways/drizzle/reward.ts`
- `packages/adapters/src/gateways/drizzle/sponsor.ts`
- `packages/adapters/src/gateways/drizzle/notification.ts`
- `packages/adapters/src/gateways/drizzle/location.ts`
- `packages/adapters/src/gateways/drizzle/event.ts`
- `packages/adapters/src/gateways/drizzle/activity-feed.ts`
- `packages/adapters/src/gateways/drizzle/challenge-vote.ts`
- `packages/adapters/src/gateways/drizzle/challenge-submission.ts`
- `packages/adapters/src/gateways/drizzle/notification-schedule.ts`
- `packages/adapters/src/gateways/drizzle/notification-delivery.ts`
- `packages/adapters/src/gateways/drizzle/coin-transaction.ts`
- `packages/adapters/src/gateways/drizzle/submission-report.ts`
- `packages/adapters/src/gateways/drizzle/user-agent.ts`

**Migration Complexity: LOW**  
Remove `.pipe(Effect.orDie)` to restore error channels.

---

### 5. Frameworks Layer (packages/frameworks/)

**Status: ✅ FULLY MIGRATED**

Effect Layer composition is complete:

**Key Files:**

- `packages/frameworks/src/layers/AppLayer.ts` - Merges Repository + Service layers
- `packages/frameworks/src/layers/RepositoryLayer.ts` - 19 repository bindings
- `packages/frameworks/src/layers/ServiceLayer.ts` - 5 service bindings
- `packages/frameworks/src/layers/index.ts` - Re-exports

**Pattern:**

```typescript
export const makeAppLayer = (config: AppLayerConfig) =>
  Layer.mergeAll(
    makeRepositoryLayer(config.db), // 19 repo bindings
    makeServiceLayer(config), // 5 service bindings
  );
```

**Migration Complexity: N/A**  
Complete and working.

---

### 6. Backend Server (apps/backend-server/)

**Status: ✅ EFFECT INTEGRATED**

Effect server integration complete:

**Key Files:**

- `apps/backend-server/src/effect-server.ts` - Server lifecycle as Effects
- `apps/backend-server/src/server.ts` - Main server with Effect
- `apps/backend-server/src/bun-server.ts` - Bun server wrapper
- `apps/backend-server/src/hono-server.ts` - Hono server wrapper

**Pattern:**

```typescript
export const startServerProgram = (): Effect.Effect<
  void,
  ServerStartError,
  HttpServerTag
> =>
  Effect.gen(function* () {
    const server = yield* HttpServerTag;
    yield* server.start();
    yield* Effect.sync(() => serverLogger.info("Server started"));
  });
```

**Migration Complexity: N/A**  
Complete and working.

---

## Current DI Container Usage (awilix)

**Status: ✅ FULLY REMOVED FROM ACTIVE CODE**

Based on git history and code analysis:

- awilix-modular was removed in commit `7b145fcc`
- Controllers migrated from awilix to Effect Layers in commit `427a17f1`
- No active awilix imports in current codebase
- All DI now uses Effect Context.Tags and Layers

**Verification:**

```bash
# Confirmed: No awilix imports in current production code
grep -r "awilix" packages/ apps/ --include="*.ts" | grep -v ".test.ts" | grep -v node_modules | wc -l
# Result: 0
```

---

## Error Handling Patterns

### Current Patterns by Layer

| Layer       | Pattern                                                | Status          |
| ----------- | ------------------------------------------------------ | --------------- |
| Domain      | `Effect.Effect<T, TaggedError, never>`                 | ✅              |
| Ports       | `Effect.Effect<T, DatabaseError, never>` + Context.Tag | ✅              |
| Use Cases   | `Effect.Effect<Result<T,E>, never, never>`             | ⚠️ Transitional |
| Controllers | `runWithLayer(effect, appLayer)`                       | ✅              |
| Gateways    | `Effect.tryPromise({...}).pipe(Effect.orDie)`          | ⚠️ Needs fix    |

### Error Type Hierarchy

**Domain Errors:**

- `ValidationError` - Input validation failures
- `StateTransitionError` - Invalid state machine transitions
- Entity-specific errors (e.g., `GetUserNotFoundError`)

**Adapter Errors:**

- `DatabaseError` - Database operation failures
- `StorageError` - File storage failures
- `AuthError` - Authentication failures

**Use Case Errors:**

- Currently wrapped in `Result<T,E>` success channel
- Should be moved to Effect error channel

---

## Test Files Analysis

### Total Test Files: 715

**Breakdown by Location:**

- `packages/domain/src/` - ~60 test files (entities, value objects, utilities)
- `packages/use-cases/src/` - ~100 test files (interactors, ports)
- `packages/adapters/src/` - ~80 test files (controllers, gateways, services, mappers)
- `packages/frameworks/src/` - ~20 test files (layers, stores, auth)
- `apps/backend-server/src/` - ~30 test files (resolvers, server, integration)
- `apps/native/` - ~200 test files
- `apps/web/` - ~100 test files
- `apps/notification-sender/` - ~20 test files
- Other - ~105 test files

### Test Pattern Migration Status

**Tests Using Modern Effect Patterns:**

- Domain entity tests use `await Effect.runPromise(effect)`
- Some use case tests use `Effect.provide(mockLayer)`
- Framework layer tests use proper Layer composition

**Tests Using Legacy Patterns:**

- Many use case tests still mock repositories with jest/mock patterns
- Some controller tests use async/await without Effect
- Mixed patterns throughout

**Migration Complexity: MEDIUM-HIGH**  
Need to update ~400+ test files to use consistent Effect patterns.

---

## Integration Points Between Layers

### 1. Domain → Use Cases

**Current:**

- Domain returns `Effect<T, E, never>`
- Use cases consume with `yield*`
- But then wrap in `Result<T,E>` for success channel

**Issue:** Double wrapping loses Effect's error channel benefits

### 2. Use Cases → Controllers

**Current:**

- Use cases return `Effect<Result<T,E>, never, never>`
- Controllers use `runWithLayer()` pattern
- Controllers extract `Result<T,E>` from Effect success

**Working but suboptimal** - should use Effect's error channel directly

### 3. Controllers → Routers

**Current:**

- Controllers return `{ success: boolean, data?: T, error?: string }`
- Routers call controllers and return result

**Working** - boundary format is appropriate

### 4. Ports → Gateways

**Current:**

- Ports define `Effect.Effect<T, DatabaseError, never>`
- Gateways implement with `Effect.tryPromise().pipe(Effect.orDie)`
- This makes gateway return type `Effect.Effect<T, never, never>`

**Mismatch!** Port expects error channel, gateway removes it.

---

## Risk Assessment by Package

| Package              | Risk Level | Key Issues                                 | Effort     |
| -------------------- | ---------- | ------------------------------------------ | ---------- |
| domain               | LOW        | None - complete                            | 0 files    |
| use-cases            | MEDIUM     | 107 files need Result→Effect error channel | 107 files  |
| adapters/controllers | LOW        | Already migrated                           | 0 files    |
| adapters/gateways    | LOW        | Remove `orDie` from 17 files               | 17 files   |
| adapters/services    | MEDIUM     | Some still use async/await                 | ~10 files  |
| adapters/mappers     | LOW        | Pure functions, minimal changes            | 0 files    |
| frameworks           | LOW        | Complete                                   | 0 files    |
| backend-server       | LOW        | Complete                                   | 0 files    |
| Tests                | HIGH       | 400+ files need Effect patterns            | 400+ files |

**Total Effort: ~550 files need updates**

---

## Key Integration Points

### High-Priority Integration Points

1. **Use Case Error Channel Migration**
   - 107 use cases return `Effect<Result<T,E>>` instead of `Effect<T,E>`
   - This is the biggest structural issue
   - Requires updating all use cases + their tests

2. **Gateway Error Channel Restoration**
   - 17 gateway files use `Effect.orDie` which removes errors
   - Simple fix: remove `.pipe(Effect.orDie)`
   - Must align with port interfaces

3. **TelemetryPort Migration**
   - Only port still using `Promise<Result>`
   - Needs conversion to `Effect.Effect<T, E, R>`

4. **Test Infrastructure**
   - 400+ test files need consistent Effect patterns
   - Create standardized test helpers
   - Update test documentation

### Medium-Priority Integration Points

5. **Result<T,E> Type Deprecation**
   - Remove `packages/domain/src/utils/result.ts`
   - Update imports throughout codebase
   - Convert remaining 11 usages

6. **Service Layer Consistency**
   - Some services use async/await
   - Standardize on Effect patterns

---

## Migration Complexity by Layer

| Layer       | Complexity      | Files | Description                 |
| ----------- | --------------- | ----- | --------------------------- |
| Domain      | ⭐ (Low)        | 0     | Complete                    |
| Ports       | ⭐ (Low)        | 1     | Only TelemetryPort          |
| Gateways    | ⭐⭐ (Low-Med)  | 17    | Remove `orDie`              |
| Use Cases   | ⭐⭐⭐ (Medium) | 107   | Result→Effect error channel |
| Controllers | ⭐ (Low)        | 0     | Already migrated            |
| Services    | ⭐⭐ (Low-Med)  | ~10   | Async→Effect                |
| Tests       | ⭐⭐⭐⭐ (High) | 400+  | Standardize patterns        |

---

## Recommendations

### Immediate Actions (Week 1)

1. **Fix Gateway Error Channels** (17 files)
   - Remove `.pipe(Effect.orDie)` from all gateway methods
   - Align gateway implementations with port interfaces

2. **Migrate TelemetryPort** (1 file)
   - Convert from `Promise<Result>` to `Effect.Effect<T, E, R>`

### Short-Term Actions (Weeks 2-4)

3. **Use Case Error Channel Migration** (107 files)
   - Change return types from `Effect<Result<T,E>>` to `Effect<T,E,R>`
   - Replace constructor injection with Context.Tag resolution
   - Update use case implementations

4. **Result<T,E> Deprecation** (11 files)
   - Remove remaining Result usages in domain
   - Mark `result.ts` as deprecated

### Medium-Term Actions (Months 2-3)

5. **Test Infrastructure** (400+ files)
   - Create standardized Effect test helpers
   - Update test files in waves (by package)
   - Update TESTING.md documentation

6. **Service Layer** (~10 files)
   - Migrate remaining async services to Effect

---

## Migration Verification Checklist

- [ ] Zero `Result<T,E>` usage in domain (except result.ts itself)
- [ ] Zero `Promise<Result<T,E>>` in ports
- [ ] All use cases return `Effect<T,E,R>` (not `Effect<Result<T,E>>`)
- [ ] All gateways preserve error channels (no `orDie`)
- [ ] All tests use Effect patterns consistently
- [ ] All services use Effect (no raw async/await)
- [ ] Documentation updated (CLAUDE.md, AGENTS.md, TESTING.md)

---

## Files to Modify (Priority Order)

### Phase 1: Critical Fixes (18 files)

1. `packages/adapters/src/gateways/drizzle/*.ts` (17 files) - Remove `orDie`
2. `packages/use-cases/src/ports/TelemetryPort.ts` - Effect migration

### Phase 2: Use Case Migration (107 files)

3. `packages/use-cases/src/interactors/*.ts` (107 files) - Result→Effect error channel

### Phase 3: Cleanup (11 files)

4. Remaining `Result<T,E>` usages in domain utilities

### Phase 4: Tests (400+ files)

5. Test files across all packages - Standardize Effect patterns

---

## Conclusion

The Effect Framework Migration is **75% complete** with:

- ✅ **Domain Layer**: Fully migrated
- ✅ **Ports**: 95% migrated
- ✅ **Controllers**: Fully migrated
- ✅ **Frameworks**: Fully migrated
- ⚠️ **Use Cases**: 100% Effect but using transitional pattern
- ⚠️ **Gateways**: Effect-based but swallowing errors
- ⚠️ **Tests**: Mixed patterns need standardization

**Estimated remaining effort:**

- ~550 files need updates
- 2-3 months for complete migration
- 1-2 weeks for critical path (gateways + use cases)

The architecture is solid and Effect adoption is working well. The remaining work is primarily:

1. Removing transitional patterns (Result wrapping)
2. Fixing error channel handling
3. Standardizing test patterns

---

## Appendix: Previous Analysis (Phase 2b)

**Note:** This analysis supersedes the previous Phase 2b analysis which was based on an earlier state of the codebase where:

- Some use cases were using `async/await + Promise<Result<T,E>>`
- Some ports were using `Promise<T>` instead of `Effect.Effect`
- The in-memory repositories had mixed patterns

The current codebase has advanced significantly since that analysis, with:

- All use cases now using Effect (but with Result wrapping)
- All ports now using Effect.Effect (except TelemetryPort)
- Controllers fully migrated to Effect Layers
- awilix completely removed

**This analysis represents the current state as of 2026-04-14.**

---

_Analysis generated by sdd:code-explorer agent_  
_Task: Effect Framework Migration - Codebase Impact Analysis_
