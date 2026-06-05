import { activityReactions } from "@mirai-app/db";
import type { DB } from "@mirai-app/db";
import { emptyReactionCounts } from "@mirai-app/shared/feed";
import { count, inArray } from "drizzle-orm";
import { resolveSignedUrl } from "./storage";
import type { Activity, RawActivityWithRelations } from "./types";
import {
  toClientActivity,
  toClientChallengeActivity,
  toClientChallengeSnippet,
  toClientGroupSnippet,
  toClientSubmissionActivity,
  toClientSubmissionSnippet,
} from "./utils";

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
  activities: RawActivityWithRelations[],
): Promise<Activity[]> => {
  if (activities.length === 0) {
    return [];
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
      const counts = countsByActivity.get(activity.id) ?? emptyReactionCounts();
      const total = Object.values(counts).reduce((sum, value) => sum + value, 0);

      const base = toClientActivity({
        ...activity,
        imageUrl: await getResolvedImage(activity.imageUrl),
        reactionsSummary: {
          total,
          counts,
          myReactions: Array.from(myReactionsByActivity.get(activity.id) ?? []),
        },
      });

      switch (activity.activityType) {
        case "custom": {
          return {
            ...base,
            activityType: "custom" as const,
            submissionActivity: null,
            challengeActivity: null,
            rankChangeActivity: null,
            userPost: null,
          };
        }

        case "user_post": {
          const rawUserPost = activity.userPost;
          return {
            ...base,
            activityType: "user_post" as const,
            userPost: rawUserPost
              ? {
                  authorId: rawUserPost.authorId,
                  additionalImages: (
                    await Promise.all(
                      rawUserPost.additionalImages.map((image) => getResolvedImage(image)),
                    )
                  ).filter((img): img is string => img !== null),
                  author: rawUserPost.author
                    ? {
                        ...rawUserPost.author,
                        group: rawUserPost.author.group
                          ? toClientGroupSnippet({
                              ...rawUserPost.author.group,
                              image: await getResolvedImage(rawUserPost.author.group.image),
                            })
                          : null,
                      }
                    : null,
                }
              : { authorId: "", additionalImages: [], author: null },
            submissionActivity: null,
            challengeActivity: null,
            rankChangeActivity: null,
          };
        }

        case "submission": {
          const rawSubmission = activity.submissionActivity;
          return {
            ...base,
            activityType: "submission" as const,
            submissionActivity: rawSubmission
              ? toClientSubmissionActivity({
                  ...rawSubmission,
                  currentGroupRank:
                    rankByTripGroup.get(`${activity.tripId}:${rawSubmission.groupId}`) ?? null,
                  group: rawSubmission.group
                    ? toClientGroupSnippet({
                        ...rawSubmission.group,
                        image: await getResolvedImage(rawSubmission.group.image),
                      })
                    : null,
                  challenge: rawSubmission.challenge
                    ? toClientChallengeSnippet(rawSubmission.challenge)
                    : null,
                  submission: rawSubmission.submission
                    ? toClientSubmissionSnippet(rawSubmission.submission)
                    : null,
                })
              : {
                  submissionId: "",
                  challengeId: "",
                  groupId: "",
                  hasVideo: false,
                  isWinner: false,
                  ranking: 0,
                  pointsAwarded: 0,
                  currentGroupRank: null,
                  group: null,
                  challenge: null,
                  submission: null,
                },
            challengeActivity: null,
            rankChangeActivity: null,
            userPost: null,
          };
        }

        case "challenge_event": {
          const rawChallenge = activity.challengeActivity;
          return {
            ...base,
            activityType: "challenge_event" as const,
            challengeActivity: rawChallenge
              ? toClientChallengeActivity({
                  ...rawChallenge,
                  challenge: rawChallenge.challenge
                    ? toClientChallengeSnippet({
                        ...rawChallenge.challenge,
                        image: await getResolvedImage(rawChallenge.challenge.image),
                      })
                    : null,
                })
              : {
                  challengeId: "",
                  eventType: "",
                  endTime: null,
                  submissionType: "",
                  basePoints: 0,
                  submissionCount: 0,
                  challenge: null,
                },
            submissionActivity: null,
            rankChangeActivity: null,
            userPost: null,
          };
        }

        case "rank_change": {
          const rawRankChange = activity.rankChangeActivity;
          return {
            ...base,
            activityType: "rank_change" as const,
            rankChangeActivity: rawRankChange
              ? {
                  ...rawRankChange,
                  group: rawRankChange.group
                    ? toClientGroupSnippet({
                        ...rawRankChange.group,
                        image: await getResolvedImage(rawRankChange.group.image),
                      })
                    : null,
                }
              : {
                  groupId: "",
                  newRank: 0,
                  totalCoins: 0,
                  coinsGained: 0,
                  group: null,
                },
            submissionActivity: null,
            challengeActivity: null,
            userPost: null,
          };
        }

        default: {
          // Fallback for unknown activity types — treat as custom
          return {
            ...base,
            activityType: "custom" as const,
            submissionActivity: null,
            challengeActivity: null,
            rankChangeActivity: null,
            userPost: null,
          };
        }
      }
    }),
  );
};
