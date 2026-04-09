# Repository Refactoring Checklist

Use this checklist when refactoring a repository to use `BasePrismaRepository`.

## Pre-Refactoring Check

- [ ] Repository has standard CRUD operations (create, findById, findAll, update, delete)
- [ ] Mapper has `toDomain`, `toPrismaCreate`, `toPrismaUpdate` methods
- [ ] No complex transaction logic in CRUD methods (custom queries OK)

## Refactoring Steps

### 1. Create Mapper Adapter

```typescript
// Add to the mapper file or repository file
const EntityMapperAdapter: EntityMapper<
  DomainEntity,
  PrismaEntity,
  CreateInput,
  UpdateInput
> = {
  toDomain: EntityMapper.toDomain,
  toPrismaCreate: EntityMapper.toPrismaCreate,
  toPrismaUpdate: EntityMapper.toPrismaUpdate,
};
```

### 2. Update Repository Class

```typescript
// Before
export class PrismaEntityRepository implements EntityRepository {
  constructor(private prisma: PrismaClient) {}
  // 80+ lines of CRUD boilerplate
}

// After
export class PrismaEntityRepository
  extends BasePrismaRepository<
    DomainEntity,
    PrismaEntity,
    CreateInput,
    UpdateInput
  >
  implements EntityRepository
{
  constructor(prisma: PrismaClient) {
    super(prisma.entity, EntityMapperAdapter);
  }

  // Only custom query methods remain (10-20 lines)
}
```

### 3. Verify Tests Pass

```bash
cd packages/adapters
bun test PrismaEntityRepository.test.ts
```

### 4. Check Dependency-Cruiser

```bash
bun run depcruise:check
# Should show 0 new errors
```

## When NOT to Use BasePrismaRepository

Don't use the base class if your repository has:

- ❌ Complex multi-table transactions in CRUD methods
- ❌ Custom caching logic in standard operations
- ❌ Event emission/side effects in CRUD
- ❌ Non-standard entity ID patterns
- ❌ **Polymorphic relations** (e.g., ActivityFeed with multiple activity types)
- ❌ **Complex nested includes** spanning multiple related entities
- ❌ **Multiple pagination strategies** (cursor-based AND offset-based)
- ❌ **Secondary entity management** (e.g., ActivityFeed also manages ActivityReactions)
- ❌ **> 8 custom query methods** (diminishing returns on code reduction)

In these cases, manual implementation is clearer.

### Exception Example: ActivityFeedRepository

The `PrismaActivityFeedRepository` was intentionally NOT refactored because:

1. **Polymorphic Relations:** ActivityFeed uses multiple activity types (submission, challenge, rank change, user post, admin)
2. **Deep Nested Includes:** Every query requires complex includes like `submissionActivity.submission.challenge.group`
3. **Dual Pagination:** Supports both cursor-based and offset-based pagination with custom logic
4. **Secondary Entity:** Manages ActivityReaction entities with groupBy queries
5. **Custom Where Logic:** Complex cursor-based pagination with conditional where clauses

See `PDCA-CYCLE-4-RESULTS.md` for full analysis.

## Rollback Plan

If issues arise:

1. Restore from git: `git checkout packages/adapters/src/gateways/PrismaEntityRepository.ts`
2. Remove adapter code from mapper
3. Verify tests pass
4. Document why base class didn't work (for future reference)

## Success Criteria

- [ ] Repository < 40 lines (was typically 100+)
- [ ] All existing tests pass
- [ ] No new dependency-cruiser errors
- [ ] Custom queries still work correctly

## Migration Priority

Refactor repositories in this order:

### Completed ✅ (7/16 - 43.75%)

1. **PrismaUserRepository** (Cycle 2) ✅
2. **PrismaChallengeRepository** (Cycle 3) ✅
3. **PrismaTripRepository** (Cycle 3) ✅
4. **PrismaGroupRepository** (Cycle 3) ✅
5. **PrismaNotificationRepository** (Cycle 4) ✅
6. **PrismaLocationRepository** (Cycle 4) ✅
7. **PrismaChallengeSubmissionRepository** (Cycle 4) ✅

### Retained as Custom ⚠️

- **PrismaActivityFeedRepository** - Complex polymorphic relations, see PDCA-CYCLE-4-RESULTS.md

### Remaining (9/16)

**High Priority** (likely good fit):

- PrismaAchievementRepository
- PrismaInviteRepository
- PrismaTripParticipantRepository (assess custom methods)

**Medium Priority** (assess complexity):

- PrismaMessageRepository
- PrismaFileRepository
- PrismaVoteRepository
- PrismaReactionRepository

**Low Priority** (evaluate case-by-case):

- PrismaRewardRepository (has purchase logic)
- PrismaCoinTransactionRepository (has transaction logic)

## Questions?

See `PrismaUserRepository.ts` for a working example.
