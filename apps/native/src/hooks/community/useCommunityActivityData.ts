import type { Activity } from "@mirai-app/orpc";
import { orpc } from "@mirai-app/orpc/client";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import type { RankedGroup } from "~/components/trips/leaderboard/types";

interface UseCommunityActivityDataProps {
  activities: Activity[];
}

export const useCommunityActivityData = ({ activities }: UseCommunityActivityDataProps) => {
  const orpcClient = orpc;

  // Get unique trip IDs for rank change activities
  const rankingTripIds = useMemo(() => {
    const tripIds = new Set<string>();
    activities.forEach((activity) => {
      if (activity.activityType === "rank_change" && activity.tripId) {
        tripIds.add(activity.tripId);
      }
    });
    return Array.from(tripIds);
  }, [activities]);

  // Get unique avatar user IDs
  const avatarUserIds = useMemo(() => {
    const userIds = new Set<string>();
    activities.forEach((activity) => {
      if (activity.activityType === "user_post") {
        const userId = activity.userPost?.author?.user?.id;
        if (userId) userIds.add(userId);
      } else if (activity.admin?.id) {
        userIds.add(activity.admin.id);
      }
    });
    return Array.from(userIds);
  }, [activities]);

  // Batch fetch ranking data
  const rankingQueries = useQuery({
    queryKey: ["community-rankings", rankingTripIds],
    queryFn: async () => {
      if (rankingTripIds.length === 0) return {};

      const queries = rankingTripIds.map((tripId) =>
        orpcClient.group.ranking
          .call({ tripId })
          .then((data) => ({ tripId, data: data.data }))
          .catch(() => ({ tripId, data: [] })),
      );

      const results = await Promise.all(queries);
      return results.reduce(
        (acc, { tripId, data }) => {
          acc[tripId] = data.map((group, index) => ({
            id: group.id,
            name: group.name,
            image: group.image ?? null,
            coins: group.coins,
            memberCount: group.participants.length,
            rank: index + 1,
            isCurrentUserGroup: false,
          }));
          return acc;
        },
        {} as Record<string, RankedGroup[]>,
      );
    },
    enabled: rankingTripIds.length > 0,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Batch fetch avatar URLs
  const avatarQueries = useQuery({
    queryKey: ["community-avatars", avatarUserIds],
    queryFn: async () => {
      if (avatarUserIds.length === 0) return {};

      const queries = avatarUserIds.map((userId) =>
        orpcClient.storage.createDownloadUrl
          .call({
            storagePath: `avatar/${userId}.jpg`,
            expiresInSeconds: 60 * 60,
          })
          .then((data) => ({ userId, url: data.signedUrl }))
          .catch(() => ({ userId, url: null })),
      );

      const results = await Promise.all(queries);
      return results.reduce(
        (acc, { userId, url }) => {
          acc[userId] = url;
          return acc;
        },
        {} as Record<string, string | null>,
      );
    },
    enabled: avatarUserIds.length > 0,
    staleTime: 15 * 60 * 1000, // 15 minutes
  });

  return {
    rankingData: rankingQueries.data ?? {},
    avatarUrls: avatarQueries.data ?? {},
    isLoading: rankingQueries.isLoading || avatarQueries.isLoading,
  };
};
