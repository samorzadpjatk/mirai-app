/**
 * Sponsor Router - Thin tRPC Router
 *
 * This router delegates all operations to the controller layer.
 * All business logic has been moved to Clean Architecture layers.
 *
 * @file packages/trpc/src/api/routers/sponsor.ts
 * @total_lines ~16
 */

import { createTRPCRouter } from "../trpc";
import { sponsorController } from "../controllers";

export const sponsorRouter = createTRPCRouter({
  ...sponsorController,
});
