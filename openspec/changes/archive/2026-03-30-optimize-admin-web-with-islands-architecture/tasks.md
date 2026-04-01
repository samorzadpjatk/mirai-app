## 1. Setup Shared Admin Hooks Package

- [x] 1.1 Create `packages/admin-hooks/` directory structure
- [x] 1.2 Create `packages/admin-hooks/package.json` with name `@mirai-app/admin-hooks`
- [x] 1.3 Add peer dependencies: `react`, `@tanstack/react-query`, `@mirai-app/trpc`
- [x] 1.4 Create `packages/admin-hooks/tsconfig.json` extending base config
- [x] 1.5 Create `packages/admin-hooks/src/index.ts` as main export file
- [x] 1.6 Add `@mirai-app/admin-hooks` to root workspace in `package.json`

## 2. Migrate Hooks to Shared Package

- [x] 2.1 Copy `useAdminUsers.ts` from admin-web to `packages/admin-hooks/src/`
- [x] 2.2 Copy `useAdminGroups.ts` from admin-web to `packages/admin-hooks/src/`
- [x] 2.3 Copy `useAdminChallenges.ts` from admin-web to `packages/admin-hooks/src/`
- [x] 2.4 Copy `useAdminRewards.ts` from admin-web to `packages/admin-hooks/src/`
- [x] 2.5 Copy `useAdminActivity.ts` from admin-web to `packages/admin-hooks/src/`
- [x] 2.6 Copy `useAdminNotifications.ts` from admin-web to `packages/admin-hooks/src/`
- [x] 2.7 Copy `useAdminTransactions.ts` from admin-web to `packages/admin-hooks/src/`
- [x] 2.8 Copy `useAdminCoins.ts` from admin-web to `packages/admin-hooks/src/`
- [x] 2.9 Copy `useAdminSchedules.ts` from admin-web to `packages/admin-hooks/src/`
- [x] 2.10 Copy `useAdminTrips.ts` from admin-web to `packages/admin-hooks/src/`

## 3. Update Hooks to Use Shared tRPC Client

- [x] 3.1 Update all hooks to use `useTRPCClient()`/`useTRPC()` from `@mirai-app/trpc/client` as appropriate
- [x] 3.2 Replace manual `createTRPCClient()` calls with `const trpc = useTRPC()`
- [x] 3.3 Update hooks to use `useTRPCClient()` for vanilla client access where needed
- [x] 3.4 Remove all `createTRPCClient` imports from hooks
- [x] 3.5 Export all TypeScript types from hooks (User, Group, Challenge, etc.)
- [x] 3.6 Export all hooks from `packages/admin-hooks/src/index.ts`

## 4. Update Admin-Web to Use Shared Hooks Package

- [x] 4.1 Add `@mirai-app/admin-hooks` as dependency in `apps/admin-web/package.json`
- [x] 4.2 Update imports in UsersPage to use `@mirai-app/admin-hooks`
- [x] 4.3 Update imports in GroupsPage to use `@mirai-app/admin-hooks`
- [x] 4.4 Update imports in ChallengesPage to use `@mirai-app/admin-hooks`
- [x] 4.5 Update imports in RewardsPage to use `@mirai-app/admin-hooks`
- [x] 4.6 Update imports in ActivityPage to use `@mirai-app/admin-hooks`
- [x] 4.7 Update imports in NotificationsPage to use `@mirai-app/admin-hooks`
- [x] 4.8 Update imports in TransactionsPage to use `@mirai-app/admin-hooks`
- [x] 4.9 Update imports in CoinsPage to use `@mirai-app/admin-hooks`
- [x] 4.10 Update imports in SchedulesPage to use `@mirai-app/admin-hooks`
- [x] 4.11 Update imports in Dashboard to use `@mirai-app/admin-hooks`
- [x] 4.12 Update imports in TripContext to use `@mirai-app/admin-hooks`
- [x] 4.13 Delete old hook files from `apps/admin-web/src/hooks/admin/`

## 5. Update Native App to Use Shared Hooks Package

- [x] 5.1 Add `@mirai-app/admin-hooks` as dependency in `apps/native/package.json`
- [x] 5.2 Update all native admin component imports to use `@mirai-app/admin-hooks`
- [x] 5.3 Test native app builds successfully with shared hooks
- [x] 5.4 Delete old hook files from `apps/native/src/hooks/admin/`

## 6. Unify tRPC Client in Admin-Web

- [x] 6.1 Update `apps/admin-web/src/components/TRPCProvider.tsx` to import APIProvider from `@mirai-app/trpc/client`
- [x] 6.2 Replace custom QueryClientProvider setup with APIProvider
- [x] 6.3 Pass required runtime URLs to APIProvider (`httpUrl`, `wsUrl`) and keep auth sourced from AuthProvider session
- [x] 6.4 Test that tRPC queries still work with APIProvider
- [x] 6.5 Delete old `createTRPCClient` logic from `apps/admin-web/src/lib/trpc.ts`
- [x] 6.6 Rename TRPCProvider to use APIProvider or delete if fully replaced

## 7. Create GlobalProviders Island Component

- [x] 7.1 Create `apps/admin-web/src/components/providers/` directory
- [x] 7.2 Create `GlobalProviders.tsx` component in providers directory
- [x] 7.3 Wrap GlobalProviders with AuthProvider (outermost)
- [x] 7.4 Nest APIProvider inside AuthProvider
- [x] 7.5 Nest TripProvider inside APIProvider
- [x] 7.6 Include Header component inside providers
- [x] 7.7 Include MobileNav component inside providers
- [x] 7.8 Include TripSelector component inside providers
- [x] 7.9 Render children prop for page content
- [x] 7.10 Export GlobalProviders as default

## 8. Update AdminLayout to Use GlobalProviders Island

- [x] 8.1 Update `apps/admin-web/src/layouts/AdminLayout.astro`
- [x] 8.2 Import GlobalProviders component
- [x] 8.3 Replace AdminApp with `<GlobalProviders client:load transition:persist>`
- [x] 8.4 Pass slot content to GlobalProviders for page content
- [x] 8.5 Remove AdminApp import and usage
- [ ] 8.6 Test that layout renders with GlobalProviders

## 9. Add View Transitions to Base Layout

- [x] 9.1 Update `apps/admin-web/src/layouts/Layout.astro`
- [x] 9.2 Import ClientRouter from `astro:transitions`
- [x] 9.3 Add `<ClientRouter />` component in `<head>` section
- [ ] 9.4 Test navigation transitions between pages

## 10. Migrate Dashboard Page to Island

- [x] 10.1 Create `apps/admin-web/src/components/admin/dashboard/DashboardContent.tsx`
- [x] 10.2 Move Dashboard logic from AdminApp to DashboardContent
- [x] 10.3 Update `apps/admin-web/src/pages/index.astro` to use AdminLayout
- [x] 10.4 Add `<DashboardContent client:load />` to index.astro
- [ ] 10.5 Test dashboard page loads and functions correctly
- [x] 10.6 Remove dashboard route from AdminApp.tsx

## 11. Migrate Users Pages to Islands

- [x] 11.1 Create `apps/admin-web/src/components/admin/users/UsersPageContent.tsx`
- [x] 11.2 Move UsersPage logic to UsersPageContent component
- [x] 11.3 Update `apps/admin-web/src/pages/users/index.astro` to render UsersPageContent island
- [x] 11.4 Create `apps/admin-web/src/pages/users/new.astro` for create user form
- [x] 11.5 Create CreateUserContent island component
- [x] 11.6 Create `apps/admin-web/src/pages/users/[userId]/edit.astro` for edit user form
- [x] 11.7 Create EditUserContent island component
- [x] 11.8 Pass userId from Astro.params to EditUserContent
- [ ] 11.9 Test users list, create, and edit pages
- [x] 11.10 Remove users routes from AdminApp.tsx

## 12. Migrate Groups Pages to Islands

- [x] 12.1 Create `apps/admin-web/src/components/admin/groups/GroupsPageContent.tsx`
- [x] 12.2 Move GroupsPage logic to GroupsPageContent component
- [x] 12.3 Update `apps/admin-web/src/pages/groups/index.astro` to render GroupsPageContent island
- [x] 12.4 Create `apps/admin-web/src/pages/groups/new.astro` for create group form
- [x] 12.5 Create CreateGroupContent island component
- [x] 12.6 Create `apps/admin-web/src/pages/groups/[groupId]/edit.astro` for edit group form
- [x] 12.7 Create EditGroupContent island component
- [x] 12.8 Pass groupId from Astro.params to EditGroupContent
- [ ] 12.9 Test groups list, create, and edit pages
- [x] 12.10 Remove groups routes from AdminApp.tsx

## 13. Migrate Activity Pages to Islands

- [x] 13.1 Create `apps/admin-web/src/components/admin/activity/ActivityPageContent.tsx`
- [x] 13.2 Move ActivityPage logic to ActivityPageContent component
- [x] 13.3 Update `apps/admin-web/src/pages/activity/index.astro` to render ActivityPageContent island
- [x] 13.4 Ensure `apps/admin-web/src/pages/activity/new.astro` uses ActivityForm island
- [x] 13.5 Ensure `apps/admin-web/src/pages/activity/edit/[activityId].astro` uses ActivityForm island
- [x] 13.6 Pass activityId from Astro.params to ActivityForm
- [ ] 13.7 Test activity list, create, and edit pages
- [x] 13.8 Remove activity routes from AdminApp.tsx

## 14. Migrate Rewards Pages to Islands

- [x] 14.1 Create `apps/admin-web/src/components/admin/rewards/RewardsPageContent.tsx`
- [x] 14.2 Move RewardsPage logic to RewardsPageContent component
- [x] 14.3 Update `apps/admin-web/src/pages/rewards/index.astro` to render RewardsPageContent island
- [x] 14.4 Create `apps/admin-web/src/pages/rewards/new.astro` for create reward form
- [x] 14.5 Create CreateRewardContent island component
- [x] 14.6 Create `apps/admin-web/src/pages/rewards/[rewardId]/edit.astro` for edit reward form
- [x] 14.7 Create EditRewardContent island component
- [x] 14.8 Pass rewardId from Astro.params to EditRewardContent
- [ ] 14.9 Test rewards list, create, and edit pages
- [x] 14.10 Remove rewards routes from AdminApp.tsx

## 15. Migrate Challenges Pages to Islands

- [x] 15.1 Create `apps/admin-web/src/components/admin/challenges/ChallengesPageContent.tsx`
- [x] 15.2 Move ChallengesPage logic to ChallengesPageContent component
- [x] 15.3 Update `apps/admin-web/src/pages/challenges/index.astro` to render ChallengesPageContent island
- [x] 15.4 Create `apps/admin-web/src/pages/challenges/new.astro` for create challenge
- [x] 15.5 Create CreateChallengeContent island component
- [x] 15.6 Ensure `apps/admin-web/src/pages/challenges/edit/[id].astro` uses ChallengeForm island
- [x] 15.7 Ensure `apps/admin-web/src/pages/challenges/[id].astro` renders ChallengeDetailsPage island
- [x] 15.8 Ensure `apps/admin-web/src/pages/challenges/[id]/submissions.astro` renders ChallengeSubmissionsPage island
- [x] 15.9 Ensure `apps/admin-web/src/pages/challenges/[id]/voting.astro` renders StaffVotingPage island
- [x] 15.10 Ensure `apps/admin-web/src/pages/challenges/[id]/judging.astro` renders JudgingPage island
- [x] 15.11 Pass challengeId from Astro.params to all challenge sub-pages
- [ ] 15.12 Test all challenges pages and sub-routes
- [x] 15.13 Remove challenges routes from AdminApp.tsx

## 16. Migrate Notifications Pages to Islands

- [x] 16.1 Create `apps/admin-web/src/components/admin/notifications/NotificationsPageContent.tsx`
- [x] 16.2 Move NotificationsPage logic to NotificationsPageContent component
- [x] 16.3 Update `apps/admin-web/src/pages/notifications/index.astro` to render NotificationsPageContent island
- [x] 16.4 Create `apps/admin-web/src/pages/notifications/new.astro` for create notification
- [x] 16.5 Create CreateNotificationContent island component
- [ ] 16.6 Test notifications list and create pages
- [x] 16.7 Remove notifications routes from AdminApp.tsx

## 17. Migrate Transactions Page to Island

- [x] 17.1 Create `apps/admin-web/src/components/admin/transactions/TransactionsPageContent.tsx`
- [x] 17.2 Move TransactionsPage logic to TransactionsPageContent component
- [x] 17.3 Update `apps/admin-web/src/pages/transactions/index.astro` to render TransactionsPageContent island
- [ ] 17.4 Test transactions page loads and functions correctly
- [x] 17.5 Remove transactions route from AdminApp.tsx

## 18. Migrate Coins Pages to Islands

- [x] 18.1 Create `apps/admin-web/src/components/admin/coins/CoinsPageContent.tsx`
- [x] 18.2 Move CoinsOverviewPage logic to CoinsPageContent component
- [x] 18.3 Update `apps/admin-web/src/pages/coins/index.astro` to render CoinsPageContent island
- [x] 18.4 Create `apps/admin-web/src/pages/coins/operation.astro` for coin operations
- [x] 18.5 Create CoinOperationContent island component
- [ ] 18.6 Test coins overview and operation pages
- [x] 18.7 Remove coins routes from AdminApp.tsx

## 19. Migrate Schedules Page to Island

- [x] 19.1 Create `apps/admin-web/src/components/admin/schedules/SchedulesPageContent.tsx`
- [x] 19.2 Move SchedulesPage logic to SchedulesPageContent component
- [x] 19.3 Update `apps/admin-web/src/pages/schedules/index.astro` to render SchedulesPageContent island
- [ ] 19.4 Test schedules page loads and functions correctly
- [x] 19.5 Remove schedules route from AdminApp.tsx

## 20. Cleanup Old Architecture

- [x] 20.1 Verify all routes are removed from AdminApp.tsx
- [x] 20.2 Delete `apps/admin-web/src/components/AdminApp.tsx`
- [x] 20.3 Delete `apps/admin-web/src/components/TRPCProvider.tsx` if not already removed
- [x] 20.4 Remove AdminApp imports from any remaining files
- [x] 20.5 Remove manual routing logic and path matching code
- [ ] 20.6 Clean up unused imports across codebase

## 21. Testing and Verification

- [x] 21.1 Run `bun run build` in admin-web and verify it succeeds
- [x] 21.2 Check bundle sizes in `dist/client/_astro/` - target ≤200KB per page
- [ ] 21.3 Test all admin pages load correctly (dashboard, users, groups, challenges, rewards, activity, notifications, transactions, coins, schedules)
- [ ] 21.4 Test create/edit forms submit successfully on all pages
- [ ] 21.5 Test navigation between pages uses view transitions smoothly
- [ ] 21.6 Test auth state persists across navigation
- [ ] 21.7 Test trip selection persists across navigation
- [ ] 21.8 Test browser back/forward buttons work correctly
- [ ] 21.9 Run admin-web in dev mode and verify hot reload works
- [x] 21.10 Test native app still functions correctly with shared hooks
- [x] 21.11 Verify TypeScript types resolve correctly in both apps
- [ ] 21.12 Test on slow network (throttle to 3G) to verify improvement

## 22. Documentation and Finalization

- [x] 22.1 Update README in admin-web with new architecture notes
- [x] 22.2 Document shared hooks package usage in packages/admin-hooks/README.md
- [x] 22.3 Add JSDoc comments to GlobalProviders explaining its purpose
- [x] 22.4 Add comments to AdminLayout explaining island hydration strategy
- [ ] 22.5 Archive change in OpenSpec when complete
