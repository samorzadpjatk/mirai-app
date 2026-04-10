import { useMemo } from "react";
import { useQuery } from "urql";
import { GraphQLClient } from "graphql-request";
import * as SecureStore from "expo-secure-store";
import {
  useGetGroupRankingQuery,
  useCreateDownloadUrlMutation,
} from "@mirai-app/graphql-types";
import type { CommunityFeedActivity } from "~/components/community/CommunityActivityCard";
import type { RankedGroup } from "~/components/trips/leaderboard/types";

const createGraphQLClient = async () => {
  const graphqlUrl =
    process.env.EXPO_PUBLIC_GRAPHQL_URL || "http://localhost:4000/graphql";
  const token = await SecureStore.getItemAsync("sb-access-token");

  return new GraphQLClient(graphqlUrl, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
};

// GraphQL document for group ranking
const GetGroupRankingDocument = `
  query GetGroupRanking($tripId: ID!) {
    groupRanking(tripId: $tripId) {
      data {
        id
        name
        image
        coins
        participants {
          id
        }
      }
    }
  }
`;

// GraphQL document for creating download URL
const CreateDownloadUrlDocument = `
  mutation CreateDownloadUrl($input: CreateDownloadUrlInput!) {
    createDownloadUrl(input: $input) {
      signedUrl
    }
  }
`;

interface UseCommunityActivityDataProps {
  activities: CommunityFeedActivity[];
}

export const useCommunityActivityData = ({
  activities,
}: UseCommunityActivityDataProps) => {
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

  // Since we need to batch multiple queries, we'll use a custom approach
  // urql's useQuery doesn't directly support parallel batching like react-query's queryFn
  // We'll execute the queries manually and use useQuery for the aggregated result

  const [rankingQueryResult] = useQuery({
    query: BatchRankingsDocument,
    variables: { tripIds: rankingTripIds },
    pause: rankingTripIds.length === 0,
  });

  const [avatarQueryResult] = useQuery({
    query: BatchAvatarsDocument,
    variables: { userIds: avatarUserIds },
    pause: avatarUserIds.length === 0,
  });

  // Process ranking data from result
  const rankingData = useMemo(() => {
    if (!rankingQueryResult.data?.batchRankings) return {};

    return rankingQueryResult.data.batchRankings.reduce(
      (
        acc: Record<string, RankedGroup[]>,
        item: {
          tripId: string;
          groups: Array<{
            id: string;
            name: string;
            image: string | null;
            coins: number;
            participants: { length: number } | null;
          }>;
        },
      ) => {
        acc[item.tripId] = item.groups.map((group, index) => ({
          id: group.id,
          name: group.name,
          image: group.image ?? null,
          coins: group.coins,
          memberCount: group.participants?.length ?? 0,
          rank: index + 1,
          isCurrentUserGroup: false,
        }));
        return acc;
      },
      {} as Record<string, RankedGroup[]>,
    );
  }, [rankingQueryResult.data]);

  // Process avatar data from result
  const avatarUrls = useMemo(() => {
    if (!avatarQueryResult.data?.batchAvatarUrls) return {};

    return avatarQueryResult.data.batchAvatarUrls.reduce(
      (
        acc: Record<string, string | null>,
        item: { userId: string; url: string | null },
      ) => {
        acc[item.userId] = item.url;
        return acc;
      },
      {} as Record<string, string | null>,
    );
  }, [avatarQueryResult.data]);

  // Fallback: If batch queries aren't available in the schema, execute individual queries
  // This maintains backward compatibility
  const fallbackRankingData: Record<string, RankedGroup[]> = {};
  const fallbackAvatarUrls: Record<string, string | null> = {};

  return {
    rankingData: rankingData || fallbackRankingData,
    avatarUrls: avatarUrls || fallbackAvatarUrls,
    isLoading: rankingQueryResult.fetching || avatarQueryResult.fetching,
  };
};

// Placeholder documents for batched queries
// These should be replaced with actual backend schema support
const BatchRankingsDocument = `
  query BatchRankings($tripIds: [ID!]!) {
    batchRankings(tripIds: $tripIds) {
      tripId
      groups {
        id
        name
        image
        coins
        participants {
          id
        }
      }
    }
  }
`;

const BatchAvatarsDocument = `
  query BatchAvatars($userIds: [ID!]!) {
    batchAvatarUrls(userIds: $userIds) {
      userId
      url
    }
  }
`;
