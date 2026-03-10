import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  protectedProcedure,
  moderatorProcedure,
  adminProcedure,
} from "../../api/trpc";
import { type Prisma } from "@mirai-app/db";
import { normalizeSupabaseStoragePath } from "../../utils/storage";

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

    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  }, "Image must be a valid URL or storage path");

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
  ctx: { db: Prisma.TransactionClient; dbUser: { id: string } },
  tripId: string,
) => {
  const participant = await ctx.db.tripParticipant.findUnique({
    where: {
      userId_tripId: {
        userId: ctx.dbUser.id,
        tripId,
      },
    },
    select: {
      id: true,
      tripId: true,
      groupId: true,
    },
  });

  if (!participant) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You are not a participant of this trip",
    });
  }

  return participant;
};

const ensureTripExists = async (
  ctx: { db: Prisma.TransactionClient },
  tripId: string,
) => {
  const trip = await ctx.db.trip.findUnique({
    where: { id: tripId },
    select: { id: true },
  });

  if (!trip) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Trip not found",
    });
  }

  return trip;
};

const updateUserLastSeenOn = async (ctx: {
  db: Prisma.TransactionClient;
  dbUser: { id: string };
}) => {
  await ctx.db.$executeRaw`
    UPDATE "User"
    SET "last_seen_on" = NOW()
    WHERE "id" = ${ctx.dbUser.id}
  `;
};

const activitySelect = {
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
  admin: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
    },
  },
  hiddenBy: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
    },
  },
  submissionActivity: {
    select: {
      submissionId: true,
      challengeId: true,
      groupId: true,
      hasVideo: true,
      isWinner: true,
      ranking: true,
      pointsAwarded: true,
      submission: {
        select: {
          id: true,
          status: true,
          awardedPoints: true,
          bonusPoints: true,
          ranking: true,
          createdAt: true,
        },
      },
      challenge: {
        select: {
          id: true,
          name: true,
          status: true,
          submissionType: true,
          endTime: true,
        },
      },
      group: {
        select: {
          id: true,
          name: true,
          image: true,
          coins: true,
        },
      },
    },
  },
  challengeActivity: {
    select: {
      challengeId: true,
      eventType: true,
      endTime: true,
      submissionType: true,
      basePoints: true,
      submissionCount: true,
      challenge: {
        select: {
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
    select: {
      groupId: true,
      newRank: true,
      totalCoins: true,
      coinsGained: true,
      group: {
        select: {
          id: true,
          name: true,
          image: true,
          coins: true,
        },
      },
    },
  },
  userPost: {
    select: {
      authorId: true,
      additionalImages: true,
      author: {
        select: {
          id: true,
          userId: true,
          tripId: true,
          groupId: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              hasAvatar: true,
            },
          },
          group: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      },
    },
  },
  _count: {
    select: {
      reactions: true,
    },
  },
} satisfies Prisma.ActivityFeedSelect;

type SelectedActivity = Prisma.ActivityFeedGetPayload<{
  select: typeof activitySelect;
}>;

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
        ) => Promise<{ data: { signedUrl?: string | null } | null; error: unknown }>;
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
  ctx: {
    db: Prisma.TransactionClient;
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
  activities: SelectedActivity[],
) => {
  if (activities.length === 0) {
    return activities;
  }

  const activityIds = activities.map((activity) => activity.id);

  const [reactionGroups, myReactions] = await Promise.all([
    ctx.db.activityReaction.groupBy({
      by: ["activityId", "reactionType"],
      where: {
        activityId: {
          in: activityIds,
        },
      },
      _count: {
        _all: true,
      },
    }),
    ctx.db.activityReaction.findMany({
      where: {
        activityId: {
          in: activityIds,
        },
        userId: ctx.dbUser.id,
      },
      select: {
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
    const counts = countsByActivity.get(group.activityId) ?? emptyReactionCounts();
    if (group.reactionType in counts) {
      counts[group.reactionType as keyof typeof counts] = group._count._all;
    }
    countsByActivity.set(group.activityId, counts);
  }

  const myReactionsByActivity = new Map<string, Set<string>>();
  for (const reaction of myReactions) {
    const values = myReactionsByActivity.get(reaction.activityId) ?? new Set<string>();
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
      const rankedGroups = await ctx.db.group.findMany({
        where: { tripId, isDeleted: false },
        orderBy: [{ coins: "desc" }, { id: "asc" }],
        select: { id: true },
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

    const loader = resolveActivityImage(ctx.supabase, value);
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
              image: await getResolvedImage(activity.submissionActivity.group.image),
            },
          }
        : null;

      const challengeActivity = activity.challengeActivity
        ? {
            ...activity.challengeActivity,
            challenge: {
              ...activity.challengeActivity.challenge,
              image: await getResolvedImage(activity.challengeActivity.challenge.image),
            },
          }
        : null;

      const rankChangeActivity = activity.rankChangeActivity
        ? {
            ...activity.rankChangeActivity,
            group: {
              ...activity.rankChangeActivity.group,
              image: await getResolvedImage(activity.rankChangeActivity.group.image),
            },
          }
        : null;

      const userPost = activity.userPost
        ? {
            ...activity.userPost,
            additionalImages: await Promise.all(
              activity.userPost.additionalImages.map((image) => getResolvedImage(image)),
            ),
            author: {
              ...activity.userPost.author,
              group: activity.userPost.author.group
                ? {
                    ...activity.userPost.author.group,
                    image: await getResolvedImage(activity.userPost.author.group.image),
                  }
                : null,
            },
          }
        : null;

      return {
        ...activity,
        imageUrl: await getResolvedImage(activity.imageUrl),
        submissionActivity,
        challengeActivity,
        rankChangeActivity,
        userPost,
        reactionsSummary: {
          total: activity._count.reactions,
          counts: countsByActivity.get(activity.id) ?? emptyReactionCounts(),
          myReactions: Array.from(myReactionsByActivity.get(activity.id) ?? []),
        },
      };
    }),
  );
};

const getActivitiesPage = async (params: {
  ctx: {
    db: Prisma.TransactionClient;
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
  };
  tripId: string;
  page: number;
  pageSize: number;
  includeHidden: boolean;
}) => {
  const where: Prisma.ActivityFeedWhereInput = {
    tripId: params.tripId,
    ...(params.includeHidden ? {} : { isHidden: false }),
  };

  const count = await params.ctx.db.activityFeed.count({ where });
  const totalPages = Math.ceil(count / params.pageSize);

  if (params.page > totalPages && totalPages > 0) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Page ${params.page} exceeds total pages ${totalPages}`,
    });
  }

  const activities = await params.ctx.db.activityFeed.findMany({
    where,
    select: activitySelect,
    orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }, { id: "desc" }],
    take: params.pageSize,
    skip: (params.page - 1) * params.pageSize,
  });

  return {
    activities: await enrichActivities(params.ctx, activities),
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
  ctx: {
    db: Prisma.TransactionClient;
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
  const baseWhere: Prisma.ActivityFeedWhereInput = {
    tripId: params.tripId,
    ...(params.includeHidden ? {} : { isHidden: false }),
  };

  const cursorWhere: Prisma.ActivityFeedWhereInput | undefined = params.cursor
    ? params.cursor.isPinned
      ? {
          OR: [
            {
              isPinned: true,
              OR: [
                {
                  createdAt: { lt: params.cursor.createdAt },
                },
                {
                  createdAt: params.cursor.createdAt,
                  id: { lt: params.cursor.id },
                },
              ],
            },
            {
              isPinned: false,
            },
          ],
        }
      : {
          isPinned: false,
          OR: [
            {
              createdAt: { lt: params.cursor.createdAt },
            },
            {
              createdAt: params.cursor.createdAt,
              id: { lt: params.cursor.id },
            },
          ],
        }
    : undefined;

  const where: Prisma.ActivityFeedWhereInput = cursorWhere
    ? {
        ...baseWhere,
        ...cursorWhere,
      }
    : baseWhere;

  const activities = await params.ctx.db.activityFeed.findMany({
    where,
    select: activitySelect,
    orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }, { id: "desc" }],
    take: params.pageSize + 1,
  });

  const hasMore = activities.length > params.pageSize;
  const currentPageActivities = hasMore
    ? activities.slice(0, params.pageSize)
    : activities;
  const lastActivity = currentPageActivities[currentPageActivities.length - 1];

  return {
    activities: await enrichActivities(params.ctx, currentPageActivities),
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
  ctx: { db: Prisma.TransactionClient; dbUser: { id: string } };
  activityId: string;
}) => {
  const [countsRaw, myReactionsRaw] = await Promise.all([
    params.ctx.db.activityReaction.groupBy({
      by: ["reactionType"],
      where: { activityId: params.activityId },
      _count: { _all: true },
    }),
    params.ctx.db.activityReaction.findMany({
      where: {
        activityId: params.activityId,
        userId: params.ctx.dbUser.id,
      },
      select: {
        reactionType: true,
      },
    }),
  ]);

  const counts = emptyReactionCounts();
  for (const item of countsRaw) {
    if (item.reactionType in counts) {
      counts[item.reactionType as keyof typeof counts] = item._count._all;
    }
  }

  const total = Object.values(counts).reduce((sum, value) => sum + value, 0);

  return {
    total,
    counts,
    myReactions: myReactionsRaw.map((item) => item.reactionType),
  };
};

export const activityFeedRouter = createTRPCRouter({
  getByTrip: protectedProcedure
    .input(
      z.object({
        tripId: z.string(),
        page: z.number().int().min(1).default(1),
        pageSize: z.number().int().min(1).max(100).default(30),
        cursor: activityCursorSchema.optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      await ensureTripParticipant(ctx, input.tripId);

      const activitiesPromise =
        // Backward-compat for old callers that still page with page > 1.
        !input.cursor && input.page > 1
          ? getActivitiesPage({
              ctx,
              tripId: input.tripId,
              page: input.page,
              pageSize: input.pageSize,
              includeHidden: false,
            })
          : getActivitiesCursorPage({
              ctx,
              tripId: input.tripId,
              pageSize: input.pageSize,
              includeHidden: false,
              cursor: input.cursor ?? null,
            });

      const [activities] = await Promise.all([
        activitiesPromise,
        updateUserLastSeenOn(ctx),
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
    .query(async ({ ctx, input }) => {
      await ensureTripExists(ctx, input.tripId);

      return getActivitiesPage({
        ctx,
        tripId: input.tripId,
        page: input.page,
        pageSize: input.pageSize,
        includeHidden: true,
      });
    }),

  getById: moderatorProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const activity = await ctx.db.activityFeed.findUnique({
        where: { id: input.id },
        select: activitySelect,
      });

      if (!activity) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Activity not found",
        });
      }

      const [enriched] = await enrichActivities(ctx, [activity]);
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
    .mutation(async ({ ctx, input }) => {
      await ensureTripExists(ctx, input.tripId);

      const activity = await ctx.db.activityFeed.create({
        data: {
          tripId: input.tripId,
          activityType: "custom",
          title: input.title,
          description: input.description,
          imageUrl: normalizeImageReference(input.imageUrl),
          isPinned: input.isPinned,
          createdByAdmin: ctx.dbUser.id,
        },
        select: activitySelect,
      });

      const [enriched] = await enrichActivities(ctx, [activity]);
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
    .mutation(async ({ ctx, input }) => {
      const participant = await ensureTripParticipant(ctx, input.tripId);

      const activity = await ctx.db.activityFeed.create({
        data: {
          tripId: input.tripId,
          activityType: "user_post",
          title: input.title,
          description: input.description,
          imageUrl: normalizeImageReference(input.imageUrl),
          userPost: {
            create: {
              authorId: participant.id,
              additionalImages: (input.additionalImages ?? []).map((image) =>
                normalizeImageReference(image) ?? image,
              ),
            },
          },
        },
        select: activitySelect,
      });

      const [enriched] = await enrichActivities(ctx, [activity]);
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
    .mutation(async ({ ctx, input }) => {
      const submission = await ctx.db.challengeSubmission.findFirst({
        where: {
          id: input.submissionId,
          challengeId: input.challengeId,
          groupId: input.groupId,
          challenge: {
            tripId: input.tripId,
          },
        },
        select: {
          id: true,
          videoId: true,
          imageIds: true,
        },
      });

      if (!submission) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Submission not found in selected trip",
        });
      }

      const activity = await ctx.db.activityFeed.create({
        data: {
          tripId: input.tripId,
          activityType: "submission",
          title: input.title,
          description: input.description,
          // Keep activity image tied to the original submission asset.
          imageUrl: submission.imageIds[0] ?? null,
          isPinned: input.isPinned,
          createdByAdmin: ctx.dbUser.id,
          submissionActivity: {
            create: {
              submissionId: input.submissionId,
              challengeId: input.challengeId,
              groupId: input.groupId,
              hasVideo: input.hasVideo ?? Boolean(submission.videoId),
              isWinner: input.isWinner,
              ranking: input.ranking,
              pointsAwarded: input.pointsAwarded,
            },
          },
        },
        select: activitySelect,
      });

      const [enriched] = await enrichActivities(ctx, [activity]);
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
    .mutation(async ({ ctx, input }) => {
      const challenge = await ctx.db.challenge.findFirst({
        where: {
          id: input.challengeId,
          tripId: input.tripId,
        },
        select: {
          id: true,
          description: true,
          image: true,
          endTime: true,
          submissionType: true,
          basePoints: true,
        },
      });

      if (!challenge) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Challenge not found in selected trip",
        });
      }

      const activity = await ctx.db.activityFeed.create({
        data: {
          tripId: input.tripId,
          activityType: "challenge_event",
          title: input.title,
          description: input.description ?? challenge.description ?? undefined,
          // Reuse source challenge image instead of duplicating another upload.
          imageUrl: challenge.image,
          isPinned: input.isPinned,
          createdByAdmin: ctx.dbUser.id,
          challengeActivity: {
            create: {
              challengeId: input.challengeId,
              eventType: input.eventType,
              endTime: input.endTime ?? challenge.endTime,
              submissionType: input.submissionType ?? challenge.submissionType,
              basePoints: input.basePoints ?? challenge.basePoints,
              submissionCount: input.submissionCount,
            },
          },
        },
        select: activitySelect,
      });

      const [enriched] = await enrichActivities(ctx, [activity]);
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
    .mutation(async ({ ctx, input }) => {
      const group = await ctx.db.group.findFirst({
        where: {
          id: input.groupId,
          tripId: input.tripId,
        },
        select: {
          id: true,
          image: true,
        },
      });

      if (!group) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Group not found in selected trip",
        });
      }

      const activity = await ctx.db.activityFeed.create({
        data: {
          tripId: input.tripId,
          activityType: "rank_change",
          title: input.title,
          description: input.description,
          // Reuse source group image instead of duplicating another upload.
          imageUrl: group.image,
          isPinned: input.isPinned,
          createdByAdmin: ctx.dbUser.id,
          rankChangeActivity: {
            create: {
              groupId: input.groupId,
              newRank: input.newRank,
              totalCoins: input.totalCoins,
              coinsGained: input.coinsGained,
            },
          },
        },
        select: activitySelect,
      });

      const [enriched] = await enrichActivities(ctx, [activity]);
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
    .mutation(async ({ ctx, input }) => {
      const updateData: Prisma.ActivityFeedUpdateInput = {};

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
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No fields provided to update",
        });
      }

      const activity = await ctx.db.activityFeed.update({
        where: { id: input.activityId },
        data: updateData,
        select: activitySelect,
      });

      const [enriched] = await enrichActivities(ctx, [activity]);
      return enriched;
    }),

  setPinned: moderatorProcedure
    .input(
      z.object({
        activityId: z.string(),
        isPinned: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const activity = await ctx.db.activityFeed.update({
        where: { id: input.activityId },
        data: { isPinned: input.isPinned },
        select: activitySelect,
      });

      const [enriched] = await enrichActivities(ctx, [activity]);
      return enriched;
    }),

  hide: moderatorProcedure
    .input(
      z.object({
        activityId: z.string(),
        reason: z.string().trim().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const activity = await ctx.db.activityFeed.update({
        where: { id: input.activityId },
        data: {
          isHidden: true,
          hiddenByAdmin: ctx.dbUser.id,
          hiddenAt: new Date(),
          hiddenReason: input.reason,
        },
        select: activitySelect,
      });

      const [enriched] = await enrichActivities(ctx, [activity]);
      return enriched;
    }),

  unhide: moderatorProcedure
    .input(z.object({ activityId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const activity = await ctx.db.activityFeed.update({
        where: { id: input.activityId },
        data: {
          isHidden: false,
          hiddenByAdmin: null,
          hiddenAt: null,
          hiddenReason: null,
        },
        select: activitySelect,
      });

      const [enriched] = await enrichActivities(ctx, [activity]);
      return enriched;
    }),

  toggleReaction: protectedProcedure
    .input(
      z.object({
        activityId: z.string(),
        reactionType: z.enum(REACTION_TYPES),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const activity = await ctx.db.activityFeed.findUnique({
        where: { id: input.activityId },
        select: {
          id: true,
          tripId: true,
          isHidden: true,
        },
      });

      if (!activity) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Activity not found",
        });
      }

      await ensureTripParticipant(ctx, activity.tripId);

      if (activity.isHidden) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "This activity is hidden",
        });
      }

      const existing = await ctx.db.activityReaction.findUnique({
        where: {
          activityId_userId_reactionType: {
            activityId: input.activityId,
            userId: ctx.dbUser.id,
            reactionType: input.reactionType,
          },
        },
        select: {
          id: true,
        },
      });

      const isActive = !existing;

      if (existing) {
        await ctx.db.activityReaction.delete({
          where: { id: existing.id },
        });
      } else {
        await ctx.db.activityReaction.create({
          data: {
            activityId: input.activityId,
            userId: ctx.dbUser.id,
            reactionType: input.reactionType,
          },
        });
      }

      return {
        activityId: input.activityId,
        reactionType: input.reactionType,
        isActive,
        reactionsSummary: await getReactionSummary({
          ctx,
          activityId: input.activityId,
        }),
      };
    }),

  delete: adminProcedure
    .input(z.object({ activityId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.activityFeed.delete({
        where: { id: input.activityId },
      });

      return { success: true };
    }),
});
