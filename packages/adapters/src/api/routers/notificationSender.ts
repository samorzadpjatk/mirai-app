/**
 * Notification Sender Router - Thin tRPC Router
 *
 * This router delegates all operations to the controller layer.
 * All business logic has been moved to Clean Architecture layers.
 *
 * @file packages/trpc/src/api/routers/notificationSender.ts
 * @total_lines ~16
 */

import { createTRPCRouter } from "../trpc";
import { notificationSenderController } from "../controllers";

export const notificationSenderRouter = createTRPCRouter({
  ...notificationSenderController,
});
