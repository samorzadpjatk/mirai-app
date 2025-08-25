import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  adminProcedure,
  moderatorProcedure,
} from "~/server/api/trpc";

export const groupRouter = createTRPCRouter({
  getAllNames: moderatorProcedure.query(async ({ ctx }) => {
    return await ctx.db.group.findMany({
      select: {
        id: true,
        name: true,
      },
    });
  }),
  getMy: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      select: { groupId: true, organizerGroupId: true },
    });
    if (!user) return null;
    const id = user.groupId ?? user.organizerGroupId;
    if (!id) return null;
    return await ctx.db.group.findUnique({
      where: { id },
      include: {
        members: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        organizer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        coinTransactions: {
          include: {
            admin: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });
  }),
  getAll: moderatorProcedure.query(async ({ ctx }) => {
    return await ctx.db.group.findMany({
      include: {
        members: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        organizer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        coinTransactions: {
          include: {
            admin: {
              select: {
                id: true,
                name: true,
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
  getGroupList: moderatorProcedure.query(async ({ ctx }) => {
    return await ctx.db.group.findMany({
      include: {
        organizer: {
          select: { name: true, email: true },
        },
        _count: {
          select: { members: true },
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
  getByIdWithOrganizer: adminProcedure
    .input(z.object({ groupId: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.group.findUnique({
        where: { id: input.groupId },
        select: {
          id: true,
          name: true,
          code: true,
          coins: true,
          _count: { select: { members: true } },
          organizer: { select: { id: true, name: true } },
        },
      });
    }),
  // Create a new group (admin version with more control)
  create: adminProcedure
    .input(
      z.object({
        name: z.string().min(1),
        organizerId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      const group = await ctx.db.group.create({
        data: {
          name: input.name,
          organizerId: input.organizerId ?? ctx.session.user.id,
          code,
        },
        include: {
          organizer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
      await ctx.db.user.update({
        where: { id: input.organizerId ?? ctx.session.user.id },
        data: { organizerGroupId: group.id },
      });
      return group;
    }),

  // Update group information
  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        organizerId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;
      return await ctx.db.group.update({
        where: { id },
        data: updateData,
        include: {
          organizer: {
            select: {
              id: true,
              name: true,
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
      await ctx.db.user.updateMany({
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
    .input(z.object({ code: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const group = await ctx.db.group.findUnique({
        where: { code: input.code },
      });
      if (!group) throw new Error("Group not found");
      return await ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data: { groupId: group.id },
      });
    }),
  assignUserToGroup: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        groupId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user is already in the group
      const existingMembership = await ctx.db.user.findFirst({
        where: {
          id: input.userId,
          groupId: input.groupId,
        },
      });

      if (existingMembership) {
        throw new Error("Użytkownik już należy do tej grupy");
      }

      return await ctx.db.user.update({
        where: { id: input.userId },
        data: { groupId: input.groupId },
      });
    }),

  // Remove user from a group
  removeUserFromGroup: adminProcedure
    .input(
      z.object({
        userId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.user.update({
        where: {
          id: input.userId,
        },
        data: {
          groupId: null,
        },
      });
    }),
  addCoins: adminProcedure
    .input(z.object({ groupId: z.string(), amount: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.group.update({
        where: { id: input.groupId },
        data: { coins: { increment: input.amount } },
      });
      return await ctx.db.coinTransaction.create({
        data: {
          groupId: input.groupId,
          amount: input.amount,
          adminId: ctx.session.user.id,
        },
      });
    }),
  ranking: protectedProcedure.query(async ({ ctx }) => {
    const currentDate = new Date();
    const data = await ctx.db.group.findMany({
      orderBy: { coins: "desc" },
      include: {
        members: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        organizer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        coinTransactions: {
          include: {
            admin: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });
    return {
      data,
      currentDate
    }
  }),
});
