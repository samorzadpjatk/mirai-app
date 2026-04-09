/**
 * User Router - Thin tRPC Router
 *
 * This router delegates all operations to the controller layer.
 * All business logic has been moved to Clean Architecture layers.
 *
 * @file packages/trpc/src/api/routers/user.ts
 * @total_lines ~20
 */

import { createTRPCRouter } from "../trpc";
import { userController } from "../controllers";

export const userRouter = createTRPCRouter({
  ...userController,
});
