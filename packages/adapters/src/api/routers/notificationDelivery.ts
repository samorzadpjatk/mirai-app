/**
 * Notification Delivery Router - Thin tRPC Router
 *
 * This router delegates all operations to the controller layer.
 * All business logic has been moved to Clean Architecture layers.
 *
 * @file packages/trpc/src/api/routers/notificationDelivery.ts
 * @total_lines ~16
 */

import { createTRPCRouter } from "../trpc";
import { notificationDeliveryController } from "../controllers";

export const notificationDeliveryRouter = createTRPCRouter({
  ...notificationDeliveryController,
});
