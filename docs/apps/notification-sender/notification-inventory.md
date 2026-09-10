# Automatic Notification Inventory

## The activity feed and push notifications are two separate systems

They share no code, no table and no delivery path:

- **Activity feed** — rows in `activities`, written by
  `packages/orpc/src/utils/activityFeed.ts`. It is a log rendered inside the
  app. Writing to it notifies nobody and never reaches a device.
- **Push / alerts** — rows in `notifications` plus one `notification_pushes`
  row per recipient, written by `sendNotification`
  (`packages/orpc/src/utils/notifications.ts`) and delivered to Expo by
  `sendMobileNotifications`
  (`packages/orpc/src/services/notificationService.ts`). The same rows back the
  in-app alerts list and the unread badge.

An event that only writes a rank-change activity — which is what every coin
adjustment did before this branch — produces no notification of any kind. Each
system has to be wired up separately.

## Inventory

"In-app" means a row in the alerts list (`notifications` + `notification_pushes`).
"Feed" means an `activities` row.

| Event | Template | Push | In-app | Feed | Implemented |
| --- | --- | --- | --- | --- | --- |
| Admin adds coins (`group.addCoins`, positive amount — the endpoint the app calls) | `createCoinsAddedNotification` | yes | yes | yes (rank change) | yes, this branch |
| Admin removes coins (`group.addCoins`, negative amount) | `createCoinsRemovedNotification` | yes | yes | yes (rank change) | yes, this branch |
| Coin change via `coin.addCoins` / `coin.removeCoins` | `createCoinsAdded/RemovedNotification` | yes | yes | yes (rank change) | yes, but the router has no callers — kept in sync with `group.addCoins` |
| Reward redeemed (`reward.purchaseReward`) | `createRewardPurchasedNotification` | yes | yes | no | yes, this branch |
| Challenge submission approved (`challengeSubmission.reviewSubmission`) | `createSubmissionReviewedNotification` | yes | yes | yes | yes, this branch |
| Challenge submission rejected | `createSubmissionReviewedNotification` | yes | yes | yes | yes, this branch |
| Member joins a group (`group.join`) | `createNewMemberNotification` | yes | yes | no | yes, this branch |
| Join request accepted (`group.respondToJoinRequest`) | `createNewMemberNotification` | yes | yes | no | yes, this branch |
| Admin assigns one user to a group (`group.assignUserToGroup`) | `createNewMemberNotification` | yes | yes | no | yes, this branch |
| Daily ranking update, 07:30 and 18:00 (`notification_schedules`, type `ranking`) | `createRankingUpdateNotification` | yes | yes | no | yes, this branch — executed by `runDueNotificationSchedules` |
| Scheduled custom notification (`notification_schedules`, any other type) | admin-authored title/body | yes | yes | no | yes, this branch |
| Moderator sends to a whole trip (`notifications.sendToAll`) | admin-authored | yes | yes | no | yes (pre-existing, now actually pushed) |
| Moderator sends to one group (`notifications.sendToGroup`, `sendCustomToGroup`) | admin-authored | yes | yes | no | yes (pre-existing, now actually pushed) |
| Manual ranking blast (`notifications.sendRankingUpdateToGroups`) | `createRankingUpdateNotification` | yes | yes | no | yes (pre-existing, now actually pushed) |
| Coin notification endpoints (`notifications.sendCoinAddedToGroup` / `sendCoinRemovedFromGroup`) | `createCoinsAdded/RemovedNotification` | yes | yes | no | yes, but no caller — `group.addCoins` notifies directly |
| Bulk assignment to a group (`group.bulkAssignUsersToGroup`) | — | no | no | no | **no** — needs an "N new members" template rather than N single-member pushes |
| Member leaves or is removed from a group (`group.leaveMyGroup`, `group.removeUserFromGroup`) | — | no | no | no | **no** — follow-up |
| Join request created (`group.requestToJoin`) → organiser | — | no | no | no | **no** — follow-up, needs a per-user (not per-group) audience |
| Join request rejected → requester | — | no | no | no | **no** — follow-up, same per-user audience gap |
| Reward purchase status changed by an admin (`reward.updateMyPurchaseStatus`) | — | no | no | no | **no** — follow-up |
| Challenge published / moved to voting | — | no | no | yes | **no** push — only the activity feed covers it |
| Inactivity reminder (`notificationSender.checkInactiveUsers`) | — | no | no | no | **no** — the handler is a hardcoded stub with no caller |
| Trip starts / ends | — | no | no | no | **no** — follow-up |

## Delivery path

1. A mutation calls `sendNotification`, which writes the `notifications` row and
   one `notification_pushes` row per recipient **in a single transaction**.
2. The same mutation calls `sendMobileNotifications` in-process.
3. Supabase Realtime delivers the `public.notifications` INSERT to
   `apps/notification-sender`, which calls `sendMobileNotifications` again over
   oRPC.

Steps 2 and 3 race by design — either one alone is a single point of failure.
`sendMobileNotifications` therefore claims its audience atomically
(`UPDATE notification_pushes SET status = 'sending' WHERE status = 'pending'
RETURNING`) before it talks to Expo; the loser of that update claims no rows and
returns without sending, so a push is delivered once.
