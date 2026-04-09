/**
 * tRPC Controller Wrappers
 *
 * This module exports tRPC-ready controller objects that wrap the Clean Architecture
 * controllers with proper procedure types and context injection.
 *
 * Each controller object contains methods that are already wrapped as tRPC procedures,
 * making them easy to spread into createTRPCRouter().
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  protectedProcedure,
  adminProcedure,
  moderatorProcedure,
  publicProcedure,
} from "../trpc";

// Controllers
import { UserController } from "../../controllers/user-controller";
import { ChallengeController } from "../../controllers/challenge-controller";
import { NotificationController } from "../../controllers/notification-controller";
import { TripController } from "../../controllers/trip-controller";
import { GroupController } from "../../controllers/group-controller";
import { ActivityFeedController } from "../../controllers/activityFeed-controller";
import { ChallengeSubmissionController } from "../../controllers/challengeSubmission-controller";
import { ChallengeVoteController } from "../../controllers/challengeVote-controller";
import { StorageController } from "../../controllers/storage-controller";
import { CoinTransactionController } from "../../controllers/coin-transaction-controller";
import { SponsorController } from "../../controllers/sponsor-controller";
import { LocationController } from "../../controllers/location-controller";
import { NotificationDeliveryController } from "../../controllers/notification-delivery-controller";

// Repositories
import { PrismaUserRepository } from "../../gateways/PrismaUserRepository";
import { PrismaChallengeRepository } from "../../gateways/PrismaChallengeRepository";
import { PrismaGroupRepository } from "../../gateways/PrismaGroupRepository";
import { PrismaTripRepository } from "../../gateways/PrismaTripRepository";
import { PrismaNotificationRepository } from "../../gateways/PrismaNotificationRepository";
import { PrismaActivityFeedRepository } from "../../gateways/PrismaActivityFeedRepository";
import { PrismaChallengeSubmissionRepository } from "../../gateways/PrismaChallengeSubmissionRepository";
import { PrismaChallengeVoteRepository } from "../../gateways/PrismaChallengeVoteRepository";
import { PrismaCoinTransactionRepository } from "../../gateways/PrismaCoinTransactionRepository";
import { PrismaSponsorRepository } from "../../gateways/PrismaSponsorRepository";
import { PrismaLocationRepository } from "../../gateways/PrismaLocationRepository";
import { PrismaNotificationDeliveryRepository } from "../../gateways/PrismaNotificationDeliveryRepository";

// Services
import { PrismaCoinTransactionService } from "../../services/PrismaCoinTransactionService";
import { PrismaNotificationSenderService } from "../../services/PrismaNotificationSenderService";
import { PrismaCoinService } from "../../services/PrismaCoinService";
import { PrismaRankingActivityService } from "../../services/PrismaRankingActivityService";
import { NotificationService } from "../../services/notificationService";

// Use Cases (from use-cases package)
import {
  GetCoinStatisticsUseCase,
  GetMostActiveAdminStatsUseCase,
  GetCoinTransactionsUseCase,
  GetCoinQuickStatsUseCase,
  GetCoinAdditionalInsightsUseCase,
  GetDeliveriesUseCase,
  GetDeliveryByNotificationIdUseCase,
  GetDeliveryStatsUseCase,
  GetFailedDeliveriesUseCase,
  AddCoinsUseCase,
  RemoveCoinsUseCase,
} from "@repo/use-cases";

// ============================================================================
// User Controller
// ============================================================================

export const userController = {
  getById: moderatorProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const repo = new PrismaUserRepository(ctx.db);
      const controller = new UserController(repo);
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

// ============================================================================
// Storage Controller
// ============================================================================

export const storageController = {
  createUploadUrl: protectedProcedure
    .input(
      z.object({
        storagePath: z.string().min(1),
        upsert: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const controller = new StorageController(ctx.supabase);
      const result = await controller.createUploadUrl({
        storagePath: input.storagePath,
        upsert: input.upsert,
      });

      if (!result.success) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: result.error,
        });
      }
      return result.data;
    }),

  createDownloadUrl: protectedProcedure
    .input(
      z.object({
        storagePath: z.string().min(1),
        expiresInSeconds: z
          .number()
          .int()
          .min(60)
          .max(60 * 60)
          .optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const controller = new StorageController(ctx.supabase);
      const result = await controller.createDownloadUrl({
        storagePath: input.storagePath,
        expiresInSeconds: input.expiresInSeconds,
      });

      if (!result.success) {
        throw new TRPCError({
          code: result.code ?? "BAD_REQUEST",
          message: result.error,
        });
      }
      return result.data;
    }),

  createPublicUrl: protectedProcedure
    .input(
      z.object({
        storagePath: z.string().min(1),
      }),
    )
    .query(async ({ ctx, input }) => {
      const controller = new StorageController(ctx.supabase);
      const result = await controller.createPublicUrl({
        storagePath: input.storagePath,
      });

      if (!result.success) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: result.error,
        });
      }
      return result.data;
    }),
};

// ============================================================================
// Challenge Controller
// ============================================================================

export const challengeController = {
  getAll: adminProcedure.query(async ({ ctx }) => {
    const repo = new PrismaChallengeRepository(ctx.db);
    const controller = new ChallengeController(repo);
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
      const repo = new PrismaChallengeRepository(ctx.db);
      const controller = new ChallengeController(repo);
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
      const repo = new PrismaChallengeRepository(ctx.db);
      const controller = new ChallengeController(repo);
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
      const repo = new PrismaChallengeRepository(ctx.db);
      const controller = new ChallengeController(repo);
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
      const repo = new PrismaChallengeRepository(ctx.db);
      const controller = new ChallengeController(repo);
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
      const repo = new PrismaChallengeRepository(ctx.db);
      const controller = new ChallengeController(repo);
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
      const repo = new PrismaChallengeRepository(ctx.db);
      const controller = new ChallengeController(repo);
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

// ============================================================================
// Group Controller
// ============================================================================

export const groupController = {
  getAllNames: moderatorProcedure
    .input(z.object({ tripId: z.string() }))
    .query(async ({ ctx, input }) => {
      const repo = new PrismaGroupRepository(ctx.db);
      const groups = await repo.findByTripId(input.tripId);
      return groups.map((g) => ({ id: g.id, name: g.name }));
    }),

  getAll: protectedProcedure
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
      const repo = new PrismaGroupRepository(ctx.db);
      const controller = new GroupController(repo);
      const result = await controller.getByTripId({ tripId: input.tripId });

      if (!result.success) {
        throw new TRPCError({ code: "BAD_REQUEST", message: result.error });
      }
      return {
        groups: result.data,
        pagination: {
          total: result.data.length,
          limit: input.pagination?.limit ?? 30,
          offset: input.pagination?.offset ?? 0,
          hasMore: false,
        },
      };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const repo = new PrismaGroupRepository(ctx.db);
      const controller = new GroupController(repo);
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

  create: protectedProcedure
    .input(
      z.object({
        tripId: z.string(),
        name: z.string().min(1),
        description: z.string().optional(),
        image: z.string().optional(),
        organizerId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const repo = new PrismaGroupRepository(ctx.db);
      const controller = new GroupController(repo);

      // Generate a unique code
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();

      const result = await controller.create({
        tripId: input.tripId,
        name: input.name,
        description: input.description ?? null,
        image: input.image ?? null,
        organizerId: input.organizerId ?? ctx.dbUser.id,
        code,
        coins: 0,
      });

      if (!result.success) {
        throw new TRPCError({ code: "BAD_REQUEST", message: result.error });
      }
      return result.data;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        tripId: z.string(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        image: z.string().optional(),
        organizerId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const repo = new PrismaGroupRepository(ctx.db);
      const controller = new GroupController(repo);
      const result = await controller.update({
        groupId: input.id,
        name: input.name,
        description: input.description,
        image: input.image,
      });

      if (!result.success) {
        throw new TRPCError({ code: "BAD_REQUEST", message: result.error });
      }
      return result.data;
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const repo = new PrismaGroupRepository(ctx.db);
      const controller = new GroupController(repo);
      const result = await controller.delete({ id: input.id });

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

  addCoins: moderatorProcedure
    .input(
      z.object({
        groupId: z.string(),
        amount: z.number().min(1),
        tripId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const repo = new PrismaGroupRepository(ctx.db);
      const controller = new GroupController(repo);
      const result = await controller.addCoins({
        groupId: input.groupId,
        amount: input.amount,
      });

      if (!result.success) {
        throw new TRPCError({ code: "BAD_REQUEST", message: result.error });
      }
      return result.data;
    }),

  ranking: protectedProcedure
    .input(z.object({ tripId: z.string() }))
    .query(async ({ ctx, input }) => {
      const repo = new PrismaGroupRepository(ctx.db);
      const groups = await repo.findByTripId(input.tripId);
      return {
        data: groups.sort((a, b) => b.coins - a.coins),
        currentDate: new Date(),
      };
    }),
};

// ============================================================================
// Trip Controller
// ============================================================================

export const tripController = {
  getAll: protectedProcedure
    .input(
      z
        .object({
          pagination: z
            .object({
              limit: z.number().int().min(1).max(100).default(30),
              offset: z.number().int().min(0).default(0),
            })
            .optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const repo = new PrismaTripRepository(ctx.db);
      const controller = new TripController(repo);
      const result = await controller.list({
        limit: input?.pagination?.limit ?? 30,
        offset: input?.pagination?.offset ?? 0,
      });

      if (!result.success) {
        throw new TRPCError({ code: "BAD_REQUEST", message: result.error });
      }

      // Filter trips where user is a participant
      const userTrips = [];
      for (const trip of result.data) {
        const participant = await ctx.db.tripParticipant.findUnique({
          where: { userId_tripId: { userId: ctx.dbUser.id, tripId: trip.id } },
        });
        if (participant) {
          userTrips.push(trip);
        }
      }

      return {
        trips: userTrips,
        pagination: {
          total: userTrips.length,
          limit: input?.pagination?.limit ?? 30,
          offset: input?.pagination?.offset ?? 0,
          hasMore: false,
        },
      };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const repo = new PrismaTripRepository(ctx.db);
      const controller = new TripController(repo);
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

  getByIdAdmin: adminProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const repo = new PrismaTripRepository(ctx.db);
      const controller = new TripController(repo);
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
        name: z.string().min(1),
        description: z.string().optional(),
        startDate: z.coerce.date(),
        endDate: z.coerce.date(),
        backgroundImagePath: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const repo = new PrismaTripRepository(ctx.db);
      const controller = new TripController(repo);
      const result = await controller.create({
        name: input.name,
        description: input.description ?? null,
        startDate: input.startDate,
        endDate: input.endDate,
        backgroundImagePath: input.backgroundImagePath ?? null,
        status: "PLANNING",
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
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        startDate: z.coerce.date().optional(),
        endDate: z.coerce.date().optional(),
        backgroundImagePath: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const repo = new PrismaTripRepository(ctx.db);
      const controller = new TripController(repo);
      const result = await controller.update({
        tripId: input.id,
        name: input.name,
        description: input.description,
        startDate: input.startDate,
        endDate: input.endDate,
        backgroundImagePath: input.backgroundImagePath,
      });

      if (!result.success) {
        throw new TRPCError({ code: "BAD_REQUEST", message: result.error });
      }
      return result.data;
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const repo = new PrismaTripRepository(ctx.db);
      const controller = new TripController(repo);
      const result = await controller.delete({ id: input.id });

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

// ============================================================================
// Notification Controller
// ============================================================================

export const notificationController = {
  getAllMy: protectedProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      const repo = new PrismaNotificationRepository(ctx.db);
      const controller = new NotificationController(repo);
      const result = await controller.list({
        limit: input.pageSize,
        offset: (input.page - 1) * input.pageSize,
      });

      if (!result.success) {
        throw new TRPCError({ code: "BAD_REQUEST", message: result.error });
      }
      return {
        notifications: result.data,
        pagination: {
          total: result.data.length,
          page: input.page,
          pageSize: input.pageSize,
          totalPages: Math.ceil(result.data.length / input.pageSize),
        },
      };
    }),

  getAll: adminProcedure
    .input(
      z
        .object({
          tripId: z.string().optional(),
          pagination: z
            .object({
              limit: z.number().int().min(1).max(100).default(50),
              offset: z.number().int().min(0).default(0),
            })
            .optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const repo = new PrismaNotificationRepository(ctx.db);
      const controller = new NotificationController(repo);

      if (input?.tripId) {
        const result = await controller.getByTripId({ tripId: input.tripId });
        if (!result.success) {
          throw new TRPCError({ code: "BAD_REQUEST", message: result.error });
        }
        return {
          notifications: result.data,
          pagination: {
            total: result.data.length,
            limit: input?.pagination?.limit ?? 50,
            offset: input?.pagination?.offset ?? 0,
            hasMore: false,
          },
        };
      }

      const result = await controller.list({
        limit: input?.pagination?.limit ?? 50,
        offset: input?.pagination?.offset ?? 0,
      });

      if (!result.success) {
        throw new TRPCError({ code: "BAD_REQUEST", message: result.error });
      }
      return {
        notifications: result.data,
        pagination: {
          total: result.data.length,
          limit: input?.pagination?.limit ?? 50,
          offset: input?.pagination?.offset ?? 0,
          hasMore: false,
        },
      };
    }),

  create: moderatorProcedure
    .input(
      z.object({
        title: z.string().min(1),
        body: z.string().min(1),
        url: z.string().optional(),
        tripId: z.string().optional(),
        priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).default("NORMAL"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const repo = new PrismaNotificationRepository(ctx.db);
      const controller = new NotificationController(repo);
      const result = await controller.create({
        ...input,
        createdById: ctx.dbUser.id,
        scheduledFor: null,
      });

      if (!result.success) {
        throw new TRPCError({ code: "BAD_REQUEST", message: result.error });
      }
      return result.data;
    }),

  update: adminProcedure
    .input(
      z.object({
        notificationId: z.string(),
        title: z.string().min(1).optional(),
        body: z.string().min(1).optional(),
        url: z.string().optional(),
        priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const repo = new PrismaNotificationRepository(ctx.db);
      const controller = new NotificationController(repo);
      const result = await controller.update({
        notificationId: input.notificationId,
        title: input.title,
        body: input.body,
        url: input.url,
        priority: input.priority,
      });

      if (!result.success) {
        throw new TRPCError({ code: "BAD_REQUEST", message: result.error });
      }
      return result.data;
    }),

  updateStatus: adminProcedure
    .input(
      z.object({
        notificationId: z.string(),
        newStatus: z.enum(["DRAFT", "READY", "SENT", "FAILED", "CANCELLED"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const repo = new PrismaNotificationRepository(ctx.db);
      const controller = new NotificationController(repo);
      const result = await controller.updateStatus({
        notificationId: input.notificationId,
        newStatus: input.newStatus,
      });

      if (!result.success) {
        throw new TRPCError({ code: "BAD_REQUEST", message: result.error });
      }
      return result.data;
    }),

  delete: adminProcedure
    .input(z.object({ notificationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const repo = new PrismaNotificationRepository(ctx.db);
      const controller = new NotificationController(repo);
      const result = await controller.delete({ id: input.notificationId });

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

// ============================================================================
// Activity Feed Controller
// ============================================================================

const activityCursorSchema = z.object({
  id: z.string(),
  createdAt: z.coerce.date(),
  isPinned: z.boolean(),
});

export const activityFeedController = {
  getByTrip: protectedProcedure
    .input(
      z.object({
        tripId: z.string(),
        page: z.number().int().min(1).default(1),
        pageSize: z.number().int().min(1).max(100).default(30),
        cursor: activityCursorSchema.optional(),
      }),
    )
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
        WHERE "id" = ${ctx.dbUser.id}
      `;

      return result.data;
    }),

  getByTripModeration: moderatorProcedure
    .input(
      z.object({
        tripId: z.string(),
        page: z.number().int().min(1).default(1),
        pageSize: z.number().int().min(1).max(100).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
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
        activities: result.activities.map((activity) => ({
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
        })),
        pagination: {
          total: result.total,
          page: result.page,
          pageSize: result.pageSize,
          totalPages: result.totalPages,
          hasMore: result.hasMore,
        },
      };
    }),

  getById: moderatorProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
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

  createCustom: moderatorProcedure
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
        createdByAdmin: ctx.dbUser.id,
      });

      if (!result.success) {
        throw new TRPCError({ code: "BAD_REQUEST", message: result.error });
      }

      return result.data;
    }),

  createUserPost: protectedProcedure
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
      // Verify trip participant
      const participant = await ctx.db.tripParticipant.findUnique({
        where: {
          userId_tripId: {
            userId: ctx.dbUser.id,
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
          authorUserId: ctx.dbUser.id,
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

  createSubmissionActivity: moderatorProcedure
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
        createdByAdmin: ctx.dbUser.id,
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

  createChallengeActivity: moderatorProcedure
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
        createdByAdmin: ctx.dbUser.id,
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

  createRankChangeActivity: moderatorProcedure
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
        createdByAdmin: ctx.dbUser.id,
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

  update: moderatorProcedure
    .input(
      z.object({
        activityId: z.string(),
        title: z.string().trim().min(1).optional(),
        description: z.string().trim().nullable().optional(),
        isPinned: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
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

  setPinned: moderatorProcedure
    .input(
      z.object({
        activityId: z.string(),
        isPinned: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
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

  hide: moderatorProcedure
    .input(
      z.object({
        activityId: z.string(),
        reason: z.string().trim().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const repo = new PrismaActivityFeedRepository(ctx.db);
      const controller = new ActivityFeedController(repo);
      const result = await controller.hide({
        activityId: input.activityId,
        hiddenByAdmin: ctx.dbUser.id,
        reason: input.reason ?? null,
      });

      if (!result.success) {
        throw new TRPCError({ code: "BAD_REQUEST", message: result.error });
      }

      return result.data;
    }),

  unhide: moderatorProcedure
    .input(z.object({ activityId: z.string() }))
    .mutation(async ({ ctx, input }) => {
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

  toggleReaction: protectedProcedure
    .input(
      z.object({
        activityId: z.string(),
        reactionType: z.enum(["heart", "fire", "clap", "star"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const repo = new PrismaActivityFeedRepository(ctx.db);
      const controller = new ActivityFeedController(repo);
      const result = await controller.toggleReaction({
        activityId: input.activityId,
        userId: ctx.dbUser.id,
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

  delete: adminProcedure
    .input(z.object({ activityId: z.string() }))
    .mutation(async ({ ctx, input }) => {
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

// ============================================================================
// Challenge Submission Controller
// ============================================================================

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

  updateMine: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        tripId: z.string(),
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
          message: "Cannot update submission for completed trip",
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

      // Get submission and verify ownership
      const existingSubmission = await ctx.db.challengeSubmission.findFirst({
        where: {
          id: input.id,
          groupId: participant.groupId,
        },
        select: {
          id: true,
          status: true,
          challengeId: true,
        },
      });

      if (!existingSubmission) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Submission not found",
        });
      }

      if (existingSubmission.status !== "PENDING") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Cannot edit approved or rejected submission",
        });
      }

      // Verify challenge is still active
      const challenge = await ctx.db.challenge.findFirst({
        where: {
          id: existingSubmission.challengeId,
          tripId: input.tripId,
          status: "ACTIVE",
        },
        select: {
          id: true,
          endTime: true,
        },
      });

      if (!challenge) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Challenge is not active",
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
      const result = await controller.update({
        submissionId: input.id,
        imageIds: input.imageIds,
        videoId: input.videoId,
        textContent: input.textContent,
        latitude: input.latitude,
        longitude: input.longitude,
      });

      if (!result.success) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: result.error,
        });
      }

      return result.data;
    }),

  deleteMine: protectedProcedure
    .input(z.object({ id: z.string(), tripId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Verify trip not ended
      const trip = await ctx.db.trip.findUnique({
        where: { id: input.tripId },
        select: { status: true },
      });

      if (trip?.status === "COMPLETED") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Cannot delete submission for completed trip",
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

      // Get submission and verify ownership
      const existingSubmission = await ctx.db.challengeSubmission.findFirst({
        where: {
          id: input.id,
          groupId: participant.groupId,
        },
        select: {
          id: true,
          status: true,
        },
      });

      if (!existingSubmission) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Submission not found",
        });
      }

      if (existingSubmission.status !== "PENDING") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Cannot delete approved or rejected submission",
        });
      }

      const repo = new PrismaChallengeSubmissionRepository(ctx.db);
      const controller = new ChallengeSubmissionController(repo);
      const result = await controller.delete({ submissionId: input.id });

      if (!result.success) {
        throw new TRPCError({
          code: "BAD_REQUEST",
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

// ============================================================================
// Challenge Vote Controller
// ============================================================================

export const challengeVoteController = {
  getMyByChallenge: protectedProcedure
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

  getByChallenge: moderatorProcedure
    .input(z.object({ challengeId: z.string() }))
    .query(async ({ ctx, input }) => {
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

  getJudgedStaffProgress: adminProcedure
    .input(z.object({ challengeId: z.string(), tripId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Get admin participants
      const adminParticipants = await ctx.db.tripParticipant.findMany({
        where: {
          tripId: input.tripId,
          user: {
            role: "ADMIN",
          },
        },
        select: { id: true },
      });

      const adminParticipantIds = adminParticipants.map((p) => p.id);

      // Count eligible submissions
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

      const repo = new PrismaChallengeVoteRepository(ctx.db);
      const controller = new ChallengeVoteController(repo);
      const result = await controller.getJudgedStaffProgress({
        challengeId: input.challengeId,
        tripId: input.tripId,
        adminParticipantIds,
        requiredPositions,
        eligibleSubmissionsCount,
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

  submitVotes: protectedProcedure
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
          message: "Brak dostepu do wyjazdu",
        });
      }

      // Get challenge to check scoring category and determine required positions
      const challenge = await ctx.db.challenge.findFirst({
        where: { id: input.challengeId, tripId: input.tripId },
        select: {
          id: true,
          scoringCategory: true,
          status: true,
        },
      });

      if (!challenge) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Challenge not found",
        });
      }

      // Validate challenge is in voting state
      if (
        challenge.scoringCategory === "PEER_VOTING" &&
        challenge.status !== "VOTING_PHASE"
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Glosowanie nie jest aktywne",
        });
      }

      if (challenge.scoringCategory === "JUDGED_STAFF") {
        if (ctx.dbUser.role !== "ADMIN") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only admins can vote in judged staff challenges",
          });
        }

        if (
          challenge.status === "CANCELLED" ||
          challenge.status === "COMPLETED"
        ) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Glosowanie zostalo zakonczone",
          });
        }
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

      const repo = new PrismaChallengeVoteRepository(ctx.db);
      const controller = new ChallengeVoteController(repo);
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

  submitVote: protectedProcedure
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
          message: "Brak dostepu do wyjazdu",
        });
      }

      // Get challenge
      const challenge = await ctx.db.challenge.findFirst({
        where: { id: input.challengeId, tripId: input.tripId },
        select: {
          id: true,
          scoringCategory: true,
          status: true,
        },
      });

      if (!challenge) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Challenge not found",
        });
      }

      // Validate challenge is in voting state
      if (
        challenge.scoringCategory === "PEER_VOTING" &&
        challenge.status !== "VOTING_PHASE"
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Glosowanie nie jest aktywne",
        });
      }

      if (challenge.scoringCategory === "JUDGED_STAFF") {
        if (ctx.dbUser.role !== "ADMIN") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only admins can vote in judged staff challenges",
          });
        }
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

      // For judged staff, allow partial voting
      const allowPartial = challenge.scoringCategory === "JUDGED_STAFF";

      const result = await controller.submitVote({
        challengeId: input.challengeId,
        submissionId: input.submissionId,
        voterId: participant.id,
        position: input.votePosition,
        points: input.votePoints,
        normalizedWeight: input.normalizedWeight,
        allowPartial,
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

  forceEndJudgedStaffVoting: adminProcedure
    .input(z.object({ challengeId: z.string(), tripId: z.string() }))
    .mutation(async ({ ctx, input }) => {
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
        adminId: ctx.dbUser.id,
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

// ============================================================================
// Submission Report Controller
// ============================================================================

import { SubmissionReportController } from "../../controllers/submissionReport-controller";
import { PrismaSubmissionReportRepository } from "../../gateways/PrismaSubmissionReportRepository";
import { NotificationScheduleController } from "../../controllers/notification-schedule-controller";
import { PrismaNotificationScheduleRepository } from "../../gateways/PrismaNotificationScheduleRepository";
import { RewardController } from "../../controllers/reward-controller";
import {
  PrismaRewardRepository,
  PrismaRewardPurchaseRepository,
} from "../../gateways/PrismaRewardRepository";
import { CoinController } from "../../controllers/coin-controller";
import { PrismaCoinRepository } from "../../gateways/PrismaCoinRepository";
import { CoinTransactionController } from "../../controllers/coin-transaction-controller";
import { PrismaCoinTransactionRepository } from "../../gateways/PrismaCoinTransactionRepository";
import { LocationController } from "../../controllers/location-controller";
import { PrismaLocationRepository } from "../../gateways/PrismaLocationRepository";
import { SponsorController } from "../../controllers/sponsor-controller";
import { PrismaSponsorRepository } from "../../gateways/PrismaSponsorRepository";
import { NotificationDeliveryController } from "../../controllers/notification-delivery-controller";
import { PrismaNotificationDeliveryRepository } from "../../gateways/PrismaNotificationDeliveryRepository";

export const submissionReportController = {
  create: protectedProcedure
    .input(
      z.object({
        tripId: z.string(),
        submissionId: z.string(),
        reason: z.string().min(1),
        details: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Verify trip not ended
      const trip = await ctx.db.trip.findUnique({
        where: { id: input.tripId },
        select: { endDate: true },
      });

      if (!trip) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Trip not found",
        });
      }

      const endDate = new Date(trip.endDate);
      const gracePeriodEnd = new Date(endDate.getTime() + 24 * 60 * 60 * 1000);
      if (new Date().getTime() > gracePeriodEnd.getTime()) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Trip has ended",
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
          message: "Brak dostepu do wyjazdu",
        });
      }

      // Verify submission exists
      const submission = await ctx.db.challengeSubmission.findFirst({
        where: { id: input.submissionId, challenge: { tripId: input.tripId } },
        select: { id: true },
      });

      if (!submission) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Submission not found",
        });
      }

      // Create report using controller
      const repo = new PrismaSubmissionReportRepository(ctx.db);
      const controller = new SubmissionReportController(repo);
      const result = await controller.create(
        {
          tripId: input.tripId,
          submissionId: input.submissionId,
          reason: input.reason,
          details: input.details,
        },
        participant.id,
      );

      if (!result.success) {
        throw new TRPCError({
          code: result.error.includes("already reported")
            ? "CONFLICT"
            : "BAD_REQUEST",
          message: result.error,
        });
      }

      // Fetch reporter info with email
      const reporterRecord = await ctx.db.tripParticipant.findUnique({
        where: { id: participant.id },
        include: {
          user: true,
        },
      });

      if (!reporterRecord?.user) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch reporter info",
        });
      }

      // Get email from auth
      const emailByAuthUserId = await buildAuthEmailLookup(ctx.supabase, [
        reporterRecord.user.authUserId,
      ]);

      return {
        ...result.data,
        reporter: {
          id: participant.id,
          user: {
            id: reporterRecord.user.id,
            firstName: reporterRecord.user.firstName,
            lastName: reporterRecord.user.lastName,
            email: resolveAuthEmail(
              emailByAuthUserId,
              reporterRecord.user.authUserId,
            ),
            hasAvatar: reporterRecord.user.hasAvatar,
          },
        },
      };
    }),

  getBySubmission: moderatorProcedure
    .input(z.object({ submissionId: z.string() }))
    .query(async ({ ctx, input }) => {
      const repo = new PrismaSubmissionReportRepository(ctx.db);
      const controller = new SubmissionReportController(repo);
      const result = await controller.getBySubmission({
        submissionId: input.submissionId,
      });

      if (!result.success) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: result.error,
        });
      }

      // Get emails for all reporters
      const reporterIds = result.data.reports.map((r) => r.reporter.id);
      const reporters = await ctx.db.tripParticipant.findMany({
        where: { id: { in: reporterIds } },
        include: { user: true },
      });

      const authUserIds = reporters
        .map((r) => r.user.authUserId)
        .filter(Boolean);
      const emailByAuthUserId = await buildAuthEmailLookup(
        ctx.supabase,
        authUserIds,
      );

      // Map to include emails
      return result.data.reports.map((report) => {
        const reporter = reporters.find((r) => r.id === report.reporter.id);
        const email = reporter?.user.authUserId
          ? resolveAuthEmail(emailByAuthUserId, reporter.user.authUserId)
          : null;

        return {
          ...report,
          reporter: {
            ...report.reporter,
            user: {
              ...report.reporter.user,
              email,
            },
          },
        };
      });
    }),
};

// ============================================================================
// Notification Schedule Controller
// ============================================================================

export const notificationScheduleController = {
  getAll: moderatorProcedure
    .input(
      z.object({
        pagination: z
          .object({
            limit: z.number().int().min(1).max(100).optional(),
            offset: z.number().int().min(0).optional(),
          })
          .optional(),
        filter: z
          .object({
            tripId: z.string().nullable().optional(),
            notificationType: z
              .enum([
                "CHALLENGE",
                "INFO",
                "REMINDER",
                "ANNOUNCEMENT",
                "DAILY_RANKING",
              ])
              .optional(),
            isActive: z.boolean().optional(),
            startDateFrom: z.coerce.date().optional(),
            startDateTo: z.coerce.date().optional(),
            search: z.string().optional(),
          })
          .optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const repo = new PrismaNotificationScheduleRepository(ctx.db);
      const controller = new NotificationScheduleController(repo);
      const result = await controller.getAll({
        pagination: input.pagination,
        filter: input.filter,
      });

      if (!result.success) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: result.error,
        });
      }
      return result.data;
    }),

  getById: moderatorProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const repo = new PrismaNotificationScheduleRepository(ctx.db);
      const controller = new NotificationScheduleController(repo);
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
        name: z.string().min(1).max(100),
        tripId: z.string().uuid().nullable().optional(),
        notificationType: z.enum([
          "CHALLENGE",
          "INFO",
          "REMINDER",
          "ANNOUNCEMENT",
          "DAILY_RANKING",
        ]),
        notificationTitle: z.string().max(200).nullable().optional(),
        notificationBody: z.string().max(2000).nullable().optional(),
        notificationUrl: z.string().url().max(500).nullable().optional(),
        startDate: z.coerce.date(),
        endDate: z.coerce.date(),
        hour: z.number().int().min(0).max(23),
        minute: z.number().int().min(0).max(59),
        isActive: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const repo = new PrismaNotificationScheduleRepository(ctx.db);
      const controller = new NotificationScheduleController(repo);
      const result = await controller.create(input);

      if (!result.success) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: result.error,
        });
      }
      return result.data;
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).max(100).optional(),
        notificationTitle: z.string().max(200).nullable().optional(),
        notificationBody: z.string().max(2000).nullable().optional(),
        notificationUrl: z.string().url().max(500).nullable().optional(),
        startDate: z.coerce.date().optional(),
        endDate: z.coerce.date().optional(),
        hour: z.number().int().min(0).max(23).optional(),
        minute: z.number().int().min(0).max(59).optional(),
        isActive: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const repo = new PrismaNotificationScheduleRepository(ctx.db);
      const controller = new NotificationScheduleController(repo);
      const result = await controller.update(input);

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

  delete: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const repo = new PrismaNotificationScheduleRepository(ctx.db);
      const controller = new NotificationScheduleController(repo);
      const result = await controller.delete({ id: input.id });

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

  toggleActive: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const repo = new PrismaNotificationScheduleRepository(ctx.db);
      const controller = new NotificationScheduleController(repo);
      const result = await controller.toggleActive({ id: input.id });

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

  duplicate: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const repo = new PrismaNotificationScheduleRepository(ctx.db);
      const controller = new NotificationScheduleController(repo);
      const result = await controller.duplicate({ id: input.id });

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

  bulkToggleActive: adminProcedure
    .input(z.object({ ids: z.array(z.string().uuid()) }))
    .mutation(async ({ ctx, input }) => {
      const repo = new PrismaNotificationScheduleRepository(ctx.db);
      const controller = new NotificationScheduleController(repo);
      const result = await controller.bulkToggleActive({ ids: input.ids });

      if (!result.success) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: result.error,
        });
      }
      return result.data;
    }),

  bulkDelete: adminProcedure
    .input(z.object({ ids: z.array(z.string().uuid()) }))
    .mutation(async ({ ctx, input }) => {
      const repo = new PrismaNotificationScheduleRepository(ctx.db);
      const controller = new NotificationScheduleController(repo);
      const result = await controller.bulkDelete({ ids: input.ids });

      if (!result.success) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: result.error,
        });
      }
      return result.data;
    }),

  getActive: moderatorProcedure
    .input(
      z.object({
        tripId: z.string().optional(),
        notificationType: z
          .enum([
            "CHALLENGE",
            "INFO",
            "REMINDER",
            "ANNOUNCEMENT",
            "DAILY_RANKING",
          ])
          .optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const repo = new PrismaNotificationScheduleRepository(ctx.db);
      const controller = new NotificationScheduleController(repo);
      const result = await controller.getActive({
        tripId: input.tripId,
        notificationType: input.notificationType,
      });

      if (!result.success) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: result.error,
        });
      }
      return result.data;
    }),

  getUpcoming: moderatorProcedure
    .input(
      z.object({
        limit: z.number().int().min(1).max(100).default(50),
        withinMinutes: z.number().int().min(1).default(30),
      }),
    )
    .query(async ({ ctx, input }) => {
      const repo = new PrismaNotificationScheduleRepository(ctx.db);
      const controller = new NotificationScheduleController(repo);
      const result = await controller.getUpcoming({
        limit: input.limit,
        withinMinutes: input.withinMinutes,
      });

      if (!result.success) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: result.error,
        });
      }
      return result.data;
    }),

  updateLastRun: moderatorProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        lastRunAt: z.coerce.date(),
        lastRunStatus: z.enum(["SUCCESS", "FAILURE", "PARTIAL"]),
        lastRunError: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const repo = new PrismaNotificationScheduleRepository(ctx.db);
      const controller = new NotificationScheduleController(repo);
      const result = await controller.updateLastRun(input);

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

  getExecutionHistory: moderatorProcedure
    .input(
      z.object({
        scheduleId: z.string().uuid(),
        pagination: z
          .object({
            limit: z.number().int().min(1).max(100).default(30),
            offset: z.number().int().min(0).default(0),
          })
          .optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const repo = new PrismaNotificationScheduleRepository(ctx.db);
      const controller = new NotificationScheduleController(repo);
      const result = await controller.getExecutionHistory({
        scheduleId: input.scheduleId,
        pagination: input.pagination,
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

// ============================================================================
// Reward Controller
// ============================================================================

// Helper to create reward controller with dependencies
const createRewardController = (ctx: { db: unknown }) => {
  const rewardRepo = new PrismaRewardRepository(ctx.db);
  const purchaseRepo = new PrismaRewardPurchaseRepository(ctx.db);
  const pointsCalc = new PrismaTripPointsCalculator(ctx.db);
  const coinsService = new PrismaGroupCoinsService(ctx.db);
  const accessChecker = new PrismaTripAccessChecker(ctx.db);

  return new RewardController(
    rewardRepo,
    purchaseRepo,
    pointsCalc,
    coinsService,
    accessChecker,
  );
};

export const rewardController = {
  getByTrip: protectedProcedure
    .input(z.object({ tripId: z.string() }))
    .query(async ({ ctx, input }) => {
      const controller = createRewardController(ctx);
      const accessChecker = new PrismaTripAccessChecker(ctx.db);
      const leaderCheck = await accessChecker.isGroupLeader(
        ctx.dbUser.id,
        input.tripId,
      );

      const result = await controller.getByTrip({
        tripId: input.tripId,
        groupCoins: leaderCheck.coins,
      });

      if (!result.success) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: result.error,
        });
      }
      return result.data;
    }),

  getByTripAdmin: moderatorProcedure
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
      const controller = createRewardController(ctx);
      const result = await controller.getByTripAdmin({
        tripId: input.tripId,
        pagination: input.pagination,
      });

      if (!result.success) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: result.error,
        });
      }
      return result.data;
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const controller = createRewardController(ctx);
      const accessChecker = new PrismaTripAccessChecker(ctx.db);
      const pointsCalc = new PrismaTripPointsCalculator(ctx.db);
      const service = new PrismaRewardService(
        accessChecker,
        pointsCalc,
        controller,
      );

      const result = await service.getByIdWithAccessCheck({
        rewardId: input.id,
        userId: ctx.dbUser.id,
      });

      if (!result.success) {
        throw new TRPCError({
          code: result.error.includes("not found") ? "NOT_FOUND" : "FORBIDDEN",
          message: result.error,
        });
      }
      return result.data;
    }),

  create: moderatorProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().min(1),
        availableQuantity: z.number().int().min(0),
        image: z.string().optional(),
        images: z.array(z.string()).optional(),
        coinCost: z.number().int().min(1).max(100),
        isHidden: z.boolean().optional(),
        tripId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const controller = createRewardController(ctx);
      const images =
        input.images && input.images.length > 0
          ? input.images
          : input.image
            ? [input.image]
            : [];

      const result = await controller.create({
        name: input.name,
        description: input.description,
        availableQuantity: input.availableQuantity,
        coinCostPercentage: input.coinCost,
        images,
        isHidden: input.isHidden,
        tripId: input.tripId,
        createdById: ctx.dbUser.id,
        creatorRole: ctx.dbUser.role,
      });

      if (!result.success) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: result.error,
        });
      }
      return result.data;
    }),

  update: moderatorProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        description: z.string().min(1).optional(),
        availableQuantity: z.number().int().min(0).optional(),
        image: z.string().nullable().optional(),
        images: z.array(z.string()).optional(),
        coinCost: z.number().int().min(1).max(100).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const controller = createRewardController(ctx);
      const images =
        input.images !== undefined
          ? input.images
          : input.image !== undefined
            ? input.image
              ? [input.image]
              : []
            : undefined;

      const result = await controller.update({
        rewardId: input.id,
        name: input.name,
        description: input.description,
        availableQuantity: input.availableQuantity,
        images,
        coinCostPercentage: input.coinCost,
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

  setHidden: moderatorProcedure
    .input(
      z.object({
        id: z.string(),
        isHidden: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const controller = createRewardController(ctx);
      const result = await controller.setHidden({
        rewardId: input.id,
        isHidden: input.isHidden,
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

  delete: moderatorProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const controller = createRewardController(ctx);
      const result = await controller.delete({ rewardId: input.id });

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

  purchase: protectedProcedure
    .input(
      z.object({
        rewardId: z.string(),
        quantity: z.number().int().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const controller = createRewardController(ctx);
      const result = await controller.purchase({
        rewardId: input.rewardId,
        quantity: input.quantity,
        userId: ctx.dbUser.id,
      });

      if (!result.success) {
        throw new TRPCError({
          code: result.error.includes("not found")
            ? "NOT_FOUND"
            : result.error.includes("coin")
              ? "PRECONDITION_FAILED"
              : "BAD_REQUEST",
          message: result.error,
        });
      }
      return result.data;
    }),

  updateMyPurchaseStatus: protectedProcedure
    .input(
      z.object({
        purchaseId: z.string(),
        status: z.enum(["IN_DELIVERY", "CANCELLED"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const controller = createRewardController(ctx);
      const result = await controller.updateMyPurchaseStatus({
        purchaseId: input.purchaseId,
        status: input.status,
        userId: ctx.dbUser.id,
      });

      if (!result.success) {
        throw new TRPCError({
          code: result.error.includes("not found") ? "NOT_FOUND" : "FORBIDDEN",
          message: result.error,
        });
      }
      return result.data;
    }),

  updatePurchaseStatus: moderatorProcedure
    .input(
      z.object({
        purchaseId: z.string(),
        status: z.enum([
          "BOUGHT",
          "ACCEPTED",
          "IN_DELIVERY",
          "CANCELLED",
          "DELIVERED",
        ]),
        collectionMethod: z.string().trim().min(1).max(500).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const controller = createRewardController(ctx);
      const result = await controller.updatePurchaseStatus({
        purchaseId: input.purchaseId,
        status: input.status,
        updatedById: ctx.dbUser.id,
        collectionMethod: input.collectionMethod,
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

  getPurchaseHistory: protectedProcedure
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
      const controller = createRewardController(ctx);
      const accessChecker = new PrismaTripAccessChecker(ctx.db);
      const pointsCalc = new PrismaTripPointsCalculator(ctx.db);
      const service = new PrismaRewardService(
        accessChecker,
        pointsCalc,
        controller,
      );

      const result = await service.getPurchaseHistoryWithAccessCheck({
        tripId: input.tripId,
        userId: ctx.dbUser.id,
        pagination: input.pagination,
      });

      if (!result.success) {
        throw new TRPCError({
          code: result.error.includes("not found") ? "NOT_FOUND" : "FORBIDDEN",
          message: result.error,
        });
      }
      return result.data;
    }),

  getTotalAvailablePoints: moderatorProcedure
    .input(z.object({ tripId: z.string() }))
    .query(async ({ ctx, input }) => {
      const controller = createRewardController(ctx);
      const accessChecker = new PrismaTripAccessChecker(ctx.db);
      const pointsCalc = new PrismaTripPointsCalculator(ctx.db);
      const service = new PrismaRewardService(
        accessChecker,
        pointsCalc,
        controller,
      );

      return await service.getTotalAvailablePoints({
        tripId: input.tripId,
      });
    }),
};

// ============================================================================
// Coin Transaction Controller
// ============================================================================

// Helper to format user full name (presentation logic)
const formatUserFullName = (user?: {
  firstName?: string | null;
  lastName?: string | null;
}) => {
  const fullName = [user?.firstName, user?.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  if (fullName) return fullName;
  if (user?.firstName) return user.firstName;
  if (user?.lastName) return user.lastName;
  return "Unknown user";
};

// Helper to create coin transaction controller from context
const createCoinTransactionController = (ctx: { db: unknown }) => {
  const coinRepo = new PrismaCoinTransactionRepository(ctx.db as never);
  return new CoinTransactionController(
    new GetCoinStatisticsUseCase(coinRepo),
    new GetMostActiveAdminStatsUseCase(coinRepo),
    new GetCoinTransactionsUseCase(coinRepo),
    new GetCoinQuickStatsUseCase(coinRepo),
    new GetCoinAdditionalInsightsUseCase(coinRepo),
  );
};

export const coinTransactionController = {
  getStatistics: moderatorProcedure
    .input(z.object({ tripId: z.string() }))
    .query(async ({ ctx, input }) => {
      const controller = createCoinTransactionController(ctx);
      const result = await controller.getStatistics({ tripId: input.tripId });

      if (!result.success) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: result.error,
        });
      }
      return result.data;
    }),

  getMostActiveAdminStats: moderatorProcedure
    .input(z.object({ tripId: z.string() }))
    .query(async ({ ctx, input }) => {
      const controller = createCoinTransactionController(ctx);
      const result = await controller.getMostActiveAdminStats({
        tripId: input.tripId,
      });

      if (!result.success) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: result.error,
        });
      }
      return result.data;
    }),

  getAll: moderatorProcedure
    .input(
      z.object({
        tripId: z.string(),
        pagination: z
          .object({
            limit: z.number().int().min(1).max(100).default(50),
            offset: z.number().int().min(0).default(0),
          })
          .optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const controller = createCoinTransactionController(ctx);
      const result = await controller.getAll({
        tripId: input.tripId,
        pagination: input.pagination,
      });

      if (!result.success) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: result.error,
        });
      }
      return result.data;
    }),

  getQuickStats: moderatorProcedure
    .input(z.object({ tripId: z.string() }))
    .query(async ({ ctx, input }) => {
      const controller = createCoinTransactionController(ctx);
      const result = await controller.getQuickStats({ tripId: input.tripId });

      if (!result.success) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: result.error,
        });
      }

      const data = result.data;

      // Get richest group name if ID exists
      if (data.richestGroupId) {
        const group = await ctx.db.group.findUnique({
          where: { id: data.richestGroupId },
          select: { name: true },
        });
        if (group) {
          return {
            ...data,
            richestGroupName: group.name,
          };
        }
      }

      return data;
    }),

  getAdditionalInsights: moderatorProcedure
    .input(z.object({ tripId: z.string() }))
    .query(async ({ ctx, input }) => {
      const controller = createCoinTransactionController(ctx);
      const result = await controller.getAdditionalInsights({
        tripId: input.tripId,
      });

      if (!result.success) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: result.error,
        });
      }

      const data = result.data;

      // Resolve most active admin name
      if (data.mostActiveAdmin) {
        const admin = await ctx.db.user.findUnique({
          where: { id: data.mostActiveAdmin.name },
          select: { firstName: true, lastName: true },
        });

        if (admin) {
          return {
            mostActiveAdmin: {
              name: formatUserFullName(admin),
              transactionCount: data.mostActiveAdmin.transactionCount,
            },
            recentTransactions: data.recentTransactions,
          };
        }
      }

      return {
        mostActiveAdmin: null,
        recentTransactions: data.recentTransactions,
      };
    }),

  getCoinTransactions: protectedProcedure
    .input(
      z.object({
        tripId: z.string(),
        groupId: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
      }),
    )
    .query(async ({ ctx, input }) => {
      const controller = createCoinTransactionController(ctx);
      const service = new PrismaCoinTransactionService(
        ctx.db,
        new PrismaCoinTransactionRepository(ctx.db),
      );

      const result = await service.getCoinTransactionsForUser({
        userId: ctx.dbUser.id,
        tripId: input.tripId,
        groupId: input.groupId,
        limit: input.limit,
      });

      if (!result.success) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: result.error,
        });
      }
      return result.data;
    }),
};

// ============================================================================
// Sponsor Controller
// ============================================================================

export const sponsorController = {
  getAll: publicProcedure.query(async ({ ctx }) => {
    const repository = new PrismaSponsorRepository(ctx.db);
    const controller = new SponsorController(repository);

    const result = await controller.list({ activeOnly: true });

    if (!result.success) {
      throw new TRPCError({ code: "BAD_REQUEST", message: result.error });
    }

    return result.data.sponsors;
  }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const repository = new PrismaSponsorRepository(ctx.db);
      const controller = new SponsorController(repository);

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

  getByTripId: publicProcedure
    .input(z.object({ tripId: z.string() }))
    .query(async ({ ctx, input }) => {
      const repository = new PrismaSponsorRepository(ctx.db);
      const controller = new SponsorController(repository);

      const result = await controller.getByTripId({ tripId: input.tripId });

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
        name: z.string().min(1),
        description: z.string().min(1),
        logoPath: z.string(),
        height: z.number().int().min(0).nullable().optional(),
        offsetX: z.number().int().min(0).nullable().optional(),
        offsetY: z.number().int().min(0).nullable().optional(),
        isActive: z.boolean().default(true),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const repository = new PrismaSponsorRepository(ctx.db);
      const controller = new SponsorController(repository);

      const result = await controller.create(input);

      if (!result.success) {
        throw new TRPCError({ code: "BAD_REQUEST", message: result.error });
      }

      return result.data;
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        description: z.string().min(1).optional(),
        logoPath: z.string().optional(),
        height: z.number().int().min(0).nullable().optional(),
        offsetX: z.number().int().min(0).nullable().optional(),
        offsetY: z.number().int().min(0).nullable().optional(),
        isActive: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const repository = new PrismaSponsorRepository(ctx.db);
      const controller = new SponsorController(repository);

      const result = await controller.update({
        sponsorId: input.id,
        ...input,
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

  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const repository = new PrismaSponsorRepository(ctx.db);
      const controller = new SponsorController(repository);

      const result = await controller.delete({ id: input.id });

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

  addToTrip: adminProcedure
    .input(
      z.object({
        tripId: z.string(),
        sponsorId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const repository = new PrismaSponsorRepository(ctx.db);
      const controller = new SponsorController(repository);

      const result = await controller.linkToTrip({
        sponsorId: input.sponsorId,
        tripId: input.tripId,
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

  removeFromTrip: adminProcedure
    .input(
      z.object({
        tripId: z.string(),
        sponsorId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const repository = new PrismaSponsorRepository(ctx.db);
      const controller = new SponsorController(repository);

      const result = await controller.unlinkFromTrip({
        sponsorId: input.sponsorId,
        tripId: input.tripId,
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

// ============================================================================
// Location Controller
// ============================================================================

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

// ============================================================================
// Notification Delivery Controller
// ============================================================================

// Helper to create notification delivery controller from context
const createNotificationDeliveryController = (ctx: { db: unknown }) => {
  const deliveryRepo = new PrismaNotificationDeliveryRepository(ctx.db);
  return new NotificationDeliveryController(
    new GetDeliveriesUseCase(deliveryRepo),
    new GetDeliveryByNotificationIdUseCase(deliveryRepo),
    new GetDeliveryStatsUseCase(deliveryRepo),
    new GetFailedDeliveriesUseCase(deliveryRepo),
  );
};

export const notificationDeliveryController = {
  getDeliveries: adminProcedure
    .input(
      z
        .object({
          tripId: z.string().optional(),
          status: z
            .enum(["pending", "success", "partial_failure", "failure"])
            .optional(),
          scheduleId: z.string().optional(),
          startDate: z.coerce.date().optional(),
          endDate: z.coerce.date().optional(),
          limit: z.number().min(1).max(100).default(50),
          offset: z.number().min(0).default(0),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const controller = createNotificationDeliveryController(ctx);
      const result = await controller.getDeliveries({
        tripId: input?.tripId,
        status: input?.status,
        scheduleId: input?.scheduleId,
        startDate: input?.startDate,
        endDate: input?.endDate,
        limit: input?.limit,
        offset: input?.offset,
      });

      if (!result.success) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: result.error,
        });
      }
      return result.data;
    }),

  getDeliveryByNotificationId: adminProcedure
    .input(
      z.object({
        notificationId: z.string(),
        tripId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const controller = createNotificationDeliveryController(ctx);
      const result = await controller.getDeliveryByNotificationId({
        notificationId: input.notificationId,
        tripId: input.tripId,
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

  getDeliveryStats: adminProcedure
    .input(
      z
        .object({
          tripId: z.string().optional(),
          startDate: z.coerce.date().optional(),
          endDate: z.coerce.date().optional(),
          scheduleId: z.string().optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const controller = createNotificationDeliveryController(ctx);
      const result = await controller.getDeliveryStats({
        tripId: input?.tripId,
        startDate: input?.startDate,
        endDate: input?.endDate,
        scheduleId: input?.scheduleId,
      });

      if (!result.success) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: result.error,
        });
      }
      return result.data;
    }),

  getFailedDeliveries: adminProcedure
    .input(
      z
        .object({
          tripId: z.string().optional(),
          limit: z.number().min(1).max(100).default(20),
          offset: z.number().min(0).default(0),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const controller = createNotificationDeliveryController(ctx);
      const result = await controller.getFailedDeliveries({
        tripId: input?.tripId,
        limit: input?.limit,
        offset: input?.offset,
      });

      if (!result.success) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: result.error,
        });
      }
      return result.data;
    }),
};

// ============================================================================
// Notification Sender Controller
// ============================================================================

export const notificationSenderController = {
  sendMobileNotifications: publicProcedure
    .input(
      z.object({
        notificationId: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const notificationService = new NotificationService(ctx.db);
      return await notificationService.sendMobileNotifications(
        input.notificationId,
      );
    }),

  trackDeliveryStart: publicProcedure
    .input(
      z.object({
        notificationId: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const service = new PrismaNotificationSenderService(ctx.db);
      const result = await service.trackDeliveryStart({
        notificationId: input.notificationId,
      });

      if (!result.success) {
        console.error("[Delivery Tracker] Failed to track delivery start");
      }
    }),

  trackDeliveryComplete: publicProcedure
    .input(
      z.object({
        notificationId: z.string(),
        totalRecipients: z.number(),
        successCount: z.number(),
        failureCount: z.number(),
        errors: z.string().nullable(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const service = new PrismaNotificationSenderService(ctx.db);
      const result = await service.trackDeliveryComplete({
        notificationId: input.notificationId,
        totalRecipients: input.totalRecipients,
        successCount: input.successCount,
        failureCount: input.failureCount,
        errors: input.errors,
      });

      if (!result.success) {
        console.error("[Delivery Tracker] Failed to track delivery completion");
      }
    }),

  trackDeliveryFailure: publicProcedure
    .input(
      z.object({
        notificationId: z.string(),
        error: z.union([z.string(), z.instanceof(Error)]),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const service = new PrismaNotificationSenderService(ctx.db);
      const result = await service.trackDeliveryFailure({
        notificationId: input.notificationId,
        error: input.error,
      });

      if (!result.success) {
        console.error("[Delivery Tracker] Failed to track delivery failure");
      }
    }),

  checkInactiveUsers: publicProcedure.mutation(() => {
    // Inactivity nudge notifications are disabled.
    return {
      checked: 0,
      notified: 0,
      skipped: 0,
      errors: 0,
    };
  }),
};

// ============================================================================
// Coin Controller
// ============================================================================

// Helper to create coin service from context
const createCoinService = (ctx: { db: unknown }) => {
  const coinRepo = new PrismaCoinTransactionRepository(ctx.db);
  const rankingActivityService = new PrismaRankingActivityService(ctx.db);
  return new PrismaCoinService(
    ctx.db,
    coinRepo,
    new AddCoinsUseCase(coinRepo),
    new RemoveCoinsUseCase(coinRepo),
    rankingActivityService,
  );
};

export const coinController = {
  addCoins: moderatorProcedure
    .input(
      z.object({
        tripId: z.string(),
        groupId: z.string(),
        amount: z.number().min(1),
        reason: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const service = createCoinService(ctx);

      const result = await service.addCoinsWithActivity({
        tripId: input.tripId,
        groupId: input.groupId,
        amount: input.amount,
        reason: input.reason,
        adminId: ctx.dbUser.id,
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

  removeCoins: moderatorProcedure
    .input(
      z.object({
        tripId: z.string(),
        groupId: z.string(),
        amount: z.number().min(1),
        reason: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const service = createCoinService(ctx);

      const result = await service.removeCoinsWithActivity({
        tripId: input.tripId,
        groupId: input.groupId,
        amount: input.amount,
        reason: input.reason,
        adminId: ctx.dbUser.id,
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
