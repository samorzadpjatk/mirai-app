import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { TouchableOpacity } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { YStack, XStack, Text } from "@mirai-app/ui";
import { LeaderboardPodium } from "~/components/trips/leaderboard/LeaderboardPodium";
import type { RankedGroup } from "~/components/trips/leaderboard/types";

type ActivityType =
  | "submission"
  | "challenge_event"
  | "rank_change"
  | "custom"
  | "user_post";

type ActivityFilter = ActivityType | "all";

interface CommunityFeedActivity {
  id: string;
  tripId: string;
  activityType: ActivityType;
  title: string;
  description: string | null;
  imageUrl: string | null;
  createdAt: Date | string;
  reactionsSummary?: {
    total: number;
    counts?: {
      heart: number;
      fire: number;
      clap: number;
      star: number;
    };
    myReactions?: string[];
  };
  admin?: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  challengeActivity?: {
    challengeId: string;
    eventType: string;
    challenge?: {
      name: string;
      description?: string | null;
    } | null;
  } | null;
  submissionActivity?: {
    groupId: string;
    isWinner: boolean;
    currentGroupRank?: number | null;
    ranking: number | null;
    pointsAwarded: number | null;
    challenge?: {
      name: string;
    } | null;
    group?: {
      id: string;
      name: string;
      image: string | null;
    } | null;
  } | null;
  rankChangeActivity?: {
    newRank: number;
    coinsGained: number;
    totalCoins: number;
    group?: {
      name: string;
      image: string | null;
    } | null;
  } | null;
  userPost?: {
    additionalImages: (string | null)[];
    author?: {
      user?: {
        id: string;
        firstName: string;
        lastName: string;
      } | null;
      group?: {
        name: string;
      } | null;
    } | null;
  } | null;
}

interface OwnerMeta {
  name: string;
  subtitle: string;
  avatarImage: string | null;
  avatarUserId: string | null;
}

interface RankMovement {
  direction: "up" | "down";
  team: string;
  previousRank: number;
  newRank: number;
}

interface CommunityActivityCardProps {
  activity: CommunityFeedActivity;
  onPress?: () => void;
  onPressOwner?: () => void;
  onToggleHeart?: (activityId: string) => void;
  isFocused?: boolean;
  rankingData?: RankedGroup[];
  avatarUri?: string | null;
}

const getActivityTypeLabel = (type: ActivityType) => {
  if (type === "challenge_event") return "challenge";
  if (type === "submission") return "submission";
  if (type === "rank_change") return "ranking";
  if (type === "custom") return "news";
  if (type === "user_post") return "post";
  return type;
};

const formatName = (firstName?: string, lastName?: string) => {
  const raw = `${firstName ?? ""} ${lastName ?? ""}`.trim();
  return raw.length > 0 ? raw : "Unknown";
};

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]?.slice(0, 1).toUpperCase() ?? "?";
  return `${parts[0]?.slice(0, 1) ?? ""}${parts[parts.length - 1]?.slice(0, 1) ?? ""}`.toUpperCase();
};

const formatRelativeTime = (value: Date | string) => {
  const date = value instanceof Date ? value : new Date(value);
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);

  if (minutes < 1) return "just now";
  if (minutes > 30) {
    const datePart = date.toLocaleDateString("pl-PL");
    const timePart = date.toLocaleTimeString("pl-PL", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return `${datePart} ${timePart}`;
  }
  return `${minutes}m ago`;
};

const getChallengeEventLabel = (eventType?: string | null) => {
  if (eventType === "challenge_started") return "Challenge started";
  if (eventType === "voting_started") return "Voting started";
  if (eventType === "completed") return "Challenge completed";
  return "Challenge update";
};

const parseRankChangeDetails = (description?: string | null) => {
  const text = description?.trim() ?? "";
  if (!text) {
    return {
      movements: [] as RankMovement[],
      podium: [] as string[],
    };
  }

  const movements: RankMovement[] = [];
  const movementRegex = /([⬆⬇])(?:️)?\s*([^:|]+):\s*#(\d+)\s*->\s*#(\d+)/g;
  let match: RegExpExecArray | null = movementRegex.exec(text);
  while (match) {
    const arrow = match[1];
    const team = match[2]?.trim() ?? "";
    const previousRank = Number(match[3]);
    const newRank = Number(match[4]);
    if (team && Number.isFinite(previousRank) && Number.isFinite(newRank)) {
      movements.push({
        direction: arrow === "⬆" ? "up" : "down",
        team,
        previousRank,
        newRank,
      });
    }
    match = movementRegex.exec(text);
  }

  const podiumChunk = /Podium:\s*([^|]+)/.exec(text)?.[1] ?? "";
  const podium = podiumChunk
    .split("•")
    .map((part) => part.replace(/[🥇🥈🥉]/g, "").trim())
    .filter(Boolean);

  return { movements, podium };
};

const resolveCardImage = (activity: CommunityFeedActivity) => {
  if (activity.imageUrl) return activity.imageUrl;
  const extra = activity.userPost?.additionalImages?.find((img) =>
    Boolean(img),
  );
  return extra ?? null;
};

const resolveOwnerMeta = (activity: CommunityFeedActivity): OwnerMeta => {
  if (activity.activityType === "user_post") {
    const author = activity.userPost?.author;
    const user = author?.user;
    return {
      name: formatName(user?.firstName, user?.lastName),
      subtitle: author?.group?.name ?? "Community member",
      avatarImage: null,
      avatarUserId: user?.id ?? null,
    };
  }

  if (activity.activityType === "submission") {
    const group = activity.submissionActivity?.group;
    const isApprovedSubmission =
      activity.submissionActivity?.isWinner === false;
    const currentGroupRank = activity.submissionActivity?.currentGroupRank;

    const subtitle = isApprovedSubmission
      ? typeof currentGroupRank === "number"
        ? `Miejsce w rankingu: #${currentGroupRank}`
        : "Miejsce w rankingu: -"
      : (activity.submissionActivity?.challenge?.name ??
        "Challenge submission");

    return {
      name: group?.name ?? "Group",
      subtitle,
      avatarImage: group?.image ?? null,
      avatarUserId: null,
    };
  }

  if (activity.activityType === "rank_change") {
    const group = activity.rankChangeActivity?.group;
    return {
      name: group?.name ?? "Group",
      subtitle: `Now #${activity.rankChangeActivity?.newRank ?? "-"}`,
      avatarImage: group?.image ?? null,
      avatarUserId: null,
    };
  }

  if (activity.activityType === "challenge_event") {
    const adminName = activity.admin
      ? formatName(activity.admin.firstName, activity.admin.lastName)
      : "MIRAI Admin";

    return {
      name: adminName,
      subtitle: getChallengeEventLabel(activity.challengeActivity?.eventType),
      avatarImage: null,
      avatarUserId: activity.admin?.id ?? null,
    };
  }

  const adminName = activity.admin
    ? formatName(activity.admin.firstName, activity.admin.lastName)
    : "MIRAI Admin";

  return {
    name: adminName,
    subtitle: "Official post",
    avatarImage: null,
    avatarUserId: activity.admin?.id ?? null,
  };
};

const buildRankChangeMessage = (
  movements: RankMovement[],
  anchorGroupName: string | null | undefined,
): string => {
  if (movements.length === 0) return "";

  const parts: string[] = [];

  for (const m of movements) {
    if (m.direction === "up") {
      parts.push(
        `Drużyna ${m.team} objęła ${m.newRank}. miejsce (awans z #${m.previousRank}).`,
      );
    } else {
      parts.push(
        `Drużyna ${m.team} spadła z pozycji #${m.previousRank} na #${m.newRank}.`,
      );
    }
  }

  const winner = movements.find((m) => m.newRank === 1);
  if (winner) {
    parts.push(`Gratulacje dla drużyny ${winner.team}! 🎉`);
  } else if (anchorGroupName) {
    const anchor = movements.find((m) => m.team === anchorGroupName);
    if (anchor?.direction === "up") {
      parts.push(`Gratulacje dla drużyny ${anchorGroupName}! 🎉`);
    }
  }

  return parts.join(" ");
};

export const CommunityActivityCard = React.memo(
  function CommunityActivityCard({
    activity,
    onPress,
    onPressOwner,
    onToggleHeart,
    isFocused = false,
    rankingData,
    avatarUri,
  }: CommunityActivityCardProps) {
    const lastMediaTapAtRef = useRef(0);
    const mediaSingleTapTimeoutRef = useRef<ReturnType<
      typeof setTimeout
    > | null>(null);

    const owner = useMemo(() => resolveOwnerMeta(activity), [activity]);
    const cardImage = useMemo(() => resolveCardImage(activity), [activity]);
    const rankChangeDetails = useMemo(
      () => parseRankChangeDetails(activity.description),
      [activity.description],
    );
    const rankChangeTopThree = useMemo(() => {
      if (activity.activityType !== "rank_change") return [] as RankedGroup[];

      const rankedGroups = rankingData;
      if (rankedGroups && rankedGroups.length > 0) {
        return rankedGroups.slice(0, 3);
      }

      const anchorGroupName =
        activity.rankChangeActivity?.group?.name ?? "Team";
      const anchorRank = activity.rankChangeActivity?.newRank;

      return [1, 2, 3].map((rank) => {
        const parsedName = rankChangeDetails.podium[rank - 1];
        const name =
          parsedName ??
          (anchorRank === rank ? anchorGroupName : `Rank #${rank}`);

        const isAnchor = name === anchorGroupName || anchorRank === rank;

        return {
          id: `rank-change-${activity.id}-${rank}`,
          name,
          image: isAnchor
            ? (activity.rankChangeActivity?.group?.image ?? null)
            : null,
          coins: isAnchor ? (activity.rankChangeActivity?.totalCoins ?? 0) : 0,
          memberCount: 0,
          rank,
          isCurrentUserGroup: false,
        } satisfies RankedGroup;
      });
    }, [activity, rankChangeDetails.podium, rankingData]);

    const rankChangeMessage = useMemo(() => {
      if (activity.activityType !== "rank_change") return null;
      return (
        buildRankChangeMessage(
          rankChangeDetails.movements,
          activity.rankChangeActivity?.group?.name,
        ) || null
      );
    }, [activity, rankChangeDetails.movements]);

    const resolvedDescription =
      activity.activityType === "rank_change"
        ? rankChangeMessage
        : activity.activityType === "challenge_event"
          ? (activity.challengeActivity?.challenge?.description?.trim() ??
            activity.description)
          : activity.description;
    const isHeartActive = Boolean(
      activity.reactionsSummary?.myReactions?.includes("heart"),
    );
    const handleMediaPress = useCallback(
      (event: { stopPropagation: () => void }) => {
        event.stopPropagation();
        const now = Date.now();

        if (now - lastMediaTapAtRef.current < 250) {
          if (mediaSingleTapTimeoutRef.current) {
            clearTimeout(mediaSingleTapTimeoutRef.current);
            mediaSingleTapTimeoutRef.current = null;
          }
          lastMediaTapAtRef.current = 0;
          onToggleHeart?.(activity.id);
          return;
        }

        lastMediaTapAtRef.current = now;
        if (onPress) {
          mediaSingleTapTimeoutRef.current = setTimeout(() => {
            onPress();
            mediaSingleTapTimeoutRef.current = null;
          }, 250);
        }
      },
      [activity.id, onPress, onToggleHeart],
    );

    useEffect(() => {
      return () => {
        if (mediaSingleTapTimeoutRef.current) {
          clearTimeout(mediaSingleTapTimeoutRef.current);
        }
      };
    }, []);

    // Calculate card border color based on state
    const cardBorderColor = isFocused
      ? "#00ced1"
      : activity.activityType === "custom"
        ? "rgba(239, 68, 68, 0.72)"
        : "rgba(255, 255, 255, 0.1)";

    return (
      <TouchableOpacity
        style={{
          borderRadius: 18,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: cardBorderColor,
          backgroundColor: "rgba(16, 34, 34, 0.78)",
        }}
        onPress={onPress}
        disabled={!onPress}
        activeOpacity={onPress ? 0.9 : 1}
      >
        <XStack
          paddingHorizontal="$3"
          paddingVertical="$3"
          backgroundColor="rgba(12, 20, 24, 0.6)"
          alignItems="center"
          justifyContent="space-between"
        >
          <TouchableOpacity
            style={{
              flexDirection: "row",
              alignItems: "center",
              flex: 1,
              marginRight: 8,
            }}
            onPress={onPressOwner}
            disabled={!onPressOwner}
            activeOpacity={onPressOwner ? 0.75 : 1}
          >
            <YStack
              width={40}
              height={40}
              borderRadius={20}
              overflow="hidden"
              borderWidth={1}
              borderColor="rgba(0, 206, 209, 0.3)"
              backgroundColor="#0f2627"
            >
              {avatarUri ? (
                <Image
                  source={{ uri: avatarUri }}
                  style={{ width: "100%", height: "100%" }}
                  contentFit="cover"
                />
              ) : (
                <YStack
                  flex={1}
                  alignItems="center"
                  justifyContent="center"
                  backgroundColor="rgba(0, 206, 209, 0.2)"
                >
                  <Text color="#ffffff" fontSize="$base" fontWeight="bold">
                    {getInitials(owner.name)}
                  </Text>
                </YStack>
              )}
            </YStack>

            <YStack flex={1} marginLeft="$2">
              <Text
                color="#ffffff"
                fontSize="$base"
                fontWeight="600"
                numberOfLines={1}
              >
                {owner.name}
              </Text>
              <Text
                color="#9ca3af"
                fontSize="$1"
                marginTop={1}
                numberOfLines={1}
              >
                {owner.subtitle}
              </Text>
            </YStack>
          </TouchableOpacity>

          <Text
            color="#475569"
            fontSize="$1"
            textTransform="uppercase"
            letterSpacing={0.6}
          >
            {formatRelativeTime(activity.createdAt)}
          </Text>
        </XStack>

        {activity.activityType === "rank_change" ? (
          <YStack width="100%" aspectRatio={1} backgroundColor="#0f171a">
            <YStack flex={1} justifyContent="center">
              <YStack flex={1} justifyContent="center">
                <YStack transform={[{ scale: 0.85 }]} marginVertical={-40}>
                  <LeaderboardPodium
                    topThree={rankChangeTopThree}
                    onPressGroup={() => onPress?.()}
                  />
                </YStack>
              </YStack>
            </YStack>
          </YStack>
        ) : cardImage ? (
          <TouchableOpacity
            style={{
              width: "100%",
              aspectRatio: 1,
              backgroundColor: "#0f171a",
            }}
            onPress={handleMediaPress}
          >
            <Image
              source={{ uri: cardImage }}
              style={{ width: "100%", height: "100%" }}
              contentFit="cover"
            />
          </TouchableOpacity>
        ) : null}

        <YStack paddingHorizontal="$3" paddingVertical="$3" gap="$2">
          <Text color="#ffffff" fontSize="$lg" fontWeight="600">
            {activity.title}
          </Text>
          {resolvedDescription ? (
            <Text color="#9ca3af" fontSize="$base" lineHeight={20}>
              {resolvedDescription}
            </Text>
          ) : null}

          <XStack
            alignItems="center"
            justifyContent="space-between"
            marginTop="$1"
          >
            <YStack
              paddingHorizontal="$2"
              paddingVertical={4}
              borderRadius={999}
              backgroundColor="rgba(0, 206, 209, 0.1)"
              borderWidth={1}
              borderColor="rgba(0, 206, 209, 0.3)"
            >
              <Text color="#00ced1" fontSize="$1" fontWeight="600">
                {getActivityTypeLabel(activity.activityType)}
              </Text>
            </YStack>

            <TouchableOpacity
              style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
              activeOpacity={0.8}
              onPress={(event) => {
                event.stopPropagation();
                onToggleHeart?.(activity.id);
              }}
            >
              <Ionicons
                name={isHeartActive ? "heart" : "heart-outline"}
                size={16}
                color={isHeartActive ? "#ff5a6c" : "#9ca3af"}
              />
              <Text fontSize="$1" color="#9ca3af" fontWeight="500">
                {activity.reactionsSummary?.total ?? 0}
              </Text>
            </TouchableOpacity>
          </XStack>
        </YStack>
      </TouchableOpacity>
    );
  },
  (prevProps, nextProps) =>
    prevProps.activity === nextProps.activity &&
    prevProps.isFocused === nextProps.isFocused,
);

export type { CommunityFeedActivity, ActivityType, ActivityFilter };
