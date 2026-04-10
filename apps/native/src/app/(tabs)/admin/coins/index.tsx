import { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  FlatList,
  TextInput,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { GraphQLClient } from "graphql-request";
import * as SecureStore from "expo-secure-store";
import { useQuery } from "@tanstack/react-query";
import { colors, spacing, borderRadius, typography } from "~/styles";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AdminHeader } from "~/components/admin/AdminHeader";
import { GroupCard } from "~/components/admin/groups/GroupCard";
import {
  useGetGroupsByTripQuery,
  useGetCoinQuickStatsQuery,
  GetGroupsByTripQuery,
} from "@mirai-app/graphql-types";

// GraphQL Client setup with SecureStore
const createGraphQLClient = async (): Promise<GraphQLClient> => {
  const token = await SecureStore.getItemAsync("sb-access-token");
  return new GraphQLClient(
    process.env.EXPO_PUBLIC_GRAPHQL_URL || "http://localhost:4000/graphql",
    {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    },
  );
};

// Wrapper hook to get client
const useGraphQLClient = () => {
  const [client, setClient] = useState<GraphQLClient | null>(null);

  useMemo(() => {
    createGraphQLClient().then(setClient);
  }, []);

  return client;
};

// Group type matching the expected structure
interface Group {
  id: string;
  name: string;
  coins: number;
  organizer?: {
    firstName?: string | null;
    lastName?: string | null;
  } | null;
}

// Custom hook for admin coins - combines groups and stats
export const useAdminCoins = (tripId: string) => {
  const client = useGraphQLClient();

  // Query for groups by trip
  const {
    data: groupsData,
    isLoading: groupsLoading,
    error: groupsError,
  } = useQuery({
    queryKey: ["GetGroupsByTrip", { tripId }],
    enabled: Boolean(tripId) && Boolean(client),
    queryFn: async () => {
      if (!client) throw new Error("GraphQL client not initialized");
      return useGetGroupsByTripQuery.fetcher(client, { tripId })();
    },
  });

  // Query for coin quick stats
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ["GetCoinQuickStats", { tripId }],
    enabled: Boolean(tripId) && Boolean(client),
    queryFn: async () => {
      if (!client) throw new Error("GraphQL client not initialized");
      return useGetCoinQuickStatsQuery.fetcher(client, { tripId })();
    },
  });

  // Transform groups data
  const groups = useMemo(() => {
    const data = groupsData as GetGroupsByTripQuery | undefined;
    return (data?.groupsByTrip?.groups ?? []).map(
      (group): Group => ({
        id: group.id,
        name: group.name,
        coins: group.coins ?? 0,
        // Note: organizer info not available in GroupFields, would need separate query
        organizer: null,
      }),
    );
  }, [groupsData]);

  // Stats from quick stats query
  const stats = useMemo(
    () => ({
      totalCoins: statsData?.coinQuickStats?.totalCoins ?? 0,
      totalGroups: statsData?.coinQuickStats?.totalGroups ?? groups.length,
      avgCoinsPerGroup:
        statsData?.coinQuickStats?.averageCoinsPerGroup ??
        (groups.length > 0
          ? Math.round(
              groups.reduce((sum, g) => sum + g.coins, 0) / groups.length,
            )
          : 0),
    }),
    [statsData, groups],
  );

  return {
    groups,
    groupsLoading: groupsLoading || !client,
    groupsError,
    stats,
  };
};

export default function AdminCoinsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Get tripId from router params
  const { tripId } = useLocalSearchParams<{ tripId?: string }>();

  const [searchTerm, setSearchTerm] = useState("");

  const { groups, groupsLoading } = useAdminCoins(tripId ?? "");

  const filteredGroups = useMemo(() => {
    return (
      groups?.filter((group) => {
        const organizerName = [
          group.organizer?.firstName,
          group.organizer?.lastName,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return (
          group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          organizerName.includes(searchTerm.toLowerCase())
        );
      }) || []
    );
  }, [groups, searchTerm]);

  const stats = useMemo(() => {
    const totalCoins =
      groups?.reduce((sum, group) => sum + group.coins, 0) || 0;
    const totalGroups = groups?.length || 0;
    const avgCoinsPerGroup =
      totalGroups > 0 ? Math.round(totalCoins / totalGroups) : 0;

    return {
      totalCoins,
      totalGroups,
      avgCoinsPerGroup,
    };
  }, [groups]);

  const navigateToAddCoins = useCallback(
    (group: Group) => {
      if (!tripId) return;
      router.push({
        pathname: "/admin/coins/add",
        params: {
          tripId,
          groupId: group.id,
          groupName: group.name,
          groupCoins: String(group.coins),
        },
      });
    },
    [router, tripId],
  );

  const navigateToRemoveCoins = useCallback(
    (group: Group) => {
      if (!tripId) return;
      router.push({
        pathname: "/admin/coins/remove",
        params: {
          tripId,
          groupId: group.id,
          groupName: group.name,
          groupCoins: String(group.coins),
        },
      });
    },
    [router, tripId],
  );

  const renderGroup = useCallback(
    ({ item }: { item: Group }) => {
      return (
        <GroupCard
          group={item}
          onAddCoins={navigateToAddCoins}
          onRemoveCoins={navigateToRemoveCoins}
        />
      );
    },
    [navigateToAddCoins, navigateToRemoveCoins],
  );

  if (!tripId) {
    return (
      <View
        style={[
          {
            flex: 1,
            backgroundColor: colors.backgroundDark,
            paddingTop: spacing.xl,
          },
        ]}
      >
        <StatusBar style="light" />
        <AdminHeader title="Error" subtitle="Trip ID is required" />
      </View>
    );
  }

  const renderStats = () => (
    <View
      style={{
        flexDirection: "row",
        paddingHorizontal: spacing.lg,
        marginBottom: spacing.lg,
        gap: spacing.md,
      }}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: colors.cardDark,
          borderRadius: borderRadius.lg,
          padding: spacing.md,
          alignItems: "center",
          borderWidth: 1,
          borderColor: colors.borderWhite5,
        }}
      >
        <Ionicons name="cash" size={24} color={colors.accentMagenta} />
        <Text
          style={{
            fontSize: typography.xl,
            fontWeight: typography.bold,
            color: colors.white,
            marginTop: spacing.xs,
            marginBottom: spacing.xs,
          }}
        >
          {stats.totalCoins}
        </Text>
        <Text
          style={{
            fontSize: typography.sm,
            color: colors.textSecondary,
            textAlign: "center",
          }}
        >
          Total Coins
        </Text>
      </View>
      <View
        style={{
          flex: 1,
          backgroundColor: colors.cardDark,
          borderRadius: borderRadius.lg,
          padding: spacing.md,
          alignItems: "center",
          borderWidth: 1,
          borderColor: colors.borderWhite5,
        }}
      >
        <Ionicons name="people-circle" size={24} color={colors.primary} />
        <Text
          style={{
            fontSize: typography.xl,
            fontWeight: typography.bold,
            color: colors.white,
            marginTop: spacing.xs,
            marginBottom: spacing.xs,
          }}
        >
          {stats.totalGroups}
        </Text>
        <Text
          style={{
            fontSize: typography.sm,
            color: colors.textSecondary,
            textAlign: "center",
          }}
        >
          Total Groups
        </Text>
      </View>
      <View
        style={{
          flex: 1,
          backgroundColor: colors.cardDark,
          borderRadius: borderRadius.lg,
          padding: spacing.md,
          alignItems: "center",
          borderWidth: 1,
          borderColor: colors.borderWhite5,
        }}
      >
        <Ionicons name="calculator" size={24} color={colors.warning} />
        <Text
          style={{
            fontSize: typography.xl,
            fontWeight: typography.bold,
            color: colors.white,
            marginTop: spacing.xs,
            marginBottom: spacing.xs,
          }}
        >
          {stats.avgCoinsPerGroup}
        </Text>
        <Text
          style={{
            fontSize: typography.sm,
            color: colors.textSecondary,
            textAlign: "center",
          }}
        >
          Avg Coins/Group
        </Text>
      </View>
    </View>
  );

  const renderSearchBar = () => (
    <View
      style={{
        paddingHorizontal: spacing.lg,
        marginBottom: spacing.lg,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: colors.cardDark,
          borderRadius: borderRadius.lg,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          borderWidth: 1,
          borderColor: colors.borderDark,
        }}
      >
        <Ionicons name="search" size={20} color={colors.textSecondary} />
        <TextInput
          style={{
            flex: 1,
            marginLeft: spacing.sm,
            fontSize: typography.base,
            color: colors.white,
          }}
          placeholder="Search groups..."
          value={searchTerm}
          onChangeText={setSearchTerm}
          placeholderTextColor={colors.textSecondary}
        />
      </View>
    </View>
  );

  return (
    <View
      style={[
        {
          flex: 1,
          backgroundColor: colors.backgroundDark,
          paddingTop: spacing.xl,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      <StatusBar style="light" />

      <AdminHeader
        title="Coins Management"
        subtitle="Manage group coins and transactions"
      />

      {renderStats()}
      {renderSearchBar()}

      {groupsLoading ? (
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator size="large" color={colors.primary} />
          <Text
            style={{
              marginTop: spacing.md,
              fontSize: typography.base,
              color: colors.textSecondary,
            }}
          >
            Loading groups...
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredGroups}
          renderItem={renderGroup}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            paddingHorizontal: spacing.lg,
            paddingBottom: spacing.xl,
          }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View
              style={{ alignItems: "center", paddingVertical: spacing.xxl }}
            >
              <Ionicons name="cash" size={48} color={colors.textSecondary} />
              <Text
                style={{
                  marginTop: spacing.md,
                  fontSize: typography.base,
                  color: colors.textSecondary,
                  textAlign: "center",
                }}
              >
                {searchTerm ? "No groups found" : "No groups available"}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}
