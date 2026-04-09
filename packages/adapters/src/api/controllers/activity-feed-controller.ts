/**
 * Activity Feed Controller
 *
 * tRPC-ready controller wrapping ActivityFeedController with proper procedure types.
 * Auth is handled at the controller level - uses publicProcedure and extracts
 * token from HTTP headers.
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure } from "../trpc";
import { ActivityFeedController } from "../../controllers/activityFeed-controller";
import { PrismaActivityFeedRepository } from "../../gateways/PrismaActivityFeedRepository";
import {
  requireAuth,
  requireAdmin,
  requireModerator,
} from "../controller-helpers";

const activityCursorSchema = z.object({
  id: z.string(),
  createdAt: z.coerce.date(),
  isPinned: z.boolean(),
});

export const activityFeedController = {
  getByTrip: publicProcedure
    .input(
      z.object({
        tripId: z.string(),
        page: z.number().int().min(1).default(1),
        pageSize: z.number().int().min(1).max(100).default(30),
        cursor: activityCursorSchema.optional(),
      }),
    )
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
          message: "You are not a participant of this trip",
        });
      }

      const repo = new PrismaActivityFeedRepository(ctx.db);
      const controller = new ActivityFeedController(repo);

      // Use cursor pagination if provided, otherwise use page-based
      const result = await controller.getByTrip({
        tripId: input.tripId,
        pageSize: input.pageSize,
        cursor: input.cursor ?? null,
      });

      if (!result.success) {
        throw new TRPCError({
          code: result.error.includes("not found")
            ? "NOT_FOUND"
            : "BAD_REQUEST",
          message: result.error,
        });
      }

      // Update user's last seen
      await ctx.db.$executeRaw`
        UPDATE "User"
        SET "last_seen_on" = NOW()
        WHERE "id" = ${authContext.userId}
      `;

      return result.data;
    }),

  getByTripModeration: publicProcedure
    .input(
      z.object({
        tripId: z.string(),
        page: z.number().int().min(1).default(1),
        pageSize: z.number().int().min(1).max(100).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      // Require moderator or admin role
      await requireModerator(ctx.headers, ctx.di);

      // Verify trip exists
      const trip = await ctx.db.trip.findUnique({
        where: { id: input.tripId },
        select: { id: true },
      });

      if (!trip) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Trip not found",
        });
      }

      const repo = new PrismaActivityFeedRepository(ctx.db);

      // Use page-based pagination for moderation view
      const result = await repo.findByTripIdPaged(input.tripId, {
        page: input.page,
        pageSize: input.pageSize,
        includeHidden: true,
      });

      return {
        activities: result.activities.map(
          (activity: {
            id: string;
            tripId: string;
            activityType: string;
            title: string;
            description: string | null;
            imageUrl: string | null;
            isPinned: boolean;
            isHidden: boolean;
            createdAt: Date;
            updatedAt: Date;
            admin: unknown;
          }) => ({
            id: activity.id,
            tripId: activity.tripId,
            activityType: activity.activityType,
            title: activity.title,
            description: activity.description,
            imageUrl: activity.imageUrl,
            isPinned: activity.isPinned,
            isHidden: activity.isHidden,
            createdAt: activity.createdAt,
            updatedAt: activity.updatedAt,
            admin: activity.admin,
          }),
        ),
        pagination: {
          total: result.total,
          page: result.page,
          pageSize: result.pageSize,
          totalPages: result.totalPages,
          hasMore: result.hasMore,
        },
      };
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      // Require moderator or admin role
      await requireModerator(ctx.headers, ctx.di);

      const repo = new PrismaActivityFeedRepository(ctx.db);
      const controller = new ActivityFeedController(repo);
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

  createCustom: publicProcedure
    .input(
      z.object({
        tripId: z.string(),
        title: z.string().trim().min(1),
        description: z.string().trim().optional(),
        imageUrl: z.string().optional(),
        isPinned: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Require moderator or admin role
      const authContext = await requireModerator(ctx.headers, ctx.di);

      // Verify trip exists
      const trip = await ctx.db.trip.findUnique({
        where: { id: input.tripId },
        select: { id: true },
      });

      if (!trip) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Trip not found",
        });
      }

      const repo = new PrismaActivityFeedRepository(ctx.db);
      const controller = new ActivityFeedController(repo);
      const result = await controller.createCustom({
        ...input,
        createdByAdmin: authContext.userId,
      });

      if (!result.success) {
        throw new TRPCError({ code: "BAD_REQUEST", message: result.error });
      }

      return result.data;
    }),

  createUserPost: publicProcedure
    .input(
      z.object({
        tripId: z.string(),
        title: z.string().trim().min(1),
        description: z.string().trim().optional(),
        imageUrl: z.string().optional(),
        additionalImages: z.array(z.string()).max(10).optional(),
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
        include: {
          group: true,
          user: true,
        },
      });

      if (!participant) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not a participant of this trip",
        });
      }

      const repo = new PrismaActivityFeedRepository(ctx.db);
      const controller = new ActivityFeedController(repo);
      const result = await controller.createUserPost({
        tripId: input.tripId,
        title: input.title,
        description: input.description ?? null,
        imageUrl: input.imageUrl ?? null,
        userPost: {
          authorId: participant.id,
          authorUserId: authContext.userId,
          authorFirstName: participant.user.firstName ?? "",
          authorLastName: participant.user.lastName ?? "",
          authorHasAvatar: participant.user.hasAvatar,
          groupId: participant.groupId,
          groupName: participant.group?.name ?? null,
          additionalImages: input.additionalImages ?? [],
        },
      });

      if (!result.success) {
        throw new TRPCError({ code: "BAD_REQUEST", message: result.error });
      }

      return result.data;
    }),

  createSubmissionActivity: publicProcedure
    .input(
      z.object({
        tripId: z.string(),
        submissionId: z.string(),
        challengeId: z.string(),
        groupId: z.string(),
        title: z.string().trim().min(1),
        description: z.string().trim().optional(),
        imageUrl: z.string().optional(),
        hasVideo: z.boolean().optional(),
        isWinner: z.boolean().optional(),
        ranking: z.number().int().min(1).optional(),
        pointsAwarded: z.number().int().min(0).optional(),
        isPinned: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Require moderator or admin role
      const authContext = await requireModerator(ctx.headers, ctx.di);

      // Verify submission exists in the trip
      const submission = await ctx.db.challengeSubmission.findFirst({
        where: {
          id: input.submissionId,
          challengeId: input.challengeId,
          groupId: input.groupId,
          challenge: {
            tripId: input.tripId,
          },
        },
        select: {
          id: true,
          videoId: true,
          imageIds: true,
        },
      });

      if (!submission) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Submission not found in selected trip",
        });
      }

      const repo = new PrismaActivityFeedRepository(ctx.db);
      const controller = new ActivityFeedController(repo);
      const result = await controller.createSubmission({
        tripId: input.tripId,
        title: input.title,
        description: input.description ?? null,
        imageUrl: submission.imageIds[0] ?? input.imageUrl ?? null,
        isPinned: input.isPinned ?? false,
        createdByAdmin: authContext.userId,
        submissionActivity: {
          submissionId: input.submissionId,
          challengeId: input.challengeId,
          groupId: input.groupId,
          hasVideo: input.hasVideo ?? Boolean(submission.videoId),
          isWinner: input.isWinner ?? null,
          ranking: input.ranking ?? null,
          pointsAwarded: input.pointsAwarded ?? null,
        },
      });

      if (!result.success) {
        throw new TRPCError({ code: "BAD_REQUEST", message: result.error });
      }

      return result.data;
    }),

  createChallengeActivity: publicProcedure
    .input(
      z.object({
        tripId: z.string(),
        challengeId: z.string(),
        eventType: z.enum(["challenge_started", "voting_started", "completed"]),
        title: z.string().trim().min(1),
        description: z.string().trim().optional(),
        endTime: z.coerce.date().optional(),
        submissionType: z
          .enum([
            "IMAGE",
            "MULTI_IMAGE",
            "VIDEO",
            "TEXT",
            "IMAGE_LOCATION",
            "LOCATION",
            "QR_CODE",
          ])
          .optional(),
        basePoints: z.number().int().min(0).optional(),
        submissionCount: z.number().int().min(0).optional(),
        isPinned: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Require moderator or admin role
      const authContext = await requireModerator(ctx.headers, ctx.di);

      // Verify challenge exists in the trip
      const challenge = await ctx.db.challenge.findFirst({
        where: {
          id: input.challengeId,
          tripId: input.tripId,
        },
        select: {
          id: true,
          description: true,
          image: true,
          endTime: true,
          submissionType: true,
          basePoints: true,
        },
      });

      if (!challenge) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Challenge not found in selected trip",
        });
      }

      const repo = new PrismaActivityFeedRepository(ctx.db);
      const controller = new ActivityFeedController(repo);
      const result = await controller.createChallengeEvent({
        tripId: input.tripId,
        title: input.title,
        description: input.description ?? challenge.description ?? null,
        imageUrl: challenge.image ?? null,
        isPinned: input.isPinned ?? false,
        createdByAdmin: authContext.userId,
        challengeActivity: {
          challengeId: input.challengeId,
          eventType: input.eventType,
          endTime: input.endTime ?? challenge.endTime ?? null,
          submissionType:
            input.submissionType ?? challenge.submissionType ?? null,
          basePoints: input.basePoints ?? challenge.basePoints ?? null,
          submissionCount: input.submissionCount ?? null,
        },
      });

      if (!result.success) {
        throw new TRPCError({ code: "BAD_REQUEST", message: result.error });
      }

      return result.data;
    }),

  createRankChangeActivity: publicProcedure
    .input(
      z.object({
        tripId: z.string(),
        groupId: z.string(),
        newRank: z.number().int().min(1),
        totalCoins: z.number().int().min(0),
        coinsGained: z.number().int(),
        title: z.string().trim().min(1),
        description: z.string().trim().optional(),
        isPinned: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Require moderator or admin role
      const authContext = await requireModerator(ctx.headers, ctx.di);

      // Verify group exists in the trip
      const group = await ctx.db.group.findFirst({
        where: {
          id: input.groupId,
          tripId: input.tripId,
        },
        select: {
          id: true,
          image: true,
        },
      });

      if (!group) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Group not found in selected trip",
        });
      }

      const repo = new PrismaActivityFeedRepository(ctx.db);
      const controller = new ActivityFeedController(repo);
      const result = await controller.createRankChange({
        tripId: input.tripId,
        title: input.title,
        description: input.description ?? null,
        imageUrl: group.image ?? null,
        isPinned: input.isPinned ?? false,
        createdByAdmin: authContext.userId,
        rankChangeActivity: {
          groupId: input.groupId,
          newRank: input.newRank,
          totalCoins: input.totalCoins,
          coinsGained: input.coinsGained,
        },
      });

      if (!result.success) {
        throw new TRPCError({ code: "BAD_REQUEST", message: result.error });
      }

      return result.data;
    }),

  update: publicProcedure
    .input(
      z.object({
        activityId: z.string(),
        title: z.string().trim().min(1).optional(),
        description: z.string().trim().nullable().optional(),
        isPinned: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Require moderator or admin role
      await requireModerator(ctx.headers, ctx.di);

      const repo = new PrismaActivityFeedRepository(ctx.db);
      const controller = new ActivityFeedController(repo);
      const result = await controller.update({
        activityId: input.activityId,
        title: input.title,
        description: input.description,
        isPinned: input.isPinned,
      });

      if (!result.success) {
        throw new TRPCError({ code: "BAD_REQUEST", message: result.error });
      }

      return result.data;
    }),

  setPinned: publicProcedure
    .input(
      z.object({
        activityId: z.string(),
        isPinned: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Require moderator or admin role
      await requireModerator(ctx.headers, ctx.di);

      const repo = new PrismaActivityFeedRepository(ctx.db);
      const controller = new ActivityFeedController(repo);
      const result = await controller.setPinned({
        activityId: input.activityId,
        isPinned: input.isPinned,
      });

      if (!result.success) {
        throw new TRPCError({ code: "BAD_REQUEST", message: result.error });
      }

      return result.data;
    }),

  hide: publicProcedure
    .input(
      z.object({
        activityId: z.string(),
        reason: z.string().trim().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Require moderator or admin role
      const authContext = await requireModerator(ctx.headers, ctx.di);

      const repo = new PrismaActivityFeedRepository(ctx.db);
      const controller = new ActivityFeedController(repo);
      const result = await controller.hide({
        activityId: input.activityId,
        hiddenByAdmin: authContext.userId,
        reason: input.reason ?? null,
      });

      if (!result.success) {
        throw new TRPCError({ code: "BAD_REQUEST", message: result.error });
      }

      return result.data;
    }),

  unhide: publicProcedure
    .input(z.object({ activityId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Require moderator or admin role
      await requireModerator(ctx.headers, ctx.di);

      const repo = new PrismaActivityFeedRepository(ctx.db);
      const controller = new ActivityFeedController(repo);
      const result = await controller.unhide({
        activityId: input.activityId,
      });

      if (!result.success) {
        throw new TRPCError({ code: "BAD_REQUEST", message: result.error });
      }

      return result.data;
    }),

  toggleReaction: publicProcedure
    .input(
      z.object({
        activityId: z.string(),
        reactionType: z.enum(["heart", "fire", "clap", "star"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Require authentication
      const authContext = await requireAuth(ctx.headers, ctx.di);

      const repo = new PrismaActivityFeedRepository(ctx.db);
      const controller = new ActivityFeedController(repo);
      const result = await controller.toggleReaction({
        activityId: input.activityId,
        userId: authContext.userId,
        reactionType: input.reactionType,
      });

      if (!result.success) {
        throw new TRPCError({
          code: result.error.includes("not found")
            ? "NOT_FOUND"
            : result.error.includes("hidden")
              ? "FORBIDDEN"
              : "BAD_REQUEST",
          message: result.error,
        });
      }

      return result.data;
    }),

  delete: publicProcedure
    .input(z.object({ activityId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Require admin role
      await requireAdmin(ctx.headers, ctx.di);

      const repo = new PrismaActivityFeedRepository(ctx.db);
      const controller = new ActivityFeedController(repo);
      const result = await controller.delete({
        activityId: input.activityId,
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
