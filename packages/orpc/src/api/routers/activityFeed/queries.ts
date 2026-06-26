import {
  buildActivityWhere,
  emptyReactionCounts,
  getActivityColumns,
  getActivityRelationTree,
} from "@mirai-app/common/feed";
import type { DB } from "@mirai-app/db";
import { activityFeeds, activityReactions } from "@mirai-app/db";
import { ORPCError } from "@orpc/server";
import { count, eq, sql } from "drizzle-orm";
import { enrichActivities } from "./enrichment";
import type { Activity, RawActivityWithRelations } from "./types";

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

export const fetchActivityWithRelationsById = async (
  db: DB,
  id: string,
): Promise<RawActivityWithRelations | undefined> => {
  return db.query.activityFeeds.findFirst({
    where: (af, { eq }) => eq(af.id, id),
    columns: getActivityColumns(),
    with: getActivityRelationTree(),
  }) as Promise<RawActivityWithRelations | undefined>;
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
}): Promise<{
  activities: Activity[];
  nextCursor: null;
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    hasMore: boolean;
  };
}> => {
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
    activities: await enrichActivities(params.context, activities as RawActivityWithRelations[]),
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
}): Promise<{
  activities: Activity[];
  nextCursor: {
    id: string;
    createdAt: Date;
    isPinned: boolean;
  } | null;
  pagination: {
    total: null;
    page: null;
    pageSize: number;
    totalPages: null;
    hasMore: boolean;
  };
}> => {
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
    activities: await enrichActivities(
      params.context,
      currentPageActivities as RawActivityWithRelations[],
    ),
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
