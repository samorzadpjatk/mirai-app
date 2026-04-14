// TODO: Migrate from Prisma to Drizzle
// import type { PrismaClient } from "@mirai-app/frameworks/prisma";
import type { DrizzleDb } from "@mirai-app/frameworks/drizzle";
import {
  Expo,
  type ExpoPushMessage,
  type ExpoPushTicket,
} from "expo-server-sdk";
import { Effect } from "effect";
import { ServiceError } from "@mirai-app/adapters/errors";
import { serverLogger } from "@mirai-app/shared";

// ============================================================================
// Template Types and Utilities (moved from trpc-utils/notificationTemplates)
// ============================================================================

export interface RankingTemplateValues {
  groupName: string;
  rankingPosition: string;
  activeChallengesCount: string;
  tripName: string;
  totalGroupsCount: string;
  groupMembersCount: string;
  currentDate: string;
  currentTime: string;
}

const RANKING_TEMPLATE_PLACEHOLDERS = {
  groupName: "<nazwa-grupy>",
  rankingPosition: "<miejsce-w-rankingu>",
  activeChallengesCount: "<liczba-aktywnych-wyzwan>",
  tripName: "<nazwa-wycieczki>",
  totalGroupsCount: "<liczba-grup>",
  groupMembersCount: "<liczba-czlonkow-grupy>",
  currentDate: "<data-dzisiaj>",
  currentTime: "<godzina-teraz>",
} as const;

const PLACEHOLDER_ALIASES: Record<keyof RankingTemplateValues, string[]> = {
  groupName: [RANKING_TEMPLATE_PLACEHOLDERS.groupName, "<nazwa_grupy>"],
  rankingPosition: [
    RANKING_TEMPLATE_PLACEHOLDERS.rankingPosition,
    "<miejsce_w_rankingu>",
  ],
  activeChallengesCount: [
    RANKING_TEMPLATE_PLACEHOLDERS.activeChallengesCount,
    "<liczba-aktywnych-wyzwań>",
    "<liczba_aktywnych_wyzwan>",
    "<liczba_aktywnych_wyzwań>",
  ],
  tripName: [RANKING_TEMPLATE_PLACEHOLDERS.tripName, "<nazwa_wycieczki>"],
  totalGroupsCount: [
    RANKING_TEMPLATE_PLACEHOLDERS.totalGroupsCount,
    "<liczba_grup>",
  ],
  groupMembersCount: [
    RANKING_TEMPLATE_PLACEHOLDERS.groupMembersCount,
    "<liczba-członków-grupy>",
    "<liczba_czlonkow_grupy>",
    "<liczba_członków_grupy>",
  ],
  currentDate: [RANKING_TEMPLATE_PLACEHOLDERS.currentDate, "<data_dzisiaj>"],
  currentTime: [RANKING_TEMPLATE_PLACEHOLDERS.currentTime, "<godzina_teraz>"],
};

function replaceAll(
  input: string,
  searchValue: string,
  replaceValue: string,
): string {
  return input.split(searchValue).join(replaceValue);
}

function applyRankingTemplate(
  input: string,
  values: RankingTemplateValues,
): string {
  let output = input;

  (Object.keys(PLACEHOLDER_ALIASES) as (keyof RankingTemplateValues)[]).forEach(
    (field) => {
      const value = values[field];
      PLACEHOLDER_ALIASES[field].forEach((placeholder) => {
        output = replaceAll(output, placeholder, value);
      });
    },
  );

  return output;
}

function containsRankingTemplate(input: string): boolean {
  return Object.values(PLACEHOLDER_ALIASES).some((aliases) =>
    aliases.some((placeholder) => input.includes(placeholder)),
  );
}

// ============================================================================
// Resilience Utilities (moved from trpc-utils/resilience)
// ============================================================================

const defaultMaxRetriesCount = 5;
const defaultDelayInMs = 1000;

const getJitteredDelay = (delay: number) => delay * (0.5 + Math.random());

async function executeWithRetry<T>(
  toExecute: () => Promise<T>,
  onError?: (err: unknown, retryAttempt: number) => void | Promise<void>,
  isValidResult?: (result: T) => boolean,
  maxRetriesCount?: number,
  delayInMs?: number,
): Promise<T> {
  maxRetriesCount ??= defaultMaxRetriesCount;
  delayInMs ??= defaultDelayInMs;

  const handleDelay = async (retryAttempt: number) => {
    const delay = getJitteredDelay(delayInMs * Math.pow(2, retryAttempt));
    await new Promise((result) => setTimeout(result, delay));
  };

  for (let retryAttempt = 0; retryAttempt < maxRetriesCount; retryAttempt++) {
    try {
      const result = await toExecute();
      if (isValidResult && !isValidResult(result)) {
        await handleDelay(retryAttempt);
        continue;
      }

      return result;
    } catch (err: unknown) {
      await onError?.(err, retryAttempt);
      if (retryAttempt === maxRetriesCount - 1) {
        throw err;
      }

      await handleDelay(retryAttempt);
    }
  }

  throw new Error(
    `None of the ${maxRetriesCount} retry attempts provided a valid result.`,
  );
}

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

export class NotificationService {
  // TODO: Migrate from Prisma to Drizzle
  // Using unknown for now as this is a legacy Prisma service being migrated
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(private prisma: any) {}

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

  private getRankingTemplateValuesByUser(
    tripId: string,
  ): Effect.Effect<Map<string, RankingTemplateValues>, ServiceError, never> {
    return Effect.tryPromise({
      try: async () => {
        const now = new Date();
        const [participants, rankedGroups, activeChallengesCount, trip] =
          await Promise.all([
            this.prisma.tripParticipant.findMany({
              where: { tripId },
              select: {
                userId: true,
                groupId: true,
              },
            }),
            this.prisma.group.findMany({
              where: { tripId, isDeleted: false },
              select: {
                id: true,
                name: true,
              },
              orderBy: [{ coins: "desc" }, { name: "asc" }],
            }),
            this.prisma.challenge.count({
              where: {
                tripId,
                status: "ACTIVE",
              },
            }),
            this.prisma.trip.findUnique({
              where: { id: tripId },
              select: { name: true },
            }),
          ]);

        const groupById = new Map<
          string,
          { id: string; name: string; coins: number }
        >(
          rankedGroups.map(
            (group: { id: string; name: string; coins: number }) => [
              group.id,
              group,
            ],
          ),
        );
        const groupRankById = new Map<string, number>(
          rankedGroups.map((group: { id: string }, index: number) => [
            group.id,
            index + 1,
          ]),
        );
        const groupMembersCountById = new Map<string, number>();
        participants.forEach(
          (participant: { groupId?: string | null; userId: string }) => {
            if (!participant.groupId) return;
            groupMembersCountById.set(
              participant.groupId,
              (groupMembersCountById.get(participant.groupId) ?? 0) + 1,
            );
          },
        );

        const formattedDate = formatCurrentDate(now);
        const formattedTime = formatCurrentTime(now);
        const totalGroupsCount = String(rankedGroups.length);
        const tripName = trip?.name ?? FALLBACK_TEMPLATE_VALUES.tripName;

        const valuesByUser = new Map<string, RankingTemplateValues>();

        participants.forEach(
          (participant: { groupId?: string | null; userId: string }) => {
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
              groupMembersCount: String(
                groupMembersCountById.get(groupId) ?? 0,
              ),
              currentDate: formattedDate,
              currentTime: formattedTime,
            });
          },
        );

        return valuesByUser;
      },
      catch: (error) =>
        new ServiceError({
          operation: "getRankingTemplateValuesByUser",
          message: `Failed to get ranking template values for trip ${tripId}: ${String(error)}`,
          cause: error,
        }),
    });
  }

  sendMobileNotifications(notificationId: string): Effect.Effect<
    {
      success: boolean;
      sent: number;
      failed: number;
      total: number;
    },
    ServiceError,
    never
  > {
    return Effect.tryPromise({
      try: async () => {
        const notification = await this.prisma.notification.findUnique({
          where: { id: notificationId },
        });
        if (!notification)
          return { success: false, sent: 0, failed: 0, total: 0 };

        const existingPushRows: Array<{
          targetUserId: string;
          status: string;
        }> = await this.prisma.notificationPush.findMany({
          where: { notificationId: notification.id },
          select: {
            targetUserId: true,
            status: true,
          },
        });
        const hasExplicitAudience = existingPushRows.length > 0;
        const pendingAudienceUserIds = new Set(
          existingPushRows
            .filter((push: { status: string }) => push.status === "pending")
            .map((push: { targetUserId: string }) => push.targetUserId),
        );
        const explicitAudienceUserIds = new Set(
          existingPushRows.map(
            (push: { targetUserId: string }) => push.targetUserId,
          ),
        );

        if (hasExplicitAudience && pendingAudienceUserIds.size === 0) {
          return {
            success: true,
            sent: 0,
            failed: 0,
            total: existingPushRows.length,
          };
        }

        interface PushSubscription {
          token: string;
          userId: string;
        }
        const subs: PushSubscription[] =
          await this.prisma.pushSubscription.findMany();
        if (subs.length === 0) {
          return { success: true, sent: 0, failed: 0, total: 0 };
        }

        const parsedAudience = parseAudienceUrl(notification.url);

        let scopedSubs = subs;
        if (hasExplicitAudience) {
          scopedSubs = subs.filter((sub: PushSubscription) =>
            pendingAudienceUserIds.has(sub.userId),
          );
        } else if (notification.tripId) {
          interface TripParticipant {
            userId: string;
          }
          const tripParticipants: TripParticipant[] =
            await this.prisma.tripParticipant.findMany({
              where: { tripId: notification.tripId },
              select: { userId: true },
            });
          const participantIds = new Set(
            tripParticipants.map(
              (participant: TripParticipant) => participant.userId,
            ),
          );
          scopedSubs = subs.filter((sub: PushSubscription) =>
            participantIds.has(sub.userId),
          );

          if (
            parsedAudience.audienceMode === "group" &&
            parsedAudience.audienceGroupId
          ) {
            const groupParticipants: TripParticipant[] =
              await this.prisma.tripParticipant.findMany({
                where: {
                  tripId: notification.tripId,
                  groupId: parsedAudience.audienceGroupId,
                },
                select: { userId: true },
              });
            const groupParticipantIds = new Set(
              groupParticipants.map(
                (participant: TripParticipant) => participant.userId,
              ),
            );
            scopedSubs = scopedSubs.filter((sub: PushSubscription) =>
              groupParticipantIds.has(sub.userId),
            );
          }
        }

        const requiresRankingTemplate =
          !!notification.tripId &&
          (containsRankingTemplate(notification.title) ||
            containsRankingTemplate(notification.body));

        let rankingValuesByUser: Map<string, RankingTemplateValues>;
        if (requiresRankingTemplate && notification.tripId) {
          const rankingEffect = this.getRankingTemplateValuesByUser(
            notification.tripId,
          );
          rankingValuesByUser = await Effect.runPromise(rankingEffect);
        } else {
          rankingValuesByUser = new Map<string, RankingTemplateValues>();
        }

        if (scopedSubs.length === 0) {
          if (hasExplicitAudience) {
            await this.prisma.notificationPush.updateMany({
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
        const expo = new Expo(
          expoAccessToken ? { accessToken: expoAccessToken } : undefined,
        );
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
              (err: unknown, retryAttempt: number) => {
                serverLogger.error(
                  `Error sending push notification chunk (attempt ${retryAttempt + 1}): ${err instanceof Error ? err.message : String(err)}`,
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

        const resultByUser = new Map<
          string,
          { hasSuccess: boolean; hasFailure: boolean }
        >();

        interface TicketResult {
          userId: string;
          statusCode: number;
        }

        tickets
          .map((t: ExpoPushTicket, idx: number) => {
            const token = messages[idx]?.to;
            if (!token || typeof token !== "string") return null;
            const userId = userByToken.get(token);
            if (!userId) return null;
            const statusCode = t.status === "ok" ? 200 : 500;
            return { userId, statusCode };
          })
          .filter((r): r is TicketResult => r !== null)
          .forEach((r: TicketResult) => {
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

        interface UserStatus {
          hasSuccess: boolean;
          hasFailure: boolean;
        }

        const sentUserIds = Array.from(resultByUser.entries())
          .filter(([, status]: [string, UserStatus]) => status.hasSuccess)
          .map(([userId]: [string, UserStatus]) => userId);
        const failedUserIds = Array.from(resultByUser.entries())
          .filter(
            ([, status]: [string, UserStatus]) =>
              !status.hasSuccess && status.hasFailure,
          )
          .map(([userId]: [string, UserStatus]) => userId);

        if (hasExplicitAudience) {
          const attemptedUserIds = new Set<string>(resultByUser.keys());
          const unattemptedUserIds = Array.from(explicitAudienceUserIds).filter(
            (userId: string) => !attemptedUserIds.has(userId),
          );

          if (sentUserIds.length > 0) {
            await Promise.all(
              sentUserIds.map((userId: string) =>
                this.prisma.notificationPush.update({
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
              allFailedUserIds.map((userId: string) =>
                this.prisma.notificationPush.update({
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
          await this.prisma.notificationPush.createMany({
            data: [
              ...sentUserIds.map((targetUserId: string) => ({
                notificationId: notification.id,
                targetUserId,
                status: "sent" as const,
                sentAt: new Date(),
                failureReason: null,
              })),
              ...failedUserIds.map((targetUserId: string) => ({
                notificationId: notification.id,
                targetUserId,
                status: "failed" as const,
                sentAt: new Date(),
                failureReason: "expo",
              })),
            ],
            skipDuplicates: true,
          });
        }

        const failedCount = hasExplicitAudience
          ? Array.from(explicitAudienceUserIds).filter((userId: string) => {
              const status = resultByUser.get(userId);
              if (!status) return true;
              return !status.hasSuccess;
            }).length
          : failedUserIds.length;

        const sentCount = hasExplicitAudience
          ? Array.from(explicitAudienceUserIds).filter((userId: string) => {
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
      },
      catch: (error) =>
        new ServiceError({
          operation: "sendMobileNotifications",
          message: `Failed to send mobile notifications for notification ${notificationId}: ${String(error)}`,
          cause: error,
        }),
    });
  }
}
