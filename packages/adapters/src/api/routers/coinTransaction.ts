/**
 * Coin Transaction Router - Thin tRPC Router
 *
 * This router delegates all operations to the controller layer.
 * All business logic has been moved to Clean Architecture layers.
 *
 * @file packages/trpc/src/api/routers/coinTransaction.ts
 * @total_lines ~16
 */

import { createTRPCRouter } from "../trpc";
import { coinTransactionController } from "../controllers";

export const coinTransactionRouter = createTRPCRouter({
  ...coinTransactionController,
});
