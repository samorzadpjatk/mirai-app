import { z } from "zod";
import { TRPCError } from "../../api/trpc";
import { createORPCRouter, moderatorProcedure } from "../../api/trpc";
import {
  captureTripRankingSnapshot,
  createRankChangeActivities,
} from "../../utils/activityFeed";

export const coinRouter = createORPCRouter({
  // Add coins to a group (enhanced version)
  addCoins: moderatorProcedure
    .input(
      z.object({
        tripId: z.string(),
        groupId: z.string(),
        amount: z.number().min(1),
        reason: z.string().optional(),
      }),
    )
    .handler(async ({ context, input }) => {
      return await context.db.$transaction(async (tx) => {
        const previousRankingSnapshot = await captureTripRankingSnapshot(
          tx,
          input.tripId,
        );

        // Verify group exists and belongs to the trip
        const group = await tx.group.findUnique({
          where: { id: input.groupId },
        });
        
        if (group?.tripId !== input.tripId || group.isDeleted) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Group not found" });
        }

        // Update group coins within the transaction
        await tx.group.update({
          where: { id: input.groupId },
          data: { coins: { increment: input.amount } },
        });

        // Create transaction record
        const transaction = await tx.coinTransaction.create({
          data: {
            groupId: input.groupId,
            amount: input.amount,
            reason: input.reason,
            adminId: context.dbUser.id,
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
                firstName: true,
                lastName: true,
              },
            },
          },
        });

        await createRankChangeActivities({
          tx,
          tripId: input.tripId,
          previousSnapshot: previousRankingSnapshot,
          createdByAdmin: context.dbUser.id,
        });

        return transaction;
      });
    }),

  // Remove coins from a group
  removeCoins: moderatorProcedure
    .input(
      z.object({
        tripId: z.string(),
        groupId: z.string(),
        amount: z.number().min(1),
        reason: z.string().optional(),
      }),
    )
    .handler(async ({ context, input }) => {
      return await context.db.$transaction(async (tx) => {
        const previousRankingSnapshot = await captureTripRankingSnapshot(
          tx,
          input.tripId,
        );

        // Lock the group row for update to prevent race conditions
        const group = await tx.group.findUnique({
          where: { id: input.groupId },
          select: { coins: true, tripId: true, isDeleted: true },
        });

        if (
          group?.tripId !== input.tripId ||
          group.isDeleted ||
          (group?.coins ?? 0) < input.amount
        ) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Group does not have enough coins",
          });
        }

        // Update group coins within the transaction
        await tx.group.update({
          where: { id: input.groupId },
          data: { coins: { decrement: input.amount } },
        });

        // Create transaction record
        const transaction = await tx.coinTransaction.create({
          data: {
            groupId: input.groupId,
            amount: -input.amount, // Negative amount for removal
            reason: input.reason,
            adminId: context.dbUser.id,
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
                firstName: true,
                lastName: true,
              },
            },
          },
        });

        await createRankChangeActivities({
          tx,
          tripId: input.tripId,
          previousSnapshot: previousRankingSnapshot,
          createdByAdmin: context.dbUser.id,
        });

        return transaction;
      });
    }),
});
