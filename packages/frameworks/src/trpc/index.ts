/**
 * tRPC Configuration Exports
 *
 * This module exports both client-side and server-side tRPC configuration.
 */

// Client-side exports
export {
  useTRPC,
  useTRPCClient,
  useSubscription,
  TRPCContext,
  APIProvider,
  getTRPCClient,
} from "./client";

// Hooks exports (admin hooks)
export {
  useAdminUsers,
  useAdminGroups,
  useAdminChallenges,
  useAdminRewards,
  useAdminActivity,
  useAdminNotifications,
  useAdminTransactions,
  useAdminCoins,
  useAdminSchedules,
  useAdminTrips,
} from "./hooks";

// Server-side exports (from frameworks trpc server)
export {
  createTRPCRouter,
  createCallerFactory,
  baseProcedure,
  publicProcedure,
  getPlatformFromUserAgent,
  getAccessTokenFromHeaders,
  type TRPCContext,
  type CreateContextOptions,
} from "./server";

// Router factory exports
export {
  createNamespaceRouter,
  validateRouterConfig,
  ROUTER_NAMING,
  ROUTER_PATTERNS,
  type RouterConfig,
} from "./router-factory";
