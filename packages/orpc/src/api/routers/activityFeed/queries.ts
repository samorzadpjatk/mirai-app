import { eq, and, or, lt, count, sql } from "drizzle-orm";
import { ORPCError } from "@orpc/server";
import { activityFeeds, activityReactions } from "@mirai-app/db";
import type { DB } from "@mirai-app/db";
import { emptyReactionCounts, enrichActivities } from "./enrichment";
import type { ActivityWithRelations } from "./types";

export type ActivityContext = {
  db: DB;
  supabase: {
    storage: {
      from: (bucket: string) => {
        createSignedUrl: (
          path: string,
          expiresIn: number,
        ) => Promise<{
          data: { signedUrl?: string | null } | null;
          error: unknown;
        }>;
      };
    };
  };
  dbUser: { id: string };
};

export const buildActivityWhere = (
  tripId: string,
  includeHidden: boolean,
  cursor?: { id: string; createdAt: Date; isPinned: boolean },
) => {
  const baseWhere = and(
    eq(activityFeeds.tripId, tripId),
    includeHidden ? undefined : eq(activityFeeds.isHidden, false),
  );

  if (!cursor) {
    return baseWhere;
  }

  const cursorWhere = cursor.isPinned
    ? or(
        and(
          eq(activityFeeds.isPinned, true),
          or(
            lt(activityFeeds.createdAt, cursor.createdAt),
            and(eq(activityFeeds.createdAt, cursor.createdAt), lt(activityFeeds.id, cursor.id)),
          ),
        ),
        eq(activityFeeds.isPinned, false),
      )
    : and(
        eq(activityFeeds.isPinned, false),
        or(
          lt(activityFeeds.createdAt, cursor.createdAt),
          and(eq(activityFeeds.createdAt, cursor.createdAt), lt(activityFeeds.id, cursor.id)),
        ),
      );

  return and(baseWhere, cursorWhere);
};

export const getActivityRelationTree = () =>
  ({
    admin: { columns: { id: true, firstName: true, lastName: true } },
    hiddenBy: { columns: { id: true, firstName: true, lastName: true } },
    submissionActivity: {
      columns: {
        submissionId: true,
        challengeId: true,
        groupId: true,
        hasVideo: true,
        isWinner: true,
        ranking: true,
        pointsAwarded: true,
      },
      with: {
        submission: {
          columns: {
            id: true,
            status: true,
            awardedPoints: true,
            bonusPoints: true,
            ranking: true,
            createdAt: true,
          },
        },
        challenge: {
          columns: {
            id: true,
            name: true,
            status: true,
            submissionType: true,
            endTime: true,
          },
        },
        group: {
          columns: { id: true, name: true, image: true, coins: true },
        },
      },
    },
    challengeActivity: {
      columns: {
        challengeId: true,
        eventType: true,
        endTime: true,
        submissionType: true,
        basePoints: true,
        submissionCount: true,
      },
      with: {
        challenge: {
          columns: {
            id: true,
            name: true,
            description: true,
            image: true,
            status: true,
            startTime: true,
            endTime: true,
            votingStartTime: true,
            votingEndTime: true,
          },
        },
      },
    },
    rankChangeActivity: {
      columns: {
        groupId: true,
        newRank: true,
        totalCoins: true,
        coinsGained: true,
      },
      with: {
        group: {
          columns: { id: true, name: true, image: true, coins: true },
        },
      },
    },
    userPost: {
      columns: { authorId: true, additionalImages: true },
      with: {
        author: {
          columns: { id: true, userId: true, tripId: true, groupId: true },
          with: {
            user: {
              columns: {
                id: true,
                firstName: true,
                lastName: true,
                hasAvatar: true,
              },
            },
            group: {
              columns: { id: true, name: true, image: true },
            },
          },
        },
      },
    },
  } as const);

export const getActivityColumns = () =>
  ({
    id: true,
    tripId: true,
    activityType: true,
    title: true,
    description: true,
    imageUrl: true,
    isPinned: true,
    isHidden: true,
    hiddenAt: true,
    hiddenReason: true,
    createdByAdmin: true,
    createdAt: true,
    updatedAt: true,
  } as const);

export const fetchActivityWithRelationsById = async (db: DB, id: string) => {
  return db.query.activityFeeds.findFirst({
    where: (af, { eq }) => eq(af.id, id),
    columns: getActivityColumns(),
    with: getActivityRelationTree(),
  });
};

export const getActivitiesPage = async (params: {
  context: {
    db: DB;
    supabase: {
      storage: {
        from: (bucket: string) => {
          createSignedUrl: (
            path: string,
            expiresIn: number,
          ) => Promise<{
            data: { signedUrl?: string | null } | null;
            error: unknown;
          }>;
        };
      };
    };
    dbUser: { id: string };
  };
  tripId: string;
  page: number;
  pageSize: number;
  includeHidden: boolean;
}) => {
  const whereClause = buildActivityWhere(params.tripId, params.includeHidden);

  const countResult = await params.context.db
    .select({ count: sql<number>`count(*)` })
    .from(activityFeeds)
    .where(whereClause);
  const count = countResult[0]?.count ?? 0;
  const totalPages = Math.ceil(count / params.pageSize);

  if (params.page > totalPages && totalPages > 0) {
    throw new ORPCError("BAD_REQUEST", {
      message: `Page ${params.page} exceeds total pages ${totalPages}`,
    });
  }

  const activities = await params.context.db.query.activityFeeds.findMany({
    where: whereClause,
    columns: getActivityColumns(),
    with: getActivityRelationTree(),
    orderBy: (af, { desc }) => [desc(af.isPinned), desc(af.createdAt), desc(af.id)],
    limit: params.pageSize,
    offset: (params.page - 1) * params.pageSize,
  });

  return {
    activities: await enrichActivities(params.context, activities),
    nextCursor: null,
    pagination: {
      total: count,
      page: params.page,
      pageSize: params.pageSize,
      totalPages,
      hasMore: params.page < totalPages,
    },
  };
};

export const getActivitiesCursorPage = async (params: {
  context: {
    db: DB;
    supabase: {
      storage: {
        from: (bucket: string) => {
          createSignedUrl: (
            path: string,
            expiresIn: number,
          ) => Promise<{
            data: { signedUrl?: string | null } | null;
            error: unknown;
          }>;
        };
      };
    };
    dbUser: { id: string };
  };
  tripId: string;
  pageSize: number;
  includeHidden: boolean;
  cursor?: {
    id: string;
    createdAt: Date;
    isPinned: boolean;
  } | null;
}) => {
  const whereClause = buildActivityWhere(
    params.tripId,
    params.includeHidden,
    params.cursor ?? undefined,
  );

  const activities = await params.context.db.query.activityFeeds.findMany({
    where: whereClause,
    columns: getActivityColumns(),
    with: getActivityRelationTree(),
    orderBy: (af, { desc }) => [desc(af.isPinned), desc(af.createdAt), desc(af.id)],
    limit: params.pageSize + 1,
  });

  const hasMore = activities.length > params.pageSize;
  const currentPageActivities = hasMore ? activities.slice(0, params.pageSize) : activities;
  const lastActivity = currentPageActivities[currentPageActivities.length - 1];

  return {
    activities: await enrichActivities(params.context, currentPageActivities),
    nextCursor:
      hasMore && lastActivity
        ? {
            id: lastActivity.id,
            createdAt: lastActivity.createdAt,
            isPinned: lastActivity.isPinned,
          }
        : null,
    pagination: {
      total: null,
      page: null,
      pageSize: params.pageSize,
      totalPages: null,
      hasMore,
    },
  };
};

export const getReactionSummary = async (params: {
  context: { db: DB; dbUser: { id: string } };
  activityId: string;
}) => {
  const [countsRaw, myReactionsRaw] = await Promise.all([
    params.context.db
      .select({
        reactionType: activityReactions.reactionType,
        count: count(),
      })
      .from(activityReactions)
      .where(eq(activityReactions.activityId, params.activityId))
      .groupBy(activityReactions.reactionType),
    params.context.db.query.activityReactions.findMany({
      where: (ar, { eq, and }) =>
        and(eq(ar.activityId, params.activityId), eq(ar.userId, params.context.dbUser.id)),
      columns: {
        reactionType: true,
      },
    }),
  ]);

  const counts = emptyReactionCounts();
  for (const item of countsRaw) {
    if (item.reactionType in counts) {
      counts[item.reactionType as keyof typeof counts] = Number(item.count);
    }
  }

  const total = Object.values(counts).reduce((sum, value) => sum + value, 0);

  return {
    total,
    counts,
    myReactions: myReactionsRaw.map((item) => item.reactionType),
  };
};
