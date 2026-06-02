import { useState, useCallback } from "react";
import { View, FlatList, ActivityIndicator, Text } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, useRouter } from "expo-router";
import { colors, spacing } from "~/styles";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAdminUsers } from "~/hooks/admin/useAdminUsers";
import { AdminHeader } from "~/components/admin/AdminHeader";
import { AdminSearchBar } from "~/components/admin/AdminSearchBar";
import { UserCard } from "~/components/admin/users/UserCard";
import { AdminAddFab } from "~/components/admin/common/AdminAddFab";
import type { User, UserSearchField } from "~/hooks/admin/useAdminUsers";

export default function AdminUsersScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Get tripId from router params
  const { tripId } = useLocalSearchParams<{ tripId?: string }>();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedField, setSelectedField] = useState<UserSearchField>("firstName");

  const {
    users,
    usersLoading,
    usersRefetching,
    usersHasNextPage,
    usersFetchingNextPage,
    fetchMoreUsers,
    refetchUsers,
  } = useAdminUsers(tripId ?? "", searchTerm, selectedField);

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
      <View style={[{ flex: 1, backgroundColor: colors.backgroundDark, paddingTop: spacing.xl }]}>
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

      <AdminHeader title="User Management" subtitle="Manage accounts and permissions" />

      <AdminSearchBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedField={selectedField}
        onFieldChange={setSelectedField}
        fields={fieldOptions}
      />

      {usersLoading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={users}
          renderItem={renderUser}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xl }}
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
            <View style={{ alignItems: "center", paddingVertical: spacing.xxl }}>
              <Text style={{ fontSize: 16, color: colors.textSecondary, marginTop: spacing.md }}>
                No users found
              </Text>
            </View>
          }
          ListFooterComponent={
            usersFetchingNextPage ? (
              <View style={{ alignItems: "center", paddingVertical: spacing.md }}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: spacing.xs }}>
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
