import { z } from "zod";
import { adminProcedure, createTRPCRouter } from "~/server/api/trpc";
import { NotificationService } from "~/server/services/notificationService";

export const coinRouter = createTRPCRouter({
    // Add coins to a group (enhanced version)
  addCoins: adminProcedure
    .input(
      z.object({
        groupId: z.string(),
        amount: z.number().min(1),
        reason: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
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
          reason: input.reason,
          adminId: ctx.session.user.id,
        },
        include: {
          group: {
            select: {
              id: true,
              name: true,
              coins: true,
            },
          },
          admin: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      // Send push notifications to all group members
      try {
        const notification = NotificationService.createCoinsAddedNotification(
          transaction.group.name,
          input.amount
        );
        
        await NotificationService.sendToGroupMembers(
          input.groupId,
          notification,
          ctx.session.user.id // Exclude the admin who added coins
        );
        
        console.log(`Sent coin notification to group ${transaction.group.name}`);
      } catch (error) {
        console.error("Failed to send coin notification:", error);
        // Don't fail the mutation if notification fails
      }

      return transaction;
    }),

  // Remove coins from a group
  removeCoins: adminProcedure
    .input(
      z.object({
        groupId: z.string(),
        amount: z.number().min(1),
        reason: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check if group has enough coins
      const group = await ctx.db.group.findUnique({
        where: { id: input.groupId },
        select: { coins: true },
      });

      if (!group || group.coins < input.amount) {
        throw new Error("Guild does not have enough coins");
      }

      await ctx.db.group.update({
        where: { id: input.groupId },
        data: { coins: { decrement: input.amount } },
      });

      const transaction = await ctx.db.coinTransaction.create({
        data: {
          groupId: input.groupId,
          amount: -input.amount, // Negative amount for removal
          reason: input.reason,
          adminId: ctx.session.user.id,
        },
        include: {
          group: {
            select: {
              id: true,
              name: true,
              coins: true,
            },
          },
          admin: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      // Send push notifications to all group members for coin removal
      try {
        const notification = {
          title: `💸 ${transaction.group.name} - Coins Seized`,
          body: `Your guild lost ${input.amount} coins. ${input.reason ? `Reason: ${input.reason}` : 'Check the current ranking.'}`,
          url: "/ranking",
          data: {
            type: "coins_removed",
            amount: input.amount,
            groupName: transaction.group.name,
            reason: input.reason,
          },
        };
        
        await NotificationService.sendToGroupMembers(
          input.groupId,
          notification,
          ctx.session.user.id // Exclude the admin who removed coins
        );
        
        console.log(`Sent coin removal notification to group ${transaction.group.name}`);
      } catch (error) {
        console.error("Failed to send coin removal notification:", error);
        // Don't fail the mutation if notification fails
      }

      return transaction;
    }),
})