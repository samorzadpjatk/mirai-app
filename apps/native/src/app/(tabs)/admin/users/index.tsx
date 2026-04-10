import React, { useState, useCallback, useMemo } from "react";
import { View, FlatList, ActivityIndicator, Text } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GraphQLClient } from "graphql-request";
import * as SecureStore from "expo-secure-store";
import { useQuery } from "@tanstack/react-query";
import { colors, spacing } from "~/styles";
import {
  useGetUsersQuery,
  type GetUsersQuery,
  type User,
} from "@mirai-app/graphql-types";
import { AdminHeader } from "~/components/admin/AdminHeader";
import { AdminSearchBar } from "~/components/admin/AdminSearchBar";
import { UserCard } from "~/components/admin/users/UserCard";
import { AdminAddFab } from "~/components/admin/common/AdminAddFab";

type UserSearchField =
  | "firstName"
  | "lastName"
  | "email"
  | "wristNumber"
  | "houseNumber"
  | "groupName";

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

export default function AdminUsersScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Get tripId from router params
  const { tripId } = useLocalSearchParams<{ tripId?: string }>();

  const [client, setClient] = useState<GraphQLClient | null>(null);

  useMemo(() => {
    createGraphQLClient().then(setClient);
  }, []);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedField, setSelectedField] =
    useState<UserSearchField>("firstName");

  // Query for users
  const {
    data: usersData,
    isLoading: usersLoading,
    isFetching: usersRefetching,
    refetch: refetchUsers,
  } = useQuery({
    queryKey: ["GetUsers", { limit: 100, offset: 0 }],
    enabled: Boolean(tripId) && Boolean(client),
    queryFn: async () => {
      if (!client) throw new Error("GraphQL client not initialized");
      return useGetUsersQuery.fetcher(client, { limit: 100, offset: 0 })();
    },
  });

  const usersRaw = (usersData as GetUsersQuery | undefined)?.users ?? [];

  // Filter users based on search term and field
  const users = useMemo(() => {
    if (!searchTerm.trim()) return usersRaw;

    const term = searchTerm.toLowerCase();
    return usersRaw.filter((user) => {
      switch (selectedField) {
        case "firstName":
          return user.firstName?.toLowerCase().includes(term);
        case "lastName":
          return user.lastName?.toLowerCase().includes(term);
        case "email":
          return user.email?.toLowerCase().includes(term);
        case "wristNumber":
          return user.wristband?.wristNumber?.toLowerCase().includes(term);
        case "houseNumber":
          return user.houseNumber?.toLowerCase().includes(term);
        case "groupName":
          // Group name filtering would require group data in the query
          return false;
        default:
          return false;
      }
    });
  }, [usersRaw, searchTerm, selectedField]);

  const usersHasNextPage = false; // Pagination not implemented
  const usersFetchingNextPage = false;

  const fetchMoreUsers = () => {
    // Pagination not implemented in this version
  };

  const handleEditUser = useCallback(
    (user: User) => {
      router.push({
        pathname: "/admin/users/edit/[userId]",
        params: { userId: user.id, tripId },
      });
    },
    [router, tripId],
  );

  const renderUser = useCallback(
    ({ item }: { item: User }) => {
      return <UserCard user={item} onEdit={handleEditUser} />;
    },
    [handleEditUser],
  );

  const handleCreateUser = useCallback(() => {
    router.push({
      pathname: "/admin/users/new",
      params: { tripId },
    });
  }, [router, tripId]);

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

  const fieldOptions = [
    { key: "firstName", label: "First Name" },
    { key: "lastName", label: "Last Name" },
    { key: "email", label: "Email" },
    { key: "wristNumber", label: "Wrist Number" },
    { key: "houseNumber", label: "House Number" },
    { key: "groupName", label: "Group Name" },
  ];

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
        title="User Management"
        subtitle="Manage accounts and permissions"
      />

      <AdminSearchBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedField={selectedField}
        onFieldChange={setSelectedField}
        fields={fieldOptions}
      />

      {usersLoading || !client ? (
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={users}
          renderItem={renderUser}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            paddingHorizontal: spacing.lg,
            paddingBottom: spacing.xl,
          }}
          showsVerticalScrollIndicator={false}
          onEndReached={() => {
            if (usersHasNextPage && !usersFetchingNextPage && !usersLoading) {
              void fetchMoreUsers();
            }
          }}
          onEndReachedThreshold={0.35}
          refreshing={usersRefetching && !usersFetchingNextPage}
          onRefresh={() => {
            void refetchUsers();
          }}
          ListEmptyComponent={
            <View
              style={{ alignItems: "center", paddingVertical: spacing.xxl }}
            >
              <Text
                style={{
                  fontSize: 16,
                  color: colors.textSecondary,
                  marginTop: spacing.md,
                }}
              >
                No users found
              </Text>
            </View>
          }
          ListFooterComponent={
            usersFetchingNextPage ? (
              <View
                style={{ alignItems: "center", paddingVertical: spacing.md }}
              >
                <ActivityIndicator size="small" color={colors.primary} />
                <Text
                  style={{
                    fontSize: 12,
                    color: colors.textSecondary,
                    marginTop: spacing.xs,
                  }}
                >
                  Loading more users...
                </Text>
              </View>
            ) : null
          }
        />
      )}

      <AdminAddFab onPress={handleCreateUser} accessibilityLabel="Add user" />
    </View>
  );
}
