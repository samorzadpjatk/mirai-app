import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, moderatorProcedure, protectedProcedure } from "../../api/trpc";

export const rewardRouter = createTRPCRouter({
  // Get all rewards for a trip
  getByTrip: protectedProcedure
    .input(z.object({ tripId: z.string() }))
    .query(async ({ ctx, input }) => {
      const rewards = await ctx.db.reward.findMany({
        where: { tripId: input.tripId },
        include: {
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          _count: {
            select: {
              purchases: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      // Get user's group to check if they can afford rewards
      const userGroup = await ctx.db.tripParticipant.findFirst({
        where: {
          userId: ctx.dbUser.id,
          tripId: input.tripId,
        },
        include: {
          group: {
            select: {
              id: true,
              coins: true,
            },
          },
        },
      });

      const groupCoins = userGroup?.group?.coins ?? 0;
      const isGroupLeader = userGroup?.role === "LEADER";

      return rewards.map((reward) => ({
        ...reward,
        canAfford: isGroupLeader && groupCoins >= reward.coinCost,
        isOutOfStock: reward.availableQuantity <= 0,
        purchasedCount: reward._count.purchases,
      }));
    }),

  // Get single reward by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const reward = await ctx.db.reward.findUnique({
        where: { id: input.id },
        include: {
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          purchases: {
            include: {
              group: {
                select: {
                  id: true,
                  name: true,
                },
              },
              purchasedBy: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
            orderBy: { purchasedAt: "desc" },
          },
        },
      });

      if (!reward) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Reward not found" });
      }

      return reward;
    }),

  // Create new reward (admin/moderator only)
  create: moderatorProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().min(1),
        availableQuantity: z.number().min(0),
        image: z.string().optional(),
        coinCost: z.number().min(1),
        tripId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.reward.create({
        data: {
          name: input.name,
          description: input.description,
          availableQuantity: input.availableQuantity,
          image: input.image,
          coinCost: input.coinCost,
          tripId: input.tripId,
          createdById: ctx.dbUser.id,
        },
        include: {
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });
    }),

  // Update reward (admin/moderator only)
  update: moderatorProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        description: z.string().min(1).optional(),
        availableQuantity: z.number().min(0).optional(),
        image: z.string().optional(),
        coinCost: z.number().min(1).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;

      const reward = await ctx.db.reward.update({
        where: { id },
        data: {
          ...updateData,
          updatedAt: new Date(),
        },
        include: {
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      return reward;
    }),

  // Delete reward (admin/moderator only)
  delete: moderatorProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Check if reward has any purchases
      const purchaseCount = await ctx.db.rewardPurchase.count({
        where: { rewardId: input.id },
      });

      if (purchaseCount > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot delete reward with existing purchases",
        });
      }

      await ctx.db.reward.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  // Purchase reward (group leaders only)
  purchase: protectedProcedure
    .input(
      z.object({
        rewardId: z.string(),
        quantity: z.number().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.$transaction(async (tx) => {
        // Get reward and lock it for update
        const reward = await tx.reward.findUnique({
          where: { id: input.rewardId },
        });

        if (!reward) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Reward not found" });
        }

        if (reward.availableQuantity < input.quantity) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Not enough rewards available",
          });
        }

        // Get user's group and verify they are a leader
        const userParticipant = await tx.tripParticipant.findFirst({
          where: {
            userId: ctx.dbUser.id,
            role: "LEADER",
          },
          include: {
            group: {
              select: {
                id: true,
                name: true,
                coins: true,
                tripId: true,
              },
            },
          },
        });

        if (!userParticipant || userParticipant.group?.tripId !== reward.tripId) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only group leaders can purchase rewards",
          });
        }

        if (!userParticipant.group) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Group not found",
          });
        }

        const totalCost = reward.coinCost * input.quantity;

        if (userParticipant.group.coins < totalCost) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Not enough coins",
          });
        }

        // Update reward quantity
        await tx.reward.update({
          where: { id: input.rewardId },
          data: {
            availableQuantity: { decrement: input.quantity },
            updatedAt: new Date(),
          },
        });

        // Deduct coins from group
        await tx.group.update({
          where: { id: userParticipant.group.id },
          data: { coins: { decrement: totalCost } },
        });

        // Create purchase record
        const purchase = await tx.rewardPurchase.create({
          data: {
            rewardId: input.rewardId,
            groupId: userParticipant.group.id,
            quantity: input.quantity,
            totalCost,
            purchasedById: ctx.dbUser.id,
          },
          include: {
            reward: true,
            group: {
              select: {
                id: true,
                name: true,
              },
            },
            purchasedBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        });

        // Create coin transaction record
        await tx.coinTransaction.create({
          data: {
            groupId: userParticipant.group.id,
            amount: -totalCost,
            reason: `Purchased ${input.quantity}x ${reward.name}`,
            adminId: ctx.dbUser.id,
          },
        });

        return purchase;
      });
    }),

  // Get purchase history for a trip
  getPurchaseHistory: protectedProcedure
    .input(z.object({ tripId: z.string() }))
    .query(async ({ ctx, input }) => {
      const purchases = await ctx.db.rewardPurchase.findMany({
        where: {
          reward: { tripId: input.tripId },
        },
        include: {
          reward: true,
          group: {
            select: {
              id: true,
              name: true,
            },
          },
          purchasedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { purchasedAt: "desc" },
      });

      return purchases;
    }),
});
