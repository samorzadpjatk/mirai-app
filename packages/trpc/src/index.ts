// Export all tRPC utilities and procedures
export {
  createTRPCContext,
  createCallerFactory,
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
  moderatorProcedure,
  adminProcedure,
  serviceAccountProcedure,
} from "./api/trpc";

// Export business logic router (DB operations)
export { appRouter, createCaller, type AppRouter } from "./api/root";

// Export individual business logic routers (if needed for composition)
export { userRouter } from "./api/routers/user";
export { groupRouter } from "./api/routers/group";
export { coinRouter } from "./api/routers/coin";
export { coinTransactionRouter } from "./api/routers/coinTransaction";
