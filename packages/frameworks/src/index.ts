/**
 * @mirai-app/frameworks - Frameworks Layer Exports
 *
 * This package contains framework-specific configuration.
 * It is the outermost layer and can depend on all inner layers.
 *
 * ## Architecture
 *
 * ```
 * ┌─────────────────────────────────────────┐
 * │          Frameworks Layer               │
 * │  ┌─────────┐ ┌─────────┐ ┌─────────┐  │
 * │  │  tRPC   │ │ Drizzle │ │ Supabase│  │
 * │  │ Config  │ │ Client  │ │ Client  │  │
 * │  └─────────┘ └─────────┘ └─────────┘  │
 * └─────────────────────────────────────────┘
 *              │
 *              ▼
 * ┌─────────────────────────────────────────┐
 * │          Adapters Layer                 │
 * │    (Controllers, Gateways, Mappers)     │
 * └─────────────────────────────────────────┘
 * ```
 *
 * ## Usage
 *
 * ### tRPC Server Configuration
 * ```typescript
 * import { createTRPCRouter, publicProcedure } from "@mirai-app/frameworks/trpc/server";
 *
 * export const myRouter = createTRPCRouter({
 *   get: publicProcedure.query(async ({ ctx }) => {
 *     return ctx.db.user.findMany();
 *   }),
 * });
 * ```
 *
 * ### tRPC Client Configuration
 * ```typescript
 * import { getTRPCClient } from "@mirai-app/frameworks/trpc/client";
 *
 * const { client, cleanup } = getTRPCClient(
 *   "https://api.example.com/trpc",
 *   "wss://api.example.com/trpc",
 *   "auth-token"
 * );
 * ```
 *
 * ### Drizzle ORM Client
 * ```typescript
 * import { createDrizzleClient } from "@mirai-app/frameworks/drizzle/client";
 *
 * const db = createDrizzleClient(process.env.DATABASE_URL);
 * ```
 *
 * ### Supabase Client
 * ```typescript
 * import { createSupabaseClient } from "@mirai-app/frameworks/supabase/client";
 *
 * const supabase = createSupabaseClient(
 *   process.env.SUPABASE_URL,
 *   process.env.SUPABASE_ANON_KEY
 * );
 * ```
 */

// =============================================================================
// tRPC Configuration
// =============================================================================

// Client-side tRPC (for React apps)
export { getTRPCClient, type TRPCClientWrapper } from "./trpc/client";

// Server-side tRPC (for backend)
export {
  createTRPCRouter,
  createCallerFactory,
  baseProcedure,
  publicProcedure,
  getPlatformFromUserAgent,
  getAccessTokenFromHeaders,
  type TRPCContext,
  type CreateContextOptions,
} from "./trpc/server";

// Router factory utilities
export {
  createNamespaceRouter,
  validateRouterConfig,
  ROUTER_NAMING,
  ROUTER_PATTERNS,
  type RouterConfig,
} from "./trpc/router-factory";

// =============================================================================
// Dependency Injection
// =============================================================================

export {
  container,
  initializeContainer,
  createChildContainer,
  createTestContainer,
  resetContainer,
  TYPES,
  type ServiceIdentifier,
} from "./di";

// =============================================================================
// Phase 1: Drizzle ORM Configuration (Prisma Replacement)
// =============================================================================

export { createDrizzleClient, type DrizzleDb } from "./drizzle/client";

export * from "./drizzle/schema";

// =============================================================================
// Phase 3: GraphQL API Configuration (tRPC Coexistence)
// =============================================================================

export { builder, schemaBuilder, type GraphQLContext } from "./graphql/builder";

export {
  schema,
  type Schema,
  generateSDL,
  writeSDLToFile,
} from "./graphql/schema";

export { createHonoApp, startHonoServer } from "./graphql/server";

// =============================================================================
// Supabase Configuration
// =============================================================================

export { createSupabaseClient } from "./supabase/client";
export type {
  SupabaseClientOptions,
  SupabaseClient,
  SupabaseSession,
  SupabaseUser,
  RealtimePostgresChangesPayload,
  RealtimeChannel,
  RealtimePostgresInsertPayload,
  StorageAdapter,
} from "./supabase/types";
export { REALTIME_CHANNEL_STATES } from "./supabase/types";

// =============================================================================
// Re-export Inner Layers (for convenience)
// =============================================================================

// NOTE: Re-exports from @mirai-app/domain, @mirai-app/use-cases, and @mirai-app/adapters
// are available via their respective packages. Import directly:
//
// ```typescript
// import { User, Challenge } from "@mirai-app/domain";
// import { CreateUserUseCase } from "@mirai-app/use-cases";
// import { UserController } from "@mirai-app/adapters";
// ```
