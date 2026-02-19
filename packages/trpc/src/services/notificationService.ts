import { executeWithRetry } from "../utils/resilience";
import { type PrismaClient } from "@integral-2025-app/db";
import { Expo, type ExpoPushMessage, type ExpoPushTicket } from "expo-server-sdk";
import {
  applyRankingTemplate,
  containsRankingTemplate,
  type RankingTemplateValues,
} from "../utils/notificationTemplates";

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

interface ParsedAudienceUrl {
  cleanUrl: string;
  audienceMode: "all" | "group" | null;
  audienceGroupId: string | null;
}

function parseAudienceUrl(rawUrl: string): ParsedAudienceUrl {
  const baseUrl = "https://integral.local";

  try {
    const parsed = rawUrl.startsWith("/")
      ? new URL(rawUrl, baseUrl)
      : new URL(rawUrl);

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
        audienceModeParam === "group" || audienceModeParam === "all"
          ? audienceModeParam
          : null,
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
  db: PrismaClient,
  tripId: string,
): Promise<Map<string, RankingTemplateValues>> {
  const now = new Date();
  const [participants, rankedGroups, activeChallengesCount, trip] = await Promise.all([
    db.tripParticipant.findMany({
      where: { tripId },
      select: {
        userId: true,
        groupId: true,
      },
    }),
    db.group.findMany({
      where: { tripId },
      select: {
        id: true,
        name: true,
      },
      orderBy: [{ coins: "desc" }, { name: "asc" }],
    }),
    db.challenge.count({
      where: {
        tripId,
        status: "ACTIVE",
      },
    }),
    db.trip.findUnique({
      where: { id: tripId },
      select: { name: true },
    }),
  ]);

  const groupById = new Map(rankedGroups.map((group) => [group.id, group]));
  const groupRankById = new Map(
    rankedGroups.map((group, index) => [group.id, index + 1]),
  );
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

export class NotificationService {
  /**
   * Create notifications for common group events
   */
  static createCoinsAddedNotification(
    groupName: string,
    amount: number,
    reason: string | undefined,
  ): NotificationData {
    let body;
    if (reason) {
      body = `Your guild received ${amount} coins!\nReason: ${reason}\nClick me to see your balance!`;
    } else {
      body = `Your guild received ${amount} coins!\nClick me to see your balance!`;
    }
    return {
      title: `💰 ${groupName} received coins!`,
      body: body,
      url: "/group/my",
    };
  }
  static createCoinsRemovedNotification(
    groupName: string,
    amount: number,
    reason: string | undefined,
  ): NotificationData {
    let body;
    if (reason) {
      body = `Your guild lost ${amount} coins!\nReason: ${reason}\nClick me to see your balance!`;
    } else {
      body = `Your guild lost ${amount} coins!\nClick me to see your balance!`;
    }
    return {
      title: `💸 ${groupName} - Coins Seized`,
      body: body,
      url: "/group/my",
    };
  }

  static createNewMemberNotification(
    groupName: string,
    memberName: string,
  ): NotificationData {
    return {
      title: `👥 New member in ${groupName}!`,
      body: `${memberName} joined your guild!`,
      url: "/group/my",
    };
  }

  static createRankingUpdateNotification(
    groupName: string,
    newPosition: number,
  ): NotificationData {
    return {
      title: `🏆 Ranking update!`,
      body: `${groupName} now holds ${newPosition} place in the ranking! Click me to check the current ranking.`,
      url: "/ranking",
    };
  }
}

export async function sendMobileNotifications(
  db: PrismaClient,
  notificationId: string,
) {
  const notification = await db.notification.findUnique({
    where: { id: notificationId },
  });
  if (!notification) return { success: false, sent: 0, failed: 0, total: 0 };

  const existingPushRows = await db.notificationPush.findMany({
    where: { notificationId: notification.id },
    select: {
      targetUserId: true,
      status: true,
    },
  });
  const hasExplicitAudience = existingPushRows.length > 0;
  const pendingAudienceUserIds = new Set(
    existingPushRows
      .filter((push) => push.status === "pending")
      .map((push) => push.targetUserId),
  );
  const explicitAudienceUserIds = new Set(
    existingPushRows.map((push) => push.targetUserId),
  );

  if (hasExplicitAudience && pendingAudienceUserIds.size === 0) {
    return {
      success: true,
      sent: 0,
      failed: 0,
      total: existingPushRows.length,
    };
  }

  const subs = await db.pushSubscription.findMany();
  if (subs.length === 0) {
    return { success: true, sent: 0, failed: 0, total: 0 };
  }

  const parsedAudience = parseAudienceUrl(notification.url);

  let scopedSubs = subs;
  if (hasExplicitAudience) {
    scopedSubs = subs.filter((sub) => pendingAudienceUserIds.has(sub.userId));
  } else if (notification.tripId) {
    const tripParticipants = await db.tripParticipant.findMany({
      where: { tripId: notification.tripId },
      select: { userId: true },
    });
    const participantIds = new Set(
      tripParticipants.map((participant) => participant.userId),
    );
    scopedSubs = subs.filter((sub) => participantIds.has(sub.userId));

    if (parsedAudience.audienceMode === "group" && parsedAudience.audienceGroupId) {
      const groupParticipants = await db.tripParticipant.findMany({
        where: {
          tripId: notification.tripId,
          groupId: parsedAudience.audienceGroupId,
        },
        select: { userId: true },
      });
      const groupParticipantIds = new Set(
        groupParticipants.map((participant) => participant.userId),
      );
      scopedSubs = scopedSubs.filter((sub) => groupParticipantIds.has(sub.userId));
    }
  }

  const requiresRankingTemplate =
    !!notification.tripId &&
    (containsRankingTemplate(notification.title) ||
      containsRankingTemplate(notification.body));

  const rankingValuesByUser =
    requiresRankingTemplate && notification.tripId
      ? await getRankingTemplateValuesByUser(db, notification.tripId)
      : new Map<string, RankingTemplateValues>();

  if (scopedSubs.length === 0) {
    if (hasExplicitAudience) {
      await db.notificationPush.updateMany({
        where: {
          notificationId: notification.id,
          status: "pending",
        },
        data: {
          status: "failed",
          sentAt: new Date(),
          failureReason: "no_valid_push_token",
        },
      });
    }
    return { success: true, sent: 0, failed: 0, total: 0 };
  }

  const expoAccessToken = process.env.EXPO_ACCESS_TOKEN;
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
          console.error(
            `Error sending push notification chunk (attempt ${retryAttempt + 1}):`,
            err,
          );
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

  const resultByUser = new Map<string, { hasSuccess: boolean; hasFailure: boolean }>();

  tickets
    .map((t, idx) => {
      const token = messages[idx]?.to;
      if (!token || typeof token !== "string") return null;
      const userId = userByToken.get(token);
      if (!userId) return null;
      const statusCode = t.status === "ok" ? 200 : 500;
      return { userId, statusCode };
    })
    .filter(
      (r): r is { userId: string; statusCode: number } => r !== null,
    )
    .forEach((r) => {
      const current = resultByUser.get(r.userId) ?? {
        hasSuccess: false,
        hasFailure: false,
      };
      if (r.statusCode >= 200 && r.statusCode < 300) {
        current.hasSuccess = true;
      } else {
        current.hasFailure = true;
      }
      resultByUser.set(r.userId, current);
    });

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
          db.notificationPush.update({
            where: {
              targetUserId_notificationId: {
                targetUserId: userId,
                notificationId: notification.id,
              },
            },
            data: {
              status: "sent",
              sentAt: new Date(),
              failureReason: null,
            },
          }),
        ),
      );
    }

    const allFailedUserIds = Array.from(
      new Set([...failedUserIds, ...unattemptedUserIds]),
    );
    if (allFailedUserIds.length > 0) {
      await Promise.all(
        allFailedUserIds.map((userId) =>
          db.notificationPush.update({
            where: {
              targetUserId_notificationId: {
                targetUserId: userId,
                notificationId: notification.id,
              },
            },
            data: {
              status: "failed",
              sentAt: new Date(),
              failureReason: attemptedUserIds.has(userId)
                ? "expo"
                : "no_valid_push_token",
            },
          }),
        ),
      );
    }
  } else if (sentUserIds.length + failedUserIds.length > 0) {
    await db.notificationPush.createMany({
      data: [
        ...sentUserIds.map((targetUserId) => ({
          notificationId: notification.id,
          targetUserId,
          status: "sent",
          sentAt: new Date(),
          failureReason: null,
        })),
        ...failedUserIds.map((targetUserId) => ({
          notificationId: notification.id,
          targetUserId,
          status: "failed",
          sentAt: new Date(),
          failureReason: "expo",
        })),
      ],
      skipDuplicates: true,
    });
  }

  const failedCount = hasExplicitAudience
    ? Array.from(explicitAudienceUserIds).filter((userId) => {
        const status = resultByUser.get(userId);
        if (!status) return true;
        return !status.hasSuccess;
      }).length
    : failedUserIds.length;

  const sentCount = hasExplicitAudience
    ? Array.from(explicitAudienceUserIds).filter((userId) => {
        const status = resultByUser.get(userId);
        return !!status?.hasSuccess;
      }).length
    : sentUserIds.length;

  const totalCount = hasExplicitAudience
    ? explicitAudienceUserIds.size
    : sentUserIds.length + failedUserIds.length;

  return {
    success: failedCount === 0,
    sent: sentCount,
    failed: failedCount,
    total: totalCount,
  };
}
