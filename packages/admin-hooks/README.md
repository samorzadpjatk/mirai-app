# @mirai-app/admin-hooks

Shared admin data hooks used by both `apps/admin-web` and `apps/native`.

## What This Package Provides

- Admin domain hooks:
  - `useAdminUsers`
  - `useAdminGroups`
  - `useAdminChallenges`
  - `useAdminRewards`
  - `useAdminActivity`
  - `useAdminNotifications`
  - `useAdminTransactions`
  - `useAdminCoins`
  - `useAdminSchedules`
  - `useAdminTrips`
- Shared TypeScript types exported from each hook module.

## Usage

Wrap your app with `APIProvider` from `@mirai-app/trpc/client`, then consume hooks:

```ts
import { useAdminUsers } from "@mirai-app/admin-hooks";

function UsersFeature({ tripId }: { tripId: string }) {
  const { users, usersLoading } = useAdminUsers(tripId, "", "firstName");
  return usersLoading ? null : users.map((u) => u.id);
}
```

## Notes

- Hooks use tRPC client context via `useTRPCClient()` / `useTRPC()` from `@mirai-app/trpc/client`.
- Keep this package focused on shared data logic; platform-specific UI remains in app packages.
