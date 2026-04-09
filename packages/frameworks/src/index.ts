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
 * │  │  tRPC   │ │ Prisma  │ │ Supabase│  │
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
 * import { createTRPCRouter, protectedProcedure } from "@mirai-app/frameworks/trpc/server";
 *
 * export const myRouter = createTRPCRouter({
 *   get: protectedProcedure.query(async ({ ctx }) => {
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
 * ### Prisma Client
 * ```typescript
 * import { createPrismaClient } from "@mirai-app/frameworks/prisma/client";
 *
 * const prisma = createPrismaClient(process.env.DATABASE_URL);
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
  protectedProcedure,
  adminProcedure,
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
// Prisma Configuration
// =============================================================================

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
// Prisma Configuration
// =============================================================================

export {
  createPrismaClient,
  getPrismaClient,
  clearPrismaCache,
  type PrismaClient,
} from "./prisma/client";

export {
  createPaginationArgs,
  createCursorPaginationArgs,
  whereActive,
  whereDateRange,
  runInTransaction,
  softDeleteData,
  softRestoreData,
  ORDER_BY,
  INCLUDE,
  type PrismaModelName,
  type PrismaWhereInput,
  type PrismaCreateInput,
  type PrismaUpdateInput,
  type PrismaInclude,
  type PaginationParams,
} from "./prisma/schema-helpers";

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
// Factory Functions (Dependency Injection)
// =============================================================================

// Repository factories
export {
  createUserRepository,
  createTripRepository,
  createChallengeRepository,
  createGroupRepository,
  createRewardRepository,
  createNotificationRepository,
  createChallengeSubmissionRepository,
  createSponsorRepository,
  createLocationRepository,
  createChallengeVoteRepository,
  createSubmissionReportRepository,
  createCoinTransactionRepository,
  createNotificationDeliveryRepository,
  createNotificationScheduleRepository,
  createActivityFeedRepository,
  clearRepositoryCache,
} from "./factories";

// Service factories and classes
export {
  createCoinTransactionService,
  createCoinService,
  createRankingActivityService,
  createNotificationSenderService,
  createTripPointsCalculator,
  createTripAccessChecker,
  createGroupCoinsService,
  getNotificationService,
} from "./factories";

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
