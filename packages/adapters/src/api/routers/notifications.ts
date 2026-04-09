/**
 * Notification Router - Thin tRPC Router
 *
 * This router delegates all operations to the controller layer.
 * All business logic has been moved to Clean Architecture layers.
 *
 * @file packages/trpc/src/api/routers/notifications.ts
 * @total_lines ~20
 */

import { createTRPCRouter } from "../trpc";
import { notificationController } from "../controllers";

export const notificationRouter = createTRPCRouter({
  ...notificationController,
});
