# Wrap Multi-Op Mutations in DB Transactions

Wrap all oRPC mutations in `packages/trpc/src/api/routers/` that perform multiple DB writes without an existing `$transaction`, ensuring atomicity.

---

## Current State

Already correctly wrapped (no action needed):
- `group.{delete,deleteMyGroup,respondToJoinRequest,removeUserFromGroup,leaveMyGroup,addCoins}`
- `challengeSubmission.{create (auto-approve path),review}`
- `reward.{purchase,updateMyPurchaseStatus,updatePurchaseStatus}`
- `user.deleteUser`
- `coin.{addCoins,removeCoins}`

---

## Mutations to Fix

### `group.ts`

| Mutation | Ops outside tx | Fix |
|---|---|---|
| `create` | upsert `tripParticipant` + deleteMany `groupJoinRequest` (after group creation) | Wrap those 2 ops in `$transaction` |
| `join` | upsert `tripParticipant` + deleteMany `groupJoinRequest` | Wrap both in `$transaction` |
| `assignUserToGroup` | upsert `tripParticipant` + deleteMany `groupJoinRequest` | Wrap both in `$transaction` |
| `bulkAssignUsersToGroup` | `$transaction(upserts)` then **separate** deleteMany outside | Move deleteMany inside the existing `$transaction` callback |

### `challenge.ts`

| Mutation | Ops outside tx | Fix |
|---|---|---|
| `create` | `challenge.create` + `precreateRecurringInstancesForTemplate` + `createChallengeStatusActivityById` | Wrap all 3 in `$transaction`; helpers already accept `tx: TransactionClient` |
| `update` | `challenge.update` + `precreateRecurringInstancesForTemplate` + `createChallengeStatusActivityFromTransition` | Wrap all 3 in `$transaction` |
| `forceCloseVoting` | `challenge.update` + `createChallengeStatusActivityFromTransition` | Wrap both in `$transaction` |

### `challengeVote.ts`

These mutations chain vote creation → `recomputeSubmissionVotes` → `maybeFinalizeJudgedStaffVoting` with no encompassing transaction.

`recomputeSubmissionVotes` currently accepts `ctx: { db: PrismaClient }` and internally calls `ctx.db.$transaction(batchUpdates)`. To compose it inside an outer transaction it must be updated to accept `Prisma.TransactionClient`.

Same for `maybeFinalizeJudgedStaffVoting` (calls `ctx.db.challenge.updateMany` + `createChallengeCompletionWithWinnersById`).

| Mutation | Fix |
|---|---|
| `submitVote` | Wrap createVote + recompute + maybe-finalize in `$transaction` |
| `submitVotes` | Wrap createMany + recompute + maybe-finalize in `$transaction` |
| `forceEndJudgedStaffVoting` | Wrap recompute + updateMany + createCompletion in `$transaction` |

**Helper refactors required:**
- `recomputeSubmissionVotes(ctx, challengeId)` → accept `db: PrismaClient | Prisma.TransactionClient`
- `maybeFinalizeJudgedStaffVoting(ctx, params)` → accept `db: PrismaClient | Prisma.TransactionClient`
- `getJudgedStaffVotingProgress` / `getTripAdminParticipantIds` → already use `ctx.db`; propagate the `tx`

### `challengeSubmission.ts`

| Mutation | Ops outside tx | Fix |
|---|---|---|
| `updateMine` | Multiple sequential challenge status `updateMany` / `update` + submission `update` | Wrap all ops in a single `$transaction` |

### `location.ts`

| Mutation | Ops outside tx | Fix |
|---|---|---|
| `acceptLocationSharingRequest` | `locationSharingRequest.update` + 2× `location.upsert` | Wrap all 3 in `$transaction` |

### `user.ts`

| Mutation | Ops outside tx | Fix |
|---|---|---|
| `createUser` | `user.findUnique`/`user.create` + `tripParticipant.upsert` | Wrap the DB portion (after Supabase auth call) in `$transaction` |

---

## Implementation Order

1. `group.ts` — `create`, `join`, `assignUserToGroup`, `bulkAssignUsersToGroup`
2. `challenge.ts` — `create`, `update`, `forceCloseVoting`
3. `challengeVote.ts` — refactor helpers → wrap `submitVote`, `submitVotes`, `forceEndJudgedStaffVoting`
4. `challengeSubmission.ts` — `updateMine`
5. `location.ts` — `acceptLocationSharingRequest`
6. `user.ts` — `createUser`
