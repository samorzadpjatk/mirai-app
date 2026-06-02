# Why

The monorepo currently uses tRPC v11 for type-safe API communication between the backend (Hono + Bun) and frontend (Expo React Native). oRPC provides a modern, OpenAPI-compatible alternative with cleaner API design (no `.query()`/`.mutation()` distinction, plain object routers, provider-less TanStack Query), better Bun WebSocket support, and native Hono adapter. Migrating to oRPC simplifies the server architecture, removes the custom WebSocket adapter dependency, and improves long-term maintainability.

## What Changes

**BREAKING**: Full migration of the `@mirai-app/orpc` package from tRPC to oRPC, affecting all consuming apps and their type-safe API contracts.

- **Swap dependencies**: Replace `@trpc/server`, `@trpc/client`, `@trpc/tanstack-react-query`, `@hono/trpc-server`, and `@valkyrie-resistance/trpc-ws-hono-bun-adapter` with `@orpc/server`, `@orpc/client`, `@orpc/tanstack-query`
- **Rewrite core server package** (`packages/orpc/src/api/trpc.ts`): Replace `initTRPC` with oRPC builder (`os`), rewrite context factory, rewrite middleware chain (telemetry + auth), rewrite procedures (`publicProcedure`, `protectedProcedure`, `moderatorProcedure`, `adminProcedure`)
- **Rewrite router definitions** (18 files in `packages/orpc/src/api/routers/`): Replace `createTRPCRouter({...})` with plain objects, replace all `.query()`/`.mutation()` with `.handler()`, replace `ctx` with `context`, replace `TRPCError` with `ORPCError`
- **Rewrite client layer** (`packages/orpc/src/client/`): Replace `createTRPCClient` + `createWSClient` with oRPC `RPCLink` (HTTP + WebSocket), replace provider-based TanStack Query with provider-less `createTanstackQueryUtils`, remove `TRPCContext` / `useTRPC` / `useTRPCClient` hooks
- **Rewrite backend server** (`apps/backend-server/src/server.ts`, `ws-adapter.ts`): Replace `@hono/trpc-server` with oRPC Hono adapter (`createMiddleware` from `@orpc/server/hono`), replace custom Bun WebSocket tRPC adapter with oRPC `@orpc/server/bun-ws` `RPCHandler`
- **Update all native app hooks/components** (~100 files in `apps/native/src/`): Replace `useTRPC()` and `trpc.x.y.useQuery()` patterns with oRPC TanStack Query utils
- **Update notification sender** (`apps/notification-sender/`): Replace tRPC vanilla client with oRPC client
- **Update tests and mocks**: Rewrite all tRPC-specific mocks, test utilities, and router tests to use oRPC APIs
- **Update documentation**: Rewrite AGENTS.md files, READMEs, and docs to reference oRPC instead of tRPC

## Capabilities

### New Capabilities
- `orpc-api-core`: oRPC server initialization, context, middleware, and procedure definitions in `packages/orpc`
- `orpc-client-layer`: oRPC client setup (vanilla + TanStack Query) in `packages/orpc/src/client`
- `orpc-hono-integration`: oRPC HTTP and WebSocket integration with Hono/Bun in `apps/backend-server`
- `orpc-native-consumption`: Native app consumption patterns using oRPC TanStack Query utils

### Modified Capabilities
- `trpc-api-docs`: Requirements change from tRPC to oRPC documentation. Rename to `orpc-api-docs` and update all requirement scenarios to reference oRPC patterns (router structure, procedures, client usage, middleware, error handling, backend integration)

## Impact

- **Packages**: `@mirai-app/orpc` (complete rewrite of server + client exports)
- **Apps**: `backend-server` (Hono adapter swap), `native` (all hooks/components using API), `notification-sender` (client swap)
- **Dependencies**: Root `package.json`, `packages/orpc/package.json`, `apps/backend-server/package.json`, `apps/notification-sender/package.json`
- **Tests**: All router tests, client tests, server tests, native hook tests, and mock files
- **Documentation**: `packages/orpc/AGENTS.md`, `packages/orpc/README.md`, `apps/backend-server/AGENTS.md`, `apps/backend-server/README.md`, docs in `docs/packages/orpc/` and `docs/apps/backend-server/`
- **Lockfile**: `bun.lock` will change significantly due to dependency swap
