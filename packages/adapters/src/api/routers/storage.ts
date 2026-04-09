/**
 * Storage Router - Thin tRPC Router
 *
 * This router delegates all operations to the controller layer.
 * All storage logic has been moved to Clean Architecture layers.
 *
 * @file packages/trpc/src/api/routers/storage.ts
 * @total_lines ~20
 */

import { createTRPCRouter } from "../trpc";
import { storageController } from "../controllers";

export const storageRouter = createTRPCRouter({
  ...storageController,
});
