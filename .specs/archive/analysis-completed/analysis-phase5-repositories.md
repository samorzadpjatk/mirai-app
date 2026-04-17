# Codebase Analysis: Phase 5 - Drizzle Repository Types

## Affected Files Summary

### Primary Files to Modify (18 repository files)

| File | Path | Error Count | Priority |
|------|------|-------------|----------|
| activity-feed.ts | `packages/adapters/src/gateways/drizzle/` | 3 | Medium |
| challenge-submission.ts | `packages/adapters/src/gateways/drizzle/` | 8 | High |
| challenge-vote.ts | `packages/adapters/src/gateways/drizzle/` | 6 | Medium |
| challenge.ts | `packages/adapters/src/gateways/drizzle/` | 1 | Low |
| coin-transaction.ts | `packages/adapters/src/gateways/drizzle/` | 6 | Medium |
| event.ts | `packages/adapters/src/gateways/drizzle/` | 3 | Medium |
| group.ts | `packages/adapters/src/gateways/drizzle/` | 3 | Medium |
| location.ts | `packages/adapters/src/gateways/drizzle/` | 1 | Low |
| notification-delivery.ts | `packages/adapters/src/gateways/drizzle/` | 6 | Medium |
| notification-schedule.ts | `packages/adapters/src/gateways/drizzle/` | 6 | Medium |
| notification.ts | `packages/adapters/src/gateways/drizzle/` | 1 | Low |
| reward.ts | `packages/adapters/src/gateways/drizzle/` | 4 | Medium |
| sponsor.ts | `packages/adapters/src/gateways/drizzle/` | 2 | Low |
| submission-report.ts | `packages/adapters/src/gateways/drizzle/` | 7 | High |
| telemetry.ts | `packages/adapters/src/gateways/drizzle/` | 0 | Low |
| trip.ts | `packages/adapters/src/gateways/drizzle/` | 1 | Low |
| user.ts | `packages/adapters/src/gateways/drizzle/` | 0 | Low |

### Supporting Files

| File | Path | Purpose |
|------|------|---------|
| repository.ts | `packages/adapters/src/gateways/base/` | BaseDrizzleRepository class |
| index.ts | `packages/adapters/src/gateways/drizzle/` | Barrel exports |

## Integration Points

### Upstream Dependencies (Use Case Ports)

All repositories implement interfaces from `@mirai-app/use-cases`:
- UserRepository
- ChallengeRepository
- ChallengeSubmissionRepository
- ChallengeVoteRepository
- RewardRepository
- RewardPurchaseRepository
- ActivityFeedRepository
- etc.

### Downstream Dependencies (Mappers)

Each repository depends on mappers from Phase 4:
- UserDrizzleMapper
- ChallengeDrizzleMapper
- ChallengeSubmissionDrizzleMapper
- etc.

### Schema Dependencies

All repositories depend on:
- `@mirai-app/frameworks/drizzle/schema` - Table definitions and types
- `@mirai-app/frameworks/drizzle/client` - DrizzleDb type

## Error Categories by File

### Heavy Files (>5 errors)

#### challenge-submission.ts (8 errors)
- TS2305: Missing exports (ChallengeSubmission, SubmissionStatus)
- TS2344: Type constraint issues with Partial<Shape>
- TS2554: Expected 2 arguments but got 3 (BaseDrizzleRepository constructor)
- TS2740: Query builder missing properties (config, joinsNotNullableMap, tableName)

#### submission-report.ts (7 errors)
- TS2344: Type constraint issues
- TS2554: Constructor argument count
- TS4114: Missing override modifier
- TS2741: Missing limit/offset in query types

#### challenge-vote.ts (6 errors)
- TS2344: Type constraint issues
- TS2554: Constructor argument count
- TS2352: VotePosition conversion error
- TS2769: No overload matches

#### coin-transaction.ts (6 errors)
- TS2344: Type constraint issues
- TS2554: Constructor argument count
- TS2345: Argument type mismatches (number | undefined)
- TS2416: Method signature mismatch
- TS4114: Missing override

#### notification-delivery.ts (6 errors)
- TS2344: Type constraint issues
- TS2554: Constructor argument count
- TS2345: Argument type mismatches

#### notification-schedule.ts (6 errors)
- TS2724: Missing export (NotificationScheduleRepository)
- TS2344: Type constraint issues
- TS2554: Constructor argument count
- TS2416: Method signature mismatch
- TS4114: Missing override
- TS2769: No overload matches

## Key Interfaces

### BaseDrizzleRepository

```typescript
abstract class BaseDrizzleRepository<
  TDomain,
  TDrizzle,
  TInsert,
  TTable extends PgTable<TableConfig>,
>
```

Provides CRUD methods:
- create(entity): Promise<TDomain>
- findById(id): Promise<TDomain | null>
- findAll(options?): Promise<TDomain[]>
- update(entity): Promise<TDomain>
- delete(id): Promise<void>
- exists(id): Promise<boolean>

### DrizzleEntityMapper

```typescript
interface DrizzleEntityMapper<TDomain, TDrizzle, TInsert> {
  toDomain(record: TDrizzle): TDomain;
  toDrizzleInsert(entity: TDomain): TInsert;
  toDrizzleUpdate(entity: TDomain): Partial<TInsert>;
}
```

## Risk Assessment

### High Risk
1. **Missing type exports** - May require changes to domain/use-cases packages
2. **BaseDrizzleRepository changes** - Could affect all repositories
3. **Method signature changes** - May break use case implementations

### Medium Risk
1. **Query builder patterns** - Complex chaining changes needed
2. **Generic type fixes** - Requires understanding of Drizzle's type system

### Low Risk
1. **Override modifiers** - Mechanical changes, safe to apply
2. **Argument count fixes** - Simple constructor call updates

## Estimated Effort

| Category | Files | Estimated Lines Changed |
|----------|-------|------------------------|
| Simple (1-3 errors) | 7 files | ~20 lines |
| Medium (4-6 errors) | 6 files | ~50 lines |
| Heavy (7+ errors) | 2 files | ~100 lines |
| **Total** | **15 files** | **~300 lines** |

## Testing Strategy

1. After each file fix, run `bun tsc --noEmit`
2. Verify no regressions in existing tests
3. Run `bun test` for packages/adapters

## Rollback Plan

All changes are type-only fixes. No runtime behavior changes expected.
Rollback: Revert to previous git commit if issues arise.
