import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AdminHeader } from "~/components/admin/AdminHeader";
import { AdminSearchBar } from "~/components/admin/AdminSearchBar";
import { AdminAddFab } from "~/components/admin/common/AdminAddFab";
import { UserCard } from "~/components/admin/users/UserCard";
import { Skeleton } from "~/components/ui/Skeleton";
import { useAdminUsers } from "~/hooks/admin/useAdminUsers";
import type { User, UserSearchField } from "~/hooks/admin/useAdminUsers";
import { spacing } from "~/styles";
import { useTripTheme } from "~/theme/TripThemeProvider";

export default function AdminUsersScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { palette } = useTripTheme();

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
      <View style={[{ flex: 1, backgroundColor: palette.backgroundDark, paddingTop: spacing.xl }]}>
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
          backgroundColor: palette.backgroundDark,
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
        <View
          style={{
            flex: 1,
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.md,
            gap: spacing.sm,
          }}
        >
          <Skeleton.Group testID="users-loading-skeleton">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton
                // biome-ignore lint/suspicious/noArrayIndexKey: deterministic placeholder rows
                key={`user-skeleton-${index}`}
                variant="box"
                width="100%"
                height={72}
              />
            ))}
          </Skeleton.Group>
        </View>
      ) : (
        <FlatList
          data={users}
          renderItem={renderUser}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: 96 }}
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
              <Text style={{ fontSize: 16, color: palette.textSecondary, marginTop: spacing.md }}>
                No users found
              </Text>
            </View>
          }
          ListFooterComponent={
            usersFetchingNextPage ? (
              <View style={{ alignItems: "center", paddingVertical: spacing.md }}>
                <ActivityIndicator size="small" color={palette.primary} />
                <Text style={{ fontSize: 12, color: palette.textSecondary, marginTop: spacing.xs }}>
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
