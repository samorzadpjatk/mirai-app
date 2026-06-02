import { z } from "zod";
import { ORPCError } from "@orpc/server";
import { eq, sql, count } from "drizzle-orm";
import { type DB, rewards, rewardPurchases, groups, coinTransactions } from "@mirai-app/db";
import { ensureTripNotEnded } from "../../../utils/tripGuards";
import { calculateRewardProgress } from "@mirai-app/shared";
import { canTransitionPurchaseStatus, serializeRewardImages } from "@mirai-app/shared";
import { calculateTotalAvailablePoints, normalizeRewardImagesInput } from "./utils";
import { userRewardPurchaseStatusSchema, type RewardPurchaseStatus } from "./types";

export const createReward = async (
  context: { db: DB; dbUser: { id: string } },
  input: {
    name: string;
    description: string;
    availableQuantity: number;
    image?: string;
    images?: string[];
    coinCost: number;
    isHidden?: boolean;
    tripId: string;
  },
) => {
  const normalizedImages = normalizeRewardImagesInput(
    input.images && input.images.length > 0 ? input.images : input.image ? [input.image] : [],
  );

  const [inserted] = await context.db
    .insert(rewards)
    .values({
      name: input.name,
      description: input.description,
      availableQuantity: input.availableQuantity,
      image: serializeRewardImages(normalizedImages),
      coinCost: input.coinCost,
      isHidden: input.isHidden ?? false,
      tripId: input.tripId,
      createdById: context.dbUser.id,
    })
    .returning();

  if (!inserted) {
    throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "Failed to create reward" });
  }

  const matchInsertedRewardId = (r: any, ops: any) => ops.eq(r.id, inserted.id);

  return await context.db.query.rewards.findFirst({
    where: matchInsertedRewardId,
    with: {
      createdBy: {
        columns: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });
};

export const updateReward = async (
  context: { db: DB },
  input: {
    id: string;
    name?: string;
    description?: string;
    availableQuantity?: number;
    image?: string | null;
    images?: string[];
    coinCost?: number;
  },
) => {
  const { id, ...updateData } = input;

  const { image, images, ...restUpdate } = updateData;
  const hasImagesProp = Object.prototype.hasOwnProperty.call(updateData, "images");
  const hasImageProp = Object.prototype.hasOwnProperty.call(updateData, "image");

  const [updated] = await context.db
    .update(rewards)
    .set({
      ...restUpdate,
      ...(hasImagesProp
        ? {
            image: serializeRewardImages(normalizeRewardImagesInput(images)),
          }
        : hasImageProp
          ? { image: image ?? null }
          : {}),
      updatedAt: new Date(),
    })
    .where(eq(rewards.id, id))
    .returning();

  if (!updated) {
    throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "Failed to update reward" });
  }

  const matchUpdatedRewardId = (r: any, ops: any) => ops.eq(r.id, updated.id);

  return await context.db.query.rewards.findFirst({
    where: matchUpdatedRewardId,
    with: {
      createdBy: {
        columns: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });
};

export const setRewardHidden = async (
  context: { db: DB; dbUser: { id: string } },
  input: { id: string; isHidden: boolean },
) => {
  const [updated] = await context.db
    .update(rewards)
    .set({
      isHidden: input.isHidden,
      updatedAt: new Date(),
    })
    .where(eq(rewards.id, input.id))
    .returning();

  if (!updated) {
    throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "Failed to update reward" });
  }

  const matchUpdatedRewardId = (r: any, ops: any) => ops.eq(r.id, updated.id);

  return await context.db.query.rewards.findFirst({
    where: matchUpdatedRewardId,
    with: {
      createdBy: {
        columns: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });
};

export const deleteReward = async (
  context: { db: DB },
  input: { id: string },
) => {
  const [purchaseCountResult] = await context.db
    .select({ count: count() })
    .from(rewardPurchases)
    .where(eq(rewardPurchases.rewardId, input.id));
  const purchaseCount = purchaseCountResult?.count ?? 0;

  if (purchaseCount > 0) {
    throw new ORPCError("BAD_REQUEST", {
      message: "Cannot delete reward with existing purchases",
    });
  }

  await context.db.delete(rewards).where(eq(rewards.id, input.id));

  return { success: true };
};

export const purchaseReward = async (
  context: { db: DB; dbUser: { id: string } },
  input: { rewardId: string; quantity: number },
) => {
  return await context.db.transaction(async (tx) => {
    const matchRewardId = (r: any, ops: any) => ops.eq(r.id, input.rewardId);

    const reward = await tx.query.rewards.findFirst({
      where: matchRewardId,
    });

    if (!reward) {
      throw new ORPCError("NOT_FOUND", { message: "Reward not found" });
    }

    await ensureTripNotEnded(tx, reward.tripId);

    if (reward.isHidden) {
      throw new ORPCError("BAD_REQUEST", { message: "Reward is hidden" });
    }

    if (reward.availableQuantity < input.quantity) {
      throw new ORPCError("BAD_REQUEST", { message: "Not enough rewards available" });
    }

    const matchUserTripParticipant = (tp: any, ops: any) =>
      ops.and(ops.eq(tp.userId, context.dbUser.id), ops.eq(tp.tripId, reward.tripId));

    const userParticipant = await tx.query.tripParticipants.findFirst({
      where: matchUserTripParticipant,
      with: {
        group: {
          columns: {
            id: true,
            name: true,
            coins: true,
            tripId: true,
            organizerId: true,
          },
        },
      },
    });

    if (!userParticipant?.group || userParticipant.group?.tripId !== reward.tripId) {
      throw new ORPCError("FORBIDDEN", {
        message: "Only group organizers can purchase rewards",
      });
    }

    if (userParticipant.group.organizerId !== context.dbUser.id) {
      throw new ORPCError("FORBIDDEN", {
        message: "Only group organizers can purchase rewards",
      });
    }

    const totalAvailablePoints = await calculateTotalAvailablePoints(
      tx,
      reward.tripId,
    );
    const progress = calculateRewardProgress({
      reward,
      totalAvailablePoints,
      groupCoins: userParticipant.group.coins,
      isGroupLeader: true,
      purchasedCount: 0,
      isAllTrips: false,
    });
    const dynamicCoinCost = progress.coinCost;
    const totalCost = dynamicCoinCost * input.quantity;

    if (userParticipant.group.coins < totalCost) {
      throw new ORPCError("BAD_REQUEST", { message: "Not enough coins" });
    }

    await tx
      .update(rewards)
      .set({
        availableQuantity: sql`${rewards.availableQuantity} - ${input.quantity}`,
        updatedAt: new Date(),
      })
      .where(eq(rewards.id, input.rewardId));

    await tx
      .update(groups)
      .set({
        coins: sql`${groups.coins} - ${totalCost}`,
      })
      .where(eq(groups.id, userParticipant.group.id));

    const [insertedPurchase] = await tx
      .insert(rewardPurchases)
      .values({
        rewardId: input.rewardId,
        groupId: userParticipant.group.id,
        quantity: input.quantity,
        totalCost,
        purchasedById: context.dbUser.id,
        status: "BOUGHT",
        statusUpdatedById: context.dbUser.id,
        statusUpdatedAt: new Date(),
      })
      .returning();

    if (!insertedPurchase) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "Failed to create purchase" });
    }

    await tx
      .insert(coinTransactions)
      .values({
        groupId: userParticipant.group.id,
        amount: -totalCost,
        reason: `Claimed ${input.quantity}x ${reward.name}`,
        adminId: context.dbUser.id,
      })
      .returning();

    const matchInsertedPurchaseId = (rp: any, ops: any) => ops.eq(rp.id, insertedPurchase.id);

    return await tx.query.rewardPurchases.findFirst({
      where: matchInsertedPurchaseId,
      with: {
        reward: true,
        group: {
          columns: {
            id: true,
            name: true,
          },
        },
        purchasedBy: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        statusUpdatedBy: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  });
};

export const updateMyPurchaseStatus = async (
  context: { db: DB; dbUser: { id: string } },
  input: { purchaseId: string; status: z.infer<typeof userRewardPurchaseStatusSchema> },
) => {
  return await context.db.transaction(async (tx) => {
    const matchPurchaseId = (rp: any, ops: any) => ops.eq(rp.id, input.purchaseId);

    const purchase = await tx.query.rewardPurchases.findFirst({
      where: matchPurchaseId,
      with: {
        reward: {
          columns: {
            id: true,
            name: true,
          },
        },
        group: {
          columns: {
            id: true,
            organizerId: true,
          },
        },
      },
    });

    if (!purchase) {
      throw new ORPCError("NOT_FOUND", { message: "Purchase not found" });
    }

    if (purchase.group.organizerId !== context.dbUser.id) {
      throw new ORPCError("FORBIDDEN", {
        message: "Only group organizer can update purchase status",
      });
    }

    const currentStatus = purchase.status as RewardPurchaseStatus;

    if (input.status === "IN_DELIVERY") {
      if (currentStatus !== "ACCEPTED") {
        throw new ORPCError("BAD_REQUEST", {
          message: "Purchase can be moved to in delivery only after acceptance",
        });
      }

      const [updated] = await tx
        .update(rewardPurchases)
        .set({
          status: "IN_DELIVERY",
          statusUpdatedById: context.dbUser.id,
          statusUpdatedAt: new Date(),
        })
        .where(eq(rewardPurchases.id, purchase.id))
        .returning();

      if (!updated) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "Failed to update purchase" });
      }

      const matchUpdatedPurchaseId = (rp: any, ops: any) => ops.eq(rp.id, updated.id);

      return await tx.query.rewardPurchases.findFirst({
        where: matchUpdatedPurchaseId,
        with: {
          reward: true,
          group: {
            columns: {
              id: true,
              name: true,
            },
          },
          purchasedBy: {
            columns: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          statusUpdatedBy: {
            columns: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });
    }

    if (currentStatus !== "BOUGHT") {
      throw new ORPCError("BAD_REQUEST", {
        message: "Only pending purchases can be cancelled by user",
      });
    }

    await tx
      .update(groups)
      .set({
        coins: sql`${groups.coins} + ${purchase.totalCost}`,
      })
      .where(eq(groups.id, purchase.groupId));

    await tx
      .update(rewards)
      .set({
        availableQuantity: sql`${rewards.availableQuantity} + ${purchase.quantity}`,
      })
      .where(eq(rewards.id, purchase.rewardId));

    await tx
      .insert(coinTransactions)
      .values({
        groupId: purchase.groupId,
        amount: purchase.totalCost,
        reason: `Cancelled reward claim by user: ${purchase.quantity}x ${purchase.reward.name}`,
        adminId: context.dbUser.id,
      })
      .returning();

    const [updated] = await tx
      .update(rewardPurchases)
      .set({
        status: "CANCELLED",
        statusUpdatedById: context.dbUser.id,
        statusUpdatedAt: new Date(),
      })
      .where(eq(rewardPurchases.id, purchase.id))
      .returning();

    if (!updated) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "Failed to update purchase" });
    }

    const matchUpdatedPurchaseId = (rp: any, ops: any) => ops.eq(rp.id, updated.id);

    return await tx.query.rewardPurchases.findFirst({
      where: matchUpdatedPurchaseId,
      with: {
        reward: true,
        group: {
          columns: {
            id: true,
            name: true,
          },
        },
        purchasedBy: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        statusUpdatedBy: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  });
};

export const updatePurchaseStatus = async (
  context: { db: DB; dbUser: { id: string } },
  input: {
    purchaseId: string;
    status: RewardPurchaseStatus;
    collectionMethod?: string;
  },
) => {
  return await context.db.transaction(async (tx) => {
    const matchPurchaseId = (rp: any, ops: any) => ops.eq(rp.id, input.purchaseId);

    const purchase = await tx.query.rewardPurchases.findFirst({
      where: matchPurchaseId,
      with: {
        reward: {
          columns: {
            id: true,
            name: true,
          },
        },
        group: {
          columns: {
            id: true,
            name: true,
            coins: true,
          },
        },
      },
    });

    if (!purchase) {
      throw new ORPCError("NOT_FOUND", { message: "Purchase not found" });
    }

    const currentStatus = purchase.status as RewardPurchaseStatus;
    const nextStatus = input.status;

    if (!canTransitionPurchaseStatus(currentStatus, nextStatus)) {
      throw new ORPCError("BAD_REQUEST", {
        message: `Cannot change status from ${currentStatus} to ${nextStatus}`,
      });
    }

    if (nextStatus === "ACCEPTED" && !input.collectionMethod?.trim()) {
      throw new ORPCError("BAD_REQUEST", {
        message: "Collection method is required when accepting a purchase",
      });
    }

    if (
      nextStatus === "IN_DELIVERY" &&
      !input.collectionMethod?.trim() &&
      !purchase.collectionMethod?.trim()
    ) {
      throw new ORPCError("BAD_REQUEST", {
        message: "Collection method must be provided before moving to in delivery",
      });
    }

    if (nextStatus === "CANCELLED" && currentStatus !== "CANCELLED") {
      await tx
        .update(groups)
        .set({
          coins: sql`${groups.coins} + ${purchase.totalCost}`,
        })
        .where(eq(groups.id, purchase.groupId));

      await tx
        .update(rewards)
        .set({
          availableQuantity: sql`${rewards.availableQuantity} + ${purchase.quantity}`,
        })
        .where(eq(rewards.id, purchase.rewardId));

      await tx
        .insert(coinTransactions)
        .values({
          groupId: purchase.groupId,
          amount: purchase.totalCost,
          reason: `Refunded reward claim: ${purchase.quantity}x ${purchase.reward.name}`,
          adminId: context.dbUser.id,
        })
        .returning();
    }

    const [updated] = await tx
      .update(rewardPurchases)
      .set({
        status: nextStatus,
        statusUpdatedById: context.dbUser.id,
        statusUpdatedAt: new Date(),
        ...(input.collectionMethod?.trim()
          ? { collectionMethod: input.collectionMethod.trim() }
          : {}),
      })
      .where(eq(rewardPurchases.id, purchase.id))
      .returning();

    if (!updated) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", { message: "Failed to update purchase" });
    }

    const matchUpdatedPurchaseId = (rp: any, ops: any) => ops.eq(rp.id, updated.id);

    return await tx.query.rewardPurchases.findFirst({
      where: matchUpdatedPurchaseId,
      with: {
        reward: true,
        group: {
          columns: {
            id: true,
            name: true,
          },
        },
        purchasedBy: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        statusUpdatedBy: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  });
};


