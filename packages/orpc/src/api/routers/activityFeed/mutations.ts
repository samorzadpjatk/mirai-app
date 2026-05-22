import { ORPCError } from "@orpc/server";
import { eq } from "drizzle-orm";
import {
  activityFeeds,
  activityReactions,
  submissionActivities,
  challengeActivities,
  rankChangeActivities,
  userPosts,
} from "@mirai-app/db";
import type { DB } from "@mirai-app/db";
import {
  ensureTripParticipant,
  ensureTripExists,
  normalizeImageReference,
} from "./utils";
import { fetchActivityWithRelationsById, getReactionSummary } from "./queries";
import type { ActivityContext } from "./queries";
import { enrichActivities } from "./enrichment";

export const createCustom = async (
  context: ActivityContext,
  input: {
    tripId: string;
    title: string;
    description?: string;
    imageUrl?: string;
    isPinned?: boolean;
  },
) => {
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

  const result = await fetchActivityWithRelationsById(context.db, activity.id);
  if (!result) {
    throw new ORPCError("INTERNAL_SERVER_ERROR", {
      message: "Failed to fetch created activity",
    });
  }

  const [enriched] = await enrichActivities(context, [result]);
  return enriched;
};

export const createUserPost = async (
  context: ActivityContext,
  input: {
    tripId: string;
    title: string;
    description?: string;
    imageUrl?: string;
    additionalImages?: string[];
  },
) => {
  const participant = await ensureTripParticipant(context, input.tripId);

  const activity = await context.db.transaction(async (tx) => {
    const [feed] = await tx
      .insert(activityFeeds)
      .values({
        tripId: input.tripId,
        activityType: "user_post",
        title: input.title,
        description: input.description,
        imageUrl: normalizeImageReference(input.imageUrl),
      })
      .returning();

    if (!feed) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Failed to create activity",
      });
    }

    await tx.insert(userPosts).values({
      activityId: feed.id,
      authorId: participant.id,
      additionalImages: (input.additionalImages ?? []).map(
        (image) => normalizeImageReference(image) ?? image,
      ),
    });

    return feed;
  });

  const result = await fetchActivityWithRelationsById(context.db, activity.id);
  if (!result) {
    throw new ORPCError("INTERNAL_SERVER_ERROR", {
      message: "Failed to fetch created activity",
    });
  }

  const [enriched] = await enrichActivities(context, [result]);
  return enriched;
};

export const createSubmissionActivity = async (
  context: ActivityContext,
  input: {
    tripId: string;
    submissionId: string;
    challengeId: string;
    groupId: string;
    title: string;
    description?: string;
    imageUrl?: string;
    hasVideo?: boolean;
    isWinner?: boolean;
    ranking?: number;
    pointsAwarded?: number;
    isPinned?: boolean;
  },
) => {
  const submission = await context.db.query.challengeSubmissions.findFirst({
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
  });

  if (!submission || submission.challenge?.tripId !== input.tripId) {
    throw new ORPCError("NOT_FOUND", {
      message: "Submission not found in selected trip",
    });
  }

  const activity = await context.db.transaction(async (tx) => {
    const [feed] = await tx
      .insert(activityFeeds)
      .values({
        tripId: input.tripId,
        activityType: "submission",
        title: input.title,
        description: input.description,
        imageUrl: submission.imageIds[0] ?? null,
        isPinned: input.isPinned,
        createdByAdmin: context.dbUser.id,
      })
      .returning();

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

  const result = await fetchActivityWithRelationsById(context.db, activity.id);
  if (!result) {
    throw new ORPCError("INTERNAL_SERVER_ERROR", {
      message: "Failed to fetch created activity",
    });
  }

  const [enriched] = await enrichActivities(context, [result]);
  return enriched;
};

export const createChallengeActivity = async (
  context: ActivityContext,
  input: {
    tripId: string;
    challengeId: string;
    eventType: "challenge_started" | "voting_started" | "completed";
    title: string;
    description?: string;
    endTime?: Date;
    submissionType?:
      | "IMAGE"
      | "MULTI_IMAGE"
      | "VIDEO"
      | "TEXT"
      | "IMAGE_LOCATION"
      | "LOCATION"
      | "QR_CODE";
    basePoints?: number;
    submissionCount?: number;
    isPinned?: boolean;
  },
) => {
  const challenge = await context.db.query.challenges.findFirst({
    where: (c, { eq, and }) => and(eq(c.id, input.challengeId), eq(c.tripId, input.tripId)),
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
    const [feed] = await tx
      .insert(activityFeeds)
      .values({
        tripId: input.tripId,
        activityType: "challenge_event",
        title: input.title,
        description: input.description ?? challenge.description ?? undefined,
        imageUrl: challenge.image,
        isPinned: input.isPinned,
        createdByAdmin: context.dbUser.id,
      })
      .returning();

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

  const result = await fetchActivityWithRelationsById(context.db, activity.id);
  if (!result) {
    throw new ORPCError("INTERNAL_SERVER_ERROR", {
      message: "Failed to fetch created activity",
    });
  }

  const [enriched] = await enrichActivities(context, [result]);
  return enriched;
};

export const createRankChangeActivity = async (
  context: ActivityContext,
  input: {
    tripId: string;
    groupId: string;
    newRank: number;
    totalCoins: number;
    coinsGained: number;
    title: string;
    description?: string;
    isPinned?: boolean;
  },
) => {
  const group = await context.db.query.groups.findFirst({
    where: (g, { eq, and }) => and(eq(g.id, input.groupId), eq(g.tripId, input.tripId)),
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
    const [feed] = await tx
      .insert(activityFeeds)
      .values({
        tripId: input.tripId,
        activityType: "rank_change",
        title: input.title,
        description: input.description,
        imageUrl: group.image,
        isPinned: input.isPinned,
        createdByAdmin: context.dbUser.id,
      })
      .returning();

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

  const result = await fetchActivityWithRelationsById(context.db, activity.id);
  if (!result) {
    throw new ORPCError("INTERNAL_SERVER_ERROR", {
      message: "Failed to fetch created activity",
    });
  }

  const [enriched] = await enrichActivities(context, [result]);
  return enriched;
};

export const update = async (
  context: ActivityContext,
  input: {
    activityId: string;
    title?: string;
    description?: string | null;
    isPinned?: boolean;
  },
) => {
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

  const result = await fetchActivityWithRelationsById(context.db, activity.id);
  if (!result) {
    throw new ORPCError("INTERNAL_SERVER_ERROR", {
      message: "Failed to fetch created activity",
    });
  }

  const [enriched] = await enrichActivities(context, [result]);
  return enriched;
};

export const setPinned = async (
  context: ActivityContext,
  input: {
    activityId: string;
    isPinned: boolean;
  },
) => {
  const [activity] = await context.db
    .update(activityFeeds)
    .set({ isPinned: input.isPinned })
    .where(eq(activityFeeds.id, input.activityId))
    .returning();

  if (!activity) {
    throw new ORPCError("NOT_FOUND", { message: "Activity not found" });
  }

  const result = await fetchActivityWithRelationsById(context.db, activity.id);
  if (!result) {
    throw new ORPCError("INTERNAL_SERVER_ERROR", {
      message: "Failed to fetch created activity",
    });
  }

  const [enriched] = await enrichActivities(context, [result]);
  return enriched;
};

export const hide = async (
  context: ActivityContext,
  input: {
    activityId: string;
    reason?: string;
  },
) => {
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

  const result = await fetchActivityWithRelationsById(context.db, activity.id);
  if (!result) {
    throw new ORPCError("INTERNAL_SERVER_ERROR", {
      message: "Failed to fetch created activity",
    });
  }

  const [enriched] = await enrichActivities(context, [result]);
  return enriched;
};

export const unhide = async (
  context: ActivityContext,
  input: {
    activityId: string;
  },
) => {
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

  const result = await fetchActivityWithRelationsById(context.db, activity.id);
  if (!result) {
    throw new ORPCError("INTERNAL_SERVER_ERROR", {
      message: "Failed to fetch created activity",
    });
  }

  const [enriched] = await enrichActivities(context, [result]);
  return enriched;
};

export const toggleReaction = async (
  context: ActivityContext,
  input: {
    activityId: string;
    reactionType: "heart" | "fire" | "clap" | "star";
  },
) => {
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
    await context.db.delete(activityReactions).where(eq(activityReactions.id, existing.id));
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
};

export const deleteActivity = async (
  context: { db: DB },
  input: { activityId: string },
) => {
  await context.db.delete(activityFeeds).where(eq(activityFeeds.id, input.activityId));

  return { success: true };
};
