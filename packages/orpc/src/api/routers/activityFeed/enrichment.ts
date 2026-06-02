import { count, inArray } from "drizzle-orm";
import { activityReactions } from "@mirai-app/db";
import type { DB } from "@mirai-app/db";
import { emptyReactionCounts } from "@mirai-app/shared/feed";
import { resolveSignedUrl } from "./storage";
import type { ActivityWithRelations } from "./types";

export const enrichActivities = async (
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
        and(inArray(ar.activityId, activityIds), eq(ar.userId, context.dbUser.id)),
      columns: {
        activityId: true,
        reactionType: true,
      },
    }),
  ]);

  const countsByActivity = new Map<string, ReturnType<typeof emptyReactionCounts>>();

  for (const group of reactionGroups) {
    const counts = countsByActivity.get(group.activityId) ?? emptyReactionCounts();
    if (group.reactionType in counts) {
      counts[group.reactionType as keyof typeof counts] = Number(group.count);
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
      const rankedGroups = await context.db.query.groups.findMany({
        where: (g, { eq, and }) => and(eq(g.tripId, tripId), eq(g.isDeleted, false)),
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

    const loader = resolveSignedUrl(context.supabase, value);
    imageCache.set(value, loader);
    return loader;
  };

  return Promise.all(
    activities.map(async (activity) => {
      const submissionActivity = activity.submissionActivity
        ? {
            ...activity.submissionActivity,
            currentGroupRank:
              rankByTripGroup.get(`${activity.tripId}:${activity.submissionActivity.groupId}`) ??
              null,
            group: activity.submissionActivity.group
              ? {
                  ...activity.submissionActivity.group,
                  image: await getResolvedImage(activity.submissionActivity.group.image),
                }
              : null,
          }
        : null;

      const challengeActivity = activity.challengeActivity
        ? {
            ...activity.challengeActivity,
            challenge: activity.challengeActivity.challenge
              ? {
                  ...activity.challengeActivity.challenge,
                  image: await getResolvedImage(activity.challengeActivity.challenge.image),
                }
              : null,
          }
        : null;

      const rankChangeActivity = activity.rankChangeActivity
        ? {
            ...activity.rankChangeActivity,
            group: activity.rankChangeActivity.group
              ? {
                  ...activity.rankChangeActivity.group,
                  image: await getResolvedImage(activity.rankChangeActivity.group.image),
                }
              : null,
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
              group: activity.userPost.author?.group
                ? {
                    ...activity.userPost.author.group,
                    image: await getResolvedImage(activity.userPost.author.group.image),
                  }
                : null,
            },
          }
        : null;

      const counts = countsByActivity.get(activity.id) ?? emptyReactionCounts();
      const total = Object.values(counts).reduce((sum, value) => sum + value, 0);

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
          myReactions: Array.from(myReactionsByActivity.get(activity.id) ?? []),
        },
      };
    }),
  );
};
