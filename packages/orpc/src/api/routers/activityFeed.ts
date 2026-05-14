import { z } from "zod";
import { ORPCError } from "@orpc/server";
import {
  createORPCRouter,
  protectedProcedure,
  moderatorProcedure,
  adminProcedure,
} from "../../api/trpc";
import {
  eq,
  and,
  or,
  lt,
  count,
  sql,
  inArray,
} from "drizzle-orm";
import {
  activityFeeds,
  activityReactions,
  submissionActivities,
  challengeActivities,
  rankChangeActivities,
  userPosts,
  users,
} from "@mirai-app/db";
import type { DB } from "@mirai-app/db";
import { normalizeSupabaseStoragePath } from "../../utils/storage";
import { isValidHttpUrl } from "../../utils/url-validation";

const REACTION_TYPES = ["heart", "fire", "clap", "star"] as const;

const CHALLENGE_EVENT_TYPES = [
  "challenge_started",
  "voting_started",
  "completed",
] as const;

const activityCursorSchema = z.object({
  id: z.string(),
  createdAt: z.coerce.date(),
  isPinned: z.boolean(),
});

const ACTIVITY_IMAGE_SIGNED_URL_SECONDS = 60 * 60 * 24;

const imageReferenceSchema = z
  .string()
  .trim()
  .min(1)
  .refine((value) => {
    if (normalizeSupabaseStoragePath(value)) {
      return true;
    }

    return isValidHttpUrl(value);
  }, "Image must be a valid HTTP/HTTPS URL or storage path");

const optionalImageReferenceSchema = imageReferenceSchema.optional();

const normalizeImageReference = (value: string | undefined) => {
  if (!value) return undefined;
  const normalized = normalizeSupabaseStoragePath(value);
  if (normalized) {
    return normalized.storagePath;
  }
  return value;
};

const ensureTripParticipant = async (
  context: { db: DB; dbUser: { id: string } },
  tripId: string,
) => {
  const participant = await context.db.query.tripParticipants.findFirst({
    where: (tp, { eq, and }) =>
      and(eq(tp.userId, context.dbUser.id), eq(tp.tripId, tripId)),
    columns: {
      id: true,
      tripId: true,
      groupId: true,
    },
  });

  if (!participant) {
    throw new ORPCError("FORBIDDEN", {
      message: "You are not a participant of this trip",
    });
  }

  return participant;
};

const ensureTripExists = async (context: { db: DB }, tripId: string) => {
  const trip = await context.db.query.trips.findFirst({
    where: (t, { eq }) => eq(t.id, tripId),
    columns: { id: true },
  });

  if (!trip) {
    throw new ORPCError("NOT_FOUND", { message: "Trip not found" });
  }

  return trip;
};

const updateUserLastSeenOn = async (context: {
  db: DB;
  dbUser: { id: string };
}) => {
  await context.db
    .update(users)
    .set({ lastSeenOn: new Date() })
    .where(eq(users.id, context.dbUser.id));
};

export interface ActivityWithRelations {
  id: string;
  tripId: string;
  activityType: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  isPinned: boolean;
  isHidden: boolean;
  hiddenAt: Date | null;
  hiddenReason: string | null;
  createdByAdmin: string | null;
  createdAt: Date;
  updatedAt: Date;
  admin: { id: string; firstName: string; lastName: string } | null;
  hiddenBy: { id: string; firstName: string; lastName: string } | null;
  submissionActivity: {
    submissionId: string;
    challengeId: string;
    groupId: string;
    hasVideo: boolean;
    isWinner: boolean;
    ranking: number | null;
    pointsAwarded: number | null;
    submission: {
      id: string;
      status: string;
      awardedPoints: number | null;
      bonusPoints: number | null;
      ranking: number | null;
      createdAt: Date;
    } | null;
    challenge: {
      id: string;
      name: string;
      status: string;
      submissionType: string | null;
      endTime: Date | null;
    } | null;
    group: {
      id: string;
      name: string;
      image: string | null;
      coins: number;
    } | null;
  } | null;
  challengeActivity: {
    challengeId: string;
    eventType: string;
    endTime: Date | null;
    submissionType: string | null;
    basePoints: number | null;
    submissionCount: number | null;
    challenge: {
      id: string;
      name: string;
      description: string | null;
      image: string | null;
      status: string;
      startTime: Date | null;
      endTime: Date | null;
      votingStartTime: Date | null;
      votingEndTime: Date | null;
    } | null;
  } | null;
  rankChangeActivity: {
    groupId: string;
    newRank: number;
    totalCoins: number;
    coinsGained: number;
    group: {
      id: string;
      name: string;
      image: string | null;
      coins: number;
    } | null;
  } | null;
  userPost: {
    authorId: string;
    additionalImages: string[];
    author: {
      id: string;
      userId: string;
      tripId: string;
      groupId: string | null;
      user: {
        id: string;
        firstName: string;
        lastName: string;
        hasAvatar: boolean;
      } | null;
      group: {
        id: string;
        name: string;
        image: string | null;
      } | null;
    } | null;
  } | null;
};

const emptyReactionCounts = () => ({
  heart: 0,
  fire: 0,
  clap: 0,
  star: 0,
});

const resolveActivityImage = async (
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
  },
  imageUrl: string | null | undefined,
) => {
  if (!imageUrl) return null;

  const parsed = normalizeSupabaseStoragePath(imageUrl);
  if (!parsed) {
    return imageUrl;
  }

  const { data, error } = await supabase.storage
    .from(parsed.bucket)
    .createSignedUrl(parsed.path, ACTIVITY_IMAGE_SIGNED_URL_SECONDS);

  if (error || !data?.signedUrl) {
    return null;
  }

  return data.signedUrl;
};

const enrichActivities = async (
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
  },
  activities: ActivityWithRelations[],
) => {
  if (activities.length === 0) {
    return activities;
  }

  const activityIds = activities.map((activity) => activity.id);

  const [reactionGroups, myReactions] = await Promise.all([
    context.db
      .select({
        activityId: activityReactions.activityId,
        reactionType: activityReactions.reactionType,
        count: count(),
      })
      .from(activityReactions)
      .where(inArray(activityReactions.activityId, activityIds))
      .groupBy(activityReactions.activityId, activityReactions.reactionType),
    context.db.query.activityReactions.findMany({
      where: (ar, { eq, and, inArray }) =>
        and(
          inArray(ar.activityId, activityIds),
          eq(ar.userId, context.dbUser.id),
        ),
      columns: {
        activityId: true,
        reactionType: true,
      },
    }),
  ]);

  const countsByActivity = new Map<
    string,
    ReturnType<typeof emptyReactionCounts>
  >();

  for (const group of reactionGroups) {
    const counts =
      countsByActivity.get(group.activityId) ?? emptyReactionCounts();
    if (group.reactionType in counts) {
      counts[group.reactionType as keyof typeof counts] = Number(group.count);
    }
    countsByActivity.set(group.activityId, counts);
  }

  const myReactionsByActivity = new Map<string, Set<string>>();
  for (const reaction of myReactions) {
    const values =
      myReactionsByActivity.get(reaction.activityId) ?? new Set<string>();
    values.add(reaction.reactionType);
    myReactionsByActivity.set(reaction.activityId, values);
  }

  const imageCache = new Map<string, Promise<string | null>>();
  const rankByTripGroup = new Map<string, number>();

  const submissionTripIds = Array.from(
    new Set(
      activities
        .filter((activity) => Boolean(activity.submissionActivity))
        .map((activity) => activity.tripId),
    ),
  );

  await Promise.all(
    submissionTripIds.map(async (tripId) => {
      const rankedGroups = await context.db.query.groups.findMany({
        where: (g, { eq, and }) =>
          and(eq(g.tripId, tripId), eq(g.isDeleted, false)),
        orderBy: (g, { desc, asc }) => [desc(g.coins), asc(g.id)],
        columns: { id: true },
      });

      rankedGroups.forEach((group, index) => {
        rankByTripGroup.set(`${tripId}:${group.id}`, index + 1);
      });
    }),
  );

  const getResolvedImage = (value: string | null | undefined) => {
    if (!value) {
      return Promise.resolve<string | null>(null);
    }

    const cached = imageCache.get(value);
    if (cached) {
      return cached;
    }

    const loader = resolveActivityImage(context.supabase, value);
    imageCache.set(value, loader);
    return loader;
  };

  return Promise.all(
    activities.map(async (activity) => {
      const submissionActivity = activity.submissionActivity
        ? {
            ...activity.submissionActivity,
            currentGroupRank:
              rankByTripGroup.get(
                `${activity.tripId}:${activity.submissionActivity.groupId}`,
              ) ?? null,
            group: {
              ...activity.submissionActivity.group,
              image: await getResolvedImage(
                activity.submissionActivity.group?.image,
              ),
            },
          }
        : null;

      const challengeActivity = activity.challengeActivity
        ? {
            ...activity.challengeActivity,
            challenge: {
              ...activity.challengeActivity.challenge,
              image: await getResolvedImage(
                activity.challengeActivity.challenge?.image,
              ),
            },
          }
        : null;

      const rankChangeActivity = activity.rankChangeActivity
        ? {
            ...activity.rankChangeActivity,
            group: {
              ...activity.rankChangeActivity.group,
              image: await getResolvedImage(
                activity.rankChangeActivity.group?.image,
              ),
            },
          }
        : null;

      const userPost = activity.userPost
        ? {
            ...activity.userPost,
            additionalImages: await Promise.all(
              activity.userPost.additionalImages.map((image) =>
                getResolvedImage(image),
              ),
            ),
            author: {
              ...activity.userPost.author,
              group: activity.userPost.author?.group
                ? {
                    ...activity.userPost.author.group,
                    image: await getResolvedImage(
                      activity.userPost.author.group.image,
                    ),
                  }
                : null,
            },
          }
        : null;

      const counts =
        countsByActivity.get(activity.id) ?? emptyReactionCounts();
      const total = Object.values(counts).reduce(
        (sum, value) => sum + value,
        0,
      );

      return {
        ...activity,
        imageUrl: await getResolvedImage(activity.imageUrl),
        submissionActivity,
        challengeActivity,
        rankChangeActivity,
        userPost,
        reactionsSummary: {
          total,
          counts,
          myReactions: Array.from(
            myReactionsByActivity.get(activity.id) ?? [],
          ),
        },
      };
    }),
  );
};

const buildActivityWhere = (
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
            and(
              eq(activityFeeds.createdAt, cursor.createdAt),
              lt(activityFeeds.id, cursor.id),
            ),
          ),
        ),
        eq(activityFeeds.isPinned, false),
      )
    : and(
        eq(activityFeeds.isPinned, false),
        or(
          lt(activityFeeds.createdAt, cursor.createdAt),
          and(
            eq(activityFeeds.createdAt, cursor.createdAt),
            lt(activityFeeds.id, cursor.id),
          ),
        ),
      );

  return and(baseWhere, cursorWhere);
};

const fetchActivityWithRelationsById = async (db: DB, id: string) => {
  return db.query.activityFeeds.findFirst({
    where: (af, { eq }) => eq(af.id, id),
    columns: {
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
    },
    with: {
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
    },
  });
};

const getActivitiesPage = async (params: {
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
  const whereClause = buildActivityWhere(
    params.tripId,
    params.includeHidden,
  );

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
    columns: {
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
    },
    with: {
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
            columns: {
              id: true,
              userId: true,
              tripId: true,
              groupId: true,
            },
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
    },
    orderBy: (af, { desc }) => [
      desc(af.isPinned),
      desc(af.createdAt),
      desc(af.id),
    ],
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

const getActivitiesCursorPage = async (params: {
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
    columns: {
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
    },
    with: {
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
            columns: {
              id: true,
              userId: true,
              tripId: true,
              groupId: true,
            },
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
    },
    orderBy: (af, { desc }) => [
      desc(af.isPinned),
      desc(af.createdAt),
      desc(af.id),
    ],
    limit: params.pageSize + 1,
  });

  const hasMore = activities.length > params.pageSize;
  const currentPageActivities = hasMore
    ? activities.slice(0, params.pageSize)
    : activities;
  const lastActivity =
    currentPageActivities[currentPageActivities.length - 1];

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

const getReactionSummary = async (params: {
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
        and(
          eq(ar.activityId, params.activityId),
          eq(ar.userId, params.context.dbUser.id),
        ),
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

export const activityFeedRouter = createORPCRouter({
  getByTrip: protectedProcedure
    .input(
      z.object({
        tripId: z.string(),
        page: z.number().int().min(1).default(1),
        pageSize: z.number().int().min(1).max(100).default(30),
        cursor: activityCursorSchema.optional(),
      }),
    )
    .handler(async ({ context, input }) => {
      await ensureTripParticipant(context, input.tripId);

      const activitiesPromise =
        !input.cursor && input.page > 1
          ? getActivitiesPage({
              context,
              tripId: input.tripId,
              page: input.page,
              pageSize: input.pageSize,
              includeHidden: false,
            })
          : getActivitiesCursorPage({
              context,
              tripId: input.tripId,
              pageSize: input.pageSize,
              includeHidden: false,
              cursor: input.cursor ?? null,
            });

      const [activities] = await Promise.all([
        activitiesPromise,
        updateUserLastSeenOn(context),
      ]);

      return activities;
    }),

  getByTripModeration: moderatorProcedure
    .input(
      z.object({
        tripId: z.string(),
        page: z.number().int().min(1).default(1),
        pageSize: z.number().int().min(1).max(100).default(20),
      }),
    )
    .handler(async ({ context, input }) => {
      await ensureTripExists(context, input.tripId);

      return getActivitiesPage({
        context,
        tripId: input.tripId,
        page: input.page,
        pageSize: input.pageSize,
        includeHidden: true,
      });
    }),

  getById: moderatorProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ context, input }) => {
      const activity = await fetchActivityWithRelationsById(
        context.db,
        input.id,
      );

      if (!activity) {
        throw new ORPCError("NOT_FOUND", { message: "Activity not found" });
      }

      const [enriched] = await enrichActivities(context, [activity]);
      return enriched;
    }),

  createCustom: moderatorProcedure
    .input(
      z.object({
        tripId: z.string(),
        title: z.string().trim().min(1),
        description: z.string().trim().optional(),
        imageUrl: optionalImageReferenceSchema,
        isPinned: z.boolean().optional(),
      }),
    )
    .handler(async ({ context, input }) => {
      await ensureTripExists(context, input.tripId);

      const [activity] = await context.db
        .insert(activityFeeds)
        .values({
          tripId: input.tripId,
          activityType: "custom",
          title: input.title,
          description: input.description,
          imageUrl: normalizeImageReference(input.imageUrl),
          isPinned: input.isPinned,
          createdByAdmin: context.dbUser.id,
        })
        .returning();

      if (!activity) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Failed to create activity",
        });
      }

      const result = await fetchActivityWithRelationsById(
        context.db,
        activity.id,
      );
      if (!result) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Failed to fetch created activity",
        });
      }

      const [enriched] = await enrichActivities(context, [result]);
      return enriched;
    }),

  createUserPost: protectedProcedure
    .input(
      z.object({
        tripId: z.string(),
        title: z.string().trim().min(1),
        description: z.string().trim().optional(),
        imageUrl: optionalImageReferenceSchema,
        additionalImages: z.array(imageReferenceSchema).max(10).optional(),
      }),
    )
    .handler(async ({ context, input }) => {
      const participant = await ensureTripParticipant(context, input.tripId);

      const activity = await context.db.transaction(async (tx) => {
        const [feed] = await tx.insert(activityFeeds).values({
          tripId: input.tripId,
          activityType: "user_post",
          title: input.title,
          description: input.description,
          imageUrl: normalizeImageReference(input.imageUrl),
        }).returning();

        if (!feed) {
          throw new ORPCError("INTERNAL_SERVER_ERROR", {
            message: "Failed to create activity",
          });
        }

        await tx.insert(userPosts).values({
          activityId: feed.id,
          authorId: participant.id,
          additionalImages: (input.additionalImages ?? []).map((image) =>
            normalizeImageReference(image) ?? image,
          ),
        });

        return feed;
      });

      const result = await fetchActivityWithRelationsById(
        context.db,
        activity.id,
      );
      if (!result) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Failed to fetch created activity",
        });
      }

      const [enriched] = await enrichActivities(context, [result]);
      return enriched;
    }),

  createSubmissionActivity: moderatorProcedure
    .input(
      z.object({
        tripId: z.string(),
        submissionId: z.string(),
        challengeId: z.string(),
        groupId: z.string(),
        title: z.string().trim().min(1),
        description: z.string().trim().optional(),
        imageUrl: optionalImageReferenceSchema,
        hasVideo: z.boolean().optional(),
        isWinner: z.boolean().optional(),
        ranking: z.number().int().min(1).optional(),
        pointsAwarded: z.number().int().min(0).optional(),
        isPinned: z.boolean().optional(),
      }),
    )
    .handler(async ({ context, input }) => {
      const submission = await context.db.query.challengeSubmissions.findFirst(
        {
          where: (cs, { eq, and }) =>
            and(
              eq(cs.id, input.submissionId),
              eq(cs.challengeId, input.challengeId),
              eq(cs.groupId, input.groupId),
            ),
          columns: {
            id: true,
            videoId: true,
            imageIds: true,
          },
          with: {
            challenge: { columns: { tripId: true } },
          },
        },
      );

      if (!submission || submission.challenge?.tripId !== input.tripId) {
        throw new ORPCError("NOT_FOUND", {
          message: "Submission not found in selected trip",
        });
      }

      const activity = await context.db.transaction(async (tx) => {
        const [feed] = await tx.insert(activityFeeds).values({
          tripId: input.tripId,
          activityType: "submission",
          title: input.title,
          description: input.description,
          imageUrl: submission.imageIds[0] ?? null,
          isPinned: input.isPinned,
          createdByAdmin: context.dbUser.id,
        }).returning();

        if (!feed) {
          throw new ORPCError("INTERNAL_SERVER_ERROR", {
            message: "Failed to create activity",
          });
        }

        await tx.insert(submissionActivities).values({
          activityId: feed.id,
          submissionId: input.submissionId,
          challengeId: input.challengeId,
          groupId: input.groupId,
          hasVideo: input.hasVideo ?? Boolean(submission.videoId),
          isWinner: input.isWinner ?? false,
          ranking: input.ranking,
          pointsAwarded: input.pointsAwarded,
        });

        return feed;
      });

      const result = await fetchActivityWithRelationsById(
        context.db,
        activity.id,
      );
      if (!result) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Failed to fetch created activity",
        });
      }

      const [enriched] = await enrichActivities(context, [result]);
      return enriched;
    }),

  createChallengeActivity: moderatorProcedure
    .input(
      z.object({
        tripId: z.string(),
        challengeId: z.string(),
        eventType: z.enum(CHALLENGE_EVENT_TYPES),
        title: z.string().trim().min(1),
        description: z.string().trim().optional(),
        endTime: z.coerce.date().optional(),
        submissionType: z
          .enum([
            "IMAGE",
            "MULTI_IMAGE",
            "VIDEO",
            "TEXT",
            "IMAGE_LOCATION",
            "LOCATION",
            "QR_CODE",
          ])
          .optional(),
        basePoints: z.number().int().min(0).optional(),
        submissionCount: z.number().int().min(0).optional(),
        isPinned: z.boolean().optional(),
      }),
    )
    .handler(async ({ context, input }) => {
      const challenge = await context.db.query.challenges.findFirst({
        where: (c, { eq, and }) =>
          and(eq(c.id, input.challengeId), eq(c.tripId, input.tripId)),
        columns: {
          id: true,
          description: true,
          image: true,
          endTime: true,
          submissionType: true,
          basePoints: true,
        },
      });

      if (!challenge) {
        throw new ORPCError("NOT_FOUND", {
          message: "Challenge not found in selected trip",
        });
      }

      const activity = await context.db.transaction(async (tx) => {
        const [feed] = await tx.insert(activityFeeds).values({
          tripId: input.tripId,
          activityType: "challenge_event",
          title: input.title,
          description: input.description ?? challenge.description ?? undefined,
          imageUrl: challenge.image,
          isPinned: input.isPinned,
          createdByAdmin: context.dbUser.id,
        }).returning();

        if (!feed) {
          throw new ORPCError("INTERNAL_SERVER_ERROR", {
            message: "Failed to create activity",
          });
        }

        await tx.insert(challengeActivities).values({
          activityId: feed.id,
          challengeId: input.challengeId,
          eventType: input.eventType,
          endTime: input.endTime ?? challenge.endTime,
          submissionType: input.submissionType ?? challenge.submissionType,
          basePoints: input.basePoints ?? challenge.basePoints,
          submissionCount: input.submissionCount,
        });

        return feed;
      });

      const result = await fetchActivityWithRelationsById(
        context.db,
        activity.id,
      );
      if (!result) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Failed to fetch created activity",
        });
      }

      const [enriched] = await enrichActivities(context, [result]);
      return enriched;
    }),

  createRankChangeActivity: moderatorProcedure
    .input(
      z.object({
        tripId: z.string(),
        groupId: z.string(),
        newRank: z.number().int().min(1),
        totalCoins: z.number().int().min(0),
        coinsGained: z.number().int(),
        title: z.string().trim().min(1),
        description: z.string().trim().optional(),
        isPinned: z.boolean().optional(),
      }),
    )
    .handler(async ({ context, input }) => {
      const group = await context.db.query.groups.findFirst({
        where: (g, { eq, and }) =>
          and(eq(g.id, input.groupId), eq(g.tripId, input.tripId)),
        columns: {
          id: true,
          image: true,
        },
      });

      if (!group) {
        throw new ORPCError("NOT_FOUND", {
          message: "Group not found in selected trip",
        });
      }

      const activity = await context.db.transaction(async (tx) => {
        const [feed] = await tx.insert(activityFeeds).values({
          tripId: input.tripId,
          activityType: "rank_change",
          title: input.title,
          description: input.description,
          imageUrl: group.image,
          isPinned: input.isPinned,
          createdByAdmin: context.dbUser.id,
        }).returning();

        if (!feed) {
          throw new ORPCError("INTERNAL_SERVER_ERROR", {
            message: "Failed to create activity",
          });
        }

        await tx.insert(rankChangeActivities).values({
          activityId: feed.id,
          groupId: input.groupId,
          newRank: input.newRank,
          totalCoins: input.totalCoins,
          coinsGained: input.coinsGained,
        });

        return feed;
      });

      const result = await fetchActivityWithRelationsById(
        context.db,
        activity.id,
      );
      if (!result) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Failed to fetch created activity",
        });
      }

      const [enriched] = await enrichActivities(context, [result]);
      return enriched;
    }),

  update: moderatorProcedure
    .input(
      z.object({
        activityId: z.string(),
        title: z.string().trim().min(1).optional(),
        description: z.string().trim().nullable().optional(),
        isPinned: z.boolean().optional(),
      }),
    )
    .handler(async ({ context, input }) => {
      const updateData: Record<string, unknown> = {};

      if (input.title !== undefined) {
        updateData.title = input.title;
      }
      if (input.description !== undefined) {
        updateData.description = input.description;
      }
      if (input.isPinned !== undefined) {
        updateData.isPinned = input.isPinned;
      }

      if (Object.keys(updateData).length === 0) {
        throw new ORPCError("BAD_REQUEST", {
          message: "No fields provided to update",
        });
      }

      const [activity] = await context.db
        .update(activityFeeds)
        .set(updateData)
        .where(eq(activityFeeds.id, input.activityId))
        .returning();

      if (!activity) {
        throw new ORPCError("NOT_FOUND", { message: "Activity not found" });
      }

      const result = await fetchActivityWithRelationsById(
        context.db,
        activity.id,
      );
      if (!result) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Failed to fetch updated activity",
        });
      }

      const [enriched] = await enrichActivities(context, [result]);
      return enriched;
    }),

  setPinned: moderatorProcedure
    .input(
      z.object({
        activityId: z.string(),
        isPinned: z.boolean(),
      }),
    )
    .handler(async ({ context, input }) => {
      const [activity] = await context.db
        .update(activityFeeds)
        .set({ isPinned: input.isPinned })
        .where(eq(activityFeeds.id, input.activityId))
        .returning();

      if (!activity) {
        throw new ORPCError("NOT_FOUND", { message: "Activity not found" });
      }

      const result = await fetchActivityWithRelationsById(
        context.db,
        activity.id,
      );
      if (!result) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Failed to fetch updated activity",
        });
      }

      const [enriched] = await enrichActivities(context, [result]);
      return enriched;
    }),

  hide: moderatorProcedure
    .input(
      z.object({
        activityId: z.string(),
        reason: z.string().trim().optional(),
      }),
    )
    .handler(async ({ context, input }) => {
      const [activity] = await context.db
        .update(activityFeeds)
        .set({
          isHidden: true,
          hiddenByAdmin: context.dbUser.id,
          hiddenAt: new Date(),
          hiddenReason: input.reason,
        })
        .where(eq(activityFeeds.id, input.activityId))
        .returning();

      if (!activity) {
        throw new ORPCError("NOT_FOUND", { message: "Activity not found" });
      }

      const result = await fetchActivityWithRelationsById(
        context.db,
        activity.id,
      );
      if (!result) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Failed to fetch updated activity",
        });
      }

      const [enriched] = await enrichActivities(context, [result]);
      return enriched;
    }),

  unhide: moderatorProcedure
    .input(z.object({ activityId: z.string() }))
    .handler(async ({ context, input }) => {
      const [activity] = await context.db
        .update(activityFeeds)
        .set({
          isHidden: false,
          hiddenByAdmin: null,
          hiddenAt: null,
          hiddenReason: null,
        })
        .where(eq(activityFeeds.id, input.activityId))
        .returning();

      if (!activity) {
        throw new ORPCError("NOT_FOUND", { message: "Activity not found" });
      }

      const result = await fetchActivityWithRelationsById(
        context.db,
        activity.id,
      );
      if (!result) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Failed to fetch updated activity",
        });
      }

      const [enriched] = await enrichActivities(context, [result]);
      return enriched;
    }),

  toggleReaction: protectedProcedure
    .input(
      z.object({
        activityId: z.string(),
        reactionType: z.enum(REACTION_TYPES),
      }),
    )
    .handler(async ({ context, input }) => {
      const activity = await context.db.query.activityFeeds.findFirst({
        where: (af, { eq }) => eq(af.id, input.activityId),
        columns: {
          id: true,
          tripId: true,
          isHidden: true,
        },
      });

      if (!activity) {
        throw new ORPCError("NOT_FOUND", { message: "Activity not found" });
      }

      await ensureTripParticipant(context, activity.tripId);

      if (activity.isHidden) {
        throw new ORPCError("FORBIDDEN", {
          message: "This activity is hidden",
        });
      }

      const existing = await context.db.query.activityReactions.findFirst({
        where: (ar, { eq, and }) =>
          and(
            eq(ar.activityId, input.activityId),
            eq(ar.userId, context.dbUser.id),
            eq(ar.reactionType, input.reactionType),
          ),
        columns: {
          id: true,
        },
      });

      const isActive = !existing;

      if (existing) {
        await context.db
          .delete(activityReactions)
          .where(eq(activityReactions.id, existing.id));
      } else {
        await context.db.insert(activityReactions).values({
          activityId: input.activityId,
          userId: context.dbUser.id,
          reactionType: input.reactionType,
        });
      }

      return {
        activityId: input.activityId,
        reactionType: input.reactionType,
        isActive,
        reactionsSummary: await getReactionSummary({
          context,
          activityId: input.activityId,
        }),
      };
    }),

  delete: adminProcedure
    .input(z.object({ activityId: z.string() }))
    .handler(async ({ context, input }) => {
      await context.db
        .delete(activityFeeds)
        .where(eq(activityFeeds.id, input.activityId));

      return { success: true };
    }),
});
