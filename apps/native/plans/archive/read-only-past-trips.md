# Read-Only Past Trip View

Enforce that trip participants cannot perform any mutations after a trip's `endDate + 24 h` grace period has passed, while preserving full read access to all trip data (groups, challenges, rewards, leaderboard). Location features are fully disabled for past trips. Admins retain full mutation access. The existing "Past Trip" chip on `TripHeroCard` serves as the visual indicator — no extra banner needed.

---

## Layer 1: Backend — tRPC guard

### 1a. Shared helper `ensureTripNotEnded`

Create a reusable async helper in `packages/trpc/src/utils/tripGuards.ts`:

```ts
async function ensureTripNotEnded(db, tripId: string): Promise<void>
```

- Fetches trip by `id`, checks `endDate < now()`.
- Throws `TRPCError({ code: "FORBIDDEN", message: "Trip has ended" })` if past.

### 1b. Add guard to all participant-facing mutations

Insert `await ensureTripNotEnded(ctx.db, tripId)` at the top of each protected mutation that operates within a trip scope. Affected routers and endpoints:

| Router | Mutations to guard |
|---|---|
| `group` | `create`, `update`, `deleteMyGroup`, `requestToJoin`, `cancelMyJoinRequest`, `respondToJoinRequest`, `assignUserToGroup`, `bulkAssignUsersToGroup`, `removeUserFromGroup`, `leaveMyGroup` |
| `challengeSubmission` | `create`, `updateMine`, `deleteMine` |
| `challengeVote` | `submitVotes`, `submitVote` |
| `reward` | `purchase` |
| `location` | `updateLocation`, `updateSharingSettings`, `addUserToSharing`, `removeUserFromSharing`, `requestLocationSharing`, `acceptLocationSharingRequest`, `rejectLocationSharingRequest` |
| `submissionReport` | `create` |

> Admin-only mutations (`trip.create`, `trip.update`, `trip.delete`, challenge CRUD, reward CRUD, etc.) are **not** guarded — admins retain full access.

### 1c. Resolve `tripId` where not directly available

Some mutations (e.g. `group.update`, `group.leaveMyGroup`) receive `groupId` not `tripId`. The guard will look up the group's `tripId` first.

---

## Layer 2: Frontend — conditional UI

### 2a. `isTripPast` utility

Add a shared helper `isTripPast(endDate)` in `apps/native/src/utils/trip.ts` (reuse the same logic already in `TripCard.tsx` `getTripStatus`).

### 2b. Expose `isTripPast` from `useTripDetails`

Return `isTripPast` from the `useTripDetails` hook so all screens consuming it can react.

### 2c. Hide/disable mutation UI on each screen

| Screen | What to hide/disable |
|---|---|
| **Trip details** (`details.tsx`) | Optionally show a "Trip ended" banner; hide Map tile if location features are disabled |
| **Groups list** (`groups/index.tsx`) | Hide "Create Group" button |
| **Group detail** (`groups/[id].tsx`) | Hide "Join Group", "Leave Group", "Cancel request" buttons; hide pending join request actions; hide "Edit" FAB |
| **Group create** (`groups/create.tsx`) | Redirect back or show disabled state |
| **Group edit** (`groups/edit/[id].tsx`) | Redirect back or show disabled state |
| **Challenge detail** (`challenges/[id].tsx`) | Hide submission action button; hide withdraw button |
| **Challenge vote** (`challenges/vote/[id].tsx`) | Redirect back or show "Voting closed" |
| **Rewards** (`RewardsView.tsx`) | Hide/disable "Claim reward" buttons |
| **Map** (`map/index.tsx`) | Disable location sending; optionally show last-known positions as static |

### 2d. Visual indicator

Add a small banner/chip (e.g. "This trip has ended — view only") at the top of trip detail and sub-screens when `isTripPast` is true.

---

## Layer 3: Trip list polish

In `TripCard.tsx`, the "Past" badge already renders. Optionally dim or de-emphasize past trip cards for visual clarity.

---

## Implementation order

1. `ensureTripNotEnded` helper + unit test
2. Add guard to group mutations (largest surface area)
3. Add guard to challengeSubmission + challengeVote mutations
4. Add guard to reward + location + submissionReport mutations
5. `isTripPast` utility + hook integration
6. Frontend UI changes per screen (groups → challenges → rewards → map)
7. "Trip ended" banner component
8. Manual QA pass

---

## Files touched (estimated)

- **New**: `packages/trpc/src/utils/tripGuards.ts`, `apps/native/src/utils/trip.ts`
- **Backend**: `packages/trpc/src/api/routers/{group,challengeSubmission,challengeVote,reward,location,submissionReport}.ts`
- **Frontend**: `apps/native/src/hooks/trips/useTripDetails.ts`, `apps/native/src/app/(tabs)/trips/{details,groups/index,groups/[id],groups/create,groups/edit/[id],challenges/[id],challenges/vote/[id],rewards/index,map/index}.tsx`, `apps/native/src/components/rewards/RewardsView.tsx`
