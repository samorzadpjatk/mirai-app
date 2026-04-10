import React, { useState, useCallback, useMemo } from "react";
import { View, FlatList, ActivityIndicator, Text } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "urql";
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

// Custom hook for admin users
const useAdminUsers = (tripId: string) => {
  const [{ data, fetching: usersLoading, error }, refetchUsers] = useQuery({
    query: useGetUsersQuery.document,
    variables: { limit: 100, offset: 0 },
    pause: !tripId,
  });

  const usersData = data as GetUsersQuery | undefined;

  const usersRaw = useMemo(() => {
    return (usersData?.users ?? []) as User[];
  }, [usersData]);

  return {
    usersRaw,
    usersLoading,
    usersRefetching: usersLoading,
    refetchUsers,
    error,
  };
};

export default function AdminUsersScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Get tripId from router params
  const { tripId } = useLocalSearchParams<{ tripId?: string }>();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedField, setSelectedField] =
    useState<UserSearchField>("firstName");

  // Use the custom hook for all user operations
  const { usersRaw, usersLoading, usersRefetching, refetchUsers } =
    useAdminUsers(tripId ?? "");

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

      {usersLoading ? (
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
            void refetchUsers({ requestPolicy: "network-only" });
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

/*
## Summary of Migration from TanStack Query to urql

### Changes Made:

1. **Removed manual GraphQL client setup:**
   - Removed: `graphql-request` GraphQLClient creation
   - Removed: SecureStore token handling and client state management
   - Removed: `createGraphQLClient` function and `client` state
   - Rationale: urql client is provided via context by the app's root provider

2. **Updated imports:**
   - Removed: `import { GraphQLClient } from "graphql-request"`
   - Removed: `import * as SecureStore from "expo-secure-store"`
   - Removed: `import { useQuery } from "@tanstack/react-query"`
   - Added: `import { useQuery } from "urql"`

3. **Extracted query logic into custom hook:**
   - Created: `useAdminUsers(tripId: string)` custom hook
   - Moved query logic from inline `useQuery` to the custom hook
   - Follows pattern established in other admin screens (groups, challenges, etc.)

4. **Updated query pattern:**
   - Changed from TanStack Query's object-based options to urql's tuple return
   - From: `const { data, isLoading, isFetching, refetch } = useQuery({ queryKey, queryFn, enabled })`
   - To: `const [{ data, fetching }, refetch] = useQuery({ query, variables, pause })`

5. **Updated loading states:**
   - Changed: `isLoading` → `fetching` (urql's loading state property)
   - Changed: `isFetching` → `fetching` (urql uses single property for both)
   - Updated conditional check from `usersLoading || !client` to just `usersLoading`

6. **Updated refetch behavior:**
   - Changed: `refetchUsers()` → `refetchUsers({ requestPolicy: "network-only" })`
   - urql requires explicit request policy for network-only refetch

### Key Differences from TanStack Query:

| TanStack Query | urql |
|----------------|------|
| `useQuery({ queryKey, queryFn, enabled })` | `useQuery({ query, variables, pause })` |
| Returns object: `{ data, isLoading, isFetching, refetch }` | Returns tuple: `[{ data, fetching }, refetch]` |
| `isLoading` / `isFetching` separate | Single `fetching` property |
| `enabled` boolean | `pause` boolean (inverted logic) |
| `refetch()` | `refetch({ requestPolicy: "network-only" })` |
| Manual client management | Client from React context |

### Files Referenced for Pattern:
- `apps/native/src/app/(tabs)/admin/groups/index.tsx` - Similar custom hook pattern
- `apps/native/src/app/(tabs)/admin/challenges/index.tsx` - urql migration example
- `apps/native/src/app/(tabs)/admin/rewards/index.tsx` - urql migration example
*/
