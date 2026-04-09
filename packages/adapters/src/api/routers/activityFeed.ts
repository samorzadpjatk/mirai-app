/**
 * Activity Feed Router - Thin tRPC Router
 *
 * This router delegates all operations to the controller layer.
 * All business logic has been moved to Clean Architecture layers.
 *
 * @file packages/trpc/src/api/routers/activityFeed.ts
 * @total_lines ~20
 */

import { createTRPCRouter } from "../trpc";
import { activityFeedController } from "../controllers";

export const activityFeedRouter = createTRPCRouter({
  ...activityFeedController,
});
