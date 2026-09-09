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
const NOTIFICATION_ROUTES = {
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

/**
 * Lifecycle of a `notification_pushes` row.
 *
 * `sending` is a claim, not decoration. Two dispatchers race on every
 * notification — the mutation that created it pushes in-process, and
 * apps/notification-sender pushes again when Supabase Realtime delivers the
 * INSERT — so a dispatcher flips its rows out of `pending` *before* it talks to
 * Expo. The loser of that update claims nothing and returns without sending,
 * instead of delivering every push twice.
 */
const PUSH_STATUS = {
  pending: "pending",
  sending: "sending",
  sent: "sent",
  failed: "failed",
} as const;

const NO_TOKEN_FAILURE = "no_valid_push_token";
const EXPO_FAILURE = "expo";

/**
 * Resolve the audience of a notification that carries no `notification_pushes`
 * rows of its own.
 *
 * Every caller in this repository materialises its audience through
 * `sendNotification`, so this is the legacy path. The resolved audience is
 * written down before anything is sent, which is what lets the claim below
 * cover implicitly addressed notifications too.
 */
async function resolveImplicitAudience(
  db: DB,
  notification: { id: string; tripId: string | null },
  parsedAudience: ParsedAudienceUrl,
): Promise<string[]> {
  if (!notification.tripId) {
    logger.warn(
      { notificationId: notification.id },
      "Notification has no trip and no explicit audience — falling back to every registered device",
    );
    const subscriberRows = await db
      .select({ userId: pushSubscriptions.userId })
      .from(pushSubscriptions);
    return Array.from(new Set(subscriberRows.map((row) => row.userId)));
  }

  const conditions = [eq(tripParticipants.tripId, notification.tripId)];
  if (parsedAudience.audienceMode === "group" && parsedAudience.audienceGroupId) {
    conditions.push(eq(tripParticipants.groupId, parsedAudience.audienceGroupId));
  }

  const participantRows = await db
    .select({ userId: tripParticipants.userId })
    .from(tripParticipants)
    .where(and(...conditions));

  return Array.from(new Set(participantRows.map((row) => row.userId)));
}

async function markPushes(
  db: DB,
  notificationId: string,
  userIds: string[],
  status: (typeof PUSH_STATUS)[keyof typeof PUSH_STATUS],
  failureReason: string | null,
): Promise<void> {
  if (userIds.length === 0) return;

  await db
    .update(notificationPushes)
    .set({ status, sentAt: new Date(), failureReason })
    .where(
      and(
        eq(notificationPushes.notificationId, notificationId),
        inArray(notificationPushes.targetUserId, userIds),
      ),
    );
}

/**
 * Hand a claim back.
 *
 * Only rows still in `sending` are released, and only before anything has
 * reached Expo — a claim that is dropped after a successful send would be
 * re-claimed by the next dispatcher and delivered twice.
 */
async function releasePushes(db: DB, notificationId: string, userIds: string[]): Promise<void> {
  if (userIds.length === 0) return;

  await db
    .update(notificationPushes)
    .set({ status: PUSH_STATUS.pending })
    .where(
      and(
        eq(notificationPushes.notificationId, notificationId),
        eq(notificationPushes.status, PUSH_STATUS.sending),
        inArray(notificationPushes.targetUserId, userIds),
      ),
    );
}

interface PreparedPushMessages {
  expo: Expo;
  messages: ExpoPushMessage[];
  userByToken: Map<string, string>;
}

async function preparePushMessages(
  db: DB,
  notification: { tripId: string | null; title: string; body: string },
  parsedAudience: ParsedAudienceUrl,
  scopedSubs: Array<{ userId: string; token: string }>,
): Promise<PreparedPushMessages> {
  const requiresRankingTemplate =
    !!notification.tripId &&
    (containsRankingTemplate(notification.title) || containsRankingTemplate(notification.body));

  const rankingValuesByUser =
    requiresRankingTemplate && notification.tripId
      ? await getRankingTemplateValuesByUser(db, notification.tripId)
      : new Map<string, RankingTemplateValues>();

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

  return { expo, messages, userByToken };
}

export async function sendMobileNotifications(db: DB, notificationId: string) {
  const notification = await db.query.notifications.findFirst({
    where: (n, { eq }) => eq(n.id, notificationId),
  });
  if (!notification) return { success: false, sent: 0, failed: 0, total: 0 };

  const parsedAudience = parseAudienceUrl(notification.url);

  let audienceRows = await db.query.notificationPushes.findMany({
    where: (np, { eq }) => eq(np.notificationId, notification.id),
  });

  const subs = await db.query.pushSubscriptions.findMany();
  if (subs.length === 0) {
    return { success: true, sent: 0, failed: 0, total: 0 };
  }

  if (audienceRows.length === 0) {
    const implicitUserIds = await resolveImplicitAudience(db, notification, parsedAudience);
    if (implicitUserIds.length === 0) {
      return { success: true, sent: 0, failed: 0, total: 0 };
    }

    await db
      .insert(notificationPushes)
      .values(
        implicitUserIds.map((targetUserId) => ({
          notificationId: notification.id,
          targetUserId,
          status: PUSH_STATUS.pending,
        })),
      )
      .onConflictDoNothing();

    audienceRows = await db.query.notificationPushes.findMany({
      where: (np, { eq }) => eq(np.notificationId, notification.id),
    });
  }

  // The claim. `UPDATE ... WHERE status = 'pending' RETURNING` is atomic under
  // read-committed: a concurrent dispatcher blocks on the same rows, re-checks
  // the predicate once the winner commits, and gets nothing back.
  const claimedRows = await db
    .update(notificationPushes)
    .set({ status: PUSH_STATUS.sending })
    .where(
      and(
        eq(notificationPushes.notificationId, notification.id),
        eq(notificationPushes.status, PUSH_STATUS.pending),
      ),
    )
    .returning({ targetUserId: notificationPushes.targetUserId });

  const claimedUserIds = new Set(claimedRows.map((row) => row.targetUserId));
  if (claimedUserIds.size === 0) {
    logger.info(
      { notificationId: notification.id },
      "Notification has no pending pushes left to claim — another dispatcher owns it",
    );
    return { success: true, sent: 0, failed: 0, total: audienceRows.length };
  }

  const scopedSubs = subs.filter((sub) => claimedUserIds.has(sub.userId));
  if (scopedSubs.length === 0) {
    await markPushes(
      db,
      notification.id,
      Array.from(claimedUserIds),
      PUSH_STATUS.failed,
      NO_TOKEN_FAILURE,
    );
    return { success: true, sent: 0, failed: 0, total: 0 };
  }

  let prepared: PreparedPushMessages;
  try {
    prepared = await preparePushMessages(db, notification, parsedAudience, scopedSubs);
  } catch (error) {
    // Nothing has been handed to Expo yet, so the claim can go back without
    // risking a duplicate. Leaving the rows in `sending` would strand them:
    // no dispatcher ever claims anything but `pending`.
    await releasePushes(db, notification.id, Array.from(claimedUserIds));
    throw error;
  }

  const { expo, messages, userByToken } = prepared;

  if (messages.length === 0) {
    await markPushes(
      db,
      notification.id,
      Array.from(claimedUserIds),
      PUSH_STATUS.failed,
      NO_TOKEN_FAILURE,
    );
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
  const attemptedUserIds = new Set(resultByUser.keys());
  const unattemptedUserIds = Array.from(claimedUserIds).filter(
    (userId) => !attemptedUserIds.has(userId),
  );

  // Only the rows this dispatcher claimed are settled here; anything a previous
  // delivery already marked `sent` keeps its status.
  await markPushes(db, notification.id, sentUserIds, PUSH_STATUS.sent, null);
  await markPushes(db, notification.id, failedUserIds, PUSH_STATUS.failed, EXPO_FAILURE);
  await markPushes(db, notification.id, unattemptedUserIds, PUSH_STATUS.failed, NO_TOKEN_FAILURE);

  const {
    sent: sentCount,
    failed: failedCount,
    total: totalCount,
  } = calculateDeliveryStats(resultByUser, claimedUserIds, sentUserIds, failedUserIds);

  return {
    success: failedCount === 0,
    sent: sentCount,
    failed: failedCount,
    total: totalCount,
  };
}
