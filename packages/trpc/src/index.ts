// Export all tRPC utilities and procedures (server-side)
export {
  createTRPCContext,
  createCallerFactory,
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
  moderatorProcedure,
  adminProcedure,
} from "./api/trpc";

// Export business logic router (DB operations)
export { appRouter, createCaller, type AppRouter } from "./api/root";

// Export client utilities (client-side)
// These are exported from a separate path to allow tree-shaking
// Import from "@integral-2025-app/trpc/client" to use client utilities
export * from "./client";