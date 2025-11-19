/**
 * Web app root router
 * 
 * This is the primary router for the web application that combines:
 * - Business logic routers from the common package (DB operations for users, groups, coins, etc.)
 * - Web-specific web push notification routers (notifications and notification schedules)
 */

import {
  userRouter,
  groupRouter,
  coinRouter,
  coinTransactionRouter,
} from "@integral-2025-app/trpc";
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";
import { notificationRouter } from "./routers/notifications";
import { notificationScheduleRouter } from "./routers/notificationSchedule";

/**
 * Combined app router that merges business logic and web push routers
 * 
 * This approach keeps:
 * - Business logic (DB operations) in the common package for potential reuse
 * - Web push notifications in the web app (requires web-specific services and context)
 */
export const appRouter = createTRPCRouter({
  // Business logic routers from common package
  user: userRouter,
  group: groupRouter,
  coin: coinRouter,
  coinTransaction: coinTransactionRouter,
  
  // Web push notification routers (web-specific)
  notifications: notificationRouter,
  notificationSchedule: notificationScheduleRouter,
});

// Export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.user.getById({ id: "123" });
 */
export const createCaller = createCallerFactory(appRouter);
