import {
  aggregateTicketResults,
  calculateDeliveryStats,
  collectUnregisteredTokens,
} from "@mirai-app/common/notifications";
import type { DB } from "@mirai-app/db";
import { challenges, notificationPushes, pushSubscriptions, tripParticipants } from "@mirai-app/db";
import { env } from "bun";
import { and, count, eq, inArray } from "drizzle-orm";
import { Expo, type ExpoPushMessage, type ExpoPushTicket } from "expo-server-sdk";
import { logger } from "../utils/logger";
import {
  type RankingTemplateValues,
  applyRankingTemplate,
  containsRankingTemplate,
} from "../utils/notificationTemplates";
import { executeWithRetry } from "../utils/resilience";

export interface NotificationData {
  title: string;
  body: string;
  url: string;
}

const FALLBACK_TEMPLATE_VALUES: RankingTemplateValues = {
  groupName: "Twoja grupa",
  rankingPosition: "-",
  activeChallengesCount: "0",
  tripName: "Twoja wycieczka",
  totalGroupsCount: "0",
  groupMembersCount: "0",
  currentDate: "",
  currentTime: "",
};

const AUDIENCE_MODE_PARAM = "__audience";
const AUDIENCE_GROUP_PARAM = "__groupId";

export interface ParsedAudienceUrl {
  cleanUrl: string;
  audienceMode: "all" | "group" | null;
  audienceGroupId: string | null;
}

export function parseAudienceUrl(rawUrl: string): ParsedAudienceUrl {
  const baseUrl = "https://integral.local";

  try {
    const parsed = rawUrl.startsWith("/") ? new URL(rawUrl, baseUrl) : new URL(rawUrl);

    const audienceModeParam = parsed.searchParams.get(AUDIENCE_MODE_PARAM);
    const audienceGroupId = parsed.searchParams.get(AUDIENCE_GROUP_PARAM);

    if (audienceModeParam) {
      parsed.searchParams.delete(AUDIENCE_MODE_PARAM);
    }
    if (audienceGroupId) {
      parsed.searchParams.delete(AUDIENCE_GROUP_PARAM);
    }

    const cleanUrl = rawUrl.startsWith("/")
      ? `${parsed.pathname}${parsed.search}${parsed.hash}`
      : parsed.toString();

    return {
      cleanUrl,
      audienceMode:
        audienceModeParam === "group" || audienceModeParam === "all" ? audienceModeParam : null,
      audienceGroupId: audienceGroupId?.trim() ? audienceGroupId : null,
    };
  } catch {
    return {
      cleanUrl: rawUrl,
      audienceMode: null,
      audienceGroupId: null,
    };
  }
}

function formatCurrentDate(date: Date): string {
  return new Intl.DateTimeFormat("pl-PL", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function formatCurrentTime(date: Date): string {
  return new Intl.DateTimeFormat("pl-PL", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

async function getRankingTemplateValuesByUser(
  db: DB,
  tripId: string,
): Promise<Map<string, RankingTemplateValues>> {
  const now = new Date();
  const [participants, rankedGroups, activeChallengesResult, trip] = await Promise.all([
    db
      .select({ userId: tripParticipants.userId, groupId: tripParticipants.groupId })
      .from(tripParticipants)
      .where(eq(tripParticipants.tripId, tripId)),
    db.query.groups.findMany({
      where: (g, { eq, and }) => and(eq(g.tripId, tripId), eq(g.isDeleted, false)),
      orderBy: (g, { desc }) => [desc(g.coins), g.name],
    }),
    db
      .select({ count: count() })
      .from(challenges)
      .where(and(eq(challenges.tripId, tripId), eq(challenges.status, "ACTIVE"))),
    db.query.trips.findFirst({
      where: (t, { eq }) => eq(t.id, tripId),
    }),
  ]);

  const activeChallengesCount = activeChallengesResult[0]?.count ?? 0;

  const groupById = new Map(rankedGroups.map((group) => [group.id, group]));
  const groupRankById = new Map(rankedGroups.map((group, index) => [group.id, index + 1]));
  const groupMembersCountById = new Map<string, number>();
  participants.forEach((participant) => {
    if (!participant.groupId) return;
    groupMembersCountById.set(
      participant.groupId,
      (groupMembersCountById.get(participant.groupId) ?? 0) + 1,
    );
  });

  const formattedDate = formatCurrentDate(now);
  const formattedTime = formatCurrentTime(now);
  const totalGroupsCount = String(rankedGroups.length);
  const tripName = trip?.name ?? FALLBACK_TEMPLATE_VALUES.tripName;

  const valuesByUser = new Map<string, RankingTemplateValues>();

  participants.forEach((participant) => {
    const groupId = participant.groupId;
    if (!groupId) {
      valuesByUser.set(participant.userId, {
        ...FALLBACK_TEMPLATE_VALUES,
        activeChallengesCount: String(activeChallengesCount),
        tripName,
        totalGroupsCount,
        currentDate: formattedDate,
        currentTime: formattedTime,
      });
      return;
    }

    const group = groupById.get(groupId);
    const rankingPosition = groupRankById.get(groupId);

    valuesByUser.set(participant.userId, {
      groupName: group?.name ?? FALLBACK_TEMPLATE_VALUES.groupName,
      rankingPosition: rankingPosition
        ? String(rankingPosition)
        : FALLBACK_TEMPLATE_VALUES.rankingPosition,
      activeChallengesCount: String(activeChallengesCount),
      tripName,
      totalGroupsCount,
      groupMembersCount: String(groupMembersCountById.get(groupId) ?? 0),
      currentDate: formattedDate,
      currentTime: formattedTime,
    });
  });

  return valuesByUser;
}

/**
 * Deep-link targets for generated notifications.
 *
 * Every value must resolve to a real expo-router route under
 * `apps/native/src/app`. The previous `/group/my` and `/ranking` paths matched
 * no screen at all, so a tap navigated nowhere.
 */
export const NOTIFICATION_ROUTES = {
  myGroup: "/trips/groups",
  ranking: "/trips/leaderboard",
  rewards: "/trips/rewards",
  challenges: "/trips/challenges",
} as const;

export class NotificationService {
  /**
   * Create notifications for common group events
   */
  static createCoinsAddedNotification(
    groupName: string,
    amount: number,
    reason: string | undefined,
  ): NotificationData {
    let body: string;
    if (reason) {
      body = `Your guild received ${amount} coins!\nReason: ${reason}\nClick me to see your balance!`;
    } else {
      body = `Your guild received ${amount} coins!\nClick me to see your balance!`;
    }
    return {
      title: `💰 ${groupName} received coins!`,
      body: body,
      url: NOTIFICATION_ROUTES.myGroup,
    };
  }
  static createCoinsRemovedNotification(
    groupName: string,
    amount: number,
    reason: string | undefined,
  ): NotificationData {
    let body: string;
    if (reason) {
      body = `Your guild lost ${amount} coins!\nReason: ${reason}\nClick me to see your balance!`;
    } else {
      body = `Your guild lost ${amount} coins!\nClick me to see your balance!`;
    }
    return {
      title: `💸 ${groupName} - Coins Seized`,
      body: body,
      url: NOTIFICATION_ROUTES.myGroup,
    };
  }

  static createNewMemberNotification(groupName: string, memberName: string): NotificationData {
    return {
      title: `👥 New member in ${groupName}!`,
      body: `${memberName} joined your guild!`,
      url: NOTIFICATION_ROUTES.myGroup,
    };
  }

  static createRankingUpdateNotification(groupName: string, newPosition: number): NotificationData {
    return {
      title: "🏆 Ranking update!",
      body: `${groupName} now holds ${newPosition} place in the ranking! Click me to check the current ranking.`,
      url: NOTIFICATION_ROUTES.ranking,
    };
  }

  static createRewardPurchasedNotification(
    groupName: string,
    rewardName: string,
    totalCost: number,
  ): NotificationData {
    return {
      title: `🎁 ${groupName} claimed a reward!`,
      body: `Your guild claimed ${rewardName} for ${totalCost} coins.\nClick me to see your rewards.`,
      url: NOTIFICATION_ROUTES.rewards,
    };
  }

  static createSubmissionReviewedNotification(
    groupName: string,
    challengeName: string,
    approved: boolean,
    awardedPoints: number,
  ): NotificationData {
    if (!approved) {
      return {
        title: `❌ ${challengeName} — submission rejected`,
        body: `${groupName}'s submission was rejected.\nClick me to see the challenge.`,
        url: NOTIFICATION_ROUTES.challenges,
      };
    }

    const pointsSuffix = awardedPoints > 0 ? ` and earned ${awardedPoints} coins` : "";
    return {
      title: `✅ ${challengeName} — submission approved!`,
      body: `${groupName}'s submission was approved${pointsSuffix}.\nClick me to see the challenge.`,
      url: NOTIFICATION_ROUTES.challenges,
    };
  }
}

export async function pruneUnregisteredTokens(
  db: DB,
  tickets: ExpoPushTicket[],
  messages: ExpoPushMessage[],
): Promise<string[]> {
  const unregisteredTokens = collectUnregisteredTokens(
    tickets as Array<{ status: string; details?: { error?: string } }>,
    messages as Array<{ to: string }>,
  );
  if (unregisteredTokens.length === 0) {
    return [];
  }

  try {
    await db.delete(pushSubscriptions).where(inArray(pushSubscriptions.token, unregisteredTokens));
    logger.info(
      { count: unregisteredTokens.length },
      "Removed push subscriptions rejected as DeviceNotRegistered",
    );
    return unregisteredTokens;
  } catch (error) {
    logger.error({ error }, "Failed to remove push subscriptions for unregistered devices");
    return [];
  }
}

export async function sendMobileNotifications(db: DB, notificationId: string) {
  const notification = await db.query.notifications.findFirst({
    where: (n, { eq }) => eq(n.id, notificationId),
  });
  if (!notification) return { success: false, sent: 0, failed: 0, total: 0 };

  const existingPushRows = await db.query.notificationPushes.findMany({
    where: (np, { eq }) => eq(np.notificationId, notification.id),
  });
  const hasExplicitAudience = existingPushRows.length > 0;
  const pendingAudienceUserIds = new Set(
    existingPushRows.filter((push) => push.status === "pending").map((push) => push.targetUserId),
  );
  const explicitAudienceUserIds = new Set(existingPushRows.map((push) => push.targetUserId));

  if (hasExplicitAudience && pendingAudienceUserIds.size === 0) {
    return {
      success: true,
      sent: 0,
      failed: 0,
      total: existingPushRows.length,
    };
  }

  const subs = await db.query.pushSubscriptions.findMany();
  if (subs.length === 0) {
    return { success: true, sent: 0, failed: 0, total: 0 };
  }

  const parsedAudience = parseAudienceUrl(notification.url);

  let scopedSubs = subs;
  if (hasExplicitAudience) {
    scopedSubs = subs.filter((sub) => pendingAudienceUserIds.has(sub.userId));
  } else if (notification.tripId) {
    const tripParticipantRows = await db
      .select({ userId: tripParticipants.userId })
      .from(tripParticipants)
      .where(eq(tripParticipants.tripId, notification.tripId));
    const participantIds = new Set(tripParticipantRows.map((participant) => participant.userId));
    scopedSubs = subs.filter((sub) => participantIds.has(sub.userId));

    if (parsedAudience.audienceMode === "group" && parsedAudience.audienceGroupId) {
      const groupParticipantRows = await db
        .select({ userId: tripParticipants.userId })
        .from(tripParticipants)
        .where(
          and(
            eq(tripParticipants.tripId, notification.tripId),
            eq(tripParticipants.groupId, parsedAudience.audienceGroupId),
          ),
        );
      const groupParticipantIds = new Set(
        groupParticipantRows.map((participant) => participant.userId),
      );
      scopedSubs = scopedSubs.filter((sub) => groupParticipantIds.has(sub.userId));
    }
  }

  const requiresRankingTemplate =
    !!notification.tripId &&
    (containsRankingTemplate(notification.title) || containsRankingTemplate(notification.body));

  const rankingValuesByUser =
    requiresRankingTemplate && notification.tripId
      ? await getRankingTemplateValuesByUser(db, notification.tripId)
      : new Map<string, RankingTemplateValues>();

  if (scopedSubs.length === 0) {
    if (hasExplicitAudience) {
      await db
        .update(notificationPushes)
        .set({
          status: "failed",
          sentAt: new Date(),
          failureReason: "no_valid_push_token",
        })
        .where(
          and(
            eq(notificationPushes.notificationId, notification.id),
            eq(notificationPushes.status, "pending"),
          ),
        );
    }
    return { success: true, sent: 0, failed: 0, total: 0 };
  }

  const expoAccessToken = env.EXPO_ACCESS_TOKEN;
  const expo = new Expo(expoAccessToken ? { accessToken: expoAccessToken } : undefined);
  const messages: ExpoPushMessage[] = [];
  const userByToken = new Map<string, string>();
  const fallbackValues: RankingTemplateValues = {
    ...FALLBACK_TEMPLATE_VALUES,
    currentDate: formatCurrentDate(new Date()),
    currentTime: formatCurrentTime(new Date()),
  };

  for (const s of scopedSubs) {
    if (!Expo.isExpoPushToken(s.token)) continue;
    userByToken.set(s.token, s.userId);

    const values = rankingValuesByUser.get(s.userId) ?? fallbackValues;
    const title = requiresRankingTemplate
      ? applyRankingTemplate(notification.title, values)
      : notification.title;
    const body = requiresRankingTemplate
      ? applyRankingTemplate(notification.body, values)
      : notification.body;

    messages.push({
      to: s.token,
      title,
      body,
      data: { url: parsedAudience.cleanUrl },
      sound: "default",
      priority: "default",
    });
  }

  if (messages.length === 0) {
    return { success: true, sent: 0, failed: 0, total: 0 };
  }

  const chunks = expo.chunkPushNotifications(messages);
  const tickets: ExpoPushTicket[] = [];

  for (const chunk of chunks) {
    try {
      const t = await executeWithRetry(
        () => expo.sendPushNotificationsAsync(chunk),
        (err, retryAttempt) => {
          logger.error(err, `Error sending push notification chunk (attempt ${retryAttempt + 1})`);
        },
        undefined,
        3,
        500,
      );
      tickets.push(...t);
    } catch {
      tickets.push(
        ...chunk.map(
          (): ExpoPushTicket => ({
            status: "error",
            message: "network error",
          }),
        ),
      );
    }
  }

  const resultByUser = aggregateTicketResults(
    tickets,
    messages as Array<{ to: string }>,
    userByToken,
  );

  await pruneUnregisteredTokens(db, tickets, messages);

  const sentUserIds = Array.from(resultByUser.entries())
    .filter(([, status]) => status.hasSuccess)
    .map(([userId]) => userId);
  const failedUserIds = Array.from(resultByUser.entries())
    .filter(([, status]) => !status.hasSuccess && status.hasFailure)
    .map(([userId]) => userId);

  if (hasExplicitAudience) {
    const attemptedUserIds = new Set(resultByUser.keys());
    const unattemptedUserIds = Array.from(explicitAudienceUserIds).filter(
      (userId) => !attemptedUserIds.has(userId),
    );

    if (sentUserIds.length > 0) {
      await Promise.all(
        sentUserIds.map((userId) =>
          db
            .update(notificationPushes)
            .set({
              status: "sent",
              sentAt: new Date(),
              failureReason: null,
            })
            .where(
              and(
                eq(notificationPushes.targetUserId, userId),
                eq(notificationPushes.notificationId, notification.id),
              ),
            ),
        ),
      );
    }

    const allFailedUserIds = Array.from(new Set([...failedUserIds, ...unattemptedUserIds]));
    if (allFailedUserIds.length > 0) {
      await Promise.all(
        allFailedUserIds.map((userId) =>
          db
            .update(notificationPushes)
            .set({
              status: "failed",
              sentAt: new Date(),
              failureReason: attemptedUserIds.has(userId) ? "expo" : "no_valid_push_token",
            })
            .where(
              and(
                eq(notificationPushes.targetUserId, userId),
                eq(notificationPushes.notificationId, notification.id),
              ),
            ),
        ),
      );
    }
  } else if (sentUserIds.length + failedUserIds.length > 0) {
    await db
      .insert(notificationPushes)
      .values([
        ...sentUserIds.map((targetUserId) => ({
          notificationId: notification.id,
          targetUserId,
          status: "sent" as const,
          sentAt: new Date(),
          failureReason: null as string | null,
        })),
        ...failedUserIds.map((targetUserId) => ({
          notificationId: notification.id,
          targetUserId,
          status: "failed" as const,
          sentAt: new Date(),
          failureReason: "expo" as const,
        })),
      ])
      .onConflictDoNothing();
  }

  const {
    sent: sentCount,
    failed: failedCount,
    total: totalCount,
  } = calculateDeliveryStats(resultByUser, explicitAudienceUserIds, sentUserIds, failedUserIds);

  return {
    success: failedCount === 0,
    sent: sentCount,
    failed: failedCount,
    total: totalCount,
  };
}
