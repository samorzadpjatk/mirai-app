import { z } from "zod";
import { TRPCError } from "@trpc/server";

import {
  createTRPCRouter,
  protectedProcedure,
  adminProcedure,
  moderatorProcedure,
} from "../../api/trpc";

export const groupRouter = createTRPCRouter({
  getAllNames: moderatorProcedure
    .input(z.object({ tripId: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.group.findMany({
        select: {
          id: true,
          name: true,
        },
        where: { tripId: input.tripId },
      });
    }),
  getMy: protectedProcedure
    .input(z.object({ tripId: z.string() }))
    .query(async ({ ctx, input }) => {
      const participant = await ctx.db.tripParticipant.findUnique({
        where: {
          userId_tripId: { userId: ctx.dbUser.id, tripId: input.tripId },
        },
        select: { groupId: true },
      });
      if (!participant?.groupId) return null;
      return await ctx.db.group.findUnique({
        where: { id: participant.groupId },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
          organizer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          coinTransactions: {
            include: {
              admin: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
            orderBy: { createdAt: "desc" },
          },
        },
      });
    }),
  getAll: moderatorProcedure
    .input(z.object({ tripId: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.group.findMany({
        where: { tripId: input.tripId },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
          organizer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          coinTransactions: {
            include: {
              admin: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
            orderBy: { createdAt: "desc" },
            take: 10, // Last 10 transactions
          },
        },
        orderBy: { name: "asc" },
      });
    }),
  getGroupList: moderatorProcedure
    .input(z.object({ tripId: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.group.findMany({
        where: { tripId: input.tripId },
        select: {
          id: true,
          name: true,
          code: true,
          coins: true,
          organizer: {
            select: { id: true, firstName: true, lastName: true },
          },
          _count: {
            select: { participants: true },
          },
        },
      });
    }),
  getById: moderatorProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.group.findUnique({
        where: { id: input.id },
      });
    }),
  getByIdWithOrganizer: moderatorProcedure
    .input(z.object({ groupId: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.group.findUnique({
        where: { id: input.groupId },
        select: {
          id: true,
          name: true,
          code: true,
          coins: true,
          _count: { select: { participants: true } },
          organizer: { select: { id: true, firstName: true, lastName: true } },
        },
      });
    }),
  // Create a new group (admin version with more control)
  create: adminProcedure
    .input(
      z.object({
        tripId: z.string(),
        name: z.string().min(1),
        code: z.string().min(1),
        organizerId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const group = await ctx.db.group.create({
        data: {
          name: input.name,
          code: input.code,
          tripId: input.tripId,
          organizerId: input.organizerId ?? ctx.dbUser.id,
        },
        include: {
          organizer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      return group;
    }),

  // Update group information
  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        tripId: z.string(),
        name: z.string().min(1).optional(),
        organizerId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, tripId, ...updateData } = input;
      const group = await ctx.db.group.findUnique({ where: { id } });
      if (group?.tripId !== tripId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Group not found" });
      }
      return await ctx.db.group.update({
        where: { id },
        data: updateData,
        include: {
          organizer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });
    }),

  // Delete a group
  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // First, delete all related records
      await ctx.db.tripParticipant.updateMany({
        where: { groupId: input.id },
        data: { groupId: null },
      });

      await ctx.db.coinTransaction.deleteMany({
        where: { groupId: input.id },
      });

      return await ctx.db.group.delete({
        where: { id: input.id },
      });
    }),
  join: adminProcedure
    .input(z.object({ id: z.string(), tripId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const group = await ctx.db.group.findUnique({
        where: { id: input.id },
        include: { participants: true },
      });
      if (!group)
        throw new TRPCError({ code: "NOT_FOUND", message: "Group not found" });

      if (group.tripId !== input.tripId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Group not in trip",
        });
      }

      // Check if user is already in the group
      const existingMembership = group.participants.find(
        (member) => member.userId === input.userId,
      );

      if (existingMembership) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Użytkownik już należy do tej grupy",
        });
      }

      return await ctx.db.tripParticipant.upsert({
        where: {
          userId_tripId: { userId: ctx.dbUser.id, tripId: input.tripId },
        },
        create: {
          userId: ctx.dbUser.id,
          tripId: input.tripId,
          groupId: input.id,
        },
        update: { groupId: input.id },
      });
    }),
  assignUserToGroup: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        tripId: z.string(),
        groupId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const group = await ctx.db.group.findUnique({
        where: { id: input.groupId },
        include: { participants: true },
      });
      if (!group)
        throw new TRPCError({ code: "NOT_FOUND", message: "Group not found" });

      if (group.tripId !== input.tripId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Group not in trip",
        });
      }

      // Check if user is already in the group
      const existingMembership = group.participants.find(
        (member) => member.userId === ctx.dbUser.id,
      );

      if (existingMembership) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Użytkownik już należy do tej grupy",
        });
      }

      return await ctx.db.tripParticipant.upsert({
        where: {
          userId_tripId: { userId: input.userId, tripId: input.tripId },
        },
        create: {
          userId: input.userId,
          tripId: input.tripId,
          groupId: input.groupId,
        },
        update: { groupId: input.groupId },
      });
    }),

  // Remove user from a group
  removeUserFromGroup: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        tripId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.tripParticipant.update({
        where: {
          userId_tripId: { userId: input.userId, tripId: input.tripId },
        },
        data: { groupId: null },
      });
    }),
  addCoins: moderatorProcedure
    .input(
      z.object({ groupId: z.string(), amount: z.number(), tripId: z.string() }),
    )
    .mutation(async ({ ctx, input }) => {
      const group = await ctx.db.group.findUnique({
        where: { id: input.groupId },
      });
      if (group?.tripId !== input.tripId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Group not found" });
      }
      // Update group coins
      await ctx.db.group.update({
        where: { id: input.groupId },
        data: { coins: { increment: input.amount } },
      });

      // Create transaction record
      const transaction = await ctx.db.coinTransaction.create({
        data: {
          groupId: input.groupId,
          amount: input.amount,
          adminId: ctx.dbUser.id,
        },
        include: {
          group: {
            select: {
              id: true,
              name: true,
              coins: true,
            },
          },
        },
      });

      return transaction;
    }),
  ranking: protectedProcedure
    .input(z.object({ tripId: z.string() }))
    .query(async ({ ctx, input }) => {
      const currentDate = new Date();
      const data = await ctx.db.group.findMany({
        where: { tripId: input.tripId },
        orderBy: { coins: "desc" },
        include: {
          organizer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
          coinTransactions: {
            include: {
              admin: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
            orderBy: { createdAt: "desc" },
          },
        },
      });
      return {
        data,
        currentDate,
      };
    }),
});
