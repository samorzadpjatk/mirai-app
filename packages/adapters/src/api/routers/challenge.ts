/**
 * Challenge Router - Thin tRPC Router
 *
 * This router delegates all operations to the controller layer.
 * All business logic has been moved to Clean Architecture layers.
 *
 * @file packages/trpc/src/api/routers/challenge.ts
 * @total_lines ~20
 */

import { createTRPCRouter } from "../trpc";
import { challengeController } from "../controllers";

export const challengeRouter = createTRPCRouter({
  ...challengeController,
});
