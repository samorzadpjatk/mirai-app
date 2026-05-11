## 1. Dependencies and Core Server Package

- [x] 1.1 Remove tRPC dependencies from `packages/trpc/package.json` and add oRPC dependencies (`@orpc/server`, `@orpc/client`, `@orpc/tanstack-query`)
- [x] 1.2 Remove tRPC dependencies from root `package.json` (`@trpc/client`, `@valkyrie-resistance/trpc-ws-hono-bun-adapter`)
- [x] 1.3 Rewrite `packages/trpc/src/api/trpc.ts`: replace `initTRPC` with oRPC `os` builder, rewrite `createTRPCContext` → `createORPCContext`, rewrite middleware chain (telemetry + auth), rewrite procedures (`publicProcedure`, `protectedProcedure`, `moderatorProcedure`, `adminProcedure`, `mobileAppProcedure`)
- [x] 1.4 Rewrite `packages/trpc/src/api/root.ts`: replace `createTRPCRouter({...})` with plain object router, update `createCaller` using oRPC `createRouterClient`
- [x] 1.5 Update `packages/trpc/src/index.ts` exports (server-side)
- [x] 1.6 Run `bun install` and verify lockfile integrity
- [x] 1.7 Run `packages/trpc` typecheck — must pass with zero errors

## 2. Router Migration (18 files)

- [x] 2.1 Migrate `packages/trpc/src/api/routers/user.ts`: `.query()` → `.handler()`, `.mutation()` → `.handler()`, `ctx` → `context`, `TRPCError` → `ORPCError`, `createTRPCRouter({...})` → `{...}`
- [x] 2.2 Migrate `packages/trpc/src/api/routers/group.ts`
- [x] 2.3 Migrate `packages/trpc/src/api/routers/coin.ts`
- [x] 2.4 Migrate `packages/trpc/src/api/routers/coinTransaction.ts`
- [x] 2.5 Migrate `packages/trpc/src/api/routers/notifications.ts`
- [x] 2.6 Migrate `packages/trpc/src/api/routers/notificationSchedule.ts`
- [x] 2.7 Migrate `packages/trpc/src/api/routers/notificationDelivery.ts`
- [x] 2.8 Migrate `packages/trpc/src/api/routers/notificationSender.ts`
- [x] 2.9 Migrate `packages/trpc/src/api/routers/location.ts`
- [x] 2.10 Migrate `packages/trpc/src/api/routers/trip.ts`
- [x] 2.11 Migrate `packages/trpc/src/api/routers/challenge.ts`
- [x] 2.12 Migrate `packages/trpc/src/api/routers/challengeSubmission.ts`
- [x] 2.13 Migrate `packages/trpc/src/api/routers/challengeVote.ts`
- [x] 2.14 Migrate `packages/trpc/src/api/routers/submissionReport.ts`
- [x] 2.15 Migrate `packages/trpc/src/api/routers/storage.ts`
- [x] 2.16 Migrate `packages/trpc/src/api/routers/reward.ts`
- [x] 2.17 Migrate `packages/trpc/src/api/routers/activityFeed.ts`
- [x] 2.18 Migrate `packages/trpc/src/api/routers/sponsor.ts`
- [x] 2.19 Run `packages/trpc` typecheck after all router migrations

## 3. Client Layer Rewrite

- [x] 3.1 Rewrite `packages/trpc/src/client/vanilia.ts`: replace `createTRPCClient` + `createWSClient` with oRPC `createORPCClient` and `RPCLink` (HTTP from `@orpc/client`, WS from `@orpc/client/websocket`), preserve retry logic and auth token injection
- [x] 3.2 Rewrite `packages/trpc/src/client/react.ts`: remove `TRPCContext`, `useTRPC`, `useTRPCClient`, `useSubscription`; export nothing or minimal re-exports if needed
- [x] 3.3 Rewrite `packages/trpc/src/client/query-client.tsx`: remove `APIProvider`, create a simple `QueryClientProvider` wrapper or export `QueryClient` setup utilities; remove all tRPC-specific provider logic
- [x] 3.4 Update `packages/trpc/src/client/index.ts`: replace exports with oRPC client exports
- [x] 3.5 Update `packages/trpc/src/client/query/index.ts`: ensure query invalidation utilities reference oRPC query keys
- [x] 3.6 Update `packages/trpc/src/client/invalidationUtils.ts` if it references tRPC-specific key patterns
- [x] 3.7 Run `packages/trpc` typecheck and tests for client layer

## 4. Backend Server Integration

- [x] 4.1 Remove tRPC dependencies from `apps/backend-server/package.json` and add `@orpc/server`
- [x] 4.2 Rewrite `apps/backend-server/src/server.ts`: replace `@hono/trpc-server` with oRPC Hono `createMiddleware` from `@orpc/server/hono`, replace custom WS adapter with oRPC Bun WS `RPCHandler`, preserve context creation logic, preserve health check endpoint
- [x] 4.3 Delete `apps/backend-server/src/ws-adapter.ts` (no longer needed; import from `@orpc/server/bun-ws` directly in server.ts)
- [x] 4.4 Run `apps/backend-server` typecheck
- [x] 4.5 Run backend server tests

## 5. Notification Sender

- [x] 5.1 Remove `@trpc/client` from `apps/notification-sender/package.json`, add `@orpc/client`
- [x] 5.2 Update notification sender source files that use tRPC client to use oRPC `createORPCClient`
- [x] 5.3 Run `apps/notification-sender` typecheck and tests

## 6. Native App Migration

- [x] 6.1 Update `apps/native/src/app/_layout.tsx`: remove `APIProvider` from `@mirai-app/orpc/client`, use `QueryClientProvider` from `@tanstack/react-query` directly, initialize oRPC client at module level
- [x] 6.2 Create or update `apps/native/src/hooks/useORPC.ts` (or similar) to export `orpc` utils for direct import
- [x] 6.3 Migrate all admin hooks in `apps/native/src/hooks/admin/` from `useTRPC()` + `trpc.x.y.useQuery()` to `useQuery(orpc.x.y.queryOptions({ input: ... }))`
- [x] 6.4 Migrate all challenge hooks in `apps/native/src/hooks/challenges/`
- [x] 6.5 Migrate all community hooks in `apps/native/src/hooks/community/`
- [x] 6.6 Migrate all file hooks in `apps/native/src/hooks/files/`
- [x] 6.7 Migrate all group hooks in `apps/native/src/hooks/groups/`
- [x] 6.8 Migrate all location hooks in `apps/native/src/hooks/location/`
- [x] 6.9 Migrate all map hooks in `apps/native/src/hooks/map/`
- [x] 6.10 Migrate all notification hooks in `apps/native/src/hooks/notifications/`
- [x] 6.11 Migrate all reward hooks in `apps/native/src/hooks/rewards/`
- [x] 6.12 Migrate all sponsor hooks in `apps/native/src/hooks/sponsors/`
- [x] 6.13 Migrate all trip hooks in `apps/native/src/hooks/trips/`
- [x] 6.14 Migrate store files in `apps/native/src/stores/` that use tRPC (e.g., `LocationStoreProvider`, `useJudgement`)
- [x] 6.15 Migrate components that directly call tRPC (e.g., `NotificationScheduleCard`, `CreateScheduleModal`, `GroupMemberList`, `TripNewsSection`, `AccountInfoSection`, `ProfileHeader`, `SubmissionImageCard`, `SelectedUserCard`)
- [x] 6.16 Migrate all screen files in `apps/native/src/app/(tabs)/` and `apps/native/src/app/` that use tRPC
- [x] 6.17 Update all native app tests to use oRPC mocks instead of tRPC mocks

## 7. Tests and Mocks

- [x] 7.1 Rewrite `packages/trpc/src/__mocks__/client.ts` to use oRPC `createRouterClient`
- [x] 7.2 Rewrite `packages/trpc/src/__tests__/router.test.ts`
- [x] 7.3 Update all router test files (`packages/trpc/src/api/routers/__tests__/*.test.ts`) to use oRPC mock client and error types
- [x] 7.4 Update client tests (`packages/trpc/src/client/__tests__/*.test.ts`) for oRPC client
- [x] 7.5 Update utility tests that reference tRPC types
- [x] 7.6 Run full `packages/trpc` test suite — all tests must pass

## 8. Documentation

- [x] 8.1 Update `packages/trpc/AGENTS.md`: replace all tRPC references with oRPC, update file structure, update tech stack, update key files section
- [x] 8.2 Update `packages/trpc/README.md`: replace server/client usage examples with oRPC examples
- [x] 8.3 Update `apps/backend-server/AGENTS.md`: replace `@hono/trpc-server` and Bun WS adapter references with oRPC adapters
- [x] 8.4 Update `apps/backend-server/README.md`: update architecture diagram and endpoint docs
- [x] 8.5 Update `apps/native/AGENTS.md`: remove tRPC provider references, update API section
- [x] 8.6 Update `apps/notification-sender/AGENTS.md`: update tRPC client references
- [x] 8.7 Update docs in `docs/packages/trpc/` (router-structure.md, procedures.md, middleware.md, error-handling.md)
- [x] 8.8 Update docs in `docs/apps/backend-server/` (trpc.md, api-structure.md, setup.md)
- [x] 8.9 Update `docs/packages/auth/setup.md` if it references tRPC context/auth patterns

## 9. Verification

- [x] 9.1 Run `turbo run typecheck` across all packages and apps — zero errors
- [x] 9.2 Run `turbo run test` across all packages and apps — all tests pass
- [x] 9.3 Run `turbo run build` across all packages — builds succeed
- [x] 9.4 Run `turbo run lint` across all packages — no new lint errors
- [x] 9.5 Verify `bun.lock` is clean (no merge conflicts, no phantom tRPC packages)
- [x] 9.6 Do a quick manual audit: search for any remaining `@trpc/` imports in source files (excluding lockfile and docs history)
- [x] 9.7 Update the `trpc-api-docs` spec in `openspec/specs/` to `orpc-api-docs` (rename directory and update content)
- [x] 9.8 Archive the OpenSpec change using `/opsx-archive`
