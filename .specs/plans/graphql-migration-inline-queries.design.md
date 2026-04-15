# Design: Migrate Inline GraphQL Queries to Pothos Schema

## Overview

This design addresses 30+ inline GraphQL queries scattered across `apps/web/`, `apps/native/`, and `apps/seed/` that bypass the proper Pothos → Codegen workflow. The migration moves these inline strings into formal `.graphql` operation files in `packages/graphql-client`, generates type-safe urql hooks via codegen, and updates all call sites.

## Goals

- Eliminate inline GraphQL strings in favor of generated, type-safe operations
- Enforce single source of truth: Pothos schema drives all client types
- Enable compile-time type safety for GraphQL operations (currently missing with inline strings)
- Support future schema evolution—changes propagate automatically through codegen
- Maintain zero-downtime migration with incremental domain-by-domain approach
- **Zero inline query or mutation strings in all apps** (web + native + seed)

## Architecture & Migration Workflow

The migration follows the GraphQL workflow defined in CLAUDE.md §6: **Pothos Schema → .graphql Operations → Codegen → Type-Safe Hooks**.

### Migration Workflow Per Domain

```
STEP 1: VERIFY SCHEMA (per domain)
• Check if all types/fields needed exist in Pothos
• Add any missing types to backend-server/src/graphql/types/
• Regenerate schema.graphql if needed

STEP 2: CREATE .graphql OPERATIONS
• Create/update files in:
  packages/graphql-client/src/generated/graphql/operations/
• Follow naming: <domain>.operations.graphql
• Include fragments from ../fragments/common.graphql

STEP 3: RUN CODEGEN
• bun run codegen in packages/graphql-client/
• Generates: src/generated/urql.ts with typed hooks

STEP 4: MIGRATE APP FILES
• Replace inline strings with imports from @mirai-app/graphql-client/urql
• Example:
  - Before: const query = `query GetGroup...`
  - After: import { useGetGroupQuery } from "@mirai-app/graphql-client/urql"

STEP 5: VERIFY & TEST
• Typecheck: bun run typecheck
• Tests: bun test
• Lint: bun run lint
• Delete inline query strings
```

### Key Architectural Decisions

- **Single location for operations:** All `.graphql` files live in `packages/graphql-client/src/generated/graphql/`
- **No app-specific operations:** Reuse existing pattern—common operations benefit all apps
- **Fragment-based:** Use shared fragments from `common.graphql` for consistency

## Domain Migration Details

### Domain 1: Storage Operations

**Files to update:** 7 files

- `apps/web/src/hooks/useWebFileUpload.ts`
- `apps/web/src/components/admin/challenges/SubmissionCard.tsx`
- `apps/web/src/components/admin/challenges/VotingCard.tsx`
- `apps/native/src/components/trips/groups/details/GroupMemberList.tsx`
- `apps/native/src/hooks/files/useFileDownload.ts`
- `apps/native/src/hooks/files/useFileUpload.ts`

**Operations:** `CreateUploadUrl` mutation, `CreateDownloadUrl` query

### Domain 2: Location & Sharing

**Files to update:** 3 files

- `apps/native/src/stores/location/LocationStoreProvider.tsx`
- `apps/native/src/hooks/map/useMapSharing.ts`
- `apps/native/src/hooks/location/useLocationPermissions.ts`

**Operations:** `GetMySharingSettings` query, `UpdateLocationSharing` mutation

### Domain 3: Notifications

**Files to update:** 5 files

- `apps/native/src/hooks/notifications/useNotifications.ts`
- `apps/native/src/hooks/notifications/useAutoPushSubscription.ts`

**Operations:** `GetNotificationSubscriptionStatus`, `SubscribeNotifications`, `UnsubscribeNotifications`, `GetMyNotifications`

### Domain 4: Challenges & Judgement

**Files to update:** 7 files

- `apps/native/src/stores/judgement/useJudgement.ts`
- `apps/web/src/hooks/admin/useChallengeSubmissions.ts`
- `apps/web/src/hooks/admin/useJudgement.ts`

**Operations:** `GetChallenge`, `ReviewSubmission`, `CreateSubmissionReport`, `UpdateChallenge`

### Domain 5: Community & Activity Feed

**Files to update:** 3 files

- `apps/native/src/hooks/community/useCommunityFeed.ts`
- `apps/native/src/hooks/community/useCommunityActivityData.ts`

**Operations:** `ToggleActivityReaction`, `BatchRankings`, `BatchAvatars`

### Domain 6: Seed Scripts

**Files to update:** 2 files

- `apps/seed/src/trips.ts`
- `apps/seed/src/graphql-executor.ts`

**Operations:** `UpsertTrip`, `UpsertUser`, `AddTripParticipant`, `FindUserByAuthId`, `CreateSponsor`, `FindSponsorByName`, `LinkSponsorToTrip`, `CreateReward`, `ClearTripResources`, `CreateTripResource`, `ClearTripInsurance`, `CreateTripInsurance`, `CreateInsuranceStep`

### Domain 7: Web-Admin Specific

**Files to update:** 3 files

- `apps/web/src/middleware.ts`
- `apps/web/src/lib/auth.ts`
- `apps/web/src/components/admin/notifications/CreateNotificationForm.tsx`

**Operations:** `GetMe`, `GetGroups`

## Implementation Timeline (10 Days)

### Phase 1: Foundation (Day 1-2)

1. Verify storage types exist in Pothos schema
2. Create `storage.operations.graphql`
3. Run codegen, migrate storage queries (7 files)
4. **Checkpoint:** Run full test suite

### Phase 2: Location & Notifications (Day 3-4)

5. Verify location types, create `location.operations.graphql`
6. Migrate location queries (3 files)
7. Verify notification types, extend `notification.operations.graphql`
8. Migrate notification queries (5 files)
9. **Checkpoint:** Run native app tests

### Phase 3: Challenges & Community (Day 5-6)

10. Verify challenge types, extend `challenge.operations.graphql`
11. Migrate challenge queries (7 files)
12. Verify activity types, extend `activity.operations.graphql`
13. Migrate community queries (3 files)
14. **Checkpoint:** Run web admin tests

### Phase 4: Seed Scripts (Day 7-8)

15. Create `seed.operations.graphql` with all 15 operations
16. Migrate `apps/seed/src/trips.ts`
17. Migrate `apps/seed/src/graphql-executor.ts`
18. Test seed script execution
19. **Checkpoint:** Verify seed creates entities correctly

### Phase 5: Web Admin Cleanup (Day 9)

20. Migrate middleware and auth files
21. Migrate notification form
22. **Final Checkpoint:** Full test suite + typecheck

### Phase 6: Final Verification (Day 10)

23. Run verification: `grep -r "const.*=.*\`.\*query\|mutation" apps/` → 0 results
24. Run `bun run build` and `bun test`
25. Document migration notes

## Testing Strategy

### Unit Testing

- Each migrated file requires verification that generated hook returns same data shape
- Use `[UNIT]` tags for pure logic, `[INTEGRATION]` for GraphQL calls

### Integration Testing

- **Storage:** Test file upload/download end-to-end
- **Location:** Verify location sharing toggle and friends list
- **Notification:** Test push subscription/unsubscription
- **Seed:** Run full seed script against local database

### Type Safety Verification

```bash
bun run typecheck  # After each domain
bun run lint       # ESLint catches unused imports
```

## Risk Mitigation

| Risk                    | Mitigation                                           |
| ----------------------- | ---------------------------------------------------- |
| Schema mismatch         | Verify Pothos types exist before creating operations |
| Different return shape  | Compare old response type with generated hook type   |
| Seed scripts fail       | Add explicit error handling and exit codes           |
| Location sharing breaks | Test on physical device                              |
| Web auth fails          | Verify `GetMe` query matches schema exactly          |

## Rollback Strategy

- Each domain migration is isolated—can revert single domain
- Seed scripts can temporarily use inline queries if needed
- Production apps only deployed after all tests pass

## Success Criteria

- Zero inline `query` or `mutation` strings in **all** apps
- All operations available as generated hooks from `@mirai-app/graphql-client`
- TypeScript compilation passes without `any` types for GraphQL responses
- Existing functionality preserved

## References

- CLAUDE.md §6: GraphQL workflow
- AGENTS.md: Universal conventions
- packages/graphql-client/codegen.ts: Codegen configuration
- apps/backend-server/src/graphql/types/: Pothos type definitions
