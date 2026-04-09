/**
 * Trip Router - Thin tRPC Router
 *
 * This router delegates all operations to the controller layer.
 * All business logic has been moved to Clean Architecture layers.
 *
 * @file packages/trpc/src/api/routers/trip.ts
 * @total_lines ~20
 */

import { createTRPCRouter } from "../trpc";
import { tripController } from "../controllers";

export const tripRouter = createTRPCRouter({
  ...tripController,
});
