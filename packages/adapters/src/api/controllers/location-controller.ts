/**
 * Location Controller
 *
 * tRPC-ready controller wrapping LocationController with proper procedure types.
 * Auth is handled at the controller level - uses publicProcedure and extracts
 * token from HTTP headers.
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure } from "../trpc";
import { LocationController } from "../../controllers/location-controller";
import { PrismaLocationRepository } from "../../gateways/PrismaLocationRepository";
import { requireAuth } from "../controller-helpers";

// Helper to map error to TRPC error code
const mapLocationErrorToCode = (error: string): string => {
  if (error.includes("not found")) return "NOT_FOUND";
  if (error.includes("unauthorized")) return "UNAUTHORIZED";
  if (error.includes("forbidden")) return "FORBIDDEN";
  if (error.includes("conflict")) return "CONFLICT";
  return "BAD_REQUEST";
};

export const locationController = {
  getMyLocation: publicProcedure.query(async ({ ctx }) => {
    // Require authentication
    const authContext = await requireAuth(ctx.headers, ctx.di);

    const controller = new LocationController(
      new PrismaLocationRepository(ctx.db),
    );
    const result = await controller.getByUserId({ userId: authContext.userId });
    if (!result.success) {
      throw new TRPCError({
        code: mapLocationErrorToCode(result.error),
        message: result.error,
      });
    }
    return result.data;
  }),

  updateLocation: publicProcedure
    .input(
      z.object({
        latitude: z.number().min(-90).max(90).optional().nullable(),
        longitude: z.number().min(-180).max(180).optional().nullable(),
        accuracy: z.number().nonnegative().optional().nullable(),
        altitude: z.number().optional().nullable(),
        altitudeAccuracy: z.number().nonnegative().optional().nullable(),
        heading: z.number().min(0).max(360).optional().nullable(),
        speed: z.number().nonnegative().optional().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Require authentication
      const authContext = await requireAuth(ctx.headers, ctx.di);

      const controller = new LocationController(
        new PrismaLocationRepository(ctx.db),
      );
      const result = await controller.update({
        userId: authContext.userId,
        ...input,
      });
      if (!result.success) {
        throw new TRPCError({
          code: mapLocationErrorToCode(result.error),
          message: result.error,
        });
      }
      return result.data;
    }),

  getFriendsLocations: publicProcedure.query(async ({ ctx }) => {
    // Require authentication
    const authContext = await requireAuth(ctx.headers, ctx.di);

    const controller = new LocationController(
      new PrismaLocationRepository(ctx.db),
    );
    const result = await controller.list({
      viewerUserId: authContext.userId,
    });
    if (!result.success) {
      throw new TRPCError({
        code: mapLocationErrorToCode(result.error),
        message: result.error,
      });
    }
    return result.data.locations;
  }),

  getMySharingSettings: publicProcedure.query(async ({ ctx }) => {
    // Require authentication
    const authContext = await requireAuth(ctx.headers, ctx.di);

    const controller = new LocationController(
      new PrismaLocationRepository(ctx.db),
    );
    const result = await controller.getSharingSettings({
      userId: authContext.userId,
    });
    if (!result.success) {
      throw new TRPCError({
        code: mapLocationErrorToCode(result.error),
        message: result.error,
      });
    }
    return result.data;
  }),

  updateSharingSettings: publicProcedure
    .input(
      z.object({
        isSharingLocation: z.boolean(),
        userIdsToShareWith: z.array(z.string()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Require authentication
      const authContext = await requireAuth(ctx.headers, ctx.di);

      const controller = new LocationController(
        new PrismaLocationRepository(ctx.db),
      );
      const result = await controller.updateSharingSettings({
        userId: authContext.userId,
        isSharingLocation: input.isSharingLocation,
        usersToShareWith: input.userIdsToShareWith?.map((id) => ({
          id,
          firstName: null,
          lastName: null,
        })),
      });
      if (!result.success) {
        throw new TRPCError({
          code: mapLocationErrorToCode(result.error),
          message: result.error,
        });
      }
      return result.data;
    }),

  addUserToSharing: publicProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Require authentication
      const authContext = await requireAuth(ctx.headers, ctx.di);

      const controller = new LocationController(
        new PrismaLocationRepository(ctx.db),
      );
      const result = await controller.addSharingUser({
        ownerUserId: authContext.userId,
        userToAddId: input.userId,
        userFirstName: null,
        userLastName: null,
      });
      if (!result.success) {
        throw new TRPCError({
          code: mapLocationErrorToCode(result.error),
          message: result.error,
        });
      }
      return result.data;
    }),

  removeUserFromSharing: publicProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Require authentication
      const authContext = await requireAuth(ctx.headers, ctx.di);

      const controller = new LocationController(
        new PrismaLocationRepository(ctx.db),
      );
      const result = await controller.removeSharingUser({
        ownerUserId: authContext.userId,
        userToRemoveId: input.userId,
      });
      if (!result.success) {
        throw new TRPCError({
          code: mapLocationErrorToCode(result.error),
          message: result.error,
        });
      }
      return result.data;
    }),
};
