import { z } from "zod";

import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";
import { NotificationService } from "~/server/services/notificationService";

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
        select: { id: true, name: true },
      });
      if (!group) throw new Error("Group not found");
      
      const userGroup = await ctx.db.userGroup.create({
        data: {
          userId: ctx.session.user.id,
          groupId: group.id,
        },
      });

      // Send notification to existing group members about new member
      try {
        const notification = NotificationService.createNewMemberNotification(
          group.name,
          ctx.session.user.name || "Nowy użytkownik"
        );

        const notificationResult = await NotificationService.sendToGroupMembers(
          group.id,
          notification,
          ctx.session.user.id // Exclude the new member themselves
        );

        console.log(`New member notification sent: ${notificationResult.sent} successful, ${notificationResult.failed} failed, ${notificationResult.totalMembers} total members`);
      } catch (error) {
        console.error("Failed to send new member notification:", error);
        // Don't throw error here - join should succeed even if notifications fail
      }

      return userGroup;
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

      // Get group information before updating
      const group = await ctx.db.group.findUnique({
        where: { id: input.groupId },
        select: { name: true },
      });

      if (!group) {
        throw new Error("Grupa nie została znaleziona");
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
          adminId: ctx.session.user.id,
        },
      });

      // Send automatic notifications to all group members
      try {
        const notification = NotificationService.createCoinsAddedNotification(
          group.name,
          input.amount
        );

        const notificationResult = await NotificationService.sendToGroupMembers(
          input.groupId,
          notification,
          ctx.session.user.id // Exclude the admin who added the coins
        );

        console.log(`Coins added notification sent: ${notificationResult.sent} successful, ${notificationResult.failed} failed, ${notificationResult.totalMembers} total members`);
      } catch (error) {
        console.error("Failed to send automatic notification:", error);
        // Don't throw error here - coin transaction should succeed even if notifications fail
      }

      return transaction;
    }),
  ranking: publicProcedure.query(async ({ ctx }) => {
    return await ctx.db.group.findMany({
      orderBy: { coins: "desc" },
      select: { id: true, name: true, coins: true },
    });
  }),
});
