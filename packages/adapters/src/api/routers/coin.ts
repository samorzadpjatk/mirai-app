/**
 * Coin Router - Thin tRPC Router
 *
 * This router delegates all operations to the controller layer.
 * All business logic has been moved to Clean Architecture layers.
 *
 * @file packages/trpc/src/api/routers/coin.ts
 * @total_lines ~16
 */

import { createTRPCRouter } from "../trpc";
import { coinController } from "../controllers";

export const coinRouter = createTRPCRouter({
  ...coinController,
});
