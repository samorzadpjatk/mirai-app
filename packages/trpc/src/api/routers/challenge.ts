import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  adminProcedure,
  protectedProcedure,
} from "../../api/trpc";

const challengeBaseSelect = {
  id: true,
  tripId: true,
  name: true,
  description: true,
  image: true,
  points: true,
  createdAt: true,
  updatedAt: true,
} as const;

const challengeSelect = {
  ...challengeBaseSelect,
  groups: {
    include: {
      group: {
        select: {
          id: true,
          name: true,
          description: true,
          image: true,
          organizer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      },
    },
  },
} as const;

export const challengeRouter = createTRPCRouter({
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
        select: challengeSelect,
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
        points: z.number().int().min(0).default(0),
        groupIds: z.array(z.string()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.groupIds && input.groupIds.length > 0) {
        const validGroupsCount = await ctx.db.group.count({
          where: { id: { in: input.groupIds }, tripId: input.tripId },
        });
        if (validGroupsCount !== input.groupIds.length) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Some groups do not belong to the trip",
          });
        }
      }

      const challenge = await ctx.db.challenge.create({
        data: {
          tripId: input.tripId,
          name: input.name,
          description: input.description,
          image: input.image,
          points: input.points,
          groups:
            input.groupIds && input.groupIds.length > 0
              ? {
                  createMany: {
                    data: input.groupIds.map((groupId) => ({ groupId })),
                  },
                }
              : undefined,
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
        points: z.number().int().min(0).optional(),
        groupIds: z.array(z.string()).optional(),
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

      if (input.groupIds) {
        const validGroupsCount = await ctx.db.group.count({
          where: { id: { in: input.groupIds }, tripId: input.tripId },
        });
        if (validGroupsCount !== input.groupIds.length) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Some groups do not belong to the trip",
          });
        }
      }

      const challenge = await ctx.db.challenge.update({
        where: { id: input.id },
        data: {
          name: input.name,
          description: input.description,
          image: input.image,
          points: input.points,
          groups:
            input.groupIds !== undefined
              ? {
                  deleteMany: {},
                  createMany:
                    input.groupIds.length > 0
                      ? { data: input.groupIds.map((groupId) => ({ groupId })) }
                      : undefined,
                }
              : undefined,
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

      await ctx.db.challengeGroup.deleteMany({
        where: { challengeId: input.id },
      });
      await ctx.db.challenge.delete({ where: { id: input.id } });

      return { success: true };
    }),
});
