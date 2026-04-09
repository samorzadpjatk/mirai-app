/**
 * User Controller
 *
 * tRPC-ready controller wrapping UserController with proper procedure types.
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { moderatorProcedure } from "../trpc";
import { UserController } from "../../controllers/user-controller";

export const userController = {
  getById: moderatorProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      // Using DI container to resolve UserController - no manual instantiation needed
      const controller = ctx.di.resolve<UserController>("userController");
      const result = await controller.getById({ id: input.id });

      if (!result.success) {
        throw new TRPCError({
          code: result.error.includes("not found")
            ? "NOT_FOUND"
            : "BAD_REQUEST",
          message: result.error,
        });
      }
      return result.data;
    }),
};
