# Scratchpad: Effect Framework Migration Analysis

**Analysis Date:** 2026-04-14  
**Task File:** `/Users/rafalopilowski/Projekty/migration/pjapp/.specs/tasks/draft/effect-migration.refactor.md`  
**Analysis Output:** `/Users/rafalopilowski/Projekty/migration/pjapp/.specs/analysis/analysis-effect-migration.md`

---

## Quick Summary

### Migration Status: 75% Complete

| Layer       | Status                   | Files Affected    |
| ----------- | ------------------------ | ----------------- |
| Domain      | ✅ Complete              | 0                 |
| Ports       | ✅ 95% Complete          | 1 (TelemetryPort) |
| Use Cases   | ⚠️ Transitional Pattern  | 107               |
| Controllers | ✅ Complete              | 0                 |
| Gateways    | ⚠️ Needs Fix             | 17                |
| Services    | ⚠️ Mixed                 | ~10               |
| Frameworks  | ✅ Complete              | 0                 |
| Tests       | ⚠️ Needs Standardization | 400+              |

### Key Findings

1. **Domain entities are 100% Effect-based** - All 27 entities use `Effect.Effect<T, E, never>`
2. **Ports are 95% migrated** - Only TelemetryPort uses legacy pattern
3. **Use cases use transitional pattern** - All 107 return `Effect<Result<T,E>>` instead of `Effect<T,E>`
4. **Controllers are fully migrated** - All 17 use Effect Layers with `runWithLayer`
5. **Gateways have error channel issue** - All 17 use `.pipe(Effect.orDie)` which removes errors
6. **awilix is fully removed** - All DI uses Effect Context.Tags and Layers
7. **715 test files exist** - ~400 need Effect pattern standardization

### Critical Issues (Priority 1)

1. **Gateway Error Channels (17 files)**
   - Location: `packages/adapters/src/gateways/drizzle/*.ts`
   - Issue: `.pipe(Effect.orDie)` removes error channel
   - Fix: Remove `.pipe(Effect.orDie)`

2. **TelemetryPort (1 file)**
   - Location: `packages/use-cases/src/ports/TelemetryPort.ts`
   - Issue: Uses `Promise<Result<void, TelemetryError>>`
   - Fix: Convert to `Effect.Effect<T, E, R>`

### High Priority (Priority 2)

3. **Use Case Error Channel Migration (107 files)**
   - Location: `packages/use-cases/src/interactors/*.ts`
   - Issue: Return `Effect<Result<T,E>>` instead of `Effect<T,E,R>`
   - Fix: Change return types, use Context.Tags for DI

4. **Result<T,E> Cleanup (11 files)**
   - Location: Various domain utility files
   - Issue: Still using custom Result type
   - Fix: Deprecate `packages/domain/src/utils/result.ts`

### Medium Priority (Priority 3)

5. **Service Layer Cleanup (~10 files)**
   - Location: `packages/adapters/src/services/*.ts`
   - Issue: Some still use async/await
   - Fix: Standardize on Effect

6. **Test Standardization (400+ files)**
   - Location: Throughout codebase
   - Issue: Mixed testing patterns
   - Fix: Create test helpers, update documentation

---

## File Counts by Category

| Category             | Count | Migration Status   |
| -------------------- | ----- | ------------------ |
| Domain Entities      | 27    | ✅ Migrated        |
| Domain Value Objects | 17    | ✅ Migrated        |
| Use Case Interactors | 107   | ⚠️ Transitional    |
| Port Interfaces      | 20    | ✅ Mostly Migrated |
| Controllers          | 17    | ✅ Migrated        |
| Drizzle Gateways     | 17    | ⚠️ Needs Fix       |
| Mappers              | 17    | ✅ Migrated        |
| Framework Layers     | 4     | ✅ Migrated        |
| GraphQL Resolvers    | 18    | ✅ Migrated        |
| Test Files           | 715   | ⚠️ Mixed           |

**Total Files Analyzed:** ~1,000+  
**Files Needing Updates:** ~550

---

## Current Patterns

### ✅ Working Pattern: Domain Entity

```typescript
static create(props: UserProps): Effect.Effect<User, ValidationError, never> {
  return Effect.gen(function* () {
    const validated = yield* validate.string(props.name, "name");
    return new User({ ...props, name: validated });
  });
}
```

### ✅ Working Pattern: Controller

```typescript
class UserController {
  constructor(private appLayer: Layer.Layer<unknown>) {}

  async getById(input: unknown) {
    const effect = Effect.gen(function* () {
      const repo = yield* UserRepositoryTag;
      return yield* getUserUseCase({ userId }, repo);
    });
    return await runWithLayer(effect, this.appLayer);
  }
}
```

### ⚠️ Transitional Pattern: Use Case

```typescript
// Current (transitional)
execute(input): Effect.Effect<Result<GetUserOutput, GetUserNotFoundError>, never, never>

// Target (final)
execute(input): Effect.Effect<GetUserOutput, GetUserNotFoundError, UserRepository>
```

### ❌ Problematic Pattern: Gateway

```typescript
// Current (problematic - removes error channel)
findById(id: string): Effect.Effect<User | null, never, never> {
  return Effect.tryPromise({...}).pipe(Effect.orDie);
}

// Target (preserves error channel)
findById(id: string): Effect.Effect<User | null, DatabaseError, never> {
  return Effect.tryPromise({...});  // No .pipe(Effect.orDie)
}
```

---

## Integration Points Status

| Integration Point       | Current State                                      | Issues                     |
| ----------------------- | -------------------------------------------------- | -------------------------- |
| Domain → Use Cases      | Domain uses Effect, Use Cases consume with yield\* | Use Cases wrap in Result   |
| Use Cases → Controllers | Effect passed to runWithLayer                      | Suboptimal Result wrapping |
| Controllers → Routers   | { success, data, error } format                    | Working well               |
| Ports → Gateways        | Port expects errors, gateway removes with orDie    | **MISMATCH**               |

---

## Risk Assessment

| Package              | Risk      | Reason                           |
| -------------------- | --------- | -------------------------------- |
| domain               | 🟢 Low    | Complete                         |
| use-cases            | 🟡 Medium | 107 files need structural change |
| adapters/controllers | 🟢 Low    | Complete                         |
| adapters/gateways    | 🟡 Medium | Error channel mismatch           |
| adapters/services    | 🟡 Medium | Some async patterns              |
| frameworks           | 🟢 Low    | Complete                         |
| backend-server       | 🟢 Low    | Complete                         |
| tests                | 🔴 High   | 400+ files need updates          |

---

## Next Steps

1. **Week 1:** Fix gateway error channels (17 files)
2. **Week 1:** Migrate TelemetryPort (1 file)
3. **Weeks 2-4:** Migrate use case error channels (107 files)
4. **Weeks 2-4:** Deprecate Result<T,E> utilities (11 files)
5. **Months 2-3:** Standardize test patterns (400+ files)

---

## Verification Commands

```bash
# Check for remaining Result usage in domain
grep -r "Result<" packages/domain/src --include="*.ts" | grep -v test | wc -l

# Check for orDie in gateways
grep -r "Effect.orDie" packages/adapters/src/gateways --include="*.ts" | wc -l

# Check for awilix (should be 0)
grep -r "from ['"]awilix['"]' packages/ apps/ --include="*.ts" | wc -l

# Count test files
find /Users/rafalopilowski/Projekty/migration/pjapp -name "*.test.ts" -type f | wc -l
```

---

## Notes

- Previous Phase 2b analysis is outdated - codebase has advanced significantly
- All use cases now use Effect (not async/await)
- All ports now use Effect.Effect (except TelemetryPort)
- Controllers fully migrated to Effect Layers
- awilix completely removed from production code
- Main remaining work: remove Result wrapping, fix error channels, standardize tests
