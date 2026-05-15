## Context

The MIRAI monorepo uses tRPC v11 for end-to-end type-safe APIs across:
- **Server**: `packages/trpc/src/api/` — 18 routers, custom procedures, middleware, context
- **Client**: `packages/trpc/src/client/` — Vanilla client (WS+HTTP), React Query provider, hooks
- **Backend**: `apps/backend-server/` — Hono + `@hono/trpc-server` + custom Bun WebSocket adapter
- **Native app**: `apps/native/src/` — ~100 files consuming tRPC via `useTRPC()` + TanStack Query
- **Notification sender**: `apps/notification-sender/` — Vanilla tRPC client for service calls

oRPC is a modern RPC framework with near-identical mental model to tRPC but simpler API:
- No `.query()`/`.mutation()` distinction — everything is `.handler()`
- Plain object routers — no `createTRPCRouter()` factory
- Provider-less TanStack Query — no `TRPCProvider`, just `createTanstackQueryUtils(client)`
- Native Hono adapter (`createMiddleware` from `@orpc/server/hono`)
- Native Bun WebSocket adapter (`RPCHandler` from `@orpc/server/bun-ws`)
- OpenAPI-compatible by design

## Goals / Non-Goals

**Goals:**
- Achieve feature parity: all 18 routers, all procedures, all middleware, all auth levels work identically after migration
- Preserve WebSocket subscription behavior (real-time location sharing, notifications)
- Preserve type safety end-to-end (server → client → React hooks)
- Update all tests to pass with oRPC APIs
- Update all documentation to reference oRPC

**Non-Goals:**
- No database schema changes
- No new API endpoints or features (pure migration)
- No changes to native app UI/UX
- No changes to auth logic (`@mirai-app/auth` stays unchanged)
- No migration to OpenAPI (stay on oRPC native RPC protocol for now)

## Decisions

### 1. Server initialization: oRPC builder (`os`) instead of `initTRPC`
**Rationale**: oRPC's `os` from `@orpc/server` is the canonical entrypoint. It provides `.use()`, `.input()`, `.output()`, `.handler()`, `.callable()`, `.actionable()` chaining. This replaces `initTRPC.context<TRPCContext>().create({...})`.
- **Context type**: `os.$context<ORPCContext>()` instead of `initTRPC.context<TRPCContext>().create()`
- **Transformer**: oRPC handles serialization natively (SuperJSON still supported via interceptors or we can use oRPC's native type preservation)
- **Error formatter**: oRPC errors include `ORPCError` with code/message; we can add custom interceptors for Zod error flattening if needed

### 2. Routers: plain objects instead of `createTRPCRouter({...})`
**Rationale**: oRPC routers are plain JS objects. This is the oRPC convention.
- `export const userRouter = createTRPCRouter({...})` → `export const userRouter = {...}`
- Root router: `export const appRouter = { user: userRouter, ... }`
- Type export: `export type AppRouter = typeof appRouter` still works

### 3. Procedures: single `.handler()` instead of `.query()`/`.mutation()`
**Rationale**: oRPC does not distinguish query/mutation at the procedure level. The HTTP method is determined by the client call or server configuration.
- All `.query(async ({ ctx, input }) => {...})` → `.handler(async ({ context, input }) => {...})`
- All `.mutation(async ({ ctx, input }) => {...})` → `.handler(async ({ context, input }) => {...})`

### 4. Context: `context` instead of `ctx`
**Rationale**: oRPC uses `context` as the property name in handlers and middleware.
- This is a mechanical rename across all 18 router files and middleware definitions.

### 5. Errors: `ORPCError` instead of `TRPCError`
**Rationale**: oRPC has its own error class with similar error codes (`UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `BAD_REQUEST`, `INTERNAL_SERVER_ERROR`).
- `throw new TRPCError({ code: 'UNAUTHORIZED' })` → `throw new ORPCError('UNAUTHORIZED')`
- Our auth utilities (`AuthenticationError`, `AuthorizationError`) from `@mirai-app/auth` stay unchanged; we map them to `ORPCError` in middleware.

### 6. Client: `createORPCClient` + `RPCLink` instead of `createTRPCClient`
**Rationale**: oRPC's client uses `RPCLink` for RPC protocol and `OpenAPILink` for OpenAPI. We use `RPCLink` for parity.
- HTTP link: `new RPCLink({ url: httpUrl, headers: () => ({ Authorization: ... }) })`
- WS link: `new RPCLink({ websocket: new WebSocket(wsUrl) })` from `@orpc/client/websocket`
- **Split link**: We need to route subscriptions to WS and queries/mutations to HTTP. oRPC client supports interceptors and conditional routing.

### 7. TanStack Query: provider-less utils instead of provider-based context
**Rationale**: oRPC's TanStack Query integration does not require a React Provider. This simplifies the native app setup.
- Remove `APIProvider`, `TRPCContext`, `useTRPC`, `useTRPCClient`
- Create: `export const orpc = createTanstackQueryUtils(client)`
- Usage: `useQuery(orpc.user.getMy.queryOptions({ input: {} }))` — note oRPC wraps input in `{ input: ... }`
- **Impact**: All ~100 native files using `trpc.x.y.useQuery()` must change to `useQuery(orpc.x.y.queryOptions({ input: ... }))`

### 8. Backend server: oRPC Hono middleware + Bun WS handler
**Rationale**: oRPC has a dedicated Hono adapter that handles the body-parser proxy issue.
- HTTP: `createMiddleware(handler, { prefix: '/rpc', context: () => ({...}) })` from `@orpc/server/hono`
- WebSocket: `RPCHandler` from `@orpc/server/bun-ws` replaces `@valkyrie-resistance/trpc-ws-hono-bun-adapter`
- **Critical**: oRPC's `RPCHandler` for Bun WS requires `Bun.serve()` with `websocket: { message(ws, message) { handler.message(ws, message, { context }) } }` pattern
- Context creation in WS: oRPC passes `context` option to `handler.message()`, not via `createContext` callback like tRPC

### 9. Dependency swap order
**Rationale**: Must swap all tRPC packages simultaneously to avoid version conflicts.
- Remove: `@trpc/server`, `@trpc/client`, `@trpc/tanstack-react-query`, `@hono/trpc-server`, `@valkyrie-resistance/trpc-ws-hono-bun-adapter`
- Add: `@orpc/server`, `@orpc/client`, `@orpc/tanstack-query`
- Keep: `superjson` (still used for serialization), `zod` (validation), `@tanstack/react-query` (peer dep)

## Risks / Trade-offs

| Risk | Mitigation |
|------|-----------|
| oRPC Hono adapter may have edge cases with body parsing | Test all mutation endpoints manually; the adapter uses Proxy to intercept body methods, same pattern as `@hono/trpc-server` |
| WebSocket reconnection/auth token refresh logic differs | oRPC WS client supports `partysocket` for reconnection; replicate existing token-in-URL auth pattern |
| ~100 native files to update = high regression risk | Migrate in waves: core → routers → client → backend → native → tests; run full test suite after each wave |
| Test mocks for tRPC are extensive | Rewrite mock client to use oRPC `createRouterClient` for server-side testing |
| `bun.lock` may have resolution issues | Run `bun install` after each dependency change; if lockfile breaks, delete and regenerate |
| oRPC is newer than tRPC with smaller community | oRPC is actively maintained (last updated May 2026); all required adapters exist; fallback to tRPC partial migration if blockers found |
| Input wrapping `{ input: ... }` in TanStack Query is verbose | Accept as oRPC convention; no workaround without wrapper helpers |

## Migration Plan

**Phase 1: Core (`packages/trpc/src/api/trpc.ts`, `root.ts`, `index.ts`)**
- Swap dependencies in `packages/trpc/package.json`
- Rewrite `trpc.ts`: `os` builder, context, middleware, procedures
- Rewrite `root.ts`: plain object router
- Update `index.ts` exports
- Run `packages/trpc` typecheck

**Phase 2: Routers (18 files in `packages/trpc/src/api/routers/`)**
- Mechanical conversion: `.query()` → `.handler()`, `ctx` → `context`, `TRPCError` → `ORPCError`, `createTRPCRouter({...})` → `{...}`
- Update router test files (20+ test files)

**Phase 3: Client (`packages/trpc/src/client/`)**
- Rewrite `vanilia.ts`: `createORPCClient` with `RPCLink`
- Rewrite `react.ts`: remove context, export nothing (or export client reference)
- Rewrite `query-client.tsx`: remove `APIProvider`, create `createORPCUtils` export
- Update client tests
- Update `query/index.ts`

**Phase 4: Backend (`apps/backend-server/`)**
- Swap dependencies in `apps/backend-server/package.json`
- Rewrite `server.ts`: oRPC Hono middleware + Bun WS `RPCHandler`
- Remove `ws-adapter.ts` (no longer needed, use `@orpc/server/bun-ws` directly)
- Update server tests

**Phase 5: Notification sender (`apps/notification-sender/`)**
- Swap dependency, update client usage

**Phase 6: Native app (`apps/native/src/`)**
- Update `_layout.tsx`: remove `APIProvider`, wrap with just `QueryClientProvider`
- Mass update hooks: `useTRPC()` → import `orpc` utils directly
- Mass update components using `trpc.x.y.useQuery()` → `useQuery(orpc.x.y.queryOptions({ input: ... }))`
- Mass update tests

**Phase 7: Root + docs**
- Update root `package.json`
- Update all AGENTS.md and docs
- Run full monorepo typecheck + test suite

**Rollback**: Revert git commit; tRPC packages can be reinstalled quickly if critical issues found.

## Open Questions

1. **Should we keep `APIProvider` as a thin wrapper around `QueryClientProvider` for backward compatibility, or remove it entirely?** Removing it requires updating `_layout.tsx` and all imports. Keeping it as a no-op wrapper adds technical debt. → **Decision: Remove entirely; update `_layout.tsx` to use `QueryClientProvider` directly.**
2. **Does oRPC support the same `connectionParams` pattern for WebSocket auth?** tRPC passes auth via `connectionParams` and URL query params. oRPC WS handler receives `context` per-message. → **Decision: Pass auth token in `context` when calling `handler.message()`, and also encode in WS URL for upgrade handshake.**
3. **Should we add a wrapper to avoid `{ input: ... }` verbosity in TanStack Query?** → **Decision: No wrapper initially; use raw oRPC pattern. Add wrapper later if team feedback is negative.**
4. **How to handle `useSubscription` from `@trpc/tanstack-react-query`?** oRPC TanStack Query docs don't mention subscriptions explicitly. → **Decision: Use oRPC WebSocket client directly with `useEffect` + `useState` for subscriptions, or investigate if oRPC has a subscription hook.**
