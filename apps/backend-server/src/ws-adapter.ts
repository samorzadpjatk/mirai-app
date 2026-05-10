/**
 * Wrapper around @valkyrie-resistance/trpc-ws-hono-bun-adapter.
 *
 * This module exists as an abstraction layer so we can easily vendor the adapter
 * if the npm package becomes unstable or incompatible with future tRPC versions.
 *
 * The adapter uses @trpc/server/unstable-core-do-not-import internally,
 * so pinning @trpc/server is recommended.
 */
export {
  createBunHonoWSHandler,
  createBunWSHandler,
} from "@valkyrie-resistance/trpc-ws-hono-bun-adapter";
export type {
  BunHonoWSAdapterOptions,
  BunHonoWSClientCtx,
  CreateBunHonoWSSContextFnOptions,
} from "@valkyrie-resistance/trpc-ws-hono-bun-adapter";
