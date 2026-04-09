/**
 * Challenge Controller
 *
 * tRPC-ready controller wrapping ChallengeController with proper procedure types.
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { adminProcedure, protectedProcedure } from "../trpc";
import { ChallengeController } from "../../controllers/challenge-controller";

export const challengeController = {
  getAll: adminProcedure.query(async ({ ctx }) => {
    // Using DI container to resolve ChallengeController - no manual instantiation needed
    const controller = ctx.di.resolve<ChallengeController>(
      "challengeController",
    );
    const result = await controller.findActive();

    if (!result.success) {
      throw new TRPCError({ code: "BAD_REQUEST", message: result.error });
    }
    return result.data;
  }),

  getAllByTrip: protectedProcedure
    .input(
      z.object({
        tripId: z.string(),
        pagination: z
          .object({
            limit: z.number().int().min(1).max(100).default(30),
            offset: z.number().int().min(0).default(0),
          })
          .optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      // Using DI container to resolve ChallengeController - no manual instantiation needed
      const controller = ctx.di.resolve<ChallengeController>(
        "challengeController",
      );
      const result = await controller.getByTripId({ tripId: input.tripId });

      if (!result.success) {
        throw new TRPCError({ code: "BAD_REQUEST", message: result.error });
      }
      return {
        challenges: result.data,
        pagination: {
          total: result.data.length,
          limit: input.pagination?.limit ?? 30,
          offset: input.pagination?.offset ?? 0,
          hasMore: false,
        },
      };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string(), tripId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Using DI container to resolve ChallengeController - no manual instantiation needed
      const controller = ctx.di.resolve<ChallengeController>(
        "challengeController",
      );
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

  create: adminProcedure
    .input(
      z.object({
        tripId: z.string(),
        name: z.string().min(1),
        description: z.string().optional(),
        image: z.string().optional(),
        submissionType: z.enum([
          "IMAGE",
          "MULTI_IMAGE",
          "VIDEO",
          "TEXT",
          "IMAGE_LOCATION",
          "LOCATION",
          "QR_CODE",
        ]),
        scoringCategory: z.enum([
          "SPEED",
          "UNLIMITED",
          "JUDGED_STAFF",
          "PEER_VOTING",
        ]),
        basePoints: z.number().int().min(0).optional(),
        firstPlacePoints: z.number().int().min(0).optional(),
        secondPlacePoints: z.number().int().min(0).optional(),
        thirdPlacePoints: z.number().int().min(0).optional(),
        status: z
          .enum([
            "HIDDEN",
            "VISIBLE",
            "ACTIVE",
            "VOTING_PHASE",
            "COMPLETED",
            "CANCELLED",
          ])
          .optional(),
        startTime: z.coerce.date().optional(),
        endTime: z.coerce.date().optional(),
        targetLatitude: z.number().optional(),
        targetLongitude: z.number().optional(),
        expectedValue: z.string().optional(),
        autoApprove: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Using DI container to resolve ChallengeController - no manual instantiation needed
      const controller = ctx.di.resolve<ChallengeController>(
        "challengeController",
      );
      const result = await controller.create({
        ...input,
        isRecurring: false,
        dailyStartTime: null,
        dailyEndTime: null,
      });

      if (!result.success) {
        throw new TRPCError({ code: "BAD_REQUEST", message: result.error });
      }
      return result.data;
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        tripId: z.string(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        image: z.string().optional(),
        basePoints: z.number().int().min(0).optional(),
        firstPlacePoints: z.number().int().min(0).optional(),
        secondPlacePoints: z.number().int().min(0).optional(),
        thirdPlacePoints: z.number().int().min(0).optional(),
        startTime: z.coerce.date().optional(),
        endTime: z.coerce.date().optional(),
        targetLatitude: z.number().optional(),
        targetLongitude: z.number().optional(),
        expectedValue: z.string().optional(),
        autoApprove: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Using DI container to resolve ChallengeController - no manual instantiation needed
      const controller = ctx.di.resolve<ChallengeController>(
        "challengeController",
      );
      const result = await controller.update({
        challengeId: input.id,
        name: input.name,
        description: input.description,
        image: input.image,
        basePoints: input.basePoints,
        firstPlacePoints: input.firstPlacePoints,
        secondPlacePoints: input.secondPlacePoints,
        thirdPlacePoints: input.thirdPlacePoints,
        startTime: input.startTime,
        endTime: input.endTime,
        targetLatitude: input.targetLatitude,
        targetLongitude: input.targetLongitude,
        expectedValue: input.expectedValue,
        autoApprove: input.autoApprove,
      });

      if (!result.success) {
        throw new TRPCError({ code: "BAD_REQUEST", message: result.error });
      }
      return result.data;
    }),

  updateStatus: adminProcedure
    .input(
      z.object({
        id: z.string(),
        tripId: z.string(),
        newStatus: z.enum([
          "HIDDEN",
          "VISIBLE",
          "ACTIVE",
          "VOTING_PHASE",
          "COMPLETED",
          "CANCELLED",
        ]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Using DI container to resolve ChallengeController - no manual instantiation needed
      const controller = ctx.di.resolve<ChallengeController>(
        "challengeController",
      );
      const result = await controller.updateStatus({
        challengeId: input.id,
        newStatus: input.newStatus,
      });

      if (!result.success) {
        throw new TRPCError({ code: "BAD_REQUEST", message: result.error });
      }
      return result.data;
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string(), tripId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Using DI container to resolve ChallengeController - no manual instantiation needed
      const controller = ctx.di.resolve<ChallengeController>(
        "challengeController",
      );
      const result = await controller.updateStatus({
        challengeId: input.id,
        newStatus: "CANCELLED",
      });

      if (!result.success) {
        throw new TRPCError({
          code: result.error.includes("not found")
            ? "NOT_FOUND"
            : "BAD_REQUEST",
          message: result.error,
        });
      }
      return { success: true };
    }),
};
