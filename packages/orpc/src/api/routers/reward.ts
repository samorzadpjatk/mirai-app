import { z } from "zod";
import { ORPCError } from "@orpc/server";
import { createORPCRouter, moderatorProcedure, protectedProcedure } from "../../api/trpc";
import { normalizeSupabaseStoragePath } from "../../utils/storage";
import { type PrismaClient, type Prisma } from "@mirai-app/db";
import { ensureTripNotEnded } from "../../utils/tripGuards";

const REWARD_IMAGE_SIGNED_URL_SECONDS = 60 * 10;

// Function to calculate total available points for a trip
const calculateTotalAvailablePoints = async (db: PrismaClient | Prisma.TransactionClient, tripId: string) => {
  const challenges = await db.challenge.findMany({
    where: { tripId },
    select: {
      basePoints: true,
      firstPlacePoints: true,
      secondPlacePoints: true,
      thirdPlacePoints: true,
      scoringCategory: true,
    },
  });

  let totalPoints = 0;
  
  for (const challenge of challenges) {
    const basePoints = challenge.basePoints ?? 0;
    
    if (challenge.scoringCategory === "UNLIMITED") {
      // For unlimited category, only base points are available
      totalPoints += basePoints;
    } else {
      // For other categories, include podium points if they exist
      totalPoints += basePoints;
      totalPoints += challenge.firstPlacePoints ?? 0;
      totalPoints += challenge.secondPlacePoints ?? 0;
      totalPoints += challenge.thirdPlacePoints ?? 0;
    }
  }
  
  return totalPoints;
};
const rewardPurchaseStatusSchema = z.enum([
  "BOUGHT",
  "ACCEPTED",
  "IN_DELIVERY",
  "CANCELLED",
  "DELIVERED",
]);
const userRewardPurchaseStatusSchema = z.enum(["IN_DELIVERY", "CANCELLED"]);

type RewardPurchaseStatus = z.infer<typeof rewardPurchaseStatusSchema>;

const canTransitionPurchaseStatus = (
  from: RewardPurchaseStatus,
  to: RewardPurchaseStatus,
) => {
  if (from === to) return true;

  const transitions: Record<RewardPurchaseStatus, RewardPurchaseStatus[]> = {
    BOUGHT: ["ACCEPTED", "CANCELLED"],
    ACCEPTED: ["IN_DELIVERY", "CANCELLED"],
    IN_DELIVERY: ["DELIVERED", "CANCELLED"],
    CANCELLED: [],
    DELIVERED: [],
  };

  return transitions[from].includes(to);
};

const resolveRewardImage = async (
  supabase: {
    storage: {
      from: (bucket: string) => {
        createSignedUrl: (
          path: string,
          expiresIn: number,
        ) => Promise<{ data: { signedUrl?: string | null } | null; error: unknown }>;
      };
    };
  },
  image: string | null | undefined,
) => {
  if (!image) return null;

  const parsed = normalizeSupabaseStoragePath(image);
  if (!parsed) {
    return image;
  }

  const { data, error } = await supabase.storage
    .from(parsed.bucket)
    .createSignedUrl(parsed.path, REWARD_IMAGE_SIGNED_URL_SECONDS);

  if (error || !data?.signedUrl) {
    return null;
  }

  return data.signedUrl;
};

const parseRewardImages = (image: string | null | undefined): string[] => {
  if (!image) return [];

  const trimmed = image.trim();
  if (!trimmed) return [];

  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (Array.isArray(parsed)) {
      return parsed
        .filter((value): value is string => typeof value === "string")
        .map((value) => value.trim())
        .filter((value) => value.length > 0);
    }
  } catch {
    // Legacy single-image format.
  }

  return [trimmed];
};

const normalizeRewardImagesInput = (images: string[] | undefined): string[] =>
  (images ?? [])
    .map((image) => image.trim())
    .filter((image) => image.length > 0);

const serializeRewardImages = (images: string[]): string | null => {
  if (images.length === 0) return null;
  if (images.length === 1) return images[0] ?? null;
  return JSON.stringify(images);
};

const resolveRewardImageData = async (
  supabase: {
    storage: {
      from: (bucket: string) => {
        createSignedUrl: (
          path: string,
          expiresIn: number,
        ) => Promise<{ data: { signedUrl?: string | null } | null; error: unknown }>;
      };
    };
  },
  image: string | null | undefined,
) => {
  const images = parseRewardImages(image);
  const signedImageCandidates = await Promise.all(
    images.map((item) => resolveRewardImage(supabase, item)),
  );
  const signedImageUrls = signedImageCandidates.filter(
    (url): url is string => typeof url === "string" && url.length > 0,
  );

  return {
    image: images[0] ?? null,
    signedImageUrl: signedImageCandidates[0] ?? null,
    images,
    signedImageUrls,
  };
};

export const rewardRouter = createORPCRouter({
  // Get all rewards for a trip
  getByTrip: protectedProcedure
    .input(z.object({ tripId: z.string() }))
    .handler(async ({ context, input }) => {
      const isAllTrips = input.tripId === "all";

      const rewards = await context.db.reward.findMany({
        where: isAllTrips ? { isHidden: false } : { tripId: input.tripId, isHidden: false },
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

      const rewardsWithSignedImages = await Promise.all(
        rewards.map(async (reward) => {
          const imageData = await resolveRewardImageData(context.supabase, reward.image);
          return { ...reward, ...imageData };
        }),
      );

      // Calculate total available points for dynamic pricing
      const totalAvailablePoints = isAllTrips 
        ? 0 // Cannot calculate for all trips
        : await calculateTotalAvailablePoints(context.db, input.tripId);

      // Get user's group to check if they can afford rewards
      const userGroup = isAllTrips
        ? null
        : await context.db.tripParticipant.findFirst({
            where: {
              userId: context.dbUser.id,
              tripId: input.tripId,
            },
            include: {
              group: {
                select: {
                  id: true,
                  coins: true,
                  organizerId: true,
                },
              },
            },
          });

      const groupCoins = userGroup?.group?.coins ?? 0;
      const isGroupLeader = userGroup?.group?.organizerId === context.dbUser.id;

      return rewardsWithSignedImages.map((reward) => {
        // Calculate dynamic coin cost based on percentage of total available points
        let dynamicCoinCost = reward.coinCost; // Default to static cost
        
        if (!isAllTrips && totalAvailablePoints > 0) {
          // Convert percentage to coin cost: coinCost represents percentage of total points
          const percentageOfTotal = reward.coinCost / 100; // coinCost as percentage
          dynamicCoinCost = Math.round(totalAvailablePoints * percentageOfTotal);
          
          // Ensure minimum cost of 1 coin
          dynamicCoinCost = Math.max(1, dynamicCoinCost);
        }

        return {
          ...reward,
          coinCost: dynamicCoinCost, // Use dynamic cost
          originalCoinCost: reward.coinCost, // Keep original for reference
          canAfford: groupCoins >= dynamicCoinCost,
          isEligibleToBuy: isGroupLeader,
          isOutOfStock: reward.availableQuantity <= 0,
          purchasedCount: reward._count.purchases,
        };
      });
    }),

  // Get all rewards for a trip (admin version - no participation required)
  getByTripAdmin: moderatorProcedure
    .input(
      z.object({
        tripId: z.string(),
        pagination: z
          .object({
            limit: z.number().int().min(1).max(100).default(30),
            offset: z.number().int().min(0).default(0),
          })
          .optional(),
      }),
    )
    .handler(async ({ context, input }) => {
      const isAllTrips = input.tripId === "all";
      const limit = input.pagination?.limit ?? 30;
      const offset = input.pagination?.offset ?? 0;
      const where = isAllTrips ? undefined : { tripId: input.tripId };

      const [rewards, total] = await Promise.all([
        context.db.reward.findMany({
          where,
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
          take: limit,
          skip: offset,
        }),
        context.db.reward.count({ where }),
      ]);

      const rewardsWithSignedImages = await Promise.all(
        rewards.map(async (reward) => {
          const imageData = await resolveRewardImageData(context.supabase, reward.image);
          return { ...reward, ...imageData };
        }),
      );

      // Calculate total available points for dynamic pricing (only for specific trips)
      const totalAvailablePoints = isAllTrips 
        ? 0 // Cannot calculate for all trips
        : await calculateTotalAvailablePoints(context.db, input.tripId);

      // For admin view, calculate dynamic pricing but don't check affordability
      const mappedRewards = rewardsWithSignedImages.map((reward) => {
        let dynamicCoinCost = reward.coinCost; // Default to static cost

        if (!isAllTrips && totalAvailablePoints > 0) {
          // Convert percentage to coin cost: coinCost represents percentage of total points
          const percentageOfTotal = reward.coinCost / 100; // coinCost as percentage
          dynamicCoinCost = Math.round(totalAvailablePoints * percentageOfTotal);

          // Ensure minimum cost of 1 coin
          dynamicCoinCost = Math.max(1, dynamicCoinCost);
        }

        return {
          ...reward,
          coinCost: dynamicCoinCost, // Use dynamic cost
          originalCoinCost: reward.coinCost, // Keep original for reference
          canAfford: false, // Not relevant for admin
          isEligibleToBuy: false, // Not relevant for admin
          isOutOfStock: reward.availableQuantity <= 0,
          purchasedCount: reward._count.purchases,
        };
      });

      return {
        rewards: mappedRewards,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      };
    }),

  // Get single reward by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ context, input }) => {
      const reward = await context.db.reward.findUnique({
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
              statusUpdatedBy: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
            orderBy: { purchasedAt: "desc" },
          },
          _count: {
            select: {
              purchases: true,
            },
          },
        },
      });

      if (!reward) {
        throw new ORPCError("NOT_FOUND", { message: "Reward not found" });
      }

      const isStaff = context.dbUser.role === "ADMIN" || context.dbUser.role === "MODERATOR";
      if (reward.isHidden && !isStaff) {
        throw new ORPCError("NOT_FOUND", { message: "Reward not found" });
      }

      const imageData = await resolveRewardImageData(context.supabase, reward.image);

      // Calculate total available points for dynamic pricing
      const totalAvailablePoints = await calculateTotalAvailablePoints(context.db, reward.tripId);

      // Calculate dynamic coin cost based on percentage of total available points
      let dynamicCoinCost = reward.coinCost; // Default to static cost
      
      if (totalAvailablePoints > 0) {
        // Convert percentage to coin cost: coinCost represents percentage of total points
        const percentageOfTotal = reward.coinCost / 100; // coinCost as percentage
        dynamicCoinCost = Math.round(totalAvailablePoints * percentageOfTotal);
        
        // Ensure minimum cost of 1 coin
        dynamicCoinCost = Math.max(1, dynamicCoinCost);
      }

      return { 
        ...reward, 
        ...imageData,
        coinCost: dynamicCoinCost, // Use dynamic cost
        originalCoinCost: reward.coinCost, // Keep original for reference
        purchasedCount: reward._count.purchases,
      };
    }),

  // Create new reward (admin/moderator only)
  create: moderatorProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().min(1),
        availableQuantity: z.number().min(0),
        image: z.string().optional(),
        images: z.array(z.string()).optional(),
        coinCost: z.number().min(1),
        isHidden: z.boolean().optional(),
        tripId: z.string(),
      }),
    )
    .handler(async ({ context, input }) => {
      const normalizedImages = normalizeRewardImagesInput(
        input.images && input.images.length > 0
          ? input.images
          : input.image
            ? [input.image]
            : [],
      );

      return await context.db.reward.create({
        data: {
          name: input.name,
          description: input.description,
          availableQuantity: input.availableQuantity,
          image: serializeRewardImages(normalizedImages),
          coinCost: input.coinCost,
          isHidden: input.isHidden ?? false,
          tripId: input.tripId,
          createdById: context.dbUser.id,
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
        image: z.string().nullable().optional(),
        images: z.array(z.string()).optional(),
        coinCost: z.number().min(1).optional(),
      }),
    )
    .handler(async ({ context, input }) => {
      const { id, ...updateData } = input;

      const { image, images, ...restUpdate } = updateData;
      const hasImagesProp = Object.prototype.hasOwnProperty.call(
        updateData,
        "images",
      );
      const hasImageProp = Object.prototype.hasOwnProperty.call(
        updateData,
        "image",
      );

      const reward = await context.db.reward.update({
        where: { id },
        data: {
          ...restUpdate,
          ...(hasImagesProp
            ? {
                image: serializeRewardImages(
                  normalizeRewardImagesInput(images),
                ),
              }
            : hasImageProp
              ? { image: image ?? null }
              : {}),
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

  setHidden: moderatorProcedure
    .input(
      z.object({
        id: z.string(),
        isHidden: z.boolean(),
      }),
    )
    .handler(async ({ context, input }) => {
      return await context.db.reward.update({
        where: { id: input.id },
        data: {
          isHidden: input.isHidden,
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
    }),

  // Delete reward (admin/moderator only)
  delete: moderatorProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ context, input }) => {
      // Check if reward has any purchases
      const purchaseCount = await context.db.rewardPurchase.count({
        where: { rewardId: input.id },
      });

      if (purchaseCount > 0) {
        throw new ORPCError("BAD_REQUEST", { message: "Cannot delete reward with existing purchases" });
      }

      await context.db.reward.delete({
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
    .handler(async ({ context, input }) => {
      return await context.db.$transaction(async (tx) => {
        // Get reward and lock it for update
        const reward = await tx.reward.findUnique({
          where: { id: input.rewardId },
        });

        if (!reward) {
          throw new ORPCError("NOT_FOUND", { message: "Reward not found" });
        }

        await ensureTripNotEnded(context.db, reward.tripId);

        if (reward.isHidden) {
          throw new ORPCError("BAD_REQUEST", { message: "Reward is hidden" });
        }

        if (reward.availableQuantity < input.quantity) {
          throw new ORPCError("BAD_REQUEST", { message: "Not enough rewards available" });
        }

        // Get user's group and verify they are the organizer
        const userParticipant = await tx.tripParticipant.findFirst({
          where: {
            userId: context.dbUser.id,
            tripId: reward.tripId,
          },
          include: {
            group: {
              select: {
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
          throw new ORPCError("FORBIDDEN", { message: "Only group organizers can purchase rewards" });
        }

        if (userParticipant.group.organizerId !== context.dbUser.id) {
          throw new ORPCError("FORBIDDEN", { message: "Only group organizers can purchase rewards" });
        }

        // Calculate dynamic coin cost at time of purchase
        const totalAvailablePoints = await calculateTotalAvailablePoints(tx, reward.tripId);
        let dynamicCoinCost = reward.coinCost; // Default to static cost
        
        if (totalAvailablePoints > 0) {
          // Convert percentage to coin cost: coinCost represents percentage of total points
          const percentageOfTotal = reward.coinCost / 100; // coinCost as percentage
          dynamicCoinCost = Math.round(totalAvailablePoints * percentageOfTotal);
          
          // Ensure minimum cost of 1 coin
          dynamicCoinCost = Math.max(1, dynamicCoinCost);
        }

        const totalCost = dynamicCoinCost * input.quantity;

        if (userParticipant.group.coins < totalCost) {
          throw new ORPCError("BAD_REQUEST", { message: "Not enough coins" });
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
            purchasedById: context.dbUser.id,
            status: "BOUGHT",
            statusUpdatedById: context.dbUser.id,
            statusUpdatedAt: new Date(),
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
            statusUpdatedBy: {
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
            reason: `Claimed ${input.quantity}x ${reward.name}`,
            adminId: context.dbUser.id,
          },
        });

        return purchase;
      });
    }),

  updateMyPurchaseStatus: protectedProcedure
    .input(
      z.object({
        purchaseId: z.string(),
        status: userRewardPurchaseStatusSchema,
      }),
    )
    .handler(async ({ context, input }) => {
      return await context.db.$transaction(async (tx) => {
        const purchase = await tx.rewardPurchase.findUnique({
          where: { id: input.purchaseId },
          include: {
            reward: {
              select: {
                id: true,
                name: true,
              },
            },
            group: {
              select: {
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
          throw new ORPCError("FORBIDDEN", { message: "Only group organizer can update purchase status" });
        }

        const currentStatus = purchase.status;

        if (input.status === "IN_DELIVERY") {
          if (currentStatus !== "ACCEPTED") {
            throw new ORPCError("BAD_REQUEST", { message: "Purchase can be moved to in delivery only after acceptance" });
          }

          return await tx.rewardPurchase.update({
            where: { id: purchase.id },
            data: {
              status: "IN_DELIVERY",
              statusUpdatedById: context.dbUser.id,
              statusUpdatedAt: new Date(),
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
              statusUpdatedBy: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          });
        }

        if (currentStatus !== "BOUGHT") {
          throw new ORPCError("BAD_REQUEST", { message: "Only pending purchases can be cancelled by user" });
        }

        await tx.group.update({
          where: { id: purchase.groupId },
          data: { coins: { increment: purchase.totalCost } },
        });

        await tx.reward.update({
          where: { id: purchase.rewardId },
          data: { availableQuantity: { increment: purchase.quantity } },
        });

        await tx.coinTransaction.create({
          data: {
            groupId: purchase.groupId,
            amount: purchase.totalCost,
            reason: `Cancelled reward claim by user: ${purchase.quantity}x ${purchase.reward.name}`,
            adminId: context.dbUser.id,
          },
        });

        return await tx.rewardPurchase.update({
          where: { id: purchase.id },
          data: {
            status: "CANCELLED",
            statusUpdatedById: context.dbUser.id,
            statusUpdatedAt: new Date(),
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
            statusUpdatedBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        });
      });
    }),

  updatePurchaseStatus: moderatorProcedure
    .input(
      z.object({
        purchaseId: z.string(),
        status: rewardPurchaseStatusSchema,
        collectionMethod: z.string().trim().min(1).max(500).optional(),
      }),
    )
    .handler(async ({ context, input }) => {
      return await context.db.$transaction(async (tx) => {
        const purchase = await tx.rewardPurchase.findUnique({
          where: { id: input.purchaseId },
          include: {
            reward: {
              select: {
                id: true,
                name: true,
              },
            },
            group: {
              select: {
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

        const currentStatus = purchase.status;
        const nextStatus = input.status;

        if (!canTransitionPurchaseStatus(currentStatus, nextStatus)) {
          throw new ORPCError("BAD_REQUEST", { message: `Cannot change status from ${currentStatus} to ${nextStatus}` });
        }

        if (nextStatus === "ACCEPTED" && !input.collectionMethod?.trim()) {
          throw new ORPCError("BAD_REQUEST", { message: "Collection method is required when accepting a purchase" });
        }

        if (
          nextStatus === "IN_DELIVERY" &&
          !input.collectionMethod?.trim() &&
          !purchase.collectionMethod?.trim()
        ) {
          throw new ORPCError("BAD_REQUEST", { message: "Collection method must be provided before moving to in delivery" });
        }

        if (nextStatus === "CANCELLED" && currentStatus !== "CANCELLED") {
          await tx.group.update({
            where: { id: purchase.groupId },
            data: { coins: { increment: purchase.totalCost } },
          });

          await tx.reward.update({
            where: { id: purchase.rewardId },
            data: { availableQuantity: { increment: purchase.quantity } },
          });

          await tx.coinTransaction.create({
            data: {
              groupId: purchase.groupId,
              amount: purchase.totalCost,
              reason: `Refunded reward claim: ${purchase.quantity}x ${purchase.reward.name}`,
              adminId: context.dbUser.id,
            },
          });
        }

        return await tx.rewardPurchase.update({
          where: { id: purchase.id },
          data: {
            status: nextStatus,
            statusUpdatedById: context.dbUser.id,
            statusUpdatedAt: new Date(),
            ...(input.collectionMethod?.trim()
              ? { collectionMethod: input.collectionMethod.trim() }
              : {}),
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
            statusUpdatedBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        });
      });
    }),

  // Get purchase history for a trip
  getPurchaseHistory: protectedProcedure
    .input(
      z.object({
        tripId: z.string(),
        pagination: z
          .object({
            limit: z.number().int().min(1).max(100).default(30),
            offset: z.number().int().min(0).default(0),
          })
          .optional(),
      }),
    )
    .handler(async ({ context, input }) => {
      const isStaff = context.dbUser.role === "ADMIN" || context.dbUser.role === "MODERATOR";
      let groupIdFilter: string | undefined;
      const limit = input.pagination?.limit ?? 30;
      const offset = input.pagination?.offset ?? 0;

      if (!isStaff) {
        const participant = await context.db.tripParticipant.findFirst({
          where: {
            userId: context.dbUser.id,
            tripId: input.tripId,
          },
          select: {
            groupId: true,
          },
        });

        if (!participant?.groupId) {
          throw new ORPCError("FORBIDDEN", { message: "Only trip participants with a group can view reward history" });
        }

        groupIdFilter = participant.groupId;
      }

      const where = {
        reward: { tripId: input.tripId },
        ...(groupIdFilter ? { groupId: groupIdFilter } : {}),
      };

      const [purchases, total] = await Promise.all([
        context.db.rewardPurchase.findMany({
          where,
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
            statusUpdatedBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: { purchasedAt: "desc" },
          take: limit,
          skip: offset,
        }),
        context.db.rewardPurchase.count({ where }),
      ]);

      return {
        purchases,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      };
    }),
  // Get total available points for a trip (for reward cost calculation)
  getTotalAvailablePoints: moderatorProcedure
    .input(z.object({ tripId: z.string() }))
    .handler(async ({ context, input }) => {
      const totalPoints = await calculateTotalAvailablePoints(context.db, input.tripId);
      return { totalPoints };
    }),
});
