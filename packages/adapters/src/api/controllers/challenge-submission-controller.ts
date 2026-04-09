/**
 * Challenge Submission Controller
 *
 * tRPC-ready controller wrapping ChallengeSubmissionController with proper procedure types.
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  protectedProcedure,
  moderatorProcedure,
  adminProcedure,
} from "../trpc";
import { ChallengeSubmissionController } from "../../controllers/challengeSubmission-controller";
import { PrismaChallengeSubmissionRepository } from "../../gateways/PrismaChallengeSubmissionRepository";

export const challengeSubmissionController = {
  getById: protectedProcedure
    .input(z.object({ id: z.string(), tripId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Verify trip participant
      const participant = await ctx.db.tripParticipant.findUnique({
        where: {
          userId_tripId: {
            userId: ctx.dbUser.id,
            tripId: input.tripId,
          },
        },
      });

      if (!participant) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not a participant of this trip",
        });
      }

      const repo = new PrismaChallengeSubmissionRepository(ctx.db);
      const controller = new ChallengeSubmissionController(repo);
      const result = await controller.getById({ submissionId: input.id });

      if (!result.success) {
        throw new TRPCError({
          code: result.error.includes("not found")
            ? "NOT_FOUND"
            : "BAD_REQUEST",
          message: result.error,
        });
      }

      // Verify submission belongs to the trip via challenge
      const challenge = await ctx.db.challenge.findFirst({
        where: {
          id: result.data.challengeId,
          tripId: input.tripId,
        },
        select: { id: true },
      });

      if (!challenge) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Submission not found in this trip",
        });
      }

      return result.data;
    }),

  getByChallenge: protectedProcedure
    .input(z.object({ challengeId: z.string(), tripId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Verify trip participant
      const participant = await ctx.db.tripParticipant.findUnique({
        where: {
          userId_tripId: {
            userId: ctx.dbUser.id,
            tripId: input.tripId,
          },
        },
      });

      if (!participant) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not a participant of this trip",
        });
      }

      // Verify challenge exists in trip
      const challenge = await ctx.db.challenge.findFirst({
        where: {
          id: input.challengeId,
          tripId: input.tripId,
        },
        select: { id: true },
      });

      if (!challenge) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Challenge not found in this trip",
        });
      }

      const repo = new PrismaChallengeSubmissionRepository(ctx.db);
      const controller = new ChallengeSubmissionController(repo);
      const result = await controller.listByChallenge({
        challengeId: input.challengeId,
      });

      if (!result.success) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: result.error,
        });
      }

      // Hide media from unapproved submissions for non-moderators
      const isModerator =
        ctx.dbUser.role === "ADMIN" || ctx.dbUser.role === "MODERATOR";
      if (!isModerator) {
        return {
          submissions: result.data.submissions.map((submission) =>
            submission.status === "APPROVED"
              ? submission
              : {
                  ...submission,
                  imageIds: [],
                  videoId: null,
                },
          ),
          totalCount: result.data.totalCount,
        };
      }

      return result.data;
    }),

  getByChallengeForAdmin: moderatorProcedure
    .input(z.object({ challengeId: z.string(), tripId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Verify challenge exists in trip
      const challenge = await ctx.db.challenge.findFirst({
        where: {
          id: input.challengeId,
          tripId: input.tripId,
        },
        select: { id: true },
      });

      if (!challenge) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Challenge not found in this trip",
        });
      }

      const repo = new PrismaChallengeSubmissionRepository(ctx.db);
      const controller = new ChallengeSubmissionController(repo);
      const result = await controller.listByChallenge({
        challengeId: input.challengeId,
      });

      if (!result.success) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: result.error,
        });
      }

      return result.data.submissions;
    }),

  getMyForChallenge: protectedProcedure
    .input(z.object({ challengeId: z.string(), tripId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Verify trip participant
      const participant = await ctx.db.tripParticipant.findUnique({
        where: {
          userId_tripId: {
            userId: ctx.dbUser.id,
            tripId: input.tripId,
          },
        },
      });

      if (!participant) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not a participant of this trip",
        });
      }

      if (!participant.groupId) {
        return null;
      }

      // Verify challenge exists in trip
      const challenge = await ctx.db.challenge.findFirst({
        where: {
          id: input.challengeId,
          tripId: input.tripId,
        },
        select: { id: true },
      });

      if (!challenge) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Challenge not found in this trip",
        });
      }

      const repo = new PrismaChallengeSubmissionRepository(ctx.db);
      const controller = new ChallengeSubmissionController(repo);
      const result = await controller.getByChallengeAndGroup({
        challengeId: input.challengeId,
        groupId: participant.groupId,
      });

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

  create: protectedProcedure
    .input(
      z.object({
        tripId: z.string(),
        challengeId: z.string(),
        imageIds: z.array(z.string().min(1)).optional(),
        videoId: z.string().min(1).optional(),
        textContent: z.string().optional(),
        latitude: z.number().optional(),
        longitude: z.number().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Verify trip not ended
      const trip = await ctx.db.trip.findUnique({
        where: { id: input.tripId },
        select: { status: true },
      });

      if (trip?.status === "COMPLETED") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Cannot submit to completed trip",
        });
      }

      // Verify trip participant
      const participant = await ctx.db.tripParticipant.findUnique({
        where: {
          userId_tripId: {
            userId: ctx.dbUser.id,
            tripId: input.tripId,
          },
        },
      });

      if (!participant) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not a participant of this trip",
        });
      }

      if (!participant.groupId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "User is not assigned to a group",
        });
      }

      // Verify challenge exists and is active
      const challenge = await ctx.db.challenge.findFirst({
        where: {
          id: input.challengeId,
          tripId: input.tripId,
          status: "ACTIVE",
        },
        select: {
          id: true,
          endTime: true,
          submissionType: true,
        },
      });

      if (!challenge) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Challenge not found or not active",
        });
      }

      if (challenge.endTime && challenge.endTime <= new Date()) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Submission window has ended",
        });
      }

      const repo = new PrismaChallengeSubmissionRepository(ctx.db);
      const controller = new ChallengeSubmissionController(repo);
      const result = await controller.create({
        challengeId: input.challengeId,
        groupId: participant.groupId,
        imageIds: input.imageIds,
        videoId: input.videoId,
        textContent: input.textContent,
        latitude: input.latitude,
        longitude: input.longitude,
      });

      if (!result.success) {
        throw new TRPCError({
          code: result.error.includes("already exists")
            ? "CONFLICT"
            : "BAD_REQUEST",
          message: result.error,
        });
      }

      return result.data;
    }),

  review: moderatorProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(["APPROVED", "REJECTED"]),
        rejectionReason: z.string().optional(),
        awardedPoints: z.number().int().min(0).optional(),
        bonusPoints: z.number().int().min(0).optional(),
        ranking: z.number().int().min(1).max(3).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.status === "REJECTED" && !input.rejectionReason) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Rejection reason is required",
        });
      }

      const repo = new PrismaChallengeSubmissionRepository(ctx.db);
      const controller = new ChallengeSubmissionController(repo);
      const result = await controller.update({
        submissionId: input.id,
        reviewAction: input.status === "APPROVED" ? "APPROVE" : "REJECT",
        reviewedById: ctx.dbUser.id,
        rejectionReason: input.rejectionReason,
        awardedPoints: input.awardedPoints,
        bonusPoints: input.bonusPoints,
        ranking: input.ranking ?? null,
      });

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

  adminDelete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const repo = new PrismaChallengeSubmissionRepository(ctx.db);
      const controller = new ChallengeSubmissionController(repo);
      const result = await controller.delete({ submissionId: input.id });

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
