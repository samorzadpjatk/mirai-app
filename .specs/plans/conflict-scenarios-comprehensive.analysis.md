# Comprehensive Conflict Scenario Analysis for MIRAI Local-First

> **Scope**: All mutations across the MIRAI codebase
> **Severity**: Critical → Low
> **Status**: Analysis complete

---

## 1. User Profile Mutations

**File:** `packages/orpc/src/api/routers/user/mutations.ts`

| Mutation | Data | Constraints | Risk | Scenario |
|----------|------|-------------|------|----------|
| `updateAvatar` | `users.hasAvatar` | None | Low | Avatar updates on device A + B offline. LWW flips. |
| `updateMyProfile` | `firstName`, `lastName` | None | Low | User edits name on two devices. Last sync wins. |
| `updateName` (admin) | `firstName`, `lastName` | None | Medium | Admin renames user; user renames self. LWW loses one intent. |

---

## 2. Group Mutations

**File:** `packages/orpc/src/api/routers/group/mutations.ts`

| Mutation | Data | Constraints | Risk | Scenario |
|----------|------|-------------|------|----------|
| `create` | `groups` row + `tripParticipants.groupId` | `groups.code` `.unique()` | **Critical** | Offline group creation — two devices generate same 4-digit code → unique constraint violation on sync. |
| `update` | `name`, `description`, `image`, `organizerId` | FK to users/trips | Medium | Two admins edit same group offline. LWW loses one edit. |
| `deleteGroup` / `deleteMyGroup` | `isDeleted = true` | None | **High** | Admin deletes group on A offline. User joins group on B offline. Sync → user added to deleted group. |
| `join` | `tripParticipants.groupId` | Unique `(userId, tripId)` | **Critical** | User joins group A on A offline, group B on B offline. Sync → `onConflictDoUpdate` keeps whichever synced last, but user wanted both. |
| `leaveMyGroup` | `groupId = null` | None | **High** | User leaves on A offline. On B (online), group deleted by last member leaving. Sync → leave fails because group gone. |
| `addCoins` | `groups.coins` (incremental) | `CHECK (coins >= 0)` | **Critical** | Two admins add coins offline. Both read same base value → **lost update**. One increment silently lost. Also risks negative coins. |

---

## 3. Trip Participant Data

**File:** `packages/orpc/src/api/routers/user/mutations.ts`

| Mutation | Data | Constraints | Risk | Scenario |
|----------|------|-------------|------|----------|
| `updateWristNumber` | `tripParticipants.wristNumber` | Unique `(tripId, wristNumber)` | **Critical** | Two devices assign same wrist number to different users offline. Sync → unique constraint violation. |
| `removeWristNumber` | `wristNumber = null` | None | Medium | Remove on A offline, assign new on B offline. Sync order determines final state. |
| `updateHouseNumber` | `tripParticipants.houseNumber` | None | Low | No unique constraint. LWW. |
| `removeHouseNumber` | `houseNumber = null` | None | Low | Same as above. |

---

## 4. Join Requests

**File:** `packages/orpc/src/api/routers/group/mutations.ts`

| Mutation | Data | Constraints | Risk | Scenario |
|----------|------|-------------|------|----------|
| `requestToJoin` | `groupJoinRequests` row | Unique `(tripId, userId)` | **High** | Request to join group A on A offline, group B on B offline. Sync → second violates unique constraint. |
| `cancelMyJoinRequest` | Delete request | None | Medium | Cancel on A offline. Organizer accepts same request on B online. Sync → user in group but thought they cancelled. |
| `respondToJoinRequest` (ACCEPT) | Set `tripParticipants.groupId`, delete request | Unique `(userId, tripId)` | **Critical** | Accept on A offline. User joins different group on B offline. Sync → accept fails because user already in group. Request lost. |
| `respondToJoinRequest` (REJECT) | Delete request | None | Low | Reject on A, accept on B for same request. Last wins. |

---

## 5. Location Sharing

**File:** `packages/orpc/src/api/routers/location/mutations.ts`

| Mutation | Data | Constraints | Risk | Scenario |
|----------|------|-------------|------|----------|
| `updateLocation` | `locations` (lat/long) | `locations.userId` `.unique()` | Low | Time-series data. LWW acceptable. |
| `updateSharingSettings` | `isSharingLocation`, `locationShares` | PK `(locationId, userId)` | Medium | Add share with X on A offline. Remove share with X on B offline. Sync order determines final state. |
| `addUserToSharing` | `locationShares` row | PK `(locationId, userId)` | Medium | Same as above. If location row deleted by disable on another device, insert fails. |
| `removeUserFromSharing` | Delete `locationShares` | None | Low | Idempotent. |
| `requestLocationSharing` | `locationSharingRequests` | Unique `(senderId, receiverId)` | **High** | Two requests to same receiver on A + B offline. Sync → unique constraint violation. |
| `acceptLocationSharingRequest` | Update request, create shares | `locationShares` PK | **High** | Accept on A offline. Sender cancels on B offline. Sync → accept creates shares but request may be deleted. |
| `rejectLocationSharingRequest` | Update request to REJECTED | None | Medium | Reject on A, accept on B for same request. Last wins. |

---

## 6. Challenge Votes

**File:** `packages/orpc/src/api/routers/challengeVote/mutations.ts`

| Mutation | Data | Constraints | Risk | Scenario |
|----------|------|-------------|------|----------|
| `submitVotes` (batch) | `challengeVotes` rows | Unique `(challengeId, submissionId, voterId)` | **Critical** | User submits votes on A offline. Same user submits/changes votes on B offline. Sync → duplicate vote check OR unique constraint violation. |
| `submitVote` (single) | `challengeVotes` row | Same unique index | **Critical** | Same as above. Plus `votePosition` must be unique per voter — two offline devices submit different positions → "position taken" error. |
| `forceEndJudgedStaffVoting` | `challenges.status = "COMPLETED"` | None | Medium | Two admins force end. Idempotent if same state, but activity feed entries may duplicate. |

**Key Business Rule:** Votes cannot be changed after submission. This is **fundamentally incompatible** with naive offline-first sync.

---

## 7. Admin Operations

**File:** `packages/orpc/src/api/routers/user/mutations.ts`

| Mutation | Data | Constraints | Risk | Scenario |
|----------|------|-------------|------|----------|
| `updateUserAdminStatus` | `users.role` (ADMIN/USER) | `roleEnum` | **High** | Admin A demotes user on A offline. Admin B promotes same user on B offline. Sync → LWW loses one intent. Self-demotion protection only works online. |
| `banUserUntil` | Supabase auth `ban_duration` | External API | **High** | Multiple admins ban same user with different durations offline. Supabase state indeterminate. Cannot execute offline. |
| `deleteUser` | Delete `tripParticipants`, potentially `users` | FK constraints | **Critical** | Admin deletes user on A offline. Admin edits user profile on B offline. Sync → delete first → edit fails. Or edit first → delete fails. Transactional operations may partially sync. |

---

## 8. Other Critical Mutations

### 8.1 Challenge Submissions

| Data | Constraints | Risk | Scenario |
|------|-------------|------|----------|
| `challengeSubmissions` | Unique `(challengeId, groupId)` | **Critical** | Group submits on A offline with photo X. Same group submits on B offline with photo Y. Sync → second overwrites first via `onConflictDoUpdate` or fails with unique constraint. |

### 8.2 Activity Feed

**File:** `packages/orpc/src/api/routers/activityFeed/mutations.ts`

| Mutation | Risk | Scenario |
|----------|------|----------|
| `toggleReaction` | **Medium** | Toggle reaction on A offline. Toggle same reaction on B offline. Both read "no existing" → both insert → unique constraint violation on `(activityId, userId, reactionType)`. |
| `update` | Low | Admin edits activity on two devices. LWW. |
| `hide` / `unhide` | Medium | Hide on A, unhide on B. Last wins. |

### 8.3 Rewards & Purchases

**File:** `packages/orpc/src/api/routers/reward/mutations.ts`

| Mutation | Risk | Scenario |
|----------|------|----------|
| `purchaseReward` | **Critical** | Two organizers purchase same reward offline. Both read `availableQuantity=1` → both purchase → quantity goes negative (violates `CHECK >= 0`). |
| `updateMyPurchaseStatus` (CANCEL) | **High** | Cancel on A offline. Admin accepts on B offline. Sync → cancel refunds coins; accept may have already processed. State inconsistent. |
| `updatePurchaseStatus` (admin) | **High** | Same as above. Status transitions have strict rules (`canTransitionPurchaseStatus`) — offline sync may attempt invalid transitions. |

### 8.4 Notifications / Push

| Data | Risk | Scenario |
|------|------|----------|
| `pushSubscriptions` | Low | Same token on two devices. Unique `(userId, token)` — second fails. |

### 8.5 Trip Sponsors

| Data | Risk | Scenario |
|------|------|----------|
| `tripSponsors` | Medium | Add same sponsor on A + B offline. Unique `(tripId, sponsorId)` — second fails. |

---

## 9. Severity Summary

| Severity | Count | Examples |
|----------|-------|----------|
| **Critical** | 8 | `addCoins`, `purchaseReward`, `submitVotes`, `updateWristNumber`, `respondToJoinRequest`, `challengeSubmissions`, `deleteUser`, `banUserUntil` |
| **High** | 10 | `join`, `requestToJoin`, `leaveMyGroup`, `createGroup`, `updateUserAdminStatus`, `locationSharingRequest`, `acceptLocationSharing`, `cancelJoinRequest`, `updatePurchaseStatus`, `toggleReaction` |
| **Medium** | 12 | `updateGroup`, `deleteGroup`, `removeWristNumber`, `updateSharingSettings`, `forceEndVoting`, `hide/unhide`, `rejectLocationSharing`, `rewardTransitions`, `tripSponsors`, `activityUpdates` |
| **Low** | 6 | `updateAvatar`, `updateMyProfile`, `updateHouseNumber`, `updateLocation`, `removeUserFromSharing`, `pushSubscriptions` |

---

## 10. Root Cause Patterns

| Pattern | Affected Mutations | Solution Strategy |
|---------|-------------------|-------------------|
| **Read-Modify-Write (no versioning)** | `addCoins`, `purchaseReward` | Add version column or use `sql` increment expressions |
| **Unique constraints on generated values** | `createGroup` (code), `updateWristNumber` | Server-side allocation or UUID-based codes |
| **Immutable-after-write rules** | `submitVotes` | Allow changes until sync, or queue + reject |
| **State machine transitions** | `purchaseReward` (status) | Validate transition at sync time, not queue time |
| **Cascading transactions** | `deleteUser`, `leaveMyGroup` | Atomic sync operations, rollback on partial failure |
| **External API integration** | `banUserUntil` | Skip offline queue, execute only when online |

---

## 11. Implications for Local-First Implementation

### Cannot Be Offline (Must Execute Online)
- `banUserUntil` (Supabase auth API)
- `deleteUser` (transactional, high risk)
- `forceEndJudgedStaffVoting` (affects all groups)
- `purchaseReward` (inventory + coins — needs atomicity)
- `addCoins` (read-modify-write — needs atomicity)

### Can Be Offline with Queue
- `updateAvatar`, `updateMyProfile` (simple updates, LWW OK)
- `updateHouseNumber`, `removeHouseNumber` (no constraints)
- `updateLocation` (time-series, LWW OK)
- `requestToJoin` (can queue, may fail on sync with unique constraint)
- `submitVotes` (can queue, but must handle "already voted" error)

### Need Schema Changes for Offline
- `challengeSubmissions` (remove unique constraint for MULTI_IMAGE, add attempts table)
- `groupJoinRequests` (add status tracking for conflict resolution)
- `tripParticipants.wristNumber` (server-side allocation)
- `groups.code` (server-side allocation or UUID)

---

## References

- `packages/db/src/schema/` — All Drizzle schema files
- `packages/orpc/src/api/routers/` — All mutation handlers
- `packages/db/src/schema/groups.ts` — Unique constraints
- `packages/db/src/schema/challenges.ts` — Vote constraints
- `packages/db/src/schema/rewards.ts` — Inventory constraints
- `packages/db/src/schema/trips.ts` — Participant constraints
