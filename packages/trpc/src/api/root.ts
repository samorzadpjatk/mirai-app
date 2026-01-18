import { groupRouter } from "./routers/group";
import {
  createCallerFactory,
  createTRPCRouter,
  publicProcedure,
} from "../api/trpc";
import { userRouter } from "./routers/user";
import { coinRouter } from "./routers/coin";
import { coinTransactionRouter } from "./routers/coinTransaction";
import { notificationRouter } from "./routers/notifications";
import { notificationScheduleRouter } from "./routers/notificationSchedule";
import { notificationDeliveryRouter } from "./routers/notificationDelivery";
import { locationRouter } from "./routers/location";
import { tripRouter } from "./routers/trip";
import { challengeRouter } from "./routers/challenge";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  group: groupRouter,
  user: userRouter,
  coin: coinRouter,
  coinTransaction: coinTransactionRouter,
  notifications: notificationRouter,
  notificationSchedule: notificationScheduleRouter,
  notificationDelivery: notificationDeliveryRouter,
  location: locationRouter,
  trip: tripRouter,
  challenge: challengeRouter,
  // Health checks for load balancers / uptime monitoring
  health: createTRPCRouter({
    ping: publicProcedure.query(() => ({
      status: "ok",
      time: new Date().toISOString(),
    })),
  }),
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
