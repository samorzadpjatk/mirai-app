/**
 * User Controller
 *
 * tRPC-ready controller wrapping UserController with proper procedure types.
 * Auth is handled at the controller level - uses publicProcedure and extracts
 * token from HTTP headers.
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure } from "../trpc";
import { TokenExtractor } from "../../utils/TokenExtractor";
import { UserController } from "../../controllers/user-controller";
import type {
  AuthenticateUserUseCase,
  AuthorizeModeratorUseCase,
} from "@mirai-app/use-cases";

export const userController = {
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      // Extract token from HTTP headers
      const authHeader =
        ctx.headers.get("authorization") ?? ctx.headers.get("Authorization");
      const token = TokenExtractor.extract(authHeader);

      if (!token) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Authentication required",
        });
      }

      // Authenticate via use case
      const authUseCase = ctx.di.resolve<AuthenticateUserUseCase>(
        "authenticateUserUseCase",
      );
      const authResult = await authUseCase.execute({ token });

      if (authResult.kind === "err") {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: authResult.error.message,
        });
      }

      // Authorize - only moderators/admins can access this endpoint
      const authContext = authResult.value;
      const authorizeUseCase = ctx.di.resolve<AuthorizeModeratorUseCase>(
        "authorizeModeratorUseCase",
      );
      const authzResult = authorizeUseCase.execute({
        authContext,
        resource: "User",
        action: "getById",
      });

      if (authzResult.kind === "err") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: authzResult.error.message,
        });
      }

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
