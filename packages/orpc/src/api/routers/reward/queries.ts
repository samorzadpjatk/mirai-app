import { calculateRewardProgress } from "@mirai-app/common/rewards";
import { type DB, rewardPurchases, rewards } from "@mirai-app/db";
import { ORPCError } from "@orpc/server";
import { and, count, eq, inArray } from "drizzle-orm";
import { calculateTotalAvailablePoints, resolveRewardImageData } from "./utils";

export const getByTrip = async (
  context: {
    db: DB;
    supabase: {
      storage: {
        from: (bucket: string) => {
          createSignedUrl: (
            path: string,
            expiresIn: number,
          ) => Promise<{ data: { signedUrl?: string | null } | null; error: unknown }>;
        };
      };
    };
    dbUser: { id: string };
  },
  input: { tripId: string },
) => {
  const isAllTrips = input.tripId === "all";

  const rewardRows = await context.db.query.rewards.findMany({
    where: (r, { eq, and }) =>
      isAllTrips ? eq(r.isHidden, false) : and(eq(r.tripId, input.tripId), eq(r.isHidden, false)),
    with: {
      createdBy: {
        columns: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: (r, { desc }) => desc(r.createdAt),
  });

  const rewardIds = rewardRows.map((r) => r.id);
  const purchaseCounts =
    rewardIds.length > 0
      ? await context.db
          .select({ rewardId: rewardPurchases.rewardId, count: count() })
          .from(rewardPurchases)
          .where(inArray(rewardPurchases.rewardId, rewardIds))
          .groupBy(rewardPurchases.rewardId)
      : [];
  const countMap = new Map(purchaseCounts.map((pc) => [pc.rewardId, pc.count]));

  const rewardsWithSignedImages = await Promise.all(
    rewardRows.map(async (reward) => {
      const imageData = await resolveRewardImageData(context.supabase, reward.image);
      return { ...reward, ...imageData };
    }),
  );

  const totalAvailablePoints = isAllTrips
    ? 0
    : await calculateTotalAvailablePoints(context.db, input.tripId);

  const userGroup = isAllTrips
    ? null
    : await context.db.query.tripParticipants.findFirst({
        where: (tp, { eq, and }) =>
          and(eq(tp.userId, context.dbUser.id), eq(tp.tripId, input.tripId)),
        with: {
          group: {
            columns: {
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
    const progress = calculateRewardProgress({
      reward,
      totalAvailablePoints,
      groupCoins,
      isGroupLeader,
      purchasedCount: countMap.get(reward.id) ?? 0,
      isAllTrips,
    });
    return { ...reward, ...progress };
  });
};

export const getByTripAdmin = async (
  context: {
    db: DB;
    supabase: {
      storage: {
        from: (bucket: string) => {
          createSignedUrl: (
            path: string,
            expiresIn: number,
          ) => Promise<{ data: { signedUrl?: string | null } | null; error: unknown }>;
        };
      };
    };
  },
  input: {
    tripId: string;
    pagination?: {
      limit: number;
      offset: number;
    };
  },
) => {
  const isAllTrips = input.tripId === "all";
  const limit = input.pagination?.limit ?? 30;
  const offset = input.pagination?.offset ?? 0;
  const where = isAllTrips ? undefined : eq(rewards.tripId, input.tripId);

  const [rewardRows, totalResult] = await Promise.all([
    context.db.query.rewards.findMany({
      where,
      with: {
        createdBy: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: (r, { desc }) => desc(r.createdAt),
      limit,
      offset,
    }),
    context.db.select({ count: count() }).from(rewards).where(where),
  ]);

  const rewardIds = rewardRows.map((r) => r.id);
  const purchaseCounts =
    rewardIds.length > 0
      ? await context.db
          .select({ rewardId: rewardPurchases.rewardId, count: count() })
          .from(rewardPurchases)
          .where(inArray(rewardPurchases.rewardId, rewardIds))
          .groupBy(rewardPurchases.rewardId)
      : [];
  const countMap = new Map(purchaseCounts.map((pc) => [pc.rewardId, pc.count]));

  const total = totalResult[0]?.count ?? 0;

  const rewardsWithSignedImages = await Promise.all(
    rewardRows.map(async (reward) => {
      const imageData = await resolveRewardImageData(context.supabase, reward.image);
      return { ...reward, ...imageData };
    }),
  );

  const totalAvailablePoints = isAllTrips
    ? 0
    : await calculateTotalAvailablePoints(context.db, input.tripId);

  const mappedRewards = rewardsWithSignedImages.map((reward) => {
    const progress = calculateRewardProgress({
      reward,
      totalAvailablePoints,
      groupCoins: 0,
      isGroupLeader: false,
      purchasedCount: countMap.get(reward.id) ?? 0,
      isAllTrips,
    });
    return { ...reward, ...progress };
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
};

export const getById = async (
  context: {
    db: DB;
    supabase: {
      storage: {
        from: (bucket: string) => {
          createSignedUrl: (
            path: string,
            expiresIn: number,
          ) => Promise<{ data: { signedUrl?: string | null } | null; error: unknown }>;
        };
      };
    };
    dbUser: { id: string; role: string };
  },
  input: { id: string },
) => {
  const reward = await context.db.query.rewards.findFirst({
    where: (r, { eq }) => eq(r.id, input.id),
    with: {
      createdBy: {
        columns: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
      purchases: {
        with: {
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
        orderBy: (rp, { desc }) => desc(rp.purchasedAt),
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

  const totalAvailablePoints = await calculateTotalAvailablePoints(context.db, reward.tripId);
  const [purchaseCountResult] = await context.db
    .select({ count: count() })
    .from(rewardPurchases)
    .where(eq(rewardPurchases.rewardId, input.id));
  const purchasedCount = purchaseCountResult?.count ?? 0;

  const progress = calculateRewardProgress({
    reward,
    totalAvailablePoints,
    groupCoins: 0,
    isGroupLeader: false,
    purchasedCount,
    isAllTrips: false,
  });

  return { ...reward, ...imageData, ...progress };
};

export const getPurchaseHistory = async (
  context: {
    db: DB;
    dbUser: { id: string; role: string };
  },
  input: {
    tripId: string;
    pagination?: {
      limit: number;
      offset: number;
    };
  },
) => {
  const isStaff = context.dbUser.role === "ADMIN" || context.dbUser.role === "MODERATOR";
  let groupIdFilter: string | undefined;
  const limit = input.pagination?.limit ?? 30;
  const offset = input.pagination?.offset ?? 0;

  if (!isStaff) {
    const participant = await context.db.query.tripParticipants.findFirst({
      where: (tp, { eq, and }) =>
        and(eq(tp.userId, context.dbUser.id), eq(tp.tripId, input.tripId)),
      columns: {
        groupId: true,
      },
    });

    if (!participant?.groupId) {
      throw new ORPCError("FORBIDDEN", {
        message: "Only trip participants with a group can view reward history",
      });
    }

    groupIdFilter = participant.groupId;
  }

  const tripRewardIds = await context.db
    .select({ id: rewards.id })
    .from(rewards)
    .where(eq(rewards.tripId, input.tripId));
  const rewardIds = tripRewardIds.map((r) => r.id);

  const where =
    rewardIds.length > 0
      ? groupIdFilter
        ? and(
            inArray(rewardPurchases.rewardId, rewardIds),
            eq(rewardPurchases.groupId, groupIdFilter),
          )
        : inArray(rewardPurchases.rewardId, rewardIds)
      : undefined;

  const [purchaseRows, totalResult] = await Promise.all([
    context.db.query.rewardPurchases.findMany({
      where,
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
      orderBy: (rp, { desc }) => desc(rp.purchasedAt),
      limit,
      offset,
    }),
    context.db.select({ count: count() }).from(rewardPurchases).where(where),
  ]);

  const total = totalResult[0]?.count ?? 0;

  return {
    purchases: purchaseRows,
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    },
  };
};

export const getTotalAvailablePoints = async (db: DB, tripId: string) => {
  const totalPoints = await calculateTotalAvailablePoints(db, tripId);
  return { totalPoints };
};
