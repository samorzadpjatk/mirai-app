import { eq, and, or, lt } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { activityFeeds } from "@mirai-app/db";

/**
 * Builds a Drizzle where expression for activity feed queries.
 * Handles trip filtering, hidden state, and cursor-based pagination.
 * Pure: no side effects, no async, no DB calls.
 */
export function buildActivityWhere(
  tripId: string,
  includeHidden: boolean,
  cursor?: { id: string; createdAt: Date; isPinned: boolean },
): SQL<unknown> | undefined {
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
}

/**
 * Returns the Drizzle relation tree for activity feed queries.
 * Pure: no side effects, no async, no DB calls.
 */
export function getActivityRelationTree() {
  return {
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
  } as const;
}

/**
 * Returns the Drizzle columns selection for activity feed queries.
 * Pure: no side effects, no async, no DB calls.
 */
export function getActivityColumns() {
  return {
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
  } as const;
}
