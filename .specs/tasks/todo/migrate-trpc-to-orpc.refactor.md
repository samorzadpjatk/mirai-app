---
title: Migrate tRPC to oRPC across monorepo
---

## Initial User Prompt

ulw: Migrate from tRPC into oRPC; search the external docs and web for reference; follow the AGENTS.md and described development workflow

## Description

Full migration of `@mirai-app/orpc` from tRPC v11 to oRPC across the MIRAI monorepo. This is a cross-cutting refactor affecting the core RPC package, backend server, native app, notification sender, and all associated tests and documentation.

**Scope**: All 18 tRPC routers, client layer (vanilla + TanStack Query), backend Hono integration, Bun WebSocket adapter, native app hooks/components (~113 files), tests, mocks, and documentation.

**Acceptance Criteria**:
- Zero `@trpc/*` imports remain in source files (excluding lockfile)
- All 18 routers use oRPC `.handler()` with plain object exports
- Client uses `createORPCClient` + `RPCLink` with HTTP/WS split
- TanStack Query uses provider-less `createTanstackQueryUtils`
- Backend uses oRPC Hono `createMiddleware` + `@orpc/server/bun-ws` `RPCHandler`
- `turbo run typecheck` passes across all packages
- `turbo run test` passes across all packages
- `turbo run build` passes across all packages
- `turbo run lint` passes with no new errors
- All documentation updated from tRPC to oRPC references

**Out of Scope**: No new API endpoints, no database schema changes, no UI/UX changes, no auth logic changes.

## Architecture Overview

**oRPC replaces tRPC with these key mappings**:
- `initTRPC` → `os` builder from `@orpc/server`
- `createTRPCRouter({...})` → plain JS object `{...}`
- `.query()` / `.mutation()` → `.handler()`
- `ctx` → `context`
- `TRPCError` → `ORPCError`
- `createTRPCClient` + `createWSClient` → `createORPCClient` + `RPCLink` (HTTP from `@orpc/client`, WS from `@orpc/client/websocket`)
- `APIProvider` + `useTRPC()` + `createTRPCOptionsProxy` → provider-less `createTanstackQueryUtils(client)` from `@orpc/tanstack-query`
- `@hono/trpc-server` + custom WS adapter → oRPC `createMiddleware` from `@orpc/server/hono` + `RPCHandler` from `@orpc/server/bun-ws`

**Context creation** (`createORPCContext`) preserves existing logic: Supabase singleton, Prisma client, token extraction from headers/connectionParams/URL.

**Middleware chain** preserves existing behavior: telemetry (user-agent logging) + auth (protected/moderator/admin guards).

## Implementation Process

### Wave 1: Core Package (No Dependencies)

**Task 1: Dependency Swap + Server Init**
- Update `packages/trpc/package.json`: remove `@trpc/server`, `@trpc/client`, `@trpc/tanstack-react-query`; add `@orpc/server`, `@orpc/client`, `@orpc/tanstack-query`
- Update root `package.json`: remove `@trpc/client`, `@valkyrie-resistance/trpc-ws-hono-bun-adapter`
- Rewrite `packages/trpc/src/api/trpc.ts`:
  - Replace `initTRPC` with `os` from `@orpc/server`
  - Rename `TRPCContext` → `ORPCContext`, `createTRPCContext` → `createORPCContext`
  - Rewrite `mobileAppMiddleware` as `os.middleware()` with telemetry logic preserved
  - Rewrite `publicProcedure`, `protectedProcedure`, `moderatorProcedure`, `adminProcedure`, `mobileAppProcedure`
  - Replace `TRPCError` throws with `ORPCError` throws
  - Replace `createCallerFactory` with oRPC equivalent
- Rewrite `packages/trpc/src/api/root.ts`: replace `createTRPCRouter({...})` with plain object `{ user: userRouter, ... }`
- Update `packages/trpc/src/index.ts` exports
- Run `bun install` and verify lockfile
- **Success Criteria**: `cd packages/trpc && bun run typecheck` passes with zero errors

### Wave 2: Parallel (After Wave 1)

**Task 2: Router Migration (18 files)**
- Mechanical conversion in `packages/trpc/src/api/routers/*.ts`:
  - `.query(async ({ ctx, input }) => {...})` → `.handler(async ({ context, input }) => {...})`
  - `.mutation(async ({ ctx, input }) => {...})` → `.handler(async ({ context, input }) => {...})`
  - `createTRPCRouter({...})` → `{...}` (plain object)
  - `TRPCError` → `ORPCError`
  - `ctx` → `context` in all destructuring
- Update all `import { createTRPCRouter, ... } from "../../api/trpc"` to import from new oRPC exports
- **Success Criteria**: `grep -r "\.query(\|\.mutation(\|createTRPCRouter\|TRPCError" --include="*.ts" packages/trpc/src/api/routers/` returns empty

**Task 3: Client Layer Rewrite**
- Rewrite `packages/trpc/src/client/vanilia.ts`:
  - Replace `createTRPCClient`, `createWSClient`, `httpLink`, `wsLink`, `splitLink`, `retryLink` with oRPC `createORPCClient` and `RPCLink`
  - HTTP link: `new RPCLink({ url: httpUrl, headers: () => ({ Authorization: ... }) })`
  - WS link: `new RPCLink({ websocket: new WebSocket(wsUrlWithAuth) })` from `@orpc/client/websocket`
  - Preserve retry logic (5 attempts, exponential backoff)
  - Preserve auth token injection in headers and WS URL
- Rewrite `packages/trpc/src/client/react.ts`: remove `TRPCContext`, `useTRPC`, `useTRPCClient`, `useSubscription` exports
- Rewrite `packages/trpc/src/client/query-client.tsx`:
  - Remove `APIProvider` component and all tRPC-specific provider logic
  - Keep `QueryClientProvider` for React Query
  - Export `orpc` utils created via `createTanstackQueryUtils(client)`
  - Keep auth error handling (unauthorized → refresh session → sign out)
- Update `packages/trpc/src/client/invalidationUtils.ts` for oRPC query key patterns
- Update `packages/trpc/src/client/index.ts` and `packages/trpc/src/client/query/index.ts`
- **Success Criteria**: No `@trpc/client` or `@trpc/tanstack-react-query` imports in client files

### Wave 3: Parallel (After Wave 2)

**Task 4: Backend Server Integration**
- Update `apps/backend-server/package.json`: remove `@hono/trpc-server`, `@trpc/server`, `@valkyrie-resistance/trpc-ws-hono-bun-adapter`; add `@orpc/server`
- Rewrite `apps/backend-server/src/server.ts`:
  - Replace `trpcServer` from `@hono/trpc-server` with oRPC `createMiddleware` from `@orpc/server/hono`
  - Replace custom WS adapter with `RPCHandler` from `@orpc/server/bun-ws`
  - Preserve context creation logic (Supabase, Prisma, token extraction)
  - Preserve health check endpoint
  - Preserve CORS in dev mode
- Delete `apps/backend-server/src/ws-adapter.ts`
- **Success Criteria**: typecheck passes; `ws-adapter.ts` deleted; health check endpoint works

**Task 5: Notification Sender Update**
- Update `apps/notification-sender/package.json`: remove `@trpc/client`; add `@orpc/client`
- Update source files: replace `getTRPCClient` with `getORPCClient`, update call patterns
- **Success Criteria**: typecheck passes

**Task 6: Native App Migration (~113 files)**
- Create `apps/native/src/lib/orpc.ts`: initialize oRPC client + `createTanstackQueryUtils`, export `orpc`
- Update `apps/native/src/app/_layout.tsx`: remove `APIProvider`, use `QueryClientProvider` directly
- Mass-update hooks in `apps/native/src/hooks/` (76 files):
  - Replace `const trpc = useTRPC()` with direct `orpc` import
  - Replace `trpc.x.y.useQuery()` with `useQuery(orpc.x.y.queryOptions({ input: ... }))`
  - Replace `trpc.x.y.useMutation()` with `useMutation(orpc.x.y.mutationOptions())`
  - Replace `trpc.x.y.useInfiniteQuery()` with `useInfiniteQuery(orpc.x.y.infiniteOptions({...}))`
- Update components that directly call tRPC (~15 files)
- Update screen files in `apps/native/src/app/` (~22 files)
- Update test files (~37 files)
- **Success Criteria**: No `useTRPC` or `APIProvider` imports; `cd apps/native && bun run typecheck` passes

**Task 7: Mocks & Tests Update**
- Rewrite `packages/trpc/src/__mocks__/client.ts` for oRPC `createRouterClient`
- Update `packages/trpc/src/__tests__/router.test.ts`
- Update all router test files (`packages/trpc/src/api/routers/__tests__/*.test.ts`)
- Update client tests (`packages/trpc/src/client/__tests__/*.test.ts`)
- Update native test mocks
- **Success Criteria**: All test suites pass

### Wave 4: Documentation (After Wave 3)

**Task 8: Documentation Update**
- Update `packages/trpc/AGENTS.md`, `packages/trpc/README.md`
- Update `apps/backend-server/AGENTS.md`, `apps/backend-server/README.md`
- Update `apps/native/AGENTS.md`
- Update `apps/notification-sender/AGENTS.md`
- Update `docs/packages/trpc/*.md`
- Update `docs/apps/backend-server/*.md`
- **Success Criteria**: No tRPC references in AGENTS.md/README files

### Wave 5: Verification (After Wave 4)

**Task 9: Final Verification**
- Run `turbo run typecheck` — zero errors
- Run `turbo run test` — all pass
- Run `turbo run build` — all succeed
- Run `turbo run lint` — no new errors
- Grep audit: `grep -r "@trpc/" --include="*.ts" --include="*.tsx" apps/ packages/` returns empty (excluding node_modules, docs history)
- Verify `bun.lock` has no phantom tRPC packages
- Archive OpenSpec change
- **Success Criteria**: All 9 checks pass

## Parallelization

```
Wave 1: Task 1 (Core)                        [single agent, deep]
       ↓
Wave 2: Task 2 (Routers)  ─┐                 [mechanical, quick]
        Task 3 (Client)   ─┘                 [complex, deep]
       ↓
Wave 3: Task 4 (Backend)  ─┐
        Task 5 (Notif)    ─┼─ IN PARALLEL   [mixed complexity]
        Task 6 (Native)     ─┤
        Task 7 (Tests)      ─┘
       ↓
Wave 4: Task 8 (Docs)                        [writing agent]
       ↓
Wave 5: Task 9 (Verify)                      [quick, verification]
```

**Critical Path**: Task 1 → Task 3 → Task 6 → Task 8 → Task 9

## Verification

### Per-Wave Verification

| Wave | Verification Method | Threshold |
|------|-------------------|-----------|
| Wave 1 | `cd packages/trpc && bun run typecheck` | Zero errors |
| Wave 2 | Grep audit + typecheck | Zero `.query()`/`.mutation()`/TRPCError |
| Wave 3 | Typecheck all apps + test suites | All pass |
| Wave 4 | Doc grep audit | Zero tRPC references |
| Wave 5 | Full monorepo typecheck/test/build/lint | All green |

### Implementation Verification Rubric

1. **Dependency Accuracy** (weight: 0.30)
   - Correct packages added/removed in all package.json files?
   - No phantom tRPC packages in lockfile?

2. **API Parity** (weight: 0.35)
   - All 18 routers have identical endpoints?
   - Auth behavior identical (protected/moderator/admin)?
   - WebSocket subscriptions functional?

3. **Type Safety** (weight: 0.20)
   - End-to-end type inference preserved?
   - No `any` types introduced?
   - Typecheck passes across monorepo?

4. **Test Coverage** (weight: 0.15)
   - All existing tests pass?
   - No tests deleted to make build pass?

**Overall Threshold**: 4.0/5.0

## Definition of Done

- [x] All tRPC dependencies removed from package.json files
- [x] All source files use oRPC APIs exclusively
- [x] `turbo run typecheck` passes (zero errors)
- [x] `turbo run test` passes (all suites green)
- [x] `turbo run build` passes (all packages build)
- [x] `turbo run lint` passes (no new lint errors)
- [x] Documentation updated (AGENTS.md, READMEs, docs/)
- [x] OpenSpec change archived
- [x] Commit history clean (9 logical commits, one per wave)
