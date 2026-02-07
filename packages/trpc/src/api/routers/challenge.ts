import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  adminProcedure,
  protectedProcedure,
} from "../../api/trpc";
import { type Prisma } from "@integral-2025-app/db";

const challengeBaseSelect: Prisma.ChallengeSelect = {
  id: true,
  tripId: true,
  name: true,
  description: true,
  image: true,
  submissionType: true,
  scoringCategory: true,
  isRecurring: true,
  dailyStartTime: true,
  dailyEndTime: true,
  basePoints: true,
  firstPlacePoints: true,
  secondPlacePoints: true,
  thirdPlacePoints: true,
  status: true,
  startTime: true,
  endTime: true,
  votingStartTime: true,
  votingEndTime: true,
  targetLatitude: true,
  targetLongitude: true,
  autoApprove: true,
  createdAt: true,
  updatedAt: true,
} as const;

const challengeSelect: Prisma.ChallengeSelect = {
  ...challengeBaseSelect,
} as const;

export const challengeRouter = createTRPCRouter({
  // Admin-only endpoint to fetch all challenges across trips
  getAll: adminProcedure.query(async ({ ctx }) => {
    return ctx.db.challenge.findMany({
      select: challengeSelect,
      orderBy: { createdAt: "desc" },
    });
  }),
  getAllByTrip: protectedProcedure
    .input(z.object({ tripId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.challenge.findMany({
        where: { tripId: input.tripId },
        select: challengeSelect,
        orderBy: { createdAt: "desc" },
      });
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string(), tripId: z.string() }))
    .query(async ({ ctx, input }) => {
      const challenge = await ctx.db.challenge.findFirst({
        where: { id: input.id, tripId: input.tripId },
        select: {
          ...challengeBaseSelect,
        },
      });

      if (!challenge) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Challenge not found",
        });
      }

      return challenge;
    }),

  create: adminProcedure
    .input(
      z.object({
        tripId: z.string(),
        name: z.string().min(1),
        description: z.string().optional(),
        image: z.string().url().optional(),
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
        isRecurring: z.boolean().optional(),
        dailyStartTime: z.string().optional(),
        dailyEndTime: z.string().optional(),
        basePoints: z.number().int().min(0).optional(),
        firstPlacePoints: z.number().int().min(0).optional(),
        secondPlacePoints: z.number().int().min(0).optional(),
        thirdPlacePoints: z.number().int().min(0).optional(),
        status: z.enum([
          "HIDDEN",
          "VISIBLE",
          "ACTIVE",
          "VOTING_PHASE",
          "COMPLETED",
          "CANCELLED",
        ]).optional(),
        startTime: z.coerce.date().optional(),
        endTime: z.coerce.date().optional(),
        votingStartTime: z.coerce.date().optional(),
        votingEndTime: z.coerce.date().optional(),
        targetLatitude: z.number().optional(),
        targetLongitude: z.number().optional(),
        autoApprove: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const challenge = await ctx.db.challenge.create({
        data: {
          tripId: input.tripId,
          name: input.name,
          description: input.description,
          image: input.image,
          submissionType: input.submissionType,
          scoringCategory: input.scoringCategory,
          isRecurring: input.isRecurring,
          dailyStartTime: input.dailyStartTime,
          dailyEndTime: input.dailyEndTime,
          basePoints: input.basePoints,
          firstPlacePoints: input.firstPlacePoints,
          secondPlacePoints: input.secondPlacePoints,
          thirdPlacePoints: input.thirdPlacePoints,
          status: input.status,
          startTime: input.startTime,
          endTime: input.endTime,
          votingStartTime: input.votingStartTime,
          votingEndTime: input.votingEndTime,
          targetLatitude: input.targetLatitude,
          targetLongitude: input.targetLongitude,
          autoApprove: input.autoApprove,
        },
        select: challengeSelect,
      });

      return challenge;
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        tripId: z.string(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        image: z.string().url().optional(),
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
        scoringCategory: z
          .enum(["SPEED", "UNLIMITED", "JUDGED_STAFF", "PEER_VOTING"])
          .optional(),
        isRecurring: z.boolean().optional(),
        dailyStartTime: z.string().optional(),
        dailyEndTime: z.string().optional(),
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
        votingStartTime: z.coerce.date().optional(),
        votingEndTime: z.coerce.date().optional(),
        targetLatitude: z.number().optional(),
        targetLongitude: z.number().optional(),
        autoApprove: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.challenge.findFirst({
        where: { id: input.id, tripId: input.tripId },
        select: { id: true },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Challenge not found",
        });
      }

      const challenge = await ctx.db.challenge.update({
        where: { id: input.id },
        data: {
          name: input.name,
          description: input.description,
          image: input.image,
          submissionType: input.submissionType,
          scoringCategory: input.scoringCategory,
          isRecurring: input.isRecurring,
          dailyStartTime: input.dailyStartTime,
          dailyEndTime: input.dailyEndTime,
          basePoints: input.basePoints,
          firstPlacePoints: input.firstPlacePoints,
          secondPlacePoints: input.secondPlacePoints,
          thirdPlacePoints: input.thirdPlacePoints,
          status: input.status,
          startTime: input.startTime,
          endTime: input.endTime,
          votingStartTime: input.votingStartTime,
          votingEndTime: input.votingEndTime,
          targetLatitude: input.targetLatitude,
          targetLongitude: input.targetLongitude,
          autoApprove: input.autoApprove,
        },
        select: challengeSelect,
      });

      return challenge;
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string(), tripId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.challenge.findFirst({
        where: { id: input.id, tripId: input.tripId },
        select: { id: true },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Challenge not found",
        });
      }

      await ctx.db.challenge.delete({ where: { id: input.id } });

      return { success: true };
    }),
});
