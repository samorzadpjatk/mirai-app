---
title: Migrate inline GraphQL queries to Pothos schema
---

## Initial User Prompt

There are still inline GQL queries in apps - move them into Pothos schema

## Description

Migrate 30+ inline GraphQL queries scattered across apps/web/, apps/native/, and apps/seed/ into the proper Pothos schema workflow. Currently these queries bypass the type-safe codegen process.

## Business Requirements

- Zero inline query or mutation strings in all apps (web + native + seed)
- All operations must be available as generated hooks from @mirai-app/graphql-client
- Maintain existing functionality with no behavioral changes
- Enable compile-time type safety for all GraphQL operations

## Acceptance Criteria

**AC1:** Given the migration is complete, when searching for GraphQL query/mutation strings in apps/, then zero inline query or mutation strings should exist in all apps (web + native + seed).

**AC2:** Given a client developer needs GraphQL operations, when they import from @mirai-app/graphql-client, then all operations must be available as generated hooks.

**AC3:** Given the migration is complete, when comparing before and after behavior, then all existing functionality must work with no behavioral changes.

**AC4:** Given a schema change occurs, when the project is compiled, then compile-time type errors should surface for any query mismatches.

## Architecture Overview

### Research Sources

- **Migration Skill Guide:** [.claude/skills/graphql-pothos-migration/SKILL.md](../../../.claude/skills/graphql-pothos-migration/SKILL.md)
- **Codebase Analysis:** [.specs/analysis/analysis-graphql-migration.md](../../../.specs/analysis/analysis-graphql-migration.md)

### Solution Strategy

The migration follows the established Pothos → Codegen workflow to replace 35 inline GraphQL queries with type-safe generated hooks. The approach is **phased by priority** to minimize risk while delivering value incrementally.

**Key Decisions:**

1. **Phased Migration by Priority**: Execute in 4 phases (HIGH → MEDIUM → LOW) based on impact analysis from the codebase analysis. File operations and auth are HIGH priority; analytics placeholders and seed scripts are LOW.

2. **Fragment-Centric Design**: Use GraphQL fragments for reusable field selections (e.g., `ChallengeFields`, `UserFields`) to maintain consistency and enable single-source-of-truth updates.

3. **Schema-First Approach**: All queries must have corresponding Pothos schema definitions before migration. If a query field is missing from the schema, it is added first, then synced, then operation files created.

4. **Seed Scripts Special Handling**: The 13 operations in `apps/seed/` use raw `fetch()` and a custom client. These are lower priority and may retain string patterns due to Edge/runtime constraints, but should import documents from the generated client where possible.

5. **Backward Compatibility**: Existing functionality is preserved by matching the exact field selections from inline queries. No behavioral changes—only implementation changes.

**Trade-offs:**

| Decision             | Pros                                    | Cons                                   |
| -------------------- | --------------------------------------- | -------------------------------------- |
| Phased execution     | Risk mitigation, incremental validation | Longer total timeline                  |
| Fragment-centric     | Single update propagates to all queries | Slightly more initial complexity       |
| Schema-first         | Type safety guarantees                  | Requires schema updates for new fields |
| Seed script deferral | Focus on production code first          | Seed scripts remain untyped longer     |

### Data Flow

**Current State (Inline Strings):**

```
Consumer Component
    ↓
Inline GraphQL String (template literal)
    ↓
urql client.query()/useQuery() OR raw fetch
    ↓
GraphQL Endpoint
    ↓
Pothos Resolvers
```

**Target State (Generated Hooks):**

```
Consumer Component
    ↓
Generated Typed Hook (useXxxQuery/useXxxMutation)
    ↓
GraphQL Operation Document (.graphql file)
    ↓
urql Codegen Plugin generates TypeScript
    ↓
Type-safe hook with full IDE support
    ↓
GraphQL Endpoint
    ↓
Pothos Resolvers (Effect-based)
```

**Migration Workflow Steps:**

1. Verify Pothos schema has the query/mutation field
2. Sync schema: `bun run sync-schema` (outputs to `schema.graphql`)
3. Create `.graphql` operation file in `packages/graphql-client/src/operations/`
4. Regenerate client: `bun run codegen` (outputs typed hooks to `urql.ts`)
5. Update consumer to import and use generated hook
6. Remove inline query string

### Components

#### New Files to Create

| File                                                                     | Purpose                         | Queries/Mutations                                                                         |
| ------------------------------------------------------------------------ | ------------------------------- | ----------------------------------------------------------------------------------------- |
| `packages/graphql-client/src/operations/files.operations.graphql`        | File upload/download operations | `CreateUploadUrl`, `CreateDownloadUrl`                                                    |
| `packages/graphql-client/src/operations/location.operations.graphql`     | Location sharing operations     | `GetMySharingSettings`, `UpdateLocationSharing`, `FriendsLocations`                       |
| `packages/graphql-client/src/operations/notification.operations.graphql` | Push notification operations    | `GetNotificationSubscriptionStatus`, `SubscribeNotifications`, `UnsubscribeNotifications` |
| `packages/graphql-client/src/operations/activity.operations.graphql`     | Community feed operations       | `ToggleActivityReaction`                                                                  |
| `packages/graphql-client/src/operations/group.operations.graphql`        | Group queries                   | `GetGroupsByTrip`                                                                         |

#### Files to Modify (HIGH Priority)

| File                                                                  | Current Pattern                             | Target Pattern                                                                                |
| --------------------------------------------------------------------- | ------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `apps/web/src/hooks/useWebFileUpload.ts`                              | Inline urql client `.mutation()`/`.query()` | Import `useCreateUploadUrlMutation`, `useCreateDownloadUrlQuery`                              |
| `apps/web/src/components/admin/challenges/SubmissionCard.tsx`         | Inline urql client `.query()`               | Import `CreateDownloadUrlDocument`                                                            |
| `apps/web/src/components/admin/challenges/VotingCard.tsx`             | Inline `useQuery()` string                  | Import `CreateDownloadUrlDocument`                                                            |
| `apps/web/src/middleware.ts`                                          | Raw fetch with inline query                 | Import `GetMeDocument` (keep fetch)                                                           |
| `apps/web/src/lib/auth.ts`                                            | tRPC client with inline query               | Import `GetMeDocument`                                                                        |
| `apps/web/src/hooks/admin/useChallengeSubmissions.ts`                 | Inline `useMutation()` strings              | Import generated mutation documents                                                           |
| `apps/web/src/hooks/admin/useJudgement.ts`                            | Inline `useQuery()`/`useMutation()` strings | Import `GetChallengeDocument`, `ReviewChallengeSubmissionDocument`, `UpdateChallengeDocument` |
| `apps/native/src/stores/location/LocationStoreProvider.tsx`           | Inline `useQuery()`/`useMutation()` strings | Import location operation documents                                                           |
| `apps/native/src/hooks/community/useCommunityFeed.ts`                 | Inline `useMutation()` string               | Import `ToggleActivityReactionDocument`                                                       |
| `apps/native/src/stores/judgement/useJudgement.ts`                    | Inline `useQuery()` string                  | Import `GetChallengeDocument`                                                                 |
| `apps/native/src/hooks/notifications/useNotifications.ts`             | Inline `useQuery()`/`useMutation()` strings | Import notification operation documents                                                       |
| `apps/native/src/hooks/files/useFileDownload.ts`                      | Inline urql client `.mutation()`            | Import `CreateDownloadUrlDocument`                                                            |
| `apps/native/src/hooks/files/useFileUpload.ts`                        | Inline urql client `.mutation()`            | Import `CreateUploadUrlDocument`                                                              |
| `apps/native/src/hooks/notifications/useAutoPushSubscription.ts`      | Inline `useMutation()` strings              | Import generated documents                                                                    |
| `apps/native/src/components/trips/groups/details/GroupMemberList.tsx` | Inline `useQuery()` string                  | Import `CreateDownloadUrlDocument`                                                            |

#### Schema Extensions Required

| Type/Field                   | Location                  | Purpose                         |
| ---------------------------- | ------------------------- | ------------------------------- |
| `GetSubmissionsForAnalytics` | `ChallengeAnalyticsPanel` | Analytics placeholder (Phase 4) |
| `GetGroupsCount`             | `ChallengeAnalyticsPanel` | Analytics placeholder (Phase 4) |
| `GetVotesCount`              | `ChallengeAnalyticsPanel` | Analytics placeholder (Phase 4) |

### Contracts

#### Input/Output Interfaces

**File Operations:**

```typescript
// CreateUploadUrlInput
interface CreateUploadUrlInput {
  filename: string;
  contentType: string;
  size: number;
  tripId?: string;
}

// CreateUploadUrlPayload
interface CreateUploadUrlPayload {
  token: string;
  bucket: string;
  objectPath: string;
  storagePath: string;
  url: string;
}

// CreateDownloadUrlInput
interface CreateDownloadUrlInput {
  storagePath: string;
}

// CreateDownloadUrlPayload
interface CreateDownloadUrlPayload {
  signedUrl: string;
  storagePath: string;
  expiresIn: number;
  expiresAt?: string;
}
```

**Location Operations:**

```typescript
// GetMySharingSettingsOutput
interface MySharingSettings {
  isSharingLocation: boolean;
  usersToShareWith: Array<{
    id: string;
    firstName: string;
    lastName: string;
  }>;
}

// UpdateSharingSettingsInput
interface UpdateSharingSettingsInput {
  isSharingLocation?: boolean;
  usersToShareWith?: string[];
}

// FriendsLocationsInput
interface FriendsLocationsInput {
  connectionId?: string;
  radiusKm?: number;
  latitude?: number;
  longitude?: number;
}
```

**Notification Operations:**

```typescript
// NotificationSubscriptionStatus
interface MyNotificationSubscriptions {
  isSubscribed: boolean;
  subscriptions: Array<{
    token: string;
    platform: string;
    createdAt: string;
  }>;
}

// SubscribeNotificationsInput
interface SubscribeNotificationsInput {
  token: string;
}
```

**Activity Operations:**

```typescript
// ToggleActivityReactionInput
interface ToggleActivityReactionInput {
  activityId: string;
  reaction: string; // "heart" | "fire" | "clap" | "star"
}

// ToggleActivityReactionPayload
interface ToggleActivityReactionPayload {
  activityId: string;
  reactionsSummary: {
    total: number;
    counts: {
      heart: number;
      fire: number;
      clap: number;
      star: number;
    };
    myReactions: string[];
  };
}
```

### Expected Changes

**Phase 1: File Operations (HIGH)**

- Create `files.operations.graphql` with 2 operations
- Modify 4 files: `useWebFileUpload.ts`, `useFileDownload.ts`, `useFileUpload.ts`, `SubmissionCard.tsx`, `VotingCard.tsx`, `GroupMemberList.tsx`
- Sync schema (verify `createUploadUrl` and `createDownloadUrl` exist)
- Run codegen
- Verify file upload/download E2E

**Phase 2: Auth & Location (HIGH)**

- Create `location.operations.graphql` with 3 operations
- Modify 4 files: `LocationStoreProvider.tsx`, `useMapLocationStream.ts`, `middleware.ts`, `auth.ts`
- Verify location sharing and auth flow

**Phase 3: Notifications & Activities (MEDIUM)**

- Create `notification.operations.graphql` with 3 operations
- Create `activity.operations.graphql` with 1 operation
- Modify 3 files: `useNotifications.ts`, `useAutoPushSubscription.ts`, `useCommunityFeed.ts`
- Verify push notifications and reactions

**Phase 4: Analytics & Seed (LOW)**

- Extend Pothos schema with analytics queries (3 fields)
- Create `group.operations.graphql` with 1 operation
- Modify 2 files: `ChallengeAnalyticsPanel.tsx`, `CreateNotificationForm.tsx`
- Evaluate seed script migration separately

**Testing Requirements:**

- Type check: `tsc --noEmit` must pass after each phase
- Unit tests: Run `bun test` to verify no regressions
- Integration: Manual verification of file upload, location sharing, notifications

## Parallelize Steps

### Dependency Analysis

**Producer-Consumer Dependencies:**

| Producer | Output                            | Consumers        |
| -------- | --------------------------------- | ---------------- |
| Step 2   | File operations documents         | Steps 3, 4, 5, 6 |
| Step 7   | Location operations documents     | Steps 8, 9       |
| Step 10  | Notification operations documents | Step 11          |
| Step 12  | Activity operations documents     | Step 13          |
| Step 18  | Analytics schema extensions       | Step 19          |

**Cross-Cutting Dependencies:**

| Dependency               | Required By                                    |
| ------------------------ | ---------------------------------------------- |
| GetMe query in schema    | Step 9 (assumed pre-existing)                  |
| File operations (Step 2) | Steps 15, 16 (challenge-related file handling) |

### Parallel Execution Streams

```
Wave 1: SETUP
  └── Step 1 [haiku] - Environment Verification

Wave 2: DOCUMENT CREATION (Parallel)
  ├── Track A: Step 2 [sonnet] - File Operations
  ├── Track B: Step 7 [sonnet] - Location Operations
  └── Track C: Step 10 [sonnet] + Step 12 [haiku] - Notification + Activity

Wave 3: CONSUMER MIGRATION (Parallel after Wave 2)
  ├── Track A: Steps 3,4,5,6 [sonnet/haiku] - File Consumers (all parallel)
  ├── Track B: Steps 8,9 [sonnet/opus] - Location & Auth (parallel)
  ├── Track C: Step 11 [sonnet] - Notification Hooks
  ├── Track D: Step 13 [haiku] - Community Feed
  └── Track E: Steps 14,15,17 [sonnet] - Challenges (parallel, soft deps)

Wave 4: CHALLENGE SEQUENTIAL
  └── Step 15 → Step 16 (Web Judgement → Native Judgement)

Wave 5: ANALYTICS & SEED (Parallel)
  ├── Track A: Step 18 [opus] → Step 19 [sonnet]
  └── Track B: Step 20 [opus] - Seed Script Evaluation

Wave 6: FINAL
  └── Step 21 [opus] - Critical Verification Gate
```

### Agent Assignments

| Step | Agent  | Rationale                               |
| ---- | ------ | --------------------------------------- |
| 1    | haiku  | Trivial baseline verification, ~30min   |
| 2    | sonnet | Standard GraphQL document creation      |
| 3    | sonnet | Standard hook migration                 |
| 4    | sonnet | Standard hook migration, mobile context |
| 5    | sonnet | Standard document-based migration       |
| 6    | haiku  | Simple component, ~15min                |
| 7    | sonnet | Standard GraphQL document creation      |
| 8    | sonnet | High complexity, real-time features     |
| 9    | opus   | Security-critical, Edge runtime         |
| 10   | sonnet | Standard GraphQL document creation      |
| 11   | sonnet | Standard hook migration                 |
| 12   | haiku  | Simple single-operation, ~15min         |
| 13   | haiku  | Simple mutation migration, ~15min       |
| 14   | sonnet | Medium complexity, multiple mutations   |
| 15   | sonnet | Medium complexity, multi-operations     |
| 16   | haiku  | Simple single query, ~15min             |
| 17   | haiku  | Simple single-operation, ~15min         |
| 18   | opus   | Schema design, auth guards              |
| 19   | sonnet | Standard hook migration                 |
| 20   | opus   | Complex evaluation, decision-making     |
| 21   | opus   | Critical verification, comprehensive    |

### Execution Waves Detail

**Wave 1: Setup (Sequential)**

- Step 1: Environment Verification [haiku]
  - Blockers: []
  - Parallel with: Nothing (must be first)
  - Output: Baseline confirmed

**Wave 2: Document Creation (4 parallel tracks)**

- Step 2: Create File Operations [sonnet]
  - Depends: [Step 1]
  - Parallel with: [Step 7, Step 10, Step 12]
  - Output: files.operations.graphql

- Step 7: Create Location Operations [sonnet]
  - Depends: [Step 1]
  - Parallel with: [Step 2, Step 10, Step 12]
  - Output: location.operations.graphql

- Step 10: Create Notification Operations [sonnet]
  - Depends: [Step 1]
  - Parallel with: [Step 2, Step 7, Step 12]
  - Output: notification.operations.graphql

- Step 12: Create Activity Operations [haiku]
  - Depends: [Step 1]
  - Parallel with: [Step 2, Step 7, Step 10]
  - Output: activity.operations.graphql

**Wave 3: Consumer Migration (5 parallel tracks)**

- Track A - File Consumers (all parallel after Step 2):
  - Step 3: Migrate Web File Upload [sonnet]
  - Step 4: Migrate Native File Hooks [sonnet]
  - Step 5: Migrate Admin Components [sonnet]
  - Step 6: Migrate Group Member List [haiku]

- Track B - Location (parallel after Step 7):
  - Step 8: Migrate Location Store [sonnet]
  - Step 9: Migrate Web Auth [opus] (SECURITY CRITICAL)

- Track C - Notifications (after Step 10):
  - Step 11: Migrate Notification Hooks [sonnet]

- Track D - Activities (after Step 12):
  - Step 13: Migrate Community Feed [haiku]

- Track E - Challenges (parallel, assumes schema exists):
  - Step 14: Migrate Admin Submissions [sonnet]
  - Step 15: Migrate Web Judgement [sonnet] (soft dep on Step 2)
  - Step 17: Create Group Operations [haiku]

**Wave 4: Challenge Sequential**

- Step 16: Migrate Native Judgement [haiku]
  - Depends: [Step 15]
  - Sequential: true (follow web patterns)

**Wave 5: Analytics & Seed (2 parallel tracks)**

- Track A:
  - Step 18: Extend Schema for Analytics [opus]
    - Depends: [Waves 2-4 complete]
  - Step 19: Migrate Analytics Panel [sonnet]
    - Depends: [Step 18]
    - Parallel with: [Step 20]

- Track B:
  - Step 20: Evaluate Seed Scripts [opus]
    - Depends: [Waves 2-4 complete]
    - Parallel with: [Track A]

**Wave 6: Final Verification (Critical Gate)**

- Step 21: Final Verification [opus]
  - Depends: [All previous steps]
  - Critical: true (blocks completion)
  - Output: Migration complete

### Quick Dependency Reference

```
Step 1  →  Steps 2, 7, 10, 12, 14, 17
Step 2  →  Steps 3, 4, 5, 6
Step 7  →  Steps 8, 9
Step 10 →  Step 11
Step 12 →  Step 13
Step 14 →  Step 15 (soft)
Step 15 →  Step 16
Step 18 →  Step 19
All consumer steps → Step 21
```

---

## Implementation Process

### Phase: Setup (Environment Validation)

#### Step 1: Environment Verification and Baseline

**Goal:** Establish working baseline and validate all tooling before migration begins.

**Output:** Confirmed working environment with passing tests and functional schema sync/codegen pipeline.

**Success Criteria:**

- [ ] `bun install` completes without errors
- [ ] `bun run sync-schema` executes successfully and generates `schema.graphql`
- [ ] `bun run codegen` executes successfully and generates `packages/graphql-client/src/generated/urql.ts`
- [ ] `bun test` passes with zero failures (baseline green)
- [ ] `tsc --noEmit` passes with zero type errors

**Subtasks:**

1. Run dependency installation and verify lockfile consistency
2. Execute schema sync and verify Pothos schema outputs correctly
3. Execute codegen and verify all generated types are present
4. Run full test suite and document any pre-existing failures
5. Run type check and document any pre-existing type errors

**Blockers:**

- **Blocker:** Schema sync fails due to missing backend server
  - **Resolution:** Start backend server with `bun run dev` in apps/backend-server, then retry sync
- **Blocker:** Codegen fails with GraphQL validation errors
  - **Resolution:** Check `packages/graphql-client/src/operations/*.graphql` for syntax errors; verify schema.graphql is up-to-date
- **Blocker:** Tests fail due to database connection issues
  - **Resolution:** Verify Docker containers are running with `docker ps`; check `supabase status`

**Risks:**

- **Risk:** Pre-existing test failures obscure migration regressions
  - **Mitigation:** Document all pre-existing failures with `[PRE-EXISTING]` tags; maintain separate tracking
- **Risk:** Environment drift between local and CI
  - **Mitigation:** Verify CI pipeline configuration matches local setup; run tests in clean environment

**Verification:**

- **Level:** Panel
- **Threshold:** 4.5/5.0

| Criteria                | Weight | Description                                                         |
| ----------------------- | ------ | ------------------------------------------------------------------- | ----------------------------------------- |
| Dependency Installation | 0.25   | `bun install` completes without errors, lockfile consistent         | 1=Errors/failures, 5=Clean install        |
| Schema Sync             | 0.30   | `bun run sync-schema` executes and generates valid `schema.graphql` | 1=Sync fails, 5=Success with valid schema |
| Codegen                 | 0.25   | `bun run codegen` executes and generates `urql.ts`                  | 1=Codegen fails, 5=Success with all types |
| Test Baseline           | 0.20   | `bun test` passes with zero failures, `tsc --noEmit` passes         | 1=Multiple failures, 5=Green baseline     |

---

### Phase: Foundational (Phase 1 - Storage Operations)

#### Step 2: Create File Operations GraphQL Documents

**Goal:** Create `.graphql` operation file for file upload/download operations.

**Output:** `packages/graphql-client/src/operations/files.operations.graphql` with 2 operations.

**Success Criteria:**

- [ ] File contains `CreateUploadUrl` mutation with exact fields from inline queries
- [ ] File contains `CreateDownloadUrl` query with exact fields from inline queries
- [ ] GraphQL syntax validation passes (`bun run codegen` succeeds)
- [ ] Generated hooks exported from `packages/graphql-client/src/index.ts`

**Subtasks:**

1. Analyze inline queries in `useFileUpload.ts`, `useFileDownload.ts`, `useWebFileUpload.ts`, `SubmissionCard.tsx`, `VotingCard.tsx`, `GroupMemberList.tsx`
2. Extract field selections and variable definitions from inline strings
3. Create `files.operations.graphql` with matching operations
4. Export new operations from graphql-client index
5. Run codegen and verify hooks are generated

**Blockers:**

- **Blocker:** Field mismatch between inline query and schema
  - **Resolution:** Compare inline query fields against `schema.graphql`; extend Pothos schema if necessary
- **Blocker:** Generated hook names conflict with existing exports
  - **Resolution:** Use explicit operation names in GraphQL documents to control generated hook names

**Risks:**

- **Risk:** Missing fields in fragment cause runtime errors
  - **Mitigation:** Copy field selections exactly from working inline queries; no optimization
- **Risk:** Variable type mismatches (e.g., optional vs required)
  - **Mitigation:** Match variable definitions exactly; verify with TypeScript errors

**Verification:**

- **Level:** Single
- **Threshold:** 4.0/5.0

| Criteria           | Weight | Description                                                  |
| ------------------ | ------ | ------------------------------------------------------------ | ------------------------------------------------ |
| Operations Created | 0.40   | `CreateUploadUrl` and `CreateDownloadUrl` operations defined | 1=Missing operations, 5=Both with correct fields |
| Syntax Validation  | 0.30   | GraphQL syntax passes, `bun run codegen` succeeds            | 1=Syntax errors, 5=Clean validation              |
| Export Integration | 0.30   | Operations exported from `graphql-client/src/index.ts`       | 1=Not exported, 5=Properly exported              |

#### Step 3: Migrate Web File Upload Hook

**Goal:** Replace inline queries in web file upload with generated hooks.

**Output:** `apps/web/src/hooks/useWebFileUpload.ts` using `useCreateUploadUrlMutation` and `useCreateDownloadUrlQuery`.

**Success Criteria:**

- [ ] No inline GraphQL strings remain in the file
- [ ] File imports `useCreateUploadUrlMutation` and `useCreateDownloadUrlQuery` from `@mirai-app/graphql-client`
- [ ] Upload functionality works identically (manual E2E test)
- [ ] TypeScript compiles without errors

**Subtasks:**

1. Replace `client.mutation()` call with `useCreateUploadUrlMutation()` hook
2. Replace `client.query()` call with `useCreateDownloadUrlQuery()` hook
3. Update variable passing to match generated hook signatures
4. Remove inline query string constants
5. Test file upload flow manually

**Blockers:**

- **Blocker:** Hook API differs from client API (return shape, loading states)
  - **Resolution:** Adapt component code to match urql hook patterns; check urql documentation
- **Blocker:** Error handling patterns differ
  - **Resolution:** Map urql error shape to existing error handling; maintain user-facing behavior

**Risks:**

- **Risk:** Upload progress tracking behaves differently
  - **Mitigation:** Verify progress callbacks work identically; test large file uploads

**Verification:**

- **Level:** Single
- **Threshold:** 4.0/5.0

| Criteria             | Weight | Description                                               |
| -------------------- | ------ | --------------------------------------------------------- | ------------------------------- |
| Inline Query Removal | 0.40   | No inline GraphQL strings remain in `useWebFileUpload.ts` | 1=Strings remain, 5=All removed |
| Import Correctness   | 0.35   | Correct hooks imported from `@mirai-app/graphql-client`   | 1=Wrong imports, 5=All correct  |
| Type Safety          | 0.25   | No TypeScript errors, no `any` types for GraphQL          | 1=Errors remain, 5=Clean types  |

#### Step 4: Migrate Native File Hooks

**Goal:** Replace inline queries in native file hooks with generated hooks.

**Output:** `apps/native/src/hooks/files/useFileDownload.ts` and `useFileUpload.ts` using generated hooks.

**Success Criteria:**

- [ ] Both files use `useCreateUploadUrlMutation` and `useCreateDownloadUrlMutation`
- [ ] No inline GraphQL strings remain
- [ ] File upload/download works in native app (manual test)
- [ ] TypeScript compiles without errors

**Subtasks:**

1. Update `useFileDownload.ts` to use generated mutation hook
2. Update `useFileUpload.ts` to use generated mutation hook
3. Ensure mobile-specific file handling (paths, formats) still works
4. Test on both iOS and Android if possible

**Blockers:**

- **Blocker:** Native file system APIs interact differently with new hooks
  - **Resolution:** Maintain existing file system logic; only change GraphQL layer

**Risks:**

- **Risk:** Mobile-specific file handling breaks
  - **Mitigation:** Test with real files on device/simulator; verify mime types and paths

**Verification:**

- **Level:** Per-Item
- **Threshold:** 4.0/5.0
- **Artifacts:** `useFileDownload.ts`, `useFileUpload.ts`

| Criteria                        | Weight | Description                                                         |
| ------------------------------- | ------ | ------------------------------------------------------------------- | ------------------------------------ |
| Hook Migration (per file)       | 0.50   | Uses `useCreateUploadUrlMutation` or `useCreateDownloadUrlMutation` | 1=Old client API, 5=Generated hooks  |
| String Removal (per file)       | 0.30   | No inline GraphQL strings remain                                    | 1=Strings remain, 5=All removed      |
| Mobile Compatibility (per file) | 0.20   | File system paths and formats work correctly                        | 1=Broken paths, 5=Full compatibility |

#### Step 5: Migrate Admin Challenge Components

**Goal:** Replace inline download URL queries in admin components.

**Output:** `SubmissionCard.tsx` and `VotingCard.tsx` using `CreateDownloadUrlDocument`.

**Success Criteria:**

- [ ] Both components import `CreateDownloadUrlDocument` from `@mirai-app/graphql-client`
- [ ] No inline GraphQL strings in either file
- [ ] Admin challenge views display/download submissions correctly
- [ ] TypeScript compiles without errors

**Subtasks:**

1. Update `SubmissionCard.tsx` to use document-based query
2. Update `VotingCard.tsx` to use document-based query
3. Verify admin challenge flow works end-to-end

**Blockers:**

- **Blocker:** Components use `client.query()` for one-off fetches
  - **Resolution:** Use `useQuery()` hook with `pause: true` or execute mutation pattern

**Verification:**

- **Level:** Per-Item
- **Threshold:** 4.0/5.0
- **Artifacts:** `SubmissionCard.tsx`, `VotingCard.tsx`

| Criteria                   | Weight | Description                                                          |
| -------------------------- | ------ | -------------------------------------------------------------------- | ----------------------------------- |
| Document Import (per file) | 0.50   | Imports `CreateDownloadUrlDocument` from `@mirai-app/graphql-client` | 1=Not imported, 5=Correct import    |
| String Removal (per file)  | 0.30   | No inline GraphQL strings remain                                     | 1=Strings remain, 5=All removed     |
| Admin Flow (per file)      | 0.20   | Challenge submissions display/download correctly                     | 1=Broken flow, 5=Working end-to-end |

#### Step 6: Migrate Group Member List Component

**Goal:** Replace inline download URL query in group member list.

**Output:** `GroupMemberList.tsx` using `CreateDownloadUrlDocument`.

**Success Criteria:**

- [ ] Component imports `CreateDownloadUrlDocument`
- [ ] Avatar images load correctly
- [ ] No inline GraphQL strings remain
- [ ] TypeScript compiles without errors

**Subtasks:**

1. Replace inline query with generated document
2. Test avatar loading in group member list

**Verification:**

- **Level:** Single
- **Threshold:** 4.0/5.0

| Criteria        | Weight | Description                                    |
| --------------- | ------ | ---------------------------------------------- | ---------------------------------------- |
| Document Import | 0.40   | `CreateDownloadUrlDocument` imported correctly | 1=Missing/wrong import, 5=Correct import |
| Avatar Loading  | 0.35   | Avatar images load correctly in member list    | 1=Images broken, 5=All avatars load      |
| String Removal  | 0.25   | No inline GraphQL strings remain               | 1=Strings remain, 5=All removed          |

---

### Phase: User Stories (Phase 2 - Location & Auth)

#### Step 7: Create Location Operations GraphQL Documents

**Goal:** Create `.graphql` operation file for location sharing operations.

**Output:** `packages/graphql-client/src/operations/location.operations.graphql` with 3 operations.

**Success Criteria:**

- [ ] File contains `GetMySharingSettings` query
- [ ] File contains `UpdateLocationSharing` mutation
- [ ] File contains `FriendsLocations` query
- [ ] Codegen succeeds and hooks are exported

**Subtasks:**

1. Analyze `LocationStoreProvider.tsx` for all location-related queries
2. Extract field selections from inline strings
3. Create `location.operations.graphql`
4. Export from graphql-client index
5. Run codegen

**Blockers:**

- **Blocker:** Location queries have complex input types
  - **Resolution:** Carefully match Input type definitions from schema

**Verification:**

- **Level:** Single
- **Threshold:** 4.0/5.0

| Criteria            | Weight | Description                                                                                    |
| ------------------- | ------ | ---------------------------------------------------------------------------------------------- | ------------------------------------------- |
| Operations Created  | 0.40   | All 3 operations (`GetMySharingSettings`, `UpdateLocationSharing`, `FriendsLocations`) defined | 1=Missing, 5=All with correct fields        |
| Complex Input Types | 0.30   | Input types match schema definitions exactly                                                   | 1=Mismatches, 5=Perfect match               |
| Export Integration  | 0.30   | Operations exported and codegen succeeds                                                       | 1=Export/codegen fails, 5=Clean integration |

#### Step 8: Migrate Location Store Provider

**Goal:** Replace inline queries in native location store.

**Output:** `apps/native/src/stores/location/LocationStoreProvider.tsx` using generated hooks.

**Success Criteria:**

- [ ] No inline GraphQL strings in file
- [ ] Location sharing settings load and update correctly
- [ ] Friends locations display on map
- [ ] TypeScript compiles without errors

**Subtasks:**

1. Replace `GetMySharingSettings` inline query with `useGetMySharingSettingsQuery`
2. Replace `UpdateLocationSharing` inline mutation with `useUpdateLocationSharingMutation`
3. Replace `FriendsLocations` inline query with `useFriendsLocationsQuery`
4. Verify location sharing toggle works
5. Verify friends appear on map

**Risks:**

- **Risk:** Real-time location updates break
  - **Mitigation:** Test location sharing between two devices; verify WebSocket subscriptions still work

**Verification:**

- **Level:** Panel
- **Threshold:** 4.5/5.0

| Criteria            | Weight | Description                                        |
| ------------------- | ------ | -------------------------------------------------- | -------------------------------------- |
| Query Migration     | 0.30   | All 3 inline queries replaced with generated hooks | 1=Queries remain, 5=All migrated       |
| Location Sharing    | 0.35   | Sharing settings load and update correctly         | 1=Broken, 5=Fully functional           |
| Friends Map Display | 0.20   | Friends locations display correctly on map         | 1=Not showing, 5=All locations visible |
| Type Safety         | 0.15   | No TypeScript errors in location store             | 1=Errors present, 5=Clean compilation  |

#### Step 9: Migrate Web Middleware and Auth

**Goal:** Replace inline queries in web middleware and auth utilities.

**Output:** `apps/web/src/middleware.ts` and `apps/web/src/lib/auth.ts` using `GetMeDocument`.

**Success Criteria:**

- [ ] Middleware imports `GetMeDocument` from `@mirai-app/graphql-client`
- [ ] Auth utilities import `GetMeDocument`
- [ ] Authentication flow works (login, session validation)
- [ ] Middleware properly protects routes
- [ ] TypeScript compiles without errors

**Subtasks:**

1. Verify `GetMe` query exists in schema or create it
2. Update `middleware.ts` to import and use `GetMeDocument`
3. Update `lib/auth.ts` to use `GetMeDocument` with tRPC or fetch
4. Test full auth flow: login → session validation → protected route access
5. Test session expiration handling

**Blockers:**

- **Blocker:** Middleware runs in Edge runtime with limited imports
  - **Resolution:** Middleware may keep raw fetch pattern but import Document for type safety; verify bundle size
- **Blocker:** tRPC client integration with generated documents
  - **Resolution:** Use tRPC's ability to accept GraphQL documents; check existing patterns

**Risks:**

- **Risk:** Edge runtime bundle size increase
  - **Mitigation:** Verify bundle size before/after; use dynamic imports if needed
- **Risk:** Auth flow breaks (security critical)
  - **Mitigation:** Extensive manual testing; verify all auth edge cases

**Verification:**

- **Level:** Panel
- **Threshold:** 4.5/5.0

| Criteria                 | Weight | Description                                          |
| ------------------------ | ------ | ---------------------------------------------------- | -------------------------------------- |
| Document Import          | 0.25   | `GetMeDocument` imported in both middleware and auth | 1=Not imported, 5=Correct imports      |
| Auth Flow                | 0.35   | Login, session validation, protected routes work     | 1=Flow broken, 5=All scenarios pass    |
| Middleware Compatibility | 0.25   | Edge runtime compatible, bundle size acceptable      | 1=Runtime errors, 5=Full compatibility |
| Security                 | 0.15   | No security regressions, proper route protection     | 1=Vulnerabilities, 5=Secure            |

---

### Phase: User Stories (Phase 3 - Notifications & Activities)

#### Step 10: Create Notification Operations GraphQL Documents

**Goal:** Create `.graphql` operation file for push notification operations.

**Output:** `packages/graphql-client/src/operations/notification.operations.graphql` with 3 operations.

**Success Criteria:**

- [x] File contains `GetNotificationSubscriptionStatus` query
- [x] File contains `SubscribeNotifications` mutation
- [x] File contains `UnsubscribeNotifications` mutation
- [ ] Codegen succeeds and hooks exported (BLOCKED: schema sync issue)

**Subtasks:**

1. Analyze `useNotifications.ts` and `useAutoPushSubscription.ts`
2. Extract field selections and create operation file
3. Export and run codegen

**Status:**

- ✅ Operations file created at `packages/graphql-client/src/operations/notification.operations.graphql`
- ✅ Pothos types added to `builder.ts` for PushSubscription domain
- ✅ Resolvers added to `notifications.ts` for query/mutations
- ⚠️ **BLOCKED:** Schema sync failing due to `builder.globalFieldOptions is not a function` error in `packages/frameworks/src/graphql/builder.ts` (pre-existing issue)

**Verification:**

- **Level:** Single
- **Threshold:** 4.0/5.0

| Criteria           | Weight | Description                                |
| ------------------ | ------ | ------------------------------------------ | ------------------------------------ |
| Operations Created | 0.40   | All 3 notification operations defined      | 1=Missing, 5=All with correct fields |
| Field Selections   | 0.35   | Fields match inline query requirements     | 1=Mismatches, 5=Exact match          |
| Codegen Success    | 0.25   | `bun run codegen` succeeds, hooks exported | 1=Fails, 5=Success                   |

#### Step 11: Migrate Notification Hooks

**Goal:** Replace inline queries in notification hooks.

**Output:** `useNotifications.ts` and `useAutoPushSubscription.ts` using generated hooks.

**Success Criteria:**

- [ ] `useNotifications.ts` uses `useGetNotificationSubscriptionStatusQuery` and `useSubscribeNotificationsMutation` and `useUnsubscribeNotificationsMutation`
- [ ] `useAutoPushSubscription.ts` uses generated mutation hooks
- [ ] Push notification subscription works
- [ ] Token registration works
- [ ] TypeScript compiles without errors

**Subtasks:**

1. Update `useNotifications.ts` with generated hooks
2. Update `useAutoPushSubscription.ts` with generated hooks
3. Test push notification subscription flow
4. Test token registration on iOS/Android

**Risks:**

- **Risk:** Push notification permissions break
  - **Mitigation:** Test on real devices; verify permission request flow
- **Risk:** Background token refresh breaks
  - **Mitigation:** Test app backgrounding/foregrounding; verify token updates

**Verification:**

- **Level:** Per-Item
- **Threshold:** 4.0/5.0
- **Artifacts:** `useNotifications.ts`, `useAutoPushSubscription.ts`

| Criteria                  | Weight | Description                                   |
| ------------------------- | ------ | --------------------------------------------- | -------------------------------------- |
| Hook Migration (per file) | 0.45   | Uses correct generated query/mutation hooks   | 1=Inline strings, 5=All hooks migrated |
| Functionality (per file)  | 0.35   | Push subscription and token registration work | 1=Broken, 5=Fully functional           |
| String Removal (per file) | 0.20   | No inline GraphQL strings remain              | 1=Strings remain, 5=All removed        |

#### Step 12: Create Activity Operations GraphQL Document

**Goal:** Create `.graphql` operation file for activity/reaction operations.

**Output:** `packages/graphql-client/src/operations/activity.operations.graphql` with 1 operation.

**Success Criteria:**

- [ ] File contains `ToggleActivityReaction` mutation
- [ ] Codegen succeeds and hooks exported

**Subtasks:**

1. Analyze `useCommunityFeed.ts` for reaction mutation
2. Create `activity.operations.graphql`
3. Export and run codegen

**Verification:**

- **Level:** Single
- **Threshold:** 4.0/5.0

| Criteria           | Weight | Description                                         |
| ------------------ | ------ | --------------------------------------------------- | ----------------------------------- |
| Operation Created  | 0.40   | `ToggleActivityReaction` mutation defined correctly | 1=Missing, 5=Correct fields         |
| Codegen Success    | 0.35   | `bun run codegen` succeeds                          | 1=Fails, 5=Success                  |
| Export Integration | 0.25   | Exported from graphql-client index                  | 1=Not exported, 5=Properly exported |

#### Step 13: Migrate Community Feed Hook

**Goal:** Replace inline reaction mutation in community feed.

**Output:** `apps/native/src/hooks/community/useCommunityFeed.ts` using `useToggleActivityReactionMutation`.

**Success Criteria:**

- [ ] Hook uses `useToggleActivityReactionMutation`
- [ ] Activity reactions work (add/remove)
- [ ] Reaction counts update correctly
- [ ] No inline GraphQL strings remain
- [ ] TypeScript compiles without errors

**Subtasks:**

1. Replace inline mutation with generated hook
2. Test activity reactions in community feed
3. Verify optimistic updates still work

**Verification:**

- **Level:** Single
- **Threshold:** 4.0/5.0

| Criteria               | Weight | Description                                      |
| ---------------------- | ------ | ------------------------------------------------ | -------------------------------- |
| Hook Migration         | 0.40   | Uses `useToggleActivityReactionMutation`         | 1=Inline string, 5=Hook migrated |
| Reaction Functionality | 0.35   | Reactions add/remove correctly, counts update    | 1=Broken, 5=Fully functional     |
| Optimistic Updates     | 0.15   | UI updates optimistically before server response | 1=No optimistic update, 5=Works  |
| String Removal         | 0.10   | No inline GraphQL strings remain                 | 1=Strings remain, 5=All removed  |

---

### Phase: User Stories (Phase 3b - Challenges & Community)

#### Step 14: Migrate Admin Challenge Submissions Hook

**Goal:** Replace inline queries in admin submissions hook.

**Output:** `apps/web/src/hooks/admin/useChallengeSubmissions.ts` using generated hooks.

**Success Criteria:**

- [ ] Hook uses generated mutation hooks for all submissions operations
- [ ] Admin submissions view works correctly
- [ ] TypeScript compiles without errors

**Subtasks:**

1. Identify all inline mutations in `useChallengeSubmissions.ts`
2. Verify corresponding mutations exist in schema
3. Create or update GraphQL operations
4. Migrate to generated hooks
5. Test admin submissions flow

**Verification:**

- **Level:** Single
- **Threshold:** 4.0/5.0

| Criteria       | Weight | Description                                        |
| -------------- | ------ | -------------------------------------------------- | -------------------------------- |
| Hook Migration | 0.45   | All inline mutations replaced with generated hooks | 1=Strings remain, 5=All migrated |
| Admin Flow     | 0.35   | Submissions view works correctly                   | 1=Broken, 5=Fully functional     |
| Type Safety    | 0.20   | No TypeScript errors                               | 1=Errors present, 5=Clean        |

#### Step 15: Migrate Judgement Hooks (Web)

**Goal:** Replace inline queries in web judgement hook.

**Output:** `apps/web/src/hooks/admin/useJudgement.ts` using generated hooks.

**Success Criteria:**

- [ ] Hook uses `useGetChallengeQuery`, `useReviewChallengeSubmissionMutation`, `useUpdateChallengeMutation`
- [ ] Challenge judgement flow works
- [ ] TypeScript compiles without errors

**Subtasks:**

1. Update to use generated hooks
2. Test challenge judgement flow end-to-end

**Verification:**

- **Level:** Single
- **Threshold:** 4.0/5.0

| Criteria       | Weight | Description                                                                                       |
| -------------- | ------ | ------------------------------------------------------------------------------------------------- | ------------------------------- |
| Hook Migration | 0.45   | Uses `useGetChallengeQuery`, `useReviewChallengeSubmissionMutation`, `useUpdateChallengeMutation` | 1=Missing hooks, 5=All migrated |
| Judgement Flow | 0.35   | Challenge judgement works end-to-end                                                              | 1=Broken, 5=Fully functional    |
| String Removal | 0.20   | No inline GraphQL strings remain                                                                  | 1=Strings remain, 5=All removed |

#### Step 16: Migrate Judgement Hooks (Native)

**Goal:** Replace inline queries in native judgement store.

**Output:** `apps/native/src/stores/judgement/useJudgement.ts` using `useGetChallengeQuery`.

**Success Criteria:**

- [ ] Store uses `useGetChallengeQuery`
- [ ] Native challenge judgement works
- [ ] TypeScript compiles without errors

**Subtasks:**

1. Replace inline query with generated hook
2. Test native judgement flow

**Verification:**

- **Level:** Single
- **Threshold:** 4.0/5.0

| Criteria         | Weight | Description                                      |
| ---------------- | ------ | ------------------------------------------------ | -------------------------------- |
| Hook Migration   | 0.45   | Uses `useGetChallengeQuery` from generated hooks | 1=Inline string, 5=Hook migrated |
| Native Judgement | 0.35   | Challenge judgement works in native app          | 1=Broken, 5=Fully functional     |
| String Removal   | 0.20   | No inline GraphQL strings remain                 | 1=Strings remain, 5=All removed  |

#### Step 17: Create Group Operations GraphQL Document

**Goal:** Create `.graphql` operation file for group queries.

**Output:** `packages/graphql-client/src/operations/group.operations.graphql` with 1 operation.

**Success Criteria:**

- [ ] File contains `GetGroupsByTrip` query
- [ ] Codegen succeeds and hooks exported

**Subtasks:**

1. Analyze inline query usage
2. Create operation file
3. Export and run codegen

**Verification:**

- **Level:** Single
- **Threshold:** 4.0/5.0

| Criteria           | Weight | Description                               |
| ------------------ | ------ | ----------------------------------------- | ----------------------------------- |
| Operation Created  | 0.45   | `GetGroupsByTrip` query defined correctly | 1=Missing, 5=Correct fields         |
| Codegen Success    | 0.30   | `bun run codegen` succeeds                | 1=Fails, 5=Success                  |
| Export Integration | 0.25   | Exported from graphql-client index        | 1=Not exported, 5=Properly exported |

---

### Phase: Polish (Phase 4 - Analytics & Seed)

#### Step 18: Extend Schema for Analytics Queries

**Goal:** Add analytics placeholder queries to Pothos schema.

**Output:** Pothos schema extended with `GetSubmissionsForAnalytics`, `GetGroupsCount`, `GetVotesCount`.

**Success Criteria:**

- [ ] Three analytics fields added to Query type in Pothos
- [ ] Schema sync succeeds
- [ ] Resolvers stubbed with `Effect.succeed` or real implementations

**Subtasks:**

1. Locate Pothos query type definitions (likely in `apps/backend-server/src/schema/`)
2. Add `GetSubmissionsForAnalytics` field
3. Add `GetGroupsCount` field
4. Add `GetVotesCount` field
5. Sync schema and verify

**Blockers:**

- **Blocker:** Analytics resolvers require database access patterns
  - **Resolution:** Stub with placeholder data or implement with proper Effect patterns

**Risks:**

- **Risk:** Analytics fields expose sensitive data
  - **Mitigation:** Verify auth guards on new fields; restrict to admin role

**Verification:**

- **Level:** Single
- **Threshold:** 4.0/5.0

| Criteria                | Weight | Description                                   |
| ----------------------- | ------ | --------------------------------------------- | ---------------------------------- |
| Schema Extension        | 0.40   | All 3 analytics fields added to Pothos schema | 1=Missing, 5=All fields present    |
| Schema Sync             | 0.30   | `bun run sync-schema` succeeds                | 1=Sync fails, 5=Success            |
| Resolver Implementation | 0.30   | Resolvers stubbed or implemented correctly    | 1=Missing resolvers, 5=All present |

#### Step 19: Migrate Analytics Panel

**Goal:** Replace inline analytics queries in admin panel.

**Output:** `ChallengeAnalyticsPanel.tsx` using generated hooks.

**Success Criteria:**

- [ ] Panel uses generated query hooks for analytics
- [ ] Analytics display correctly
- [ ] TypeScript compiles without errors

**Subtasks:**

1. Create analytics operations file or add to existing
2. Update panel to use generated hooks
3. Verify analytics display

**Verification:**

- **Level:** Single
- **Threshold:** 4.0/5.0

| Criteria          | Weight | Description                                    |
| ----------------- | ------ | ---------------------------------------------- | ------------------------------------ |
| Hook Migration    | 0.40   | Panel uses generated query hooks for analytics | 1=Inline strings, 5=All migrated     |
| Analytics Display | 0.35   | Analytics display correctly                    | 1=Broken/missing, 5=Fully functional |
| Type Safety       | 0.25   | No TypeScript errors                           | 1=Errors present, 5=Clean            |

#### Step 20: Evaluate and Migrate Seed Scripts

**Goal:** Evaluate seed script migration feasibility and migrate if possible.

**Output:** Decision document + migrated seed scripts OR deferred with tech debt ticket.

**Success Criteria:**

- [ ] Seed scripts evaluated for Edge/runtime constraints
- [ ] If migrated: seed scripts use generated documents
- [ ] If deferred: tech debt ticket created with justification
- [ ] Seed functionality preserved

**Subtasks:**

1. Analyze all 13 operations in `apps/seed/`
2. Check runtime constraints (Edge vs Node)
3. Attempt migration of one seed script as proof of concept
4. Make go/no-go decision for remaining scripts
5. Execute or document

**Blockers:**

- **Blocker:** Seed scripts use custom fetch client incompatible with urql
  - **Resolution:** May need to keep raw fetch but import GraphQL documents for type safety
- **Blocker:** Edge runtime limitations prevent graphql-client imports
  - **Resolution:** Document as known limitation; revisit when Edge support improves

**Risks:**

- **Risk:** Seed scripts break, blocking development workflows
  - **Mitigation:** Test seed scripts thoroughly; have rollback plan

**Verification:**

- **Level:** Single
- **Threshold:** 4.0/5.0

| Criteria                | Weight | Description                                             |
| ----------------------- | ------ | ------------------------------------------------------- | ------------------------------------- |
| Evaluation Complete     | 0.30   | All 13 operations analyzed, runtime constraints checked | 1=Incomplete, 5=Thorough analysis     |
| Migration Decision      | 0.35   | Clear go/no-go decision with justification              | 1=Unclear, 5=Well-documented decision |
| Functionality Preserved | 0.35   | Seed scripts work (migrated or original)                | 1=Broken, 5=Fully functional          |

---

#### Step 21: Final Verification and Cleanup

**Goal:** Verify zero inline queries remain and all functionality works.

**Output:** Clean codebase with full type safety.

**Success Criteria:**

- [ ] Search for `gql\`` or `` `\` `` or `graphql\`` returns zero results in apps/
- [ ] Search for `client.query(` and `client.mutation(` with string literals returns zero results
- [ ] `bun test` passes
- [ ] `tsc --noEmit` passes
- [ ] Manual smoke test of critical flows passes
- [ ] All 5 new operation files exist and are exported

**Subtasks:**

1. Run comprehensive search for inline GraphQL patterns
2. Run full test suite
3. Run type check
4. Perform manual smoke test: auth, file upload, location, notifications, challenges
5. Update any documentation referencing inline queries

**Verification:**

- **Level:** Panel
- **Threshold:** 4.5/5.0

| Criteria            | Weight | Description                                  |
| ------------------- | ------ | -------------------------------------------- | -------------------------------- |
| Zero Inline Queries | 0.30   | No inline GraphQL strings in apps/           | 1=Strings found, 5=Zero results  |
| Test Suite Pass     | 0.25   | `bun test` passes with zero failures         | 1=Failures present, 5=All green  |
| Type Check Pass     | 0.20   | `tsc --noEmit` passes                        | 1=Type errors, 5=Clean           |
| Smoke Test          | 0.15   | Manual smoke test of critical flows passes   | 1=Issues found, 5=All flows work |
| Operation Files     | 0.10   | All 5 new operation files exist and exported | 1=Missing, 5=All present         |

---

## Implementation Summary Table

| Step | Phase        | Priority | Complexity | Estimation |
| ---- | ------------ | -------- | ---------- | ---------- |
| 1    | Setup        | Critical | Low        | 30 min     |
| 2    | Foundational | High     | Medium     | 45 min     |
| 3    | Foundational | High     | Medium     | 30 min     |
| 4    | Foundational | High     | Medium     | 30 min     |
| 5    | Foundational | High     | Low        | 20 min     |
| 6    | Foundational | High     | Low        | 15 min     |
| 7    | User Stories | High     | Medium     | 30 min     |
| 8    | User Stories | High     | High       | 45 min     |
| 9    | User Stories | High     | High       | 60 min     |
| 10   | User Stories | Medium   | Medium     | 30 min     |
| 11   | User Stories | Medium   | Medium     | 30 min     |
| 12   | User Stories | Medium   | Low        | 15 min     |
| 13   | User Stories | Medium   | Low        | 15 min     |
| 14   | User Stories | Medium   | Medium     | 30 min     |
| 15   | User Stories | Medium   | Medium     | 30 min     |
| 16   | User Stories | Medium   | Low        | 15 min     |
| 17   | User Stories | Medium   | Low        | 15 min     |
| 18   | Polish       | Low      | Medium     | 30 min     |
| 19   | Polish       | Low      | Low        | 20 min     |
| 20   | Polish       | Low      | Medium     | 45 min     |
| 21   | Polish       | Critical | Low        | 30 min     |

**Total Estimated Time:** ~11 hours

## Verification Summary Table

| Step | Phase        | Criticality | Verification Type  | Threshold |
| ---- | ------------ | ----------- | ------------------ | --------- |
| 1    | Setup        | HIGH        | Panel              | 4.5/5.0   |
| 2    | Foundational | MEDIUM      | Single             | 4.0/5.0   |
| 3    | Foundational | MEDIUM      | Single             | 4.0/5.0   |
| 4    | Foundational | MEDIUM      | Per-Item (2 files) | 4.0/5.0   |
| 5    | Foundational | MEDIUM      | Per-Item (2 files) | 4.0/5.0   |
| 6    | Foundational | MEDIUM      | Single             | 4.0/5.0   |
| 7    | User Stories | MEDIUM      | Single             | 4.0/5.0   |
| 8    | User Stories | HIGH        | Panel              | 4.5/5.0   |
| 9    | User Stories | HIGH        | Panel              | 4.5/5.0   |
| 10   | User Stories | MEDIUM      | Single             | 4.0/5.0   |
| 11   | User Stories | MEDIUM      | Per-Item (2 files) | 4.0/5.0   |
| 12   | User Stories | LOW         | Single             | 4.0/5.0   |
| 13   | User Stories | MEDIUM      | Single             | 4.0/5.0   |
| 14   | User Stories | MEDIUM      | Single             | 4.0/5.0   |
| 15   | User Stories | MEDIUM      | Single             | 4.0/5.0   |
| 16   | User Stories | LOW         | Single             | 4.0/5.0   |
| 17   | User Stories | LOW         | Single             | 4.0/5.0   |
| 18   | Polish       | LOW         | Single             | 4.0/5.0   |
| 19   | Polish       | LOW         | Single             | 4.0/5.0   |
| 20   | Polish       | LOW         | Single             | 4.0/5.0   |
| 21   | Polish       | HIGH        | Panel              | 4.5/5.0   |

### Verification Level Definitions

| Level        | Description                                             | Use Case                                                    |
| ------------ | ------------------------------------------------------- | ----------------------------------------------------------- |
| **Panel**    | Multiple judges evaluate separately, consensus required | High criticality: Setup, Location, Auth, Final Verification |
| **Single**   | One judge evaluates                                     | Medium criticality: Most implementation steps               |
| **Per-Item** | Rubric applied per artifact (file, test)                | Multiple similar files being migrated                       |
| **None**     | No verification needed                                  | Trivial changes, documentation only                         |

### Verification Distribution Summary

- **Panel (HIGH):** 4 steps (1, 8, 9, 21) - Environment setup, location sharing, authentication, final verification
- **Single (MEDIUM/LOW):** 14 steps - Individual file migrations and operations creation
- **Per-Item:** 3 steps (4, 5, 11) - Multiple file migrations evaluated per artifact
- **Total Steps:** 21 with full verification coverage

## Definition of Done

The migration is considered complete when **all** of the following criteria are met:

### Functional Criteria

1. **Zero Inline Queries:** No inline GraphQL query or mutation strings exist in `apps/web/`, `apps/native/`, or `apps/seed/`
   - Verification: `grep -r "gql\`" apps/` returns no results
   - Verification: `grep -r "graphql\`" apps/` returns no results
   - Verification: Manual review of all 15+ target files confirms no template literal queries

2. **All Operations Available:** Every migrated operation is importable from `@mirai-app/graphql-client`
   - Verification: `import { useXxxQuery, useXxxMutation } from '@mirai-app/graphql-client'` works for all operations
   - Verification: All 5 new operation files exist and are exported

3. **Functionality Preserved:** All existing features work identically to pre-migration
   - Verification: Manual smoke test passes (auth, file upload, location, notifications, challenges)
   - Verification: No behavioral changes in user-facing features

### Quality Criteria

4. **Type Safety:** Full compile-time type safety achieved
   - Verification: `tsc --noEmit` passes with zero errors
   - Verification: All GraphQL operations have generated TypeScript types

5. **Test Suite Passing:** No regressions in existing tests
   - Verification: `bun test` passes (or pre-existing failures only)
   - Verification: Any test modifications are minimal and justified

6. **Schema Consistency:** Pothos schema matches all operation requirements
   - Verification: `bun run sync-schema` succeeds
   - Verification: `bun run codegen` succeeds
   - Verification: Schema includes all required query/mutation fields

### Documentation Criteria

7. **Code Quality:** No lint errors, consistent patterns
   - Verification: `bun run lint` passes (if applicable)
   - Verification: All imports use consistent patterns
   - Verification: No unused imports or variables

8. **Documentation Updated:** Any relevant docs reference the new patterns
   - Verification: READMEs or AGENTS.md updated if they mentioned inline queries
   - Verification: Code comments explain complex migration patterns if needed

### Exit Criteria Checklist

- [ ] All functional criteria met
- [ ] All quality criteria met
- [ ] All documentation criteria met
- [ ] Tech debt ticket created for any deferred items (e.g., seed scripts)
- [ ] Handoff notes documented for any partial migrations or known issues
