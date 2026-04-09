/**
 * Location Controller
 *
 * tRPC-ready controller wrapping LocationController with proper procedure types.
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure } from "../trpc";
import { LocationController } from "../../controllers/location-controller";
import { PrismaLocationRepository } from "../../gateways/PrismaLocationRepository";

// Helper to map error to TRPC error code
const mapLocationErrorToCode = (error: string): string => {
  if (error.includes("not found")) return "NOT_FOUND";
  if (error.includes("unauthorized")) return "UNAUTHORIZED";
  if (error.includes("forbidden")) return "FORBIDDEN";
  if (error.includes("conflict")) return "CONFLICT";
  return "BAD_REQUEST";
};

export const locationController = {
  getMyLocation: protectedProcedure.query(async ({ ctx }) => {
    const controller = new LocationController(
      new PrismaLocationRepository(ctx.db),
    );
    const result = await controller.getByUserId({ userId: ctx.dbUser.id });
    if (!result.success) {
      throw new TRPCError({
        code: mapLocationErrorToCode(result.error),
        message: result.error,
      });
    }
    return result.data;
  }),

  updateLocation: protectedProcedure
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
      const controller = new LocationController(
        new PrismaLocationRepository(ctx.db),
      );
      const result = await controller.update({
        userId: ctx.dbUser.id,
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

  getFriendsLocations: protectedProcedure.query(async ({ ctx }) => {
    const controller = new LocationController(
      new PrismaLocationRepository(ctx.db),
    );
    const result = await controller.list({
      viewerUserId: ctx.dbUser.id,
    });
    if (!result.success) {
      throw new TRPCError({
        code: mapLocationErrorToCode(result.error),
        message: result.error,
      });
    }
    return result.data.locations;
  }),

  getMySharingSettings: protectedProcedure.query(async ({ ctx }) => {
    const controller = new LocationController(
      new PrismaLocationRepository(ctx.db),
    );
    const result = await controller.getSharingSettings({
      userId: ctx.dbUser.id,
    });
    if (!result.success) {
      throw new TRPCError({
        code: mapLocationErrorToCode(result.error),
        message: result.error,
      });
    }
    return result.data;
  }),

  updateSharingSettings: protectedProcedure
    .input(
      z.object({
        isSharingLocation: z.boolean(),
        userIdsToShareWith: z.array(z.string()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const controller = new LocationController(
        new PrismaLocationRepository(ctx.db),
      );
      const result = await controller.updateSharingSettings({
        userId: ctx.dbUser.id,
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

  addUserToSharing: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const controller = new LocationController(
        new PrismaLocationRepository(ctx.db),
      );
      const result = await controller.addSharingUser({
        ownerUserId: ctx.dbUser.id,
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

  removeUserFromSharing: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const controller = new LocationController(
        new PrismaLocationRepository(ctx.db),
      );
      const result = await controller.removeSharingUser({
        ownerUserId: ctx.dbUser.id,
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
