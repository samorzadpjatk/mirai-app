# Wrap Multi-Op Mutations in DB Transactions

Wrap all oRPC mutations in `packages/orpc/src/api/routers/` that perform multiple DB writes without an existing `db.transaction()`, ensuring atomicity.

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

### `group/`

| Mutation | Ops outside tx | Fix |
|---|---|---|
| `create` | upsert `tripParticipant` + deleteMany `groupJoinRequest` (after group creation) | Wrap those 2 ops in `db.transaction()` |
| `join` | upsert `tripParticipant` + deleteMany `groupJoinRequest` | Wrap both in `db.transaction()` |
| `assignUserToGroup` | upsert `tripParticipant` + deleteMany `groupJoinRequest` | Wrap both in `db.transaction()` |
| `bulkAssignUsersToGroup` | `db.transaction(upserts)` then **separate** deleteMany outside | Move deleteMany inside the existing `db.transaction()` callback |

### `challenge/`

| Mutation | Ops outside tx | Fix |
|---|---|---|
| `create` | `challenge.create` + `precreateRecurringInstancesForTemplate` + `createChallengeStatusActivityById` | Wrap all 3 in `db.transaction()`; helpers already accept `tx: DB` |
| `update` | `challenge.update` + `precreateRecurringInstancesForTemplate` + `createChallengeStatusActivityFromTransition` | Wrap all 3 in `db.transaction()` |
| `forceCloseVoting` | `challenge.update` + `createChallengeStatusActivityFromTransition` | Wrap both in `db.transaction()` |

### `challengeVote/`

These mutations chain vote creation → `recomputeSubmissionVotes` → `maybeFinalizeJudgedStaffVoting` with no encompassing transaction.

`recomputeSubmissionVotes` currently accepts `ctx: { db: DB }` and internally calls `ctx.db.transaction(batchUpdates)`. To compose it inside an outer transaction it must be updated to accept `DB | TransactionDB`.

Same for `maybeFinalizeJudgedStaffVoting` (calls `ctx.db.update(challenge).set(...)` + `createChallengeCompletionWithWinnersById`).

| Mutation | Fix |
|---|---|
| `submitVote` | Wrap createVote + recompute + maybe-finalize in `db.transaction()` |
| `submitVotes` | Wrap createMany + recompute + maybe-finalize in `db.transaction()` |
| `forceEndJudgedStaffVoting` | Wrap recompute + updateMany + createCompletion in `db.transaction()` |

**Helper refactors required:**
- `recomputeSubmissionVotes(ctx, challengeId)` → accept `db: DB | TransactionDB`
- `maybeFinalizeJudgedStaffVoting(ctx, params)` → accept `db: DB | TransactionDB`
- `getJudgedStaffVotingProgress` / `getTripAdminParticipantIds` → already use `ctx.db`; propagate the `tx`

### `challengeSubmission/`

| Mutation | Ops outside tx | Fix |
|---|---|---|
| `updateMine` | Multiple sequential challenge status `updateMany` / `update` + submission `update` | Wrap all ops in a single `db.transaction()` |

### `location/`

| Mutation | Ops outside tx | Fix |
|---|---|---|
| `acceptLocationSharingRequest` | `locationSharingRequest.update` + 2× `location.upsert` | Wrap all 3 in `db.transaction()` |

### `user/`

| Mutation | Ops outside tx | Fix |
|---|---|---|
| `createUser` | `user.findUnique`/`user.create` + `tripParticipant.upsert` | Wrap the DB portion (after Supabase auth call) in `db.transaction()` |

---

## Implementation Order

1. `group/` — `create`, `join`, `assignUserToGroup`, `bulkAssignUsersToGroup`
2. `challenge/` — `create`, `update`, `forceCloseVoting`
3. `challengeVote/` — refactor helpers → wrap `submitVote`, `submitVotes`, `forceEndJudgedStaffVoting`
4. `challengeSubmission/` — `updateMine`
5. `location/` — `acceptLocationSharingRequest`
6. `user/` — `createUser`
