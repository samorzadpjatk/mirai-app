/**
 * Challenge Vote Controller
 *
 * tRPC-ready controller wrapping ChallengeVoteController with proper procedure types.
 * Auth is handled at the controller level - uses publicProcedure and extracts
 * token from HTTP headers.
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure } from "../trpc";
import { ChallengeVoteController } from "../../controllers/challengeVote-controller";
import { PrismaChallengeVoteRepository } from "../../gateways/PrismaChallengeVoteRepository";
import {
  requireAuth,
  requireAdmin,
  requireModerator,
} from "../controller-helpers";

export const challengeVoteController = {
  getMyByChallenge: publicProcedure
    .input(z.object({ challengeId: z.string(), tripId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Require authentication
      const authContext = await requireAuth(ctx.headers, ctx.di);

      // Verify trip participant
      const participant = await ctx.db.tripParticipant.findUnique({
        where: {
          userId_tripId: {
            userId: authContext.userId,
            tripId: input.tripId,
          },
        },
      });

      if (!participant) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Brak dostepu do wyjazdu",
        });
      }

      const repo = new PrismaChallengeVoteRepository(ctx.db);
      const controller = new ChallengeVoteController(repo);
      const result = await controller.getMyVotes({
        challengeId: input.challengeId,
        voterId: participant.id,
      });

      if (!result.success) {
        throw new TRPCError({
          code: result.error.includes("not found")
            ? "NOT_FOUND"
            : "BAD_REQUEST",
          message: result.error,
        });
      }

      return result.data.votes;
    }),

  getByChallenge: publicProcedure
    .input(z.object({ challengeId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Require moderator or admin role
      await requireModerator(ctx.headers, ctx.di);

      const repo = new PrismaChallengeVoteRepository(ctx.db);
      const controller = new ChallengeVoteController(repo);
      const result = await controller.getByChallenge({
        challengeId: input.challengeId,
      });

      if (!result.success) {
        throw new TRPCError({
          code: result.error.includes("not found")
            ? "NOT_FOUND"
            : "BAD_REQUEST",
          message: result.error,
        });
      }

      return result.data.votes;
    }),

  submitVotes: publicProcedure
    .input(
      z.object({
        tripId: z.string(),
        challengeId: z.string(),
        votes: z
          .array(
            z.object({
              submissionId: z.string(),
              votePosition: z.number().int().min(1).max(3),
              votePoints: z.number().int().min(0),
              normalizedWeight: z.number().positive().optional(),
            }),
          )
          .min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Require authentication
      const authContext = await requireAuth(ctx.headers, ctx.di);

      // Verify trip participant
      const participant = await ctx.db.tripParticipant.findUnique({
        where: {
          userId_tripId: {
            userId: authContext.userId,
            tripId: input.tripId,
          },
        },
      });

      if (!participant) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Brak dostepu do wyjazdu",
        });
      }

      // Check for self-voting (voting on own group)
      const submissionIds = input.votes.map((v) => v.submissionId);
      const submissions = await ctx.db.challengeSubmission.findMany({
        where: {
          id: { in: submissionIds },
          challengeId: input.challengeId,
        },
        select: { id: true, groupId: true },
      });

      if (submissions.length !== submissionIds.length) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Nieprawidlowe zgloszenia",
        });
      }

      if (participant.groupId) {
        const ownSubmission = submissions.find(
          (s) => s.groupId === participant.groupId,
        );
        if (ownSubmission) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Nie mozna glosowac na wlasna grupe",
          });
        }
      }

      const repo = new PrismaChallengeVoteRepository(ctx.db);
      const controller = new ChallengeVoteController(repo);

      // Check required positions for judged staff voting
      const eligibleSubmissionsCount = await ctx.db.challengeSubmission.count({
        where: {
          challengeId: input.challengeId,
          status: { not: "REJECTED" },
        },
      });

      const requiredPositions =
        eligibleSubmissionsCount >= 2
          ? Math.min(3, eligibleSubmissionsCount)
          : 0;

      const result = await controller.submitVotes({
        challengeId: input.challengeId,
        voterId: participant.id,
        votes: input.votes.map((v) => ({
          submissionId: v.submissionId,
          position: v.votePosition,
          points: v.votePoints,
          normalizedWeight: v.normalizedWeight,
        })),
        requiredPositions,
      });

      if (!result.success) {
        const code = result.error.includes("already voted")
          ? "CONFLICT"
          : "BAD_REQUEST";
        throw new TRPCError({
          code,
          message: result.error,
        });
      }

      return result.data.votes;
    }),

  submitVote: publicProcedure
    .input(
      z.object({
        tripId: z.string(),
        challengeId: z.string(),
        submissionId: z.string(),
        votePosition: z.number().int().min(1).max(3),
        votePoints: z.number().int().min(0),
        normalizedWeight: z.number().positive().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Require authentication
      const authContext = await requireAuth(ctx.headers, ctx.di);

      // Verify trip participant
      const participant = await ctx.db.tripParticipant.findUnique({
        where: {
          userId_tripId: {
            userId: authContext.userId,
            tripId: input.tripId,
          },
        },
      });

      if (!participant) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Brak dostepu do wyjazdu",
        });
      }

      // Check for self-voting
      const submission = await ctx.db.challengeSubmission.findFirst({
        where: {
          id: input.submissionId,
          challengeId: input.challengeId,
        },
        select: { id: true, groupId: true },
      });

      if (!submission) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Submission not found",
        });
      }

      if (participant.groupId && submission.groupId === participant.groupId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Nie mozna glosowac na wlasna grupe",
        });
      }

      const repo = new PrismaChallengeVoteRepository(ctx.db);
      const controller = new ChallengeVoteController(repo);

      const result = await controller.submitVote({
        challengeId: input.challengeId,
        submissionId: input.submissionId,
        voterId: participant.id,
        position: input.votePosition,
        points: input.votePoints,
        normalizedWeight: input.normalizedWeight,
        allowPartial: false,
      });

      if (!result.success) {
        const code = result.error.includes("already")
          ? "CONFLICT"
          : "BAD_REQUEST";
        throw new TRPCError({
          code,
          message: result.error,
        });
      }

      return result.data;
    }),

  forceEndJudgedStaffVoting: publicProcedure
    .input(z.object({ challengeId: z.string(), tripId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Require admin role
      const authContext = await requireAdmin(ctx.headers, ctx.di);

      const repo = new PrismaChallengeVoteRepository(ctx.db);
      const controller = new ChallengeVoteController(
        repo,
        {
          findById: async (id: string) => {
            const c = await ctx.db.challenge.findUnique({
              where: { id },
              select: {
                id: true,
                tripId: true,
                status: true,
                scoringCategory: true,
                endTime: true,
              },
            });
            return c;
          },
          updateStatus: async (id: string, status: string) => {
            await ctx.db.challenge.updateMany({
              where: {
                id,
                tripId: input.tripId,
                scoringCategory: "JUDGED_STAFF",
              },
              data: { status },
            });
          },
        },
        {
          findByChallengeId: async (challengeId: string) => {
            return ctx.db.challengeSubmission.findMany({
              where: { challengeId },
              select: { id: true, challengeId: true, status: true },
            });
          },
          updateVoteStats: async (
            submissionId: string,
            stats: { voteCount: number; voteScore: number },
          ) => {
            await ctx.db.challengeSubmission.update({
              where: { id: submissionId },
              data: {
                voteCount: stats.voteCount,
                voteScore: stats.voteScore,
              },
            });
          },
        },
      );

      const result = await controller.forceEndVoting({
        challengeId: input.challengeId,
        tripId: input.tripId,
        adminId: authContext.userId,
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
};
