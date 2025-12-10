import { groupRouter } from "./routers/group";
import { createCallerFactory, createTRPCRouter } from "../api/trpc";
import { userRouter } from "./routers/user";
import { coinRouter } from "./routers/coin";
import { coinTransactionRouter } from "./routers/coinTransaction";
import { notificationRouter } from "./routers/notifications";
import { notificationScheduleRouter } from "./routers/notificationSchedule";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter: ReturnType<typeof createTRPCRouter> = createTRPCRouter({
  group: groupRouter,
  user: userRouter,
  coin: coinRouter,
  coinTransaction: coinTransactionRouter,
  notifications: notificationRouter,
  notificationSchedule: notificationScheduleRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
