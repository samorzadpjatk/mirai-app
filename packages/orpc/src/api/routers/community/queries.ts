import { resolveStorageUrl } from "@mirai-app/common/storage";
import type { DB } from "@mirai-app/db";
import { challenges } from "@mirai-app/db";
import type { SupabaseClient } from "@mirai-app/supabase";
import { and, eq } from "drizzle-orm";
import { ensureRecurringInstancesForTrip } from "../../../utils/recurringChallenges";
import { getActivitiesCursorPage } from "../activityFeed/queries";
import type { Activity } from "../activityFeed/types";
import { ensureTripParticipant, updateUserLastSeenOn } from "../activityFeed/utils";
import {
  activateVisibleChallenges,
  fetchChallengesWithRelations,
  resolveChallengeImages,
  toClientChallenge,
} from "../challenge/utils";
import { ranking } from "../group/queries";

export type CommunityContext = {
  db: DB;
  supabase: SupabaseClient;
  dbUser: { id: string; role: string };
};

type CommunityCursor =
  | {
      id: string;
      createdAt: Date | string;
      isPinned: boolean;
    }
  | null
  | undefined;

function collectAvatarUserIds(activities: Activity[]): Set<string> {
  const ids = new Set<string>();
  for (const activity of activities) {
    if (activity.activityType === "user_post" && activity.userPost?.author?.user?.id) {
      ids.add(activity.userPost.author.user.id);
    }
    if (activity.admin?.id) {
      ids.add(activity.admin.id);
    }
  }
  return ids;
}

async function resolveAvatarUrls(
  context: { supabase: SupabaseClient },
  userIds: Set<string>,
): Promise<Record<string, string | null>> {
  if (userIds.size === 0) {
    return {};
  }

  const entries = await Promise.all(
    Array.from(userIds).map(async (userId) => {
      const signedUrl = await resolveStorageUrl(context.supabase, `avatar/${userId}.jpg`, 60 * 60);
      return [userId, signedUrl] as [string, string | null];
    }),
  );

  return Object.fromEntries(entries);
}

async function getActiveChallenges(context: { db: DB; supabase: SupabaseClient }, tripId: string) {
  await ensureRecurringInstancesForTrip({ tx: context.db, tripId });
  await activateVisibleChallenges(context.db, { tripId });

  const where = and(eq(challenges.tripId, tripId), eq(challenges.status, "ACTIVE"));
  const rows = await fetchChallengesWithRelations(context.db, where);
  const resolved = await resolveChallengeImages(context.supabase, rows);

  return resolved.map((challenge) => toClientChallenge(challenge));
}

export const getCommunityFull = async (
  context: CommunityContext,
  input: {
    tripId: string;
    pageSize?: number;
    cursor?: CommunityCursor;
  },
) => {
  await ensureTripParticipant(context, input.tripId);

  const pageSize = input.pageSize ?? 30;
  const cursor = input.cursor
    ? {
        id: input.cursor.id,
        createdAt:
          input.cursor.createdAt instanceof Date
            ? input.cursor.createdAt
            : new Date(input.cursor.createdAt),
        isPinned: input.cursor.isPinned,
      }
    : null;

  const [feed, rankingResult, activeChallenges] = await Promise.all([
    getActivitiesCursorPage({
      context,
      tripId: input.tripId,
      pageSize,
      includeHidden: false,
      cursor,
    }),
    ranking(context, { tripId: input.tripId }).catch(() => ({
      data: [],
      currentDate: new Date(),
    })),
    getActiveChallenges(context, input.tripId).catch(() => []),
  ]);

  void updateUserLastSeenOn(context);

  const avatarUserIds = collectAvatarUserIds(feed.activities);
  const avatarUrls = await resolveAvatarUrls(context, avatarUserIds);

  return {
    feed,
    ranking: rankingResult,
    activeChallenges,
    avatarUrls,
  };
};
