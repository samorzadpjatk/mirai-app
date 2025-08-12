import { z } from "zod";


import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";

export const groupRouter = createTRPCRouter({
  create: protectedProcedure
    .input(z.object({ name: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      return await ctx.db.group.create({
        data: {
          name: input.name,
          organizerId: ctx.session.user.id,
          code,
        },
      });
    }),
  join: protectedProcedure
    .input(z.object({ code: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const group = await ctx.db.group.findUnique({
        where: { code: input.code },
      });
      if (!group) throw new Error("Group not found");
      return await ctx.db.userGroup.create({
        data: {
          userId: ctx.session.user.id,
          groupId: group.id,
        },
      });
    }),
  addCoins: protectedProcedure
    .input(z.object({ groupId: z.string(), amount: z.number() }))
    .mutation(async ({ ctx, input }) => {
      // Sprawdzanie uprawnień admina na podstawie grup z profilu Authentik
      const adminGroupName = "admin-group-name"; // Zmień na właściwą nazwę grupy adminów
      const userGroups = ctx.session.user.groups ?? [];
      if (!Array.isArray(userGroups) || !userGroups.includes(adminGroupName)) {
        throw new Error("Brak uprawnień administratora");
      }
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
  ranking: publicProcedure.query(async ({ ctx }) => {
    return await ctx.db.group.findMany({
      orderBy: { coins: "desc" },
      select: { id: true, name: true, coins: true },
    });
  }),
});
